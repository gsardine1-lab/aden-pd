import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Settings } from 'lucide-react';
import {
  mockPositions, getRemainingNotional, addCloseRecord,
  convertCurrency,
  formatAmount,
  formatNotional,
  formatRate,
  getDaysUntilExpiry,
  Position,
} from './mockData';
import { FilterState, applyFilters } from './HighFidelityPage';

interface PositionTableProps {
  wireframe?: boolean;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  overriddenStatuses?: Record<string, string>;
  onOverrideStatus?: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  positions?: Position[];
}

type SortField = 'underlying' | 'strategy' | 'structure' | 'status' | 'expiryDate'
  | 'notionalCNY' | 'openPrice' | 'strikePrice' | 'currentPrice'
  | 'breakEvenPrice' | 'breakevenDiff' | 'optionPremiumCNY'
  | 'valuationCNY' | 'pnlCNY' | 'counterparty' | 'currency' | 'ruleType';

interface ColumnDef {
  label: string;
  sortField?: SortField;
  sortable: boolean;
  optional?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { label: '标的信息', sortField: 'underlying', sortable: true },
  { label: '币种', sortField: 'currency', sortable: true },
  { label: '交易对手', sortField: 'counterparty', sortable: true },
  { label: '结构', sortField: 'structure', sortable: true },
  { label: '期限', sortField: 'term', sortable: true },
  { label: '操作', sortField: 'status', sortable: true },
  { label: '开仓日 / 到期日', sortField: 'expiryDate', sortable: true },
  { label: '持仓名本', sortField: 'notionalCNY', sortable: true },
  { label: '开仓价', sortField: 'openPrice', sortable: true },
  { label: '执行价', sortField: 'strikePrice', sortable: true },
  { label: '当前市价', sortField: 'currentPrice', sortable: true, optional: true },
  { label: '盈亏平衡点', sortField: 'breakEvenPrice', sortable: true, optional: true },
  { label: '期权费', sortField: 'optionPremiumCNY', sortable: true, optional: true },
  { label: '持仓估值', sortField: 'valuationCNY', sortable: true, optional: true },
  { label: '持仓预估净收益', sortField: 'pnlCNY', sortable: true },
  { label: '交易规则', sortField: 'ruleType', sortable: true },
  { label: '详情', sortable: false },
];

const OPTIONAL_LABELS = ALL_COLUMNS.filter(c => c.optional).map(c => c.label);

function loadColumnPrefs(): string[] {
  try {
    const saved = localStorage.getItem('position-table-columns');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...OPTIONAL_LABELS]; // 默认全选
}

function saveColumnPrefs(hidden: string[]) {
  localStorage.setItem('position-table-columns', JSON.stringify(hidden));
}

const UNIQUE_STRUCTURES = [...new Set(mockPositions.map((p) => p.structure))].sort();

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="text-[10px] text-[#6B7280] font-medium mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-[10px] border border-[#E5E7EB] rounded-md px-2 py-1 focus:outline-none focus:border-[#1677FF] bg-white">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ position, wireframe, onClose }: { position: Position; wireframe?: boolean; onClose?: (p: Position) => void }) {
  const status = position.status;
  const isAden = position.counterparty === '亚丁';
  const base = 'text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap';
  if (wireframe) {
    const labels: Record<Position['status'], string> = {
      'profitable-exercisable': '申请行权（红）',
      'loss-exercisable': '申请行权（灰）',
      'not-expired': '未到期（灰）',
      'expired': '已到期（灰）',
      'closed': '已平仓（灰）',
    };
    return (
      <div className={`${base} border border-[#CCCCCC] bg-[#F5F5F5] text-[#888888]`}>
        {labels[status]}
      </div>
    );
  }
  if (status === 'profitable-exercisable') {
    if (!isAden) {
      return <span className={`${base} bg-[#F3F4F6] text-[#6B7280]`}>盈利</span>;
    }
    return <button className={`${base} bg-[#E53935] text-white hover:bg-[#C62828] cursor-pointer`}>申请行权</button>;
  }
  if (status === 'loss-exercisable') {
    if (!isAden) {
      return <span className={`${base} bg-[#F3F4F6] text-[#6B7280]`}>亏损</span>;
    }
    return <button className={`${base} bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D1D5DB] cursor-pointer`}>申请行权</button>;
  }
  if (status === 'not-expired') {
    if (isAden) {
      return <span className={`${base} bg-[#F3F4F6] text-[#9CA3AF]`} title="持仓尚未进入行权窗口期，暂不可申请行权">未到期</span>;
    }
    return (
      <button
        className={`${base} bg-[#1677FF] text-white hover:bg-[#0E5FCC] cursor-pointer`}
        onClick={(e) => { e.stopPropagation(); onClose?.(position); }}
      >
        手动平仓
      </button>
    );
  }
  if (status === 'expired') {
    return (
      <span className={`${base} bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]`}>
        已到期
      </span>
    );
  }
  return (
    <span className={`${base} bg-[#F3F4F6] text-[#6B7280]`}>
      已平仓
    </span>
  );
}

