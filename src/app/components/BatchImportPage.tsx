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
  'premiumRate', 'optionPremiumCNY', 'optionQty',
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

  // 注入错误/警告行（仅改字段值，校验由 validateRow 统一执行）
  rows[3] = { ...rows[3], underlying: '不存在的标的', code: '999999.XZ' };
  rows[7] = { ...rows[7], structure: '', openPrice: '' };
  rows[11] = { ...rows[11], startDate: '2026-09-01', expiryDate: '2026-05-01' };
  rows[15] = { ...rows[15], optionPremiumCNY: '999' };
  rows[19] = { ...rows[19], strikePrice: '9999.99' };
  rows[23] = { ...rows[23], counterparty: '' };
  rows[27] = { ...rows[27], term: '', premiumRate: '' };
  rows[31] = { ...rows[31], code: '600519.SH', underlying: '宁德时代' };
  // 新警告示例
  rows[0] = { ...rows[0], premiumRate: '25' };           // 费率 >20%
  rows[5] = { ...rows[5], openNotionalCNY: '15000' };     // 名本 >1亿
  rows[9] = { ...rows[9], structure: '130%' };            // 非标准结构
  rows[13] = { ...rows[13], term: '6月', startDate: '2026-05-20', expiryDate: '2026-07-20' }; // 间隔不匹配
  rows[17] = { ...rows[17], expiryDate: '2026-05-23' };   // 周六

  return rows.map(validateRow);
}

// ============================================================
// 校验单行
// ============================================================
function validateRow(row: ImportRow): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_IMPORT_FIELDS) {
    if (!row[field]) {
      errors.push(`${FIELD_LABELS[field]}未填写`);
    }
  }

  if (row.underlying && !nameToCode[row.underlying]) {
    errors.push('未识别的标的名称');
  }
  if (row.code && !codeToName[row.code]) {
    errors.push('未识别的标的代码');
  }
  if (row.underlying && row.code && nameToCode[row.underlying] && nameToCode[row.underlying] !== row.code) {
    warnings.push('标的代码与名称不匹配');
  }

  if (row.startDate && row.expiryDate && row.startDate > row.expiryDate) {
    errors.push('到期日早于开仓日');
  }

  // === 警告 ===

  // 1. 期限与日期间隔不匹配（偏差>20%）
  if (row.term && row.startDate && row.expiryDate) {
    const { num, unit } = parseTerm(row.term);
    const n = Number(num);
    if (n > 0) {
      const actualDays = Math.ceil((new Date(row.expiryDate).getTime() - new Date(row.startDate).getTime()) / 86400000);
      const expectedDays = unit === '周' ? n * 7 : Math.round(n * 30.44);
      const deviation = expectedDays > 0 ? Math.abs(actualDays - expectedDays) / expectedDays : 0;
      if (deviation > 0.2) {
        warnings.push(`期限与日期间隔不匹配（期限${row.term}，实际间隔约${actualDays}天）`);
      }
    }
  }

  // 2. 期权费率异常（<1% 或 >20%）
  if (row.premiumRate) {
    const rate = Number(row.premiumRate);
    if (rate < 1 || rate > 20) {
      warnings.push('期权费率异常，请确认填写正确');
    }
  }

  // 3. 名本量级较大（>1亿万）
  if (row.openNotionalCNY) {
    const notional = Number(row.openNotionalCNY);
    if (notional > 10000) {
      warnings.push('开仓名本超过1亿，请确认量级正确');
    }
  }

  // 4. 结构非标准
  if (row.structure && !KNOWN_STRUCTURES.has(row.structure)) {
    warnings.push('结构不在常见范围内，请确认');
  }

  // 5. 到期日为周末
  if (row.expiryDate) {
    const day = new Date(row.expiryDate).getDay();
    if (day === 0 || day === 6) {
      warnings.push('到期日为周末，请确认日期正确');
    }
  }

  // 6. 期权费计算偏差
  if (row.openNotionalCNY && row.premiumRate) {
    const expected = Math.round(Number(row.openNotionalCNY) * 10000 * Number(row.premiumRate) / 100);
    if (row.optionPremiumCNY && Math.abs(Number(row.optionPremiumCNY) - expected) > expected * 0.01) {
      warnings.push('期权费与名本×费率计算结果偏差较大');
    }
  }

  // 7. 执行价计算偏差
  if (row.openPrice && row.structure) {
    const pct = parseFloat(row.structure) / 100;
    const expected = (Number(row.openPrice) * pct).toFixed(2);
    if (row.strikePrice && Math.abs(Number(row.strikePrice) - Number(expected)) > 0.01) {
      warnings.push('执行价与开仓价×结构比例偏差较大');
    }
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

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter(r => {
      if (statusFilter === 'error' && r.status !== 'error') return false;
      if (statusFilter === 'warning' && r.status !== 'warning') return false;
      if (statusFilter === 'ok' && r.status !== 'ok') return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.underlying.includes(search) && !r.code.toLowerCase().includes(s) && !r.counterparty.includes(search)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, search]);

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
      const display = (() => {
        if (!value) return <span className="text-[#D1D5DB]">-</span>;
        if (NUMERIC_FIELDS.includes(field)) return Number(value).toLocaleString();
        if (field === 'premiumRate') return `${value}%`;
        if (field === 'openNotionalCNY') return `${Number(value).toLocaleString()}万`;
        return value;
      })();

      return (
        <div
          className="cursor-pointer hover:bg-[#EFF6FF] rounded px-1.5 py-1 -mx-1.5 transition-colors text-[11px] min-h-[22px] flex items-center whitespace-nowrap"
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
          className="text-[11px] border border-[#1677FF] rounded px-1 py-1 focus:outline-none bg-white"
          autoFocus
          onClick={e => e.stopPropagation()}
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
      '期权费率(%)', '期权费', '期权数量',
    ];
    const sampleRow1 = [
      '贵州茅台', '600519.SH', '银河证券', '100%', '6', '月',
      '2026-05-20', '2026-11-20', '500', '1620', '1620',
      '5', '250000', '3086',
    ];
    const sampleRow2 = [
      '宁德时代', '300750.SZ', '中信证券', '103%', '2', '周',
      '2026-05-20', '2026-06-03', '300', '285', '293.55',
      '3', '90000', '10526',
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
            <div className="max-w-2xl mx-auto mt-16">
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
                <span>导入字段：标的名称、标的代码、交易对手、结构、期限、开仓日、到期日、开仓名本(万)、开仓价、执行价、期权费率、期权费、期权数量</span>
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
            <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm overflow-hidden">
              {/* 汇总条 */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6] bg-[#F9FAFB]">
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
                  onClick={() => { setRows(null); setFileName(''); }}
                  className="text-xs text-[#6B7280] hover:text-[#374151] underline"
                >
                  重新上传
                </button>
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
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6] bg-white">
                <div className="text-[11px] text-[#6B7280]">
                  {statusFilter === 'all' && `共 ${filtered.length} 条，其中 ${stats.ok + stats.warnings} 条可导入`}
                  {statusFilter === 'error' && `${stats.errors} 条异常需修正`}
                  {statusFilter === 'warning' && `${stats.warnings} 条有警告，可确认后导入`}
                  {statusFilter === 'ok' && `${stats.ok} 条就绪待导入`}
                  {stats.errors > 0 && statusFilter === 'all' && (
                    <span className="text-[#DC2626] ml-2">— 异常数据将在导入时跳过</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setRows(null); setFileName(''); }}
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
