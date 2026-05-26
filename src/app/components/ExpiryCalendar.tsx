import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowUp } from 'lucide-react';
import { mockPositions, Position, formatRate } from './mockData';

interface ExpiryCalendarProps {
  wireframe?: boolean;
  positions?: Position[];
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function ContractCards({ positions }: { positions: Position[] }) {
  const navigate = useNavigate();
  const cols = positions.length >= 9 ? 'grid-cols-4' : positions.length >= 5 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${cols} gap-1`}>
      {positions.map((p) => {
        const isAden = p.counterparty === '亚丁';
        const isExercisable = isAden && (p.status === 'profitable-exercisable' || p.status === 'loss-exercisable');
        return (
          <div
            key={p.id}
            className="rounded-md border border-[#F3F4F6] hover:border-[#E5E7EB] hover:shadow-sm bg-white px-2 py-1.5 cursor-pointer transition-all"
            onClick={() => navigate(`/detail/${p.id}`)}
          >
            <div className="flex items-center gap-1 min-w-0 mb-0.5">
              <span className="text-[10px] font-semibold text-[#0D1117] truncate hover:text-[#1677FF]">{p.underlying}</span>
              {isExercisable && (
                <span className={`text-[7px] px-0.5 py-px rounded font-bold flex-shrink-0 ${p.status === 'profitable-exercisable' ? 'bg-[#E53935] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>行权</span>
              )}
            </div>
            <div className="flex items-baseline justify-between mb-0.5">
              <span className={`text-[11px] font-bold ${p.pnlCNY >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                {p.pnlCNY >= 0 ? '+' : '-'}{Math.abs(p.pnlCNY).toLocaleString()} {p.currency}
              </span>
              <span className={`text-[11px] font-bold ${p.returnRate >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                <span className="text-[7px] text-[#9CA3AF] font-normal">预期收益率</span> {formatRate(p.returnRate)}
              </span>
            </div>
            <div className="text-[8px] text-[#9CA3AF] mb-1">{p.code}</div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[7px] px-1 py-0.5 rounded font-medium ${isAden ? 'bg-[#EFF6FF] text-[#1677FF]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{p.counterparty}</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">{p.structure}</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">{p.term}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExpiryCalendar({ wireframe = false, positions }: ExpiryCalendarProps) {
  const today = new Date('2026-05-14');
  const dataSource = positions ?? mockPositions;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 生成从今天起 30 天的日期列表
  const allDays = useMemo(() => {
    const result: {
      date: Date; dateStr: string; isToday: boolean; isWeekend: boolean;
      positions: Position[]; dayOfWeek: string;
    }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const dow = d.getDay();
      const expiring = dataSource.filter(p => {
        if (p.status === 'closed' || p.status === 'expired') return false;
        return p.expiryDate === ds;
      });
      result.push({
        date: d, dateStr: ds, isToday: i === 0,
        isWeekend: dow === 0 || dow === 6,
        dayOfWeek: DAY_LABELS[dow],
        positions: expiring,
      });
    }
    return result;
  }, [dataSource]);

  const totalExpiring = allDays.reduce((s, d) => s + d.positions.length, 0);
  const firstDayWithData = allDays.find(d => d.positions.length > 0) ?? allDays[0];
  const [selectedIdx, setSelectedIdx] = useState(allDays.indexOf(firstDayWithData));
  const selected = allDays[selectedIdx];

  const scrollToTop = () => {
    setSelectedIdx(0);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (wireframe) {
    const sampleDay = allDays[6]; // 5/20
    return (
      <div className="bg-white border border-[#CCCCCC] rounded-lg p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#444444]">近30日到期日历</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-[#AAAAAA]">5/14 → 6/13</span>
            <div className="text-[8px] px-1.5 py-0.5 rounded border border-[#CCCCCC] text-[#999999]">近7天</div>
          </div>
        </div>
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="w-[92px] flex-shrink-0 flex flex-col gap-0.5 overflow-y-auto">
            {[0,1,2,3,4,5,6,7,8].map(i => {
              const d = new Date('2026-05-14');
              d.setDate(d.getDate() + i);
              const sel = i === 6;
              return (
                <div key={i} className={`rounded-md border px-2 py-1 flex items-center gap-1.5 flex-shrink-0 ${sel ? 'border-[#999999] bg-[#E8E8E8]' : 'border-[#D8D8D8]'}`}>
                  <div>
                    <div className="text-[9px] font-semibold text-[#666666] leading-tight">{d.getMonth()+1}/{d.getDate()}</div>
                    <div className="text-[7px] text-[#AAAAAA] leading-tight">{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                  </div>
                  {i === 6 ? <span className="ml-auto text-[8px] px-1 py-px rounded-full bg-[#CCCCCC] text-[#888888] font-bold">12</span>
                   : i === 3 ? <span className="ml-auto text-[8px] px-1 py-px rounded-full bg-[#E0E0E0] text-[#888888] font-bold">3</span>
                   : <span className="ml-auto text-[8px] text-[#DDDDDD]">-</span>}
                </div>
              );
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-[#666666] mb-2">5月20日（周三）· 12 笔合约到期</div>
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="rounded-md border border-[#D8D8D8] bg-[#F5F5F5] px-1.5 py-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-semibold text-[#666666]">标的{i}</span>
                    {i === 1 && <span className="text-[7px] px-0.5 py-px rounded font-bold bg-[#CCCCCC] text-white">行权</span>}
                  </div>
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-[#888888]">+150,000 CNY</span>
                    <span className="text-[10px] font-bold text-[#888888]">
                      <span className="text-[7px] text-[#AAAAAA] font-normal">预期收益率</span> +12.50%
                    </span>
                  </div>
                  <div className="text-[7px] text-[#AAAAAA] mb-0.5">代码</div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">对手</span>
                    <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">结构</span>
                    <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">强制</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#E8E8E8] text-[8px] text-[#BBBBBB] flex gap-3">
          <span>● 亚丁</span><span>▸ 强制敲出</span><span>▼ 协商敲出</span><span>行权 可申请行权</span><span className="ml-auto">点击卡片 → 持仓详情</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0D1117]">近30日到期日历</span>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border border-[#F97316] text-[#F97316] bg-[#FFF7ED] hover:bg-[#FED7AA] transition-colors"
          >
            <ArrowUp size={10} />
            近7天
          </button>
        </div>
        <span className="text-[10px] text-[#9CA3AF]">
          {today.getMonth() + 1}/{today.getDate()} → {allDays[29].date.getMonth() + 1}/{allDays[29].date.getDate()}
        </span>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex gap-0 min-h-0">
        {/* 左侧滚动日期栏 */}
        <div ref={scrollRef} className="w-[92px] flex-shrink-0 flex flex-col gap-0.5 px-2 pt-1 pb-1.5 border-r border-[#F3F4F6] overflow-y-auto overflow-x-hidden max-h-[244px]">
          {allDays.map((day, idx) => {
            const count = day.positions.length;
            const isSel = idx === selectedIdx;
            const inNear7 = idx <= 6;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full rounded-md border pl-2 pr-1.5 py-1 flex items-center justify-between transition-colors ${
                  isSel
                    ? 'border-[#F97316] bg-[#FFF7ED]'
                    : day.isToday
                    ? 'border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7]'
                    : day.isWeekend
                    ? 'border-[#F3F4F6] bg-[#F9FAFB] hover:bg-[#F3F4F6]'
                    : inNear7
                    ? 'border-[#F9FAFB] bg-[#FAFAFA] hover:bg-[#F3F4F6]'
                    : 'border-transparent hover:bg-[#F9FAFB]'
                }`}
              >
                <div>
                  <div className={`text-[10px] font-bold leading-tight ${isSel ? 'text-[#F97316]' : day.isToday ? 'text-[#0D1117]' : 'text-[#374151]'}`}>
                    {day.date.getMonth() + 1}/{day.date.getDate()}
                  </div>
                  <div className={`text-[7px] leading-tight ${isSel ? 'text-[#F97316]/70' : day.isWeekend ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}`}>
                    {day.dayOfWeek}
                  </div>
                </div>
                {count > 0 ? (
                  <span className={`size-[16px] inline-flex items-center justify-center text-[8px] rounded-full font-bold flex-shrink-0 ${
                    isSel ? 'bg-[#F97316] text-white'
                    : count >= 3 ? 'bg-[#FEF2F2] text-[#DC2626]'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>{count}</span>
                ) : (
                  <span className="size-[16px] inline-flex items-center justify-center text-[8px] text-[#D1D5DB] flex-shrink-0">-</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 右侧合约卡片区 — 与左侧同高 */}
        <div className="flex-1 flex flex-col min-w-0 px-3 py-2 max-h-[244px]">
          <div className="text-[11px] font-medium text-[#6B7280] mb-1.5 flex-shrink-0">
            {selected.date.getMonth() + 1}月{selected.date.getDate()}日（{selected.dayOfWeek}）
            {selected.positions.length > 0 ? (
              <span className="ml-1 text-[#0D1117]">· {selected.positions.length} 笔合约到期</span>
            ) : (
              <span className="ml-1 text-[#D1D5DB]">· 无到期合约</span>
            )}
          </div>
          {selected.positions.length > 0 ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <ContractCards positions={selected.positions} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] text-[#D1D5DB]">
              该日无到期合约
            </div>
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-[#F3F4F6] text-[9px] text-[#9CA3AF] flex-shrink-0 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1677FF]" />亚丁</span>
        <span className="flex items-center gap-1"><span className="text-[7px] px-1 py-px rounded font-bold bg-[#E53935] text-white">行权</span>可申请行权</span>
        <span className="ml-auto">点击卡片 → 持仓详情</span>
      </div>
    </div>
  );
}