interface RuleTag {
  label: string;
  type: 'dividend-adjust' | 'dividend-none' | 'dividend-deduct' | 'dividend-deduct-warn' | 'knockout-forced' | 'knockout-negotiated';
}

function getRuleTags(p: Position): RuleTag[] {
  const tags: RuleTag[] = [];
  // 敲出规则（更重要，排在前面）
  if (p.tradingRules.knockoutRule?.includes('协商')) {
    tags.push({ label: '协商敲出', type: 'knockout-negotiated' });
  } else {
    tags.push({ label: '强制敲出', type: 'knockout-forced' });
  }
  // 分红规则
  if (p.tradingRules.dividendRule) {
    if (p.tradingRules.dividendRule.includes('提前行权扣分红')) {
      tags.push({ label: '分红不调整', type: 'dividend-none' });
      tags.push({ label: '提前行权扣分红', type: 'dividend-deduct-warn' });
    } else if (p.tradingRules.dividendRule.includes('不调整')) {
      tags.push({ label: '分红不调整', type: 'dividend-none' });
    } else {
      tags.push({ label: '分红调整', type: 'dividend-adjust' });
    }
  }
  return tags;
}

const TAG_COLORS: Record<RuleTag['type'], string> = {
  'dividend-adjust': 'bg-[#EFF6FF] text-[#1677FF] border-[#1677FF]/20',
  'dividend-none': 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
  'dividend-deduct': 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
  'dividend-deduct-warn': 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  'knockout-forced': 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
  'knockout-negotiated': 'bg-[#F9FAFB] text-[#B0B7C3] border-[#E8ECF0]',
};

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
  pnlRange: '',
  tags: '',
};

const QUICK_STRUCTURES = ['100%Call', '103%Call', '105%Call'];
const QUICK_CURRENCIES = ['CNY', 'USD', 'HKD'];

