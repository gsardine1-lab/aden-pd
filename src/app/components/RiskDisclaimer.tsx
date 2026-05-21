import { AlertTriangle, TrendingUp, Shield, DollarSign } from 'lucide-react';

export function RiskDisclaimer() {
  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] p-2.5 shadow-sm flex flex-col">
      <div className="text-[11px] font-semibold text-[#0D1117] mb-1">香草期权风险与收益说明</div>
      <div className="space-y-0.5 text-[10px] text-[#6B7280] leading-snug flex-1">
        <div className="flex items-start gap-1">
          <DollarSign size={10} className="text-[#059669] flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-[#374151]">亏损有限：</span>最大亏损为已支付的期权费。</span>
        </div>
        <div className="flex items-start gap-1">
          <TrendingUp size={10} className="text-[#E53935] flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-[#374151]">收益无限：</span>标的上涨空间无限，潜在收益不设上限。</span>
        </div>
        <div className="flex items-start gap-1">
          <Shield size={10} className="text-[#1677FF] flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-[#374151]">无追保风险：</span>买方无需追加保证金。</span>
        </div>
        <div className="flex items-start gap-1">
          <AlertTriangle size={10} className="text-[#F97316] flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-[#374151]">时间价值衰减：</span>临近到期时间价值加速衰减。</span>
        </div>
        <div className="flex items-start gap-1">
          <AlertTriangle size={10} className="text-[#9CA3AF] flex-shrink-0 mt-0.5" />
          <span><span className="font-medium text-[#374151]">情景模拟免责：</span>结果仅供参考，不构成投资建议。</span>
        </div>
      </div>
      <div className="text-[9px] text-[#9CA3AF] mt-1 pt-1 border-t border-[#F3F4F6]">
        以上说明不构成投资建议，投资有风险，入市需谨慎。
      </div>
    </div>
  );
}
