import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ChevronDown,
  Download,
  RefreshCw,
  Upload,
  Database,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { StatCards } from './StatCards';
import { DistributionChart } from './DistributionChart';
import { ExpiryCalendar } from './ExpiryCalendar';
import { PositionTable } from './PositionTable';
import { FilterBar } from './FilterBar';
import { mockPositions, Position, getRemainingNotional, getCloseRecords, Currency, convertCurrency, formatAmount } from './mockData';

export interface FilterState {
  search: string;
  underlying: string;
  structure: string;
  status: string;
  currency: string;
  counterparty: string;
  expiryDateFrom: string;
  expiryDateTo: string;
  notionalMin: string;
  notionalMax: string;
  notionalRange: string;
  returnRateRange: string;
  returnRateMin: string;
  returnRateMax: string;
  pnlRange: string;
  tags: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  underlying: '',
  structure: '',
  status: '',
  currency: '',
  counterparty: '',
  expiryDateFrom: '',
  expiryDateTo: '',
  notionalMin: '',
  notionalMax: '',
  notionalRange: '',
  returnRateRange: '',
  returnRateMin: '',
  returnRateMax: '',
  pnlRange: '',
  tags: '',
};

function isFilterActive(f: FilterState): boolean {
  return Object.values(f).some((v) => v !== '');
}

export function applyFilters(positions: Position[], filters: FilterState): Position[] {
  return positions.filter((p) => {
    // 历史持仓不在主列表中展示
    // 亚丁过期=已平仓不展示；非亚丁过期仍展示（可手动平仓）
    if (p.status === 'closed') return false;
    if (p.status === 'expired' && p.counterparty === '亚丁') return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!p.underlying.includes(filters.search) && !p.code.toLowerCase().includes(s)) return false;
    }
    if (filters.underlying && !p.underlying.includes(filters.underlying)) return false;
    if (filters.structure && p.structure !== filters.structure) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.currency && p.currency !== filters.currency) return false;
    if (filters.counterparty === '非亚丁') { if (p.counterparty === '亚丁') return false; }
    else if (filters.counterparty && p.counterparty !== filters.counterparty) return false;
    if (filters.expiryDateFrom || filters.expiryDateTo) {
      const expiry = new Date(p.expiryDate).getTime();
      if (filters.expiryDateFrom && expiry < new Date(filters.expiryDateFrom).getTime()) return false;
      if (filters.expiryDateTo && expiry > new Date(filters.expiryDateTo).getTime()) return false;
    }
    if (filters.notionalMin || filters.notionalMax) {
      const n = p.notionalCNY / 10000;
      if (filters.notionalMin && n < Number(filters.notionalMin)) return false;
      if (filters.notionalMax && n > Number(filters.notionalMax)) return false;
    }
    if (filters.returnRateRange) {
      if (filters.returnRateRange === 'loss' && p.returnRate >= 0) return false;
      else if (filters.returnRateRange === 'profit' && p.returnRate <= 0) return false;
      else if (filters.returnRateRange === '<-10%' && p.returnRate >= -0.1) return false;
      else if (filters.returnRateRange === '-10%~0%' && (p.returnRate < -0.1 || p.returnRate >= 0)) return false;
      else if (filters.returnRateRange === '0%~10%' && (p.returnRate < 0 || p.returnRate >= 0.1)) return false;
      else if (filters.returnRateRange === '>10%' && p.returnRate <= 0.1) return false;
    }
    if (filters.returnRateMin) {
      if (p.returnRate < Number(filters.returnRateMin)) return false;
    }
    if (filters.returnRateMax) {
      if (p.returnRate >= Number(filters.returnRateMax)) return false;
    }
    if (filters.pnlRange) {
      const pnl = p.pnlCNY;
      if (filters.pnlRange === 'loss-30w+' && pnl > -300000) return false;
      else if (filters.pnlRange === 'loss-10-30w' && (pnl <= -300000 || pnl > -100000)) return false;
      else if (filters.pnlRange === 'loss-0-10w' && (pnl <= -100000 || pnl >= 0)) return false;
      else if (filters.pnlRange === 'profit-0-10w' && (pnl < 0 || pnl >= 100000)) return false;
      else if (filters.pnlRange === 'profit-10-30w' && (pnl < 100000 || pnl >= 300000)) return false;
      else if (filters.pnlRange === 'profit-30w+' && pnl < 300000) return false;
    }
    if (filters.tags) {
      const selectedTags = filters.tags.split(',').filter(Boolean);
      if (selectedTags.length > 0) {
        let posTags: string[] = [];
        try {
          const saved = localStorage.getItem('positionTags');
          const all = saved ? JSON.parse(saved) : {};
          posTags = all[p.id] || [];
        } catch {}
        const allTags = [...p.tags, ...posTags];
        if (!selectedTags.some((t) => allTags.includes(t))) return false;
      }
    }
    return true;
  });
}

