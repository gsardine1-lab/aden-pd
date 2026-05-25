# 持仓总览模块 — 开发者备忘录

## 1. 模块目标

为"亚丁对客端持仓模块"提供可交互的高保真前端原型，同时作为 PRD 参考和 UI/开发 handoff 基准。核心输出：一个完整覆盖持仓查看、筛选、盈亏模拟、到期管理、平仓操作、历史回顾的 React SPA。

---

## 重要提示：核心字段以公司产品现行规范为准

本原型中的交易规则描述（行权规则、到期行权规则、敲出规则、分红规则）及其他核心业务字段均为模拟示例数据，不代表公司产品的实际业务规范。开发和设计实施时，交易规则等核心字段应严格遵循公司产品的现行制度和流程规范，本原型仅作为交互流程和页面结构的参考基准。

---

## 2. 核心交互与状态流转

### 2.1 页面路由结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HighFidelityPage | 主面板：统计卡片 + 到期日历 + 分布图 + 持仓表格 |
| `/detail/:id` | DetailPage | 持仓详情（根据 status 自动切换开仓/平仓视图） |
| `/historical` | HistoricalPositionsPage | 历史持仓列表 + P&L 汇总 |
| `/external-entry` | ExternalEntryPage | 单笔外部数据录入 |
| `/batch-import` | BatchImportPage | 批量导入 |
| `/wireframe/*` | WireframePage 等 | 线框图版本（与高保真并行维护） |

### 2.2 DetailPage 视图分流

**核心判断**：`const isClosed = position.status === 'closed' || position.status === 'expired';`

- **未平仓视图**（`!isClosed`）：KeyEventsTimeline + 持仓明细卡片 + ScenarioSimulator + 平仓按钮
- **已平仓/已到期视图**（`isClosed`）：P&L 汇总卡片 + 平仓记录表 + 只读持仓概要

### 2.3 持仓状态机

```
not-expired ──→ profitable-exercisable (亚丁：可行权且盈利)
    │              │
    │              ├──→ 用户行权 ──→ closed
    │              │
    │              └──→ 到期 ──→ 亚丁：自动行权 → closed（不论盈亏）
    │
    ├──→ loss-exercisable (亚丁：可行权但亏损)
    │         │
    │         ├──→ 用户行权 ──→ closed
    │         │
    │         └──→ 到期 ──→ 亚丁：自动行权 → closed（不论盈亏）
    │                      非亚丁：保持 expired，仍可手动平仓
    │
    ├──→ expired (仅非亚丁：已到期)
    │         │
    │         └──→ 手动平仓 ──→ closed
    │
    └──→ closed (最终态，进入历史持仓)
```

核心规则：**亚丁持仓到期一定自动行权，不论盈亏**。因此亚丁持仓不会出现「已到期未行权」状态，到期即结算进入历史持仓。

### 2.4 手动平仓流程

1. 用户点击「手动平仓」→ 弹出 Modal
2. 填写：平仓价格、本次名本（万）、平仓日期
3. 确认 → `addCloseRecord()` 写入 localStorage
4. 若累计平仓名本 ≥ 原始名本 → `overriddenStatuses[id] = 'closed'`
5. `window.location.reload()` 刷新页面

### 2.5 筛选联动链

```
StatCards 点击（临近到期 / 可行权且盈利）
    → onFilter(partial) → setFilters → applyFilters()
    
DistributionChart 点击扇区/图例
    → onFilter(min, max) → setFilters({ returnRateMin, returnRateMax })
    
ExpiryCalendar 点击合约卡片
    → navigate(`/detail/${p.id}`)
    
FilterBar 按钮/下拉
    → setFilter(partial) → setFilters → applyFilters()
```

### 2.6 关键交互事件链

