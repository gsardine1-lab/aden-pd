import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2, XCircle, Search, Download, FileSpreadsheet } from 'lucide-react';
import { mockPositions } from './mockData';

// ============================================================
// 字段定义（不含标签和备注，不含持仓名本）
// ============================================================
interface ImportRow {
  id: number;
  underlying: string;
  code: string;
  currency: string;           // 币种，根据标的自动判定，不可编辑
  structure: string;
  term: string;
  counterparty: string;
  startDate: string;
  expiryDate: string;
  openNotionalCNY: string;    // 开仓名本（万）
  optionQty: string;
  premiumRate: string;
  optionPremiumCNY: string;
  openPrice: string;
  strikePrice: string;
  // 校验结果
  status: 'ok' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
}

type ImportField = keyof Omit<ImportRow, 'id' | 'status' | 'errors' | 'warnings'>;

const FIELD_LABELS: Record<ImportField, string> = {
  underlying: '标的名称',
  code: '标的代码',
  currency: '币种',
  structure: '结构',
  term: '期限',
  counterparty: '交易对手',
  startDate: '开仓日',
  expiryDate: '到期日',
  openNotionalCNY: '开仓名本(万)',
  optionQty: '期权数量',
  premiumRate: '期权费率',
  optionPremiumCNY: '期权费',
  openPrice: '开仓价',
  strikePrice: '执行价',
};

const REQUIRED_IMPORT_FIELDS: ImportField[] = [
  'underlying', 'code', 'structure', 'term', 'counterparty',
  'startDate', 'expiryDate', 'openNotionalCNY', 'openPrice',
  'optionQty', 'premiumRate', 'optionPremiumCNY', 'strikePrice',
];

const TABLE_COLUMNS: ImportField[] = [
  'underlying', 'code', 'currency', 'counterparty', 'structure', 'term',
  'startDate', 'expiryDate', 'openNotionalCNY', 'openPrice', 'strikePrice',
  'premiumRate', 'optionPremiumCNY',
];

const COLUMN_WIDTHS: Partial<Record<ImportField, number>> = {
  currency: 52,
  structure: 72,
  term: 95,
  openNotionalCNY: 96,
  premiumRate: 72,
};

const NUMERIC_FIELDS: ImportField[] = ['openNotionalCNY', 'optionQty', 'optionPremiumCNY', 'openPrice', 'strikePrice'];

// ============================================================
// 标的映射 + 币种判定
// ============================================================
const codeToName: Record<string, string> = {};
const nameToCode: Record<string, string> = {};
const codeToCurrency: Record<string, string> = {};
mockPositions.forEach(p => {
  codeToName[p.code] = p.underlying;
  nameToCode[p.underlying] = p.code;
  codeToCurrency[p.code] = p.currency;
});
const EXTRA_STOCKS: [string, string, string][] = [
  ['中证1000', '000852', 'CNY'], ['上证50', '000016', 'CNY'], ['沪深300', '000300', 'CNY'],
  ['中证500', '000905', 'CNY'], ['创业板指', '399006', 'CNY'], ['恒生指数', 'HSI', 'HKD'], ['标普500', 'SPX', 'USD'],
];
EXTRA_STOCKS.forEach(([name, code, cur]) => { codeToName[code] = name; nameToCode[name] = code; codeToCurrency[code] = cur; });

function getStockCurrency(code: string): string {
  if (codeToCurrency[code]) return codeToCurrency[code];
  if (/\.(SH|SZ)$/.test(code) || /^\d{6}$/.test(code)) return 'CNY';
  if (code === 'HSI') return 'HKD';
  if (code === 'SPX') return 'USD';
  return 'CNY';
}

const ALL_STRUCTURES = ['70%', '80%', '90%', '100%', '103%', '105%', '110%', '115%', '120%', '8080', '9090', '9080', '9070'];
const KNOWN_STRUCTURES = new Set(ALL_STRUCTURES);

