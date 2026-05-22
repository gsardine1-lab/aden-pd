import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Search, Loader2, Check, X, Plus } from 'lucide-react';
import { mockPositions } from './mockData';

const DEFAULT_STRUCTURES = ['100%', '103%', '105%'];
const ALL_STRUCTURES = [...new Set([...DEFAULT_STRUCTURES, ...mockPositions.map(p => p.structure.replace('Call', ''))])].filter(Boolean).sort();

// 标的名称 ↔ 代码 映射表
const codeToName: Record<string, string> = {};
const nameToCode: Record<string, string> = {};
mockPositions.forEach(p => { codeToName[p.code] = p.underlying; nameToCode[p.underlying] = p.code; });
const EXTRA_STOCKS: [string, string][] = [
  ['中证1000', '000852'], ['上证50', '000016'], ['沪深300', '000300'],
  ['中证500', '000905'], ['创业板指', '399006'], ['恒生指数', 'HSI'], ['标普500', 'SPX'],
];
EXTRA_STOCKS.forEach(([name, code]) => { codeToName[code] = name; nameToCode[name] = code; });

interface EntryForm {
  underlying: string;
  code: string;
  structure: string;
  term: string;
  counterparty: string;
  startDate: string;
  expiryDate: string;
  openNotionalCNY: string;
  notionalCNY: string;
  optionQty: string;
  premiumRate: string;
  optionPremiumCNY: string;
  openPrice: string;
  strikePrice: string;
  ruleNotes: string;
  tags: string[];
}

const EMPTY_FORM: EntryForm = {
  underlying: '', code: '', structure: '', term: '', counterparty: '',
  startDate: '', expiryDate: '',
  openNotionalCNY: '', notionalCNY: '', optionQty: '', premiumRate: '', optionPremiumCNY: '',
  openPrice: '', strikePrice: '',
  ruleNotes: '', tags: [],
};

const SAMPLE_TEXT = `标的名称: 贵州茅台
标的代码: 600519.SH
结构: 100%
期限: 6个月
交易对手: 银河证券
开仓日: 2026-05-20
到期日: 2026-11-20
开仓名本: 500万
开仓价: 1620
期权费率: 5%`;

// ============================================================
// 文本解析
// ============================================================
function parseText(text: string): Partial<EntryForm> {
  const result: Partial<EntryForm> = {};

  const underlyingM = text.match(/标的名称[：:]\s*(\S+)/);
  if (underlyingM) result.underlying = underlyingM[1];

  const codeM = text.match(/标的代码[：:]\s*(\S+)/);
  if (codeM) result.code = codeM[1];

  const structM = text.match(/结构[：:]\s*(\S+)/);
  if (structM) result.structure = structM[1].replace('Call', '');

  const termM = text.match(/期限[：:]\s*(\d+)\s*(个?\s*月|周)/);
  if (termM) result.term = `${termM[1]}${termM[2].includes('周') ? '周' : '个月'}`;

  const cpM = text.match(/交易对手[：:]\s*(\S+)/);
  if (cpM) result.counterparty = cpM[1];

  const startM = text.match(/开仓日[：:]\s*(\d{4}-\d{2}-\d{2})/);
  if (startM) result.startDate = startM[1];
  const expiryM = text.match(/到期日[：:]\s*(\d{4}-\d{2}-\d{2})/);
  if (expiryM) result.expiryDate = expiryM[1];

  const notionalM = text.match(/开仓名本[：:]\s*(\d[\d,]*\.?\d*)\s*万?/);
  if (notionalM) { const v = notionalM[1].replace(/,/g, ''); result.openNotionalCNY = v; result.notionalCNY = v; }

  const priceM = text.match(/开仓价[：:]\s*(\d+\.?\d*)/);
  if (priceM) result.openPrice = priceM[1];

  const premM = text.match(/期权费率[：:]\s*(\d+\.?\d*)\s*%?/);
  if (premM) result.premiumRate = premM[1];

  return result;
}

// ============================================================
// 辅助函数
// ============================================================
function parseTerm(term: string): { num: string; unit: string } {
  const m = term.match(/^(\d+)\s*(周|个月)/);
  return m ? { num: m[1], unit: m[2] } : { num: '', unit: '个月' };
}

function SectionTitle({ label }: { label: string }) {
  return <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#F3F4F6] pb-1">{label}</div>;
}