- **点击持仓行标的名称** → `/detail/:id`（Link 组件）
- **点击 StatCards 临近到期** → 设置 `expiryDateTo: '2026-05-21'`
- **点击 StatCards 可行权且盈利** → 设置 `status: 'profitable-exercisable'`
- **点击 DistributionChart 扇区** → 设置 `returnRateMin/Max`
- **点击 ExpiryCalendar 合约卡片** → `/detail/:id`

---

## 3. 关键数据结构 & 来源

### 3.1 Position（核心实体）

```typescript
// 来源：mockData.tsx — mockPositions 数组
interface Position {
  id: string;
  underlying: string;           // 标的名称
  code: string;                 // 股票代码
  market: string;               // 市场（A股/港股/美股）
  strategy: string;
  operation: '买入' | '卖出';
  optionType: 'Call' | 'Put';
  tradeType: string;            // 看涨期权/看跌期权
  structure: string;            // 100%Call / 103%Call / 105%Call / 110%Call
  startDate: string;            // 开仓日
  expiryDate: string;           // 到期日
  term: string;                 // 期限描述
  earliestExerciseDate?: string;
  notionalCNY: number;          // 持仓名本（可能因部分平仓变化）
  openNotionalCNY: number;      // 开仓名本（不变）
  exercisingNotionalCNY?: number;
  openPrice: number;
  strikePrice: number;
  currentPrice: number;
  breakEvenPrice: number;       // 盈亏平衡点
  optionPremiumCNY: number;     // 期权费
  valuationCNY: number;         // 持仓估值
  pnlCNY: number;               // 预估净收益
  returnRate: number;           // 收益率（小数）
  priceDiff: number;            // 价格变动率
  breakevenDiff: number;        // 距平衡点
  status: PositionStatus;       // 见状态枚举
  closingPnlCNY?: number;       // 平仓收益（已平仓时）
  cumulativePnlCNY: number;     // 累计净收益
  currency: 'CNY' | 'USD' | 'HKD';
  tradingRules: {
    exerciseRule: string;       // "开仓日 T+1 行权" | "开仓日 T+5 行权"
    expiryRule: string;
    knockoutRule?: string;      // "2连板强制敲出" | "3连板协商敲出"
    dividendRule?: string;      // "分红调整" | "分红不调整" | "分红不调整且提前行权扣分红"
    negotiationPlan?: string;   // 协商方案描述
  };
  counterparty: string;         // 简称：亚丁 / 银河证券 / 中信证券 ...
  counterpartyFullName: string;
  tags: string[];               // 内置标签：ST / 停牌 / 分红
  notes?: string;
  ruleNotes?: string;
  tradeConfirmation?: string;
  source: 'system' | 'external';
}
```

### 3.2 PositionStatus 枚举

```typescript
type PositionStatus =
  | 'not-expired'              // 未到期
  | 'profitable-exercisable'   // 可行权且盈利（仅亚丁）
  | 'loss-exercisable'         // 可行权但亏损（仅亚丁）
  | 'expired'                  // 已到期（仅非亚丁保留此状态）
  | 'closed';                  // 已平仓（最终态）
```

### 3.3 CloseRecord（平仓记录）

```typescript
// 来源：localStorage key="closeRecords"
// 格式：Record<string, CloseRecord[]>
interface CloseRecord {
  id: string;          // 格式: "cl-{timestamp}"
  date: string;        // 平仓日期
  price: number;       // 平仓价格
  notionalCNY: number; // 本次平仓名本（万）
}
```

### 3.4 FilterState（筛选状态）

```typescript
// 来源：HighFidelityPage useState
interface FilterState {
  search: string;
  underlying: string;
  structure: string;
  status: string;
  currency: string;
  counterparty: string;       // 注意：值为 "非亚丁" 时有特殊逻辑
  expiryDateFrom: string;
  expiryDateTo: string;
  notionalMin: string;
  notionalMax: string;
  notionalRange: string;
  returnRateRange: string;
  returnRateMin: string;       // DistributionChart 点击设置
  returnRateMax: string;       // DistributionChart 点击设置
  pnlRange: string;
  tags: string;                // 逗号分隔的标签列表
}
```

