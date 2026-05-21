import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown,
  Coins, BarChart2,
  Flag, Scissors, Gift, AlertTriangle, PauseCircle, Activity
} from 'lucide-react';
import {
  mockPositions, formatAmount, formatNotional, formatRate, getDaysUntilExpiry, Position,
  getRemainingNotional, addCloseRecord
} from './mockData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

/* =======================================================================
   关键事件记录 — 股价走势图 + 事件标记
   ======================================================================= */
type EventType = '建仓' | '除权除息' | '分红调整' | 'ST记录' | '停牌' | '行权';

// 优先级：数字越小越高
const EVENT_PRIORITY: Record<EventType, number> = {
  建仓: 1,
  停牌: 2,
  ST记录: 3,
  除权除息: 4,
  分红调整: 5,
  行权: 6,
};

interface KeyEvent {
  id: string;
  date: string;
  time?: string;
  type: EventType;
  priority: number;
  title: string;
  description: string;
  extra?: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

const EVENT_STYLE: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  建仓: { icon: Flag, bg: '#eff6ff', color: '#1d4ed8' },
  除权除息: { icon: Scissors, bg: '#fff7ed', color: '#c2410c' },
  分红调整: { icon: Gift, bg: '#f0fdf4', color: '#15803d' },
  ST记录: { icon: AlertTriangle, bg: '#fef2f2', color: '#b91c1c' },
  停牌: { icon: PauseCircle, bg: '#f5f3ff', color: '#6d28d9' },
  行权: { icon: Activity, bg: '#ecfdf5', color: '#065f46' },
};