function parseTerm(term: string): { num: string; unit: string } {
  const m = term.match(/^(\d+)\s*(周|月)/);
  return m ? { num: m[1], unit: m[2] } : { num: '', unit: '月' };
}

// ============================================================
// Mock Excel 导入数据生成
// ============================================================
function generateMockImportData(): ImportRow[] {
  const bases = mockPositions.slice(0, 8);
  const structures = ['100%', '103%', '105%'];
  const counterparties = ['银河证券', '中信证券', '华泰证券', '国泰君安', '招商证券', '广发证券'];
  const terms = ['1月', '3月', '6月', '12月', '2周'];

  const rows: ImportRow[] = [];
  let id = 1;

  for (let i = 0; i < 35; i++) {
    const base = bases[i % bases.length];
    const struct = structures[i % 3];
    const cp = counterparties[i % counterparties.length];
    const term = terms[i % 5];
    const currency = base.currency || 'CNY';

    const notionalValues = [10, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000, 1500, 2000, 3000];
    const notional = String(notionalValues[i % notionalValues.length]);
    const price = String(Math.round((100 + Math.random() * 3000)));
    const premRate = String(Math.round((3 + Math.random() * 12)));
    const optPrem = String(Math.round(Number(notional) * 10000 * Number(premRate) / 100));
    const qty = String(Math.round(Number(notional) * 10000 / Number(price)));
    const strikeP = (Number(price) * (parseFloat(struct) / 100)).toFixed(2);

    const startD = new Date('2026-05-20');
    startD.setDate(startD.getDate() + Math.round(Math.random() * 60 - 30));
    const endD = new Date(startD);
    endD.setMonth(endD.getMonth() + parseInt(term) || 1);

    rows.push({
      id,
      underlying: base.underlying,
      code: base.code,
      currency,
      structure: struct,
      term,
      counterparty: cp,
      startDate: startD.toISOString().slice(0, 10),
      expiryDate: endD.toISOString().slice(0, 10),
      openNotionalCNY: notional,
      optionQty: qty,
      premiumRate: premRate,
      optionPremiumCNY: optPrem,
      openPrice: price,
      strikePrice: strikeP,
      status: 'ok',
      errors: [],
      warnings: [],
    });
    id++;
  }

  // 注入错误/警告行
  rows[3] = { ...rows[3], underlying: '不存在的标的', code: '999999.XZ' };        // 警告：标的未识别
  rows[7] = { ...rows[7], structure: '', openPrice: '' };                         // 错误：必填为空
  rows[23] = { ...rows[23], counterparty: '' };                                   // 错误：必填为空
  rows[27] = { ...rows[27], term: '', premiumRate: '' };                          // 错误：必填为空

  return rows.map(validateRow);
}

// ============================================================
// 校验单行
// ============================================================
function validateRow(row: ImportRow): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 阻断：必填字段为空
  for (const field of REQUIRED_IMPORT_FIELDS) {
    if (!row[field]) {
      errors.push(`${FIELD_LABELS[field]}未填写`);
    }
  }

  // 提醒：标的名或代码不在已知映射中
  if (row.underlying && !nameToCode[row.underlying]) {
    warnings.push('标的名称未识别，后续展示可能缺失数据');
  }
  if (row.code && !codeToName[row.code]) {
    warnings.push('标的代码未识别，后续展示可能缺失数据');
  }

  const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';
  return { ...row, errors, warnings, status };
}

