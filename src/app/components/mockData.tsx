import React from 'react';

export type Currency = 'CNY' | 'USD' | 'HKD';
export type OptionType = 'Call' | 'Put';
export type PositionStatus =
  | 'profitable-exercisable'
  | 'loss-exercisable'
  | 'not-expired'
  | 'expired'
  | 'closed';

export interface Position {
  id: string;
  underlying: string;
  code: string;
  market: string;                  // 市场
  strategy: string;
  operation: '买入' | '卖出';      // 操作方向
  optionType: OptionType;
  tradeType: string;               // 交易类型
  structure: string;
  startDate: string;
  expiryDate: string;
  term: string;                    // 期限
  earliestExerciseDate?: string;   // 最早行权日
  notionalCNY: number;             // 持仓名本
  openNotionalCNY: number;         // 开仓名本
  exercisingNotionalCNY?: number;  // 行权中名本
  optionQty: number;               // 持仓期权数量
  openPrice: number;
  strikePrice: number;
  currentPrice: number;
  breakEvenPrice: number;
  optionPremiumCNY: number;
  valuationCNY: number;
  pnlCNY: number;
  returnRate: number;
  priceDiff: number;
  breakevenDiff: number;           // 距平衡点
  status: PositionStatus;
  closingPnlCNY?: number;
  cumulativePnlCNY: number;
  currency: Currency;
  tradingRules: {
    exerciseRule: string;
    expiryRule: string;
    knockoutRule?: string;
    dividendRule?: string;
    negotiationPlan?: string;      // 协商方案
  };
  counterparty: string;            // 交易对手简称
  counterpartyFullName: string;    // 交易主体全称
  tags: string[];
  notes?: string;                  // 备注
  ruleNotes?: string;              // 交易规则备注补充
  tradeConfirmation?: string;      // 交易确认书
  source: 'system' | 'external';
}

