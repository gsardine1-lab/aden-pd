// ============================================================
// 持仓总览 — 原型线框图
// 展示完整页面结构、交互层级与状态变化，供 UI 设计师参考
// 所有颜色为占位灰度，设计师自行定义色值规范
// ============================================================

const BD = 'border-[#D0D0D0]';
const BG = 'bg-[#F0F0F0]';
const BLOCK = 'bg-[#D8D8D8]';
const BTN = 'bg-[#B0B0B0]';
const TXT = 'text-[#666666]';
const TXT_L = 'text-[#888888]';
const TXT_D = 'text-[#444444]';

function Chip({ text, active, emph }: { text: string; active?: boolean; emph?: boolean }) {
  return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${emph ? 'border-[#999] bg-[#D0D0D0]' : active ? 'bg-[#C0C0C0] border-[#A0A0A0]' : 'border-[#C0C0C0]'} text-[#555]`}>{text}</span>;
}
function Block({ w, h = '3' }: { w: string; h?: string }) {
  return <div className={`h-${h} rounded ${BLOCK}`} style={{ width: w }} />;
}

export function WireframePage() {
  return (
    <div className={`flex h-screen ${BG} overflow-hidden`} style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ===== 顶部标题栏 ===== */}
        <div className="flex items-center justify-between px-6 h-14 bg-white border-b border-[#B0B0B0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-[#222]">持仓总览</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded border border-[#B0B0B0] text-[#666]">原型线框图</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 border border-[#B0B0B0] rounded text-[#666] text-xs bg-white">
              <span>已实现损益总额</span>
              <span className="text-[#CCC]">|</span>
              <span className="text-[10px]">CNY ▾</span>
              <span className="font-bold text-[#C62828]">+¥320万</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 border border-[#B0B0B0] rounded text-[#666] text-sm bg-white">📋 历史持仓</div>
            <div className={`flex items-center gap-1.5 px-4 py-2 ${BTN} rounded text-[#666] text-sm`}>⬆ 数据导入 ▾ <span className="text-[8px] text-[#999]">↓ 浮层A</span></div>
            <div className="flex items-center gap-1.5 px-4 py-2 border border-[#B0B0B0] rounded text-[#666] text-sm bg-white">📊 数据导出 ▾ <span className="text-[8px] text-[#999]">↓ 浮层B</span></div>
            <span className="text-[10px] text-[#999]">数据更新 2026-05-14 14:32</span>
            <div className="w-7 h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center justify-center text-[#888]">↻</div>
          </div>
        </div>

        {/* ===== 筛选栏 ===== */}
        <div className="bg-white border-b border-[#D0D0D0] px-4 py-2">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 border border-[#B0B0B0] rounded text-[10px] text-[#777]">筛选 ▾ <span className="text-[8px] text-[#999]">↓ 浮层D</span></div>
              <span className="text-[#CCC]">|</span>
              <Chip text="亚丁" />
              <span className="text-[#CCC]">|</span>
              <Chip text="银河证券" /><Chip text="中信证券" /><Chip text="华泰证券" /><Chip text="+3" />
              <span className="text-[#CCC]">|</span>
              <Chip text="CNY" /><Chip text="USD" /><Chip text="HKD" />
              <span className="text-[#CCC]">|</span>
              <Chip text="临近到期≤7天" emph />
              <span className="text-[8px] text-[#999] ml-1">（需视觉强调，区别于普通标签）</span>
              <span className="text-[9px] text-[#888] underline cursor-pointer ml-1">清空</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center h-7 border border-[#B0B0B0] rounded bg-[#EAEAEA] px-2.5 w-44">
                <span className="text-[10px] text-[#999]">🔍 搜索标的名称/代码</span>
              </div>
              <span className="text-[8px] text-[#999]">↓ 浮层C</span>
            </div>
          </div>
          {/* 筛选激活提示条 */}
          <div className="mt-2 pt-2 border-t border-[#D0D0D0] text-[9px] text-[#999]">
            当前展示<strong className="text-[#555]">统计结果</strong>为已选中 X 个持仓。&nbsp;
            <span className="underline cursor-pointer">清空</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ===== 统计卡片（4 张） ===== */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { title: '持仓总市值', main: '¥7,609,000', sub: 'CNY 760万 / USD 105万 / HKD 820万', extra: '独立币种切换：CNY | USD | HKD' },
              { title: '持仓预估净收益（昨日）', main: '+¥150,000（+12.5%）', sub: '浮盈 N 个 / 浮亏 N 个', extra: '独立币种切换 · 盈红亏绿 · 正负号视觉区分' },
              { title: '临近到期（≤7天）', main: '3', sub: '3个持仓 · 风险需关注', extra: '🔗 点击弹出持仓明细弹窗 · 需强调展示' },
              { title: '可行权且盈利', main: '4', sub: '4个持仓 · 可申请行权', extra: '🔗 点击弹出持仓明细弹窗 · 需强调展示' },
            ].map(card => (
              <div key={card.title} className="bg-white border border-[#B0B0B0] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#666]">{card.title}</span>
                  <span className="text-[8px] text-[#999]">{card.extra}</span>
                </div>
                <div className="text-xl font-bold text-[#222] mb-1">{card.main}</div>
                <div className="text-[10px] text-[#999]">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ===== 中部双模块 ===== */}
          <div className="grid grid-cols-[5fr_1fr] gap-4">
            {/* 到期日历 */}
            <div className="bg-white border border-[#B0B0B0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#555]">近30日到期日历</span>
                  <div className="text-[8px] px-1.5 py-0.5 rounded border border-[#C0C0C0] bg-[#F0F0F0] text-[#999]">近7天</div>
                </div>
                <span className="text-[8px] text-[#999]">5/14 → 6/13</span>
              </div>
              <div className="flex gap-2">
                <div className="w-[70px] flex-shrink-0 flex flex-col gap-0.5 max-h-[244px] overflow-y-auto px-1.5 py-1">
                  {[0,1,2,3,4,5,6,7,8,9].map(i => {
                    const d = new Date('2026-05-14');
                    d.setDate(d.getDate() + i);
                    const sel = i === 6;
                    return (
                      <div key={i} className={`rounded-md border px-1.5 py-1 flex items-center gap-1.5 flex-shrink-0 ${sel ? 'border-[#999] bg-[#E8E8E8]' : i <= 6 ? 'border-[#DDD] bg-[#F8F8F8]' : 'border-[#E0E0E0]'}`}>
                        <div>
                          <div className="text-[9px] font-semibold text-[#666] leading-tight">{d.getMonth()+1}/{d.getDate()}</div>
                          <div className="text-[7px] text-[#AAA] leading-tight">{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                        </div>
                        {i === 6 ? <span className="ml-auto text-[8px] px-1 py-px rounded-full bg-[#CCC] text-[#888] font-bold">12</span>
                         : i === 3 ? <span className="ml-auto text-[8px] px-1 py-px rounded-full bg-[#E0E0E0] text-[#888] font-bold">3</span>
                         : <span className="ml-auto text-[8px] text-[#DDD]">-</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1 min-w-0 max-h-[244px] flex flex-col">
                  <div className="text-[10px] font-medium text-[#666] mb-1.5">5月20日（周三）</div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-4 gap-1">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                        <div key={i} className="rounded-md border border-[#D8D8D8] bg-[#F5F5F5] px-1.5 py-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-semibold text-[#666]">标的{i}</span>
                            {i === 1 && <span className="text-[7px] px-0.5 py-px rounded font-bold bg-[#CCC] text-white">行权</span>}
                          </div>
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[10px] font-bold text-[#888]">+150,000 CNY</span>
                            <span className="text-[10px] font-bold text-[#888]">
                              <span className="text-[7px] text-[#AAA] font-normal">预期收益率</span> +12.50%
                            </span>
                          </div>
                          <div className="text-[7px] text-[#AAA] mb-0.5">代码</div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888]">对手</span>
                            <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888]">结构</span>
                            <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888]">期限</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#D0D0D0] text-[8px] text-[#BBB] flex gap-3 flex-wrap">
                <span>● 亚丁</span><span>行权 可申请行权</span><span className="ml-auto">点击卡片 → 持仓详情</span>
              </div>
            </div>

            {/* 持仓分布饼图 */}
            <div className="bg-white border border-[#B0B0B0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#555]">持仓收益率分布 · 共 N 个持仓</span>
              </div>
              <div className="flex gap-3">
                <div className="w-28 h-28 rounded-full border-[6px] border-[#C0C0C0] border-t-[#B0B0B0] border-r-[#888] border-b-[#999] border-l-[#AAA] flex items-center justify-center">
                  <span className="text-[9px] text-[#999]">饼图</span>
                </div>
                <div className="flex-1 space-y-1 text-[9px]">
                  <div className="font-semibold text-[#666]">浮盈区</div>
                  {['≥30%', '25~30%', '20~25%', '15~20%'].map(l => (
                    <div key={l} className="text-[#999] hover:underline cursor-pointer">● {l} (N)</div>
                  ))}
                  <div className="font-semibold text-[#666] mt-1">浮亏区</div>
                  {['-5~0%', '-10~-5%', '<-10%'].map(l => (
                    <div key={l} className="text-[#999] hover:underline cursor-pointer">● {l} (N)</div>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#D0D0D0] text-[8px] text-[#BBB]">
                🔗 点击饼图扇区或图例 → 筛选列表 · 5%分档
              </div>
            </div>
          </div>

          {/* ===== 持仓列表 ===== */}
          <div className="bg-white border border-[#B0B0B0] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#D0D0D0]">
              <span className="text-sm font-semibold text-[#555]">共 N 条持仓</span>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#B0B0B0] rounded text-[10px] text-[#777]">⚙ 设置</div>
                <span className="text-[8px] text-[#999]">↓ 浮层E</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '1900px' }}>
                <thead>
                  <tr className="bg-[#ECECEC] border-b border-[#D0D0D0]">
                    {[
                      '标的信息 ▲', '币种 ▲', '交易对手 ▲', '结构 ▲', '期限 ▲', '操作',
                      '开仓日/到期日 ▲', '持仓名本 ▲', '开仓价 ▲', '执行价 ▲',
                      '当前市价', '盈亏平衡点', '期权费率', '期权费', '持仓估值',
                      '预估净收益 ▲', '交易规则 ▲', '详情',
                    ].map(h => (
                      <th key={h} className="text-left px-2 py-2.5 text-[9px] font-semibold text-[#777] whitespace-nowrap border-r border-[#EEE]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5].map(i => (
                    <tr key={i} className="border-b border-[#D0D0D0] hover:bg-[#F2F2F2] cursor-pointer">
                      <td className="px-2 py-2">
                        <div className="text-[#555] font-semibold text-[11px]">标的名称 {i} ↗</div>
                        <div className="text-[9px] text-[#AAA]">代码</div>
                      </td>
                      <td className="px-2 py-2"><span className="text-[9px] text-[#777]">CNY</span></td>
                      <td className="px-2 py-2"><Chip text={i % 2 === 1 ? '亚丁' : '非亚丁'} /></td>
                      <td className="px-2 py-2"><Chip text="103%Call" /></td>
                      <td className="px-2 py-2"><span className="text-[9px] text-[#777]">6个月</span></td>
                      <td className="px-2 py-2">
                        {i % 2 === 1
                          ? <span className="text-[9px] px-2 py-0.5 rounded bg-[#B0B0B0] text-[#666]">申请行权</span>
                          : <span className="text-[9px] px-2 py-0.5 rounded bg-[#B0B0B0] text-[#666]">手动平仓</span>
                        }
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-[9px] text-[#888]">YYYY-MM-DD</div>
                        <div className="text-[9px] text-[#888]">YYYY-MM-DD</div>
                      </td>
                      {Array.from({length: 9}, (_, j) => (
                        <td key={j} className="px-2 py-2"><Block w={`${40 + j * 8}px`} /></td>
                      ))}
                      <td className="px-2 py-2"><span className="text-[9px] text-[#999]">详情 ↗</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-[#D0D0D0] text-[10px] text-[#999]">
              <span>共 N 条，第 1/N 页</span>
              <div className="flex gap-1">
                {[1,2,3].map(p => (
                  <span key={p} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${p === 1 ? 'bg-[#B0B0B0] text-[#555]' : 'border border-[#C0C0C0] text-[#888]'}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 操作/状态列 完整变体 ===== */}
          <div className="border border-dashed border-[#B0B0B0] rounded-lg p-4">
            <div className="text-[10px] font-semibold text-[#666] mb-3">操作列状态变体一览（按交易对手 × 持仓状态）</div>
            <div className="grid grid-cols-2 gap-3">
              {/* 亚丁持仓 */}
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#666] mb-2">交易对手 = 亚丁（仅 Call 看涨期权）</div>
                <div className="space-y-2">
                  {[
                    { status: '盈利 + 可行权', ui: '申请行权（红）', emphasis: '最高强调 — 可操作按钮' },
                    { status: '亏损 + 可行权', ui: '申请行权（灰）', emphasis: '中等强调 — 可操作按钮' },
                    { status: '未到可行权日（不在行权窗口）', ui: '未到可行权日（灰）', emphasis: '不可操作标签' },
                    { status: '已平仓', ui: '已平仓（灰）', emphasis: '不可操作标签' },
                  ].map(v => (
                    <div key={v.status} className="flex items-center gap-3">
                      <span className="text-[9px] text-[#999] w-44">{v.status}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border border-[#B0B0B0] ${v.emphasis.includes('最高') ? 'bg-[#C0C0C0]' : 'bg-[#EAEAEA]'} text-[#666]`}>{v.ui}</span>
                      <span className="text-[8px] text-[#999]">{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 非亚丁持仓 */}
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#666] mb-2">交易对手 = 非亚丁（仅 Call 看涨期权）</div>
                <div className="space-y-2">
                  {[
                    { status: '盈利（可行权但非亚丁不显示）', ui: '盈利', emphasis: '不可操作标签' },
                    { status: '亏损（可行权但非亚丁不显示）', ui: '亏损', emphasis: '不可操作标签' },
                    { status: '未到期', ui: '手动平仓（蓝）', emphasis: '最高强调 — 可操作按钮' },
                    { status: '已到期', ui: '已到期（黄）+ 手动平仓（蓝）', emphasis: '双标签：状态 + 操作' },
                    { status: '已平仓', ui: '已平仓（灰）', emphasis: '不可操作标签' },
                  ].map(v => (
                    <div key={v.status} className="flex items-center gap-3">
                      <span className="text-[9px] text-[#999] w-44">{v.status}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border border-[#B0B0B0] ${v.emphasis.includes('最高') ? 'bg-[#C0C0C0]' : 'bg-[#EAEAEA]'} text-[#666]`}>{v.ui}</span>
                      <span className="text-[8px] text-[#999]">{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 行样式变体 */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#666] mb-2">行样式变体（整行强调）</div>
                <div className="space-y-2">
                  {[
                    { condition: '浮亏 > 20%', emphasis: '整行需最高视觉强调（风险警示）' },
                    { condition: '已到期未行权', emphasis: '整行需中等视觉区分 · 淡黄背景' },
                    { condition: '临近到期（≤7天）', emphasis: '到期日列需强调 + 显示剩余天数' },
                  ].map(v => (
                    <div key={v.condition} className="flex items-center gap-3">
                      <span className="text-[9px] text-[#999] w-32">{v.condition}</span>
                      <span className="text-[8px] text-[#999]">{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#666] mb-2">其他列状态变体</div>
                <div className="space-y-2">
                  {[
                    { item: '交易对手列', desc: '亚丁（蓝色标签）/ 非亚丁（灰色标签）需有明确视觉区分' },
                    { item: '结构列', desc: '蓝色标签 "100%Call" / "103%Call" 等' },
                    { item: '预估净收益列', desc: '正值红色 / 负值绿色 · 含收益率辅助行' },
                    { item: '交易规则列', desc: '仅亚丁显示：强制敲出（红）、协商敲出（灰）、分红调整（蓝）、分红不调整（灰）、扣分红（橙）' },
                    { item: '期权费率列', desc: '新增列 · 百分比展示 "5.0%" · 可在设置中控制显隐' },
                    { item: '详情列', desc: '"详情 ↗" 链接 · 点击跳转 /detail/:id' },
                  ].map(v => (
                    <div key={v.item} className="flex items-start gap-3">
                      <span className="text-[9px] text-[#555] w-20 flex-shrink-0">{v.item}</span>
                      <span className="text-[8px] text-[#999]">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 空状态 */}
            <div className="mt-3 border border-[#B0B0B0] rounded p-3 bg-white">
              <div className="text-[9px] font-semibold text-[#666] mb-2">空状态与边界情况</div>
              <div className="grid grid-cols-3 gap-3 text-[9px] text-[#999]">
                <div>· 无持仓：列表显示空状态占位</div>
                <div>· 搜索无结果："无匹配结果"</div>
                <div>· 筛选无结果："无匹配结果，尝试调整筛选"</div>
                <div>· 全部已平仓：仅历史持仓页有数据</div>
                <div>· 无到期合约：日历显示"该日无到期合约"</div>
                <div>· 数据加载中：骨架屏占位</div>
              </div>
            </div>
          </div>

          {/* ===== 弹窗与浮层汇总 ===== */}
          <div className="border border-dashed border-[#B0B0B0] rounded-lg p-4 space-y-3">
            <div className="text-[10px] font-semibold text-[#666]">弹窗与交互浮层一览（↑ 标注对应页面触发位置）</div>

            <div className="grid grid-cols-2 gap-3">
              {/* 浮层A：数据导入下拉 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">浮层A：数据导入下拉菜单</div>
                <div className="text-[7px] text-[#999]">触发：顶部"数据导入"按钮 · 点击外部关闭</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0] space-y-1">
                  <div className="text-[9px] text-[#777]">📥 录入外部数据 → /external-entry</div>
                  <div className="text-[9px] text-[#777]">📤 持仓批量导入 → /batch-import</div>
                </div>
              </div>

              {/* 浮层B：数据导出下拉 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">浮层B：数据导出下拉菜单</div>
                <div className="text-[7px] text-[#999]">触发：顶部"数据导出"按钮</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0] space-y-1">
                  <div className="text-[9px] text-[#777]">导出当前视图 (Excel)</div>
                  <div className="text-[9px] text-[#777]">导出全部持仓 (Excel)</div>
                  <div className="text-[9px] text-[#777]">导出为 CSV</div>
                </div>
              </div>

              {/* 浮层C：搜索建议下拉 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">浮层C：搜索建议下拉</div>
                <div className="text-[7px] text-[#999]">触发：搜索框聚焦 · 前8条匹配 · 点击填入并搜索</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0] space-y-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-2"><Block w="60px" h="2.5" /><Block w="50px" h="2.5" /></div>
                  ))}
                </div>
              </div>

              {/* 浮层D：高级筛选面板 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">浮层D：高级筛选面板</div>
                <div className="text-[7px] text-[#999]">触发：筛选按钮 · 点击外部关闭 · 激活时按钮需视觉强调</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-semibold text-[#666]">筛选条件</span>
                    <span className="text-[8px] text-[#999] underline">清空全部</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['交易对手', '币种', '结构', '状态', '期限范围', '持仓规模(万)', '收益率区间', '预估净收益', '标签（多选）'].map(f => (
                      <div key={f}><span className="text-[8px] text-[#999]">{f}</span><div className="h-5 border border-[#B0B0B0] rounded bg-[#EAEAEA] mt-0.5" /></div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2 justify-end">
                    <div className="px-3 py-1 border border-[#B0B0B0] rounded text-[8px] text-[#777]">重置</div>
                    <div className="px-3 py-1 bg-[#B0B0B0] rounded text-[8px] text-[#666]">应用</div>
                  </div>
                </div>
              </div>

              {/* 浮层E：列设置面板 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">浮层E：列设置面板</div>
                <div className="text-[7px] text-[#999]">触发：表格"设置"按钮 · 选择持久化 localStorage</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0]">
                  <div className="text-[8px] font-semibold text-[#666] mb-1">可选信息列</div>
                  {['当前市价', '盈亏平衡点', '期权费率', '期权费', '持仓估值'].map(c => (
                    <label key={c} className="flex items-center gap-1.5 py-0.5 text-[9px] text-[#777]">
                      <span className="w-2.5 h-2.5 border border-[#B0B0B0] rounded bg-[#EAEAEA]" />{c}
                    </label>
                  ))}
                </div>
              </div>

              {/* 持仓明细弹窗 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">持仓明细弹窗（弹窗层）</div>
                <div className="text-[7px] text-[#999]">触发：统计卡片（临近到期/可行权）· 饼图扇区/图例</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0]">
                  <div className="flex items-center justify-between mb-2"><Block w="80px" /><Block w="40px" /></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-[#C0C0C0] rounded" />
                    {[1,2,3].map(i => <div key={i} className="h-3 bg-[#D8D8D8] rounded" />)}
                  </div>
                </div>
                <div className="text-[7px] text-[#999] mt-1">含 11 列表格 · 遮罩点击关闭 · 点击标的名跳转详情页</div>
              </div>

              {/* 手动平仓弹窗 */}
              <div className="border border-[#B0B0B0] rounded p-2.5 bg-white">
                <div className="text-[9px] font-semibold text-[#666]">手动平仓弹窗（弹窗层）</div>
                <div className="text-[7px] text-[#999]">触发：列表/详情页"手动平仓"按钮 · 默认当天日期 · 支持多次部分平仓</div>
                <div className="mt-1.5 border border-[#D0D0D0] rounded p-2 bg-[#F0F0F0] w-72 mx-auto">
                  <div className="text-[10px] font-semibold text-[#666]">手动平仓</div>
                  <div className="text-[8px] text-[#999] mt-1">标的名称 · 代码 · 剩余名本 X 万</div>
                  <div className="space-y-1.5 mt-2">
                    {['平仓价格', '本次平仓名本（万，可部分平仓）', '平仓日期（默认当天）'].map(f => (
                      <div key={f} className="h-6 border border-[#B0B0B0] rounded bg-[#EAEAEA] flex items-center px-1.5 text-[8px] text-[#999]">{f}</div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 h-6 border border-[#B0B0B0] rounded text-[8px] text-[#777] text-center leading-6">取消</div>
                    <div className="flex-1 h-6 bg-[#B0B0B0] rounded text-[8px] text-[#666] text-center leading-6">确认平仓</div>
                  </div>
                </div>
                <div className="text-[7px] text-[#999] mt-1">累计名本归零 → 自动变已平仓</div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#999] text-center pb-2">
            本原型线框仅展示页面结构、交互层级和状态变化。颜色均为占位灰度，实际色值由 UI 设计师按产品规范定义。<br/>
            系统仅支持 Call 香草看涨期权，所有字段、规则、状态均以此为基准。
          </div>
        </div>
      </div>
    </div>
  );
}
