import { useState, useCallback, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import { Minus, Plus, Search } from 'lucide-react';
import { mockPositions, convertCurrency, formatAmount, Position } from './mockData';

interface DistributionChartProps {
  wireframe?: boolean;
  onDrillDown?: (positions: Position[], title: string) => void;
  positions?: Position[];
}

const PCT_BUCKETS = [
  { label: '≥30%',   min: 0.30, max: Infinity,  color: '#C62828' },
  { label: '25%~30%', min: 0.25, max: 0.30,    color: '#D32F2F' },
  { label: '20%~25%', min: 0.20, max: 0.25,    color: '#E53935' },
  { label: '15%~20%', min: 0.15, max: 0.20,    color: '#EF5350' },
  { label: '10%~15%', min: 0.10, max: 0.15,    color: '#F44336' },
  { label: '5%~10%',  min: 0.05, max: 0.10,    color: '#FF8A80' },
  { label: '0%~5%',   min: 0.00, max: 0.05,    color: '#FFCDD2' },
  { label: '-5%~0%',  min: -0.05, max: 0.00,   color: '#C8E6C9' },
  { label: '-10%~-5%', min: -0.10, max: -0.05, color: '#A5D6A7' },
  { label: '-15%~-10%', min: -0.15, max: -0.10, color: '#81C784' },
  { label: '-20%~-15%', min: -0.20, max: -0.15, color: '#66BB6A' },
  { label: '-25%~-20%', min: -0.25, max: -0.20, color: '#4CAF50' },
  { label: '-30%~-25%', min: -0.30, max: -0.25, color: '#43A047' },
  { label: '<-30%',  min: -Infinity, max: -0.30, color: '#2E7D32' },
];

const FIXED_POINTS = [0.1, 0.05, 0, -0.05, -0.1] as const;

function calcPnl(position: typeof mockPositions[0], priceChangePct: number): number {
  const newPrice = position.currentPrice * (1 + priceChangePct);
  if (newPrice <= position.strikePrice) {
    return -position.optionPremiumCNY;
  }
  const gain = (newPrice - position.strikePrice) * (position.notionalCNY / position.strikePrice);
  return gain - position.optionPremiumCNY;
}

export function DistributionChart({ wireframe = false, onDrillDown, positions }: DistributionChartProps) {
  const dataSource = positions ?? mockPositions;
  const candidates = dataSource.filter(p => p.status !== 'closed' && p.status !== 'expired');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  // Simulator state
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? '');
  const [sliderValue, setSliderValue] = useState(0);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const bucketCounts = PCT_BUCKETS.map((bucket) => {
    const positions = dataSource.filter((p) => {
      const r = p.returnRate;
      return r >= bucket.min && r < bucket.max;
    });
    const count = positions.length;
    const pnlSum = positions.reduce((s, p) => s + p.pnlCNY, 0);
    return {
      ...bucket,
      count,
      pnlSum,
      positions,
      pct: dataSource.length > 0 ? (count / dataSource.length) * 100 : 0,
    };
  });

  const chartData = bucketCounts.filter((b) => b.count > 0).map((b) => ({
    name: b.label,
    value: b.count,
    color: b.color,
    pct: b.pct,
    pnlSum: b.pnlSum,
    positions: b.positions,
  }));

  const totalCount = dataSource.length;
  const profitBuckets = bucketCounts.filter((b) => b.min >= 0);
  const lossBuckets = bucketCounts.filter((b) => b.max <= 0);

  const onPieEnter = useCallback((_: any, index: number) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => { setActiveIndex(null); setTooltipPos(null); }, []);

  const handleChartMouseMove = useCallback((e: React.MouseEvent) => {
    if (chartWrapperRef.current) {
      const rect = chartWrapperRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
    }
  }, []);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle} endAngle={endAngle}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}
        />
      </g>
    );
  };

  // Simulator data
  const selected = dataSource.find((p) => p.id === selectedId) ?? candidates[0];
  const sliderPnl = selected ? calcPnl(selected, sliderValue / 100) : 0;
  const cur = selected?.currency ?? 'CNY';

  const adjustByOne = (delta: number) => {
    setSliderValue((prev) => Math.max(-100, Math.min(100, prev + delta)));
  };

  const filtered = candidates.filter((p) => {
    if (!search) return true;
    return (
      p.underlying.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (wireframe) {
    return (
      <div className="bg-white border border-[#CCCCCC] rounded-lg p-4 flex flex-col h-full">
        <div className="text-[11px] font-semibold text-[#444444] mb-3">
          持仓分布（按收益率）共 N 个持仓
        </div>
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-[#E0E0E0] border-4 border-[#D0D0D0]" />
            <div className="text-center text-[8px] text-[#999999] mt-1">5%分档 · 点击弹窗</div>
          </div>
          <div className="flex-1 space-y-1.5 text-[9px] text-[#888888]">
            <div className="font-medium text-[#666666]">浮盈区</div>
            {profitBuckets.filter(b => b.count > 0).slice(0, 4).map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#C0C0C0] flex-shrink-0" />
                <span>{b.label}：{b.count} ({b.pct.toFixed(0)}%)</span>
              </div>
            ))}
            <div className="font-medium text-[#666666] mt-1">浮亏区</div>
            {lossBuckets.filter(b => b.count > 0).slice(-4).map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[#D0D0D0] flex-shrink-0" />
                <span>{b.label}：{b.count} ({b.pct.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const bucket = bucketCounts.find((b) => b.label === data.name);
      return (
        <div className="bg-white border border-[#E8ECF0] rounded-lg shadow-lg p-3 text-xs pointer-events-none">
          <div className="font-semibold text-[#0D1117] mb-1">{data.name}</div>
          <div className="text-[#6B7280]">持仓数：<span className="text-[#0D1117] font-medium">{data.value}个持仓</span></div>
          <div className="text-[#6B7280]">占比：<span className="text-[#0D1117] font-medium">{data.pct.toFixed(2)}%</span></div>
          {bucket && (
            <div className="text-[#6B7280]">总预估净收益：
              <span className={`font-medium ${bucket.pnlSum >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                {formatAmount(bucket.pnlSum, 'CNY')} CNY
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const profitItems = profitBuckets.filter(b => b.count > 0);
  const lossItems = lossBuckets.filter(b => b.count > 0);
  const maxPct = Math.max(...[...profitItems, ...lossItems].map(b => b.pct), 1);

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm flex flex-col">
      {/* 持仓收益率分布 */}
      <div className="text-[11px] font-semibold text-[#0D1117] px-2.5 pt-2 pb-1.5 border-b border-[#F3F4F6]">
        持仓收益率分布
        <span className="text-[#9CA3AF] font-normal ml-1.5 text-[9px]">共 {totalCount} 个持仓</span>
      </div>
      <div className="flex gap-1.5 px-2.5 py-1.5">
        <div className="flex-shrink-0 flex flex-col items-center" ref={chartWrapperRef} onMouseMove={handleChartMouseMove}>
          <PieChart width={110} height={110}>
            <Pie
              data={chartData}
              cx={55} cy={55}
              innerRadius={35}
              outerRadius={48}
              paddingAngle={2}
              dataKey="value"
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={(data) => onDrillDown?.(data.positions, data.name)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} position={tooltipPos ?? undefined}
              cursor={false} allowEscapeViewBox={{ x: true, y: true }} />
          </PieChart>
        </div>
        <div className="flex-1 flex gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-semibold text-[#E53935] uppercase tracking-wider mb-1">浮盈</div>
            <div className="space-y-0.5">
              {profitItems.slice(0, 5).map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#F9FAFB] rounded px-1 -mx-1 py-0.5"
                  onClick={() => onDrillDown?.(b.positions, b.label)}>
                  <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-[10px] text-[#374151] whitespace-nowrap">{b.label}</span>
                  <div className="flex-1 h-1 rounded-full bg-[#F3F4F6] overflow-hidden ml-auto max-w-[40px]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(b.pct / maxPct) * 100}%`, backgroundColor: b.color }} />
                  </div>
                  <span className="text-[9px] text-[#6B7280] w-6 text-right tabular-nums">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-px bg-[#F3F4F6] self-stretch" />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-semibold text-[#059669] uppercase tracking-wider mb-1">浮亏</div>
            <div className="space-y-0.5">
              {lossItems.slice(-5).map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#F9FAFB] rounded px-1 -mx-1 py-0.5"
                  onClick={() => onDrillDown?.(b.positions, b.label)}>
                  <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-[10px] text-[#374151] whitespace-nowrap">{b.label}</span>
                  <div className="flex-1 h-1 rounded-full bg-[#F3F4F6] overflow-hidden ml-auto max-w-[40px]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(b.pct / maxPct) * 100}%`, backgroundColor: b.color }} />
                  </div>
                  <span className="text-[9px] text-[#6B7280] w-6 text-right tabular-nums">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-[#F3F4F6]" />

      {/* 持仓盈亏情景模拟 */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-[#0D1117]">持仓盈亏情景模拟</span>
          <div className="relative flex-1 max-w-[360px]" ref={containerRef}>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] cursor-pointer hover:border-[#1677FF] transition-colors min-w-0 w-full"
              onClick={() => setOpen(true)}
            >
              <Search size={10} className="text-[#9CA3AF] flex-shrink-0" />
              <span className="text-[9px] text-[#374151] truncate">
                {selected?.underlying} ({cur})
              </span>
            </div>
            {open && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                <div className="p-1.5 border-b border-[#F3F4F6]">
                  <input
                    type="text"
                    placeholder="搜索"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 text-[10px] border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                {filtered.length === 0 ? (
                  <div className="px-3 py-4 text-[10px] text-[#9CA3AF] text-center">无匹配结果</div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center px-2.5 py-1.5 cursor-pointer text-[10px] hover:bg-[#F9FAFB] ${
                        p.id === selectedId ? 'bg-[#EFF6FF]' : ''
                      }`}
                      onClick={() => { setSelectedId(p.id); setOpen(false); setSearch(''); }}
                    >
                      <span className="text-[#9CA3AF] w-8 flex-shrink-0 font-medium">{p.currency}</span>
                      <span className="text-[#374151] truncate">{p.underlying}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 滑块 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => adjustByOne(-1)}
            disabled={sliderValue <= -100}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Minus size={12} />
          </button>
          <div className="flex-1 relative">
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #059669 0%, #E5E7EB 50%, #E53935 100%)`,
              }}
            />
          </div>
          <button
            onClick={() => adjustByOne(1)}
            disabled={sliderValue >= 100}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex justify-between text-[9px] text-[#9CA3AF] mb-2">
          <span>-100%</span>
          <span>0%</span>
          <span>+100%</span>
        </div>

        {/* 模拟结果 */}
        <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-md bg-[#F9FAFB]">
          <span className="text-[10px] text-[#6B7280]">
            模拟价格：<span className="font-semibold text-[#0D1117]">{(selected.currentPrice * (1 + sliderValue / 100)).toFixed(2)} {cur}</span>
          </span>
          <span className={`text-[11px] font-bold ${sliderValue > 0 ? 'text-[#E53935]' : sliderValue < 0 ? 'text-[#059669]' : 'text-[#6B7280]'}`}>
            {sliderValue > 0 ? '+' : ''}{sliderValue}%
          </span>
          <span className={`text-[10px] font-semibold ${sliderPnl >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
            盈亏：{formatAmount(convertCurrency(sliderPnl, cur), cur)} {cur}
          </span>
        </div>

        {/* 固定场景 */}
        <div className="flex gap-1.5">
          {FIXED_POINTS.map((pct) => {
            const pnl = calcPnl(selected, pct);
            const converted = convertCurrency(pnl, cur);
            return (
              <div
                key={pct}
                className={`flex-1 flex flex-col items-center rounded-md px-1.5 py-1.5 ${
                  pct === 0 ? 'bg-[#EFF6FF]' : 'bg-[#F9FAFB]'
                }`}
              >
                <span className={`text-[9px] font-medium ${
                  pct === 0 ? 'text-[#1677FF]' : pct > 0 ? 'text-[#E53935]' : 'text-[#059669]'
                }`}>
                  {pct === 0 ? '当前' : `${pct > 0 ? '+' : ''}${(pct * 100).toFixed(0)}%`}
                </span>
                <span className={`text-[9px] font-semibold ${pnl >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                  {formatAmount(converted, cur)} {cur}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
