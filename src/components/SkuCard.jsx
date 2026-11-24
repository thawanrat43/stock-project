import { Check, SlidersHorizontal } from 'lucide-react';
import StatusChip from './StatusChip.jsx';
import { formatNumber, getStockStatus } from '../utils/stockHelpers.js';

export default function SkuCard({
  item,
  isSelected,
  onSelect,
  onQuickVerify,
  onQuickStep,
}) {
  const status = getStockStatus(item.quantity, item.minThreshold);
  const primaryTitle = item.nameTh || item.name;
  const secondaryTitle = item.nameTh ? item.name : '';

  return (
    <article
      className={`apex-card transition-colors duration-150 ${
        isSelected
          ? 'border-[#1E40AF] ring-1 ring-[#1E40AF] bg-[#EFF4FF]/45'
          : 'hover:border-[#94A3B8]'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item.id);
          }
        }}
        className="w-full text-left p-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1E40AF] rounded-t-lg"
      >
        {/* Header: Thai primary item name + right-aligned StatusChip */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[16px] leading-[22px] font-semibold text-[#0B1C30] truncate">
              {primaryTitle}
            </h3>
            {secondaryTitle && (
              <p className="text-[13px] leading-[18px] text-[#444653] truncate mt-0.5">
                {secondaryTitle}
              </p>
            )}
          </div>
          <StatusChip status={status} />
        </div>

        {/* Body: Monospace SKU/Barcode/Bin on left, large quantity + unit on right */}
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0 font-mono text-[12px] leading-[18px] text-[#444653] space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold text-[#0F172A]">{item.sku}</span>
              <span aria-hidden="true" className="text-[#94A3B8]">
                ·
              </span>
              <span className="text-[#1E40AF] font-medium">{item.bin}</span>
              <span aria-hidden="true" className="text-[#94A3B8]">
                ·
              </span>
              <span>{item.batch}</span>
            </div>
            <div className="text-[11px] text-[#64748B] truncate">
              ขั้นต่ำ {formatNumber(item.minThreshold)} {item.unit} · {item.supplier}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-mono text-[20px] leading-[24px] font-bold text-[#0F172A] tabular-nums">
                {formatNumber(item.quantity)}
              </span>
              <span className="font-mono text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                {item.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Glove-friendly 44px+ action bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 rounded-b-lg">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQuickStep(item.id, -1)}
            disabled={item.quantity <= 0}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded border border-[#CBD5E1] bg-white font-mono text-[14px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={`ลดจำนวน ${primaryTitle} ลง 1`}
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => onQuickStep(item.id, 1)}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded border border-[#CBD5E1] bg-white font-mono text-[14px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors"
            aria-label={`เพิ่มจำนวน ${primaryTitle} ขึ้น 1`}
          >
            +1
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuickVerify(item.id)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded border border-[#CBD5E1] bg-white text-[12px] font-medium text-[#006C4A] hover:bg-[#ECFDF5] hover:border-[#A7F3D0] transition-colors whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ยืนยันยอด</span>
          </button>
          <button
            type="button"
            onClick={() => onSelect(item.id, true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded bg-[#1E40AF] text-white text-[12px] font-medium hover:bg-[#1E3A8A] transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ปรับสต็อก</span>
          </button>
        </div>
      </div>
    </article>
  );
}
