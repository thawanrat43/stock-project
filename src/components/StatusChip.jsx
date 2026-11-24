import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { STATUS_LABELS_TH } from '../utils/stockHelpers.js';

const STATUS_STYLES = {
  'In Stock': {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#065F46]',
    border: 'border-[#A7F3D0]',
    Icon: CheckCircle2,
  },
  'Low Stock': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
    Icon: AlertTriangle,
  },
  Depleted: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
    Icon: XCircle,
  },
};

export default function StatusChip({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['In Stock'];
  const { Icon } = style;
  const label = STATUS_LABELS_TH[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-sans text-[11px] font-semibold whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