// ============================================================
// 确认板可编辑字段
// ============================================================
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
  suffix?: string;
  required?: boolean;
  flash?: boolean;
  placeholder?: string;
  quickFills?: { label: string; value: string }[];
}

function EditableField({ label, value, onChange, type = 'text', options, suffix, required, flash, placeholder, quickFills }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onChange(draft); setEditing(false); };
  const isEmpty = !value;
  const showInput = isEmpty || editing;

  // 统一的标签+值行
  const labelEl = (
    <span className="text-[#9CA3AF] flex-shrink-0 text-[12px] w-[72px]">
      {required && <span className={`${flash && isEmpty ? 'animate-pulse font-bold' : ''}`} style={flash && isEmpty ? { color: '#E53935', textShadow: '0 0 8px rgba(229,57,53,0.4)' } : { color: '#E53935' }}>*</span>}{label}
    </span>
  );

  if (!showInput) {
    if (type === 'textarea') {
      return (
        <div>
          <div className={`py-1 ${flash ? 'rounded px-1 -mx-1' : ''}`} style={flash ? { background: 'rgba(229,57,53,0.06)', boxShadow: '0 0 0 2px rgba(229,57,53,0.2)' } : undefined}>
            {labelEl}
            <p
              className="text-[11px] text-[#0D1117] leading-relaxed whitespace-pre-wrap mt-1 cursor-pointer hover:bg-[#EFF6FF] rounded px-1.5 py-1 -mx-1.5 transition-colors border-b border-dashed border-transparent hover:border-[#1677FF]"
              onClick={() => { setDraft(value); setEditing(true); }}
            >{value}</p>
          </div>
          {quickFills && quickFills.length > 0 && (
            <div className="flex items-center gap-1 mb-1 justify-end">
              {quickFills.map(q => (
                <button key={q.value} onClick={() => onChange(q.value)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${value === q.value ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{q.label}</button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div>
        <div className={`flex items-center text-[12px] py-2.5 ${flash ? 'rounded px-1 -mx-1' : ''}`} style={flash ? { background: 'rgba(229,57,53,0.06)', boxShadow: '0 0 0 2px rgba(229,57,53,0.2)' } : undefined}>
          {labelEl}
          <span
            className="font-medium cursor-pointer hover:bg-[#EFF6FF] hover:text-[#1677FF] rounded px-1.5 py-0.5 -mr-1.5 transition-colors border-b border-dashed border-transparent hover:border-[#1677FF] text-[#0D1117] flex-1 text-right"
            onClick={() => { setDraft(value); setEditing(true); }}
          >
            {value}{suffix && <span className="text-[#9CA3AF] ml-0.5">{suffix}</span>}
          </span>
        </div>
        {quickFills && quickFills.length > 0 && (
          <div className="flex items-center gap-1 mb-1 justify-end">
            {quickFills.map(q => (
              <button key={q.value} onClick={() => onChange(q.value)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${value === q.value ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{q.label}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className={editing ? '-mx-1 px-1 rounded' : ''} style={editing ? { background: 'rgba(22,119,255,0.04)' } : undefined}>
        <div className="py-1">
          {labelEl}
          <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder || ''}
            onBlur={() => { if (isEmpty) commit(); }}
            className={`w-full text-[12px] border rounded px-2 py-1.5 focus:outline-none resize-none mt-1 ${flash && isEmpty ? 'border-[#E53935] bg-[#FFF5F5]' : editing ? 'border-[#1677FF]' : 'border-[#D1D5DB]'}`}
            style={flash && isEmpty ? { boxShadow: '0 0 0 2px rgba(229,57,53,0.25)' } : undefined} autoFocus={editing} rows={5} />
          {editing && (
            <div className="flex items-center gap-2 mt-1">
              <button onClick={commit} className="text-[11px] px-3 py-1 rounded bg-[#1677FF] text-white hover:bg-[#0E5FCC] transition-colors">确认</button>
              <button onClick={() => { setDraft(value); setEditing(false); }} className="text-[11px] px-3 py-1 rounded border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">取消</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={editing ? '-mx-1 px-1 rounded' : ''} style={editing ? { background: 'rgba(22,119,255,0.04)' } : undefined}>
      <div className="flex items-center py-2">
        {labelEl}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {type === 'select' && options ? (
            <select value={draft} onChange={e => { setDraft(e.target.value); if (isEmpty) onChange(e.target.value); }} className="flex-1 text-[12px] border border-[#1677FF] rounded px-2 py-1.5 focus:outline-none bg-white" autoFocus={editing}>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : type === 'date' ? (
            <input type="date" value={draft} onChange={e => { setDraft(e.target.value); if (isEmpty) onChange(e.target.value); }}
              onClick={e => { e.preventDefault(); (e.target as HTMLInputElement).showPicker?.(); }}
              className={`flex-1 text-[12px] border rounded px-2 py-1.5 focus:outline-none cursor-pointer ${flash && isEmpty ? 'border-[#E53935] bg-[#FFF5F5]' : 'border-[#D1D5DB]'}`}
              style={flash && isEmpty ? { boxShadow: '0 0 0 2px rgba(229,57,53,0.25)' } : undefined} autoFocus={editing} />
          ) : (
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder || ''}
              onBlur={() => { if (isEmpty) commit(); }}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape' && editing) { setDraft(value); setEditing(false); } }}
              className={`flex-1 text-[12px] border rounded px-2 py-1.5 focus:outline-none min-w-0 ${flash && isEmpty ? 'border-[#E53935] bg-[#FFF5F5]' : editing ? 'border-[#1677FF]' : 'border-[#D1D5DB]'}`}
              style={flash && isEmpty ? { boxShadow: '0 0 0 2px rgba(229,57,53,0.25)' } : undefined} autoFocus={editing} />
          )}
          {suffix ? <span className="text-[12px] text-[#6B7280] flex-shrink-0">{suffix}</span> : null}
        </div>
        {editing && (
          <>
            <button onClick={commit} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#ECFDF5] text-[#059669] transition-colors" title="确认"><Check size={14} /></button>
            <button onClick={() => { setDraft(value); setEditing(false); }} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#E53935] transition-colors" title="取消"><X size={14} /></button>
          </>
        )}
      </div>
      {quickFills && quickFills.length > 0 && (
        <div className="flex items-center gap-1 pb-1 justify-end">
          {quickFills.map(q => (
            <button key={q.value} onClick={() => { onChange(q.value); setEditing(false); }}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${value === q.value ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{q.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const QUICK_TERMS: string[] = ['2周', '1个月', '3个月', '6个月', '12个月'];

function EditableTermField({ value, onChange, flash }: { value: string; onChange: (v: string) => void; flash?: boolean }) {
  const [editing, setEditing] = useState(false);
  const { num, unit } = parseTerm(value);
  const [draftNum, setDraftNum] = useState(num);
  const [draftUnit, setDraftUnit] = useState(unit);
  const isEmpty = !value;
  const showInput = isEmpty || editing;

  const commit = (n: string, u: string) => {
    onChange(n ? `${n}${u}` : '');
    setEditing(false);
  };

  if (!showInput) {
    return (
      <div>
        <div className={`flex items-center text-[12px] py-2.5 ${flash ? 'rounded px-1 -mx-1' : ''}`} style={flash ? { background: 'rgba(229,57,53,0.06)', boxShadow: '0 0 0 2px rgba(229,57,53,0.2)' } : undefined}>
          <span className="text-[#9CA3AF] flex-shrink-0 w-[72px]"><span className="text-[#E53935] mr-0.5">*</span>期限</span>
          <span
            className="font-medium cursor-pointer hover:bg-[#EFF6FF] hover:text-[#1677FF] rounded px-1.5 py-0.5 -mr-1.5 transition-colors border-b border-dashed border-transparent hover:border-[#1677FF] text-[#0D1117] flex-1 text-right"
            onClick={() => { const p = parseTerm(value); setDraftNum(p.num); setDraftUnit(p.unit); setEditing(true); }}
          >{value}</span>
        </div>
        <div className="flex items-center gap-1 mb-1 justify-end">
          {QUICK_TERMS.map(q => (
            <button key={q} onClick={() => onChange(q)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${value === q ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{q}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={editing ? '-mx-1 px-1 rounded' : ''} style={editing ? { background: 'rgba(22,119,255,0.04)' } : undefined}>
      <div className="flex items-center py-2">
        <span className="text-[#9CA3AF] flex-shrink-0 w-[72px] text-[12px]"><span className="text-[#E53935] mr-0.5">*</span>期限</span>
        <div className="flex items-center gap-1.5 flex-1">
          <input type="text" value={draftNum} onChange={e => setDraftNum(e.target.value)} placeholder="例：6"
            onBlur={() => { if (isEmpty) commit(draftNum, draftUnit); }}
            onKeyDown={e => { if (e.key === 'Enter') commit(draftNum, draftUnit); }}
            className={`flex-1 text-[12px] border rounded px-2 py-1.5 focus:outline-none ${editing ? 'border-[#1677FF]' : 'border-[#D1D5DB]'}`} autoFocus={editing} />
          <select value={draftUnit} onChange={e => { const u = e.target.value; setDraftUnit(u); if (isEmpty && draftNum) commit(draftNum, u); }}
            className={`text-[12px] border rounded px-1.5 py-1.5 focus:outline-none bg-white ${editing ? 'border-[#1677FF]' : 'border-[#D1D5DB]'}`}>
            <option value="周">周</option>
            <option value="个月">月</option>
          </select>
        </div>
        {editing && (
          <>
            <button onClick={() => commit(draftNum, draftUnit)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#ECFDF5] text-[#059669] transition-colors" title="确认"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#E53935] transition-colors" title="取消"><X size={14} /></button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 pb-1 justify-end">
        {QUICK_TERMS.map(q => (
          <button key={q} onClick={() => { onChange(q); setEditing(false); }}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${value === q ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{q}</button>
        ))}
      </div>
    </div>
  );
}

function StructureField({ value, onChange, flash }: { value: string; onChange: (v: string) => void; flash?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? ALL_STRUCTURES : DEFAULT_STRUCTURES;
  const hasMore = ALL_STRUCTURES.length > DEFAULT_STRUCTURES.length;
  return (
    <div className={`flex items-center text-[12px] py-2.5 ${flash ? 'rounded px-1 -mx-1' : ''}`} style={flash ? { background: 'rgba(229,57,53,0.06)', boxShadow: '0 0 0 2px rgba(229,57,53,0.2)' } : undefined}>
      <span className="text-[#9CA3AF] flex-shrink-0 w-[72px]"><span className="text-[#E53935] mr-0.5">*</span>结构</span>
      <div className="flex items-center gap-1 flex-1 justify-end flex-wrap">
        {visible.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${value === s ? 'bg-[#1677FF] text-white border-[#1677FF]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#1677FF] hover:text-[#1677FF] bg-white'}`}>{s}</button>
        ))}
        {hasMore && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-[10px] px-2 py-0.5 rounded border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#1677FF] hover:border-[#1677FF] bg-white transition-colors">
            {expanded ? '收起' : '更多'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export function ExternalEntryPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);

  // 标签
  const [tagPool, setTagPool] = useState<string[]>(() => {
    try { const saved = localStorage.getItem('tagPool'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [newTag, setNewTag] = useState('');

  // 交易对手历史
  const [cptyHistory, setCptyHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cptyHistory');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults = ['银河证券', '中信证券', '华泰证券', '国泰君安', '招商证券', '广发证券', '中金公司', '海通证券'];
    localStorage.setItem('cptyHistory', JSON.stringify(defaults));
    return defaults;
  });
  const [cptyOpen, setCptyOpen] = useState(false);
  const cptyRef = useRef<HTMLDivElement>(null);

  const filteredCpty = useMemo(() => {
    if (!form.counterparty) return cptyHistory.slice(0, 5);
    const s = form.counterparty.toLowerCase();
    return cptyHistory.filter(c => c.toLowerCase().includes(s)).slice(0, 5);
  }, [form.counterparty, cptyHistory]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cptyRef.current && !cptyRef.current.contains(e.target as Node)) setCptyOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveCptyToHistory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [trimmed, ...cptyHistory.filter(c => c !== trimmed)];
    setCptyHistory(next);
    localStorage.setItem('cptyHistory', JSON.stringify(next));
  };

  const set = (partial: Partial<EntryForm>) => setForm(prev => ({ ...prev, ...partial }));

  // 标的名称与代码联动
  useEffect(() => {
    const name = codeToName[form.code];
    if (name && form.underlying !== name) set({ underlying: name });
  }, [form.code]);
  useEffect(() => {
    const code = nameToCode[form.underlying];
    if (code && form.code !== code) set({ code });
  }, [form.underlying]);

  // 标的校验：名称或代码在映射表中不存在
  const stockInvalid = useMemo(() => {
    if (form.underlying && !nameToCode[form.underlying]) return true;
    if (form.code && !codeToName[form.code]) return true;
    return false;
  }, [form.underlying, form.code]);

  // 持仓名本自动同步开仓名本
  useEffect(() => {
    if (form.openNotionalCNY && form.notionalCNY !== form.openNotionalCNY) set({ notionalCNY: form.openNotionalCNY });
  }, [form.openNotionalCNY]);

  // 期权费自动计算
  useEffect(() => {
    const notional = Number(form.openNotionalCNY);
    const rate = Number(form.premiumRate);
    if (notional > 0 && rate > 0) {
      const premium = Math.round(notional * 10000 * rate / 100);
      if (String(premium) !== form.optionPremiumCNY) set({ optionPremiumCNY: String(premium) });
    }
  }, [form.openNotionalCNY, form.premiumRate]);

  // 期权数量联动：名本(万) × 10000 ÷ 开仓价
  useEffect(() => {
    const notional = Number(form.openNotionalCNY);
    const price = Number(form.openPrice);
    if (notional > 0 && price > 0) {
      const qty = Math.round(notional * 10000 / price);
      if (String(qty) !== form.optionQty) set({ optionQty: String(qty) });
    }
  }, [form.openNotionalCNY, form.openPrice]);

  // 执行价联动
  useEffect(() => {
    const openP = Number(form.openPrice);
    if (!openP || !form.structure) return;
    const pct = parseFloat(form.structure) || 100;
    const multiplier = pct / 100;
    const calc = (openP * multiplier).toFixed(2);
    if (calc !== form.strikePrice) set({ strikePrice: calc });
  }, [form.openPrice, form.structure]);

  // 根据期限自动填充日期
  const applyTermToDates = (term: string) => {
    const { num, unit } = parseTerm(term);
    const n = Number(num);
    if (!n) return;
    const today = new Date('2026-05-20');
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today);
    if (unit === '周') { end.setDate(end.getDate() + n * 7); }
    else { end.setMonth(end.getMonth() + n); }
    set({ startDate: start, expiryDate: end.toISOString().slice(0, 10) });
  };

  // 解析文本
  const handleParse = () => {
    if (!inputText.trim()) return;
    setParsing(true);
    setTimeout(() => {
      const extracted = parseText(inputText);
      setForm(prev => ({ ...prev, ...extracted }));
      setParsing(false);
    }, 600);
  };

  // 标签
  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (!tagPool.includes(t)) {
      const pool = [...tagPool, t];
      localStorage.setItem('tagPool', JSON.stringify(pool));
      setTagPool(pool);
    }
    if (!form.tags.includes(t)) set({ tags: [...form.tags, t] });
    setNewTag('');
  };

  const toggleTag = (tag: string) => {
    if (form.tags.includes(tag)) set({ tags: form.tags.filter(t => t !== tag) });
    else set({ tags: [...form.tags, tag] });
  };

  const availableTags = tagPool.filter(t => !form.tags.includes(t));

  // 校验
  const REQUIRED_FIELDS: { key: keyof EntryForm; label: string }[] = [
    { key: 'underlying', label: '标的名称' },
    { key: 'code', label: '标的代码' },
    { key: 'structure', label: '结构' },
    { key: 'term', label: '期限' },
    { key: 'counterparty', label: '交易对手' },
    { key: 'startDate', label: '开仓日' },
    { key: 'expiryDate', label: '到期日' },
    { key: 'openNotionalCNY', label: '开仓名本' },
    { key: 'openPrice', label: '开仓价' },
    { key: 'optionQty', label: '期权数量' },
    { key: 'premiumRate', label: '期权费率' },
    { key: 'optionPremiumCNY', label: '期权费' },
    { key: 'strikePrice', label: '执行价' },
  ];
  const missingFields = REQUIRED_FIELDS.filter(f => !form[f.key]);
  const canSubmit = missingFields.length === 0 && !stockInvalid;
  const [flashFields, setFlashFields] = useState<string[]>([]);

  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFlashFields(missingFields.map(f => f.key));
    setTimeout(() => setFlashFields([]), 1200);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const entry = { id: `ext-${Date.now()}`, ...form, source: 'external' };
    try {
      const existing = localStorage.getItem('externalPositions');
      const list = existing ? JSON.parse(existing) : [];
      list.push(entry);
      localStorage.setItem('externalPositions', JSON.stringify(list));
    } catch {}
    saveCptyToHistory(form.counterparty);
    alert(`持仓已录入\n标的: ${form.underlying}\n代码: ${form.code}\n名本: ${form.notionalCNY}万`);
    navigate('/');
  };

  // 计算剩余天数
  const computed = useMemo(() => {
    let remainingDays: number | null = null;
    if (form.expiryDate) {
      remainingDays = Math.ceil((new Date(form.expiryDate).getTime() - new Date('2026-05-20').getTime()) / 86400000);
    }
    return {
      remainingDays,
      tradingDays: remainingDays !== null ? Math.round(remainingDays * 5 / 7) : null,
    };
  }, [form]);

  function RuleNotesEditor() {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(form.ruleNotes);
    const hasContent = !!form.ruleNotes;

    const commit = () => { set({ ruleNotes: draft }); setEditing(false); };

    if (!hasContent && !editing) {
      return (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={() => setEditing(true)}
          placeholder="备注内容..."
          className="w-full text-[11px] border border-[#D1D5DB] rounded px-2 py-1.5 focus:outline-none focus:border-[#1677FF] resize-none"
          rows={5}
        />
      );
    }

    if (editing) {
      return (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="备注内容..."
            className="w-full text-[11px] border border-[#1677FF] rounded px-2 py-1.5 focus:outline-none resize-none bg-white"
            rows={5}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-1">
            <button onClick={commit} className="text-[10px] px-3 py-1 rounded bg-[#1677FF] text-white hover:bg-[#0E5FCC] transition-colors">确认</button>
            <button onClick={() => { setDraft(form.ruleNotes); setEditing(false); }} className="text-[10px] px-3 py-1 rounded border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">取消</button>
          </div>
        </div>
      );
    }

    return (
      <p
        className="text-[11px] text-[#0D1117] leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-[#EFF6FF] rounded px-1.5 py-1 -mx-1.5 transition-colors border-b border-dashed border-transparent hover:border-[#1677FF]"
        onClick={() => { setDraft(form.ruleNotes); setEditing(true); }}
      >{form.ruleNotes}</p>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden" style={{ minWidth: '1280px' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="flex items-center px-6 h-14 bg-white border-b border-[#E8ECF0] flex-shrink-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1677FF] transition-colors">
            <ArrowLeft size={16} />
            返回持仓总览
          </button>
        </div>

        {/* 双栏主内容 */}
        <div className="flex-1 flex overflow-hidden">
          {/* ===== 左栏：粘贴文本 ===== */}
          <div id="text-parser" data-anchor className="w-[420px] flex-shrink-0 border-r border-[#E8ECF0] bg-white flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <h1 className="text-base font-bold text-[#0D1117]">录入外部持仓</h1>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">粘贴期权确认书或交易流水，自动提取结构化数据；也可直接在右侧确认板填写</p>
            </div>
            <div className="flex-1 flex flex-col p-4">
              <textarea
                placeholder={SAMPLE_TEXT}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 w-full text-xs border border-[#E5E7EB] rounded-lg p-3 focus:outline-none focus:border-[#1677FF] resize-none font-mono leading-relaxed"
              />
              <div className="mt-2 text-[10px] text-[#9CA3AF] leading-relaxed">
                支持识别：标的名称/代码、行权价、名义本金、权利金率、起止日期、交易对手等。
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-[#F3F4F6]">
              <button onClick={handleParse} disabled={!inputText.trim() || parsing}
                className="w-full py-2.5 bg-[#1677FF] hover:bg-[#0E5FCC] disabled:bg-[#B0D0FF] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {parsing ? <><Loader2 size={15} className="animate-spin" /> 解析中...</> : <><Search size={14} /> 解析文本</>}
              </button>
            </div>
          </div>

          {/* ===== 右栏：确认板（始终可见，点击可编辑） ===== */}
          <div id="external-entry-form" data-anchor className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="min-h-full flex flex-col">
                <div className="bg-white rounded-xl border border-[#E8ECF0] shadow-sm overflow-hidden flex flex-col flex-1">
                {/* 头部概要 */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-[#F9FAFB] to-white border-b border-[#F3F4F6] flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${stockInvalid ? 'text-[#E53935]' : 'text-[#0D1117]'}`}>{form.underlying || '标的名称'}</span>
                      <span className="text-xs text-[#9CA3AF] font-mono">{form.code || '代码'}</span>
                      {stockInvalid && <span className="text-[10px] text-[#E53935]">⚠ 未识别该标的</span>}
                    </div>
                    <span className="text-[10px] text-[#1677FF] bg-[#EFF6FF] border border-[#1677FF]/20 rounded-full px-2.5 py-0.5 font-medium">点击字段可编辑</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EFF6FF] text-[#1677FF]">{form.structure ? `${form.structure} Call` : '结构'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF2F2] text-[#DC2626]">看涨期权</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#F3F4F6] text-[#6B7280]">{form.term || '期限'}</span>
                  </div>
                </div>

                {/* 交易对手 + 标签 — 同行 */}
                <div className="px-4 py-2.5 border-b border-[#F3F4F6] flex-shrink-0 flex items-center gap-6" ref={cptyRef}>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-[#6B7280]">交易对手</span>
                    <div className="relative w-[200px]">
                      <input
                        type="text"
                        value={form.counterparty}
                        onChange={v => { set({ counterparty: v.target.value }); setCptyOpen(true); }}
                        onFocus={() => setCptyOpen(true)}
                        placeholder="例：银河证券"
                        className={`w-full text-[13px] border rounded-md px-3 py-1.5 focus:outline-none transition-colors ${flashFields.includes('counterparty') ? 'border-[#E53935] bg-[#FFF5F5]' : 'border-[#D1D5DB] focus:border-[#1677FF]'}`}
                      />
                      {cptyOpen && filteredCpty.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCpty.map((c, i) => (
                            <div
                              key={i}
                              className="px-3 py-2 text-[12px] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer flex items-center justify-between"
                              onClick={() => { set({ counterparty: c }); setCptyOpen(false); }}
                            >
                              <span>{c}</span>
                              <span className="text-[9px] text-[#9CA3AF]">历史</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {cptyOpen && form.counterparty && filteredCpty.length === 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8ECF0] rounded-lg shadow-lg px-3 py-2 text-[11px] text-[#9CA3AF] text-center">无历史记录</div>
                      )}
                    </div>
                    {form.counterparty && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">{form.counterparty}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[11px] font-semibold text-[#6B7280] flex-shrink-0">标签</span>
                    {form.tags.map(tag => (
                      <span key={tag} onClick={() => toggleTag(tag)} className="text-[10px] px-2 py-1 rounded font-medium border bg-[#1677FF] text-white border-[#1677FF] cursor-pointer select-none">{tag} &times;</span>
                    ))}
                    {availableTags.map(tag => (
                      <span key={tag} onClick={() => toggleTag(tag)} className="text-[10px] px-2 py-1 rounded border bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1677FF] hover:text-[#1677FF] cursor-pointer select-none">{tag}</span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                        placeholder="新标签" className="text-[11px] border border-[#E5E7EB] rounded px-2 py-1.5 w-20 focus:outline-none focus:border-[#1677FF]" />
                      <button onClick={addTag} className="text-[10px] px-2 py-1 rounded bg-[#1677FF] text-white hover:bg-[#0E5FCC] flex items-center gap-0.5"><Plus size={12} />新建</button>
                    </div>
                  </div>
                </div>

                {/* 三列字段 */}
                <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] flex-1">
                  {/* 列1：标的 → 结构 → 期限 */}
                  <div className="p-4 flex flex-col gap-6">
                    <div>
                      <SectionTitle label="标的" />
                      <div className="space-y-2 mt-2">
                        <EditableField label="标的名称" value={form.underlying} onChange={v => set({ underlying: v })} required placeholder="例：贵州茅台" flash={flashFields.includes('underlying') || stockInvalid} />
                        <EditableField label="标的代码" value={form.code} onChange={v => set({ code: v })} required placeholder="例：600519.SH" flash={flashFields.includes('code') || stockInvalid} />
                        {stockInvalid && (
                          <div className="text-[10px] text-[#E53935] leading-relaxed">未识别该标的，请输入正确的标的名称或代码</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <SectionTitle label="结构" />
                      <div className="space-y-2 mt-2">
                        <StructureField value={form.structure} onChange={v => set({ structure: v })} flash={flashFields.includes('structure')} />
                        <div className="flex items-center text-[12px] py-2.5">
                          <span className="text-[#9CA3AF] flex-shrink-0 w-[72px]">交易类型</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280] ml-auto">Call 看涨期权</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <SectionTitle label="期限" />
                      <div className="space-y-2 mt-2">
                        <EditableTermField value={form.term} onChange={v => { set({ term: v }); applyTermToDates(v); }} flash={flashFields.includes('term')} />
                        <EditableField label="开仓日" value={form.startDate} onChange={v => set({ startDate: v })} type="date" required flash={flashFields.includes('startDate')} />
                        <EditableField label="到期日" value={form.expiryDate} onChange={v => set({ expiryDate: v })} type="date" required flash={flashFields.includes('expiryDate')} />
                        {computed.remainingDays !== null && (
                          <div className="mt-3 pt-3 border-t border-[#F3F4F6] space-y-1.5">
                            <div className="flex justify-between text-[12px]"><span className="text-[#9CA3AF]">剩余自然日</span><span className={`font-semibold ${computed.remainingDays <= 7 ? 'text-[#B45309]' : 'text-[#0D1117]'}`}>{computed.remainingDays} 天</span></div>
                            <div className="flex justify-between text-[12px]"><span className="text-[#9CA3AF]">剩余交易日</span><span className="font-semibold text-[#0D1117]">{computed.tradingDays} 天</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 列2：本金与费用 → 价格 */}
                  <div className="p-4 flex flex-col gap-6">
                    <div>
                      <SectionTitle label="名本" />
                      <div className="space-y-2 mt-2">
                        <EditableField label="开仓名本" value={form.openNotionalCNY} onChange={v => set({ openNotionalCNY: v })} suffix="万 CNY" required placeholder="例：500" flash={flashFields.includes('openNotionalCNY')} quickFills={[{ label: '100万', value: '100' }, { label: '500万', value: '500' }, { label: '1000万', value: '1000' }]} />
                        <EditableField label="期权费率" value={form.premiumRate} onChange={v => set({ premiumRate: v })} required suffix="%" placeholder="例：7" flash={flashFields.includes('premiumRate')} />
                        {form.optionPremiumCNY && (
                          <div className="flex justify-between text-[12px]"><span className="text-[#9CA3AF]"><span className="text-[#E53935] mr-0.5">*</span>期权费</span><span className="font-medium text-[#0D1117]">{Number(form.optionPremiumCNY).toLocaleString()}</span></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <SectionTitle label="价格" />
                      <div className="space-y-2 mt-2">
                        <EditableField label="开仓价" value={form.openPrice} onChange={v => set({ openPrice: v })} required placeholder="例：1620" flash={flashFields.includes('openPrice')} />
                        <div className="flex items-center text-[12px] py-2.5"><span className="text-[#9CA3AF] flex-shrink-0 w-[72px]"><span className="text-[#E53935] mr-0.5">*</span>执行价</span><span className="font-medium text-[#0D1117] flex-1 text-right">{form.strikePrice || '-'}</span></div>
                        <div className="text-[9px] text-[#B0B7C3]">由开仓价 × 结构比例自动计算</div>
                      </div>
                    </div>
                  </div>

                  {/* 列3：备注 */}
                  <div className="p-4">
                    <SectionTitle label="备注" />
                    <div className="mt-2">
                      <RuleNotesEditor />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </div>
            {/* 底部操作 — 与左侧解析按钮对齐 */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-[#E8ECF0] bg-white flex items-center gap-4">
              <button onClick={() => { if (showConfirm) setShowConfirm(false); else navigate('/'); }}
                className="flex-1 py-2.5 text-sm font-medium border border-[#E5E7EB] text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                {showConfirm ? '返回修改' : '取消'}
              </button>
              <button onClick={canSubmit ? handleSubmit : handleDisabledClick}
                title={canSubmit ? '' : `请填写必填项：${missingFields.map(f => f.label).join('、')}`}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  canSubmit ? 'bg-[#1677FF] text-white hover:bg-[#0E5FCC]' : 'bg-[#B0D0FF] text-white cursor-not-allowed'
                }`}>确认并录入持仓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
