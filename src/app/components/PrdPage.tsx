import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUp } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'loose',
  themeVariables: { primaryColor: '#1677FF', primaryBorderColor: '#1677FF', primaryTextColor: '#0D1117',
    secondaryColor: '#F0F2F5', lineColor: '#6B7280',
    fontFamily: '-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, sans-serif' } });

/* ================================================================
   PRD — 持仓总览模块产品规格说明书
   版本 V3.3 · 2026-05-22
   ================================================================ */

function MermaidChart({ id, code }: { id: string; code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState('');
  useEffect(() => { let c = false; mermaid.render(`${id}-s`, code).then(r => { if (!c) setS(r.svg); }).catch(() => {}); return () => { c = true; }; }, [id, code]);
  if (!s) return <div className="h-24 bg-[#F3F4F6] rounded-lg animate-pulse" />;
  return <div ref={ref} className="flex justify-center py-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: s }} />;
}



// ---- 流程图定义 ----
const FLOW_STATE = `stateDiagram-v2
    [*] --> 未到期: 建仓
    未到期 --> 可行权且盈利: 进入行权窗口\\n且市价>执行价
    未到期 --> 可行权但亏损: 进入行权窗口\\n但市价≤执行价
    未到期 --> 已到期: 到期(仅非亚丁)
    可行权且盈利 --> 已平仓: 用户行权 / 到期自动行权
    可行权但亏损 --> 已平仓: 到期自动行权(仅亚丁)
    可行权但亏损 --> 已到期: 到期(仅非亚丁)
    已到期 --> 已平仓: 手动平仓
    已平仓 --> [*]: 进入历史持仓`;

const FLOW_CLOSE = `flowchart TD
    A["点击「手动平仓」按钮"] --> B["弹出平仓弹窗"]
    B --> C["用户填写：平仓价格 / 本次名本(万) / 平仓日期"]
    C --> D{"累计平仓名本 ≥ 原始名本 ?"}
    D -->|"是"| E["将持仓状态覆盖为「已平仓」"]
    D -->|"否"| F["更新持仓名本 = 剩余名本"]
    E --> G["页面刷新"]
    F --> G
    G --> H["刷新后：<br/>全部平仓 → 列表消失 + 进入历史<br/>部分平仓 → 名本减少"]`;

const FLOW_FILTER = `flowchart LR
    A["统计卡片点击<br/>临近到期"] -->|"设置到期日范围"| F["筛选计算"]
    B["统计卡片点击<br/>可行权且盈利"] -->|"设置状态筛选"| F
    C["饼图点击<br/>扇区/图例"] -->|"设置收益率区间"| F
    D["快捷筛选标签<br/>按钮/下拉"] -->|"更新筛选条件"| F
    E["高级筛选面板<br/>组合条件"] -->|"更新筛选条件"| F
    F --> G["列表数据重新计算"]
    G --> H["全部模块联动更新"]`;

const FLOW_DETAIL = `flowchart TD
    A["进入持仓详情页"] --> B{"该持仓数据是否存在?"}
    B -->|"否"| C["提示：持仓不存在"]
    B -->|"是"| D{"持仓是否已关闭?<br/>状态为「已平仓」或「已到期」"}
    D -->|"否"| E["开仓视图"]
    D -->|"是"| F["已平仓/已到期视图"]
    E --> G1["关键事件时间线"]
    E --> G2["持仓明细卡片"]
    E --> G3["交易规则卡片(仅亚丁)"]
    E --> G4["盈亏情景模拟器"]
    E --> G5["平仓按钮"]
    F --> H1["盈亏汇总卡片"]
    F --> H2["平仓记录表"]
    F --> H3["持仓概要(只读)"]
    F --> H4["关键事件时间线"]`;

const FLOW_IMPORT = `flowchart TD
    A["用户粘贴文本或输入"] --> B["点击「解析文本」"]
    B --> C["正则提取结构化字段"]
    C --> D{"标的名称/代码<br/>在映射表中?"}
    D -->|"是"| E["正常填充字段"]
    D -->|"否"| F["⚠ 未识别提示<br/>名称强调显示"]
    E --> G["用户确认/修改<br/>右侧确认板"]
    F --> G
    G --> H["点击「确认并录入持仓」"]
    H --> I{"必填字段完整?"}
    I -->|"是"| J["写入持仓列表"]
    I -->|"否"| K["必填字段闪烁提示"]`;

// ---- 导航项 ----
const NAV = [
  { id: 's3', label: '一、筛选体系与联动规则' },
  { id: 's4', label: '二、核心统计卡片' },
  { id: 's5', label: '三、中部功能模块' },
  { id: 's6', label: '四、持仓明细列表' },
  { id: 's7', label: '五、持仓详情页' },
  { id: 's8', label: '六、录入外部持仓页' },
  { id: 's9', label: '七、批量导入 — 数据审核页' },
  { id: 's10', label: '八、历史持仓页' },
  { id: 's12', label: '九、金额展示规范' },
  { id: 's14', label: '十、批量导入校验规则' },
  { id: 's15', label: '十一、功能模块清单与闭环分析' },
  { id: 's16', label: '十二、白箱测试要点' },
];

export function PrdPage() {
  const [active, setActive] = useState('s3');
  const [top, setTop] = useState(false);
  const ct = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ct.current; if (!el) return;
    const on = () => {
      setTop(el.scrollTop > 300);
      const secs = el.querySelectorAll('[data-sec]');
      let cur = 's3';
      secs.forEach(s => { if ((s as HTMLElement).getBoundingClientRect().top < 160) cur = (s as HTMLElement).dataset.sec || 's3'; });
      setActive(cur);
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden" style={{ minWidth: '1280px' }}>
      {/* ---- 侧边导航 ---- */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-[#E8ECF0] flex flex-col">
        <div className="px-4 py-3 border-b border-[#E8ECF0]">
          <Link to="/" className="text-[10px] text-[#6B7280] hover:text-[#1677FF] transition-colors">← 返回持仓总览</Link>
          <div className="text-sm font-bold text-[#0D1117] mt-0.5">产品规格说明书</div>
          <div className="text-[9px] text-[#9CA3AF]">V3.3 · 2026-05-22</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {NAV.map(n => (
            <button key={n.id} onClick={() => go(n.id)}
              className={`w-full text-left px-4 py-1.5 text-[11px] transition-colors flex items-center gap-1.5 ${
                active === n.id ? 'text-[#1677FF] font-semibold bg-[#EFF6FF] border-r-2 border-[#1677FF]' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}>
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                active === n.id ? 'bg-[#1677FF] text-white' : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}>{n.label.charAt(0)}</span>
              {n.label.replace(/^[一二三四五六七八九十]+、/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* ---- 内容区 ---- */}
      <div ref={ct} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

          {/* ============ 页眉 ============ */}
          <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[#0D1117]">持仓总览模块 — 产品规格说明书</h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#9CA3AF]">
                  <span>版本 V3.3</span><span className="text-[#D1D5DB]">|</span>
                  <span>更新 2026-05-22</span>
                </div>
              </div>
              <div className="text-right text-xs text-[#9CA3AF]">
                <div>核心目标</div>
                <div className="text-[#6B7280] mt-0.5">一站式持仓管理：查看 · 筛选 · 模拟 · 行权 · 导入导出</div>
              </div>
            </div>
          </div>

          {/* 核心说明 */}
          <div className="bg-[#EFF6FF] rounded-xl border border-[#1677FF]/30 p-5">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</div>
              <div className="text-sm text-[#374151] leading-relaxed">
                <p className="font-semibold mb-1">核心字段以公司产品现行规范为准</p>
                <p>本原型中的交易规则描述（行权规则、到期行权规则、敲出规则、分红规则）及其他核心业务字段均为模拟示例数据，不代表公司产品的实际业务规范。开发和设计实施时，交易规则等核心字段应严格遵循公司产品的现行制度和流程规范，本原型仅作为交互流程和页面结构的参考基准。</p>
              </div>
            </div>
          </div>

          {/* ============ 一、筛选体系 ============ */}
          

          {/* ============ 一、持仓状态定义与流转 ============ */}
          

          {/* ============ 一、筛选体系与联动规则 ============ */}
          <section id="s3" data-sec="s3">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">一</span>
              筛选体系与联动规则
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">1.1 可用筛选维度</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">维度</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">逻辑</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">说明</th></tr></thead>
                  <tbody>
                    {[
                      ['搜索','标的名称或代码的模糊匹配','大小写不敏感'],
                      ['交易对手','精确匹配简称；选「非亚丁」时排除亚丁持仓','按持仓数量降序排列'],
                      ['币种','精确匹配 CNY / USD / HKD',''],
                      ['结构','精确匹配（100%/103%/105%/110%Call）','动态提取数据中所有结构值'],
                      ['状态','精确匹配状态值','未到期 / 可行权且盈利 / 可行权但亏损 / 已到期 / 已平仓'],
                      ['到期日范围','到期日在起止日期范围内（含边界）',''],
                      ['名本范围','持仓名本（万）在最小值和最大值之间',''],
                      ['收益率区间','预设区间或自定义最小/最大值','自定义最小/最大值独立于预设，互不覆盖'],
                      ['预估净收益','盈利（>0）/ 亏损（<0）/ 持平（±1000以内）',''],
                      ['标签','持仓内置标签和自定义标签，多选逗号分隔','任一标签匹配即命中'],
                    ].map(([d,l,n]) => (
                      <tr key={d} className="border-b border-[#F3F4F6]"><td className="px-3 py-2.5 font-medium text-[#0D1117]">{d}</td><td className="px-3 py-2.5 text-[#6B7280]">{l}</td><td className="px-3 py-2.5 text-[#6B7280]">{n}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">1.2 联动规则</h3>
                <MermaidChart id="s3-filter" code={FLOW_FILTER} />
                <ul className="list-disc pl-5 text-xs text-[#6B7280] mt-3 space-y-1">
                  <li>所有筛选条件叠加生效（AND 逻辑），统计卡片和列表实时联动更新</li>
                  <li>统计卡片中「临近到期」和「可行权且盈利」可点击触发对应筛选</li>
                  <li>分布饼图的扇区或图例可点击触发对应收益率区间筛选</li>
                  <li>到期日历中的合约卡片点击直接跳转持仓详情页</li>
                  <li>筛选条件变更后列表分页自动回到第 1 页</li>
                  <li>清空操作一键重置所有筛选条件为初始值</li>
                  <li>筛选计算中预设排除：已平仓的持仓；亚丁已到期的持仓（因到期自动行权）</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ============ 二、核心统计卡片 ============ */}
          <section id="s4" data-sec="s4">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">二</span>
              核心统计卡片
            </h2>
            <div className="space-y-3">
              {[
                { n:'2.1', t:'持仓总市值', d:'汇总全部当前展示持仓的估值总额。支持独立币种切换（CNY / USD / HKD），切换仅影响本卡片，其他卡片不受影响。副行按币种分列显示各币种市值。本卡片为纯展示，不可点击。' },
                { n:'2.2', t:'持仓预估净收益（昨日）', d:'汇总全部当前展示持仓的浮动净收益，同时显示浮盈和浮亏的金额、比例、持仓数量。收益率 = 净收益 ÷ 昨日持仓总市值。支持独立币种切换，切换后金额换算，比例和笔数不变。本卡片为纯展示，不可点击。' },
                { n:'2.3', t:'临近到期（≤7 天）', d:'统计到期日在 7 天以内的持仓数量。可点击：点击后触发到期日范围筛选，列表只展示临近到期的持仓。' },
                { n:'2.4', t:'可行权且盈利', d:'统计状态为「可行权且盈利」的持仓数量。可点击：点击后触发状态筛选，列表只展示可行权且盈利的持仓。' },
              ].map(c => (
                <div key={c.n} className="bg-white rounded-xl border border-[#E8ECF0] p-5">
                  <h3 className="text-sm font-semibold text-[#374151]">{c.n} {c.t}</h3>
                  <p className="text-sm text-[#6B7280] mt-1">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ============ 三、中部功能模块 ============ */}
          <section id="s5" data-sec="s5">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">三</span>
              中部功能模块
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">3.1 近30日到期日历</h3>
                <div className="text-sm text-[#6B7280] space-y-2">
                  <p>展示未来 30 天内到期的持仓合约。左侧为日期栏（可滚动），右侧为对应日期的合约卡片网格。合约数 9 以上分 4 列，5 以上分 3 列，否则 2 列。</p>
                  <p>仅展示状态为未到期、可行权且盈利、可行权但亏损的持仓。已平仓和已到期的不在日历中出现。</p>
                  <p>亚丁持仓中，可行权且盈利的显示红色「行权」标签，可行权但亏损的显示灰色「行权」标签。非亚丁不显示行权标签。</p>
                  <p>点击任一合约卡片跳转该持仓的详情页。选中日期无到期合约时显示「该日无到期合约」。</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">3.2 持仓收益率分布</h3>
                <div className="text-sm text-[#6B7280] space-y-2">
                  <p>以饼图展示持仓收益率的分布情况。以 5% 为步长分档，正收益区红色系，负收益区绿色系。仅展示有数据的档位。</p>
                  <p>悬停扇区时显示该档位的持仓数量和占比详情。点击扇区或图例可触发对应收益率区间的筛选。</p>
                  <p>仅统计状态为未到期、可行权且盈利、可行权但亏损的持仓。已平仓和已到期的持仓不做统计。</p>
                </div>
              </div>
            </div>
          </section>

          {/* ============ 四、持仓明细列表 ============ */}
          <section id="s6" data-sec="s6">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">四</span>
              持仓明细列表
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">4.1 列定义</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-2 py-2 text-[#6B7280] font-semibold">列名</th><th className="text-left px-2 py-2 text-[#6B7280] font-semibold">内容</th><th className="text-left px-2 py-2 text-[#6B7280] font-semibold">规则</th></tr></thead>
                  <tbody>
                    {[
                      ['标的信息','名称 + 代码','名称可点击跳转持仓详情页，代码灰色小字'],
                      ['交易对手','亚丁 / 非亚丁','亚丁蓝色标签，非亚丁灰色标签'],
                      ['结构','100%Call 等','蓝色标签'],
                      ['操作 / 状态','状态标签或操作按钮','详见 4.2 操作/状态规则'],
                      ['开仓日 / 到期日','YYYY-MM-DD','到期日在 7 天内时标红加粗并显示剩余天数'],
                      ['持仓名本','以「万」为单位 + 币种','原生币种，例：500万 CNY'],
                      ['开仓价','完整数字 + 币种','原生币种'],
                      ['执行价','完整数字 + 币种','原生币种'],
                      ['当前市价','完整数字 + 币种','可选列，默认显示'],
                      ['盈亏平衡点','完整数字 + 币种','可选列'],
                      ['期权费','完整数字 + 币种','可选列'],
                      ['持仓估值','完整数字 + 币种','可选列'],
                      ['预估净收益','金额 + 收益率','盈红亏绿，可选列'],
                      ['交易规则','规则标签','仅亚丁显示（敲出/分红标签），非亚丁不显示'],
                      ['详情','详情入口','可点击跳转持仓详情页'],
                    ].map(([c, v, r]) => (
                      <tr key={c} className="border-b border-[#F3F4F6]"><td className="px-2 py-1.5 font-medium text-[#0D1117]">{c}</td><td className="px-2 py-1.5 text-[#6B7280]">{v}</td><td className="px-2 py-1.5 text-[#6B7280]">{r}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">4.2 操作 / 状态规则</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-2 py-2 text-[#6B7280] font-semibold">条件</th><th className="text-left px-2 py-2 text-[#6B7280] font-semibold">展示</th></tr></thead>
                  <tbody>
                    {[
                      ['亚丁 + 可行权且盈利','「申请行权」按钮（最高强调）'],
                      ['亚丁 + 可行权但亏损','「申请行权」按钮（中等强调）'],
                      ['亚丁 + 未到可行权日','「未到可行权日」标签'],
                      ['亚丁 + 已到期','不在列表中显示（到期自动行权，不论盈亏）'],
                      ['亚丁 + 已平仓','不在列表中显示（进入历史持仓）'],
                      ['非亚丁 + 未到期','「手动平仓」按钮'],
                      ['非亚丁 + 已到期','「已到期」标签 + 「手动平仓」按钮'],
                      ['非亚丁 + 已平仓','不在列表中显示'],
                    ].map(([c, d]) => (
                      <tr key={c} className="border-b border-[#F3F4F6]"><td className="px-2 py-1.5 text-[#6B7280]">{c}</td><td className="px-2 py-1.5 font-medium text-[#0D1117]">{d}</td></tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="mt-2 text-xs text-[#9CA3AF]">非亚丁无行权机制，不会出现「可行权且盈利」「可行权但亏损」状态。亚丁到期一定自动行权（不论盈亏），不会在列表中保留「已到期」状态。</div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">4.3 交易规则标签（仅亚丁）</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l:'强制敲出', d:'2连板强制敲出' },
                    { l:'协商敲出', d:'3连板协商敲出，附协商方案' },
                    { l:'分红调整', d:'调整开仓价和执行价' },
                    { l:'分红不调整', d:'不调整价格' },
                    { l:'扣分红', d:'提前行权扣分红' },
                  ].map(r => (
                    <div key={r.l} className="border border-[#F3F4F6] rounded-lg p-2"><span className="font-medium text-[#0D1117]">{r.l}</span><span className="text-[#9CA3AF] ml-1">{r.d}</span></div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-[#9CA3AF]">行权规则和到期行权规则在列表中不展示，仅在详情页展示。非亚丁该列不显示任何规则标签。</div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">4.4 排序与分页</h3>
                <p className="text-sm text-[#6B7280]">点击列标题切换升序/降序，可排序列包括标的信息、交易对手、结构、操作/状态、开仓日/到期日、持仓名本、开仓价、执行价、当前市价、盈亏平衡点、期权费、持仓估值、预估净收益、交易规则。每页 10 条，筛选条件变化时自动回到第 1 页。部分信息列可在设置中选择显示或隐藏，选择结果持久化到浏览器本地存储。</p>
              </div>
            </div>
          </section>

          {/* ============ 五、持仓详情页 ============ */}
          <section id="s7" data-sec="s7">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">五</span>
              持仓详情页
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">5.1 视图分流</h3>
                <p className="text-sm text-[#6B7280] mb-3">进入详情页后，根据持仓状态自动分流：状态为「已平仓」或「已到期」时展示已平仓视图，否则展示未平仓视图。</p>
                <MermaidChart id="s7-detail" code={FLOW_DETAIL} />
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">5.2 未平仓视图</h3>
                <ul className="list-disc pl-5 text-sm text-[#6B7280] space-y-1">
                  <li><strong>基本信息</strong>：标的名称、代码、当前市价、涨跌幅、交易对手</li>
                  <li><strong>核心指标</strong>：预估净收益、持仓估值、期权费，三项横排展示</li>
                  <li><strong>关键事件时间线</strong>：股价走势图叠加事件标记线。事件类型和生成规则见「关键事件生成规则」章节。点击事件节点展开详情，默认展开第一个事件</li>
                  <li><strong>持仓明细</strong>：三列展示——时间信息（开仓日/到期日/最早行权日/剩余天数）、名本与数量（开仓名本/持仓名本/期权费/期权费率）、价格信息（开仓价/执行价/当前市价/当前涨幅/盈亏平衡点/距平衡点）</li>
                  <li><strong>交易规则</strong>：仅亚丁展示，4 张卡片——行权规则、到期行权规则、敲出规则（强制/协商）、分红规则（调整/不调整/扣分红）</li>
                  <li><strong>情景模拟器</strong>：标的价格变化滑块（-100% ~ +100%），配合 ±1% 步进按钮和固定场景（+10%/+5%/当前/-5%/-10%），实时计算预估盈亏。与持仓明细并排展示，模拟器占约 1/4 宽度</li>
                  <li><strong>操作按钮</strong>：亚丁显示「申请行权」，非亚丁显示「手动平仓」</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">5.3 已平仓 / 已到期视图</h3>
                <ul className="list-disc pl-5 text-sm text-[#6B7280] space-y-1">
                  <li><strong>基本信息</strong>：标的名称、代码、状态标签、交易对手、持有期（起止日期和天数）</li>
                  <li><strong>核心指标</strong>：平仓净收益（非「预估」）、开仓名本、总期权费</li>
                  <li><strong>平仓记录表</strong>：序号、平仓日期、平仓价格、本次名本、累计名本。若无手动记录则自动生成一条（亚丁取到期日，非亚丁取到期日前2天，价格取执行价）</li>
                  <li><strong>持仓概要（只读）</strong>：时间信息（开仓日/到期日/持有天数）、名本与数量（开仓名本/期权费/期权费率）、价格信息（开仓价/执行价）</li>
                  <li><strong>关键事件时间线</strong>：已平仓时行权事件替换为「平仓结算」记录（日期取到期日前2天，状态为已结算），时间轴截止到到期日。非亚丁跳过分红调整类事件</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ============ 六、关键事件生成规则 ============ */}
          <section id="s_events" data-sec="s_events">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">附</span>
              关键事件生成规则
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">事件类型（6 种）</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">事件</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">生成条件</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">适用对手方</th></tr></thead>
                  <tbody>
                    {[
                      ['建仓','始终生成','全部（亚丁带订单号，非亚丁不带）'],
                      ['除权除息','有行情 + 亚丁 + 存在分红规则','仅亚丁'],
                      ['分红调整','有行情 + 亚丁 + 除权除息后一天','仅亚丁'],
                      ['ST记录','有行情 + 持仓带有 ST 标签','全部'],
                      ['停复牌','有行情 + 持仓带有停牌标签','全部'],
                      ['行权/平仓结算','状态为可行权或已平仓','全部（已平仓时改为平仓结算）'],
                    ].map(([e,c,s]) => (
                      <tr key={e} className="border-b border-[#F3F4F6]"><td className="px-3 py-2.5 font-medium text-[#0D1117]">{e}</td><td className="px-3 py-2.5 text-[#6B7280]">{c}</td><td className="px-3 py-2.5 text-[#6B7280]">{s}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">特殊场景</h3>
                <div className="bg-[#FFF7ED] rounded-lg border border-[#FED7AA] p-4">
                  <p className="text-sm text-[#6B7280]">当持仓来源为外部录入（用户手动录入或批量导入），或标的无法识别、无行情数据时，仅生成<strong className="text-[#9A3412]">建仓和行权/平仓结算两种事件</strong>。除权除息、分红调整、ST记录、停复牌均依赖行情数据或交易所公告信息，此类场景下无法生成。</p>
                </div>
              </div>
            </div>
          </section>

          {/* ============ 七、持仓状态定义与流转 ============ */}
          <section id="s_state" data-sec="s_state">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">附</span>
              持仓状态定义与流转
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">状态定义</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">状态</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">含义</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">适用</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">后续流转</th></tr></thead>
                  <tbody>
                    {[
                      ['未到期','未进入行权窗口期','全部','→ 可行权且盈利 / 可行权但亏损 / 已到期'],
                      ['可行权且盈利','已进入行权窗口且市价高于执行价','仅亚丁','→ 用户行权 → 已平仓；到期自动行权 → 已平仓'],
                      ['可行权但亏损','已进入行权窗口但市价不高于执行价','仅亚丁','→ 到期自动行权 → 已平仓（亚丁）；→ 已到期（非亚丁）'],
                      ['已到期','已到期但尚未平仓','仅非亚丁保留','→ 手动平仓 → 已平仓'],
                      ['已平仓','最终态','全部','进入历史持仓，不在主列表展示'],
                    ].map(([s,m,a,f]) => (
                      <tr key={s} className="border-b border-[#F3F4F6]"><td className="px-3 py-2.5 font-medium text-[#0D1117]">{s}</td><td className="px-3 py-2.5 text-[#6B7280]">{m}</td><td className="px-3 py-2.5 text-[#6B7280]">{a}</td><td className="px-3 py-2.5 text-[#6B7280]">{f}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">状态流转图</h3>
                <MermaidChart id="s-state-f" code={FLOW_STATE} />
                <div className="mt-3 p-3 bg-[#FFF7ED] rounded-lg border border-[#FED7AA] text-xs text-[#6B7280]">
                  <strong className="text-[#9A3412]">核心规则：</strong>亚丁持仓到期一定自动行权，不论盈亏。因此亚丁不会出现「已到期未行权」状态，到期即结算进入历史持仓。非亚丁到期后保留已到期状态，仍可手动平仓。
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">亚丁 vs 非亚丁差异</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">维度</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">亚丁</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">非亚丁</th></tr></thead>
                  <tbody>
                    {[
                      ['持仓状态','未到期 / 可行权且盈利 / 可行权但亏损 / 已平仓','未到期 / 已到期 / 已平仓'],
                      ['已到期处理','到期自动行权（不论盈亏），结算后进入历史','保留已到期状态，可手动平仓'],
                      ['操作方式','可行权时「申请行权」','未到期/已到期时「手动平仓」'],
                      ['交易规则','展示行权/到期行权/敲出/分红规则','不展示'],
                      ['关键事件','完整 6 种（含除权除息/分红调整）','仅建仓/ST/停复牌/行权'],
                      ['订单号','建仓和行权事件带订单号','不带订单号'],
                      ['字段编辑','不可编辑','可编辑'],
                    ].map(([d, a, n]) => (
                      <tr key={d} className="border-b border-[#F3F4F6]"><td className="px-3 py-2.5 font-medium text-[#0D1117]">{d}</td><td className="px-3 py-2.5 text-[#6B7280]">{a}</td><td className="px-3 py-2.5 text-[#6B7280]">{n}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          </section>

          {/* ============ 六、录入外部持仓页 ============ */}
          <section id="s8" data-sec="s8">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">六</span>
              录入外部持仓页
            </h2>
            <div className="bg-white rounded-xl border border-[#E8ECF0] p-6 space-y-4">
              <p className="text-sm text-[#6B7280]">提供单笔持仓的手动录入能力。左右双栏布局：左栏粘贴期权确认书或交易流水文本，点击解析自动提取结构化字段；右栏为确认板，展示提取后的字段供用户核对和修改。</p>
              <MermaidChart id="s8-import" code={FLOW_IMPORT} />
              <div className="text-xs text-[#6B7280] space-y-1">
                <p><strong>字段联动：</strong>开仓价 × 结构比例 = 执行价（自动计算）；开仓名本 × 期权费率 = 期权费（自动计算）；期限联动开仓日和到期日自动填充。</p>
                <p><strong>交易类型：</strong>固定为「Call 看涨期权」，不可修改。</p>
                <p><strong>交易对手历史：</strong>浏览器本地存储历史记录，展示最近 5 条供快速填充。</p>
                <p><strong>校验：</strong>必填字段为空时字段闪烁提示。标的名或代码无法识别时显示警告。</p>
              </div>
            </div>
          </section>

          {/* ============ 七、批量导入 ============ */}
          <section id="s9" data-sec="s9">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">七</span>
              批量导入 — 数据审核页
            </h2>
            <div className="bg-white rounded-xl border border-[#E8ECF0] p-6 space-y-3 text-sm text-[#6B7280]">
              <p>支持 Excel / CSV 文件拖拽上传。上传后展示审核列表，包含汇总条（正常/警告/错误数量）、筛选栏（按状态筛选）、可编辑表格（字段可点击修改，修改后自动重新校验）。</p>
              <p>确认导入后跳转回持仓总览，异常数据在导入时自动跳过。附带下载导入模板链接。</p>
              <p><strong>校验规则：</strong>详见第十章。</p>
            </div>
          </section>

          {/* ============ 八、历史持仓页 ============ */}
          <section id="s10" data-sec="s10">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">八</span>
              历史持仓页
            </h2>
            <div className="bg-white rounded-xl border border-[#E8ECF0] p-6 space-y-3 text-sm text-[#6B7280]">
              <p>展示全部状态为「已平仓」的持仓。</p>
              <p><strong>汇总卡片：</strong>展示总盈亏、盈利/亏损笔数、总名本、总期权费、平均收益率。支持币种切换（CNY / USD / HKD），切换影响全部汇总指标。</p>
              <p><strong>列表：</strong>列包括标的信息、交易对手、结构、状态、开仓日/到期日、名本、平仓收益、累计净收益、操作（详情）。全部列可排序，支持搜索标的名称或代码。</p>
            </div>
          </section>

          {/* ============ 九、金额展示规范 ============ */}
          <section id="s12" data-sec="s12">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">九</span>
              金额展示规范
            </h2>
            <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
              <p className="text-sm text-[#6B7280] mb-4">金额展示按数据性质分为 4 类：</p>
              <div className="overflow-x-auto"><table className="w-full text-xs">
                <thead><tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]"><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">类别</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">格式</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">示例</th><th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">适用场景</th></tr></thead>
                <tbody>
                  {[
                    ['汇总级大额','完整数字 + 括号简写','150,000（15万）CNY','持仓总市值、持仓估值'],
                    ['名本','仅「万」+ 币种','500万 CNY','所有名本字段'],
                    ['收益/费用/价格','仅完整数字（无简写）','150,000 CNY','预估净收益、平仓净收益、期权费、市价'],
                    ['百分比','带正负号','+12.50%','收益率、期权费率、涨跌幅'],
                  ].map(([cat, fmt, ex, scope]) => (
                    <tr key={cat} className="border-b border-[#F3F4F6]"><td className="px-3 py-2.5 font-medium text-[#0D1117]">{cat}</td><td className="px-3 py-2.5 text-[#6B7280]">{fmt}</td><td className="px-3 py-2.5 font-mono text-[#6B7280]">{ex}</td><td className="px-3 py-2.5 text-[#6B7280]">{scope}</td></tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-3 p-3 bg-[#F3F4F6] rounded-lg text-xs text-[#6B7280]">
                <strong>术语规范：</strong>系统统一使用「名本」（名义本金），禁止使用「本金」。名本一律以「万」为单位且必须带币种。收益/盈亏/期权费/市价只用精确数字，禁止括号简写。
              </div>
            </div>
          </section>

          {/* ============ 十、批量导入校验规则 ============ */}
          <section id="s14" data-sec="s14">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">十</span>
              批量导入校验规则
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FEF2F2] rounded-xl border border-[#FCA5A5]/30 p-5">
                <h3 className="text-sm font-semibold text-[#DC2626] mb-2">错误（阻断导入）</h3>
                <p className="text-sm text-[#6B7280]">必填字段为空。必填字段：标的名称、标的代码、交易对手、结构、期限、开仓日、到期日、开仓名本、开仓价、执行价、期权费率、期权费。</p>
              </div>
              <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A]/30 p-5">
                <h3 className="text-sm font-semibold text-[#B45309] mb-2">警告（不阻止导入）</h3>
                <p className="text-sm text-[#6B7280]">标的名或代码不在已知映射中。后续页面缺数据就展示缺失态，不阻止导入。</p>
              </div>
            </div>
            <div className="bg-[#F3F4F6] rounded-lg p-3 mt-4 text-xs text-[#6B7280]">
              <strong>极简原则：</strong>不校验日期倒挂、费率异常、名本量级、结构非标、周末到期、计算偏差等。用户填什么就是什么。
            </div>
          </section>

          {/* ============ 十一、功能模块清单与闭环分析 ============ */}
          <section id="s15" data-sec="s15">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">十一</span>
              功能模块清单与闭环分析
            </h2>
            <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
              <p className="text-sm text-[#6B7280] mb-4">以下列出系统全部功能模块，标注模块间的依赖关系与闭环要求，供评估开发周期和规划分版本上线使用。</p>
              <div className="overflow-x-auto"><table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E8ECF0]">
                    <th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold w-8">#</th>
                    <th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">模块</th>
                    <th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">所属页面</th>
                    <th className="text-left px-3 py-2.5 text-[#6B7280] font-semibold">强依赖</th>
                    <th className="text-center px-3 py-2.5 text-[#6B7280] font-semibold w-20">闭环要求</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n:1, m:'统计卡片', p:'主面板', dep:'持仓数据源', loop:'一次闭环', color:'red' },
                    { n:2, m:'筛选栏', p:'主面板', dep:'持仓数据源 · 统计卡片 · 持仓表格', loop:'一次闭环', color:'red' },
                    { n:3, m:'持仓明细列表', p:'主面板', dep:'持仓数据源 · 筛选栏 · 状态标签', loop:'一次闭环', color:'red' },
                    { n:4, m:'持仓详情页（含KeyEvents）', p:'详情页', dep:'持仓数据源 · 平仓流程 · 交易规则', loop:'一次闭环', color:'red' },
                    { n:5, m:'平仓流程（手动平仓弹窗）', p:'详情页/列表页', dep:'持仓数据源 · 浏览器存储 · 状态机', loop:'一次闭环', color:'red' },
                    { n:6, m:'历史持仓页', p:'历史页', dep:'平仓流程 · 持仓数据源', loop:'一次闭环', color:'red' },
                    { n:7, m:'亚丁 vs 非亚丁差异矩阵', p:'全局', dep:'持仓状态机 · 操作按钮 · 交易规则 · KeyEvents', loop:'一次闭环', color:'red' },
                    { n:8, m:'到期日历', p:'主面板', dep:'持仓数据源 · 筛选栏', loop:'可独立', color:'blue' },
                    { n:9, m:'持仓分布饼图', p:'主面板', dep:'持仓数据源 · 筛选栏', loop:'可独立', color:'blue' },
                    { n:10, m:'情景模拟器', p:'详情页', dep:'持仓数据源', loop:'可独立', color:'blue' },
                    { n:11, m:'录入外部持仓', p:'录入页', dep:'持仓数据源 · 标的映射表', loop:'可独立', color:'blue' },
                    { n:12, m:'批量导入', p:'导入页', dep:'录入外部持仓 · 校验规则', loop:'可独立', color:'blue' },
                    { n:13, m:'线框图', p:'参考页', dep:'无', loop:'设计参考', color:'gray' },
                    { n:14, m:'数据导出', p:'主面板', dep:'持仓数据源 · 筛选栏', loop:'可独立', color:'blue' },
                    { n:15, m:'列显隐设置', p:'表格', dep:'持仓数据源', loop:'可独立', color:'blue' },
                    { n:16, m:'规则详情浮窗', p:'表格', dep:'持仓数据源 · 亚丁差异矩阵', loop:'可独立', color:'blue' },
                  ].map(row => (
                    <tr key={row.n} className="border-b border-[#F3F4F6]">
                      <td className="px-3 py-2.5 text-[#9CA3AF]">{row.n}</td>
                      <td className="px-3 py-2.5 font-medium text-[#0D1117]">{row.m}</td>
                      <td className="px-3 py-2.5 text-[#6B7280]">{row.p}</td>
                      <td className="px-3 py-2.5 text-[#6B7280]">{row.dep}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                          row.color === 'red' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/30' :
                          row.color === 'blue' ? 'bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20' :
                          'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                        }`}>{row.loop}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-5 space-y-2 text-xs text-[#6B7280]">
                <div className="flex items-start gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/30 flex-shrink-0 mt-0.5">一次闭环</span><span>模块间存在强依赖，必须在一个版本内同时交付，否则系统无法跑通基础业务链路。</span></div>
                <div className="flex items-start gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1677FF] border border-[#1677FF]/20 flex-shrink-0 mt-0.5">可独立</span><span>模块相对独立，可在核心闭环稳定后作为增量功能追加。</span></div>
                <div className="flex items-start gap-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] flex-shrink-0 mt-0.5">设计参考</span><span>仅供 UI 设计阶段参考，不进入开发排期。</span></div>
              </div>
              <div className="mt-4 p-4 bg-[#FFF7ED] rounded-lg border border-[#FED7AA]">
                <h3 className="text-sm font-semibold text-[#9A3412] mb-2">一次闭环模块（7 个）</h3>
                <p className="text-xs text-[#6B7280]">统计卡片 · 筛选栏 · 持仓明细列表 · 持仓详情页 · 平仓流程 · 历史持仓页 · 亚丁 vs 非亚丁差异矩阵。这 7 个模块构成了持仓管理的最小可用单元（MVP），任一模块缺失都会导致用户无法完成完整的持仓查看与操作流程。</p>
              </div>
            </div>
          </section>


          {/* ============ 十二、白箱测试要点 ============ */}
          <section id="s16" data-sec="s16">
            <h2 className="text-lg font-bold text-[#0D1117] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold">十二</span>
              白箱测试要点
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.1 持仓状态流转</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 未到期 → 进入行权窗口且盈利 → 状态应变为「可行权且盈利」</p>
                  <p>· 未到期 → 进入行权窗口但亏损 → 状态应变为「可行权但亏损」（仅亚丁）</p>
                  <p>· 未到期 → 到期日已过 → 亚丁应直接变为「已平仓」；非亚丁应变为「已到期」</p>
                  <p>· 可行权且盈利 → 用户行权 → 变为「已平仓」，进入历史持仓</p>
                  <p>· 可行权但亏损 → 到期 → 亚丁自动行权变「已平仓」；非亚丁变「已到期」</p>
                  <p>· 已到期 → 手动平仓 → 变为「已平仓」</p>
                  <p>· 已平仓为最终态，不应再发生状态变化</p>
                  <p>· 累平仓名本达到开仓名本时，状态应自动覆盖为「已平仓」</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.2 筛选逻辑</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 搜索：输入标的名或代码的任意子串，应命中对应持仓；大小写不敏感</p>
                  <p>· 交易对手「非亚丁」：应排除所有亚丁持仓，仅保留非亚丁</p>
                  <p>· 状态筛选：选「可行权且盈利」应仅命中该状态的持仓</p>
                  <p>· 到期日范围：起始日 ≤ 到期日 ≤ 截止日的持仓均命中</p>
                  <p>· 名本范围：名本在最小值和最大值之间的持仓命中（含边界）</p>
                  <p>· 收益率预设区间与自定义最小/最大值应各自独立，互不覆盖</p>
                  <p>· 多条件叠加时为 AND 逻辑，所有条件同时满足才命中</p>
                  <p>· 筛选结果变更后统计卡片和列表应同步更新</p>
                  <p>· 预设排除：状态为「已平仓」的持仓永远不出现；亚丁状态为「已到期」的持仓永远不出现</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.3 关键事件生成</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 建仓事件：所有持仓均应生成，日期为开仓日；亚丁带订单号，非亚丁不带</p>
                  <p>· 除权除息 + 分红调整：仅亚丁 + 有行情 + 存在分红规则时生成</p>
                  <p>· ST记录：有行情 + 持仓标签含「ST」时生成两个事件（ST + 解除ST）</p>
                  <p>· 停复牌：有行情 + 持仓标签含「停牌」时生成两个事件（停牌 + 复牌）</p>
                  <p>· 行权：状态为可行权或已平仓时生成；已平仓时改为「平仓结算」，状态为「已结算」</p>
                  <p>· 外部录入持仓或无行情数据：仅生成建仓和行权，其余事件均不出现</p>
                  <p>· 非亚丁持仓的除权除息和分红调整事件不应出现</p>
                  <p>· 事件按日期升序排列</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.4 平仓流程</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 仅非亚丁持仓可触发手动平仓；亚丁不应出现手动平仓入口</p>
                  <p>· 单次平仓名本小于剩余名本时，剩余名本应正确扣减，状态不变</p>
                  <p>· 累计平仓名本达到开仓名本时，状态自动变为「已平仓」</p>
                  <p>· 平仓记录应正确写入浏览器本地存储，刷新后不丢失</p>
                  <p>· 无手动平仓记录的已平仓持仓，应自动生成一条默认记录（亚丁取到期日、非亚丁取到期日前2天）</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.5 金额格式化</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 名本格式化：应以「万」为单位 + 币种展示，不足 1 万时显示小数</p>
                  <p>· 汇总级大额：应展示完整数字 + 括号简写（如 7,609,000（760万））</p>
                  <p>· 收益/费用：仅完整数字，无括号简写</p>
                  <p>· 百分比：始终带正负号，保留两位小数</p>
                  <p>· 正值为红色系、负值为绿色系（名本和估值等中性金额为黑色）</p>
                  <p>· 汇率换算：CNY→USD 除以 7.23，CNY→HKD 除以 0.927，反向乘以对应汇率</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.6 字段联动计算</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 执行价 = 开仓价 × 结构比例（如 1620 × 103% = 1668.6）</p>
                  <p>· 期权费 = 开仓名本 × 费率 ÷ 100</p>
                  <p>· 到期日 = 开仓日 + 期限（周/月），修改开仓日或期限后到期日应联动更新</p>
                  <p>· 剩余名本 = 开仓名本 − 累计已平仓名本，结果不应为负数</p>
                  <p>· 收益率 = 预估净收益 ÷ 昨日持仓总市值，昨日市值为 0 时需防除零</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.7 批量导入校验</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 必填字段任一为空 → 标记为错误，阻止导入</p>
                  <p>· 标的名或代码不在映射表中 → 标记为警告，不阻止导入</p>
                  <p>· 不校验：日期倒挂、费率异常值、名本量级、结构非标、周末日期、计算结果偏差</p>
                  <p>· 修改字段后应自动重新校验，状态实时刷新</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
                <h3 className="text-sm font-semibold text-[#374151] mb-2">12.8 亚丁 vs 非亚丁差异</h3>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>· 亚丁持仓的操作列为「申请行权」按钮（盈利红/亏损灰），非亚丁为「手动平仓」按钮</p>
                  <p>· 亚丁未到可行权日时显示标签文字，非亚丁同状态下直接显示「手动平仓」按钮</p>
                  <p>· 亚丁的交易规则列展示敲出/分红标签，非亚丁不展示</p>
                  <p>· 亚丁的详情页展示 4 张交易规则卡片，非亚丁不展示</p>
                  <p>· 亚丁的关键事件含除权除息和分红调整，非亚丁不含</p>
                  <p>· 亚丁建仓和行权事件带订单号，非亚丁不带</p>
                  <p>· 亚丁到期自动行权进入历史持仓，非亚丁到期保留在列表中待手动平仓</p>
                </div>
              </div>

            </div>
          </section>

          <div className="text-[10px] text-[#9CA3AF] text-center pb-8">
            版本 V3.3 · 2026-05-22 · 随原型迭代同步更新
          </div>
        </div>
      </div>

      {/* 返回顶部 */}
      {top && (
        <button onClick={() => ct.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-[#E8ECF0] rounded-full shadow-lg flex items-center justify-center text-[#6B7280] hover:text-[#1677FF] hover:border-[#1677FF] transition-all z-30">
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  );
}