export function PositionTable({ wireframe = false, filters, onFilterChange, overriddenStatuses = {}, onOverrideStatus, positions }: PositionTableProps) {
  const baseData = positions ?? mockPositions;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [closeTarget, setCloseTarget] = useState<Position | null>(null);
  const [closeFormPrice, setCloseFormPrice] = useState('');
  const [closeFormNotional, setCloseFormNotional] = useState('');
  const [closeFormDate, setCloseFormDate] = useState('2026-05-20');

  // 打开平仓弹窗时重置表单
  useEffect(() => {
    if (closeTarget) {
      setCloseFormPrice('');
      setCloseFormNotional('');
      setCloseFormDate('2026-05-20');
    }
  }, [closeTarget]);
  const [page, setPage] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    const saved = loadColumnPrefs();
    return OPTIONAL_LABELS.filter(l => !saved.includes(l));
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const pageSize = 12;

  const visibleColumns = ALL_COLUMNS.filter(c => !c.optional || !hiddenColumns.includes(c.label));

  const toggleColumn = (label: string) => {
    setHiddenColumns(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      saveColumnPrefs(OPTIONAL_LABELS.filter(l => !next.includes(l)));
      return next;
    });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allOptionalVisible = hiddenColumns.length === 0;
  const visibleCount = ALL_COLUMNS.filter(c => !c.optional || !hiddenColumns.includes(c.label)).length;

  const f = filters ?? EMPTY_FILTERS;

  const setFilter = (partial: Partial<FilterState>) => {
    onFilterChange?.({ ...f, ...partial });
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (positions) return positions;
    return applyFilters(mockPositions, f);
  }, [f, positions]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortField === 'expiryDate') {
        if (sortDir === 'asc') {
          const va = a.startDate;
          const vb = b.startDate;
          if (va < vb) return -1;
          if (va > vb) return 1;
          return 0;
        } else {
          const va = a.expiryDate;
          const vb = b.expiryDate;
          if (va < vb) return 1;
          if (va > vb) return -1;
          return 0;
        }
      }
      if (sortField === 'ruleType') {
        const ra = getSpecialRules(a).length > 0 ? 1 : 0;
        const rb = getSpecialRules(b).length > 0 ? 1 : 0;
        if (ra < rb) return sortDir === 'asc' ? -1 : 1;
        if (ra > rb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
      let va: number | string = a[sortField] as any;
      let vb: number | string = b[sortField] as any;
      if (va === undefined) va = sortDir === 'asc' ? Infinity : -Infinity;
      if (vb === undefined) vb = sortDir === 'asc' ? Infinity : -Infinity;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortArrow = (field?: SortField) => {
    if (!field || sortField !== field) return null;
    return (
      <span className="inline-flex ml-0.5 text-[#1677FF]">
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchSuggestions = useMemo(() => {
    const s = f.search.toLowerCase();
    return baseData.filter(p =>
      !f.search || p.underlying.includes(f.search) || p.code.toLowerCase().includes(s)
    ).slice(0, 8);
  }, [f.search, baseData]);


  const handleClearFilters = () => {
    onFilterChange?.({ ...EMPTY_FILTERS });
  };

  const hasActiveFilters = Object.values(f).some((v) => v !== '');

  if (wireframe) {
    return (
      <div className="bg-white border border-[#CCCCCC] rounded-lg">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 px-4 py-3 border-b border-[#E8E8E8]">
          <span className="text-[11px] font-medium text-[#555555]">共 {filtered.length} 条持仓</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">亚丁</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">对方名称</span>
            <span className="text-[#D0D0D0]">|</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">100%Call</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">103%Call</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">105%Call</span>
            <span className="text-[#D0D0D0]">|</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">CNY</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">USD</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">HKD</span>
            <span className="text-[#D0D0D0]">|</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#888888]">临近到期≤7天</span>
            <span className="text-[9px] text-[#999999] ml-1">清空</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="border border-[#CCCCCC] rounded px-2 py-1 text-[9px] text-[#999999]">搜索</div>
            <div className="border border-[#CCCCCC] rounded px-2 py-1 text-[9px] text-[#999999]">筛选 ▾</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-[9px]">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E8E8E8]">
                {ALL_COLUMNS.map((col) => (
                  <th key={col.label} className={`text-left px-2 py-2 text-[#777777] font-medium whitespace-nowrap border-r border-[#EEEEEE] ${col.sortable ? 'cursor-pointer' : ''}`}>
                    {col.label} {col.sortable && <span className="text-[#BBBBBB]">▲</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-b border-[#F0F0F0]">
                  <td className="px-2 py-2">
                    <div className="text-[#555555] font-medium">{p.underlying}</div>
                    <div className="text-[#AAAAAA]">{p.code}</div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-[10px] text-[#888888] border border-[#CCCCCC] rounded px-1 py-0.5 bg-[#F5F5F5]">{p.counterparty}</div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-[10px] text-[#888888] border border-[#CCCCCC] rounded px-1 py-0.5 bg-[#F5F5F5]">{p.structure}</div>
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge position={p} wireframe />
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-[#888888]">{p.startDate} / {p.expiryDate}</div>
                  </td>
                  {[...Array(10)].map((_, i) => (
                    <td key={i} className="px-2 py-2">
                      <div className="h-3 bg-[#EEEEEE] rounded" />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="text-[9px] text-[#AAAAAA]">{getRuleTags(p).map(t => t.label).join('·')}</div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="h-3 bg-[#EEEEEE] rounded w-12" />
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-[9px] text-[#999999] border border-dashed border-[#CCCCCC] rounded px-1 py-0.5">详情 ↗</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E8E8E8] text-[9px] text-[#999999]">
          <span>共 {filtered.length} 条，第 1/2 页</span>
          <div className="flex gap-1">
            <span className="w-5 h-5 rounded bg-[#CCCCCC] flex items-center justify-center text-white text-[8px]">1</span>
            <span className="w-5 h-5 rounded border border-[#CCCCCC] flex items-center justify-center text-[8px]">2</span>
          </div>
        </div>

        <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E8E8E8] text-[8px] text-[#AAAAAA] space-y-0.5">
          <div>行任意位置点击展开详情面板 | 标的名称为跳转链接 | 交易对手/交易规则支持排序 | 筛选联动统计卡片</div>
          <div>特殊规则：敲出 · 分红 · 非自动行权 显示标签 | 金额格式：完整数字（缩写预览）</div>
          <div>行展开面板包含交易规则详情 + 持仓概要 + 查看详情页按钮</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm">
      {/* 列表头 — 计数 + 设置 */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-2 px-5 py-3 border-b border-[#F3F4F6]">
        <span className="text-sm font-semibold text-[#0D1117]">共 {filtered.length} 条持仓</span>
        <div className="flex items-center gap-2 ml-auto">
          {/* 设置按钮 */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => { setSettingsOpen(!settingsOpen); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                !allOptionalVisible
                  ? 'bg-[#EFF6FF] border-[#1677FF] text-[#1677FF]'
                  : 'border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
              }`}
            >
              <Settings size={12} />
              设置
              {!allOptionalVisible && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1677FF] text-white text-[8px]">!</span>
              )}
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-[#E8ECF0] p-3 z-20">
                <div className="text-[10px] font-semibold text-[#0D1117] mb-2">可选信息列</div>
                {OPTIONAL_LABELS.map((label) => (
                  <label key={label} className="flex items-center gap-2 py-1 cursor-pointer text-xs text-[#374151] hover:bg-[#F9FAFB] rounded px-1">
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.includes(label)}
                      onChange={() => toggleColumn(label)}
                      className="rounded border-[#D1D5DB]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1700px] text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
              {ALL_COLUMNS.filter(c => !c.optional || !hiddenColumns.includes(c.label)).map((col, idx) => (
                <th
                  key={col.label}
                  className={`text-left px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap ${
                    col.sortable
                      ? 'text-[#374151] cursor-pointer hover:bg-[#F3F4F6] select-none'
                      : 'text-[#6B7280]'
                  } ${idx === 0 ? 'sticky left-0 z-10 bg-[#F9FAFB]' : idx === 1 ? 'sticky z-10 bg-[#F9FAFB] border-r border-[#F3F4F6]' : 'border-r border-[#F3F4F6] last:border-r-0'}`}
                  style={idx === 0 ? { width: 100, minWidth: 100 } : idx === 1 ? { left: 100 } : undefined}
                  onClick={() => col.sortField && handleSort(col.sortField)}
                >
                  {col.label}
                  {renderSortArrow(col.sortField)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((p, idx) => {
              const overriddenStatus = overriddenStatuses[p.id];
              const displayP = overriddenStatus ? { ...p, status: overriddenStatus as Position['status'] } : p;
              const days = getDaysUntilExpiry(displayP.expiryDate);
              const isExpiringSoon = days >= 0 && days <= 7;
              const isHeavyLoss = displayP.returnRate < -0.2;
              const isExpired = displayP.status === 'expired';
              const isExpanded = expandedId === displayP.id;
              const cur = displayP.currency;
              const ruleTags = getRuleTags(displayP);

              const rowBg = isExpired
                ? 'bg-[#FFFDE7]/60'
                : isHeavyLoss
                ? 'bg-[#F1F8E9]/60'
                : idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]';
              const stickyBg = isExpired
                ? 'bg-[#FFFDE7]'
                : isHeavyLoss
                ? 'bg-[#F1F8E9]'
                : idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]';

              const toggleExpand = () => setExpandedId(isExpanded ? null : displayP.id);

              return (
                <>
                  <tr key={displayP.id} className={`border-b border-[#F3F4F6] ${rowBg} cursor-pointer hover:bg-[#F9FAFB]`} onClick={toggleExpand}>
                    {/* 标的信息 — 点击跳转详情页 */}
                    <td className={`px-3 py-2.5 whitespace-nowrap sticky left-0 z-10 ${stickyBg}`} style={{ width: 100, minWidth: 100 }} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/detail/${displayP.id}`} className="font-semibold text-[#0D1117] hover:text-[#1677FF] transition-colors flex items-center gap-1">
                        {displayP.underlying}
                        <ExternalLink size={10} className="text-[#9CA3AF]" />
                      </Link>
                      <div className="text-[10px] text-[#9CA3AF]">{displayP.code}</div>
                    </td>
                    {/* 币种 — 冻结 */}
                    <td className={`px-2 py-2.5 text-center text-[10px] font-medium text-[#0D1117] sticky z-10 ${stickyBg} border-r border-[#F3F4F6]`} style={{ left: 100 }}>
                      {displayP.currency}
                    </td>
                    {/* 交易对手 */}
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                        displayP.counterparty === '亚丁'
                          ? 'bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20'
                          : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                      }`}>
                        {displayP.counterparty}
                      </span>
                    </td>
                    {/* 结构 */}
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] font-medium text-[#1677FF] bg-[#EFF6FF] border border-[#1677FF]/20 rounded px-2 py-0.5">
                        {displayP.structure}
                      </span>
                    </td>
                    {/* 期限 */}
                    <td className="px-3 py-2.5 text-[11px] text-[#374151]">
                      {displayP.term}
                    </td>
                    {/* 操作 */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge position={displayP} onClose={setCloseTarget} />
                    </td>
                    {/* 关键日期 */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-[#6B7280]">{displayP.startDate}</div>
                      <div className={`${isExpiringSoon ? 'text-[#E53935] font-bold' : 'text-[#6B7280]'}`}>
                        {displayP.expiryDate}
                        {isExpiringSoon && <span className="ml-1 text-[9px]">({days}个自然日)</span>}
                      </div>
                    </td>
                    {/* 持仓名本 */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-[#374151]">
                      {formatNotional(displayP.notionalCNY, cur)}
                    </td>
                    {/* 开仓价 */}
                    <td className="px-3 py-2.5 text-[#374151]">
                      {displayP.openPrice.toLocaleString()}
                    </td>
                    {/* 执行价 */}
                    <td className="px-3 py-2.5 text-[#374151]">
                      {displayP.strikePrice.toLocaleString()}
                    </td>
                    {/* 当前市价 */}
                    {!hiddenColumns.includes('当前市价') && (
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className={`font-medium ${displayP.currentPrice >= displayP.openPrice ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                          {displayP.currentPrice.toLocaleString()}
                        </div>
                        <div className={`text-[10px] ${displayP.priceDiff >= 0 ? 'text-[#F87171]' : 'text-[#34D399]'}`}>
                          {formatRate(displayP.priceDiff)}
                        </div>
                      </td>
                    )}
                    {/* 盈亏平衡点 */}
                    {!hiddenColumns.includes('盈亏平衡点') && (
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className={`font-medium ${displayP.currentPrice >= displayP.breakEvenPrice ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                          {displayP.breakEvenPrice.toLocaleString()}
                        </div>
                        <div className={`text-[10px] ${displayP.breakevenDiff >= 0 ? 'text-[#F87171]' : 'text-[#34D399]'}`}>
                          {formatRate(displayP.breakevenDiff)}
                        </div>
                      </td>
                    )}
                    {/* 期权费 */}
                    {!hiddenColumns.includes('期权费') && (
                      <td className="px-3 py-2.5 text-[#374151]">
                        {formatAmount(convertCurrency(displayP.optionPremiumCNY, cur), cur, false)}
                      </td>
                    )}
                    {/* 持仓估值 */}
                    {!hiddenColumns.includes('持仓估值') && (
                      <td className="px-3 py-2.5 text-[#374151]">
                        {formatAmount(convertCurrency(displayP.valuationCNY, cur), cur)}
                      </td>
                    )}
                    {/* 持仓预估净收益 */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className={`font-semibold ${displayP.pnlCNY >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                        {displayP.pnlCNY >= 0 ? '+' : ''}{formatAmount(convertCurrency(displayP.pnlCNY, cur), cur, false)}
                      </div>
                      <div className={`text-[10px] ${displayP.returnRate >= 0 ? 'text-[#F87171]' : 'text-[#34D399]'}`}>
                        {formatRate(displayP.returnRate)}
                      </div>
                    </td>
                    {/* 交易规则 */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {ruleTags.map((tag) => (
                          <span key={tag.label} className={`text-[9px] px-2 py-0.5 rounded font-medium whitespace-nowrap border ${TAG_COLORS[tag.type]}`}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* 详情链接 */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/detail/${displayP.id}`}
                        className="text-[#1677FF] hover:text-[#0E5FCC] hover:underline flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap"
                        title="查看持仓详情"
                      >
                        详情
                        <ExternalLink size={10} />
                      </Link>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${displayP.id}-expanded`} className={`border-b border-[#F3F4F6] ${rowBg}`}>
                      <td className="sticky left-0 z-10 bg-[#F9FAFB] border-r border-[#F3F4F6]" />
                      <td className="sticky z-10 bg-[#F9FAFB]" style={{ left: 100 }} />
                      <td colSpan={visibleCount - 2} className="px-5 py-3 bg-[#F9FAFB]">
                        {displayP.counterparty === '亚丁' ? (
                          <div className="grid grid-cols-2 gap-4 text-xs text-[#6B7280]">
                            <div>
                              <div className="font-semibold text-[#374151] mb-1">交易规则详情</div>
                              <div className="text-[#6B7280]">行权规则：{displayP.tradingRules.exerciseRule}</div>
                              <div className="text-[#6B7280]">
                                到期行权：{displayP.tradingRules.expiryRule}
                              </div>
                              {displayP.tradingRules.knockoutRule && (
                                <div className="text-[#6B7280]">敲出规则：{displayP.tradingRules.knockoutRule}</div>
                              )}
                              {displayP.tradingRules.dividendRule && (
                                <div className={displayP.tradingRules.dividendRule.includes('提前行权扣分红') ? 'text-[#B45309]' : 'text-[#6B7280]'}>
                                  分红处理：{displayP.tradingRules.dividendRule.includes('提前行权扣分红') ? '分红不调整且提前行权扣分红' : displayP.tradingRules.dividendRule}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#374151] mb-1">持仓详情</div>
                              <div>币种：{displayP.currency} | 结构：{displayP.structure}</div>
                              <div>名义本金：{formatNotional(displayP.notionalCNY, cur)}</div>
                              <div>期权费：{formatAmount(convertCurrency(displayP.optionPremiumCNY, cur), cur)}</div>
                              <div className="mt-2">
                                <Link to={`/detail/${displayP.id}`} className="inline-flex items-center gap-1 text-[#1677FF] hover:text-[#0E5FCC] hover:underline font-medium text-[11px]">
                                  查看持仓详情
                                  <ExternalLink size={10} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#6B7280]">
                            <div className="font-semibold text-[#374151] mb-1">持仓详情</div>
                            <div>币种：{displayP.currency} | 结构：{displayP.structure}</div>
                            <div>名义本金：{formatNotional(displayP.notionalCNY, cur)}</div>
                            <div>期权费：{formatAmount(convertCurrency(displayP.optionPremiumCNY, cur), cur)}</div>
                            <div className="mt-2">
                              <Link to={`/detail/${displayP.id}`} className="inline-flex items-center gap-1 text-[#1677FF] hover:text-[#0E5FCC] hover:underline font-medium text-[11px]">
                                查看持仓详情
                                <ExternalLink size={10} />
                              </Link>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 手动平仓弹窗 */}
      {closeTarget && (() => {
        const remaining = getRemainingNotional(closeTarget) / 10000;
        const handleConfirmClose = () => {
          const price = Number(closeFormPrice);
          const notional = Number(closeFormNotional);
          if (!price || !notional || !closeFormDate) return;
          addCloseRecord(closeTarget.id, {
            id: `cl-${Date.now()}`,
            date: closeFormDate,
            price,
            notionalCNY: notional,
          });
          const newRemaining = remaining - notional;
          if (newRemaining <= 0) {
            onOverrideStatus?.(prev => ({ ...prev, [closeTarget.id]: 'closed' }));
          }
          setCloseTarget(null);
        };
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCloseTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-[#E8ECF0] p-6 w-96">
            <div className="text-sm font-semibold text-[#0D1117] mb-1">手动平仓</div>
            <div className="text-xs text-[#6B7280] mb-1">
              {closeTarget.underlying} ({closeTarget.code})
            </div>
            <div className="text-xs text-[#9CA3AF] mb-4">
              交易对手：{closeTarget.counterparty}
              <span className="ml-2 text-[#1677FF]">剩余名本 {remaining.toFixed(0)}万</span>
            </div>
            <div className="mb-4 space-y-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <div className="text-[10px] font-semibold text-[#374151]">平仓信息录入</div>
              <div>
                <label className="text-[9px] text-[#9CA3AF] mb-0.5 block">平仓价格</label>
                <input type="text" value={closeFormPrice} onChange={e => setCloseFormPrice(e.target.value)}
                  placeholder="请输入平仓成交价"
                  className="w-full text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#1677FF] bg-white" />
              </div>
              <div>
                <label className="text-[9px] text-[#9CA3AF] mb-0.5 block">本次平仓名本（万）</label>
                <input type="text" value={closeFormNotional} onChange={e => setCloseFormNotional(e.target.value)}
                  placeholder={remaining > 0 ? `剩余 ${remaining.toFixed(0)}万，可部分平仓` : '已全部平仓'}
                  className="w-full text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#1677FF] bg-white" />
              </div>
              <div>
                <label className="text-[9px] text-[#9CA3AF] mb-0.5 block">平仓日期</label>
                <input type="date" value={closeFormDate} onChange={e => setCloseFormDate(e.target.value)}
                  className="w-full text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#1677FF] bg-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCloseTarget(null)}
                className="flex-1 py-2 text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">取消</button>
              <button onClick={handleConfirmClose}
                disabled={!closeFormPrice || !closeFormNotional || !closeFormDate || remaining <= 0}
                className="flex-1 py-2 text-xs font-medium bg-[#1677FF] text-white rounded-lg hover:bg-[#0E5FCC] disabled:bg-[#B0D0FF] transition-colors">确认平仓</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* 分页 */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
        <span className="text-xs text-[#9CA3AF]">共 {filtered.length} 条，第 {page}/{totalPages} 页</span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                p === page
                  ? 'bg-[#1677FF] text-white'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
