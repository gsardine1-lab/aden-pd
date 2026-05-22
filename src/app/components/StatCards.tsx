import { useState } from 'react';
import { AlertTriangle, BarChart2, CheckCircle, Clock, TrendingUp, X } from 'lucide-react';
import { Currency, convertCurrency, formatAmount, mockPositions, getDaysUntilExpiry, Position } from './mockData';

interface StatCardsProps {
  wireframe?: boolean;
  filteredPositions?: Position[];
  isFiltered?: boolean;
  onClearFilter?: () => void;
  onFilter?: (partial: Record<string, string>) => void;
}

export function StatCards({ wireframe = false, filteredPositions, isFiltered = false, onClearFilter, onFilter }: StatCardsProps) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('CNY');
  const [pnlCurrency, setPnlCurrency] = useState<Currency>('CNY');

  const positions = filteredPositions ?? mockPositions;
  const allPositions = mockPositions;

  const totalValuationCNY = positions.reduce((sum, p) => sum + p.valuationCNY, 0);
  const totalPnlCNY = positions.reduce((sum, p) => sum + p.pnlCNY, 0);
  const yesterdayValuationCNY = totalValuationCNY * 0.9;
  const overallRate = yesterdayValuationCNY > 0 ? totalPnlCNY / yesterdayValuationCNY : 0;

  const floatingProfit = positions.filter((p) => p.pnlCNY > 0);
  const floatingLoss = positions.filter((p) => p.pnlCNY < 0);
  const floatProfitPct = positions.length > 0 ? floatingProfit.length / positions.length : 0;
  const floatLossPct = positions.length > 0 ? floatingLoss.length / positions.length : 0;
  const totalFloatProfit = floatingProfit.reduce((s, p) => s + p.pnlCNY, 0);
  const totalFloatLoss = floatingLoss.reduce((s, p) => s + p.pnlCNY, 0);

  const nearExpiry = positions.filter((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days >= 0 && days <= 7 && p.status !== 'closed';
  }).length;

  const profitableExercisable = positions.filter((p) => p.status === 'profitable-exercisable').length;

  // Group by native currency
  const cnyTotal = positions.filter((p) => p.currency === 'CNY').reduce((s, p) => s + p.valuationCNY, 0);
  const usdTotal = positions.filter((p) => p.currency === 'USD').reduce((s, p) => s + p.valuationCNY, 0);
  const hkdTotal = positions.filter((p) => p.currency === 'HKD').reduce((s, p) => s + p.valuationCNY, 0);

  if (wireframe) {
    return (
      <div>
        {isFiltered && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-[#F0F0F0] border border-[#CCCCCC] rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-[#888888] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#444444]">
              当前展示统计结果为已选中 {positions.length} 个持仓。
            </span>
            <button className="ml-auto text-[#666666] font-medium border border-[#CCCCCC] rounded-md px-2.5 py-0.5 bg-white text-[10px]">
              清空
            </button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: '持仓总市值', desc: '独立币种切换 · 完整金额 + 缩写预览' },
            { title: '持仓预估净收益（昨日）', desc: '独立币种切换 · 盈红亏绿 · 正负号百分比' },
            { title: '临近到期（≤7天）', desc: '点击弹出持仓列表弹窗' },
            { title: '可行权且盈利', desc: '点击弹出持仓列表弹窗' },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-[#CCCCCC] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-[#666666] font-medium">{card.title}</span>
                <div className="w-5 h-5 rounded bg-[#E8E8E8]" />
              </div>
              <div className="h-7 bg-[#E8E8E8] rounded mb-2" />
              <div className="space-y-1">
                <div className="h-2.5 bg-[#F0F0F0] rounded w-3/4" />
                <div className="h-2.5 bg-[#F0F0F0] rounded w-2/3" />
              </div>
              <div className="mt-2 text-[9px] text-[#999999] border-t border-[#E8E8E8] pt-1">
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 筛选状态提示 */}
      {isFiltered && (
        <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-[#1677FF]/8 border border-[#1677FF]/30 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1677FF] flex-shrink-0" />
          <span className="text-sm font-semibold text-[#0D1117]">
            当前展示<span className="text-[#E53935]">统计结果</span>为已选中 {positions.length} 个持仓。
          </span>
          <button
            onClick={onClearFilter}
            className="ml-auto text-[#1677FF] hover:text-white hover:bg-[#1677FF] font-medium flex items-center gap-1 flex-shrink-0 border border-[#1677FF] rounded-md px-3 py-1 text-xs transition-colors"
          >
            清空
            <X size={12} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* 持仓总市值 — 含币种切换 */}
        <div className="bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <span className={`text-xs font-medium text-[#6B7280]`}>持仓总市值</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#F3F4F6] rounded-lg p-0.5">
                {(['CNY', 'USD', 'HKD'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setDisplayCurrency(c)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                      displayCurrency === c
                        ? 'bg-white text-[#0D1117] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#6B7280]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <TrendingUp size={14} className="text-[#1677FF]" />
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2 break-all">
            <span className="text-2xl font-bold text-[#0D1117]">
              {formatAmount(convertCurrency(totalValuationCNY, displayCurrency), displayCurrency)} {displayCurrency}
            </span>
          </div>
          <div className="flex gap-3 text-[11px] text-[#9CA3AF]">
            <span>CNY {(cnyTotal / 10000).toFixed(0)}万</span>
            <span className="text-[#D1D5DB]">|</span>
            <span>USD {(convertCurrency(usdTotal, 'USD') / 10000).toFixed(0)}万</span>
            <span className="text-[#D1D5DB]">|</span>
            <span>HKD {(convertCurrency(hkdTotal, 'HKD') / 10000).toFixed(0)}万</span>
          </div>
        </div>

        {/* 持仓预估净收益 — 支持币种切换 */}
        <div className="bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#6B7280] font-medium whitespace-nowrap">持仓预估净收益（昨日）</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#F3F4F6] rounded-lg p-0.5">
                {(['CNY', 'USD', 'HKD'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setPnlCurrency(c)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                      pnlCurrency === c
                        ? 'bg-white text-[#0D1117] shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#6B7280]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#FFF1F0] flex items-center justify-center">
                <BarChart2 size={14} className="text-[#E53935]" />
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
            <span className="text-2xl font-bold text-[#E53935] break-all">
              {totalPnlCNY >= 0 ? '+' : ''}{formatAmount(convertCurrency(totalPnlCNY, pnlCurrency), pnlCurrency)} {pnlCurrency}
            </span>
            <span className="text-sm font-medium text-[#E53935] whitespace-nowrap">
              ({overallRate >= 0 ? '+' : ''}{(overallRate * 100).toFixed(2)}%)
            </span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div className="flex items-center gap-2 text-[#E53935]">
              <span className="font-medium">浮盈</span>
              <span>+{formatAmount(convertCurrency(totalFloatProfit, pnlCurrency), pnlCurrency)}</span>
              <span className="text-[#F87171]">({(floatProfitPct * 100).toFixed(0)}%)</span>
              <span className="text-[#FCA5A5]">{floatingProfit.length}个持仓</span>
            </div>
            <div className="flex items-center gap-2 text-[#059669]">
              <span className="font-medium">浮亏</span>
              <span>{formatAmount(convertCurrency(totalFloatLoss, pnlCurrency), pnlCurrency)}</span>
              <span className="text-[#34D399]">({(floatLossPct * 100).toFixed(0)}%)</span>
              <span className="text-[#6EE7B7]">{floatingLoss.length}个持仓</span>
            </div>
          </div>
        </div>

        {/* 临近到期 */}
        <div
          className="bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onFilter?.({ expiryDateFrom: '2026-05-14', expiryDateTo: '2026-05-21' })}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6B7280] font-medium">临近到期（≤7天）</span>
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                <Clock size={14} className="text-[#F97316]" />
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-4xl font-bold text-[#0D1117]">{nearExpiry}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-auto pt-2">
              <span className="text-[#9CA3AF]">{nearExpiry}个持仓</span>
              <span className="inline-flex items-center gap-0.5 text-[#E53935] font-medium">
                <AlertTriangle size={10} />
                风险需关注
              </span>
            </div>
          </div>
        </div>

        {/* 可行权且盈利 */}
        <div
          className="bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onFilter?.({ status: 'profitable-exercisable' })}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6B7280] font-medium">可行权且盈利</span>
              <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                <CheckCircle size={14} className="text-[#16A34A]" />
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-4xl font-bold text-[#0D1117]">{profitableExercisable}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-auto pt-2">
              <span className="text-[#9CA3AF]">{profitableExercisable}个持仓</span>
              <span className="inline-flex items-center gap-0.5 text-[#16A34A] font-medium">
                <CheckCircle size={10} />
                可申请行权
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
