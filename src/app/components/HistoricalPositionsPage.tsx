import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { mockPositions, convertCurrency, formatAmount, formatNotional, getRemainingNotional, getCloseRecords } from './mockData';

export function HistoricalPositionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('startDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const searchRef = useRef<HTMLDivElement>(null);

  const overriddenStatuses = useMemo<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('overriddenStatuses');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  }, []);

  const historical = useMemo(() => {
    return mockPositions
      .map(p => {
        const override = overriddenStatuses[p.id];
        let pos = override ? { ...p, status: override as typeof p.status } : p;
        // 根据平仓记录判断：只有剩余名本归零才算已平仓
        const remaining = getRemainingNotional(pos);
        if (remaining <= 0 && pos.status !== 'expired') {
          pos = { ...pos, status: 'closed' as const };
        }
        return pos;
      })
      .filter(p => {
        return p.status === 'closed' || p.status === 'expired';
      });
  }, [overriddenStatuses]);

  const filtered = useMemo(() => {
    return historical.filter(p => {
      if (statusFilter === 'closed' && p.status !== 'closed') return false;
      if (statusFilter === 'expired' && p.status !== 'expired') return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.underlying.includes(search) && !p.code.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [historical, statusFilter, search]);

  const searchSuggestions = useMemo(() => {
    if (!search) return historical.slice(0, 8);
    const s = search.toLowerCase();
    return historical.filter(p =>
      p.underlying.includes(search) || p.code.toLowerCase().includes(s)
    ).slice(0, 8);
  }, [historical, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortField) {
        case 'underlying': va = a.underlying; vb = b.underlying; break;
        case 'counterparty': va = a.counterparty; vb = b.counterparty; break;
        case 'structure': va = a.structure; vb = b.structure; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'notionalCNY': va = a.notionalCNY; vb = b.notionalCNY; break;
        case 'closingPnlCNY': va = a.closingPnlCNY ?? 0; vb = b.closingPnlCNY ?? 0; break;
        case 'cumulativePnlCNY': va = a.cumulativePnlCNY; vb = b.cumulativePnlCNY; break;
        default: va = a.startDate; vb = b.startDate; break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortArrow = (field: string) => {
    if (sortField !== field) return null;
    return <span className="inline-flex ml-0.5 text-[#1677FF]">{sortDir === 'asc' ? '▲' : '▼'}</span>;
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

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden" style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部 */}
        <div className="flex items-center justify-between px-6 h-14 bg-white border-b border-[#E8ECF0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1677FF] transition-colors"
            >
              <ArrowLeft size={16} />
              返回持仓总览
            </button>
          </div>
          <h1 className="text-lg font-bold text-[#0D1117]">历史持仓</h1>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm">
            {/* 表头 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#0D1117]">共 {filtered.length} 条</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { v: 'all', l: '全部' },
                    { v: 'closed', l: '已平仓' },
                    { v: 'expired', l: '已到期' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setStatusFilter(opt.v)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        statusFilter === opt.v
                          ? 'bg-[#1677FF] text-white border-[#1677FF]'
                          : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative" ref={searchRef}>
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-10" />
                <input
                  type="text"
                  placeholder="搜索标的名称/代码"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1677FF] w-52 bg-[#F9FAFB]"
                />
                {searchOpen && searchSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchSuggestions.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:bg-[#F9FAFB] whitespace-nowrap"
                        onClick={() => { setSearch(p.underlying); setSearchOpen(false); }}
                      >
                        <span className="text-[#374151] font-medium">{p.underlying}</span>
                        <span className="text-[#9CA3AF]">({p.code})</span>
                        <span className="ml-auto text-[9px] text-[#9CA3AF]">{p.status === 'closed' ? '已平仓' : '已到期'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchOpen && search && searchSuggestions.length === 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg px-3 py-2 text-xs text-[#9CA3AF] text-center">
                    无匹配结果
                  </div>
                )}
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('underlying')}>标的信息{renderSortArrow('underlying')}</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('counterparty')}>交易对手{renderSortArrow('counterparty')}</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('structure')}>结构{renderSortArrow('structure')}</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('status')}>状态{renderSortArrow('status')}</th>
                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('startDate')}>开仓日 / 到期日{renderSortArrow('startDate')}</th>
                    <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('notionalCNY')}>名义本金{renderSortArrow('notionalCNY')}</th>
                    <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('closingPnlCNY')}>平仓收益{renderSortArrow('closingPnlCNY')}</th>
                    <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap cursor-pointer hover:bg-[#F3F4F6] select-none" onClick={() => handleSort('cumulativePnlCNY')}>累计净收益{renderSortArrow('cumulativePnlCNY')}</th>
                    <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-[#9CA3AF]">
                        暂无私幕纪录
                      </td>
                    </tr>
                  ) : (
                    sorted.map(p => {
                      const cur = p.currency;
                      return (
                        <tr key={p.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Link to={`/detail/${p.id}`} className="font-semibold text-[#0D1117] hover:text-[#1677FF] transition-colors flex items-center gap-1">
                              {p.underlying}
                              <ExternalLink size={10} className="text-[#9CA3AF]" />
                            </Link>
                            <div className="text-[10px] text-[#9CA3AF]">{p.code}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                              p.counterparty === '亚丁'
                                ? 'bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20'
                                : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                            }`}>
                              {p.counterparty}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[11px] font-medium text-[#1677FF] bg-[#EFF6FF] border border-[#1677FF]/20 rounded px-2 py-0.5">
                              {p.structure}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {p.status === 'closed' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                                已平仓
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                                已到期
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-[#6B7280]">{p.startDate}</div>
                            <div className="text-[#6B7280]">{p.expiryDate}</div>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-[#374151]">
                            {formatNotional(p.notionalCNY, cur)}
                          </td>
                          <td className={`px-3 py-3 text-right whitespace-nowrap font-medium ${
                            (p.closingPnlCNY ?? 0) >= 0 ? 'text-[#E53935]' : 'text-[#059669]'
                          }`}>
                            {p.closingPnlCNY !== undefined
                              ? formatAmount(convertCurrency(p.closingPnlCNY, cur), cur)
                              : <span className="text-[#9CA3AF]">-</span>
                            }
                          </td>
                          <td className={`px-3 py-3 text-right whitespace-nowrap font-medium ${
                            p.cumulativePnlCNY >= 0 ? 'text-[#E53935]' : 'text-[#059669]'
                          }`}>
                            {p.cumulativePnlCNY >= 0 ? '+' : ''}{formatAmount(convertCurrency(p.cumulativePnlCNY, cur), cur)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Link
                              to={`/detail/${p.id}`}
                              className="text-[#1677FF] hover:text-[#0E5FCC] hover:underline text-[10px] font-medium"
                            >
                              详情
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
