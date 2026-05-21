import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Search } from 'lucide-react';
import { mockPositions, convertCurrency, formatAmount } from './mockData';

interface ScenarioSimulatorProps {
  wireframe?: boolean;
  positionId?: string;
}

const FIXED_POINTS = [0.1, 0.05, 0, -0.05, -0.1] as const;

function calcPnl(position: typeof mockPositions[0], priceChangePct: number): number {
  const newPrice = position.currentPrice * (1 + priceChangePct);
  if (newPrice <= position.strikePrice) {
    return -position.optionPremiumCNY;
  }
  const gain = (newPrice - position.strikePrice) * (position.notionalCNY / position.strikePrice);
  return gain - position.optionPremiumCNY;
}

const CUR_SYMBOL: Record<string, string> = { CNY: '¥', USD: '$', HKD: 'HK$' };

const candidates = mockPositions.filter(p => p.status !== 'closed' && p.status !== 'expired');

export function ScenarioSimulator({ wireframe = false, positionId }: ScenarioSimulatorProps) {
  const fixedId = positionId;
  const [selectedId, setSelectedId] = useState(fixedId ?? candidates[0]?.id ?? '');
  const [sliderValue, setSliderValue] = useState(0);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fixedId) setSelectedId(fixedId);
  }, [fixedId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = mockPositions.find((p) => p.id === selectedId) ?? candidates[0];
  if (!selected) return null;
  const cur = selected.currency;
  const sliderPnl = calcPnl(selected, sliderValue / 100);

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
        <div className="text-[11px] font-semibold text-[#444444] mb-3">持仓盈亏情景模拟</div>

        <div className="mb-3">
          <div className="h-7 border border-[#CCCCCC] rounded bg-[#F5F5F5] flex items-center px-2">
            <div className="w-3 h-3 bg-[#D0D0D0] rounded-sm flex-shrink-0 mr-1.5" />
            <span className="text-[9px] text-[#999999]">已选中：¥标的名称 (代码)</span>
          </div>
          <div className="text-[8px] text-[#BBBBBB] mt-0.5">可搜索下拉，币种前缀 ¥/$/HK$</div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded border border-[#CCCCCC] bg-[#F5F5F5] flex items-center justify-center text-[#888888] text-[10px]">−</div>
            <div className="flex-1 h-2 bg-[#DCDCDC] rounded-full relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#BBBBBB]" />
            </div>
            <div className="w-5 h-5 rounded border border-[#CCCCCC] bg-[#F5F5F5] flex items-center justify-center text-[#888888] text-[10px]">+</div>
          </div>
          <div className="flex justify-between text-[8px] text-[#BBBBBB]">
            <span>-100%</span><span>当前市价 (0%)</span><span>+100%</span>
          </div>
          <div className="text-center text-[9px] text-[#999999] mt-1">模拟价格 · 预估盈亏</div>
        </div>

        <div>
          <div className="text-[9px] font-medium text-[#777777] mb-1.5">固定场景模拟（与拉杆独立）</div>
          <div className="space-y-1">
            {['+10%', '+5%', '当前', '-5%', '-10%'].map((label) => (
              <div key={label} className="flex items-center justify-between rounded px-2.5 py-1.5 bg-[#F5F5F5]">
                <span className="text-[9px] text-[#777777]">{label}</span>
                <div className="h-3 bg-[#E0E0E0] rounded w-20" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto text-[8px] text-[#BBBBBB] text-center pt-2 border-t border-[#E8E8E8]">
          模拟结果仅供参考，实际盈亏以行权/平仓时市场价格和交易规则为准
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] p-2.5 shadow-sm flex flex-col h-full">
      <div className="text-sm font-semibold text-[#0D1117] mb-3">持仓盈亏情景模拟</div>

      {/* 可搜索的持仓选择器 — 仅在非固定模式下显示 */}
      {!fixedId && (
      <div className="mb-4 relative" ref={containerRef}>
        <div
          className="flex items-center border border-[#E5E7EB] rounded-lg bg-white cursor-pointer focus-within:border-[#1677FF]"
          onClick={() => setOpen(true)}
        >
          <Search size={13} className="ml-2.5 text-[#9CA3AF] flex-shrink-0" />
          <input
            type="text"
            placeholder="搜索标的名称/代码"
            value={open ? search : `${CUR_SYMBOL[selected.currency]}${selected.underlying} (${selected.code})`}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); setSearch(''); }}
            className="flex-1 px-2 py-2 text-xs bg-transparent focus:outline-none text-[#374151]"
            readOnly={!open}
          />
          {open && (
            <span className="text-[10px] text-[#9CA3AF] mr-2.5 flex-shrink-0">
              {filtered.length} 个结果
            </span>
          )}
        </div>
        {open && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[#9CA3AF] text-center">无匹配结果</div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center px-3 py-2 cursor-pointer text-xs hover:bg-[#F9FAFB] ${
                    p.id === selectedId ? 'bg-[#EFF6FF]' : ''
                  }`}
                  onClick={() => { setSelectedId(p.id); setOpen(false); setSearch(''); }}
                >
                  <span className="text-[#9CA3AF] w-8 flex-shrink-0">{CUR_SYMBOL[p.currency]}</span>
                  <span className="text-[#374151] font-medium">{p.underlying}</span>
                  <span className="text-[#9CA3AF] ml-1">({p.code})</span>
                  <span className="text-[#9CA3AF] ml-auto text-[10px]">到期 {p.expiryDate}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      )}
      {/* 固定模式：仅显示当前标的 */}
      {fixedId && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
          <span className="text-[#9CA3AF] text-xs">{CUR_SYMBOL[selected.currency]}</span>
          <span className="text-[#374151] text-xs font-medium">{selected.underlying}</span>
          <span className="text-[#9CA3AF] text-xs">({selected.code})</span>
          <span className="ml-auto text-[10px] text-[#9CA3AF]">到期 {selected.expiryDate}</span>
        </div>
      )}

      {/* 价格拉杆 + ±1% 按钮 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#6B7280]">标的价格变化</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${sliderValue > 0 ? 'text-[#E53935] bg-[#FFF1F0]' : sliderValue < 0 ? 'text-[#059669] bg-[#F0FDF4]' : 'text-[#6B7280] bg-[#F3F4F6]'}`}>
            {sliderValue > 0 ? '+' : ''}{sliderValue}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustByOne(-1)}
            disabled={sliderValue <= -100}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
              className="w-full h-1.5 appearance-none bg-gradient-to-r from-[#059669] via-[#E5E7EB] to-[#E53935] rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #059669 0%, #E5E7EB 50%, #E53935 100%)`,
              }}
            />
          </div>
          <button
            onClick={() => adjustByOne(1)}
            disabled={sliderValue >= 100}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-1">
          <span>-100%</span>
          <span>当前市价 (0%)</span>
          <span>+100%</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[11px] text-[#6B7280]">模拟价格：</span>
          <span className="text-[11px] font-semibold text-[#0D1117]">
            {cur === 'CNY' ? '¥' : cur === 'USD' ? '$' : 'HK$'}{(selected.currentPrice * (1 + sliderValue / 100)).toFixed(2)}
          </span>
          <span className={`ml-2 text-xs font-bold ${sliderPnl >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
            预估盈亏：{formatAmount(convertCurrency(sliderPnl, cur), cur)}
          </span>
        </div>
      </div>

      {/* 固定场景模拟 */}
      <div>
        <div className="text-[10px] font-medium text-[#6B7280] mb-2">固定场景模拟（与拉杆独立）</div>
        <div className="space-y-1">
          {FIXED_POINTS.map((pct) => {
            const pnl = calcPnl(selected, pct);
            const converted = convertCurrency(pnl, cur);
            return (
              <div
                key={pct}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 ${
                  pct === 0 ? 'bg-[#EFF6FF]' : 'bg-[#F9FAFB]'
                }`}
              >
                <span className={`text-[10px] font-medium ${
                  pct === 0 ? 'text-[#1677FF]' : pct > 0 ? 'text-[#E53935]' : 'text-[#059669]'
                }`}>
                  {pct === 0 ? '当前市价' : `${pct > 0 ? '+' : ''}${(pct * 100).toFixed(0)}%`}
                </span>
                <span className={`text-[10px] font-semibold ${pnl >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                  {formatAmount(converted, cur)}
                </span>
              </div>
            );
          })}
          {sliderValue !== 0 && (
            <div className="flex items-center justify-between rounded-md px-3 py-1.5 bg-[#FFFBEB]">
              <span className="text-[10px] font-medium text-[#F59E0B]">
                {sliderValue > 0 ? '+' : ''}{sliderValue}%
              </span>
              <span className={`text-[10px] font-semibold ${sliderPnl >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                {formatAmount(convertCurrency(sliderPnl, cur), cur)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-[#9CA3AF] leading-relaxed text-center mt-auto pt-2">
        以上模拟结果仅供参考，实际盈亏以行权/平仓时的市场价格和交易规则为准
      </div>
    </div>
  );
}
