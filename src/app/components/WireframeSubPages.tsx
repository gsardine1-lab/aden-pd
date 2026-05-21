// ============================================================
// 灰度线框通用样式（较深，便于阅读）
// ============================================================
const BORDER = 'border-[#B0B0B0]';
const PAGE_BG = 'bg-[#F0F0F0]';
const CARD_BG = 'bg-white';
const ROW_BG = 'bg-[#ECECEC]';
const DIVIDER = 'border-[#D0D0D0]';
const BLOCK = 'bg-[#D8D8D8]';
const BLOCK_DARK = 'bg-[#C0C0C0]';
const INPUT_BG = 'bg-[#EAEAEA]';
const BTN_FILL = 'bg-[#B0B0B0]';

// ============================================================
// 持仓详情 线框图
// ============================================================
export function WireframeDetailPage() {
  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1200px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666666]">← 返回持仓总览</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className={`bg-white border ${BORDER} rounded-lg max-w-5xl mx-auto`}>
            <div className="px-5 py-4 border-b ${DIVIDER}">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-base font-bold text-[#222222]">标的名称</span>
                <span className="text-xs text-[#666666] font-mono">代码</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666666]">状态标签</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#666666]">结构</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#666666]">看涨期权</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#666666]">期限</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] text-[#666666]">交易对手</span>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x ${DIVIDER}">
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">基本信息</div>
                  <div className="space-y-2 mt-2">
                    {['标的名称', '标的代码', '结构', '交易类型', '交易对手', '策略', '操作方向', '币种'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">时间信息</div>
                  <div className="space-y-2 mt-2">
                    {['期限', '开仓日', '到期日', '最早行权日', '剩余天数'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">规模与费用</div>
                  <div className="space-y-2 mt-2">
                    {['开仓名本', '持仓名本', '行权中名本', '期权数量', '期权费率', '期权费', '持仓估值'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">价格信息</div>
                  <div className="space-y-2 mt-2">
                    {['开仓价', '执行价', '当前市价', '盈亏平衡点', '市价偏离度', '盈亏点偏离度'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">预估盈亏</div>
                  <div className="space-y-2 mt-2">
                    {['预估净收益', '收益率', '累计净收益'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">交易规则</div>
                  <div className="space-y-1.5 mt-2">
                    {['行权规则', '到期行权', '敲出规则', '分红处理'].map(label => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-[#777777]">{label}</span>
                        <span className="text-[#444444]">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部信息栏 */}
            <div className="px-5 py-3 border-t ${DIVIDER} space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-8 px-4 border border-[#B0B0B0] rounded flex items-center text-xs text-[#666666] bg-[#EAEAEA]">手动平仓</div>
                <span className="text-[10px] text-[#888888]">│ 备注: —</span>
                <span className="text-[10px] text-[#888888]">│ 交易确认书: —</span>
                <span className="text-[10px] text-[#888888]">│ 交易规则备注: —</span>
              </div>
              {/* 标签区 */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#888888]">标签:</span>
                {['停牌', 'ST'].map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666666]">{t} ×</span>
                ))}
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0B0B0] text-[#B0B0B0]">+ 新建</span>
              </div>
            </div>

            {/* 平仓记录区（多次部分平仓时展示） */}
            <div className="px-5 py-3 border-t ${DIVIDER}">
              <div className="text-[10px] font-semibold text-[#666666] mb-2">平仓记录（支持多次部分平仓）</div>
              <div className="space-y-1">
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="text-[#888888]">2026-05-20</span>
                  <span className="text-[#888888]">平仓价 1,850</span>
                  <span className="text-[#888888]">本次 200 万</span>
                  <span className="text-[#666666]">剩余 300 万</span>
                </div>
              </div>
              <div className="text-[8px] text-[#888888] mt-1">完全平仓后状态自动变为"已平仓"</div>
            </div>

            <div className="px-5 py-2.5 border-t ${DIVIDER} text-[9px] text-[#888888] space-y-1">
              <div>【亚丁持仓】显示交易规则详情（行权/到期/敲出/分红），【非亚丁持仓】不显示交易规则。</div>
              <div>免责声明：所有盈亏计算均为预估，实际盈亏以最终行权/平仓时的成交价格和交易规则为准。</div>
            </div>
          </div>

          {/* ===== 状态变体一览 ===== */}
          <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#666666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">头部状态标签（5 种）</div>
                <div className="space-y-1.5">
                  {['盈利可行权（最高强调）', '亏损可行权（中等强调）', '未到期（普通标签）', '已到期（需视觉区分）', '已平仓（普通标签）'].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666666]">{s.split('（')[0]}</span>
                      <span className="text-[8px] text-[#888888]">{s.split('（')[1]?.replace('）','')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">亚丁 vs 非亚丁 差异</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>亚丁：显示交易规则详情（行权/到期/敲出/分红）</div>
                  <div>非亚丁：不显示交易规则区块</div>
                  <div>亚丁：底部"申请行权"按钮</div>
                  <div>非亚丁：底部"手动平仓"按钮</div>
                  <div>非亚丁：可多次部分平仓，平仓记录区动态追加</div>
                  <div>完全平仓后状态自动变为"已平仓"</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">平仓记录区</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>无平仓记录：不展示该区域</div>
                  <div>有部分平仓：展示记录列表（日期/价格/名本/剩余）</div>
                  <div>完全平仓：显示完整记录 + 状态变为"已平仓"</div>
                  <div>行权中名本 &gt; 0 时：展示行权中名本字段</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">标签与备注区</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>无标签：仅显示"+ 新建"入口</div>
                  <div>有标签：显示已选标签（可×移除）+ 可选标签 + 新建</div>
                  <div>备注为空：不显示备注行</div>
                  <div>交易确认书为空：显示"—"</div>
                </div>
              </div>
            </div>
          </div>

          {/* 手动平仓弹窗 */}
          <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#666666] mb-2">↓ 弹窗：手动平仓（点击"手动平仓"按钮触发，默认日期为当天）</div>
            <div className={`bg-white border ${BORDER} rounded-lg p-5 w-96 mx-auto`}>
              <div className="text-sm font-semibold text-[#444444] mb-1">手动平仓</div>
              <div className="text-xs text-[#666666] mb-1">标的名称（代码）</div>
              <div className="text-xs text-[#777777] mb-4">交易对手：XXX | 剩余名本 XXXX 万</div>
              <div className="mb-4 space-y-3 p-3 rounded-lg border ${DIVIDER} bg-[#F2F2F2]">
                <div className="text-[10px] font-semibold text-[#444444]">平仓信息录入</div>
                {['平仓价格', '本次平仓名本（万，可部分平仓）', '平仓日期（默认当天）'].map(label => (
                  <div key={label}>
                    <div className="text-[9px] text-[#888888] mb-0.5">{label}</div>
                    <div className={`w-full h-8 border ${BORDER} rounded ${INPUT_BG} flex items-center px-2.5 text-xs text-[#999999]`}>
                      {label.includes('日期') ? 'YYYY-MM-DD' : `请输入${label.split('（')[0]}`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className={`flex-1 py-2 border ${BORDER} rounded text-xs text-center text-[#666666] bg-white`}>取消</div>
                <div className={`flex-1 py-2 rounded text-xs text-center text-[#666666] ${BTN_FILL}`}>确认平仓</div>
              </div>
              <div className="text-[8px] text-[#888888] mt-2">剩余名本归零前可多次操作，确认后弹窗关闭并刷新数据</div>
            </div>
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
      <span className="text-[#777777] w-[72px] flex-shrink-0 text-[11px]">
        {required && <span className="text-[#888888]">*</span>}{label}
      </span>
      <span className="text-[#B0B0B0] text-[11px]">—</span>
      {hint && <span className="text-[#999999] text-[9px] ml-2">({hint})</span>}
    </div>
  );

  return (
    <div className={`flex h-screen ${PAGE_BG} overflow-hidden`} style={{ minWidth: '1280px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`flex items-center px-6 h-14 bg-white border-b ${BORDER} flex-shrink-0`}>
          <span className="text-sm text-[#666666]">← 返回持仓总览</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左栏：文本解析 */}
          <div className="w-[420px] flex-shrink-0 border-r border-[#B0B0B0] bg-white flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="text-base font-bold text-[#444444]">录入外部持仓</div>
              <div className="text-[10px] text-[#888888] mt-0.5">粘贴期权确认书或交易流水，自动提取结构化数据；也可直接在右侧确认板填写</div>
            </div>
            <div className="flex-1 flex flex-col p-4">
              <div className={`flex-1 border ${BORDER} rounded-lg bg-[#F2F2F2] p-3`}>
                <div className="text-xs text-[#999999] font-mono leading-relaxed">
                  标的名称：贵州茅台<br/>
                  标的代码：600519.SH<br/>
                  结构：100%<br/>
                  期限：6月<br/>
                  交易对手：银河证券<br/>
                  开仓日：2026-05-20<br/>
                  到期日：2026-11-20<br/>
                  开仓名本：500万<br/>
                  开仓价：1620<br/>
                  期权费率：5%
                </div>
              </div>
              <div className="mt-2 text-[10px] text-[#888888] leading-relaxed">
                支持识别：标的名称/代码、行权价、名义本金、权利金率、起止日期、交易对手等
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-[#B0B0B0]">
              <div className={`w-full py-2.5 ${BTN_FILL} text-[#666666] text-sm text-center rounded`}>解析文本</div>
            </div>
          </div>

          {/* 右栏：确认板 */}
          <div className={`flex-1 flex flex-col overflow-hidden ${PAGE_BG}`}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="min-h-full flex flex-col">
                <div className={`bg-white border ${BORDER} rounded-lg overflow-hidden flex flex-col flex-1`}>
                  <div className={`px-4 py-2.5 ${PAGE_BG} border-b ${DIVIDER} flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-[#444444]">标的名称</span>
                        <span className="text-xs text-[#888888] font-mono">代码</span>
                        <span className="text-[8px] text-[#888888]">（标的未识别时：名称需最高视觉强调 + ⚠ 提示）</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#B0B0B0] text-[#777777]">点击字段可编辑</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {['结构', '看涨期权', '期限', '交易对手'].map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] border border-[#B0B0B0] text-[#666666]">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x ${DIVIDER} flex-1">
                    <div className="p-4 space-y-6">
                      <div>
                        <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">基本信息</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="标的名称" required />
                          <FieldRow label="标的代码" required />
                          <div className="text-[8px] text-[#888888] pl-[72px]">⚠ 未识别标的时显示警告</div>
                          <FieldRow label="结构" required hint="chip：100%/103%/105% + 更多展开" />
                          <FieldRow label="交易类型" hint="Call 看涨期权（不可修改）" />
                          <FieldRow label="交易对手" required />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">时间信息</div>
                        <div className="space-y-1 mt-2">
                          <FieldRow label="期限" required hint="编辑态：数字输入+单位下拉（周/月）" />
                          <div className="text-[8px] text-[#888888] pl-[72px]">快捷填充：2周 | 1月 | 3月 | 6月 | 12月</div>
                          <FieldRow label="开仓日" required hint="期限联动自动填充" />
                          <FieldRow label="到期日" required hint="期限联动自动填充" />
                          <div className="text-[8px] text-[#888888] pl-[72px]">剩余天数自动计算展示</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">本金与价格</div>
                      <div className="space-y-1 mt-2">
                        <FieldRow label="开仓名本" required hint="万" />
                        <div className="text-[8px] text-[#888888] pl-[72px]">快捷填充：100万 | 500万 | 1000万</div>
                        <FieldRow label="开仓价" required />
                        <FieldRow label="期权数量" required hint="自动：名本×10000÷开仓价" />
                        <FieldRow label="期权费率" required hint="%" />
                        <FieldRow label="期权费" required hint="自动：名本×10000×费率÷100" />
                        <FieldRow label="执行价" required hint="自动：开仓价×结构%" />
                        <div className="text-[8px] text-[#888888] pl-[72px]">联动计算：改任一项，关联字段自动更新</div>
                      </div>
                    </div>

                    <div className="p-4 space-y-6">
                      <div>
                        <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">备注</div>
                        <div className="mt-2">
                          <div className={`w-full h-28 border ${BORDER} rounded ${INPUT_BG}`} />
                          <div className="text-[8px] text-[#888888] mt-0.5">多行文本域，支持换行</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider border-b ${DIVIDER} pb-1">标签</div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {['标签1 ×', '标签2 ×'].map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666666]">{t}</span>
                          ))}
                          {['可选标签'].map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0B0B0] text-[#888888]">{t}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className={`w-20 h-6 border ${BORDER} rounded ${INPUT_BG}`} />
                          <div className={`px-2 py-1 rounded ${BTN_FILL} text-[9px] text-[#666666]`}>+ 新建</div>
                        </div>
                        <div className="text-[8px] text-[#888888] mt-1">标签池跨持仓共享，创建后可在其他持仓录入时复用</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex-shrink-0 px-4 py-2.5 border-t ${BORDER} bg-white flex items-center gap-4`}>
              <div className={`flex-1 py-2.5 border ${BORDER} rounded text-sm text-center text-[#666666]`}>取消</div>
              <div className={`flex-1 py-2.5 ${BTN_FILL} rounded text-sm text-center text-[#666666]`}>确认并录入持仓</div>
              <div className={`text-[8px] text-[#888888]`}>必填项未填写时点击 → 未填字段闪烁提示（短暂强调后恢复），不提交</div>
            </div>
          </div>

          {/* ===== 状态变体一览 ===== */}
          <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#666666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">字段交互状态（EditableField）</div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="text-[#666666]">空字段 → 直接展示输入框（蓝色边框）+ placeholder 提示</div>
                  <div className="text-[#666666]">已填字段 → 展示文本，悬停虚线边框，点击进入编辑态</div>
                  <div className="text-[#666666]">编辑态 → 输入框 + ✓✕ 按钮 + 淡蓝背景</div>
                  <div className="text-[#888888]">失焦/Enter → 提交 | Escape/✕ → 取消恢复原值</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">特殊字段控件</div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="text-[#666666]">期限：编辑态=数字输入+单位下拉(周/月) | 快捷chips常驻</div>
                  <div className="text-[#666666]">结构：chip选择(100%/103%/105%)+"更多"展开全部</div>
                  <div className="text-[#888888]">开仓名本：快捷chips(100万/500万/1000万)</div>
                  <div className="text-[#888888]">交易类型：固定"Call 看涨期权"，不可修改</div>
                  <div className="text-[#888888]">期权费/执行价/期权数量：自动计算，黑色文本展示</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">校验与提交状态</div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="text-[#666666]">标的有效 → 正常展示名称+代码，无警告</div>
                  <div className="text-[#666666]">标的无效 → 名称需最高视觉强调 + ⚠ 未识别提示</div>
                  <div className="text-[#888888]">必填项齐全+标的有效 → "确认并录入持仓"可点击</div>
                  <div className="text-[#888888]">有未填必填项 → 按钮disabled + 点击闪烁提示（1.2s）</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">文本解析状态</div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="text-[#666666]">文本为空 → "解析文本"按钮 disabled</div>
                  <div className="text-[#666666]">有文本 → 按钮可点击 → 点击后显示 spinner + "解析中..."</div>
                  <div className="text-[#888888]">解析完成 → 右侧表单非覆盖式填充（仅更新匹配到的字段）</div>
                  <div className="text-[#888888]">解析后 → 联动计算自动触发（名本→期权费 等）</div>
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
          <span className="text-sm text-[#666666]">← 返回持仓总览</span>
          <span className="text-lg font-bold text-[#222222]">批量导入 — 数据审核</span>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto mt-16">
            <div className={`border-2 border-dashed ${BORDER} rounded-lg bg-white p-12 text-center`}>
              <div className="text-sm font-semibold text-[#444444] mb-1">点击上传或拖拽 Excel 文件到此处</div>
              <div className="text-xs text-[#888888] mb-4">支持 .xlsx / .xls / .csv 格式</div>
              <div className={`inline-block px-6 py-2.5 ${BTN_FILL} text-[#666666] text-sm rounded`}>选择文件</div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#888888]">
              <span>导入字段：标的名称、标的代码、交易对手、结构、期限、开仓日、到期日、开仓名本(万)、开仓价、执行价、期权费率、期权费、期权数量</span>
              <span className="text-[#777777] ml-4">↓ 下载导入模板</span>
            </div>
          </div>

          {/* 审核列表 */}
          <div className="mt-6 p-4 border border-dashed border-[#B0B0B0] rounded-lg">
            <div className="text-[10px] font-semibold text-[#666666] mb-3">↓ 上传后展示：审核列表</div>
            <div className="text-[8px] text-[#888888] mb-2">
              字段编辑类型：期限=数字+单位下拉 | 结构=下拉选择 | 日期=date input | 币种=展示不可编辑 | 其余=文本输入<br/>
              联动计算：标的名称↔代码 | 期限→日期 | 名本+费率→期权费 | 名本+开仓价→期权数量 | 开仓价×结构→执行价<br/>
              异常行视觉强调：错误=最高强调（需立即关注）| 警告=中等强调（建议复核）| 正常=无强调<br/>
              编辑单元格 → 失焦/回车提交 → 自动重新校验 → 状态实时刷新 · 确认导入后跳转回持仓总览
            </div>
            <div className={`bg-white border ${BORDER} rounded-lg overflow-hidden`}>
              <div className={`flex items-center justify-between px-4 py-2.5 border-b ${DIVIDER} ${PAGE_BG}`}>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#444444]">文件名.xlsx — 共解析 35 条</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#666666]">✓ 26 正常</span>
                    <span className="text-[11px] text-[#666666]">△ 6 警告</span>
                    <span className="text-[11px] text-[#666666]">✕ 3 错误</span>
                  </div>
                </div>
                <span className="text-xs text-[#777777] underline">重新上传</span>
              </div>

              <div className={`flex items-center justify-between px-4 py-2 border-b ${DIVIDER}`}>
                <div className="flex items-center gap-2">
                  {['全部 (35)', '错误 (3)', '警告 (6)', '正常 (26)'].map((tab, i) => (
                    <span key={tab} className={`text-[10px] px-2.5 py-1 rounded border ${BORDER} ${i === 0 ? 'bg-[#C0C0C0] text-[#444444]' : 'text-[#666666]'}`}>{tab}</span>
                  ))}
                </div>
                <div className={`w-48 h-7 border ${BORDER} rounded ${INPUT_BG} flex items-center px-2.5`}>
                  <span className="text-[11px] text-[#999999]">搜索标的/代码/对手</span>
                </div>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '240px' }}>
                <table className="w-full text-xs" style={{ minWidth: '1900px' }}>
                  <thead>
                    <tr className={`${ROW_BG} border-b ${DIVIDER}`}>
                      {['状态', '标的名称', '标的代码', '币种', '交易对手', '结构', '期限', '开仓日', '到期日', '开仓名本(万)', '开仓价', '执行价', '期权费率', '期权费', '期权数量', '异常说明'].map(h => (
                        <th key={h} className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#555555] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5].map(i => (
                      <tr key={i} className="border-b border-[#D0D0D0]">
                        <td className="px-2 py-1.5"><span className="text-[10px] px-2 py-0.5 rounded border border-[#B0B0B0] bg-[#EAEAEA] text-[#666666]">{i === 3 ? '警告' : i === 5 ? '错误' : '正常'}</span></td>
                        {Array.from({length: 15}, (_, j) => (
                          <td key={j} className="px-2 py-1.5"><div className={`h-4 rounded ${BLOCK}`} style={{ width: `${60 + Math.random() * 40}px` }} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`flex items-center justify-between px-4 py-3 border-t ${DIVIDER}`}>
                <span className="text-[11px] text-[#666666]">共 35 条，其中 32 条可导入 — 异常数据将在导入时跳过</span>
                <div className="flex items-center gap-3">
                  <div className={`px-5 py-2 border ${BORDER} rounded text-xs text-[#666666]`}>取消</div>
                  <div className={`px-5 py-2 ${BTN_FILL} rounded text-xs text-[#666666]`}>确认导入 (32 条)</div>
                </div>
              </div>
            </div>
          </div>
          {/* ===== 状态变体一览 ===== */}
          <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg max-w-5xl mx-auto">
            <div className="text-[10px] font-semibold text-[#666666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">页面状态</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>上传前：展示上传区域（虚线框+拖拽+选择文件按钮）</div>
                  <div>上传后：展示审核列表（汇总条+筛选栏+表格+底部操作）</div>
                  <div>确认导入后：跳转回持仓总览页</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">行状态变体（状态列 + 整行强调）</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>错误行：状态="错误"标签（最高强调）+ 整行最高视觉强调 + 异常说明列列出具体问题</div>
                  <div>警告行：状态="警告"标签（中等强调）+ 整行中等视觉强调 + 异常说明列列出具体问题</div>
                  <div>正常行：状态="正常"标签（无强调）+ 整行无特殊样式 + 异常说明列显示"—"</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">筛选标签状态</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>全部（默认选中）：需视觉区分为当前激活标签</div>
                  <div>错误/警告/正常：各自与对应行状态视觉关联</div>
                  <div>切换标签 → 表格实时过滤 + 统计数字不变（仅过滤展示）</div>
                </div>
              </div>
              <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                <div className="text-[9px] font-semibold text-[#555555] mb-2">字段编辑控件类型</div>
                <div className="space-y-1.5 text-[9px]">
                  <div>期限：数字输入 + 单位下拉（周/月）</div>
                  <div>结构：下拉选择</div>
                  <div>开仓日/到期日：date input</div>
                  <div>币种：纯展示标签（不可编辑）</div>
                  <div>其余字段：文本输入</div>
                  <div>编辑后 → 自动重新校验 → 状态实时刷新</div>
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
          <span className="text-sm text-[#666666]">← 返回持仓总览</span>
          <span className="text-lg font-bold text-[#222222]">历史持仓</span>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className={`bg-white border ${BORDER} rounded-lg`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${DIVIDER}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#444444]">共 X 条</span>
                <div className="flex items-center gap-1.5">
                  {['全部', '已平仓', '已到期'].map((tab, i) => (
                    <span key={tab} className={`text-[10px] px-2 py-0.5 rounded border ${BORDER} ${i === 0 ? 'bg-[#C0C0C0] text-[#444444]' : 'text-[#666666]'}`}>{tab}</span>
                  ))}
                </div>
              </div>
              <div className={`w-52 h-7 border ${BORDER} rounded ${INPUT_BG} flex items-center px-2.5`}>
                <span className="text-[11px] text-[#999999]">搜索标的名称/代码</span>
              </div>
            </div>
            <div className={`px-4 py-1.5 text-[8px] text-[#888888] border-b ${DIVIDER} ${PAGE_BG}`}>
              点击列标题切换升序/降序（当前排序列显示 ▲/▼）· 状态列：已平仓/已到期 两种状态需有明确视觉区分 | 非亚丁已平仓持仓可点击状态切换回"未到期"（移回主列表）
              &nbsp;·&nbsp; 标的名称为可点击链接 → 跳转持仓详情页 · 搜索框聚焦弹出建议列表
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-xs">
                <thead>
                  <tr className={`${ROW_BG} border-b ${DIVIDER}`}>
                    {['标的信息', '交易对手', '结构', '状态', '开仓日 / 到期日', '名义本金', '平仓收益', '累计净收益', '操作'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#555555] whitespace-nowrap">{h} {h !== '操作' && '▲'}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5,6].map(i => (
                    <tr key={i} className="border-b border-[#D0D0D0]">
                      <td className="px-3 py-2.5">
                        <div className={`h-3.5 rounded ${BLOCK} w-16 mb-1`} />
                        <div className={`h-3 rounded ${BLOCK} w-20`} />
                      </td>
                      <td className="px-3 py-2.5"><div className={`h-5 rounded border ${BORDER} ${BLOCK} w-14`} /></td>
                      <td className="px-3 py-2.5"><div className={`h-5 rounded border ${BORDER} ${BLOCK} w-14`} /></td>
                      <td className="px-3 py-2.5"><div className={`h-5 rounded border ${BORDER} ${BLOCK} w-12`} /></td>
                      <td className="px-3 py-2.5">
                        <div className={`h-3 rounded ${BLOCK} w-16 mb-1`} />
                        <div className={`h-3 rounded ${BLOCK} w-16`} />
                      </td>
                      <td className="px-3 py-2.5"><div className={`h-3.5 rounded ${BLOCK} w-16`} /></td>
                      <td className="px-3 py-2.5"><div className={`h-3.5 rounded ${BLOCK} w-16`} /></td>
                      <td className="px-3 py-2.5"><div className={`h-3.5 rounded ${BLOCK} w-16`} /></td>
                      <td className="px-3 py-2.5"><span className="text-[#777777] text-[10px]">详情</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex items-center justify-between px-4 py-2.5 border-t ${DIVIDER} text-[9px] text-[#777777]`}>
              <span>共 X 条，第 1/N 页</span>
              <div className="flex gap-1">
                {[1,2,3].map(p => (
                  <span key={p} className={`w-5 h-5 rounded flex items-center justify-center text-[8px] ${p === 1 ? 'bg-[#C0C0C0] text-[#555555]' : `border ${BORDER} text-[#888888]`}`}>{p}</span>
                ))}
              </div>
            </div>

            {/* ===== 状态变体一览 ===== */}
            <div className="mt-4 p-4 border border-dashed border-[#B0B0B0] rounded-lg">
              <div className="text-[10px] font-semibold text-[#666666] mb-3">状态变体一览（供 UI 覆盖所有场景）</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555555] mb-2">状态列变体</div>
                  <div className="space-y-1.5 text-[9px]">
                    <div>已平仓：标签样式（普通视觉层级，不可操作）</div>
                    <div>已到期：标签样式（需与已平仓有明确视觉区分）</div>
                    <div>非亚丁 + 已平仓：标签可点击 → 弹出编辑弹窗 → 可切换回"未到期"（移回主列表）</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555555] mb-2">筛选与搜索</div>
                  <div className="space-y-1.5 text-[9px]">
                    <div>状态筛选标签：全部（默认）/ 已平仓 / 已到期 → 点击切换，当前选中需视觉强调</div>
                    <div>搜索框：聚焦弹出建议列表（前8条），输入实时过滤</div>
                    <div>筛选后表格实时更新，计数同步变化</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555555] mb-2">排序交互</div>
                  <div className="space-y-1.5 text-[9px]">
                    <div>可排序列：标的信息/交易对手/结构/状态/开仓日到期日/名义本金/平仓收益/累计净收益</div>
                    <div>点击列头 → 升序（首次）/ 降序（再次）/ 切换</div>
                    <div>当前排序列显示 ▲ 或 ▼ 箭头指示器</div>
                  </div>
                </div>
                <div className="border border-[#B0B0B0] rounded p-3 bg-white">
                  <div className="text-[9px] font-semibold text-[#555555] mb-2">其他状态</div>
                  <div className="space-y-1.5 text-[9px]">
                    <div>空状态：无历史持仓时，显示"暂无私幕纪录"提示</div>
                    <div>搜索无结果：显示"无匹配结果"</div>
                    <div>标的名称为可点击链接 → 跳转持仓详情页（/detail/:id）</div>
                    <div>操作列"详情"链接 → 跳转持仓详情页</div>
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
