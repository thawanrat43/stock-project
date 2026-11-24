import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import {
  ACTION_LABELS_TH,
  exportAuditCsv,
  formatNumber,
  formatTimestamp,
} from '../utils/stockHelpers.js';

const ACTION_FILTERS = [
  { id: 'All', label: 'ทั้งหมด' },
  { id: 'Inbound', label: 'รับเข้าคลัง' },
  { id: 'Adjustment', label: 'ปรับยอด' },
  { id: 'Verified', label: 'ยืนยันนับแล้ว' },
  { id: 'Transfer', label: 'ย้ายตำแหน่ง' },
  { id: 'Discrepancy', label: 'เสียหาย/ตัดยอด' },
];

export default function AuditLogView({ logs }) {
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (actionFilter !== 'All' && entry.action !== actionFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.sku.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        entry.bin.toLowerCase().includes(q) ||
        entry.operator.toLowerCase().includes(q) ||
        entry.note.toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0B1C30]">
            ประวัติการเคลื่อนไหวและตรวจสอบสต็อก
          </h2>
          <p className="text-[13px] text-[#444653] mt-0.5">
            บันทึกการนับสต็อก การรับสินค้าเข้า การย้ายตำแหน่ง และรายการตัดยอดเสียหายอย่างครบถ้วน
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportAuditCsv(filteredLogs)}
          className="min-h-[44px] px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-[#1E40AF]" aria-hidden="true" />
          <span>ส่งออก CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg overflow-x-auto">
          {ACTION_FILTERS.map((filterItem) => (
            <button
              key={filterItem.id}
              type="button"
              onClick={() => setActionFilter(filterItem.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                actionFilter === filterItem.id
                  ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                  : 'text-[#444653] hover:text-[#0F172A]'
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา SKU, ตำแหน่ง Bin, ผู้ปฏิบัติงาน..."
            className="apex-input w-full h-[42px] pl-9 pr-3 text-[13px] text-[#0F172A]"
          />
        </div>
      </div>

      {/* Border-separated Continuous List */}
      <div className="apex-card overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#64748B]">
            ไม่พบประวัติการเคลื่อนไหวที่ตรงกับตัวกรอง
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {filteredLogs.map((entry) => (
              <li
                key={entry.id}
                className="px-4 py-3.5 hover:bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-[#1E40AF]">
                      {entry.sku}
                    </span>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      {entry.itemName}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#444653]">
                    <span className="font-semibold text-[#0F172A]">
                      {ACTION_LABELS_TH[entry.action] || entry.action}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{entry.note}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B]">
                    {formatTimestamp(entry.timestamp)} · {entry.bin} · ผู้ดำเนินการ: {entry.operator}
                  </div>
                </div>

                <div className="sm:text-right font-mono shrink-0 tabular-nums flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <span
                    className={`text-[14px] font-bold ${
                      entry.delta > 0
                        ? 'text-[#059669]'
                        : entry.delta < 0
                          ? 'text-[#DC2626]'
                          : 'text-[#444653]'
                    }`}
                  >
                    {entry.delta > 0
                      ? `+${formatNumber(entry.delta)}`
                      : formatNumber(entry.delta)}{' '}
                    {entry.unit}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    คงเหลือ: {formatNumber(entry.resultingQty)} {entry.unit}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
