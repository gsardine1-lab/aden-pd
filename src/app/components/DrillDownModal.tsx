import { Link } from 'react-router';
import { X, ExternalLink } from 'lucide-react';
import { Position, convertCurrency, formatAmount, formatNotional, formatRate, getDaysUntilExpiry } from './mockData';

interface DrillDownModalProps {
  open: boolean;
  title: string;
  positions: Position[];
  onClose: () => void;
  overriddenStatuses?: Record<string, Position['status']>;
}

interface RuleTag {
  label: string;
  type: 'dividend-adjust' | 'dividend-none' | 'dividend-deduct' | 'dividend-deduct-warn' | 'knockout-forced' | 'knockout-negotiated';
}

function getRuleTags(p: Position): RuleTag[] {
  const tags: RuleTag[] = [];
  if (p.tradingRules.knockoutRule?.includes('协商')) {
    tags.push({ label: '协商敲出', type: 'knockout-negotiated' });
  } else {
    tags.push({ label: '强制敲出', type: 'knockout-forced' });
  }
  if (p.tradingRules.dividendRule) {
    if (p.tradingRules.dividendRule.includes('提前行权扣分红')) {
      tags.push({ label: '分红不调整', type: 'dividend-none' });
      tags.push({ label: '提前行权扣分红', type: 'dividend-deduct-warn' });
    } else if (p.tradingRules.dividendRule.includes('不调整')) {
      tags.push({ label: '分红不调整', type: 'dividend-none' });
    } else {
      tags.push({ label: '分红调整', type: 'dividend-adjust' });
    }
  }
  return tags;
}

const TAG_COLORS: Record<RuleTag['type'], string> = {
  'dividend-adjust': 'bg-[#EFF6FF] text-[#1677FF] border-[#1677FF]/20',
  'dividend-none': 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
  'dividend-deduct': 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
  'dividend-deduct-warn': 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  'knockout-forced': 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
  'knockout-negotiated': 'bg-[#F9FAFB] text-[#B0B7C3] border-[#E8ECF0]',
};

export function DrillDownModal({ open, title, positions, onClose, overriddenStatuses = {} }: DrillDownModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-[#E8ECF0] w-[1150px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] flex-shrink-0">
          <div>
            <span className="text-base font-bold text-[#0D1117]">{title}</span>
            <span className="ml-2 text-sm text-[#9CA3AF]">共 {positions.length} 个持仓</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 表格 */}
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[1100px] text-xs">
            <thead className="sticky top-0 bg-[#F9FAFB] z-10">
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">标的信息</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">货币</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">交易对手</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">结构</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">状态</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">开仓日 / 到期日</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">名义本金</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">执行价</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">当前市价</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">预估净收益</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">交易规则</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-[#374151] whitespace-nowrap">详情</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-[#9CA3AF]">暂无数据</td>
                </tr>
              ) : (
                positions.map((p) => {
                  const overriddenStatus = overriddenStatuses[p.id];
                  const displayP = overriddenStatus ? { ...p, status: overriddenStatus } : p;
                  const days = getDaysUntilExpiry(displayP.expiryDate);
                  const isExpiringSoon = days >= 0 && days <= 7;
                  const cur = displayP.currency;
                  const ruleTags = getRuleTags(displayP);

                  return (
                    <tr key={displayP.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Link to={`/detail/${displayP.id}`} className="font-semibold text-[#0D1117] hover:text-[#1677FF] transition-colors flex items-center gap-1">
                          {displayP.underlying}
                          <ExternalLink size={10} className="text-[#9CA3AF]" />
                        </Link>
                        <div className="text-[10px] text-[#9CA3AF]">{displayP.code}</div>
                      </td>
                      <td className="px-2 py-2.5 text-[10px] text-[#0D1117] text-center">
                        {displayP.currency}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                          displayP.counterparty === '亚丁'
                            ? 'bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20'
                            : 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                        }`}>
                          {displayP.counterparty}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="text-[11px] font-medium text-[#1677FF] bg-[#EFF6FF] border border-[#1677FF]/20 rounded px-2 py-0.5">
                          {displayP.structure}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        {displayP.counterparty === '亚丁' && displayP.status === 'profitable-exercisable' ? (
                          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#E53935] text-white hover:bg-[#C62828] cursor-pointer transition-colors whitespace-nowrap">申请行权</button>
                        ) : displayP.counterparty === '亚丁' && displayP.status === 'loss-exercisable' ? (
                          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D1D5DB] cursor-pointer transition-colors whitespace-nowrap">申请行权</button>
                        ) : displayP.status === 'profitable-exercisable' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#6B7280] whitespace-nowrap">盈利</span>
                        ) : displayP.status === 'loss-exercisable' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#6B7280] whitespace-nowrap">亏损</span>
                        ) : displayP.status === 'not-expired' ? (
                          displayP.counterparty === '亚丁' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#9CA3AF] whitespace-nowrap" title="尚未进入行权窗口期，暂不可申请行权">未到可行权日</span>
                          ) : (
                            <button className="text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap bg-[#1677FF] text-white hover:bg-[#0E5FCC] cursor-pointer">手动平仓</button>
                          )
                        ) : displayP.status === 'expired' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#FFFBEB] text-[#B45309] whitespace-nowrap">已到期</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#6B7280] whitespace-nowrap">已平仓</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-[#6B7280]">{displayP.startDate}</div>
                        <div className={isExpiringSoon ? 'text-[#E53935] font-bold' : 'text-[#6B7280]'}>
                          {displayP.expiryDate}
                          {isExpiringSoon && <span className="ml-1 text-[9px]">({days}个自然日)</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#374151]">
                        {formatNotional(displayP.notionalCNY, cur)}
                      </td>
                      <td className="px-2 py-2.5 text-[#374151]">
                        {displayP.strikePrice.toLocaleString()}
                      </td>
                      <td className={`px-2 py-2.5 font-medium ${displayP.currentPrice >= displayP.openPrice ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                        {displayP.currentPrice.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className={`font-semibold ${displayP.pnlCNY >= 0 ? 'text-[#E53935]' : 'text-[#059669]'}`}>
                          {displayP.pnlCNY >= 0 ? '+' : ''}{formatAmount(convertCurrency(displayP.pnlCNY, cur), cur, false)}
                        </div>
                        <div className={`text-[10px] ${displayP.returnRate >= 0 ? 'text-[#F87171]' : 'text-[#34D399]'}`}>
                          {formatRate(displayP.returnRate)}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {ruleTags.map((tag) => (
                            <span key={tag.label} className={`text-[9px] border rounded px-1.5 py-0.5 font-medium whitespace-nowrap ${TAG_COLORS[tag.type]}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <Link to={`/detail/${displayP.id}`} className="text-[#1677FF] hover:underline flex items-center gap-0.5 text-[10px] cursor-pointer whitespace-nowrap justify-center">
                          详情
                          <ExternalLink size={10} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF] flex-shrink-0">
          点击标的名称可跳转至持仓详情页
        </div>
      </div>
    </div>
  );
}