### 3.5 KeyEvent（关键事件）

```typescript
// 来源：DetailPage.tsx generateEvents() 动态生成
type EventType = '建仓' | '除权除息' | '分红调整' | 'ST记录' | '停复牌' | '行权';

interface KeyEvent {
  id: string; date: string; type: EventType; priority: number; title: string;
  orderId?: string;              // 建仓/行权共用
  openPrice?: number;            // 建仓
  openNotional?: number;         // 建仓
  dividendPerShare?: number;     // 除权除息
  adjustedOpenPrice?: number;    // 分红调整
  adjustedStrike?: number;       // 分红调整
  dividendNoAdjust?: boolean;    // 分红调整（不调整标记）
  // 注：异动记录类型已从事件体系中移除（价格波动不属于关键事件记录范畴）
  actionLabel?: string;          // ST记录/停复牌
  exerciseNotional?: number;     // 行权
  exerciseResult?: number;       // 行权
  exerciseStatus?: '预估' | '已结算' | '未成交';  // 行权
}
```

### 3.6 localStorage 持久化键

| Key | 类型 | 用途 |
|-----|------|------|
| `closeRecords` | `Record<string, CloseRecord[]>` | 手动平仓记录 |
| `positionTags` | `Record<string, string[]>` | 每个持仓的自定义标签 |
| `tagPool` | `string[]` | 全局标签库 |
| `overriddenStatuses` | `Record<string, string>` | 手动覆盖的持仓状态 |
| `position-table-columns` | `string[]` | 用户可见列偏好 |
| `cptyHistory` | `string[]` | 交易对手历史记录（全量存储，展示前 5） |

### 3.7 汇率常量

```typescript
const FX_RATES = { CNY: 1, USD: 7.23, HKD: 0.927 };
// 注意：USD/HKD 是从 CNY 换算的汇率
// convertCurrency(amountCNY, toCurrency) = amountCNY / FX_RATES[toCurrency]
```

---

## 4. 联动规则 & 边界条件

### 4.1 亚丁 vs 非亚丁 — 全局差异矩阵

| 维度 | 亚丁 | 非亚丁 |
|------|------|--------|
| 交易规则展示 | 显示完整 4 张规则卡片 | 不显示（PositionTable 显示 `-`） |
| KeyEvents | 生成全部 6 种事件 | 仅生成「建仓」事件 |
| 持仓状态 | not-expired / profitable-exercisable / loss-exercisable / closed | not-expired / expired / closed |
| 操作按钮 | 可行权时「申请行权」 | 未到期/已到期时「手动平仓」 |
| expired 处理 | 到期自动行权（不论盈亏），结算后进入历史持仓 | 保留 expired 状态，显示「已到期」+「手动平仓」 |
| 字段编辑 | 不可编辑（只读） | 可编辑（EditableValue 组件） |
| StatusBadge | not-expired→「未到可行权日」(灰) | not-expired→「手动平仓」(蓝) |
| StatusBadge | profitable-exercisable→「申请行权」(红) | profitable-exercisable→「盈利」(灰) |
| StatusBadge | loss-exercisable→「申请行权」(红) | loss-exercisable→「亏损」(灰) |

### 4.2 applyFilters 核心过滤逻辑

```typescript
// HighFidelityPage.tsx
function applyFilters(positions, filters):
  1. 排除 status === 'closed'
  2. 排除 status === 'expired' && counterparty === '亚丁'
  3. 应用所有 FilterState 条件
  
// displayPositions 额外处理：
  1. 应用 overriddenStatuses 覆盖
  2. getRemainingNotional ≤ 0 且非(expired+非亚丁) → status = 'closed'
  3. 部分平仓 → 更新 notionalCNY
  4. 合并自定义标签
  5. 最终过滤：排除 closed 和 (expired && 亚丁)
```

