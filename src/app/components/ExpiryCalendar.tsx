import { useState, useMemo, useRef, useEffect } from 'react';
import { mockPositions, getDaysUntilExpiry, Position, convertCurrency, formatAmount } from './mockData';

type SortMode = 'name' | 'expiry';

interface ExpiryCalendarProps {
  wireframe?: boolean;
  onDrillDown?: (positions: Position[], title: string) => void;
  positions?: Position[];
}

export function ExpiryCalendar({ wireframe = false, onDrillDown, positions }: ExpiryCalendarProps) {
  const [sortMode, setSortMode] = useState<SortMode>('expiry');
  const [barWidth, setBarWidth] = useState(600); // 进度条容器宽度(px)
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setBarWidth(el.clientWidth));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const today = new Date('2026-05-14');
  const endDate = new Date('2026-06-13');
  const totalDays = 30;
  const dataSource = positions ?? mockPositions;

  const activePositions = useMemo(() => {
    const positions = dataSource.filter((p) => p.status !== 'closed' && p.status !== 'expired');
    const sorted = [...positions].sort((a, b) => {
      const da = getDaysUntilExpiry(a.expiryDate);
      const db = getDaysUntilExpiry(b.expiryDate);
      return da - db;
    });
    const nearest = sorted.slice(0, 7);
    if (sortMode === 'name') {
      return [...nearest].sort((a, b) => a.underlying.localeCompare(b.underlying, 'zh'));
    }
    return nearest;
  }, [sortMode]);

  const ticks = [0, 7, 14, 21, 28, 30];
  const tickLabels = ticks.map((d) => {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  function getBarProps(expiryDateStr: string) {
    const daysToExpiry = Math.min(
      Math.max(getDaysUntilExpiry(expiryDateStr), 0),
      totalDays
    );
    const widthPct = (daysToExpiry / totalDays) * 100;
    return { widthPct, daysToExpiry };
  }

  if (wireframe) {
    return (
      <div className="bg-white border border-[#CCCCCC] rounded-lg p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <span className="text-[11px] font-semibold text-[#444444]">到期日历（未来30天）</span>
          <div className="flex items-center gap-0.5 bg-[#EAEAEA] rounded p-0.5">
            <div className="text-[9px] px-2 py-0.5 rounded bg-white text-[#444444] font-medium border border-[#CCCCCC]">按到期时间</div>
            <div className="text-[9px] px-2 py-0.5 rounded text-[#999999]">按名称</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-3 flex-shrink-0">
            {ticks.map((d) => (
              <div key={d} className="absolute text-[8px] text-[#AAAAAA]" style={{ left: `${88 + (d / totalDays) * 100}%` }}>
                {tickLabels[ticks.indexOf(d)]}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            {activePositions.slice(0, 7).map((p) => {
              const { widthPct } = getBarProps(p.expiryDate);
              return (
                <div key={p.id} className="flex items-center gap-1">
                  <div className="w-20 truncate text-[9px] text-[#777777] flex-shrink-0">
                    {p.counterparty === '亚丁' && <span className="w-1 h-1 rounded-full bg-[#AAAAAA] inline-block mr-0.5" />}
                    {p.underlying}
                  </div>
                  <div className="flex-1 h-4 bg-[#ECECEC] rounded-full relative">
                    <div className="absolute left-0 top-0 h-full bg-[#D0D0D0] rounded-full flex items-center justify-end pr-1"
                      style={{ width: `${Math.max(widthPct, 4)}%`, borderLeft: '2px solid #999999' }}>
                      <span className="text-[7px] text-[#777777]">{new Date(p.expiryDate).getMonth()+1}/{new Date(p.expiryDate).getDate()}</span>
                    </div>
                  </div>
                  <span className="text-[8px] text-[#999999] w-16 truncate flex-shrink-0 ml-1">预估净收益</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#E8E8E8] flex-shrink-0 flex items-center gap-3 flex-wrap text-[9px] text-[#999999]">
          <span>● 亚丁标记可申请行权</span>
          <span>▸ 行权标签表示可申请</span>
          <span>● 临近到期≤7天</span>
          <span className="ml-auto">当日 → 30天后</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] p-2.5 shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-sm font-semibold text-[#0D1117]">到期日历（未来30天）</span>
        <div className="flex items-center gap-1.5 bg-[#F3F4F6] rounded-lg p-0.5">
          <button
            onClick={() => setSortMode('expiry')}
            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
              sortMode === 'expiry'
                ? 'bg-white text-[#0D1117] font-medium shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            按到期时间
          </button>
          <button
            onClick={() => setSortMode('name')}
            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
              sortMode === 'name'
                ? 'bg-white text-[#0D1117] font-medium shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            按名称
          </button>
        </div>
      </div>

      {/* 时间轴刻度 */}
      <div className="pl-24 mb-1 flex-shrink-0">
        <div className="flex relative">
          {ticks.map((d) => {
            const leftPct = (d / totalDays) * 100;
            return (
              <div
                key={d}
                className="absolute text-[9px] text-[#9CA3AF] -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
              >
                {tickLabels[ticks.indexOf(d)]}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pl-24 mb-4 mt-3 flex-shrink-0">
        <div className="relative h-3">
          {ticks.map((d) => (
            <div
              key={d}
              className="absolute top-0 bottom-0 w-px bg-[#F3F4F6]"
              style={{ left: `${(d / totalDays) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 border-b border-[#F3F4F6]" />
        </div>
      </div>

      {/* 持仓行 */}
      <div ref={barRef} className="flex-1 flex flex-col justify-start gap-0.5">
        {activePositions.map((p) => {
          const pnlColor = p.pnlCNY >= 0 ? '#E53935' : '#059669';
          const { widthPct, daysToExpiry } = getBarProps(p.expiryDate);
          const expiryLabel = `${new Date(p.expiryDate).getMonth()+1}/${new Date(p.expiryDate).getDate()}`;
          const isExpiringSoon = daysToExpiry <= 7;
          const isExercisable = p.counterparty === '亚丁' && (p.status === 'profitable-exercisable' || p.status === 'loss-exercisable');

          return (
            <div
              key={p.id}
              className="flex items-center group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm hover:bg-[#F9FAFB]/50 rounded-lg px-1 -mx-1 active:scale-[0.98]"
              onClick={() => onDrillDown?.([p], p.underlying)}
            >
              <div className="w-24 flex-shrink-0 pr-2">
                <div className="text-[10px] font-medium text-[#374151] truncate group-hover:text-[#1677FF] transition-colors flex items-center gap-1">
                  {p.counterparty === '亚丁' && <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] flex-shrink-0" title="亚丁持仓，可申请行权" />}
                  {p.underlying}
                  {isExercisable && (
                    <span className={`text-[7px] px-0.5 py-px rounded font-bold flex-shrink-0 ${p.status === 'profitable-exercisable' ? 'bg-[#E53935] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>
                      行权
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-[#9CA3AF] truncate">{p.code}</div>
              </div>
              <div className="flex-1 relative h-6">
                {ticks.map((d) => (
                  <div
                    key={d}
                    className="absolute top-0 bottom-0 w-px bg-[#F9FAFB]"
                    style={{ left: `${(d / totalDays) * 100}%` }}
                  />
                ))}
                <div
                  className={`absolute left-0 top-1 bottom-1 rounded-full transition-all duration-200 group-hover:brightness-110 group-hover:shadow-sm flex items-center justify-end pr-1.5 ${isExpiringSoon ? 'ring-2 ring-[#E53935]' : ''}`}
                  style={{
                    width: `${Math.max(widthPct, 4)}%`,
                    backgroundColor: pnlColor + '22',
                    borderLeft: `3px solid ${pnlColor}`,
                  }}
                >
                  <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: pnlColor }}>
                    {expiryLabel}
                  </span>
                  {/* 临近到期红点 - 在进度条右端 */}
                  {isExpiringSoon && (
                    <div className="w-2 h-2 rounded-full bg-[#E53935] ml-1 shrink-0 shadow-sm" />
                  )}
                </div>
                {barWidth * (1 - widthPct / 100) > 140 ? (
                  <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${Math.max(widthPct, 4) + 1}%` }}>
                    <span className="text-[9px] font-semibold whitespace-nowrap ml-1" style={{ color: pnlColor }}>
                      {formatAmount(convertCurrency(p.pnlCNY, p.currency), p.currency)} {p.currency}
                    </span>
                  </div>
                ) : (
                  <div className="absolute left-2 top-0 bottom-0 flex items-center">
                    <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: pnlColor }}>
                      {formatAmount(convertCurrency(p.pnlCNY, p.currency), p.currency)} {p.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-[#F3F4F6] flex items-center gap-3 flex-wrap text-[10px] text-[#9CA3AF] flex-shrink-0">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] flex-shrink-0" />蓝色标记为亚丁持仓
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-[7px] px-0.5 py-px rounded font-bold bg-[#E53935] text-white flex-shrink-0">行权</span>可申请行权
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#E53935] flex-shrink-0" />临近到期（≤7天）
        </span>
        <span className="whitespace-nowrap ml-auto">
          {today.getMonth()+1}/{today.getDate()} → {endDate.getMonth()+1}/{endDate.getDate()}
        </span>
      </div>
    </div>
  );
}
