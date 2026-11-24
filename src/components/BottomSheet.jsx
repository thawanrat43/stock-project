import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-[#0F172A]/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full lg:max-w-lg max-h-[90vh] flex flex-col bg-white rounded-t-xl lg:rounded-lg apex-sheet lg:apex-popover overflow-hidden">
        <div className="lg:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-8 h-1 rounded-full bg-[#94A3B8]" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[#0F172A] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="font-mono text-[12px] text-[#64748B] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[#444653] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors focus-visible:outline-2 focus-visible:outline-[#1E40AF]"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