### 4.3 交易规则卡片逻辑

仅当 `position.counterparty === '亚丁'` 时渲染，4 张卡片：

1. **行权规则**：固定展示 `tradingRules.exerciseRule`
2. **到期规则**：`tradingRules.expiryRule` + 固定补充 "截止 13:50 · 结算 最后一小时Twap"
3. **敲出规则**：
   - `knockoutRule.includes('协商')` → 协商敲出（灰），显示协商方案
   - 否则 → 强制敲出（红）
4. **分红规则**：
   - `dividendRule.includes('提前行权扣分红')` → 扣分红（橙），同时额外显示"分红不调整"标签
   - `dividendRule.includes('不调整')` → 不调整（灰）
   - 否则 → 调整（蓝）

### 4.4 RuleTag 标签体系

PositionTable 中仅展示两类规则标签：
- **敲出类**：`knockout-negotiated` | `knockout-forced`
- **分红类**：`dividend-adjust` | `dividend-none` | `dividend-deduct-warn`

注意：`exercise-rule` 和 `expiry-rule` 类型已定义但在列表中刻意不展示（代码注释：PRD NOTE）。

### 4.5 KeyEvents 生成规则

**前提条件**：外部录入持仓（`source === 'external'`）或无行情数据时，仅生成建仓和行权，跳过除权除息/分红调整/ST记录/停复牌。以下为有行情数据时的完整规则：

1. **建仓**：始终生成，使用 `position.startDate`
2. **除权除息**：仅亚丁 + `tradingRules.dividendRule` 存在 + 有行情，日期 = 持仓期 60% 位置
3. **分红调整**：仅亚丁 + 在除权除息后一天，根据规则分三种情况
4. **ST记录**：仅当有行情 + `tags.includes('ST')`，生成 ST+解除ST 两个事件
5. **停复牌**：仅当有行情 + `tags.includes('停牌')`，生成停牌+复牌两个事件
6. **行权**：仅当 `status === 'profitable-exercisable' | 'loss-exercisable'`

### 4.6 到期日历交互

- 左侧日期栏高度固定 `max-h-[244px]`，可滚动
- 展示 30 天（从 `2026-05-14` 起）
- 「近7天」按钮始终可点击，滚动到顶部
- 右侧合约卡片列数：`≥9 → grid-cols-4, ≥5 → grid-cols-3, else grid-cols-2`
- 空日期不显示 fallback 内容，仅显示"该日无到期合约"
- 筛选仅统计 `status !== 'closed' && status !== 'expired'` 的持仓

### 4.7 边界条件处理

- **DetailPage 404**：`position` 为 undefined → 显示"持仓不存在"+ 返回按钮
- **平仓弹窗**：剩余名本 ≤ 0 时确认按钮 disabled
- **ScenarioSimulator**：slider 范围 -100 到 +100，±1 按钮有边界限制
- **FilterBar 搜索**：空结果时显示"无匹配结果"
- **HistoricalPositionsPage 空数据**：显示"暂无记录"
- **股价图**：totalDays ≤ 0 时返回空数据
- **DistributionChart**：仅统计 `status !== 'closed' && status !== 'expired'`
- **ExpiryCalendar**：expired 和 closed 的持仓不在日历中显示
- **日期选择器**：所有 date input 使用 `onClick + showPicker()` 确保点击即弹出

---

## 5. 已做出的关键决策 & 原因

### 5.1 为什么使用 mockData + localStorage 而非后端 API

**决策**：所有数据硬编码在 `mockPositions` 数组，修改操作（平仓、标签、状态覆盖）通过 localStorage 持久化。

**原因**：
- 原型阶段不需要后端依赖
- GitHub Pages 静态部署可行
- localStorage 让交互状态在刷新后保留，提升演示体验
- PRD handoff 时数据结构直接作为接口定义参考

### 5.2 为什么 DetailPage 用 `isClosed` 分流而非两个独立页面