export function HighFidelityPage() {
  const navigate = useNavigate();
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [overriddenStatuses, setOverriddenStatuses] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('overriddenStatuses');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const updateOverriddenStatuses = (fn: (prev: Record<string, string>) => Record<string, string>) => {
    setOverriddenStatuses(prev => {
      const next = fn(prev);
      localStorage.setItem('overriddenStatuses', JSON.stringify(next));
      return next;
    });
  };

  const [pnlCurrency, setPnlCurrency] = useState<Currency>('CNY');

  const totalClosedPnl = useMemo(() => {
    return mockPositions
      .filter(p => p.status === 'closed')
      .reduce((sum, p) => sum + (p.closingPnlCNY ?? p.cumulativePnlCNY), 0);
  }, []);

  const filterActive = isFilterActive(filters);

  const displayPositions = useMemo(() => {
    const base = filterActive ? applyFilters(mockPositions, filters) : mockPositions;
    const closeRecords = getCloseRecords();
    const withOverrides = base.map(p => {
      const override = overriddenStatuses[p.id];
      let pos = override ? { ...p, status: override as Position['status'] } : p;
      // 根据平仓记录判断是否完全平仓
      const remaining = getRemainingNotional(pos);
      // 亚丁自动平仓，不会有过期状态；非亚丁过期可继续手动平仓
      if (remaining <= 0 && (pos.status !== 'expired' || pos.counterparty === '亚丁')) {
        pos = { ...pos, status: 'closed' as const };
      } else if (remaining > 0 && remaining < pos.notionalCNY) {
        // 部分平仓，更新名本
        pos = { ...pos, notionalCNY: remaining };
      }
      // 合并自定义标签
      try {
        const saved = localStorage.getItem('positionTags');
        const allTags = saved ? JSON.parse(saved) : {};
        if (allTags[p.id]?.length > 0) {
          pos = { ...pos, tags: [...pos.tags, ...allTags[p.id]] };
        }
      } catch {}
      return pos;
    });
    const deleted = (() => { try { const s = localStorage.getItem('deletedPositions'); return s ? JSON.parse(s) : []; } catch { return []; } })();
    return withOverrides.filter(p => p.status !== 'closed' && !(p.status === 'expired' && p.counterparty === '亚丁') && !deleted.includes(p.id));
  }, [filters, filterActive, overriddenStatuses]);

  const handleClearFilter = () => {
    setFilters({ ...EMPTY_FILTERS });
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden" style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 h-14 bg-white border-b border-[#E8ECF0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#0D1117]">持仓总览</h1>
            <Link
              to="/wireframe"
              className="text-[11px] font-medium text-[#6B7280] hover:text-[#0D1117] px-3 py-1 rounded-md transition-all hover:bg-[#F3F4F6]"
            >
              原型线框图
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* 已实现损益总额 — 点击进历史持仓 */}
            <Link
              to="/historical"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs h-9 hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-all bg-white"
            >
              <span className="text-[#9CA3AF] font-normal">已实现损益总额</span>
              <span className="text-[#E5E7EB]">|</span>
              <select value={pnlCurrency} onChange={e => setPnlCurrency(e.target.value as Currency)}
                onClick={e => e.preventDefault()}
                className="text-[10px] bg-transparent focus:outline-none text-[#6B7280] font-medium">
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
                <option value="HKD">HKD</option>
              </select>
              <span className={`font-bold ${totalClosedPnl >= 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                {totalClosedPnl >= 0 ? '+' : ''}{formatAmount(convertCurrency(totalClosedPnl, pnlCurrency), pnlCurrency, false)}
              </span>
            </Link>
            <Link
              to="/historical"
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] text-sm font-medium rounded-lg border border-[#E5E7EB] transition-colors"
            >
              <Clock size={14} className="text-[#9CA3AF]" />
              历史持仓
            </Link>
            <div className="relative">
              <button
                onClick={() => { setShowImportMenu(!showImportMenu); setShowExportMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1677FF] hover:bg-[#0E5FCC] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Upload size={14} />
                数据导入
                <ChevronDown size={12} className={`transition-transform ${showImportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showImportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowImportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-[#E8ECF0] py-1 z-20">
                    <button
                      onClick={() => { setShowImportMenu(false); navigate('/external-entry'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] text-left"
                    >
                      <Database size={14} className="text-[#6B7280]" />
                      录入外部数据
                    </button>
                    <button
                      onClick={() => { setShowImportMenu(false); navigate('/batch-import'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] text-left"
                    >
                      <Upload size={14} className="text-[#6B7280]" />
                      持仓批量导入
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowExportMenu(!showExportMenu); setShowImportMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] text-sm font-medium rounded-lg border border-[#E5E7EB] transition-colors"
              >
                <FileSpreadsheet size={14} />
                数据导出
                <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-[#E8ECF0] py-1 z-20">
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] text-left">
                      <Download size={14} className="text-[#6B7280]" />
                      导出当前视图 (Excel)
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] text-left">
                      <Download size={14} className="text-[#6B7280]" />
                      导出全部持仓 (Excel)
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] text-left">
                      <Download size={14} className="text-[#6B7280]" />
                      导出为 CSV
                    </button>
                  </div>
                </>
              )}
            </div>

            <span className="text-xs text-[#9CA3AF] ml-1">
              <span className="text-[#D1D5DB]">数据更新</span> 2026-05-14 14:32
            </span>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <FilterBar filters={filters} onFilterChange={setFilters} onClearFilter={handleClearFilter} />
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div id="stat-cards" data-anchor>
          <StatCards
            filteredPositions={displayPositions}
            isFiltered={filterActive}
            onClearFilter={handleClearFilter}
            onFilter={(partial) => setFilters(prev => ({ ...prev, ...partial }))}

          />
          </div>

          <div className="grid grid-cols-[5fr_1fr] gap-4">
            <div id="expiry-calendar" data-anchor><ExpiryCalendar positions={displayPositions} /></div>
            <div id="distribution-chart" data-anchor><DistributionChart onFilter={(min, max) => setFilters(prev => ({ ...prev, returnRateMin: String(min), returnRateMax: String(max) }))} positions={displayPositions} /></div>
          </div>

          <div id="position-table" data-anchor>
          <PositionTable
            filters={filters}
            onFilterChange={setFilters}
            overriddenStatuses={overriddenStatuses}
            onOverrideStatus={updateOverriddenStatuses}
            positions={displayPositions}
          />
          </div>

          <div className="text-[10px] text-[#9CA3AF] text-center pb-2 space-y-0.5">
            <div>所有公开市场价格数据来源于第三方合规数据供应商，平台不对数据的准确性和及时性做保证</div>
            <div>所有盈亏计算均为预估，实际盈亏以最终行权/平仓时的成交价格和交易规则为准。平台仅提供交易撮合和信息展示服务，不构成任何投资建议</div>
          </div>

        </div>
      </div>
    </div>
  );
}