// ============================================================
// 主组件
// ============================================================
export function BatchImportPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'error' | 'warning' | 'ok'>('all');
  const [search, setSearch] = useState('');
  const [counterpartyFilter, setCounterpartyFilter] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: ImportField } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState('月');
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setTimeout(() => {
      const generated = generateMockImportData();
      setRows(generated);
      setConfirmed(false);
    }, 800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setTimeout(() => {
      const generated = generateMockImportData();
      setRows(generated);
      setConfirmed(false);
    }, 800);
  };

  const stats = useMemo(() => {
    if (!rows) return { total: 0, errors: 0, warnings: 0, ok: 0 };
    return {
      total: rows.length,
      errors: rows.filter(r => r.status === 'error').length,
      warnings: rows.filter(r => r.status === 'warning').length,
      ok: rows.filter(r => r.status === 'ok').length,
    };
  }, [rows]);

  const aggregateStats = useMemo(() => {
    if (!rows) return null;
    const byCounterparty: Record<string, { count: number; notional: number; premium: number }> = {};
    let totalNotional = 0;
    let totalPremium = 0;
    rows.forEach(r => {
      const cp = r.counterparty || '未填写';
      if (!byCounterparty[cp]) byCounterparty[cp] = { count: 0, notional: 0, premium: 0 };
      byCounterparty[cp].count++;
      const n = Number(r.openNotionalCNY) || 0;
      const p = Number(r.optionPremiumCNY) || 0;
      byCounterparty[cp].notional += n;
      byCounterparty[cp].premium += p;
      totalNotional += n;
      totalPremium += p;
    });
    return { totalNotional, totalPremium, counterpartyCount: Object.keys(byCounterparty).length, totalCount: rows.length, byCounterparty };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter(r => {
      if (statusFilter === 'error' && r.status !== 'error') return false;
      if (statusFilter === 'warning' && r.status !== 'warning') return false;
      if (statusFilter === 'ok' && r.status !== 'ok') return false;
      if (counterpartyFilter && r.counterparty !== counterpartyFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.underlying.includes(search) && !r.code.toLowerCase().includes(s) && !r.counterparty.includes(search)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, search, counterpartyFilter]);

  // 开始编辑单元格
  const startEdit = (id: number, field: ImportField, currentValue: string) => {
    setEditingCell({ id, field });
    if (field === 'term') {
      const p = parseTerm(currentValue);
      setEditValue(p.num);
      setEditUnit(p.unit);
    } else {
      setEditValue(currentValue);
    }
    // 非 text 类型不需要手动 focus input（select/date 是原生控件）
    if (field !== 'structure' && field !== 'startDate' && field !== 'expiryDate' && field !== 'term') {
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  };

  // 联动计算：单字段修改 → 返回完整更新后的行
  const applyCascades = (r: ImportRow, field: ImportField, value: string): ImportRow => {
    let next = { ...r, [field]: value };

    // 1. 标的名称 → 代码联动
    if (field === 'underlying' && nameToCode[value]) {
      next = { ...next, code: nameToCode[value] };
    }
    // 2. 标的代码 → 名称 + 币种联动
    if (field === 'code') {
      if (codeToName[value]) next = { ...next, underlying: codeToName[value] };
      next = { ...next, currency: getStockCurrency(value) };
    }
    // 3. 期限 → 开仓日/到期日联动
    if (field === 'term' && value) {
      const { num, unit } = parseTerm(value);
      const n = Number(num);
      if (n) {
        const today = new Date('2026-05-20');
        const start = today.toISOString().slice(0, 10);
        const end = new Date(today);
        if (unit === '周') end.setDate(end.getDate() + n * 7);
        else end.setMonth(end.getMonth() + n); // 月
        next = { ...next, startDate: start, expiryDate: end.toISOString().slice(0, 10) };
      }
    }
    // 4. 开仓名本 + 费率 → 期权费联动
    if (field === 'openNotionalCNY' || field === 'premiumRate') {
      const notional = Number(field === 'openNotionalCNY' ? value : next.openNotionalCNY);
      const rate = Number(field === 'premiumRate' ? value : next.premiumRate);
      if (notional > 0 && rate > 0) {
        next = { ...next, optionPremiumCNY: String(Math.round(notional * 10000 * rate / 100)) };
      }
    }
    // 5. 开仓名本 + 开仓价 → 期权数量联动
    if (field === 'openNotionalCNY' || field === 'openPrice') {
      const notional = Number(field === 'openNotionalCNY' ? value : next.openNotionalCNY);
      const price = Number(field === 'openPrice' ? value : next.openPrice);
      if (notional > 0 && price > 0) {
        next = { ...next, optionQty: String(Math.round(notional * 10000 / price)) };
      }
    }
    // 6. 开仓价 × 结构 → 执行价联动
    if (field === 'openPrice' || field === 'structure') {
      const price = Number(field === 'openPrice' ? value : next.openPrice);
      const struct = field === 'structure' ? value : next.structure;
      if (price > 0 && struct) {
        const pct = parseFloat(struct) / 100;
        next = { ...next, strikePrice: (price * pct).toFixed(2) };
      }
    }

    return next;
  };

  const commitEdit = (value?: string) => {
    if (!editingCell || !rows) return;
    const { id, field } = editingCell;
    const finalValue = value ?? (field === 'term' ? (editValue ? `${editValue}${editUnit}` : '') : editValue);

    const updated = rows.map(r => {
      if (r.id !== id) return r;
      const cascaded = applyCascades(r, field, finalValue);
      return validateRow(cascaded);
    });
    setRows(updated);
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  // 确认导入
  const handleConfirm = () => {
    if (!rows) return;
    const validRows = rows.filter(r => r.status !== 'error');
    const entries = validRows.map(r => ({
      id: `batch-${Date.now()}-${r.id}`,
      underlying: r.underlying,
      code: r.code,
      currency: r.currency,
      structure: r.structure,
      term: r.term,
      counterparty: r.counterparty,
      startDate: r.startDate,
      expiryDate: r.expiryDate,
      openNotionalCNY: r.openNotionalCNY,
      notionalCNY: r.openNotionalCNY,
      optionQty: r.optionQty,
      premiumRate: r.premiumRate,
      optionPremiumCNY: r.optionPremiumCNY,
      openPrice: r.openPrice,
      strikePrice: r.strikePrice,
      ruleNotes: '',
      tags: [] as string[],
      source: 'external' as const,
    }));

    try {
      const existing = localStorage.getItem('externalPositions');
      const list = existing ? JSON.parse(existing) : [];
      list.push(...entries);
      localStorage.setItem('externalPositions', JSON.stringify(list));
    } catch {}

    setConfirmed(true);
    alert(`成功导入 ${validRows.length} 条持仓（已跳过 ${rows.length - validRows.length} 条异常数据）`);
    navigate('/');
  };

  const StatusBadge = ({ status }: { status: ImportRow['status'] }) => {
    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
          <XCircle size={10} />错误
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
          <AlertTriangle size={10} />警告
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
        <CheckCircle2 size={10} />正常
      </span>
    );
  };

  // ============================================================
  // 可编辑单元格 — 根据字段类型渲染不同编辑器
  // ============================================================
  const EditableCell = ({ id, field, value }: { id: number; field: ImportField; value: string }) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;

    // 币种：纯展示
    if (field === 'currency') {
      const colors: Record<string, string> = {
        CNY: 'bg-[#EFF6FF] text-[#1677FF] border-[#1677FF]/20',
        USD: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
        HKD: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      };
      return (
        <span className={`text-[10px] px-1 py-0.5 rounded font-medium border whitespace-nowrap ${colors[value] || 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'}`}>
          {value || '-'}
        </span>
      );
    }

    if (!isEditing) {
      const isRequired = REQUIRED_IMPORT_FIELDS.includes(field);
      const isEmpty = !value;

      const display = (() => {
        if (isEmpty && isRequired) return <span className="text-[#DC2626] font-medium">未填写</span>;
        if (isEmpty) return <span className="text-[#D1D5DB]">-</span>;
        if (NUMERIC_FIELDS.includes(field)) return Number(value).toLocaleString();
        if (field === 'premiumRate') return `${value}%`;
        if (field === 'openNotionalCNY') return `${Number(value).toLocaleString()}万 CNY`;
        return value;
      })();

      return (
        <div
          className={`cursor-pointer hover:bg-[#EFF6FF] rounded px-1.5 py-1 -mx-1.5 transition-colors text-[11px] min-h-[22px] flex items-center whitespace-nowrap ${
            isEmpty && isRequired ? 'bg-[#FEF2F2] border border-[#FCA5A5]' : ''
          }`}
          onClick={() => startEdit(id, field, value)}
          title="点击编辑"
        >
          {display}
        </div>
      );
    }

    // === 编辑态 ===

    // 期限：数字 + 单位下拉
    if (field === 'term') {
      return (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
            className="w-14 text-[11px] border border-[#1677FF] rounded px-1.5 py-1 focus:outline-none bg-white"
            autoFocus
            placeholder="6"
          />
          <select
            value={editUnit}
            onChange={e => { setEditUnit(e.target.value); commitEdit(editValue ? `${editValue}${e.target.value}` : ''); }}
            className="text-[11px] border border-[#1677FF] rounded px-1 py-1 focus:outline-none bg-white"
          >
            <option value="周">周</option>
            <option value="月">月</option>
          </select>
          <button onClick={() => commitEdit()} className="text-[#059669] hover:bg-[#ECFDF5] rounded p-0.5" title="确认"><CheckCircle2 size={13} /></button>
          <button onClick={cancelEdit} className="text-[#9CA3AF] hover:text-[#E53935] hover:bg-[#FEF2F2] rounded p-0.5" title="取消"><XCircle size={13} /></button>
        </div>
      );
    }

    // 结构：下拉选择
    if (field === 'structure') {
      return (
        <select
          value={editValue}
          onChange={e => commitEdit(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
          className="text-[11px] border border-[#1677FF] rounded px-1 py-1 focus:outline-none bg-white"
          autoFocus
          onClick={e => e.stopPropagation()}
        >
          <option value="">请选择</option>
          {ALL_STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }

    // 日期：date input
    if (field === 'startDate' || field === 'expiryDate') {
      return (
        <input
          type="date"
          value={editValue}
          onChange={e => commitEdit(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
          onClick={e => { e.stopPropagation(); e.preventDefault(); (e.target as HTMLInputElement).showPicker?.(); }}
          className="text-[11px] border border-[#1677FF] rounded px-1 py-1 focus:outline-none bg-white cursor-pointer"
          autoFocus
        />
      );
    }

    // 默认：文本输入
    return (
      <input
        ref={editInputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={() => commitEdit()}
        onKeyDown={e => {
          if (e.key === 'Enter') commitEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
        className="w-full text-[11px] border border-[#1677FF] rounded px-1.5 py-1 focus:outline-none bg-white min-w-[60px]"
        onClick={e => e.stopPropagation()}
      />
    );
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const headers = [
      '标的名称', '标的代码', '交易对手', '结构', '期限(数字)', '期限单位(周/月)',
      '开仓日', '到期日', '开仓名本(万)', '开仓价', '执行价',
      '期权费率(%)', '期权费',
    ];
    const sampleRow1 = [
      '贵州茅台', '600519.SH', '银河证券', '100%', '6', '月',
      '2026-05-20', '2026-11-20', '500', '1620', '1620',
      '5', '250000',
    ];
    const sampleRow2 = [
      '宁德时代', '300750.SZ', '中信证券', '103%', '2', '周',
      '2026-05-20', '2026-06-03', '300', '285', '293.55',
      '3', '90000',
    ];
    const csv = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '持仓批量导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (confirmed) {
    return (
      <div className="flex h-screen bg-[#F0F2F5] items-center justify-center">
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-[#059669] mb-4" />
          <div className="text-lg font-bold text-[#0D1117] mb-2">导入完成</div>
          <div className="text-sm text-[#6B7280]">正在跳转回持仓总览...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden" style={{ minWidth: '1280px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部 */}
        <div className="flex items-center justify-between px-6 h-14 bg-white border-b border-[#E8ECF0] flex-shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1677FF] transition-colors"
          >
            <ArrowLeft size={16} />
            返回持仓总览
          </button>
          <h1 className="text-lg font-bold text-[#0D1117]">批量导入 — 数据审核</h1>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ===== 上传区域 ===== */}
          {!rows && (
            <div id="upload-area" data-anchor className="max-w-2xl mx-auto mt-16">
              <div
                className="border-2 border-dashed border-[#D1D5DB] rounded-xl bg-white p-12 text-center hover:border-[#1677FF] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload size={40} className="mx-auto text-[#9CA3AF] mb-4" />
                <div className="text-sm font-semibold text-[#374151] mb-1">点击上传或拖拽 Excel 文件到此处</div>
                <div className="text-xs text-[#9CA3AF] mb-4">支持 .xlsx / .xls / .csv 格式</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button className="px-6 py-2.5 bg-[#1677FF] text-white text-sm font-medium rounded-lg hover:bg-[#0E5FCC] transition-colors">
                  选择文件
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>导入字段：标的名称、标的代码、交易对手、结构、期限、开仓日、到期日、开仓名本(万)、开仓价、执行价、期权费率、期权费</span>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1 text-[#1677FF] hover:text-[#0E5FCC] font-medium flex-shrink-0 ml-4"
                >
                  <Download size={12} />
                  下载导入模板
                </button>
              </div>

              {/* Mock 快速填充 */}
              <div className="mt-6 p-4 bg-white rounded-xl border border-[#E8ECF0]">
                <div className="text-xs font-semibold text-[#374151] mb-2">开发调试：Mock 数据快速填充</div>
                <button
                  onClick={() => {
                    setFileName('mock-持仓数据.xlsx');
                    setTimeout(() => {
                      const generated = generateMockImportData();
                      const validated = generated.map(validateRow);
                      setRows(validated);
                      setConfirmed(false);
                    }, 600);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded-lg hover:bg-[#E5E7EB] transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  加载 Mock 导入数据（35条，含异常）
                </button>
              </div>
            </div>
          )}

          {/* ===== 审核列表 ===== */}
          {rows && (
            <div id="review-table" data-anchor className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm overflow-hidden">
              {/* 汇总条 */}
              <div className="px-5 py-3 border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#0D1117]">
                      {fileName} — 共解析 {stats.total} 条
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-[#059669]">
                        <CheckCircle2 size={12} />{stats.ok} 正常
                      </span>
                      {stats.warnings > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-[#D97706]">
                          <AlertTriangle size={12} />{stats.warnings} 警告
                        </span>
                      )}
                      {stats.errors > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-[#DC2626]">
                          <XCircle size={12} />{stats.errors} 错误
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setRows(null); setFileName(''); setCounterpartyFilter(null); }}
                    className="text-xs text-[#6B7280] hover:text-[#374151] underline"
                  >
                    重新上传
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B7280]">
                  <span>{stats.ok + stats.warnings} 条可导入</span>
                  {stats.errors > 0 && (
                    <span className="text-[#DC2626]">— 异常数据将在导入时跳过</span>
                  )}
                </div>
              </div>

              {/* 筛选栏 */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-2">
                  {([
                    { v: 'all' as const, l: `全部 (${stats.total})` },
                    { v: 'error' as const, l: `错误 (${stats.errors})` },
                    { v: 'warning' as const, l: `警告 (${stats.warnings})` },
                    { v: 'ok' as const, l: `正常 (${stats.ok})` },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setStatusFilter(opt.v)}
                      className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
                        statusFilter === opt.v
                          ? opt.v === 'error' ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                          : opt.v === 'warning' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                          : opt.v === 'ok' ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : 'bg-[#1677FF] text-white border-[#1677FF]'
                          : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="搜索标的/代码/对手"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 text-[11px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1677FF] w-48 bg-white"
                  />
                </div>
              </div>

              {/* 聚合看板 */}
              {aggregateStats && (
                <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm overflow-hidden">
                    {/* 看板头部 */}
                    <div className="px-5 py-3 border-b border-[#F3F4F6] bg-[#FAFBFC]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#0D1117]">录入概览</span>
                        <span className="text-[10px] text-[#9CA3AF]">— 快速校验录入数据</span>
                      </div>
                    </div>

                    {/* 汇总指标 */}
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#9CA3AF]">总名本</span>
                          <span className="text-base font-bold text-[#0D1117] tracking-tight">{aggregateStats.totalNotional.toLocaleString()}<span className="text-xs font-normal text-[#9CA3AF] ml-1">万 CNY</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#9CA3AF]">总期权费</span>
                          <span className="text-base font-bold text-[#0D1117] tracking-tight">{aggregateStats.totalPremium.toLocaleString()}<span className="text-xs font-normal text-[#9CA3AF] ml-1">CNY</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#9CA3AF]">总持仓数</span>
                          <span className="text-base font-bold text-[#0D1117] tracking-tight">{aggregateStats.totalCount} <span className="text-xs font-normal text-[#9CA3AF]">笔</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#9CA3AF]">涉及机构</span>
                          <span className="text-base font-bold text-[#0D1117] tracking-tight">{aggregateStats.counterpartyCount} <span className="text-xs font-normal text-[#9CA3AF]">家</span></span>
                        </div>
                      </div>
                    </div>

                    {/* 按交易对手拆分 */}
                    <div className="border-t border-[#F3F4F6]">
                      <div className="px-5 py-2 bg-[#FAFBFC]">
                        <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">按交易对手</span>
                      </div>
                      <div className="px-5 pb-4">
                        <table className="w-full table-fixed text-[11px]">
                          <thead>
                            <tr className="border-b border-[#F3F4F6]">
                              <th className="text-left py-2 text-[10px] font-medium text-[#9CA3AF] w-[28%]">交易对手</th>
                              <th className="text-right py-2 text-[10px] font-medium text-[#9CA3AF] w-[16%]">笔数</th>
                              <th className="text-right py-2 text-[10px] font-medium text-[#9CA3AF] w-[28%]">名本合计(万)</th>
                              <th className="text-right py-2 text-[10px] font-medium text-[#9CA3AF] w-[28%]">期权费合计</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(aggregateStats.byCounterparty)
                              .sort(([, a], [, b]) => b.notional - a.notional)
                              .map(([cp, info]) => (
                                <tr key={cp} className={`border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB] ${counterpartyFilter === cp ? 'bg-[#EFF6FF]' : ''}`}>
                                  <td className="py-2">
                                    <button
                                      onClick={() => setCounterpartyFilter(counterpartyFilter === cp ? null : cp)}
                                      className={`text-left font-medium transition-colors hover:text-[#1677FF] ${counterpartyFilter === cp ? 'text-[#1677FF]' : 'text-[#374151]'}`}
                                    >
                                      {cp}
                                    </button>
                                  </td>
                                  <td className="py-2 text-right text-[#6B7280]">{info.count} 笔</td>
                                  <td className="py-2 text-right text-[#374151] tabular-nums">{info.notional.toLocaleString()}万</td>
                                  <td className="py-2 text-right text-[#374151] tabular-nums">{info.premium.toLocaleString()}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 筛选指示条 */}
              {counterpartyFilter && (
                <div className="flex items-center justify-between px-5 py-2 border-b border-[#F3F4F6] bg-[#EFF6FF]">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#6B7280]">已筛选：</span>
                    <span className="font-semibold text-[#1677FF]">{counterpartyFilter}</span>
                    <span className="text-[#6B7280]">— {filtered.length} 条</span>
                  </div>
                  <button
                    onClick={() => setCounterpartyFilter(null)}
                    className="text-[11px] text-[#1677FF] hover:text-[#0E5FCC] font-medium"
                  >
                    清空筛选
                  </button>
                </div>
              )}

              {/* 表格 */}
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                <table className="w-full text-xs" style={{ minWidth: '1900px' }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                      <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#374151] whitespace-nowrap sticky left-0 bg-[#F9FAFB] z-20" style={{ width: 72 }}>状态</th>
                      <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#374151] whitespace-nowrap sticky bg-[#F9FAFB] z-20" style={{ left: 72, width: 90 }}>{FIELD_LABELS.underlying}</th>
                      <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#374151] whitespace-nowrap sticky bg-[#F9FAFB] z-20" style={{ left: 162, width: 100 }}>{FIELD_LABELS.code}</th>
                      {TABLE_COLUMNS.map(f => {
                        if (f === 'underlying' || f === 'code') return null;
                        const w = COLUMN_WIDTHS[f];
                        return (
                          <th key={f} className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#374151] whitespace-nowrap" style={w ? { width: w, minWidth: w } : undefined}>{FIELD_LABELS[f]}</th>
                        );
                      })}
                      <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-[#374151] whitespace-nowrap" style={{ width: 180 }}>异常说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => {
                      const isError = row.status === 'error';
                      const isWarning = row.status === 'warning';
                      const rowBg = isError
                        ? 'bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]'
                        : isWarning
                        ? 'bg-[#FFFBEB]/60 hover:bg-[#FFFBEB]'
                        : idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]';
                      const stickyBg = isError
                        ? '#FEF2F2'
                        : isWarning
                        ? '#FFFBEB'
                        : idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';

                      return (
                        <tr key={row.id} className={`border-b border-[#F3F4F6] ${rowBg} hover:brightness-95 transition-all`}>
                          <td className="px-2 py-1.5 sticky left-0 z-10" style={{ backgroundColor: stickyBg }}>
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-2 py-1.5 sticky z-10" style={{ left: 72, backgroundColor: stickyBg }}>
                            <EditableCell id={row.id} field="underlying" value={row.underlying} />
                          </td>
                          <td className="px-2 py-1.5 sticky z-10" style={{ left: 162, backgroundColor: stickyBg }}>
                            <EditableCell id={row.id} field="code" value={row.code} />
                          </td>
                          {TABLE_COLUMNS.filter(c => c !== 'underlying' && c !== 'code').map(f => (
                            <td key={f} className="px-2 py-1.5">
                              <EditableCell id={row.id} field={f} value={row[f]} />
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            {row.errors.map((e, i) => (
                              <div key={`e-${i}`} className="text-[10px] text-[#DC2626] whitespace-nowrap flex items-center gap-0.5">
                                <span className="w-0.5 h-0.5 rounded-full bg-[#DC2626] flex-shrink-0" />{e}
                              </div>
                            ))}
                            {row.warnings.map((w, i) => (
                              <div key={`w-${i}`} className="text-[10px] text-[#D97706] whitespace-nowrap flex items-center gap-0.5">
                                <span className="w-0.5 h-0.5 rounded-full bg-[#D97706] flex-shrink-0" />{w}
                              </div>
                            ))}
                            {row.status === 'ok' && <span className="text-[10px] text-[#9CA3AF]">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-10 text-center text-sm text-[#9CA3AF]">
                    {statusFilter !== 'all' ? '无匹配结果，尝试切换筛选条件' : '无匹配结果'}
                  </div>
                )}
              </div>

              {/* 底部操作栏 */}
              <div className="flex items-center justify-end px-5 py-3 border-t border-[#F3F4F6] bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setRows(null); setFileName(''); setCounterpartyFilter(null); }}
                    className="px-5 py-2 text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={stats.ok === 0 && stats.warnings === 0}
                    className="px-5 py-2 text-xs font-medium bg-[#1677FF] text-white rounded-lg hover:bg-[#0E5FCC] disabled:bg-[#B0D0FF] transition-colors"
                  >
                    确认导入 ({stats.ok + stats.warnings} 条)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