**决策**：同一个组件内通过 `if (isClosed) return <ClosedView />` 分流。

**原因**：
- 两个视图共享相同的路由参数和 position 查找逻辑
- 避免路由重复配置
- 未来可能需要在开仓/平仓间切换（如手动平仓后刷新）

### 5.3 为什么 FilterState 用 returnRateMin/Max 而非复用 returnRateRange

**决策**：新增独立字段 `returnRateMin` 和 `returnRateMax`，与 `returnRateRange`（下拉选择）并存。

**原因**：
- `returnRateRange` 是用户手动选择的预设区间
- `returnRateMin/Max` 是 DistributionChart 点击后精确设置的边界值
- 两者语义不同，共存避免互相覆盖

### 5.4 为什么非亚丁 expired 不在 applyFilters 中直接排除

**决策**：非亚丁的 expired 持仓保留在主列表，允许用户继续手动平仓。

**原因**：
- 非亚丁合约过期后仍可能通过协商手动平仓
- 用户需要看到这些持仓并操作
- 亚丁的 expired 自动视为 closed 是业务规则（系统自动处理）

### 5.5 为什么交易规则标签用 hover tooltip 而非 row expand

**决策**：PositionTable 中交易规则列显示紧凑标签，hover 时弹出 RULE_DETAIL 浮窗。

**原因**：
- 之前的 row expand（缩略详情）方案被否决——信息重复且交互冗余
- 规则详情是"按需查看"的辅助信息，不应占用表格空间
- tooltip 方式在原型中足够演示，实际开发可改为 Popover 组件

### 5.6 为什么 ScenarioSimulator 只在未平仓详情中展示

**决策**：已平仓详情不包含盈亏模拟器。

**原因**：
- 已平仓合约的盈亏已经确认，模拟无意义
- 用户反馈：模拟器属于"决策辅助工具"，仅对未来操作有价值

### 5.7 术语规范："名本" vs "本金"

**决策**：系统统一使用"名本"（名义本金），禁止使用"本金"一词。

**原因**：
- 金融衍生品领域，"本金"（principal）和"名本"（nominal principal / notional）是完全不同的概念
- 本金通常指实际投入/借出的资金；名本指合约计算的名义金额，用于计算盈亏但不一定实际交割
- 期权场景下用的是名义本金（notional），用"名本"才能准确表达业务含义
- 影响范围：所有 UI 标签、SectionTitle、字段名、mock 数据注释

### 5.8 交易对手历史记录

**决策**：交易对手字段独立于表单网格，置顶展示；提供本地历史快速填充。

**原因**：
- 交易对手是跨持仓高度重复的信息，用户不应反复输入
- localStorage 存全量历史（不去重上限），展示默认 5 条
- 预置 8 个券商名称作为初始数据（银河、中信、华泰、国泰君安、招商、广发、中金、海通）

### 5.9 批量导入校验极简化

**决策**：批量导入只校验"字段是否为空"，其余一律不检查。

**原因**：
- 用户填什么就是什么，不替用户校验业务合理性
- 标的查不到仅给 warning 提示，不阻止导入；后续页面缺数据就展示缺失态
- 日期倒挂、费率异常、名本量级、结构非标、周末到期、计算偏差等全部移除
- 只有必填字段为空才真正阻断（error）

**保留的 2 条规则**：
1. error：必填字段为空
2. warning：标的名或代码不在已知映射中

### 5.10 历史持仓详情关键事件记录

**决策**：已平仓/已到期持仓详情也展示 KeyEventsTimeline，非亚丁只跳过分红调整类事件。

**事件生成规则（修正后）**：
- 外部录入持仓（`source === 'external'`）或无行情数据：仅建仓、行权/平仓结算（跳过除权除息/分红调整/ST记录/停复牌）
- 有行情 · 所有对手方：建仓、ST记录、停复牌、行权/平仓结算
- 有行情 · 仅亚丁：额外生成除权除息、分红调整
- 已移除事件类型：异动（价格波动不属于关键事件记录范畴）
- 非亚丁持仓的建仓和行权事件不带 orderId（非亚丁合约无亚丁系统订单号关联）
- 已平仓/已到期：行权事件改为"平仓结算"记录，日期取到期日前 2 天，状态为"已结算"
- 时间轴截止到到期日