export const mockPositions: Position[] = [
  {
    id: '1',
    underlying: '贵州茅台',
    code: '600519.SH',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '100%Call',
    startDate: '2025-11-15',
    expiryDate: '2026-05-20',
    term: '6个月',
    earliestExerciseDate: '2026-04-20',
    notionalCNY: 12000000,
    openNotionalCNY: 12000000,
    exercisingNotionalCNY: 6000000,
    optionQty: 7407,
    openPrice: 1620,
    strikePrice: 1620,
    currentPrice: 1832.5,
    breakEvenPrice: 1670,
    optionPremiumCNY: 600000,
    valuationCNY: 2100000,
    pnlCNY: 1500000,
    returnRate: 0.125,
    priceDiff: 0.1312,
    breakevenDiff: 0.0974,
    status: 'profitable-exercisable',
    cumulativePnlCNY: 1500000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '亚丁',
    counterpartyFullName: '亚丁资本管理有限公司',
    tags: ['ST', '停牌', '分红'],
    source: 'system',
    tradeConfirmation: 'TC-2025-11-15-001',
  },
  {
    id: '2',
    underlying: '宁德时代',
    code: '300750.SZ',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '103%Call',
    startDate: '2026-01-08',
    expiryDate: '2026-05-29',
    term: '5个月',
    notionalCNY: 8500000,
    openNotionalCNY: 8500000,
    optionQty: 28912,
    openPrice: 285,
    strikePrice: 294,
    currentPrice: 308.6,
    breakEvenPrice: 296,
    optionPremiumCNY: 374000,
    valuationCNY: 996000,
    pnlCNY: 622000,
    returnRate: 0.0732,
    priceDiff: 0.0828,
    breakevenDiff: 0.0426,
    status: 'not-expired',
    cumulativePnlCNY: 622000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '亚丁',
    counterpartyFullName: '亚丁资本管理有限公司',
    tags: [],
  },
  {
    id: '3',
    underlying: '比亚迪',
    code: '002594.SZ',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '105%Call',
    startDate: '2026-02-10',
    expiryDate: '2026-06-10',
    term: '4个月',
    notionalCNY: 6000000,
    openNotionalCNY: 6000000,
    optionQty: 19355,
    openPrice: 310,
    strikePrice: 326,
    currentPrice: 321.4,
    breakEvenPrice: 325,
    optionPremiumCNY: 270000,
    valuationCNY: 396000,
    pnlCNY: 126000,
    returnRate: 0.021,
    priceDiff: 0.0368,
    breakevenDiff: -0.0111,
    status: 'not-expired',
    cumulativePnlCNY: 126000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '亚丁',
    counterpartyFullName: '亚丁资本管理有限公司',
    tags: [],
  },
  {
    id: '4',
    underlying: '招商银行',
    code: '600036.SH',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '100%Call',
    startDate: '2026-03-01',
    expiryDate: '2026-06-01',
    term: '3个月',
    notionalCNY: 5000000,
    openNotionalCNY: 5000000,
    optionQty: 116279,
    openPrice: 42.5,
    strikePrice: 43,
    currentPrice: 41.12,
    breakEvenPrice: 44.0,
    optionPremiumCNY: 225000,
    valuationCNY: 135000,
    pnlCNY: -90000,
    returnRate: -0.018,
    priceDiff: -0.0325,
    breakevenDiff: -0.0654,
    status: 'not-expired',
    cumulativePnlCNY: -90000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '3连板协商敲出',
      dividendRule: '分红不调整',
      negotiationPlan: '原合约维持，多承担1个板',
    },
    counterparty: '银河证券',
    counterpartyFullName: '中国银河证券股份有限公司',
    tags: [],
  },
  {
    id: '5',
    underlying: '中国平安',
    code: '601318.SH',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '110%Call',
    startDate: '2025-12-20',
    expiryDate: '2026-06-20',
    term: '6个月',
    notionalCNY: 7200000,
    openNotionalCNY: 7200000,
    optionQty: 112500,
    openPrice: 58.5,
    strikePrice: 64,
    currentPrice: 53.8,
    breakEvenPrice: 62.0,
    optionPremiumCNY: 504000,
    valuationCNY: 171000,
    pnlCNY: -333000,
    returnRate: -0.0463,
    priceDiff: -0.0803,
    breakevenDiff: -0.1323,
    status: 'not-expired',
    cumulativePnlCNY: -333000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '中信证券',
    counterpartyFullName: '中信证券股份有限公司',
    tags: [],
  },
  {
    id: '6',
    underlying: '腾讯控股',
    code: 'HK.00700',
    market: '港股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '103%Call',
    startDate: '2026-01-15',
    expiryDate: '2026-05-22',
    term: '4个月',
    notionalCNY: 9800000,
    openNotionalCNY: 9800000,
    optionQty: 22633,
    openPrice: 420,
    strikePrice: 433,
    currentPrice: 355.6,
    breakEvenPrice: 448,
    optionPremiumCNY: 686000,
    valuationCNY: 147000,
    pnlCNY: -539000,
    returnRate: -0.055,
    priceDiff: -0.1533,
    breakevenDiff: -0.2063,
    status: 'loss-exercisable',
    cumulativePnlCNY: -539000,
    currency: 'HKD',
    tradingRules: {
      exerciseRule: '到期日 T+3 行权',
      expiryRule: '到期日不自动行权，需主动申请',
      dividendRule: '除息日前一个交易日调整执行价',
      knockoutRule: '3连板协商敲出',
      negotiationPlan: '原合约维持，多承担1个板',
    },
    counterparty: '亚丁',
    counterpartyFullName: '亚丁资本管理有限公司',
    tags: [],
    tradeConfirmation: 'TC-2026-01-15-006',
  },
  {
    id: '7',
    underlying: '苹果公司',
    code: 'AAPL',
    market: '美股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '100%Call',
    startDate: '2026-02-01',
    expiryDate: '2026-06-13',
    term: '4个月',
    earliestExerciseDate: '2026-05-13',
    notionalCNY: 14400000,
    openNotionalCNY: 14400000,
    exercisingNotionalCNY: 7200000,
    optionQty: 73846,
    openPrice: 195,
    strikePrice: 195,
    currentPrice: 212.8,
    breakEvenPrice: 204,
    optionPremiumCNY: 1008000,
    valuationCNY: 2304000,
    pnlCNY: 1296000,
    returnRate: 0.09,
    priceDiff: 0.0913,
    breakevenDiff: 0.0431,
    status: 'profitable-exercisable',
    cumulativePnlCNY: 1296000,
    currency: 'USD',
    tradingRules: {
      exerciseRule: '到期日 T+2 行权',
      expiryRule: '到期日自动行权（标准美式行权）',
      knockoutRule: '3连板协商敲出',
      dividendRule: '分红调整',
      negotiationPlan: '原合约维持，多承担1个板',
    },
    counterparty: '亚丁',
    counterpartyFullName: '亚丁资本管理有限公司',
    tags: [],
  },
  {
    id: '8',
    underlying: '特斯拉',
    code: 'TSLA',
    market: '美股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '105%Call',
    startDate: '2026-03-05',
    expiryDate: '2026-05-26',
    term: '3个月',
    notionalCNY: 7300000,
    openNotionalCNY: 7300000,
    optionQty: 24415,
    openPrice: 285,
    strikePrice: 299,
    currentPrice: 275.8,
    breakEvenPrice: 302,
    optionPremiumCNY: 511000,
    valuationCNY: 292000,
    pnlCNY: -219000,
    returnRate: -0.03,
    priceDiff: -0.0323,
    breakevenDiff: -0.0868,
    status: 'not-expired',
    cumulativePnlCNY: -219000,
    currency: 'USD',
    tradingRules: {
      exerciseRule: '到期日 T+2 行权',
      expiryRule: '到期日自动行权（标准美式行权）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红不调整',
    },
    counterparty: '华泰证券',
    counterpartyFullName: '华泰证券股份有限公司',
    tags: [],
  },
  {
    id: '9',
    underlying: '中国移动',
    code: 'HK.00941',
    market: '港股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '110%Call',
    startDate: '2025-10-20',
    expiryDate: '2026-04-20',
    term: '6个月',
    notionalCNY: 4200000,
    openNotionalCNY: 4200000,
    optionQty: 50602,
    openPrice: 75,
    strikePrice: 83,
    currentPrice: 79.8,
    breakEvenPrice: 79,
    optionPremiumCNY: 168000,
    valuationCNY: 168000,
    pnlCNY: 0,
    returnRate: 0.0,
    priceDiff: 0.064,
    breakevenDiff: 0.0101,
    status: 'expired',
    cumulativePnlCNY: 176400,
    currency: 'HKD',
    tradingRules: {
      exerciseRule: '到期日 T+3 行权',
      expiryRule: '到期日不自动行权，需主动申请',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '中金公司',
    counterpartyFullName: '中国国际金融股份有限公司',
    tags: [],
    notes: '已到期未行权，请关注后续处理',
  },
  {
    id: '10',
    underlying: '美的集团',
    code: '000333.SZ',
    market: 'A股',
    strategy: '香草看涨期权',
    operation: '买入',
    optionType: 'Call',
    tradeType: '看涨期权',
    structure: '100%Call',
    startDate: '2025-08-01',
    expiryDate: '2026-02-01',
    term: '6个月',
    notionalCNY: 15000000,
    openNotionalCNY: 15000000,
    optionQty: 10135,
    openPrice: 1480,
    strikePrice: 1480,
    currentPrice: 1832.5,
    breakEvenPrice: 1540,
    optionPremiumCNY: 900000,
    valuationCNY: 900000,
    pnlCNY: 3200000,
    returnRate: 0.2133,
    priceDiff: 0.2382,
    breakevenDiff: 0.1899,
    status: 'closed',
    closingPnlCNY: 3200000,
    cumulativePnlCNY: 3200000,
    currency: 'CNY',
    tradingRules: {
      exerciseRule: '到期日 T+5 行权',
      expiryRule: '到期日自动行权（盈利时）',
      knockoutRule: '2连板强制敲出',
      dividendRule: '分红调整',
    },
    counterparty: '国泰君安',
    counterpartyFullName: '国泰君安证券股份有限公司',
    tags: [],
    notes: '已平仓，收益率21.33%',
  },
  { id: '11', underlying: '美团', code: '3690.HK', market: '港股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '100%Call', startDate: '2026-02-15', expiryDate: '2026-06-15', term: '4个月', notionalCNY: 6500000, openNotionalCNY: 6500000, optionQty: 38690,
    openPrice: 168, strikePrice: 168, currentPrice: 182.5, breakEvenPrice: 176, optionPremiumCNY: 390000, valuationCNY: 910000, pnlCNY: 520000, returnRate: 0.08, priceDiff: 0.0863, breakevenDiff: 0.0369, status: 'not-expired', cumulativePnlCNY: 520000, currency: 'HKD',
    tradingRules: { exerciseRule: '到期日 T+3 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '2连板强制敲出', dividendRule: '分红不调整且提前行权扣分红' },
    counterparty: '亚丁', counterpartyFullName: '亚丁资本管理有限公司', tags: [], notes: '该笔为提前行权扣分红条款，行权时需扣减分红金额', },
  { id: '12', underlying: '阿里巴巴', code: '9988.HK', market: '港股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '103%Call', startDate: '2026-03-10', expiryDate: '2026-07-10', term: '4个月', notionalCNY: 8800000, openNotionalCNY: 8800000, optionQty: 89796,
    openPrice: 95, strikePrice: 98, currentPrice: 88.2, breakEvenPrice: 102, optionPremiumCNY: 528000, valuationCNY: 264000, pnlCNY: -264000, returnRate: -0.03, priceDiff: -0.0716, breakevenDiff: -0.1353, status: 'not-expired', cumulativePnlCNY: -264000, currency: 'HKD',
    tradingRules: { exerciseRule: '到期日 T+3 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '2连板强制敲出', dividendRule: '分红调整' },
    counterparty: '亚丁', counterpartyFullName: '亚丁资本管理有限公司', tags: [], notes: '距敲出价较近，请持续关注' },
  { id: '13', underlying: '小米集团', code: '1810.HK', market: '港股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '105%Call', startDate: '2026-01-20', expiryDate: '2026-05-28', term: '4个月', notionalCNY: 5200000, openNotionalCNY: 5200000, optionQty: 179310,
    openPrice: 28, strikePrice: 29, currentPrice: 32.5, breakEvenPrice: 30, optionPremiumCNY: 260000, valuationCNY: 624000, pnlCNY: 364000, returnRate: 0.07, priceDiff: 0.1607, breakevenDiff: 0.0833, status: 'profitable-exercisable', cumulativePnlCNY: 364000, currency: 'HKD',
    tradingRules: { exerciseRule: '到期日 T+3 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '2连板强制敲出', dividendRule: '分红不调整' },
    counterparty: '亚丁', counterpartyFullName: '亚丁资本管理有限公司', tags: [] },
  { id: '14', underlying: '中国石油', code: '601857.SH', market: 'A股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '100%Call', startDate: '2026-04-01', expiryDate: '2026-08-01', term: '4个月', notionalCNY: 3800000, openNotionalCNY: 3800000, optionQty: 422222,
    openPrice: 8.5, strikePrice: 9, currentPrice: 7.92, breakEvenPrice: 9.2, optionPremiumCNY: 190000, valuationCNY: 95000, pnlCNY: -95000, returnRate: -0.025, priceDiff: -0.0682, breakevenDiff: -0.1391, status: 'not-expired', cumulativePnlCNY: -95000, currency: 'CNY',
    tradingRules: { exerciseRule: '到期日 T+5 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '2连板强制敲出', dividendRule: '分红调整' },
    counterparty: '招商证券', counterpartyFullName: '招商证券股份有限公司', tags: [] },
  { id: '15', underlying: '五粮液', code: '000858.SZ', market: 'A股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '103%Call', startDate: '2026-03-20', expiryDate: '2026-07-20', term: '4个月', notionalCNY: 5600000, openNotionalCNY: 5600000, optionQty: 32941,
    openPrice: 165, strikePrice: 170, currentPrice: 178.3, breakEvenPrice: 172, optionPremiumCNY: 336000, valuationCNY: 784000, pnlCNY: 448000, returnRate: 0.08, priceDiff: 0.0806, breakevenDiff: 0.0366, status: 'not-expired', cumulativePnlCNY: 448000, currency: 'CNY',
    tradingRules: { exerciseRule: '到期日 T+5 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '3连板协商敲出', dividendRule: '分红调整', negotiationPlan: '原合约维持，多承担1个板' },
    counterparty: '亚丁', counterpartyFullName: '亚丁资本管理有限公司', tags: [] },
  { id: '16', underlying: '英伟达', code: 'NVDA', market: '美股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '110%Call', startDate: '2026-02-28', expiryDate: '2026-05-30', term: '3个月', notionalCNY: 16000000, openNotionalCNY: 16000000, optionQty: 15311,
    openPrice: 950, strikePrice: 1045, currentPrice: 1020.5, breakEvenPrice: 990, optionPremiumCNY: 960000, valuationCNY: 2240000, pnlCNY: 1280000, returnRate: 0.08, priceDiff: 0.0742, breakevenDiff: 0.0308, status: 'profitable-exercisable', cumulativePnlCNY: 1280000, currency: 'USD',
    tradingRules: { exerciseRule: '到期日 T+2 行权', expiryRule: '到期日自动行权（标准美式行权）', knockoutRule: '2连板强制敲出', dividendRule: '分红不调整' },
    counterparty: '亚丁', counterpartyFullName: '亚丁资本管理有限公司', tags: [] },
  { id: '17', underlying: '亚马逊', code: 'AMZN', market: '美股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '105%Call', startDate: '2026-03-15', expiryDate: '2026-06-20', term: '3个月', notionalCNY: 12000000, openNotionalCNY: 12000000, optionQty: 61856,
    openPrice: 185, strikePrice: 194, currentPrice: 172.3, breakEvenPrice: 198, optionPremiumCNY: 780000, valuationCNY: 240000, pnlCNY: -540000, returnRate: -0.045, priceDiff: -0.0686, breakevenDiff: -0.1298, status: 'not-expired', cumulativePnlCNY: -540000, currency: 'USD',
    tradingRules: { exerciseRule: '到期日 T+2 行权', expiryRule: '到期日自動行权（标准美式行权）', knockoutRule: '2连板强制敲出', dividendRule: '分红不调整' },
    counterparty: '海通证券', counterpartyFullName: '海通证券股份有限公司', tags: [] },
  { id: '18', underlying: '格力电器', code: '000651.SZ', market: 'A股', strategy: '香草看涨期权', operation: '买入', optionType: 'Call', tradeType: '看涨期权', structure: '100%Call', startDate: '2025-09-01', expiryDate: '2026-01-15', term: '5个月', notionalCNY: 4800000, openNotionalCNY: 4800000, optionQty: 126316,
    openPrice: 38, strikePrice: 38, currentPrice: 42.5, breakEvenPrice: 41, optionPremiumCNY: 192000, valuationCNY: 192000, pnlCNY: 410000, returnRate: 0.0854, priceDiff: 0.1184, breakevenDiff: 0.0366, status: 'closed', closingPnlCNY: 410000, cumulativePnlCNY: 410000, currency: 'CNY',
    tradingRules: { exerciseRule: '到期日 T+5 行权', expiryRule: '到期日自动行权（盈利时）', knockoutRule: '2连板强制敲出', dividendRule: '分红调整' },
    counterparty: '广发证券', counterpartyFullName: '广发证券股份有限公司', tags: [], notes: '已平仓，收益率约8.5%' },
];

// ============================================================
// 平仓记录（支持多次部分平仓）
// ============================================================
export interface CloseRecord {
  id: string;
  date: string;
  price: number;
  notionalCNY: number; // 本次平仓名本（万）
}

export function getCloseRecords(): Record<string, CloseRecord[]> {
  try {
    const saved = localStorage.getItem('closeRecords');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export function getClosedNotional(positionId: string): number {
  const records = getCloseRecords()[positionId] || [];
  return records.reduce((sum, r) => sum + r.notionalCNY, 0);
}

export function getRemainingNotional(position: Position): number {
  const original = position.openNotionalCNY || position.notionalCNY;
  const closed = getClosedNotional(position.id);
  return Math.max(0, original - closed);
}

export function addCloseRecord(positionId: string, record: CloseRecord) {
  const all = getCloseRecords();
  if (!all[positionId]) all[positionId] = [];
  all[positionId].push(record);
  localStorage.setItem('closeRecords', JSON.stringify(all));
}

export const FX_RATES = { CNY: 1, USD: 7.23, HKD: 0.927 };

export function convertCurrency(amountCNY: number, toCurrency: Currency): number {
  return amountCNY / FX_RATES[toCurrency];
}

export function formatNotional(amountCNY: number, currency: Currency): string {
  const amount = convertCurrency(amountCNY, currency);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${Math.round(abs / 10000).toLocaleString()}万`;
}

export function formatAmount(amount: number, currency: Currency, showAbbr = true): React.ReactNode {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const full = abs.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  let abbr: string | null = null;
  if (showAbbr && abs >= 100000000) {
    const v = abs / 100000000;
    const hasRemainder = abs % 100000000 !== 0;
    abbr = `${Math.floor(v)}亿${hasRemainder ? '+' : ''}`;
  } else if (showAbbr && abs >= 10000) {
    const v = abs / 10000;
    const hasRemainder = abs % 10000 !== 0;
    abbr = `${Math.floor(v)}万${hasRemainder ? '+' : ''}`;
  }

  return (
    <span className="whitespace-nowrap">
      {sign}{full}
      {abbr && <span className="text-[0.7em] text-[#9CA3AF] ml-1">（{abbr}）</span>}
    </span>
  );
}

export function formatRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(2)}%`;
}

export const ALL_TAGS: readonly string[] = [];

export const PROFIT_BUCKETS = [
  { label: '重度浮盈', key: 'heavy-profit', min: 0.1, max: Infinity, color: '#E53935' },
  { label: '中度浮盈', key: 'mid-profit', min: 0.05, max: 0.1, color: '#EF5350' },
  { label: '轻度浮盈', key: 'light-profit', min: 0, max: 0.05, color: '#FF8A80' },
  { label: '轻度浮亏', key: 'light-loss', min: -0.05, max: 0, color: '#B9F6CA' },
  { label: '中度浮亏', key: 'mid-loss', min: -0.1, max: -0.05, color: '#69F0AE' },
  { label: '重度浮亏', key: 'heavy-loss', min: -Infinity, max: -0.1, color: '#00E676' },
];

export function getBucketForRate(rate: number) {
  return PROFIT_BUCKETS.find((b) => rate >= b.min && rate < b.max) ?? PROFIT_BUCKETS[5];
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date('2026-05-14');
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
