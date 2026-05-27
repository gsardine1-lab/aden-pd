import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, TrendingUp, TrendingDown,
  Coins, BarChart2,
  Flag, Scissors, Gift, AlertTriangle, PauseCircle, Activity
} from 'lucide-react';
import {
  mockPositions, formatAmount, formatRate, formatNotional, getDaysUntilExpiry, Position,
  getRemainingNotional, addCloseRecord, getCloseRecords, CloseRecord
} from './mockData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ScenarioSimulator } from './ScenarioSimulator';

/* =======================================================================
   关键事件记录 — 股价走势图 + 事件标记
   ======================================================================= */
type EventType = '建仓' | '除权除息' | '分红调整' | 'ST记录' | '停复牌' | '行权';

const EVENT_PRIORITY: Record<EventType, number> = {
  建仓: 1, 停复牌: 2, ST记录: 3, 除权除息: 4, 分红调整: 5, 行权: 6,
};

interface KeyEvent {
  id: string; date: string; type: EventType; priority: number; title: string;
  // 建仓 / 行权共用
  orderId?: string;
  // 建仓
  openPrice?: number; openNotional?: number;
  // 除权除息
  dividendPerShare?: number;
  // 分红调整
  adjustedOpenPrice?: number; adjustedStrike?: number;  dividendNoAdjust?: boolean;
  // ST / 停牌
  actionLabel?: string;
  // 行权
  exerciseNotional?: number; exerciseResult?: number;
  exerciseStatus?: '预估' | '已结算' | '未成交';
  exercisePrice?: number;
}

const EVENT_STYLE: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  建仓: { icon: Flag, bg: '#eff6ff', color: '#1d4ed8' },
  除权除息: { icon: Scissors, bg: '#fff7ed', color: '#c2410c' },
  分红调整: { icon: Gift, bg: '#f0fdf4', color: '#15803d' },
  ST记录: { icon: AlertTriangle, bg: '#fef2f2', color: '#b91c1c' },
  停复牌: { icon: PauseCircle, bg: '#f5f3ff', color: '#6d28d9' },
  行权: { icon: Activity, bg: '#ecfdf5', color: '#065f46' },
};

function formatEventLine(label: string, value: string) {
  return <span className="text-[10px]"><span className="text-[#9CA3AF]">{label}：</span><span className="text-[#0D1117] font-medium">{value}</span></span>;
}

function renderEventDetail(evt: KeyEvent): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  const cur = 'CNY';
  switch (evt.type) {
    case '建仓':
      lines.push(formatEventLine('开仓价', `${evt.openPrice?.toLocaleString() ?? '-'} ${cur}`));
      lines.push(formatEventLine('成交名本', `${formatNotional(evt.openNotional ?? 0, cur)}`));
      break;
    case '除权除息':
      lines.push(formatEventLine('每股分红', `${evt.dividendPerShare?.toFixed(2) ?? '-'} ${cur}`));
      break;
    case '分红调整':
      if (evt.dividendNoAdjust) {
        lines.push(<span key="na" className="text-[10px] text-[#6B7280]">分红不调整</span>);
      } else {
        lines.push(formatEventLine('调整后开仓价', `${evt.adjustedOpenPrice?.toLocaleString() ?? '-'} ${cur}`));
        lines.push(formatEventLine('调整后执行价', `${evt.adjustedStrike?.toLocaleString() ?? '-'} ${cur}`));
      }
      break;
    case 'ST记录':
      lines.push(<span key="s" className="text-[10px] font-medium text-[#B91C1C]">{evt.actionLabel}</span>);
      break;
    case '停复牌':
      lines.push(<span key="h" className="text-[10px] font-medium text-[#6D28D9]">{evt.actionLabel}</span>);
      break;
    case '行权': {
      const notional = evt.exerciseNotional ?? 0;
      lines.push(formatEventLine('行权价', `${evt.exercisePrice?.toLocaleString() ?? '-'} ${cur}`));
      if (evt.exerciseStatus === '未成交') {
        lines.push(formatEventLine('行权名本', `${notional}万 ${cur}`));
        lines.push(<span key="s" className="text-[10px] text-[#9CA3AF]">行权未成交</span>);
      } else {
        lines.push(formatEventLine('行权名本', `${notional}万 ${cur}`));
        lines.push(formatEventLine(
          evt.exerciseStatus === '已结算' ? '已结算收益' : '预估收益',
          `${(evt.exerciseResult ?? 0).toLocaleString()} ${cur}`,
        ));
      }
      break;
    }
  }
  if (evt.orderId) {
    lines.push(
      <span key="oid" className="text-[10px] text-[#1677FF] hover:underline cursor-pointer inline-flex items-center gap-0.5" title="跳转订单详情">
        订单号：{evt.orderId}
      </span>
    );
  }
  return lines;
}

