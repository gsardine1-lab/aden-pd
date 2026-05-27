// ============================================================
// 子页面 — 原型线框图
// 持仓详情 / 录入外部持仓 / 批量导入 / 历史持仓
// 展示完整页面结构、交互层级与状态变化，供 UI 设计师参考
// 所有颜色为占位灰度，设计师自行定义色值规范
// ============================================================

const BORDER = 'border-[#B0B0B0]';
const PAGE_BG = 'bg-[#F0F0F0]';
const DIVIDER = 'border-[#D0D0D0]';
const BLOCK = 'bg-[#D8D8D8]';
const BLOCK_D = 'bg-[#C0C0C0]';
const INPUT_BG = 'bg-[#EAEAEA]';
const BTN_FILL = 'bg-[#B0B0B0]';
const TXT = 'text-[#666]';
const TXT_L = 'text-[#888]';
const TXT_M = 'text-[#555]';

function Block({ w, h = '3' }: { w: string; h?: string }) {
  return <div className={`h-${h} rounded ${BLOCK}`} style={{ width: w }} />;
}

// ============================================================
// 持仓详情 线框图
// ============================================================
export function WireframeDetailPage() {
  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666]">← 返回持仓总览</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========== 开仓视图 ========== */}
          <div className="max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#555] mb-2 px-1">场景一：未平仓持仓详情</div>

            {/* 头部 */}
            <div className={`bg-white border ${BORDER} rounded-lg`}>
              <div className={`px-5 py-4 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-base font-bold text-[#222]">标的名称</span>
                  <span className="text-xs text-[#888] font-mono">代码</span>
                  <span className="text-[#1677FF] hover:underline cursor-pointer text-xs">刷新</span>
                  <span className="text-[10px] text-[#999]">数据更新 2026-05-14 15:00</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666]">状态标签</span>
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#C62828]">¥1,832.50</span>
                    <span className="text-sm text-[#C62828]">+13.12%</span>
                  </div>
                  <span className="text-xs text-[#999]">交易对手 <strong className="text-[#222]">亚丁</strong></span>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">100%Call</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">看涨期权</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">6个月</span>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">亚丁</span>
                </div>
                {/* 核心指标 */}
                <div className="flex items-center mt-4 pt-4 border-t border-[#F0F0F0] gap-4">
                  {['预估净收益：+¥150万 CNY', '持仓估值：¥210万 CNY', '期权费：¥60万 CNY'].map((m, i) => (
                    <div key={i} className="flex-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#E0E0E0]" />
                      <div><div className="text-[10px] text-[#999]">{m.split('：')[0]}</div><div className="font-bold text-[#222] text-sm">{m.split('：')[1]}</div></div>
                      {i < 2 && <div className="w-px h-10 bg-[#E0E0E0] ml-auto" />}
                    </div>
                  ))}
                </div>
                {/* 备注 + 标签 */}
                <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center gap-4 text-[10px]">
                  <span className="text-[#999]">备注: —</span>
                  <span className="text-[#999]">标签:</span>
                  {['停牌', 'ST'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666]">{t} ×</span>
                  ))}
                  <span className="text-[9px] text-[#1677FF]">+ 新建</span>
                  <div className="ml-auto flex gap-2">
                    <div className="px-3 py-1 rounded border border-[#B0B0B0] text-[10px] text-[#666] bg-[#EAEAEA]">申请行权</div>
                  </div>
                </div>
              </div>

              {/* 关键事件记录 */}
              <div className={`px-5 py-4 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded bg-[#C0C0C0]" />
                  <span className="text-xs font-semibold text-[#555]">关键事件记录</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#888]">N 条</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {['建仓', '除权除息', '分红调整', 'ST记录', '停复牌', '行权'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#C0C0C0] bg-[#EAEAEA] text-[#777]">{t}</span>
                  ))}
                </div>
                <div className="h-48 bg-[#ECECEC] rounded flex items-center justify-center">
                  <span className="text-[10px] text-[#999]">股价走势图 + 事件标记线（6 种事件类型 · 无"异动"）</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['05/15 建仓', '03/15 除权除息', '03/16 分红调整', '04/20 ST', '05/10 停复牌', '05/14 行权'].map(e => (
                    <div key={e} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-[#F0F0F0] text-[#888] border border-[#E0E0E0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />{e}
                    </div>
                  ))}
                </div>
                {/* 选中事件详情（默认展开第一条） */}
                <div className="mt-3 p-3 rounded-lg border border-[#D0D0D0] bg-[#F5F5F5]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E0E0E0] text-[#666]">建仓</span>
                    <span className="text-xs font-semibold text-[#444]">建仓</span>
                  </div>
                  <div className="text-[10px] text-[#888] space-y-0.5">
                    <div>开仓价：1,620 CNY</div>
                    <div>成交名本：1,200万 CNY</div>
                    <div className="text-[#1677FF] hover:underline cursor-pointer">订单号：ORD-1-OPEN</div>
                  </div>
                  <div className="mt-1 text-[8px] text-[#AAA]">↑ 默认展开第一个事件 · 点击图例可切换 · 非亚丁不含订单号</div>
                </div>
              </div>

              {/* 持仓明细 + 情景模拟（并排） */}
              <div className="flex gap-4 px-5 py-4 border-b border-[#D0D0D0]">
                {/* 左：持仓明细 */}
                <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded bg-[#C0C0C0]" />
                    <span className="text-xs font-semibold text-[#555]">持仓明细</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#888]">1 笔</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#888]">编辑</span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>时间信息</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓日', '到期日', '最早行权日', '剩余自然日', '剩余交易日'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>名本与数量</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓名本', '持仓名本', '期权费', '期权费率'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>价格信息</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓价', '执行价', '当前市价', '当前涨幅', '盈亏平衡点', '距平衡点'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* 交易规则（仅亚丁） */}
                <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
                  <div className="text-[9px] font-semibold text-[#999] mb-2">交易规则（仅亚丁展示）</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['行权规则', '到期行权规则', '敲出规则（强制/协商）', '分红规则（调整/不调整/扣分红）'].map(r => (
                      <div key={r} className="rounded border border-[#D0D0D0] bg-[#F5F5F5] px-3 py-2 text-[9px] text-[#888]">{r}</div>
                    ))}
                  </div>
                </div>
                </div>

                {/* 右：情景模拟 */}
                <div className="w-1/4 flex-shrink-0">
                <div className="text-xs font-semibold text-[#555] mb-3">持仓盈亏情景模拟</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#999]">标的价格变化</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0F0F0] text-[#777]">0%</span>
                </div>
                <div className="h-2 bg-gradient-to-r from-[#059669] via-[#D0D0D0] to-[#C62828] rounded-full" />
                <div className="flex justify-between text-[8px] text-[#BBB] mt-1"><span>-100%</span><span>当前</span><span>+100%</span></div>
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {['+10%', '+5%', '当前', '-5%', '-10%'].map(l => (
                    <div key={l} className="text-center rounded bg-[#F0F0F0] py-1.5 text-[9px] text-[#888]">{l}</div>
                  ))}
                </div>
                <div className="text-[8px] text-[#BBB] mt-2 text-center">模拟结果仅供参考</div>
                </div>
              </div>
            </div>

            {/* 手动平仓弹窗（非亚丁） */}
            <div className="mt-3 p-3 border border-dashed border-[#B0B0B0] rounded bg-white">
              <div className="text-[9px] font-semibold text-[#666] mb-2">↓ 弹窗：手动平仓（非亚丁持仓触发）</div>
              <div className="border border-[#B0B0B0] rounded-lg p-4 w-80 mx-auto bg-[#F8F8F8]">
                <div className="text-sm font-semibold text-[#555] mb-1">手动平仓</div>
                <div className="text-xs text-[#888]">标的名称（代码）· 剩余名本 X 万</div>
                <div className="space-y-2 mt-3">
                  {['平仓价格', '本次平仓名本（万）', '平仓日期'].map(f => (
                    <div key={f} className="h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center px-2 text-[9px] text-[#999]">{f}</div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 h-7 border border-[#B0B0B0] rounded text-[9px] text-[#777] text-center leading-7">取消</div>
                  <div className="flex-1 h-7 bg-[#B0B0B0] rounded text-[9px] text-[#666] text-center leading-7">确认平仓</div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== 平仓/到期视图 ========== */}
          <div className="max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#555] mb-2 px-1">场景二：已平仓 / 已到期持仓详情</div>

            <div className={`bg-white border ${BORDER} rounded-lg`}>
              <div className={`px-5 py-4 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2 text-xs text-[#999]">
                  <span className="hover:text-[#1677FF] cursor-pointer">持仓管理</span><span>/</span>
                  <span className="hover:text-[#1677FF] cursor-pointer">历史持仓</span><span>/</span><span>持仓详情</span>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-base font-bold text-[#222]">标的名称</span>
                  <span className="text-xs text-[#999] font-mono">代码</span>
                  {/* 无"刷新"按钮、无"数据更新"时间戳 */}
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#F3F4F6] text-[#666]">已平仓 / 已到期</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#999]">
                  <span>交易对手 <strong className="text-[#222]">XXX</strong></span>
                  <span>|</span>
                  <span>持有期 YYYY-MM-DD 至 YYYY-MM-DD（N 天）</span>
                  <span>|</span>
                  <span>结构 · 看涨期权</span>
                </div>
                {/* 核心指标 */}
                <div className="flex items-center mt-4 pt-4 border-t border-[#F0F0F0] gap-4">
                  {['平仓净收益', '开仓名本', '总期权费'].map((m, i) => (
                    <div key={i} className="flex-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#E0E0E0]" />
                      <div><div className="text-[10px] text-[#999]">{m}</div><div className="font-bold text-[#222] text-sm">—</div></div>
                      {i < 2 && <div className="w-px h-10 bg-[#E0E0E0] ml-auto" />}
                    </div>
                  ))}
                </div>
                <div className="text-[8px] text-[#BBB] mt-1">↑ 已去掉"预估"前缀（平仓后收益已确定）· 已去掉"刷新"和行情时间</div>
              </div>

              {/* 平仓记录 */}
              <div className={`px-5 py-4 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 rounded bg-[#C0C0C0]" />
                  <span className="text-xs font-semibold text-[#555]">平仓记录</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#888]">N 笔</span>
                </div>
                <div className="text-[9px] text-[#999]">
                  表格列：# · 平仓日期 · 平仓价格 · 本次名本（万）· 累计名本（万）
                </div>
              </div>

              {/* 持仓概要（只读） */}
              <div className={`px-5 py-4 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 rounded bg-[#C0C0C0]" />
                  <span className="text-xs font-semibold text-[#555]">持仓概要</span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>时间信息</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓日', '到期日', '持有天数'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>名本与数量</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓名本', '期权费', '期权费率'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[9px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>价格信息</div>
                    <div className="space-y-1.5 mt-2">
                      {['开仓价', '执行价'].map(l => (
                        <div key={l} className="flex justify-between text-[10px]"><span className="text-[#999]">{l}</span><span className="text-[#555]">—</span></div>
                      ))}
                    </div>
                    <div className="text-[8px] text-[#BBB] mt-1">↑ 已去掉盈亏平衡点</div>
                  </div>
                </div>
              </div>

              {/* 关键事件记录（同上） */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded bg-[#C0C0C0]" />
                  <span className="text-xs font-semibold text-[#555]">关键事件记录</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#888]">N 条</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {['建仓', 'ST记录', '停复牌', '行权'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#C0C0C0] bg-[#EAEAEA] text-[#777]">{t}</span>
                  ))}
                  <span className="text-[8px] text-[#AAA]">↑ 仅亚丁额外显示：除权除息、分红调整</span>
                </div>
                <div className="h-32 bg-[#ECECEC] rounded flex items-center justify-center">
                  <span className="text-[10px] text-[#999]">时间轴截止到到期日 · 行权事件替换为"平仓结算" · 非亚丁无 orderId · 无"异动"事件</span>
                </div>
                <div className="mt-2 text-[8px] text-[#AAA]">默认展开第一个事件</div>
              </div>
            </div>
          </div>

          {/* ===== 状态变体一览 ===== */}
          <div className="max-w-5xl mx-auto p-4 border border-dashed border-[#B0B0B0] rounded-lg">
            <div className="text-[10px] font-semibold text-[#666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">头部状态标签（5 种）</div>
                <div className="space-y-1.5">
                  {[
                    '盈利可行权（最高强调·红）',
                    '亏损可行权（最高强调·红）',
                    '未到可行权日（普通标签·灰）',
                    '已到期（需视觉区分·黄）',
                    '已平仓（普通标签·灰）',
                  ].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666]">{s.split('（')[0]}</span>
                      <span className="text-[8px] text-[#999]">{s.split('（')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">亚丁 vs 非亚丁 差异</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>亚丁：显示交易规则详情（行权/到期/敲出/分红）</div>
                  <div>非亚丁：不显示交易规则区块</div>
                  <div>亚丁：底部"申请行权"按钮（红）</div>
                  <div>非亚丁：底部"手动平仓"按钮（蓝）</div>
                  <div>非亚丁：开仓/行权事件无 orderId</div>
                  <div>亚丁：关键事件含除权除息+分红调整</div>
                  <div>非亚丁：关键事件不含分红调整类</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">开仓视图 vs 历史视图</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>开仓：有"刷新"按钮 + 数据更新时间</div>
                  <div>历史：无刷新、无行情时间戳</div>
                  <div>开仓：核心指标"预估净收益"+"持仓估值"</div>
                  <div>历史：核心指标"平仓净收益"+"开仓名本"+"总期权费"</div>
                  <div>开仓：价格信息含盈亏平衡点、当前市价、涨幅</div>
                  <div>历史：价格信息仅有开仓价、执行价</div>
                  <div>开仓：有盈亏情景模拟器</div>
                  <div>历史：无盈亏情景模拟器</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">关键事件记录变体</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>事件类型：建仓·除权除息·分红调整·ST记录·停复牌·行权（6种，无异动）</div>
                  <div>外部录入/无行情：仅建仓+行权（跳过行情相关事件）</div>
                  <div>亚丁：完整6种事件 · 含orderId</div>
                  <div>非亚丁：跳过分红调整类 · 无orderId</div>
                  <div>历史持仓：行权→"平仓结算" · 截止到到期日</div>
                  <div>默认行为：展开第一个事件</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#999] text-center pb-2">
            系统仅支持 Call 香草看涨期权 · 所有字段和规则以此为基准
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 录入外部持仓 线框图
// ============================================================
export function WireframeExternalEntryPage() {
  const FieldRow = ({ label, required, hint }: { label: string; required?: boolean; hint?: string }) => (
    <div className="flex items-center py-2">
      <span className="text-[#999] w-[72px] flex-shrink-0 text-[11px]">
        {required && <span className="text-[#888]">*</span>}{label}
      </span>
      <span className="text-[#BBB] text-[11px]">—</span>
      {hint && <span className="text-[#AAA] text-[9px] ml-2">({hint})</span>}
    </div>
  );

  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1280px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666]">← 返回持仓总览</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左栏：文本解析 */}
          <div className="w-[420px] flex-shrink-0 border-r border-[#B0B0B0] bg-white flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="text-base font-bold text-[#444]">录入外部持仓</div>
              <div className="text-[10px] text-[#999] mt-0.5">粘贴期权确认书或交易流水，自动提取结构化数据；也可直接在右侧确认板填写</div>
            </div>
            <div className="flex-1 flex flex-col p-4">
              <div className="flex-1 border border-[#B0B0B0] rounded-lg bg-[#F2F2F2] p-3">
                <div className="text-xs text-[#999] font-mono leading-relaxed">
                  标的名称：贵州茅台<br/>
                  标的代码：600519.SH<br/>
                  交易类型：看涨期权<br/>
                  结构：100%<br/>
                  期限：6个月<br/>
                  交易对手：银河证券<br/>
                  开仓日：2026-05-20<br/>
                  到期日：2026-11-20<br/>
                  开仓名本：500万<br/>
                  开仓价：1620<br/>
                  期权费率：5%
                </div>
              </div>
              <div className="mt-2 text-[10px] text-[#999] leading-relaxed">
                支持识别：标的名称/代码、交易类型、结构、期限、交易对手、名本、开仓价、费率等
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-[#B0B0B0]">
              <div className="w-full py-2.5 bg-[#B0B0B0] text-[#666] text-sm text-center rounded">解析文本</div>
            </div>
          </div>

          {/* 右栏：确认板 */}
          <div className={`flex-1 flex flex-col overflow-hidden ${PAGE_BG}`}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="min-h-full flex flex-col">
                <div className={`bg-white border ${BORDER} rounded-lg overflow-hidden flex flex-col flex-1`}>

                  {/* 头部概要 */}
                  <div className={`px-4 py-2.5 bg-[#F5F5F5] border-b ${DIVIDER} flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#444]">标的名称</span>
                        <span className="text-xs text-[#999] font-mono">代码</span>
                        <span className="text-[8px] text-[#999]">（标的未识别时：名称需最高视觉强调 + ⚠ 提示）</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#B0B0B0] text-[#888]">点击「编辑」进入编辑态</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">结构</span>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">Call 看涨期权</span>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#777]">期限</span>
                    </div>
                  </div>

                  {/* 交易对手 + 标签（同行） */}
                  <div className={`px-4 py-2.5 border-b ${DIVIDER} flex-shrink-0 flex items-center gap-6`}>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-[#777]">交易对手</span>
                      <div className="w-40 h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center px-2.5 text-[10px] text-[#999]">输入或选择 ↓</div>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#777]">银河证券</span>
                      <span className="text-[8px] text-[#999]">↓ 历史下拉（5条）</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[11px] font-semibold text-[#777] flex-shrink-0">标签</span>
                      {['停牌 ×', 'ST ×'].map(t => (
                        <span key={t} className="text-[10px] px-2 py-1 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666]">{t}</span>
                      ))}
                      <span className="text-[10px] px-2 py-1 rounded border border-[#B0B0B0] text-[#B0B0B0]">可选标签</span>
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA]" />
                        <div className="px-2 py-1 rounded bg-[#B0B0B0] text-[9px] text-[#666]">+ 新建</div>
                      </div>
                    </div>
                  </div>

                  {/* 三列字段（标的→结构→期限 | 名本→价格 | 备注） */}
                  <div className={`grid grid-cols-3 divide-x ${DIVIDER} flex-1`}>
                    {/* 列1：标的 → 结构 → 期限 */}
                    <div className="p-4 flex flex-col gap-6">
                      <div>
                        <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>标的</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="标的名称" required />
                          <FieldRow label="标的代码" required />
                          <div className="text-[8px] text-[#999] pl-[72px]">⚠ 未识别标的时显示警告</div>
                        </div>
                      </div>
                      <div>
                        <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>结构</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="结构" required hint="chip：100%/103%/105% + 更多展开" />
                          <FieldRow label="交易类型" hint="Call 看涨期权（固定）" />
                        </div>
                      </div>
                      <div>
                        <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>期限</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="期限" required hint="数字输入+单位下拉(周/月)" />
                          <div className="text-[8px] text-[#999] pl-[72px]">快捷填充：2周 | 1月 | 3月 | 6月 | 12月</div>
                          <FieldRow label="开仓日" required hint="期限联动自动填充" />
                          <FieldRow label="到期日" required hint="期限联动自动填充" />
                          <div className="text-[8px] text-[#999] pl-[72px]">剩余天数自动计算展示</div>
                        </div>
                      </div>
                    </div>

                    {/* 列2：名本 → 价格 */}
                    <div className="p-4 flex flex-col gap-6">
                      <div>
                        <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>名本</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="开仓名本" required hint="万" />
                          <div className="text-[8px] text-[#999] pl-[72px]">快捷填充：100万 | 500万 | 1000万</div>
                          <FieldRow label="期权费率" required hint="%" />
                          <FieldRow label="期权费" required hint="自动：名本×10000×费率÷100" />
                        </div>
                        <div className="text-[8px] text-[#BBB] mt-1">↑ 注意：使用"名本"而非"本金"（金融术语严谨性）</div>
                      </div>
                      <div>
                        <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>价格</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="开仓价" required />
                          <FieldRow label="执行价" required hint="自动：开仓价×结构%" />
                          <div className="text-[8px] text-[#999] pl-[72px]">联动计算：改任一项，关联字段自动更新</div>
                        </div>
                      </div>
                    </div>

                    {/* 列3：备注 */}
                    <div className="p-4">
                      <div className={`text-[10px] font-semibold text-[#999] uppercase tracking-wider border-b ${DIVIDER} pb-1`}>备注</div>
                      <div className="mt-2">
                        <div className="w-full h-28 border border-[#B0B0B0] rounded bg-[#EAEAEA]" />
                        <div className="text-[8px] text-[#999] mt-0.5">多行文本域 · 点击编辑 · 已去掉重复标签</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex-shrink-0 px-4 py-2.5 border-t ${BORDER} bg-white flex items-center gap-4`}>
              <div className="flex-1 py-2.5 border border-[#B0B0B0] rounded text-sm text-center text-[#777]">取消</div>
              <div className="flex-1 py-2.5 bg-[#B0B0B0] rounded text-sm text-center text-[#666]">确认并录入持仓</div>
              <div className="text-[8px] text-[#999]">必填项未填 → 字段闪烁提示（1.2s）· 交易对手自动记录到历史</div>
            </div>

            {/* ===== 状态变体一览 ===== */}
            <div className="p-4 border border-dashed border-[#B0B0B0] rounded-lg mx-4 mb-4">
              <div className="text-[10px] font-semibold text-[#666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555] mb-2">字段交互状态（EditableField）</div>
                  <div className="space-y-1.5 text-[9px] text-[#888]">
                    <div>空字段 → 直接展示输入框（蓝边框）+ placeholder</div>
                    <div>已填字段 → 展示文本，悬停虚线边框，点击进入编辑态</div>
                    <div>编辑态 → 输入框 + ✓✕ 按钮 + 淡蓝背景</div>
                    <div>失焦/Enter → 提交 | Escape/✕ → 取消恢复</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555] mb-2">特殊字段控件</div>
                  <div className="space-y-1.5 text-[9px] text-[#888]">
                    <div>期限：编辑态=数字输入+单位下拉(周/月) | 快捷chips常驻</div>
                    <div>结构：chip选择(100%/103%/105%)+"更多"展开</div>
                    <div>开仓名本：快捷chips(100万/500万/1000万)</div>
                    <div>交易类型：固定"Call 看涨期权"，不可修改</div>
                    <div>交易对手：独立输入框+历史下拉(5条) · 标签同行右侧</div>
                    <div>期权费/执行价：自动计算，黑色文本展示</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555] mb-2">校验与提交</div>
                  <div className="space-y-1.5 text-[9px] text-[#888]">
                    <div>标的有效 → 正常展示，无警告</div>
                    <div>标的无效 → ⚠ 未识别提示 + 名称强调</div>
                    <div>必填齐全+标的有效 → 按钮可点击</div>
                    <div>有未填必填项 → 按钮disabled + 点击闪烁</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555] mb-2">文本解析与布局</div>
                  <div className="space-y-1.5 text-[9px] text-[#888]">
                    <div>文本为空 → 按钮 disabled</div>
                    <div>有文本 → 点击解析 → spinner</div>
                    <div>解析完成 → 非覆盖式填充（仅更新匹配字段）</div>
                    <div>布局：左栏解析 + 右栏确认板 → 交易对手+标签同行 → 三列字段（标的→结构→期限 | 名本→价格 | 备注）</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 批量导入 — 数据审核 线框图
// ============================================================
export function WireframeBatchImportPage() {
  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1280px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center justify-between px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666]">← 返回持仓总览</span>
          <span className="text-lg font-bold text-[#222]">批量导入 — 数据审核</span>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* 上传区域 */}
          <div className="max-w-2xl mx-auto mt-16">
            <div className="border-2 border-dashed border-[#B0B0B0] rounded-lg bg-white p-12 text-center">
              <div className="text-sm font-semibold text-[#555] mb-1">点击上传或拖拽 Excel 文件到此处</div>
              <div className="text-xs text-[#999] mb-4">支持 .xlsx / .xls / .csv 格式</div>
              <div className="inline-block px-6 py-2.5 bg-[#B0B0B0] text-[#666] text-sm rounded">选择文件</div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#999]">
              <span>导入字段：标的名称、标的代码、交易对手、结构、期限、开仓日、到期日、开仓名本(万)、开仓价、执行价、期权费率、期权费</span>
              <span className="text-[#888] ml-4">↓ 下载导入模板</span>
            </div>
          </div>

          {/* 审核列表 */}
          <div className="mt-6 p-4 border border-dashed border-[#B0B0B0] rounded-lg">
            <div className="text-[10px] font-semibold text-[#666] mb-3">↓ 上传后展示：审核列表</div>
            <div className="text-[8px] text-[#BBB] mb-2">
              校验规则（极简）：仅检查必填字段为空 → error · 标的名/代码未识别 → warning · 其余一律不校验<br/>
              编辑后自动重新校验 · 状态实时刷新 · 确认导入后跳转回持仓总览
            </div>
            <div className={`bg-white border ${BORDER} rounded-lg overflow-hidden`}>
              {/* 汇总条 */}
              <div className={`px-4 py-2.5 border-b ${DIVIDER} bg-[#F5F5F5]`}>
                <div className={`flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#555]">文件名.xlsx — 共解析 35 条</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#888]">✓ 30 正常</span>
                      <span className="text-[11px] text-[#888]">△ 2 警告</span>
                      <span className="text-[11px] text-[#C62828]">✕ 3 错误</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#888] underline">重新上传</span>
                </div>
                <div className="text-[11px] text-[#888] mt-1">32 条可导入 — 异常数据将在导入时跳过</div>
              </div>

              {/* 筛选栏 */}
              <div className={`flex items-center justify-between px-4 py-2 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2">
                  {['全部 (35)', '错误 (3)', '警告 (2)', '正常 (30)'].map((tab, i) => (
                    <span key={tab} className={`text-[10px] px-2.5 py-1 rounded border ${BORDER} ${i === 0 ? 'bg-[#C0C0C0] text-[#555]' : 'text-[#888]'}`}>{tab}</span>
                  ))}
                </div>
                <div className="w-48 h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center px-2.5">
                  <span className="text-[11px] text-[#999]">搜索标的/代码/对手</span>
                </div>
              </div>

              {/* 聚合看板 */}
              <div className="px-4 py-3 border-b border-[#D0D0D0] bg-[#F0F0F0]">
                <div className="bg-white rounded-lg border border-[#B0B0B0] shadow-sm overflow-hidden">
                  {/* 看板头部 */}
                  <div className="px-4 py-2.5 border-b border-[#D0D0D0] bg-[#F0F0F0]">
                    <span className="text-xs font-semibold text-[#555]">录入概览</span>
                    <span className="text-[10px] text-[#999] ml-1.5">— 快速校验录入数据</span>
                  </div>

                  {/* 汇总指标 */}
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-4 gap-4">
                      {['总名本', '总期权费', '总持仓数', '涉及机构'].map((label) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#999]">{label}</span>
                          <span className="text-base font-bold text-[#444]">—</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 按交易对手拆分 */}
                  <div className="border-t border-[#D0D0D0]">
                    <div className="px-4 py-2 bg-[#F0F0F0]">
                      <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">按交易对手</span>
                    </div>
                    <div className="px-4 pb-3">
                      <table className="w-full table-fixed text-[11px]">
                        <thead>
                          <tr className="border-b border-[#D0D0D0]">
                            {['交易对手', '笔数', '名本合计(万)', '期权费合计'].map(h => (
                              <th key={h} className={`py-1.5 text-[10px] font-medium text-[#999] ${h === '交易对手' ? 'text-left' : 'text-right'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['银河证券', '中信证券', '华泰证券'].map((cp) => (
                            <tr key={cp} className="border-b border-[#D0D0D0] last:border-b-0">
                              <td className="py-1.5 font-medium text-[#1677FF] hover:underline cursor-pointer">{cp}</td>
                              <td className="py-1.5 text-right text-[#888]">—</td>
                              <td className="py-1.5 text-right text-[#555]">—</td>
                              <td className="py-1.5 text-right text-[#555]">—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="text-[8px] text-[#BBB] mt-1">↑ 按名本合计降序排列 · 点击交易对手可筛选列表</div>
              </div>

              {/* 筛选指示条 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#D0D0D0] bg-[#E8F0FE]">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#888]">已筛选：</span>
                  <span className="font-semibold text-[#1677FF]">银河证券</span>
                  <span className="text-[#888]">— N 条</span>
                </div>
                <span className="text-[11px] text-[#1677FF] font-medium">清空筛选</span>
              </div>

              {/* 表格 */}
              <div className="overflow-auto" style={{ maxHeight: '240px' }}>
                <table className="w-full text-xs" style={{ minWidth: '1800px' }}>
                  <thead>
                    <tr className={`bg-[#ECECEC] border-b ${DIVIDER}`}>
                      {['状态', '标的名称', '标的代码', '币种', '交易对手', '结构', '期限', '开仓日', '到期日', '开仓名本(万)', '开仓价', '执行价', '期权费率', '期权费', '异常说明'].map(h => (
                        <th key={h} className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#666] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { status: '错误', bg: 'bg-[#FFF0F0]', note: '标的名称未填写、开仓名本未填写' },
                      { status: '错误', bg: 'bg-[#FFF0F0]', note: '结构未填写' },
                      { status: '错误', bg: 'bg-[#FFF0F0]', note: '交易对手未填写' },
                      { status: '警告', bg: 'bg-[#FFFDE7]', note: '标的名称未识别，后续展示可能缺失数据' },
                      { status: '正常', bg: '', note: '—' },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b border-[#D0D0D0] ${row.bg}`}>
                        <td className="px-2 py-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${row.status === '错误' ? 'border-[#FCA5A5] text-[#C62828]' : row.status === '警告' ? 'border-[#FDE68A] text-[#B45309]' : 'border-[#BBF7D0] text-[#15803D]'}`}>{row.status}</span>
                        </td>
                        {Array.from({length: 13}, (_, j) => (
                          <td key={j} className="px-2 py-1.5"><div className="h-4 rounded bg-[#D8D8D8]" style={{ width: '60px' }} /></td>
                        ))}
                        <td className="px-2 py-1.5"><span className={`text-[10px] ${row.status === '错误' ? 'text-[#C62828]' : row.status === '警告' ? 'text-[#B45309]' : 'text-[#CCC]'}`}>{row.note}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`flex items-center justify-end px-4 py-3 border-t ${DIVIDER}`}>
                <div className="flex items-center gap-3">
                  <div className="px-5 py-2 border border-[#B0B0B0] rounded text-xs text-[#777]">取消</div>
                  <div className="px-5 py-2 bg-[#B0B0B0] rounded text-xs text-[#666]">确认导入 (32 条)</div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 状态变体一览 ===== */}
          <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg">
            <div className="text-[10px] font-semibold text-[#666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">校验规则（极简版）</div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="text-[#C62828]">error：必填字段为空 → 阻止导入</div>
                  <div className="text-[#B45309]">warning：标的名/代码未识别 → 不阻止</div>
                  <div className="text-[#999]">不校验：日期、费率、名本量级、结构、周末、计算偏差等</div>
                  <div className="text-[#999]">原因：用户填什么就是什么，不替用户判断业务合理性</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">页面状态</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>上传前：展示上传区域（虚线框+拖拽+选择文件）</div>
                  <div>上传后：展示审核列表（汇总条+筛选栏+表格+操作）</div>
                  <div>确认导入后：跳转回持仓总览页</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">行状态视觉强调</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>错误行：红色浅底 + 状态="错误"标签（最高强调）</div>
                  <div>警告行：黄色浅底 + 状态="警告"标签（中等强调）</div>
                  <div>正常行：无特殊样式 + 状态="正常"标签</div>
                  <div>空必填字段 → 单元格红色高亮"未填写"</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">字段编辑控件</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>期限：数字输入 + 单位下拉（周/月）</div>
                  <div>结构：下拉选择</div>
                  <div>开仓日/到期日：date input</div>
                  <div>币种：纯展示标签（不可编辑）</div>
                  <div>其余字段：文本输入</div>
                  <div>编辑后自动重新校验 → 状态实时刷新</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 历史持仓 线框图
// ============================================================
export function WireframeHistoricalPage() {
  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center justify-between px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666]">← 返回持仓总览</span>
          <span className="text-lg font-bold text-[#222]">历史持仓</span>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 已实现损益总额汇总卡片 */}
          <div className={`bg-white border ${BORDER} rounded-lg shadow-sm`}>
            <div className={`flex items-center justify-between px-5 py-3 border-b ${DIVIDER}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#555]">已实现损益总额</span>
                <div className="flex items-center bg-[#E8E8E8] rounded-md p-0.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-[#444] shadow-sm">CNY</span>
                  <span className="text-[10px] px-2 py-0.5 rounded text-[#999]">USD</span>
                  <span className="text-[10px] px-2 py-0.5 rounded text-[#999]">HKD</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 px-5 py-4">
              {[
                { label: '总盈亏', value: '+¥320万', sub: '8 笔', color: 'text-[#C62828]' },
                { label: '盈利 / 亏损', value: '6 笔 / 2 笔', sub: '', color: '' },
                { label: '总名本', value: '5,200万', sub: 'CNY', color: '' },
                { label: '总期权费', value: '¥108万', sub: '', color: '' },
                { label: '平均收益率', value: '+8.5%', sub: '', color: 'text-[#C62828]' },
              ].map((m, i) => (
                <div key={i}>
                  <div className="text-[10px] text-[#999] mb-1">{m.label}</div>
                  <div className={`text-lg font-bold ${m.color || 'text-[#222]'}`}>{m.value}</div>
                  {m.sub && <div className="text-[10px] text-[#999] mt-0.5">{m.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 列表 */}
          <div className={`bg-white border ${BORDER} rounded-lg`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${DIVIDER}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#555]">共 N 条</span>
              </div>
              <div className="w-52 h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center px-2.5">
                <span className="text-[11px] text-[#999]">🔍 搜索标的名称/代码</span>
                <span className="text-[8px] text-[#BBB] ml-auto">↓ 建议列表</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-xs">
                <thead>
                  <tr className={`bg-[#ECECEC] border-b ${DIVIDER}`}>
                    {['标的信息', '交易对手', '结构', '状态', '开仓日 / 到期日', '本次平仓名本', '平仓收益', '累计净收益', '备注', '标签', '操作'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#666] whitespace-nowrap">{h} {h !== '操作' && '▲'}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5].map(i => (
                    <tr key={i} className="border-b border-[#D0D0D0] hover:bg-[#F2F2F2]">
                      <td className="px-3 py-2.5">
                        <div className="h-3.5 rounded bg-[#D8D8D8] w-16 mb-1" />
                        <div className="h-3 rounded bg-[#D8D8D8] w-20" />
                      </td>
                      <td className="px-3 py-2.5"><div className="h-5 rounded border border-[#B0B0B0] bg-[#D8D8D8] w-14" /></td>
                      <td className="px-3 py-2.5"><div className="h-5 rounded border border-[#B0B0B0] bg-[#D8D8D8] w-14" /></td>
                      <td className="px-3 py-2.5"><div className="h-5 rounded border border-[#B0B0B0] bg-[#D8D8D8] w-12" /></td>
                      <td className="px-3 py-2.5">
                        <div className="h-3 rounded bg-[#D8D8D8] w-16 mb-1" />
                        <div className="h-3 rounded bg-[#D8D8D8] w-16" />
                      </td>
                      <td className="px-3 py-2.5"><div className="h-3.5 rounded bg-[#D8D8D8] w-16" /></td>
                      <td className="px-3 py-2.5"><div className="h-3.5 rounded bg-[#D8D8D8] w-16" /></td>
                      <td className="px-3 py-2.5"><div className="h-3.5 rounded bg-[#D8D8D8] w-16" /></td>
                      <td className="px-3 py-2.5"><div className="h-3.5 rounded bg-[#D8D8D8] w-14" /></td>
                      <td className="px-3 py-2.5"><div className="h-3.5 rounded bg-[#D8D8D8] w-12" /></td>
                      <td className="px-3 py-2.5"><span className="text-[#888] text-[10px]">详情</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex items-center justify-between px-4 py-2.5 border-t ${DIVIDER} text-[9px] text-[#999]`}>
              <span>共 N 条，第 1/N 页</span>
              <div className="flex gap-1">
                {[1,2,3].map(p => (
                  <span key={p} className={`w-5 h-5 rounded flex items-center justify-center text-[8px] ${p === 1 ? 'bg-[#C0C0C0] text-[#555]' : `border ${BORDER} text-[#999]`}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 状态变体一览 ===== */}
          <div className="p-4 border border-dashed border-[#B0B0B0] rounded-lg">
            <div className="text-[10px] font-semibold text-[#666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">状态列变体</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>已平仓：灰色标签（普通视觉层级）</div>
                  <div>已到期：黄色标签（需与已平仓有明确区分）</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">排序交互</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>可排序列：标的信息/交易对手/结构/状态/开仓日到期日/名本/平仓收益/累计净收益 · 备注和标签为补充信息列</div>
                  <div>点击列头 → 升序/降序切换 · 当前排序列显示▲/▼</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">搜索与筛选</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>搜索框：聚焦弹出建议列表（前8条）</div>
                  <div>搜索无结果："无匹配结果"</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555] mb-2">空状态</div>
                <div className="space-y-1.5 text-[9px] text-[#888]">
                  <div>无历史持仓："暂无私幕纪录"</div>
                  <div>搜索无结果："无匹配结果"</div>
                  <div>标的名称为可点击链接 → /detail/:id</div>
                  <div>操作列"详情"链接 → /detail/:id</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