**其他**：
- 历史持仓详情去掉"刷新"按钮和行情时间戳（已平仓无行情）
- 价格信息去掉盈亏平衡点（已结算无需参考）
- 核心指标已使用"平仓净收益"等正确术语

### 5.11 被明确否决的方案

1. **缩略详情（行展开面板）** → 已删除，改为跳转详情页
2. **DrillDown Modal** → 已删除，全部改为 onFilter 触发筛选
3. **到期日历按合约分组 fallback** → 已删除，空日期仅显示"无到期合约"
4. **期权数量字段（optionQty）** → 已从整个项目删除，业务确认不需要
5. **欧式/美式区分** → 已删除，统一使用 T+1 或 T+5 行权规则
6. **名本/费率小字** → 已从指标卡片删除，保持卡片简洁

### 5.12 金额展示规范

统一金额展示格式，按数据性质分为 4 类：

| 类别 | 格式 | 适用场景 | 函数 |
|------|------|------|------|
| **汇总级大额** | 完整数字 + 括号简写 `150,000（15万）CNY` | 持仓总市值、持仓估值、持仓预估净收益（汇总卡片级）、盈亏分布汇总 | `formatAmount(v, cur)` |
| **名本** | 仅"万" + 币种 `500万 CNY` | 所有名本字段（开仓名本、持仓名本、行权名本、平仓名本），不论位置 | `formatNotional(v, cur)` |
| **收益/盈亏/费用/价格** | 仅完整数字 `150,000 CNY` | 预估净收益（表格列）、平仓净收益、期权费、市价、情景模拟盈亏 | `formatAmount(v, cur, false)` 或 `.toLocaleString()` |
| **百分比** | 百分比字符串 `+12.50%` | 收益率、期权费率、涨幅 | `formatRate(v)` |

**约束规则**：

1. 名本一律用"万"且必须带币种（`formatNotional`），禁用直接 `/10000` 裸拼
2. 收益/盈亏/期权费/市价 只用精确数字，禁止括号简写
3. 持仓估值等大额汇总数据，用完整数字+简写
4. 情景模拟器统一与表格列一致：价格和盈亏用精确数字

**涉及组件**：DetailPage、PositionTable、HistoricalPositionsPage、StatCards、ScenarioSimulator、ExternalEntryPage、BatchImportPage、DrillDownModal、DistributionChart

---

## 6. 已知局限 & 待办事项

### 6.1 硬编码的临时值

- **"今天"日期**：多个组件硬编码 `'2026-05-14'` 或 `'2026-05-20'`（getDaysUntilExpiry, ExpiryCalendar, 筛选默认值等）
- **股价生成**：`generatePriceData` 使用 `Math.random()` 和 sin 函数模拟，每次渲染结果不同
- **KeyEvents 日期**：使用固定比例（0.35, 0.6, 0.75）在持仓期内分布，非真实数据
- **平仓弹窗默认日期**：硬编码为 `'2026-05-20'`
- **昨日估值**：StatCards 中 `yesterdayValuationCNY = totalValuationCNY * 0.9`（纯占位）

### 6.2 未实现的功能

- **数据导出**：按钮已有但点击无实际操作
- **申请行权**：按钮展示但无后续流程
- **交易确认书链接**：字段存在但未在 UI 中展示
- **股价图真实数据**：当前为模拟数据，需接入行情 API
- **行权 T+1 vs T+5**：仅在 tradingRules 文本中体现，未影响日历计算

### 6.3 性能/体验妥协

