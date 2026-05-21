// ============================================================
// 持仓总览 — 原型线框图
// 展示完整页面结构、交互层级与状态变化，供 UI 设计师参考
// 所有颜色为占位灰度，设计师自行定义色值规范
// ============================================================

const B = 'border-[#B0B0B0]';
const BD = 'border-[#D0D0D0]';
const BG = 'bg-[#F0F0F0]';
const BG_CARD = 'bg-white';
const BG_ROW = 'bg-[#ECECEC]';
const BG_INPUT = 'bg-[#EAEAEA]';
const BLOCK = 'bg-[#D8D8D8]';
const BLOCK_D = 'bg-[#C0C0C0]';
const BTN = 'bg-[#B0B0B0]';
const TXT = 'text-[#666666]';
const TXT_L = 'text-[#888888]';
const TXT_T = 'text-[#222222]';
const TXT_M = 'text-[#444444]';

function Chip({ text, active }: { text: string; active?: boolean }) {
  return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${B} ${active ? 'bg-[#C0C0C0] text-[#444444]' : 'text-[#666666]'}`}>{text}</span>;
}
function Block({ w, h = '3' }: { w: string; h?: string }) {
  return <div className={`h-${h} rounded ${BLOCK}`} style={{ width: w }} />;
}

export function WireframePage() {
  return (
    <div className={`flex h-screen ${BG} overflow-hidden`} style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ===== 顶部标题栏 ===== */}
        <div className={`flex items-center justify-between px-6 h-14 bg-white border-b ${B} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${TXT_T}`}>持仓总览</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded border ${B} ${TXT}`}>原型线框图</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 历史持仓入口 */}
            <div className={`flex items-center gap-1.5 px-4 py-2 border ${B} rounded ${TXT} text-sm`}>📋 历史持仓</div>
            {/* 数据导入下拉 — 详见底部浮层汇总 */}
            <div className={`flex items-center gap-1.5 px-4 py-2 ${BTN} rounded ${TXT} text-sm`}>⬆ 数据导入 ▾ <span className="text-[9px] text-[#888888]">↓ 见浮层A</span></div>
            {/* 数据导出下拉 — 详见底部浮层汇总 */}
            <div className={`flex items-center gap-1.5 px-4 py-2 border ${B} rounded ${TXT} text-sm bg-white`}>📊 数据导出 ▾ <span className="text-[9px] text-[#888888]">↓ 见浮层B</span></div>
            <span className={`text-[10px] ${TXT}`}>最后更新 2026-05-20 14:30</span>
            <div className={`w-7 h-7 border ${B} rounded ${BG_INPUT} flex items-center justify-center`}>↻</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ===== 统计卡片 ===== */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { title: '持仓总市值', main: '¥7,609,000', sub: 'CNY 760万 / USD 105万 / HKD 820万', extra: '独立币种切换：CNY | USD | HKD' },
              { title: '持仓预估净收益（昨日）', main: '+¥150,000（+12.5%）', sub: '浮盈 N 个 / 浮亏 N 个 / 持平 N 个', extra: '独立币种切换 ↑ · 盈亏需视觉区分（正/负）' },
              { title: '临近到期（≤7天）', main: '3', sub: '3个持仓 · 风险需关注', extra: '🔗 点击弹出持仓明细弹窗 · 需强调展示' },
              { title: '可行权且盈利', main: '4', sub: '4个持仓 · 可申请行权', extra: '🔗 点击弹出持仓明细弹窗 · 需强调展示' },
            ].map(card => (
              <div key={card.title} className={`${BG_CARD} border ${B} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-semibold ${TXT}`}>{card.title}</span>
                  <span className={`text-[8px] ${TXT_L}`}>{card.extra}</span>
                </div>
                <div className={`text-xl font-bold ${TXT_T} mb-1`}>{card.main}</div>
                <div className={`text-[10px] ${TXT_L}`}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ===== 筛选体系 ===== */}
          <div className={`${BG_CARD} border ${B} rounded-lg p-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold ${TXT}`}>共 7 条持仓</span>
                <span className="text-[#B0B0B0]">|</span>
                <span className={`text-[9px] ${TXT_L}`}>交易对手：</span>
                {['亚丁', '非亚丁'].map(t => <Chip key={t} text={t} />)}
                <span className="text-[#B0B0B0]">|</span>
                <span className={`text-[9px] ${TXT_L}`}>结构：</span>
                {['100%Call', '103%Call', '105%Call'].map(t => <Chip key={t} text={t} />)}
                <span className="text-[#B0B0B0]">|</span>
                <span className={`text-[9px] ${TXT_L}`}>币种：</span>
                {['CNY', 'USD', 'HKD'].map(t => <Chip key={t} text={t} />)}
                <span className="text-[#B0B0B0]">|</span>
                <Chip text="临近到期≤7天" active />
                <span className={`text-[8px] ${TXT_L} ml-1`}>（需视觉强调，区别于普通筛选标签）</span>
                <span className={`text-[9px] ${TXT_L} underline cursor-pointer ml-1`}>清空</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center h-7 border ${B} rounded ${BG_INPUT} px-2.5 w-44`}>
                  <span className={`text-[10px] ${TXT_L}`}>🔍 搜索标的名称/代码</span>
                </div>
                <span className={`text-[8px] ${TXT_L}`}>↓ 浮层C</span>
                <div className={`flex items-center gap-1 px-3 h-7 border ${B} rounded ${TXT} text-[10px]`}>筛选 ▾</div>
                <span className={`text-[8px] ${TXT_L}`}>↓ 浮层D</span>
              </div>
            </div>
            {/* 筛选激活提示条 */}
            <div className={`mt-2 pt-2 border-t ${BD} text-[9px] ${TXT_L}`}>
              当前展示<strong className="text-[#444444]">统计结果</strong>为已选中 X 个持仓。&nbsp;
              <span className="underline cursor-pointer">清空</span>
            </div>
          </div>

          {/* ===== 中部双模块 ===== */}
          <div className="grid grid-cols-[5fr_1fr] gap-4">
            {/* 到期日历 */}
            <div className={`${BG_CARD} border ${B} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold ${TXT}`}>到期合约 · 共 N 笔</span>
                  <div className={`text-[8px] px-1.5 py-0.5 rounded border border-[#CCCCCC] bg-[#F0F0F0] text-[#999999]`}>近7天</div>
                </div>
                <span className={`text-[8px] ${TXT_L}`}>5/14 → 6/13</span>
              </div>
              <div className="flex gap-2">
                {/* 左侧日期栏 */}
                <div className="w-[70px] flex-shrink-0 flex flex-col gap-0.5 max-h-[244px] overflow-y-auto px-1.5 py-1">
                  {[0,1,2,3,4,5,6,7,8,9].map(i => {
                    const d = new Date('2026-05-14');
                    d.setDate(d.getDate() + i);
                    const sel = i === 6;
                    return (
                      <div key={i} className={`rounded-md border px-1.5 py-1 flex items-center gap-1.5 flex-shrink-0 ${sel ? 'border-[#999999] bg-[#E8E8E8]' : i <= 6 ? 'border-[#DDDDDD] bg-[#F8F8F8]' : 'border-[#E0E0E0]'}`}>
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
                {/* 右侧卡片区 */}
                <div className="flex-1 min-w-0 max-h-[244px] flex flex-col">
                  <div className="text-[10px] font-medium text-[#666666] mb-1.5">5月20日（周三）· 12 笔合约到期</div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                      <div key={i} className="rounded-md border border-[#D8D8D8] bg-[#F5F5F5] px-1.5 py-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-semibold text-[#666666]">标的{i}</span>
                          <span className="text-[9px] font-semibold text-[#888888]">+0.00%</span>
                        </div>
                        <div className="text-[7px] text-[#AAAAAA] mb-0.5">代码</div>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">对手</span>
                          <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">结构</span>
                          <span className="text-[7px] px-1 py-px rounded bg-[#E0E0E0] text-[#888888]">期限</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              </div>
              <div className={`mt-2 pt-2 border-t ${BD} text-[8px] ${TXT_L} flex gap-3 flex-wrap`}>
                <span>● 亚丁</span><span>行权 可申请行权</span><span className="ml-auto">点击卡片 → 持仓详情</span>
              </div>
            </div>

            {/* 持仓分布 */}
            <div className={`${BG_CARD} border ${B} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold ${TXT}`}>持仓分布（按收益率）共 X 个持仓</span>
              </div>
              <div className="flex gap-3">
                <div className="w-28 h-28 rounded-full border-[6px] border-[#C0C0C0] border-t-[#B0B0B0] border-r-[#888888] border-b-[#999999] border-l-[#AAAAAA] flex items-center justify-center">
                  <span className={`text-[9px] ${TXT_L}`}>饼图</span>
                </div>
                <div className="flex-1 space-y-1 text-[9px]">
                  <div className={`font-semibold ${TXT}`}>浮盈区（需与浮亏区有明确视觉区分）</div>
                  {['≥30% (N)', '25~30% (N)', '20~25% (N)', '15~20% (N)'].map(l => (
                    <div key={l} className={`${TXT_L} hover:underline cursor-pointer`}>● {l}</div>
                  ))}
                  <div className={`font-semibold ${TXT} mt-1`}>浮亏区</div>
                  {['-5~0% (N)', '-10~-5% (N)', '<-10% (N)'].map(l => (
                    <div key={l} className={`${TXT_L} hover:underline cursor-pointer`}>● {l}</div>
                  ))}
                </div>
              </div>
              <div className={`mt-3 pt-2 border-t ${BD} text-[8px] ${TXT_L}`}>
                🔗 点击饼图扇区或图例 → 持仓明细弹窗 · 底部：香草期权风险说明
              </div>
            </div>
          </div>

          {/* ===== 持仓列表 ===== */}
          <div className={`${BG_CARD} border ${B} rounded-lg overflow-hidden`}>
            {/* 表头操作区 */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${BD}`}>
              <span className={`text-sm font-semibold ${TXT}`}>共 7 条持仓</span>
              <div className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 border ${B} rounded text-[10px] ${TXT}`}>⚙ 设置</div>
                <span className={`text-[8px] ${TXT_L}`}>↓ 浮层E</span>
              </div>
            </div>

            {/* 表格（前两列冻结，横向滚动；点击行展开详情面板） */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '1700px' }}>
                <thead>
                  <tr className={`${BG_ROW} border-b ${BD}`}>
                    {['标的信息 ▲', '币种 ▲', '交易对手 ▲', '结构 ▲', '期限 ▲', '操作', '开仓日/到期日 ▲', '持仓名本 ▲', '开仓价 ▲', '执行价 ▲', '当前市价', '盈亏平衡点', '期权费', '持仓估值', '预估净收益 ▲', '交易规则 ▲', '详情'].map(h => (
                      <th key={h} className={`text-left px-2 py-2.5 text-[9px] font-semibold ${TXT} whitespace-nowrap`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5].map(i => (
                    <tr key={i} className={`border-b ${BD} hover:bg-[#F2F2F2] cursor-pointer`}>
                      <td className="px-2 py-2">
                        <div className={`${TXT_M} font-semibold text-[11px]`}>标的名称 {i} ↗</div>
                        <div className={`text-[9px] ${TXT_L}`}>代码</div>
                      </td>
                      <td className="px-2 py-2"><span className={`text-[9px] ${TXT}`}>CNY</span></td>
                      <td className="px-2 py-2"><Chip text={i % 2 === 1 ? '亚丁' : '非亚丁'} /></td>
                      <td className="px-2 py-2"><Chip text="103%Call" /></td>
                      <td className="px-2 py-2"><span className={`text-[9px] ${TXT}`}>6月</span></td>
                      <td className="px-2 py-2">
                        {i % 2 === 1
                          ? <span className={`text-[9px] px-2 py-0.5 rounded ${BTN} ${TXT}`}>申请行权</span>
                          : <span className={`text-[9px] px-2 py-0.5 rounded bg-[#B0B0B0] ${TXT}`}>手动平仓</span>
                        }
                      </td>
                      <td className="px-2 py-2">
                        <div className={`text-[9px] ${TXT}`}>YYYY-MM-DD</div>
                        <div className={`text-[9px] ${TXT}`}>YYYY-MM-DD</div>
                      </td>
                      {Array.from({length: 9}, (_, j) => (
                        <td key={j} className="px-2 py-2"><Block w={`${40 + j * 8}px`} h="3" /></td>
                      ))}
                      <td className="px-2 py-2"><span className={`text-[9px] ${TXT_L}`}>详情 ↗</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className={`flex items-center justify-between px-5 py-3 border-t ${BD} text-[10px] ${TXT_L}`}>
              <span>共 7 条，第 1/1 页</span>
              <div className="flex gap-1">
                {[1].map(p => (
                  <span key={p} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${BTN} ${TXT}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 操作/状态列 完整变体（供 UI 覆盖所有状态） ===== */}
          <div className={`border border-dashed ${B} rounded-lg p-4`}>
            <div className={`text-[10px] font-semibold ${TXT} mb-3`}>操作列状态变体一览（持仓列表"操作"列，按交易对手×持仓状态 逐一展示）</div>
            <div className="grid grid-cols-2 gap-3">
              {/* 亚丁持仓 */}
              <div className={`border ${B} rounded p-3 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT} mb-2`}>交易对手 = 亚丁</div>
                <div className="space-y-2">
                  {[
                    { status: '盈利 + 可行权', ui: '申请行权', emphasis: '最高强调（可操作按钮）' },
                    { status: '亏损 + 可行权', ui: '申请行权', emphasis: '中等强调（可操作按钮）' },
                    { status: '未到期（不在行权窗口）', ui: '未到期', emphasis: '不可操作标签' },
                    { status: '已到期', ui: '已到期', emphasis: '需视觉区分的标签' },
                    { status: '已平仓', ui: '已平仓', emphasis: '不可操作标签' },
                  ].map(v => (
                    <div key={v.status} className="flex items-center gap-3">
                      <span className={`text-[9px] ${TXT_L} w-36`}>{v.status}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border ${B} ${v.emphasis.includes('最高') ? 'bg-[#C0C0C0]' : 'bg-[#EAEAEA]'} text-[#666666]`}>{v.ui}</span>
                      <span className={`text-[8px] ${TXT_L}`}>{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 非亚丁持仓 */}
              <div className={`border ${B} rounded p-3 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT} mb-2`}>交易对手 = 非亚丁</div>
                <div className="space-y-2">
                  {[
                    { status: '盈利（可行权但非亚丁不显示行权）', ui: '盈利', emphasis: '不可操作标签' },
                    { status: '亏损（可行权但非亚丁不显示行权）', ui: '亏损', emphasis: '不可操作标签' },
                    { status: '未到期', ui: '手动平仓', emphasis: '最高强调（可操作按钮）' },
                    { status: '已到期', ui: '已到期', emphasis: '需视觉区分的标签' },
                    { status: '已平仓', ui: '已平仓', emphasis: '不可操作标签 · 可点击切换回"未到期"' },
                  ].map(v => (
                    <div key={v.status} className="flex items-center gap-3">
                      <span className={`text-[9px] ${TXT_L} w-36`}>{v.status}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border ${B} ${v.emphasis.includes('最高') ? 'bg-[#C0C0C0]' : 'bg-[#EAEAEA]'} text-[#666666]`}>{v.ui}</span>
                      <span className={`text-[8px] ${TXT_L}`}>{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 行样式变体 */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className={`border ${B} rounded p-3 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT} mb-2`}>行样式变体（整行强调）</div>
                <div className="space-y-2">
                  {[
                    { condition: '浮亏 > 20%', emphasis: '整行需最高视觉强调（风险警示）' },
                    { condition: '已到期未行权', emphasis: '整行需中等视觉区分' },
                    { condition: '临近到期（≤7天）', emphasis: '到期日列需强调 + 显示剩余天数' },
                  ].map(v => (
                    <div key={v.condition} className="flex items-center gap-3">
                      <span className={`text-[9px] ${TXT_L} w-32`}>{v.condition}</span>
                      <span className={`text-[8px] ${TXT_L}`}>{v.emphasis}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border ${B} rounded p-3 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT} mb-2`}>其他列状态变体</div>
                <div className="space-y-2">
                  {[
                    { item: '交易对手列', desc: '亚丁 / 非亚丁 两种标签需有明确视觉区分' },
                    { item: '结构列', desc: '蓝色标签样式（与交易对手标签风格统一）' },
                    { item: '预估净收益列', desc: '正值/负值 需有明确视觉区分（正/负）' },
                    { item: '交易规则列', desc: '特殊规则标签（敲出/分红）vs 标准（无特殊规则时显示"标准"）' },
                    { item: '详情列', desc: '链接样式"详情 ↗"· 点击跳转持仓详情页' },
                  ].map(v => (
                    <div key={v.item} className="flex items-start gap-3">
                      <span className={`text-[9px] ${TXT_M} w-20 flex-shrink-0`}>{v.item}</span>
                      <span className={`text-[8px] ${TXT_L}`}>{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== 弹窗与浮层汇总（平铺展示，不遮挡主界面） ===== */}
          <div className={`border border-dashed ${B} rounded-lg p-4 space-y-3`}>
            <div className={`text-[10px] font-semibold ${TXT}`}>弹窗与交互浮层一览（全部平铺展示，无悬浮遮挡；↑ 标注对应页面触发位置）</div>

            <div className="grid grid-cols-2 gap-3">
              {/* 浮层A：数据导入下拉 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>浮层A：数据导入下拉菜单</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：顶部"数据导入"按钮</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG} space-y-1`}>
                  <div className="text-[9px] text-[#666666]">📥 录入外部数据</div>
                  <div className="text-[9px] text-[#666666]">📤 持仓批量导入</div>
                </div>
              </div>

              {/* 浮层B：数据导出下拉 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>浮层B：数据导出下拉菜单</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：顶部"数据导出"按钮</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG} space-y-1`}>
                  <div className="text-[9px] text-[#666666]">导出当前视图 Excel</div>
                  <div className="text-[9px] text-[#666666]">导出全部持仓 Excel</div>
                  <div className="text-[9px] text-[#666666]">导出为 CSV</div>
                </div>
              </div>

              {/* 浮层C：搜索建议下拉 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>浮层C：搜索建议下拉</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：搜索框聚焦 · 前8条匹配结果 · 点击填入并搜索</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG} space-y-1`}>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-2"><Block w="60px" h="2.5" /><Block w="50px" h="2.5" /></div>
                  ))}
                </div>
              </div>

              {/* 浮层D：高级筛选面板 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>浮层D：高级筛选面板</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：筛选按钮 · 540px宽 · 点击外部关闭 · 筛选激活时按钮需视觉强调</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-[#666666] font-semibold">高级筛选</span>
                    <span className="text-[8px] text-[#888888] underline">清空全部</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['交易对手', '结构', '状态', '币种', '期限范围', '持仓规模(万)', '收益率区间', '预估净收益', '标签（多选）'].map(f => (
                      <div key={f}><span className="text-[8px] text-[#888888]">{f}</span><div className={`h-5 border ${B} rounded ${BG_INPUT} mt-0.5`} /></div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2 justify-end">
                    <div className={`px-3 py-1 border ${B} rounded text-[8px] text-[#666666]`}>重置</div>
                    <div className={`px-3 py-1 ${BTN} rounded text-[8px] text-[#666666]`}>应用</div>
                  </div>
                </div>
              </div>

              {/* 浮层E：列设置面板 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>浮层E：列设置面板</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：表格头部"设置"按钮 · 点击外部关闭 · 选择持久化</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG}`}>
                  <div className="text-[8px] font-semibold text-[#666666] mb-1">可选信息列</div>
                  {['当前市价', '盈亏平衡点', '期权费', '持仓估值'].map(c => (
                    <label key={c} className="flex items-center gap-1.5 py-0.5 text-[9px] text-[#666666]">
                      <span className={`w-2.5 h-2.5 border ${B} rounded`} />{c}
                    </label>
                  ))}
                </div>
              </div>

              {/* 持仓明细弹窗 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>持仓明细弹窗（弹窗层）</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：统计卡片（临近到期/可行权）· 饼图扇区/图例 · 到期日历行</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Block w="80px" /><Block w="40px" />
                  </div>
                  <div className="space-y-1">
                    <div className={`h-4 ${BLOCK_D} rounded`} />
                    {[1,2,3].map(i => <div key={i} className={`h-3 ${BLOCK} rounded`} />)}
                  </div>
                </div>
                <div className={`text-[7px] ${TXT_L} mt-1`}>1100px宽 · 最大80vh · 遮罩点击关闭 · 含11列表格</div>
              </div>

              {/* 手动平仓弹窗 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>手动平仓弹窗（弹窗层）</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：列表/详情页"手动平仓"按钮 · 默认当天日期 · 支持多次部分平仓</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG} w-72 mx-auto`}>
                  <div className="text-[10px] font-semibold text-[#666666]">手动平仓</div>
                  <div className="text-[8px] text-[#888888] mt-1">标的名称 + 代码 · 剩余名本</div>
                  <div className="space-y-1.5 mt-2">
                    {['平仓价格', '本次平仓名本（万）', '平仓日期（默认当天）'].map(f => (
                      <div key={f} className={`h-6 border ${B} rounded ${BG_INPUT} flex items-center px-1.5 text-[8px] text-[#888888]`}>{f}</div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className={`flex-1 h-6 border ${B} rounded text-[8px] text-[#666666] text-center leading-6`}>取消</div>
                    <div className={`flex-1 h-6 ${BTN} rounded text-[8px] text-[#666666] text-center leading-6`}>确认平仓</div>
                  </div>
                </div>
                <div className={`text-[7px] ${TXT_L} mt-1`}>剩余归零→自动变已平仓 · 确认后弹窗关闭刷新</div>
              </div>

              {/* 行展开面板 */}
              <div className={`border ${B} rounded p-2.5 bg-white`}>
                <div className={`text-[9px] font-semibold ${TXT}`}>行展开详情面板（内联展开）</div>
                <div className={`text-[7px] ${TXT_L}`}>触发：点击持仓列表行（非链接/按钮区域）· 再次点击收起</div>
                <div className={`mt-1.5 border ${BD} rounded p-2 ${BG}`}>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="text-[8px] font-semibold text-[#444444]">交易规则详情</div>
                      {['行权规则', '到期行权', '敲出规则', '分红处理'].map(r => <Block key={r} w="100%" h="2.5" />)}
                    </div>
                    <div className={`flex-1 space-y-1 border-l ${BD} pl-3`}>
                      <div className="text-[8px] font-semibold text-[#444444]">持仓概要</div>
                      <Block w="80%" h="2.5" /><Block w="70%" h="2.5" /><Block w="60%" h="2.5" />
                      <div className="text-[8px] underline text-[#888888]">查看详情 →</div>
                    </div>
                  </div>
                </div>
                <div className={`text-[7px] ${TXT_L} mt-1`}>亚丁显示交易规则 · 非亚丁仅显示持仓概要</div>
              </div>
            </div>

            {/* 筛选激活提示条 */}
            <div className={`border ${B} rounded p-2.5 bg-white`}>
              <div className={`text-[9px] font-semibold ${TXT}`}>筛选激活提示条（内联展示）</div>
              <div className={`text-[7px] ${TXT_L}`}>筛选变更后出现在列表上方 · 提示"当前展示统计结果为已选中 X 个持仓" · 含清空链接</div>
            </div>
          </div>

          <div className={`text-[9px] ${TXT_L} text-center pb-2`}>
            本原型线框仅展示页面结构、交互层级和状态变化。颜色均为占位灰度，实际色值由 UI 设计师按产品规范定义。
          </div>
        </div>
      </div>
    </div>
  );
}
