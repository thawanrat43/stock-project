import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
} from 'lucide-react';
import StatusChip from './StatusChip.jsx';
import {
  ACTION_LABELS_TH,
  formatNumber,
  formatTimestamp,
  getStockStatus,
} from '../utils/stockHelpers.js';

const OPERATION_MODES = [
  { id: 'audit', label: 'นับสต็อกจริง' },
  { id: 'inbound', label: 'รับเข้า +' },
  { id: 'dispatch', label: 'เบิกจ่าย -' },
  { id: 'damaged', label: 'ชำรุด -' },
];

export default function StockDetailPanel({
  item,
  itemLogs,
  onApplyAdjustment,
  onVerifyItem,
  onTransferBin,
  inDrawer = false,
}) {
  const [mode, setMode] = useState('audit');
  const [inputValue, setInputValue] = useState(item ? String(item.quantity) : '0');
  const [note, setNote] = useState('');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [targetBin, setTargetBin] = useState(item ? item.bin : '');
  const [targetZone, setTargetZone] = useState(item ? item.zone : 'Zone A');

  useEffect(() => {
    if (!item) return;
    if (mode === 'audit') {
      setInputValue(String(item.quantity));
    } else {
      setInputValue('10');
    }
    setTargetBin(item.bin);
    setTargetZone(item.zone);
    setIsTransferOpen(false);
    setNote('');
  }, [item?.id]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (!item) return;
    if (nextMode === 'audit') {
      setInputValue(String(item.quantity));
    } else {
      setInputValue('10');
    }
  };

  if (!item) {
    return (
      <div className="apex-card p-6 text-center text-[#64748B]">
        <p className="text-[14px] font-medium text-[#0F172A]">
          เลือกรายการสินค้า (SKU)
        </p>
        <p className="text-[13px] mt-1">
          แตะที่การ์ดสินค้าทางซ้ายเพื่อดูบาร์โค้ด ตำแหน่งจัดเก็บ หรือปรับปรุงยอดสต็อก
        </p>
      </div>
    );
  }

  const status = getStockStatus(item.quantity, item.minThreshold);
  const parsedAmount = Math.max(0, Number.parseInt(inputValue, 10) || 0);

  let projectedQty = item.quantity;
  if (mode === 'audit') {
    projectedQty = parsedAmount;
  } else if (mode === 'inbound') {
    projectedQty = item.quantity + parsedAmount;
  } else {
    projectedQty = Math.max(0, item.quantity - parsedAmount);
  }

  const delta = projectedQty - item.quantity;
  const thresholdRatio =
    item.minThreshold > 0
      ? Math.min(100, Math.round((item.quantity / (item.minThreshold * 2)) * 100))
      : 100;

  const stepAmount = (step) => {
    const next = Math.max(0, parsedAmount + step);
    setInputValue(String(next));
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const actionLabel =
      mode === 'inbound'
        ? 'Inbound'
        : mode === 'damaged'
          ? 'Discrepancy'
          : 'Adjustment';
    const defaultNote =
      mode === 'audit'
        ? 'ตรวจนับสต็อกหน้าชั้นวาง'
        : mode === 'inbound'
          ? 'รับสินค้าเข้าชั้นวางโดยตรง'
          : mode === 'dispatch'
            ? 'เบิกจ่ายสินค้าตามคำสั่งซื้อ'
            : 'ตัดจำหน่ายสินค้าชำรุดเสียหาย';

    onApplyAdjustment({
      skuId: item.id,
      newQuantity: projectedQty,
      action: actionLabel,
      note: note.trim() || defaultNote,
    });
    setNote('');
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!targetBin.trim()) return;
    onTransferBin(item.id, targetZone, targetBin.trim().toUpperCase());
    setIsTransferOpen(false);
  };

  const primaryTitle = item.nameTh || item.name;
  const secondaryTitle = item.nameTh ? item.name : '';

  return (
    <div className={inDrawer ? 'p-4 space-y-5' : 'apex-card p-5 space-y-5'}>
      {/* Item Header & Metadata */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[12px] font-medium text-[#1E40AF] tracking-[0.03em]">
              {item.sku} · {item.category}
            </div>
            <h2 className="text-[18px] leading-[24px] font-semibold text-[#0B1C30] mt-0.5">
              {primaryTitle}
            </h2>
            {secondaryTitle && (
              <p className="text-[14px] text-[#444653] mt-0.5">{secondaryTitle}</p>
            )}
          </div>
          <StatusChip status={status} />
        </div>

        {/* Clean Unboxed Monospace Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-[#E2E8F0] text-[13px]">
          <div>
            <span className="text-[#64748B] block text-[11px]">
              ตำแหน่งจัดเก็บ (Bin)
            </span>
            <span className="font-mono font-semibold text-[#0F172A] inline-flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#1E40AF]" aria-hidden="true" />
              {item.zone} · {item.bin}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">
              ยอดคงเหลือปัจจุบัน
            </span>
            <span className="font-mono font-bold text-[#0F172A] text-[16px] tabular-nums mt-0.5 block">
              {formatNumber(item.quantity)} {item.unit}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">
              ล็อตผลิต & ผู้จัดจำหน่าย
            </span>
            <span className="font-mono text-[12px] text-[#0F172A] mt-0.5 block truncate">
              {item.batch} · {item.supplier}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">
              ตรวจนับล่าสุด
            </span>
            <span className="font-mono text-[12px] text-[#0F172A] mt-0.5 block">
              {formatTimestamp(item.lastVerified)} ({item.verifiedBy})
            </span>
          </div>
        </div>

        {/* Reorder Threshold Indicator */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="text-[#64748B]">ระดับเกณฑ์แจ้งเตือนสั่งซื้อซ้ำ</span>
            <span className="font-mono font-medium text-[#0F172A] tabular-nums">
              ขั้นต่ำ {formatNumber(item.minThreshold)} {item.unit}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                status === 'Depleted'
                  ? 'bg-[#DC2626]'
                  : status === 'Low Stock'
                    ? 'bg-[#D97706]'
                    : 'bg-[#059669]'
              }`}
              style={{ width: `${Math.max(status === 'Depleted' ? 0 : 6, thresholdRatio)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stock Adjustment Form */}
      <form onSubmit={handleConfirm} className="space-y-3.5 pt-2 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#0F172A]">
            ปรับปรุงยอดสต็อก
          </h3>
          <span className="font-mono text-[12px] font-medium tabular-nums text-[#444653]">
            ยอดสุทธิ:{' '}
            <strong className="text-[#0F172A]">
              {formatNumber(projectedQty)} {item.unit}
            </strong>
            {delta !== 0 && (
              <span
                className={`ml-1.5 ${
                  delta > 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                }`}
              >
                ({delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta)})
              </span>
            )}
          </span>
        </div>

        {/* Segmented Operation Controls */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F5F9] rounded-md">
          {OPERATION_MODES.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => handleModeChange(op.id)}
              className={`min-h-[38px] px-1.5 py-1.5 rounded text-[12px] font-medium transition-colors whitespace-nowrap truncate ${
                mode === op.id
                  ? 'bg-white text-[#1E40AF] font-semibold shadow-xs border border-slate-200/80'
                  : 'text-[#444653] hover:text-[#0F172A]'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Tactile 48px Number Stepper Controls */}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => stepAmount(-1)}
            className="min-h-[48px] min-w-[52px] flex items-center justify-center rounded border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors"
            aria-label="ลดจำนวน"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label="จำนวนสินค้า"
              className="apex-input w-full h-[48px] px-3 pr-14 text-center font-mono text-[18px] font-bold text-[#0F172A] tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold text-[#64748B] pointer-events-none">
              {item.unit}
            </span>
          </div>

          <button
            type="button"
            onClick={() => stepAmount(1)}
            className="min-h-[48px] min-w-[52px] flex items-center justify-center rounded border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors"
            aria-label="เพิ่มจำนวน"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Rapid Preset Increments */}
        <div className="flex items-center gap-1.5">
          {[5, 10, 25, 50, 100].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => stepAmount(amt)}
              className="flex-1 min-h-[36px] rounded border border-[#CBD5E1] bg-white font-mono text-[12px] font-medium text-[#444653] hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors"
            >
              +{amt}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="อ้างอิงเลขที่ PO, พาเลท หรือหมายเหตุการตรวจนับ..."
          className="apex-input w-full h-[42px] px-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8]"
        />

        {/* Primary & Secondary Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>ยืนยันการปรับยอดสต็อก</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onVerifyItem(item.id)}
              className="min-h-[44px] rounded border border-[#CBD5E1] bg-white hover:bg-[#ECFDF5] hover:border-[#A7F3D0] text-[#0F172A] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
              <span>ยืนยันยอดตรง</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTransferOpen((prev) => !prev)}
              className="min-h-[44px] rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-[#1E40AF]" aria-hidden="true" />
              <span>ย้ายตำแหน่ง Bin</span>
            </button>
          </div>
        </div>
      </form>

      {/* Inline Bin Transfer Controls */}
      {isTransferOpen && (
        <form
          onSubmit={handleTransferSubmit}
          className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md space-y-2.5"
        >
          <div className="text-[12px] font-semibold text-[#0F172A]">
            ย้ายสินค้าไปยังตำแหน่งจัดเก็บใหม่
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              className="apex-input h-[40px] px-2.5 text-[13px] text-[#0F172A]"
            >
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D">Zone D</option>
            </select>
            <input
              type="text"
              value={targetBin}
              onChange={(e) => setTargetBin(e.target.value)}
              placeholder="LOC-A12-04"
              className="apex-input h-[40px] px-2.5 font-mono text-[13px] text-[#0F172A] uppercase"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="min-h-[36px] px-3 rounded border border-[#CBD5E1] bg-white text-[12px] font-medium text-[#444653]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="min-h-[36px] px-3 rounded bg-[#1E40AF] text-white text-[12px] font-medium"
            >
              บันทึกการย้าย
            </button>
          </div>
        </form>
      )}

      {/* Border-Separated Item Audit Trail */}
      <div className="pt-2 border-t border-[#E2E8F0]">
        <h3 className="text-[13px] font-semibold text-[#0F172A] mb-2">
          ความเคลื่อนไหวล่าสุดของ SKU นี้
        </h3>
        {itemLogs.length === 0 ? (
          <p className="text-[12px] text-[#64748B] py-2">
            ยังไม่มีประวัติการเคลื่อนไหวสำหรับรายการนี้
          </p>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {itemLogs.slice(0, 4).map((log) => (
              <li key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#0F172A]">
                    {ACTION_LABELS_TH[log.action] || log.action} ·{' '}
                    <span className="font-normal text-[#444653]">{log.note}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B] mt-0.5">
                    {formatTimestamp(log.timestamp)} · {log.operator} · {log.bin}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[12px] tabular-nums">
                  <div
                    className={`font-semibold ${
                      log.delta > 0
                        ? 'text-[#059669]'
                        : log.delta < 0
                          ? 'text-[#DC2626]'
                          : 'text-[#444653]'
                    }`}
                  >
                    {log.delta > 0 ? `+${formatNumber(log.delta)}` : formatNumber(log.delta)}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    คงเหลือ {formatNumber(log.resultingQty)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