// 根据持仓数据生成关键事件
function generateEvents(position: Position): KeyEvent[] {
  const events: KeyEvent[] = [];
  const s = new Date(position.startDate);
  const e = new Date(position.expiryDate);
  const add =(id: string, date: string, type: EventType, title: string, desc: string, extra?: string, impact?: KeyEvent['impact']) => {
    events.push({ id, date, type, priority: EVENT_PRIORITY[type], title, description: desc, extra, impact });
  };

  // 1. 建仓（最高优先级）
  add('evt-open', position.startDate, '建仓', '初始建仓',
    `以执行价 ${position.strikePrice.toLocaleString()} 买入 ${position.underlying} ${position.structure} 看涨期权，名义本金 ${(position.notionalCNY / 10000).toFixed(0)}万`,
    `开仓价 ${position.openPrice.toLocaleString()}，期权费率 ${((position.optionPremiumCNY / position.notionalCNY) * 100).toFixed(1)}%`);

  // 2. ST 标记
  if (position.tags.includes('ST')) {
    const stDate = new Date(s.getTime() + 60 * 86400000);
    add('evt-st', stDate.toISOString().slice(0, 10), 'ST记录', '标的被 ST 处理',
      `${position.underlying}因触发风险警示条件，被交易所实施 ST（特别处理）`,
      '持仓估值需重新评估，关注退市风险', 'negative');
  }

  // 3. 停牌
  if (position.tags.includes('停牌')) {
    const haltDate = new Date(e.getTime() - 10 * 86400000);
    add('evt-halt', haltDate.toISOString().slice(0, 10), '停牌', '标的临时停牌',
      `${position.underlying}因重大事项临时停牌，期间无法交易`,
      '关注复牌公告及后续安排', 'negative');
  }

  // 4. 除权除息
  if (position.tradingRules.dividendRule) {
    const exDivDate = new Date(s.getTime() + (e.getTime() - s.getTime()) * 0.65);
    add('evt-exdiv', exDivDate.toISOString().slice(0, 10), '除权除息', '除权除息调整',
      '标的实施除权除息，持仓数量及成本价已同步调整');
  }

  // 5. 分红调整 — 故意与除权除息放在同一天，制造事件重叠
  if (position.tradingRules.dividendRule) {
    const exDivDate = new Date(s.getTime() + (e.getTime() - s.getTime()) * 0.65);
    add('evt-dividend', exDivDate.toISOString().slice(0, 10), '分红调整', '分红派息调整',
      `${position.underlying}实施分红预案，根据合约条款对持仓进行调整`,
      '持仓份额按分红比例调整，名本不变');
  }

  // 6. 行权
  if (position.status === 'profitable-exercisable' || position.status === 'loss-exercisable') {
    add('evt-exercise', '2026-05-14', '行权',
      position.status === 'profitable-exercisable' ? '可行权且盈利' : '可行权但亏损',
      `市价 ${position.currentPrice.toLocaleString()}，执行价 ${position.strikePrice.toLocaleString()}，处于${position.status === 'profitable-exercisable' ? '深度实值' : '虚值'}可行权状态`,
      `预估${position.status === 'profitable-exercisable' ? '收益' : '亏损'} ${(Math.abs(position.pnlCNY) / 10000).toFixed(0)}万`,
      position.status === 'profitable-exercisable' ? 'positive' : 'negative');
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

function KeyEventsTimeline({ position }: { position: Position }) {
  const ALL_TYPES: EventType[] = ['建仓', '除权除息', '分红调整', 'ST记录', '停牌', '行权'];
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
                  <div className="text-[10px] text-[#6b7280] leading-relaxed">{evt.description}</div>
                  {evt.extra && <div className="mt-0.5 text-[10px] text-[#475569]">{evt.extra}</div>}
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
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f3f4f6] overflow-x-auto">
          {filteredEvents.map(evt => {
            const cfg = EVENT_STYLE[evt.type];
            const isSelected = selectedEvent?.id === evt.id;
            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEvent(isSelected ? null : evt)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors shrink-0 ${
                  isSelected ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-[#9ca3af]">{evt.date}</span>
                <span className="font-medium" style={{ color: cfg.color }}>{evt.type}</span>
                <span className="text-[#6b7280] truncate max-w-[80px]">{evt.title}</span>
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
              <div className="text-[10px] text-[#6b7280] leading-relaxed">{selectedEvent.description}</div>
              {selectedEvent.extra && <div className="mt-1 text-[10px] text-[#475569]">{selectedEvent.extra}</div>}
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

  const days = getDaysUntilExpiry(position.expiryDate);
  const isRise = position.priceDiff >= 0;
  const isProfit = position.pnlCNY >= 0;
  const todayStr = '2026-05-14';
  const todayEvents = useMemo(() => generateEvents(position).filter(e => e.date === todayStr), [position]);
  const todayDate = '2026-05-20';
  const [closeTarget, setCloseTarget] = useState(false);
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

  // 交易规则标签
  const ruleLabel = position.tradingRules.expiryRule.includes('美式') ? '美式'
    : position.tradingRules.exerciseRule.includes('T+5') ? '欧式'
    : position.tradingRules.exerciseRule.includes('T+3') ? '欧式'
    : position.tradingRules.exerciseRule.includes('T+2') && position.tradingRules.expiryRule.includes('自动') ? '美式'
    : '欧式';

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
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(edits[field] ?? value));
    if (!isNonAden) return <span className={className} style={style}>{value}{suffix}</span>;
    if (editing) {
      return (
        <span className="flex items-center gap-1">
          <input
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => {
              setEdits(prev => ({ ...prev, [field]: isNaN(Number(val)) ? val : Number(val) }));
              setEditing(false);
            }}
            onKeyDown={e => { if (e.key === 'Enter') { setEdits(prev => ({ ...prev, [field]: isNaN(Number(val)) ? val : Number(val) })); setEditing(false); } }}
            className="text-xs border border-[#1677FF] rounded px-1 py-0 focus:outline-none"
            style={{ width: 80, ...style }}
            autoFocus
          />
          {suffix && <span className="text-xs text-[#6B7280] whitespace-nowrap">{suffix}</span>}
        </span>
      );
    }
    return (
      <span
        className={`${className} cursor-pointer hover:bg-[#EFF6FF] hover:text-[#1677FF] rounded px-1 -mx-1 transition-colors border-b border-dashed border-transparent hover:border-[#1677FF]`}
        style={style}
        onClick={() => { setVal(String(edits[field] ?? value)); setEditing(true); }}
      >
        {edits[field] !== undefined ? String(edits[field]) : value}{suffix}
      </span>
    );
  }

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
                  <h1 className="text-xl font-semibold text-[#0d1117]">{position.underlying}</h1>
                  <span className="text-xs text-[#9ca3af]">{position.code}</span>
                  {todayEvents.map(evt => {
                    const cfg = EVENT_STYLE[evt.type];
                    return (
                      <span key={evt.id} className="px-2 py-0.5 rounded text-[10px] font-medium border"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}>
                        {evt.type}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[28px] font-bold" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>{position.currentPrice.toFixed(2)}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>
                        {isRise ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{formatRate(position.priceDiff)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>交易对手 <strong className="text-[#0d1117]">{position.counterpartyFullName}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] text-[#9ca3af]">数据更新 2026-05-14 15:00</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-xs text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                <RefreshCw size={13} />
                刷新
              </button>
              {position.counterparty === '亚丁' ? (
                <>
                  <span className="px-2 py-1 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20">亚丁</span>
                  {(position.status === 'profitable-exercisable' || position.status === 'loss-exercisable') && (
                    <button className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      position.status === 'profitable-exercisable'
                        ? 'bg-[#E53935] text-white hover:bg-[#C62828]'
                        : 'bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D1D5DB]'
                    }`}>
                      申请行权
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="px-2 py-1 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">非亚丁</span>
                  {position.status === 'not-expired' && (
                    <button onClick={() => setCloseTarget(true)} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#1677FF] text-white hover:bg-[#0E5FCC] transition-colors">
                      手动平仓
                    </button>
                  )}
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
              { label: '预估净收益', value: <>{formatAmount(position.pnlCNY, cur)} {cur}</>, sub: formatRate(position.returnRate), icon: TrendingUp, color: '#dc2626', bg: '#fef2f2', pos: isProfit },
              { label: '持仓估值', value: <>{formatAmount(position.valuationCNY, cur)} {cur}</>, sub: `${formatNotional(position.notionalCNY, cur)} 名本`, icon: BarChart2, color: '#1d4ed8', bg: '#eff6ff', pos: null },
              { label: '期权费', value: <>{formatAmount(position.optionPremiumCNY, cur)} {cur}</>, sub: `费率 ${((position.optionPremiumCNY / position.notionalCNY) * 100).toFixed(1)}%`, icon: Coins, color: '#6d28d9', bg: '#f5f3ff', pos: null },
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
                    <div className="text-[11px] mt-0.5" style={{ color: m.pos !== null ? (isProfit ? '#f87171' : '#34d399') : '#9ca3af' }}>
                      {m.sub}
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
          <KeyEventsTimeline position={position} />

          {/* === 模块二：持仓明细 === */}
          <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf0]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#1d4ed8] to-[#60a5fa]" />
                <h2 className="text-sm font-semibold text-[#0d1117]">持仓明细</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#eff6ff] text-[#1d4ed8]">1 笔</span>
              </div>
            </div>

            {/* 卡片式持仓详情 */}
            <div className="p-6 space-y-5">
              {/* 标签行 */}
              <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-[#f3f4f6]">
                <span className="text-sm font-semibold text-[#0d1117] mr-2">{position.underlying}</span>
                <span className="text-xs text-[#9ca3af]">{position.code} · {position.market}</span>
                <span className="w-px h-4 bg-[#e8ecf0] mx-1" />
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#eff6ff] text-[#1677ff]">{position.structure}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${position.tradeType === '看涨期权' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a]'}`}>{position.tradeType}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#f3f4f6] text-[#6b7280]">{position.term}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#f8fafc] text-[#6b7280] border border-[#e5e7eb]">{ruleLabel}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f0fdf4] text-[#15803d]">{position.counterparty}</span>
              </div>

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
                          {days >= 0 && days <= 7 && <span className="ml-1 text-[9px]">({days}天)</span>}
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

                {/* 列2：本金与数量 */}
                <div>
                  <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">本金与数量</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">开仓名本</span>
                      <EditableValue field="openNotionalCNY" value={(position.openNotionalCNY / 10000).toFixed(0)} className="font-medium text-[#0d1117]" suffix="万" />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">持仓名本</span>
                      <span className="font-medium text-[#0d1117]">{(getRemainingNotional(position) / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">期权数量</span>
                      <EditableValue field="optionQty" value={position.optionQty.toLocaleString()} className="font-medium text-[#0d1117]" />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">期权费</span>
                      <EditableValue field="optionPremiumCNY" value={position.optionPremiumCNY.toLocaleString()} className="font-medium text-[#0d1117]" suffix={` ${cur}`} />
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
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">当前市价</span>
                      <EditableValue field="currentPrice" value={position.currentPrice.toFixed(2)} className="font-semibold whitespace-nowrap" suffix={` ${cur}`} style={{ color: isRise ? '#dc2626' : '#16a34a' }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">当前涨幅</span>
                      <span className="font-semibold" style={{ color: isRise ? '#dc2626' : '#16a34a' }}>{formatRate(position.priceDiff)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">盈亏平衡点</span>
                      <EditableValue field="breakEvenPrice" value={position.breakEvenPrice.toFixed(2)} className="font-medium text-[#0d1117] whitespace-nowrap" suffix={` ${cur}`} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">距平衡点</span>
                      <span className="font-medium" style={{ color: position.breakevenDiff >= 0 ? '#dc2626' : '#16a34a' }}>
                        {formatRate(position.breakevenDiff)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 交易规则 — 仅亚丁 */}
              {position.counterparty === '亚丁' && (
              <div className="pt-4 border-t border-[#f3f4f6]">
                <h4 className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">交易规则</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#9ca3af]">敲出规则</span>
                    <span className={`font-medium text-right ${position.tradingRules.knockoutRule?.includes('协商') ? 'text-[#1677ff]' : 'text-[#b45309]'}`}>
                      {position.tradingRules.knockoutRule}
                    </span>
                  </div>
                  {position.tradingRules.negotiationPlan && position.tradingRules.knockoutRule?.includes('协商') && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9ca3af]">协商方案</span>
                      <span className="font-medium text-[#0d1117] text-right max-w-[60%]">{position.tradingRules.negotiationPlan}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#9ca3af]">分红规则</span>
                    <span className="font-medium text-[#0d1117] text-right max-w-[60%]">
                      {position.tradingRules.dividendRule?.includes('提前行权扣分红') ? '分红不调整且提前行权扣分红' : position.tradingRules.dividendRule}
                    </span>
                  </div>
                </div>
              </div>
              )}
            </div>
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
                  <span className="ml-2 text-[#1677FF]">剩余名本 {(remaining).toFixed(0)}万</span>
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
        </div>
      </div>
    </div>
  );
}