- **手动平仓后 `window.location.reload()`**：全页刷新而非状态更新，会丢失滚动位置
- **mockData 单文件**：40+ 条 mock 数据 + 工具函数 + 类型定义全在 mockData.tsx，文件过大
- **DetailPage 单文件**：1369 行，包含多个内嵌子组件，应拆分
- **localStorage 无过期机制**：持久化数据永久保留
- **线框图和高保真**：两套代码并行维护，修改需同步

### 6.4 等待后端就绪的部分

- 所有 mockPositions 数据 → 替换为 API 调用
- localStorage 持久化 → 替换为后端存储
- 实时股价 → 接入 WebSocket 或轮询
- 交易确认书 → 文件服务

---

## 7. 文件地图

```
src/
├── app/
│   ├── App.tsx                          # 路由配置（7 条路由）
│   ├── components/
│   │   ├── mockData.tsx                 # 核心：Position 类型 + mockPositions(39条) + 工具函数 + localStorage 操作
│   │   ├── HighFidelityPage.tsx         # 主面板：FilterState 类型 + applyFilters() + 页面布局
│   │   ├── DetailPage.tsx              # 持仓详情：KeyEventsTimeline + 开仓/平仓双视图 + 手动平仓 Modal
│   │   ├── PositionTable.tsx           # 持仓表格：排序 + 分页 + StatusBadge + RuleTag tooltip + 手动平仓
│   │   ├── FilterBar.tsx               # 筛选栏：交易对手/币种快捷按钮 + 高级筛选下拉
│   │   ├── StatCards.tsx               # 4 张统计卡片：总市值/净收益/临近到期/可行权盈利
│   │   ├── ExpiryCalendar.tsx          # 到期日历：30 天日期栏 + 合约卡片网格
│   │   ├── DistributionChart.tsx       # 收益率分布饼图 + 图例
│   │   ├── ScenarioSimulator.tsx       # 盈亏模拟器：拉杆 + 固定场景
│   │   ├── HistoricalPositionsPage.tsx # 历史持仓页：P&L 汇总 + 列表
│   │   ├── ExternalEntryPage.tsx       # 外部数据录入
│   │   ├── BatchImportPage.tsx         # 批量导入
│   │   ├── WireframePage.tsx           # 线框图主面板
│   │   └── WireframeSubPages.tsx       # 线框图子页面
│   └── styles/
│       └── globals.css                 # Tailwind CSS 4.1 全局样式
├── index.html
├── package.json                        # React 18.3 + Vite 6.3 + Tailwind 4.1 + React Router 7 + Recharts + Lucide
├── vite.config.ts
└── tsconfig.json
```

### 数据流图（简化）

```
mockData.tsx (mockPositions[])
    │
    ├── HighFidelityPage (FilterState + displayPositions)
    │       │
    │       ├── StatCards (统计计算)
    │       ├── ExpiryCalendar (到期筛选)
    │       ├── DistributionChart (收益率分桶)
    │       ├── FilterBar (筛选UI)
    │       └── PositionTable (表格展示)
    │
    ├── DetailPage (单条 position + generateEvents + ScenarioSimulator)
    │
    └── HistoricalPositionsPage (closed positions)
    
localStorage (持久化)
    ├── closeRecords → addCloseRecord / getCloseRecords / getRemainingNotional
    ├── positionTags → DetailPage.TagEditor
    ├── tagPool → DetailPage.TagEditor + FilterBar
    ├── overriddenStatuses → HighFidelityPage + HistoricalPositionsPage
    └── position-table-columns → PositionTable
```

---

## 8. 部署

- GitHub Pages 部署源：`gh-pages` 分支
- 部署命令：`npm run deploy`（自动执行 `npm run build` + `gh-pages -d dist`）
- 仓库地址：https://github.com/gsardine1-lab/aden-pd
- 线上地址：https://gsardine1-lab.github.io/aden-pd
- 每次更新后运行 `npm run deploy` 将最新构建推送到 gh-pages 分支
