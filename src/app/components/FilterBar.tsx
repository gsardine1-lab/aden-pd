import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { mockPositions } from './mockData';

function getTagPool(): string[] {
  try {
    const saved = localStorage.getItem('tagPool');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function countTagMatches(tag: string): number {
  try {
    const saved = localStorage.getItem('positionTags');
    const all = saved ? JSON.parse(saved) : {};
    let count = 0;
    mockPositions.forEach(p => {
      if (p.tags.includes(tag) || (all[p.id] || []).includes(tag)) count++;
    });
    return count;
  } catch { return mockPositions.filter(p => p.tags.includes(tag)).length; }
}
import { FilterState } from './HighFidelityPage';

const UNIQUE_STRUCTURES = [...new Set(mockPositions.map((p) => p.structure))].sort();
const QUICK_CURRENCIES = ['CNY', 'USD', 'HKD'];

// 按持仓数量排序的交易对手列表（不含亚丁）
const ALL_COUNTERPARTIES = (() => {
  const count: Record<string, number> = {};
  mockPositions.forEach(p => {
    if (p.counterparty === '亚丁') return;
    count[p.counterparty] = (count[p.counterparty] || 0) + 1;
  });
  return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([name]) => name);
})();

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: ({ v: string; l: string; group?: string })[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, { v: string; l: string }[]>();
    const flat: { v: string; l: string }[] = [];
    options.forEach(o => {
      if (o.group) {
        if (!map.has(o.group)) map.set(o.group, []);
        map.get(o.group)!.push(o);
      } else {
        flat.push(o);
      }
    });
    return { grouped: Array.from(map.entries()), flat };
  }, [options]);

  return (
    <div>
      <label className="text-[10px] text-[#6B7280] font-medium mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-[10px] border border-[#E5E7EB] rounded-md px-2 py-1 focus:outline-none focus:border-[#1677FF] bg-white">
        {groups.flat.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        {groups.grouped.map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilter: () => void;
}

export function FilterBar({ filters, onFilterChange, onClearFilter }: FilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [cptyExpanded, setCptyExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const f = filters;
  const hasActiveFilters = Object.values(f).some((v) => v !== '');
  const setFilter = (partial: Partial<FilterState>) => onFilterChange({ ...f, ...partial });

  const visibleCounterparties = cptyExpanded ? ALL_COUNTERPARTIES : ALL_COUNTERPARTIES.slice(0, 3);
  const hasMore = ALL_COUNTERPARTIES.length > 3;

  const searchSuggestions = useMemo(() => {
    const s = f.search.toLowerCase();
    return mockPositions.filter(p =>
      !f.search || p.underlying.includes(f.search) || p.code.toLowerCase().includes(s)
    ).slice(0, 8);
  }, [f.search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="bg-white border-b border-[#E8ECF0] px-4 py-2">
      <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
        {/* 快捷筛选标签 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 高级筛选按钮 */}
          <div className="relative">
            <button id="filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] border rounded-md transition-colors ${
                hasActiveFilters ? 'bg-[#EFF6FF] border-[#1677FF] text-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}>
              <Filter size={11} />筛选
              {hasActiveFilters && <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#1677FF] text-white text-[7px]">!</span>}
            </button>
            {showFilterDropdown && (() => {
              const filterBtn = document.getElementById('filter-btn');
              const rect = filterBtn?.getBoundingClientRect();
              const openUp = rect ? rect.bottom + 480 > window.innerHeight : false;
              return (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                <div className={`absolute left-0 min-w-[320px] max-w-[600px] bg-white rounded-lg shadow-xl border border-[#E8ECF0] z-20 ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}`} style={{ maxHeight: '460px', overflow: 'hidden' }}>
                  <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-[#F3F4F6] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0D1117]">筛选条件</span>
                    {hasActiveFilters && <button onClick={onClearFilter} className="text-[10px] text-[#1677FF] hover:underline">清空全部</button>}
                  </div>
                  <div className="flex px-4 py-3 gap-4">
                    <div className="w-60 flex-shrink-0 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <FieldSelect label="交易对手" value={f.counterparty} onChange={v => setFilter({ counterparty: v })} options={[{v:'',l:'全部'},{v:'亚丁',l:'亚丁'},...ALL_COUNTERPARTIES.map(c=>({v:c,l:c}))]} />
                        <FieldSelect label="币种" value={f.currency} onChange={v => setFilter({ currency: v })} options={[{v:'',l:'全部'},{v:'CNY',l:'CNY'},{v:'USD',l:'USD'},{v:'HKD',l:'HKD'}]} />
                      </div>
                      <div className="border-t border-[#F3F4F6]" />
                      <FieldSelect label="结构" value={f.structure} onChange={v => setFilter({ structure: v })} options={[{v:'',l:'全部'},...UNIQUE_STRUCTURES.map(s=>({v:s,l:s}))]} />
                      <FieldSelect label="状态" value={f.status} onChange={v => setFilter({ status: v })} options={[{v:'',l:'全部'},{v:'not-expired',l:'未到可行权日'},{v:'profitable-exercisable',l:'可行权且盈利'},{v:'loss-exercisable',l:'可行权但亏损'}]} />
                      <div className="border-t border-[#F3F4F6]" />
                      <div className="grid grid-cols-2 gap-2">
                        <FieldSelect label="期限" value={(() => {
                          if (!f.expiryDateTo) return '';
                          const days = Math.ceil((new Date(f.expiryDateTo).getTime() - new Date('2026-05-14').getTime()) / 86400000);
                          if (days <= 7) return '7'; if (days <= 14) return '14'; if (days <= 30) return '30'; if (days <= 90) return '90';
                          return '';
                        })()} onChange={v => {
                          if (!v) { setFilter({ expiryDateTo: '', expiryDateFrom: '' }); return; }
                          const d = new Date('2026-05-14'); d.setDate(d.getDate() + Number(v));
                          setFilter({ expiryDateTo: d.toISOString().slice(0, 10) });
                        }} options={[{v:'',l:'全部'},{v:'7',l:'≤7天'},{v:'14',l:'≤14天'},{v:'30',l:'≤30天'},{v:'90',l:'≤90天'}]} />
                        <FieldSelect label="持仓规模" value={f.notionalRange} onChange={v => {
                          if (!v) { setFilter({ notionalMin: '', notionalMax: '', notionalRange: '' }); return; }
                          const [min, max] = v.split('-');
                          setFilter({ notionalMin: min, notionalMax: max || '', notionalRange: v });
                        }} options={[{v:'',l:'全部'},{v:'0-500',l:'≤500万'},{v:'500-1000',l:'500万~1000万'},{v:'1000-2000',l:'1000万~2000万'},{v:'2000-',l:'≥2000万'}]} />
                      </div>
                      <div className="border-t border-[#F3F4F6]" />
                      <div className="grid grid-cols-2 gap-2">
                        <FieldSelect label="收益率区间" value={f.returnRateRange} onChange={v => setFilter({ returnRateRange: v })} options={[{v:'',l:'全部'},{v:'<-10%',l:'< -10%'},{v:'-10%~0%',l:'-10% ~ 0%'},{v:'0%~10%',l:'0% ~ 10%'},{v:'>10%',l:'≥ 10%'}]} />
                        <FieldSelect label="预估净收益" value={f.pnlRange} onChange={v => setFilter({ pnlRange: v })} options={[{v:'',l:'全部'},{v:'loss-30w+',l:'亏损30w以上',group:'亏损'},{v:'loss-10-30w',l:'亏损10-30w',group:'亏损'},{v:'loss-0-10w',l:'亏损0-10w',group:'亏损'},{v:'profit-0-10w',l:'盈利0-10w',group:'盈利'},{v:'profit-10-30w',l:'盈利10-30w',group:'盈利'},{v:'profit-30w+',l:'盈利30w以上',group:'盈利'}]} />
                      </div>
                    </div>
                    {(() => {
                      const tags = getTagPool();
                      if (tags.length === 0) return null;
                      return (
                    <div className="border-l border-[#F3F4F6] pl-4">
                      <div className="text-[10px] font-semibold text-[#0D1117] mb-2">标签</div>
                      <div className="space-y-1">
                        {tags.map(tag => {
                          const selected = f.tags.split(',').filter(Boolean).includes(tag);
                          return (
                            <label key={tag} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${selected ? 'bg-[#EFF6FF] text-[#1677FF]' : 'text-[#374151] hover:bg-[#F9FAFB]'}`}>
                              <input type="checkbox" checked={selected}
                                onChange={() => { const current = f.tags.split(',').filter(Boolean); const next = selected ? current.filter(t => t !== tag) : [...current, tag]; setFilter({ tags: next.join(',') }); }}
                                className="rounded border-[#D1D5DB]" />
                              <span className="max-w-[120px] truncate" title={tag}>{tag}</span>
                              <span className="ml-auto text-[9px] text-[#9CA3AF]">{countTagMatches(tag)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    )})()}
                  </div>
                </div>
              </>
            );})()}
          </div>
          <span className="text-[#E5E7EB]">|</span>
          <button onClick={() => setFilter({ counterparty: f.counterparty === '亚丁' ? '' : '亚丁' })}
            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
              f.counterparty === '亚丁' ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
            }`}>亚丁</button>
          <span className="text-[#E5E7EB]">|</span>
          {visibleCounterparties.map((cpty) => (
            <button key={cpty} onClick={() => setFilter({ counterparty: f.counterparty === cpty ? '' : cpty })}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                f.counterparty === cpty ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
              }`}>{cpty}</button>
          ))}
          {hasMore && (
            <button onClick={() => setCptyExpanded(!cptyExpanded)}
              className="text-[10px] px-1.5 py-0.5 rounded-md text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">
              {cptyExpanded ? '收起' : `+${ALL_COUNTERPARTIES.length - 3}`}
            </button>
          )}
          <span className="text-[#E5E7EB]">|</span>
          {QUICK_CURRENCIES.map((c) => (
            <button key={c} onClick={() => setFilter({ currency: f.currency === c ? '' : c })}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                f.currency === c ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
              }`}>{c}</button>
          ))}
          {/* 标签快捷筛选 */}
          {f.tags && f.tags.split(',').filter(Boolean).length > 0 && (
            <>
              <span className="text-[#E5E7EB]">|</span>
              {f.tags.split(',').filter(Boolean).map(tag => (
                <button key={tag}
                  onClick={() => { const current = f.tags.split(',').filter(Boolean); const next = current.filter(t => t !== tag); setFilter({ tags: next.join(',') }); }}
                  className="text-[10px] px-2 py-0.5 rounded-md border bg-[#EFF6FF] text-[#1677FF] border-[#1677FF]/30 hover:bg-[#1677FF] hover:text-white transition-colors max-w-[120px] truncate" title={tag}>{tag}</button>
              ))}
            </>
          )}
          {hasActiveFilters && (
            <button onClick={onClearFilter} className="text-[10px] text-[#1677FF] hover:underline ml-1 flex-shrink-0">清空</button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative" ref={searchRef}>
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-10" />
            <input type="text" placeholder="搜索标的名称/代码" value={f.search}
              onChange={(e) => { setFilter({ search: e.target.value }); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              className="pl-7 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1677FF] w-44 bg-[#F9FAFB]" />
            {searchOpen && searchSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchSuggestions.map((p) => (
                  <div key={p.id} className="flex items-center px-3 py-1.5 cursor-pointer text-xs hover:bg-[#F9FAFB]"
                    onClick={() => { setFilter({ search: p.underlying }); setSearchOpen(false); }}>
                    <span className="text-[#374151] font-medium">{p.underlying}</span>
                    <span className="text-[#9CA3AF] ml-1">({p.code})</span>
                  </div>
                ))}
              </div>
            )}
            {searchOpen && f.search && searchSuggestions.length === 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg px-3 py-2 text-xs text-[#9CA3AF] text-center">无匹配结果</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