function generateEvents(position: Position): KeyEvent[] {
  const s = new Date(position.startDate);
  const e = new Date(position.expiryDate);
  const events: KeyEvent[] = [];

  const add = (evt: KeyEvent) => { events.push(evt); };

  // 1. 建仓
  add({
    id: 'evt-open', date: position.startDate, type: '建仓', priority: 1,
    title: '建仓',
    openPrice: position.openPrice, openNotional: position.openNotionalCNY,
    ...(position.counterparty === '亚丁' ? { orderId: `ORD-${position.id}-OPEN` } : {}),
  });

  // 外部录入 / 无行情数据 → 仅保留建仓和行权，跳过行情相关事件
  const hasMarketData = position.source !== 'external';

  // 2. 除权除息 + 分红调整 — 仅亚丁展示
  if (hasMarketData && position.counterparty === '亚丁' && position.tradingRules.dividendRule) {
    const exDate = new Date(s.getTime() + (e.getTime() - s.getTime()) * 0.6);
    add({
      id: 'evt-exdiv', date: exDate.toISOString().slice(0, 10), type: '除权除息', priority: 4,
      title: '除权除息', dividendPerShare: position.currency === 'HKD' ? 0.75 : 0.50,
    });
    const hasDeduct = position.tradingRules.dividendRule.includes('提前行权扣分红');
    const isNoAdj = position.tradingRules.dividendRule.includes('不调整');
    const divDate = new Date(s.getTime() + (e.getTime() - s.getTime()) * 0.6 + 86400000);
    if (isNoAdj || hasDeduct) {
      add({
        id: 'evt-dividend', date: divDate.toISOString().slice(0, 10), type: '分红调整', priority: 5,
        title: '分红调整', dividendNoAdjust: true,
      });
    } else {
      add({
        id: 'evt-dividend', date: divDate.toISOString().slice(0, 10), type: '分红调整', priority: 5,
        title: '分红调整',
        adjustedOpenPrice: Math.round(position.openPrice * 0.98),
        adjustedStrike: Math.round(position.strikePrice * 0.98),
      });
    }
  }

  // 3. ST 记录
  if (hasMarketData && position.tags.includes('ST')) {
    const stDate1 = new Date(s.getTime() + 40 * 86400000);
    const stDate2 = new Date(s.getTime() + 80 * 86400000);
    add({ id: 'evt-st-1', date: stDate1.toISOString().slice(0, 10), type: 'ST记录', priority: 3, title: 'ST特殊处理', actionLabel: 'ST特殊处理' });
    add({ id: 'evt-st-2', date: stDate2.toISOString().slice(0, 10), type: 'ST记录', priority: 3, title: '解除ST', actionLabel: '解除ST' });
  }

  // 4. 停复牌
  if (hasMarketData && position.tags.includes('停牌')) {
    const haltDate1 = new Date(e.getTime() - 18 * 86400000);
    const haltDate2 = new Date(e.getTime() - 5 * 86400000);
    add({ id: 'evt-halt-1', date: haltDate1.toISOString().slice(0, 10), type: '停复牌', priority: 2, title: '停牌', actionLabel: '停牌' });
    add({ id: 'evt-halt-2', date: haltDate2.toISOString().slice(0, 10), type: '停复牌', priority: 2, title: '复牌', actionLabel: '复牌' });
  }

  // 5. 行权 / 平仓结算
  const isClosedOrExpired = position.status === 'closed' || position.status === 'expired';
  const isExercisable = position.status === 'profitable-exercisable' || position.status === 'loss-exercisable';
  if (isClosedOrExpired || isExercisable) {
    const profit = isClosedOrExpired ? (position.closingPnlCNY ?? position.cumulativePnlCNY) : position.pnlCNY;
    const settleDate = new Date(e.getTime() - 2 * 86400000).toISOString().slice(0, 10);
    if (isClosedOrExpired) {
      // 已平仓/已到期：平仓结算记录（状态=已结算）
      add({
        id: 'evt-exercise', date: settleDate, type: '行权', priority: 5,
        title: profit >= 0 ? '平仓结算（盈利）' : '平仓结算（亏损）',
        ...(position.counterparty === '亚丁' ? { orderId: `EXE-${position.id}-001` } : {}),
        exerciseNotional: (position.notionalCNY / 10000),
        exerciseResult: profit, exerciseStatus: '已结算', exercisePrice: position.strikePrice,
      });
    } else if (position.status === 'profitable-exercisable') {
      add({
        id: 'evt-exercise', date: '2026-05-14', type: '行权', priority: 5,
        title: '行权（已结算）', ...(position.counterparty === '亚丁' ? { orderId: `EXE-${position.id}-001` } : {}),
        exerciseNotional: position.exercisingNotionalCNY ?? Math.round(position.notionalCNY * 0.5),
        exerciseResult: Math.round(profit * 0.1), exerciseStatus: '已结算', exercisePrice: position.strikePrice,
      });
      add({
        id: 'evt-exercise-2', date: '2026-05-18', type: '行权', priority: 5,
        title: '行权（预估）', ...(position.counterparty === '亚丁' ? { orderId: `EXE-${position.id}-002` } : {}),
        exerciseNotional: position.exercisingNotionalCNY ?? Math.round(position.notionalCNY * 0.5),
        exerciseResult: Math.round(profit * 0.08), exerciseStatus: '预估', exercisePrice: position.strikePrice,
      });
    } else {
      add({
        id: 'evt-exercise', date: '2026-05-14', type: '行权', priority: 5,
        title: '行权（未成交）', ...(position.counterparty === '亚丁' ? { orderId: `EXE-${position.id}-001` } : {}),
        exerciseNotional: (position.notionalCNY / 10000), exerciseStatus: '未成交', exercisePrice: position.strikePrice,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// 根据持仓动态生成股价数据
function generatePriceData(position: Position, events: KeyEvent[]) {
  const data: { date: string; price: number; priceUp: number | null; priceDown: number | null; up: boolean; event?: KeyEvent; allEvents: KeyEvent[] }[] = [];
  const start = new Date(position.startDate);
  const end = new Date(Math.min(new Date('2026-05-14').getTime(), new Date(position.expiryDate).getTime()));
  const msPerDay = 86400000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);
  if (totalDays <= 0) return data;

  let price = position.openPrice;
  const targetPrice = position.currentPrice;

  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start.getTime() + d * msPerDay);
    const dateStr = date.toISOString().slice(0, 10);
    const drift = 0.0005;
    const change = (Math.sin(d * 7) * 0.008 + Math.sin(d * 13) * 0.004 + (Math.random() - 0.48) * 0.015 + drift);
    // 引导到目标价
    const bias = (targetPrice - price) / (totalDays - d + 1) / price * 0.3;
    const pctChange = change + bias;

    price = Math.round(price * (1 + pctChange));
    if (price < price * 0.6) price = Math.round(price * 0.85);

    const dateEvents = events.filter(e => e.date === dateStr);
    const primaryEvent = dateEvents.length > 0
      ? dateEvents.sort((a, b) => a.priority - b.priority)[0]
      : undefined;
    if (primaryEvent && primaryEvent.type === '建仓') price = position.openPrice;

    const prevPrice = d > 0 ? data[d - 1].price : price;
    const isUp = price >= prevPrice;
    data.push({
      date: dateStr, price,
      priceUp: isUp ? price : null,
      priceDown: !isUp ? price : null,
      up: isUp,
      event: primaryEvent,
      allEvents: dateEvents,
    });
  }
  return data;
}

function KeyEventsTimeline({ position, showMarketData }: { position: Position; showMarketData: boolean }) {
  const ALL_TYPES: EventType[] = ['建仓', '除权除息', '分红调整', 'ST记录', '停复牌', '行权'];
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(ALL_TYPES));
  const [selectedEvent, setSelectedEvent] = useState<KeyEvent | null>(null);

  const events = useMemo(() => generateEvents(position), [position]);
  const priceData = useMemo(() => generatePriceData(position, events), [position, events]);

  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type) && next.size > 1) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredEvents = events.filter(e => activeFilters.has(e.type));

  // 默认展开第一个事件
  useEffect(() => {
    setSelectedEvent(filteredEvents[0] ?? null);
  }, [events]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const allEvts: KeyEvent[] = data.allEvents || (data.event ? [data.event] : []);
      if (allEvts.length > 0) {
        // 按优先级排序
        const sorted = [...allEvts].sort((a, b) => a.priority - b.priority);
        return (
          <div className="bg-white border border-[#e8ecf0] rounded-lg shadow-lg p-3 max-w-[220px] pointer-events-none">
            {sorted.map((evt, i) => {
              const cfg = EVENT_STYLE[evt.type];
              return (
                <div key={evt.id} className={i > 0 ? 'mt-2 pt-2 border-t border-[#f3f4f6]' : ''}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{evt.type}</span>
                    <span className="text-[10px] text-[#9ca3af]">{evt.date}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#0d1117] mb-0.5">{evt.title}</div>
                  <div className="space-y-0.5">{renderEventDetail(evt)}</div>
                </div>
              );
            })}
          </div>
        );
      }
      // 普通价格点的 tooltip
      return (
        <div className="bg-white border border-[#e8ecf0] rounded-lg shadow px-2.5 py-1.5 pointer-events-none">
          <span className="text-[10px] text-[#9ca3af]">{data.date}</span>
          <span className="text-xs font-medium text-[#0d1117] ml-2">{data.price.toLocaleString()}</span>
        </div>
      );
    }
    return null;
  };

  if (!showMarketData) {
    return (
      <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#1d4ed8] to-[#60a5fa]" />
            <h2 className="text-sm font-semibold text-[#0d1117]">关键事件记录</h2>
          </div>
        </div>
        <div className="px-6 py-8 text-center text-xs text-[#9CA3AF]">暂无行情数据，关键事件不可用</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#1d4ed8] to-[#60a5fa]" />
          <h2 className="text-sm font-semibold text-[#0d1117]">关键事件记录</h2>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#eff6ff] text-[#1d4ed8]">{filteredEvents.length} 条</span>
        </div>
        {/* 事件类型筛选 */}
        <div className="flex items-center gap-1 flex-wrap">
          {ALL_TYPES.map(type => {
            const cfg = EVENT_STYLE[type];
            const active = activeFilters.has(type);
            return (
              <button key={type} onClick={() => toggleFilter(type)}
                className="px-2 py-0.5 rounded text-[10px] transition-all"
                style={{
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : '#9ca3af',
                  border: `1px solid ${active ? cfg.color + '40' : '#e5e7eb'}`,
                  opacity: active ? 1 : 0.5,
                }}
              >{type}</button>
            );
          })}
        </div>
      </div>

      {/* 股价走势图 */}
      <div className="px-4 py-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 15, right: 30, left: 70, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e8ecf0' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval={Math.floor(priceData.length / 8)}
              />
              <YAxis
                domain={['dataMin - 40', 'dataMax + 40']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* 执行价参考线 */}
              <ReferenceLine y={position.strikePrice} stroke="#1677ff" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value: `执行价 ${position.strikePrice.toLocaleString()}`, position: 'left', fontSize: 10, fill: '#1677ff', fontWeight: 600 }} />
              {/* 盈亏平衡线 */}
              <ReferenceLine y={position.breakEvenPrice} stroke="#e53935" strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: `平衡点 ${position.breakEvenPrice.toLocaleString()}`, position: 'left', fontSize: 10, fill: '#e53935', fontWeight: 600 }} />
              {/* 事件标记线 + 标签 */}
              {priceData.map((d) => {
                if (!d.event) return null;
                const cfg = EVENT_STYLE[d.event.type];
                const isActive = activeFilters.has(d.event.type);
                if (!isActive) return null;
                const fmtDate = d.date.replace('2026-', '').replace('2025-', '');
                return (
                  <ReferenceLine key={d.event.id} x={d.date} stroke={cfg.color} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 3"
                    label={{ value: fmtDate, position: 'insideTopLeft', fontSize: 10, fill: cfg.color, fontWeight: 600, offset: 5 }}
                  />
                );
              })}
              {/* 连续线 + 涨跌色圆点 */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#374151"
                strokeWidth={1.5}
                dot={(dotProps: any) => {
                  const { cx, cy, index } = dotProps;
                  if (index === undefined || !priceData[index] || (index % 20 !== 0 && !(priceData[index].event && activeFilters.has(priceData[index].event!.type)))) {
                    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
                  }
                  const d = priceData[index];
                  const isEvent = d.event && activeFilters.has(d.event.type);
                  const eventCfg = d.event ? EVENT_STYLE[d.event.type] : null;
                  return (
                    <circle key={`dot-${index}`} cx={cx} cy={cy} r={isEvent ? 9 : 2.5}
                      fill={isEvent ? eventCfg!.color : (d.up ? '#dc2626' : '#16a34a')} stroke="#fff" strokeWidth={2.5}
                      style={{ filter: isEvent ? 'drop-shadow(0 0 5px rgba(0,0,0,0.25))' : 'none' }} />
                  );
                }}
                activeDot={(dotProps: any) => {
                  const { cx, cy, index } = dotProps;
                  if (index === undefined || !priceData[index]) {
                    return <circle cx={cx} cy={cy} r={0} />;
                  }
                  const d = priceData[index];
                  return (
                    <circle cx={cx} cy={cy} r={6}
                      fill={d.up ? '#dc2626' : '#16a34a'} stroke="#fff" strokeWidth={2.5} />
                  );
                }}
              />
              {/* 事件标记点 */}
              {priceData.map((d) => {
                if (!d.event) return null;
                const cfg = EVENT_STYLE[d.event.type];
                const isActive = activeFilters.has(d.event.type);
                if (!isActive) return null;
                return (
                  <circle
                    key={d.event.id}
                    cx={0}
                    cy={0}
                    r={6}
                    fill={cfg.color}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', display: 'none' }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 图例 + 事件摘要 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#f3f4f6]">
          {filteredEvents.map(evt => {
            const cfg = EVENT_STYLE[evt.type];
            const isSelected = selectedEvent?.id === evt.id;
            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEvent(isSelected ? null : evt)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                  isSelected ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-[#9ca3af]">{evt.date.slice(5)}</span>
                <span className="font-medium" style={{ color: cfg.color }}>{evt.type}</span>
              </button>
            );
          })}
        </div>

        {/* 选中事件详情 */}
        {selectedEvent && (() => {
          const cfg = EVENT_STYLE[selectedEvent.type];
          return (
            <div className="mt-3 p-3 rounded-lg border" style={{ background: cfg.bg + '80', borderColor: cfg.color + '30' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>{selectedEvent.type}</span>
                <span className="text-xs font-semibold text-[#0d1117]">{selectedEvent.title}</span>
              </div>
              <div className="space-y-0.5">{renderEventDetail(selectedEvent)}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* =======================================================================
   持仓详情页
   ======================================================================= */
export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const position = mockPositions.find(p => p.id === id);
  const cur = position?.currency ?? 'CNY';

  if (!position) {
    return (
      <div className="flex h-screen bg-[#f4f6f9] items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-[#0d1117] mb-2">持仓不存在</div>
          <button onClick={() => navigate('/')} className="text-[#1677ff] hover:underline text-sm">返回持仓总览</button>
        </div>
      </div>
    );
  }

  const isClosed = position.status === 'closed' || position.status === 'expired';
  const days = getDaysUntilExpiry(position.expiryDate);
  const isRise = position.priceDiff >= 0;
  const isProfit = position.pnlCNY >= 0;
  const todayDate = '2026-05-20';
  const [closeTarget, setCloseTarget] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [closeFormPrice, setCloseFormPrice] = useState('');
  const [closeFormNotional, setCloseFormNotional] = useState('');
  const [closeFormDate, setCloseFormDate] = useState(todayDate);

  // 打开平仓弹窗时重置表单
  useEffect(() => {
    if (closeTarget) {
      setCloseFormPrice('');
      setCloseFormNotional('');
      setCloseFormDate(todayDate);
    }
  }, [closeTarget]);
  const [edits, setEdits] = useState<Record<string, string | number>>({});
  const isNonAden = position.counterparty !== '亚丁';
  const [isEditMode, setIsEditMode] = useState(false);
  const stockKnown = useMemo(() => {
    const u = String(edits['underlying'] ?? position.underlying);
    const c = String(edits['code'] ?? position.code);
    return mockPositions.some(p => p.underlying === u || p.code === c);
  }, [edits, position]);
  const showMarketData = position.source !== 'external' && stockKnown;

  // 自定义标签
  const [positionTags, setPositionTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('positionTags');
      const all = saved ? JSON.parse(saved) : {};
      return all[position.id] || [];
    } catch { return []; }
  });

  const [tagPool, setTagPool] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tagPool');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // 格式化剩余天数
  const remainingLabel = days <= 0 ? '已到期' : `${days} 天`;

  function TagEditor() {
    const [adding, setAdding] = useState(false);
    const [newTag, setNewTag] = useState('');

    const savePosTags = (tags: string[]) => {
      try {
        const saved = localStorage.getItem('positionTags');
        const all = saved ? JSON.parse(saved) : {};
        all[position!.id] = tags;
        localStorage.setItem('positionTags', JSON.stringify(all));
        setPositionTags(tags);
      } catch {}
    };

    // 创建标签：加入标签库 + 自动分配给当前标的
    const createTag = (tag: string) => {
      const t = tag.trim();
      if (!t) return;
      if (!tagPool.includes(t)) {
        const newPool = [...tagPool, t];
        localStorage.setItem('tagPool', JSON.stringify(newPool));
        setTagPool(newPool);
      }
      if (!positionTags.includes(t)) {
        savePosTags([...positionTags, t]);
      }
      setNewTag('');
      setAdding(false);
    };

    // 获取某个标签已应用到哪些标的
    const getTaggedPositions = (tag: string): { id: string; name: string }[] => {
      const result: { id: string; name: string }[] = [];
      const p = position!;
      // 当前标的
      if (positionTags.includes(tag)) result.push({ id: p.id, name: p.underlying });
      // 其他标的
      try {
        const saved = localStorage.getItem('positionTags');
        const all = saved ? JSON.parse(saved) : {};
        Object.keys(all).forEach(id => {
          if (id !== p.id && all[id].includes(tag)) {
            const pos = mockPositions.find(mp => mp.id === id);
            if (pos) result.push({ id, name: pos.underlying });
          }
        });
      } catch {}
      return result;
    };

    // 从标签库删除标签：同时从所有标的中移除
    const deleteFromPool = (tag: string) => {
      const affected = getTaggedPositions(tag);
      let msg: string;
      if (affected.length === 0) {
        msg = `确定删除标签"${tag}"？`;
      } else if (affected.length <= 5) {
        msg = `删除标签"${tag}"将移除以下 ${affected.length} 个标的的标签：\n${affected.map(a => a.name).join('、')}`;
      } else {
        const first3 = affected.slice(0, 3).map(a => a.name).join('、');
        msg = `删除标签"${tag}"将移除 ${affected.length} 个标的的标签（${first3} 等），确定删除？`;
      }
      if (!confirm(msg)) return;
      const newPool = tagPool.filter(t => t !== tag);
      localStorage.setItem('tagPool', JSON.stringify(newPool));
      setTagPool(newPool);
      savePosTags(positionTags.filter(t => t !== tag));
      try {
        const saved = localStorage.getItem('positionTags');
        const all = saved ? JSON.parse(saved) : {};
        Object.keys(all).forEach(id => {
          all[id] = all[id].filter((t: string) => t !== tag);
        });
        localStorage.setItem('positionTags', JSON.stringify(all));
      } catch {}
    };

    // 获取标签使用计数
    const getTagCount = (tag: string): number => {
      let count = positionTags.includes(tag) ? 1 : 0;
      try {
        const saved = localStorage.getItem('positionTags');
        const all = saved ? JSON.parse(saved) : {};
        Object.keys(all).forEach(id => {
          if (id !== position!.id && all[id].includes(tag)) count++;
        });
      } catch {}
      return count;
    };

    const togglePosTag = (tag: string) => {
      if (positionTags.includes(tag)) {
        savePosTags(positionTags.filter(t => t !== tag));
      } else {
        savePosTags([...positionTags, tag]);
      }
    };

    const available = tagPool.filter(t => !positionTags.includes(t));

    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">标签</span>
          {adding ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createTag(newTag); if (e.key === 'Escape') { setAdding(false); setNewTag(''); } }}
                placeholder="新标签名..."
                className="text-[10px] border border-[#1677FF] rounded px-2 py-0.5 w-28 focus:outline-none"
                autoFocus
              />
              <button onClick={() => createTag(newTag)} className="text-[9px] text-[#1677FF] font-medium">确定</button>
              <button onClick={() => { setAdding(false); setNewTag(''); }} className="text-[9px] text-[#9CA3AF]">取消</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="text-[10px] text-[#1677FF] hover:text-[#0E5FCC] font-medium">+ 新建</button>
          )}
          {tagPool.length > 0 && <span className="text-[9px] text-[#9CA3AF]">共 {tagPool.length} 个标签</span>}
        </div>
        {tagPool.length === 0 ? (
          <div className="text-[10px] text-[#B0B7C3]">暂无标签，点击"+ 新建"创建</div>
        ) : (
          <div className="space-y-1.5">
            {positionTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-[#9CA3AF] flex-shrink-0">已添加</span>
                {positionTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-medium border bg-[#1677FF] text-white border-[#1677FF] cursor-pointer select-none"
                    onClick={() => togglePosTag(tag)}>
                    {tag} &times;
                  </span>
                ))}
              </div>
            )}
            {available.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-[#9CA3AF] flex-shrink-0">标签库</span>
                {available.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded font-medium border bg-white text-[#374151] border-[#E5E7EB] hover:border-[#1677FF] hover:text-[#1677FF] cursor-pointer select-none transition-colors"
                    onClick={() => togglePosTag(tag)}>
                    {tag}
                    <span className="text-[8px] text-[#B0B7C3]">{getTagCount(tag)}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteFromPool(tag); }} className="text-[#9CA3AF] hover:text-[#E53935] leading-none" title="从标签库删除">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function RuleNotesEditor() {
    const p = position!;
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(edits['ruleNotes'] ?? p.ruleNotes ?? ''));
    const text = edits['ruleNotes'] !== undefined ? String(edits['ruleNotes']) : (p.ruleNotes || '');

    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">备注</span>
          {!editing && (
            <button
              onClick={() => { setVal(String(edits['ruleNotes'] ?? p.ruleNotes ?? '')); setEditing(true); }}
              className="text-[10px] text-[#1677FF] hover:text-[#0E5FCC] font-medium"
            >
              {text ? '编辑' : '添加备注'}
            </button>
          )}
        </div>
        {editing ? (
          <div>
            <textarea
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="输入备注内容..."
              className="w-full text-xs border border-[#1677FF] rounded-lg px-3 py-2 focus:outline-none resize-none bg-white"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { setEdits(prev => ({ ...prev, ruleNotes: val })); setEditing(false); }}
                className="text-[10px] px-3 py-1 rounded bg-[#1677FF] text-white hover:bg-[#0E5FCC] transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => { setVal(String(edits['ruleNotes'] ?? p.ruleNotes ?? '')); setEditing(false); }}
                className="text-[10px] px-3 py-1 rounded text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          text && (
            <p className="text-[11px] text-[#374151] leading-relaxed bg-[#F9FAFB] rounded-lg px-3 py-2">
              {text}
            </p>
          )
        )}
      </div>
    );
  }

  function EditableValue({ field, value, className = '', suffix = '', style, type = 'text' }: { field: string; value: string | number; className?: string; suffix?: string; style?: React.CSSProperties; type?: string }) {
    const currentVal = edits[field] !== undefined ? String(edits[field]) : String(value);
    if (!isNonAden || !isEditMode) return <span className={className} style={style}>{currentVal}{suffix}</span>;
    return (
      <span className="flex items-center gap-1">
        <input
          type={type}
          value={currentVal}
          onChange={e => setEdits(prev => ({ ...prev, [field]: type === 'text' ? e.target.value : Number(e.target.value) || prev[field] }))}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          onClick={type === 'date' ? (e => { e.preventDefault(); (e.target as HTMLInputElement).showPicker?.(); }) : undefined}
          className={`text-xs border border-[#1677FF] rounded px-1 py-0 focus:outline-none ${type === 'date' ? 'cursor-pointer' : ''}`}
          style={{ width: type === 'text' ? 120 : 80, ...style }}
        />
        {suffix && <span className="text-xs text-[#6B7280] whitespace-nowrap">{suffix}</span>}
      </span>
    );
  }

  // ============================================================
  // 已平仓 / 已到期 — 历史持仓详情
  // ============================================================
  if (isClosed) {
    const rawCloseRecords = getCloseRecords()[position.id] || [];
    // mock 数据中已平仓持仓无预置平仓记录，按对手方类型自动生成一条
    const closeRecords: CloseRecord[] = rawCloseRecords.length > 0
      ? rawCloseRecords
      : [{ id: 'auto-close',
          date: position.counterparty === '亚丁' ? position.expiryDate : new Date(new Date(position.expiryDate).getTime() - 2 * 86400000).toISOString().slice(0, 10),
          price: position.strikePrice,
          notionalCNY: position.openNotionalCNY / 10000,
        }];
    const holdingDays = Math.ceil((new Date(position.expiryDate).getTime() - new Date(position.startDate).getTime()) / 86400000);
    const closeStatusLabel = position.status === 'expired' ? '已到期' : '已平仓';
    const closeStatusColor = position.status === 'expired'
      ? { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }
      : { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    const finalPnl = position.closingPnlCNY ?? position.cumulativePnlCNY;
    const finalReturn = finalPnl / position.openNotionalCNY;

    return (
      <div className="h-screen overflow-y-auto bg-[#f4f6f9]">
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px 40px' }}>

          {/* ===== 头部 ===== */}
          <div className="bg-white rounded-xl mt-6 shadow-sm border border-[#e8ecf0] px-6 py-5">
            <div className="flex items-center gap-2 mb-4 text-xs text-[#9ca3af]">
              <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-[#1677ff] transition-colors">
                <ArrowLeft size={14} />
                <span>持仓管理</span>
              </button>
              <span>/</span>
              <button onClick={() => navigate('/historical')} className="flex items-center gap-1 hover:text-[#1677ff] transition-colors">
                <span>历史持仓</span>
              </button>
              <span>/</span>
              <span className="text-[#6b7280]">持仓详情</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditMode && isNonAden ? (
                    <input value={String(edits['underlying'] ?? position.underlying)} onChange={e => setEdits(prev => ({ ...prev, underlying: e.target.value }))} className="text-xl font-semibold text-[#0d1117] border border-[#1677FF] rounded px-2 py-0 focus:outline-none w-[200px]" />
                  ) : (
                    <h1 className="text-xl font-semibold text-[#0d1117]">{String(edits['underlying'] ?? position.underlying)}</h1>
                  )}
                  {isEditMode && isNonAden ? (
                    <input value={String(edits['code'] ?? position.code)} onChange={e => setEdits(prev => ({ ...prev, code: e.target.value }))} className="text-xs border border-[#1677FF] rounded px-1 py-0 focus:outline-none w-[120px]" />
                  ) : (
                    <span className="text-xs text-[#9ca3af]">{String(edits['code'] ?? position.code)}</span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium border"
                    style={{ background: closeStatusColor.bg, color: closeStatusColor.text, borderColor: closeStatusColor.border }}>
                    {closeStatusLabel}
                  </span>
                  {isNonAden && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                        isEditMode
                          ? 'bg-[#059669] text-white hover:bg-[#047857]'
                          : 'border border-[#D1D5DB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
                      }`}
                    >
                      {isEditMode ? '完成' : '编辑'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#9ca3af]">
                  <span>交易对手 {isEditMode && isNonAden ? (
                    <input value={String(edits['counterparty'] ?? position.counterparty)} onChange={e => setEdits(prev => ({ ...prev, counterparty: e.target.value }))} className="font-semibold text-[#0d1117] border border-[#1677FF] rounded px-1 py-0 focus:outline-none w-[120px]" />
                  ) : (
                    <strong className="text-[#0d1117]">{String(edits['counterparty'] ?? position.counterparty)}</strong>
                  )}</span>
                  <span className="text-[#e8ecf0]">|</span>
                  <span>持有期 <strong className="text-[#0d1117]">{position.startDate} 至 {position.expiryDate}</strong>（{holdingDays} 天）</span>
                  <span className="text-[#e8ecf0]">|</span>
                  <span>{position.structure} · {position.tradeType}</span>
                </div>
              </div>
            </div>

            {/* 核心指标 */}
            <div className="flex items-center mt-4 pt-4 border-t border-[#f3f4f6]">
              {[
                { label: '平仓净收益', value: <>{finalPnl >= 0 ? '+' : ''}{formatAmount(finalPnl, cur, false)} {cur}</>, icon: TrendingUp, color: '#dc2626', bg: '#fef2f2', pos: finalPnl >= 0 },
                { label: '开仓名本', value: <>{formatNotional(position.openNotionalCNY, cur)}</>, icon: BarChart2, color: '#1d4ed8', bg: '#eff6ff', pos: null },
                { label: '总期权费', value: <>{formatAmount(position.optionPremiumCNY, cur, false)} {cur}</>, icon: Coins, color: '#6d28d9', bg: '#f5f3ff', pos: null },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="flex-1 flex items-center gap-3 px-5 group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
                      <Icon size={15} style={{ color: m.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#9ca3af] mb-0.5">{m.label}</div>
                      <div className={`font-bold tracking-tight truncate ${m.pos === null ? 'text-[#0d1117]' : m.pos ? 'text-[#dc2626]' : 'text-[#16a34a]'}`} style={{ fontSize: '1.1rem' }}>
                        {m.value}
                      </div>
                    </div>
                    {i < 2 && <div className="w-px h-12 bg-[#f3f4f6] ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-5 mt-5">
            {/* ===== 平仓记录 ===== */}
            <div id="close-records" data-anchor>
            <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#6d28d9] to-[#a78bfa]" />
                  <h2 className="text-sm font-semibold text-[#0d1117]">平仓记录</h2>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#f5f3ff] text-[#6d28d9]">{closeRecords.length} 笔</span>
                </div>
              </div>
              {closeRecords.length === 0 ? (
                <div className="px-6 py-8 text-center text-xs text-[#9CA3AF]">
                  {position.status === 'expired' ? '该持仓已到期，无平仓操作记录' : '暂无平仓记录'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#6B7280]">#</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#6B7280]">平仓日期</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#6B7280]">平仓价格</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#6B7280]">本次名本（万）</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#6B7280]">累计名本（万）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closeRecords.map((rec: CloseRecord, idx: number) => {
                        const cumulativeNotional = closeRecords.slice(0, idx + 1).reduce((s: number, r: CloseRecord) => s + (r.notionalCNY || 0), 0);
                        return (
                          <tr key={rec.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                            <td className="px-4 py-2.5 text-[#9CA3AF]">{idx + 1}</td>
                            <td className="px-4 py-2.5 text-[#374151]">{rec.date}</td>
                            <td className="px-4 py-2.5 text-right text-[#374151] font-medium">{rec.price.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-[#374151]">{(rec.notionalCNY || 0).toFixed(0)}</td>
                            <td className="px-4 py-2.5 text-right text-[#374151]">{cumulativeNotional.toFixed(0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>

            {/* ===== 持仓概要（只读） ===== */}
            <div id="position-summary" data-anchor>
            <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#1d4ed8] to-[#60a5fa]" />
                  <h2 className="text-sm font-semibold text-[#0d1117]">持仓概要</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">时间信息</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">开仓日</span><span className="font-medium text-[#0d1117]">{position.startDate}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">到期日</span><span className="font-medium text-[#0d1117]">{position.expiryDate}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">持有天数</span><span className="font-semibold text-[#0d1117]">{holdingDays} 天</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">名本与数量</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">开仓名本</span><span className="font-medium text-[#0d1117]">{formatNotional(position.openNotionalCNY, cur)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">期权费</span><span className="font-medium text-[#0d1117]">{position.optionPremiumCNY.toLocaleString()} {cur}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">期权费率</span><span className="font-medium text-[#0d1117]">{((position.optionPremiumCNY / position.openNotionalCNY) * 100).toFixed(1)}%</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">价格信息</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">开仓价</span><span className="font-medium text-[#0d1117]">{position.openPrice.toFixed(2)} {cur}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[#9ca3af]">执行价</span><span className="font-medium text-[#1d4ed8]">{position.strikePrice.toFixed(2)} {cur}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* ===== 关键事件记录 ===== */}
            <KeyEventsTimeline position={position} showMarketData={showMarketData} />

            {position.notes && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-3 text-xs text-[#92400E]">
                <span className="font-semibold">备注：</span>{position.notes}
              </div>
            )}

            <div className="text-[10px] text-[#9ca3af] text-center pb-2">
              以上数据为历史持仓记录，所有盈亏已最终确认
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 未平仓 — 持仓详情（含盈亏模拟器）
  // ============================================================
  return (
    <div className="h-screen overflow-y-auto bg-[#f4f6f9]">
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px 40px' }}>

        {/* ========== 头部：标的信息 ========== */}
        <div className="bg-white border-b border-[#e8ecf0] px-6 py-4 rounded-xl mt-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-xs text-[#9ca3af]">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-[#1677ff] transition-colors">
              <ArrowLeft size={14} />
              <span>持仓管理</span>
            </button>
            <span>/</span>
            <span className="text-[#6b7280]">持仓详情</span>
          </div>

          {/* 第一行：标的信息 + 操作按钮 */}
          <div className="flex items-start justify-between gap-4">
            {/* 左侧：标的信息 */}
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditMode && isNonAden ? (
                    <input value={String(edits['underlying'] ?? position.underlying)} onChange={e => setEdits(prev => ({ ...prev, underlying: e.target.value }))} className="text-xl font-semibold text-[#0d1117] border border-[#1677FF] rounded px-2 py-0 focus:outline-none w-[200px]" />
                  ) : (
                    <h1 className="text-xl font-semibold text-[#0d1117]">{String(edits['underlying'] ?? position.underlying)}</h1>
                  )}
                  {isEditMode && isNonAden ? (
                    <input value={String(edits['code'] ?? position.code)} onChange={e => setEdits(prev => ({ ...prev, code: e.target.value }))} className="text-xs border border-[#1677FF] rounded px-1 py-0 focus:outline-none w-[120px]" />
                  ) : (
                    <span className="text-xs text-[#9ca3af]">{String(edits['code'] ?? position.code)}</span>
                  )}
                  {!isEditMode && <span className="text-[#1677FF] hover:text-[#0E5FCC] cursor-pointer text-xs ml-1">刷新</span>}
                  {!isEditMode && <span className="text-[10px] text-[#9ca3af]">数据更新 2026-05-14 15:00</span>}
                  {isNonAden && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-md font-medium transition-colors ml-1 ${
                        isEditMode
                          ? 'bg-[#059669] text-white hover:bg-[#047857]'
                          : 'border border-[#D1D5DB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
                      }`}
                    >
                      {isEditMode ? '完成' : '编辑'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-2">
                  {showMarketData && (
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] font-bold" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>{position.currentPrice.toFixed(2)}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>
                        {isRise ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{formatRate(position.priceDiff)}</span>
                      </div>
                    </div>
                  </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>交易对手 {isEditMode && isNonAden ? (
                      <input value={String(edits['counterparty'] ?? position.counterparty)} onChange={e => setEdits(prev => ({ ...prev, counterparty: e.target.value }))} className="font-semibold text-[#0d1117] border border-[#1677FF] rounded px-1 py-0 focus:outline-none w-[120px]" />
                    ) : (
                      <strong className="text-[#0d1117]">{String(edits['counterparty'] ?? position.counterparty)}</strong>
                    )}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {position.counterparty === '亚丁' ? (
                <>
                  <span className="px-2 py-1 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20">亚丁</span>
                  {(position.status === 'profitable-exercisable' || position.status === 'loss-exercisable') && (
                    <button className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors bg-[#E53935] text-white hover:bg-[#C62828]">
                      申请行权
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="px-2 py-1 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">非亚丁</span>
                  {(position.status === 'not-expired' || position.status === 'expired') && (
                    <button onClick={() => setCloseTarget(true)} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#1677FF] text-white hover:bg-[#0E5FCC] transition-colors">
                      手动平仓
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(true)} className="text-[10px] text-[#D1D5DB] hover:text-[#E53935] transition-colors ml-2">删除</button>
                </>
              )}
            </div>
          </div>

          {/* 备注 & 标签 */}
          <div className="mt-3 space-y-3">
            <RuleNotesEditor />
            <TagEditor />
          </div>

          {/* 第二行：核心指标 */}
          <div className="flex items-center mt-4 pt-4 border-t border-[#f3f4f6]">
            {[
              { label: '预估净收益', value: <>{formatAmount(position.pnlCNY, cur, false)} {cur}</>, icon: TrendingUp, color: '#dc2626', bg: '#fef2f2', pos: isProfit },
              { label: '持仓估值', value: <>{formatAmount(position.valuationCNY, cur)} {cur}</>, icon: BarChart2, color: '#1d4ed8', bg: '#eff6ff', pos: null },
              { label: '期权费', value: <>{formatAmount(position.optionPremiumCNY, cur, false)} {cur}</>, icon: Coins, color: '#6d28d9', bg: '#f5f3ff', pos: null },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="flex-1 flex items-center gap-3 px-5 group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
                    <Icon size={15} style={{ color: m.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#9ca3af] mb-0.5">{m.label}</div>
                    <div className={`font-bold tracking-tight truncate ${m.pos === null ? 'text-[#0d1117]' : m.pos ? 'text-[#dc2626]' : 'text-[#16a34a]'}`} style={{ fontSize: '1.1rem' }}>
                      {m.value}
                    </div>
                  </div>
                  {i < 2 && <div className="w-px h-12 bg-[#f3f4f6] ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== 两大模块 ========== */}
        <div className="flex flex-col gap-5 mt-5">

          {/* === 模块一：关键事件记录 === */}
          <div id="key-events-timeline" data-anchor>
          <KeyEventsTimeline position={position} showMarketData={showMarketData} />
          </div>

          {/* === 模块二 + 模块三：持仓明细 + 情景模拟（并排） === */}
          <div className={`grid gap-4 ${showMarketData ? 'grid-cols-[3fr_1fr]' : 'grid-cols-1'}`}>
          <div id="position-detail-card" data-anchor className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#1d4ed8] to-[#60a5fa]" />
                <h2 className="text-sm font-semibold text-[#0d1117]">持仓明细</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#eff6ff] text-[#1d4ed8]">1 笔</span>
              </div>
              {isNonAden && (
                <span
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`text-[10px] cursor-pointer hover:underline transition-colors ${
                    isEditMode ? 'text-[#059669]' : 'text-[#9CA3AF] hover:text-[#1677FF]'
                  }`}
                >
                  {isEditMode ? '完成编辑' : '编辑'}
                </span>
              )}
            </div>

            {/* 卡片式持仓详情 */}
            <div className="p-6 space-y-5">
              {/* 三列核心信息 */}
              <div className="grid grid-cols-3 gap-6">
                {/* 列1：时间信息 */}
                <div>
                  <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">时间信息</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">开仓日</span>
                      <EditableValue field="startDate" value={position.startDate} className="font-medium text-[#0d1117]" type="date" />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">到期日</span>
                      {isNonAden ? (
                        <EditableValue field="expiryDate" value={position.expiryDate} className={`font-medium ${days >= 0 && days <= 7 ? 'text-[#e53935]' : 'text-[#0d1117]'}`} type="date" />
                      ) : (
                        <span className={`font-medium ${days >= 0 && days <= 7 ? 'text-[#e53935]' : 'text-[#0d1117]'}`}>
                          {position.expiryDate}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">最早行权日</span>
                      <span className="font-medium text-[#0d1117]">{position.earliestExerciseDate || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">剩余自然日</span>
                      <span className={`font-semibold ${days >= 0 && days <= 7 ? 'text-[#b45309]' : 'text-[#0d1117]'}`}>{remainingLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">剩余交易日</span>
                      <span className={`font-semibold ${days >= 0 && days <= 7 ? 'text-[#b45309]' : 'text-[#0d1117]'}`}>
                        {days <= 0 ? '已到期' : `${Math.round(days * 5 / 7)} 天`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 列2：名本与数量 */}
                <div>
                  <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">名本与数量</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">开仓名本</span>
                      <EditableValue field="openNotionalCNY" value={(position.openNotionalCNY / 10000).toFixed(0)} className="font-medium text-[#0d1117]" suffix={`万 ${cur}`} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">持仓名本</span>
                      <span className="font-medium text-[#0d1117]">{(getRemainingNotional(position) / 10000).toFixed(0)}万 {cur}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">期权费</span>
                      <EditableValue field="optionPremiumCNY" value={position.optionPremiumCNY.toLocaleString()} className="font-medium text-[#0d1117]" suffix={` ${cur}`} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">期权费率</span>
                      <span className="font-medium text-[#0d1117]">{((position.optionPremiumCNY / position.notionalCNY) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* 列3：价格信息 */}
                <div>
                  <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">价格信息</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">开仓价</span>
                      <EditableValue field="openPrice" value={position.openPrice.toFixed(2)} className="font-medium text-[#0d1117] whitespace-nowrap" suffix={` ${cur}`} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">执行价</span>
                      <EditableValue field="strikePrice" value={position.strikePrice.toFixed(2)} className="font-medium text-[#1d4ed8] whitespace-nowrap" suffix={` ${cur}`} />
                    </div>
                    {showMarketData && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">当前市价</span>
                      <EditableValue field="currentPrice" value={position.currentPrice.toFixed(2)} className="font-semibold whitespace-nowrap" suffix={` ${cur}`} style={{ color: isRise ? '#dc2626' : '#16a34a' }} />
                    </div>
                    )}
                    {showMarketData && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">当前涨幅</span>
                      <span className="font-semibold" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>{formatRate(position.priceDiff)}</span>
                    </div>
                    )}
                    {showMarketData && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">盈亏平衡点</span>
                      <EditableValue field="breakEvenPrice" value={position.breakEvenPrice.toFixed(2)} className="font-medium text-[#0d1117] whitespace-nowrap" suffix={` ${cur}`} />
                    </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">距平衡点</span>
                      {showMarketData ? (
                      <span className="font-medium" style={{ color: position.breakevenDiff >= 0 ? '#dc2626' : '#16a34a' }}>
                        {formatRate(position.breakevenDiff)}
                      </span>
                      ) : <span className="font-medium text-[#9CA3AF]">-</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 交易规则 — 仅亚丁，横向卡片 */}
              {position.counterparty === '亚丁' && (
              <div className="pt-4 border-t border-[#f3f4f6]">
                <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">交易规则</h4>
                {(() => {
                  const isNeg = position.tradingRules.knockoutRule?.includes('协商');
                  const hasDed = position.tradingRules.dividendRule?.includes('提前行权扣分红');
                  const isNoD = position.tradingRules.dividendRule?.includes('不调整');
                  type Card = { title: string; color: string; core: string[]; note?: string };
                  const cards: Card[] = [
                    { title: '行权规则', color: '#1d4ed8', core: [position.tradingRules.exerciseRule] },
                    { title: '到期行权规则', color: '#6d28d9', core: [position.tradingRules.expiryRule, '截止 13:50 · 结算 最后一小时Twap'] },
                    isNeg ? {
                      title: '协商敲出', color: '#9CA3AF',
                      core: ['日内振幅（涨/跌）≥30%', '涨跌幅≥30%', '一事一议'],
                      note: position.tradingRules.negotiationPlan,
                    } : {
                      title: '强制敲出', color: '#DC2626',
                      core: ['标的连续3日涨停价收盘', '标的连续3日跌停价收盘'],
                      note: '按敲出当日收盘价平仓结算',
                    },
                    hasDed ? {
                      title: '分红（扣分红）', color: '#D97706',
                      core: ['提前行权扣除对应分红金额'],
                      note: '除权除息日前行权触发',
                    } : isNoD ? {
                      title: '分红（不调整）', color: '#6B7280',
                      core: ['除权除息后不调整开仓价'],
                    } : {
                      title: '分红（调整）', color: '#1677FF',
                      core: ['暂无预期分红，不涉及分红规则'],
                    },
                  ];

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {cards.map((card, i) => (
                        <div key={i} className="rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] px-3 py-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: card.color }} />
                            <span className="text-[10px] font-semibold text-[#6B7280]">{card.title}</span>
                          </div>
                          <div className="space-y-1">
                            {card.core.map((line, j) => (
                              <div key={j} className="flex items-start gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#DC2626] mt-1.5 flex-shrink-0" />
                                <span className="text-[11px] font-semibold text-[#0D1117] leading-relaxed">{line}</span>
                              </div>
                            ))}
                          </div>
                          {card.note && (
                            <p className="mt-1.5 text-[9px] text-[#9CA3AF] leading-relaxed">{card.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              )}
            </div>
          </div>

          {/* === 模块三：持仓盈亏情景模拟 === */}
          {showMarketData && (
          <div id="scenario-simulator" data-anchor className="flex flex-col">
          <ScenarioSimulator positionId={position.id} />
          </div>
          )}
          </div>

          <div className="text-[10px] text-[#9ca3af] text-center pb-2">
            所有盈亏计算均为预估，实际盈亏以最终行权/平仓时的成交价格和交易规则为准
          </div>

          {/* 手动平仓弹窗 */}
          {closeTarget && (() => {
            const remaining = getRemainingNotional(position) / 10000; // 转为万
            const handleConfirmClose = () => {
              const price = Number(closeFormPrice);
              const notional = Number(closeFormNotional);
              if (!price || !notional || !closeFormDate) return;
              addCloseRecord(position.id, {
                id: `cl-${Date.now()}`,
                date: closeFormDate,
                price,
                notionalCNY: notional,
              });
              const newRemaining = remaining - notional;
              if (newRemaining <= 0) {
                // 完全平仓，更新状态
                try {
                  const saved = localStorage.getItem('overriddenStatuses');
                  const all = saved ? JSON.parse(saved) : {};
                  all[position.id] = 'closed';
                  localStorage.setItem('overriddenStatuses', JSON.stringify(all));
                } catch {}
              }
              setCloseTarget(false);
              window.location.reload();
            };
            return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setCloseTarget(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl border border-[#E8ECF0] p-6 w-96">
                <div className="text-sm font-semibold text-[#0D1117] mb-1">手动平仓</div>
                <div className="text-xs text-[#6B7280] mb-1">
                  {position.underlying} ({position.code})
                </div>
                <div className="text-xs text-[#9CA3AF] mb-4">
                  交易对手：{position.counterparty}
                  <span className="ml-2 text-[#1677FF]">剩余名本 {(remaining).toFixed(0)}万 {cur}</span>
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
                      placeholder={remaining > 0 ? `剩余 ${remaining.toFixed(0)}万 ${cur}，可部分平仓` : '已全部平仓'}
                      className="w-full text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#1677FF] bg-white" />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#9CA3AF] mb-0.5 block">平仓日期</label>
                    <input type="date" value={closeFormDate} onChange={e => setCloseFormDate(e.target.value)}
                      onClick={e => { e.preventDefault(); (e.target as HTMLInputElement).showPicker?.(); }}
                      className="w-full text-xs border border-[#E5E7EB] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#1677FF] bg-white cursor-pointer" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCloseTarget(false)}
                    className="flex-1 py-2 text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    取消
                  </button>
                  <button onClick={handleConfirmClose}
                    disabled={!closeFormPrice || !closeFormNotional || !closeFormDate || remaining <= 0}
                    className="flex-1 py-2 text-xs font-medium bg-[#1677FF] text-white rounded-lg hover:bg-[#0E5FCC] disabled:bg-[#B0D0FF] transition-colors">
                    确认平仓
                  </button>
                </div>
              </div>
            </div>
            );
          })()}

          {/* 删除确认弹窗 */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(false)}>
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                <div className="text-sm font-semibold text-[#0D1117] mb-2">确认删除</div>
                <div className="text-xs text-[#6B7280] mb-4">
                  确定要删除「{position.underlying}」的持仓记录吗？此操作无法撤销。
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-xs font-medium text-[#6B7280] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                    取消
                  </button>
                  <button onClick={() => {
                    try {
                      const saved = localStorage.getItem('deletedPositions');
                      const list = saved ? JSON.parse(saved) : [];
                      list.push(position.id);
                      localStorage.setItem('deletedPositions', JSON.stringify(list));
                    } catch {}
                    navigate('/');
                  }} className="px-4 py-2 text-xs font-medium text-white bg-[#E53935] rounded-lg hover:bg-[#C62828] transition-colors">
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
