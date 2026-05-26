import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import { mockPositions, formatAmount } from './mockData';
import type { Position } from './mockData';

interface DistributionChartProps {
  wireframe?: boolean;
  onFilter?: (min: number, max: number) => void;
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

export function DistributionChart({ wireframe = false, onFilter, positions }: DistributionChartProps) {
  const dataSource = positions ?? mockPositions;
  const candidates = dataSource.filter(p => p.status !== 'closed' && p.status !== 'expired');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
  const onPieLeave = useCallback(() => { setActiveIndex(null); }, []);

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
    <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm flex flex-col h-full">
      {/* 标题 */}
      <div className="text-[11px] font-semibold text-[#0D1117] px-3 pt-2.5 pb-2">
        持仓收益率分布
        <span className="text-[#9CA3AF] font-normal ml-1.5 text-[9px]">共 {totalCount} 个持仓</span>
      </div>

      {/* 饼图 — 居中 */}
      <div className="flex justify-center px-3 pb-1">
        <PieChart width={90} height={90}>
          <Pie
            data={chartData}
            cx={45} cy={45}
            innerRadius={26}
            outerRadius={38}
            paddingAngle={2}
            dataKey="value"
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={(data) => { const b = bucketCounts.find(b => b.label === data.name); if (b) onFilter?.(b.min, b.max); }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={false} allowEscapeViewBox={{ x: true, y: true }} />
        </PieChart>
      </div>

      {/* 图例 — 单列，浮盈在上浮亏在下 */}
      <div className="px-3 pb-2.5 space-y-1.5">
        {profitItems.length > 0 && (
          <div>
            <div className="text-[8px] font-semibold text-[#E53935] uppercase tracking-wider mb-0.5">浮盈</div>
            <div className="space-y-0.5">
              {profitItems.slice(0, 4).map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#F9FAFB] rounded px-1 -mx-1 py-0.5"
                  onClick={() => onFilter?.(b.min, b.max)}>
                  <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-[10px] text-[#374151] whitespace-nowrap">{b.label}</span>
                  <div className="flex-1 h-1 rounded-full bg-[#F3F4F6] overflow-hidden min-w-[20px]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(b.pct / maxPct) * 100}%`, backgroundColor: b.color }} />
                  </div>
                  <span className="text-[9px] text-[#6B7280] w-5 text-right tabular-nums">{b.count}</span>
                </div>
              ))}
              {profitItems.length > 4 && (
                <div className="text-[9px] text-[#9CA3AF] pl-3">+{profitItems.length - 4} 档</div>
              )}
            </div>
          </div>
        )}
        {lossItems.length > 0 && (
          <div>
            <div className="text-[8px] font-semibold text-[#059669] uppercase tracking-wider mb-0.5">浮亏</div>
            <div className="space-y-0.5">
              {lossItems.slice(-4).map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#F9FAFB] rounded px-1 -mx-1 py-0.5"
                  onClick={() => onFilter?.(b.min, b.max)}>
                  <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-[10px] text-[#374151] whitespace-nowrap">{b.label}</span>
                  <div className="flex-1 h-1 rounded-full bg-[#F3F4F6] overflow-hidden min-w-[20px]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(b.pct / maxPct) * 100}%`, backgroundColor: b.color }} />
                  </div>
                  <span className="text-[9px] text-[#6B7280] w-5 text-right tabular-nums">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="mt-auto px-3 pb-2 text-[8px] text-[#9CA3AF] text-center">
        点击扇区或图例 → 查看明细
      </div>
    </div>
  );
}
