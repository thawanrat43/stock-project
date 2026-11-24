import { MapPin } from 'lucide-react';
import StatusChip from './StatusChip.jsx';
import { WAREHOUSE_ZONES } from '../data/initialInventory.js';
import { formatNumber, getStockStatus } from '../utils/stockHelpers.js';

export default function LocationsView({ skus, onSelectSkuFromLocation }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-[#0B1C30]">
          ผังโซนคลังสินค้าและตำแหน่งจัดเก็บ
        </h2>
        <p className="text-[13px] text-[#444653] mt-0.5">
          ตรวจสอบการจัดสรรพื้นที่จัดเก็บในแต่ละโซนและคลิกที่รายการเพื่อเข้าสู่หน้าปรับยอดได้ทันที
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WAREHOUSE_ZONES.map((zone) => {
          const zoneSkus = skus.filter((item) => item.zone === zone.id);
          const occupancyPct = Math.min(
            100,
            Math.round((zoneSkus.length / zone.capacity) * 100)
          );

          return (
            <section key={zone.id} className="apex-card overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[#0F172A]">
                    {zone.title}
                  </h3>
                  <span className="font-mono text-[12px] font-semibold text-[#1E40AF] tabular-nums shrink-0">
                    {zoneSkus.length}/{zone.capacity} ช่อง
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#64748B] mt-1">
                  แถว {zone.aisles} · {zone.temperature} · ใช้งานแล้ว {occupancyPct}%
                </div>
              </div>

              {zoneSkus.length === 0 ? (
                <div className="p-4 text-[13px] text-[#64748B]">
                  ยังไม่มีรายการสินค้าจัดเก็บใน {zone.id}
                </div>
              ) : (
                <ul className="divide-y divide-[#E2E8F0]">
                  {zoneSkus.map((item) => {
                    const status = getStockStatus(item.quantity, item.minThreshold);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onSelectSkuFromLocation(item.id)}
                          className="w-full min-h-[52px] px-4 py-2.5 text-left hover:bg-[#F1F5F9] flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[12px] font-semibold text-[#1E40AF] inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" aria-hidden="true" />
                                {item.bin}
                              </span>
                              <span className="font-mono text-[11px] text-[#64748B]">
                                {item.sku}
                              </span>
                            </div>
                            <div className="text-[13px] font-medium text-[#0F172A] truncate mt-0.5">
                              {item.nameTh || item.name}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            <span className="font-mono text-[13px] font-bold text-[#0F172A] tabular-nums">
                              {formatNumber(item.quantity)} {item.unit}
                            </span>
                            <StatusChip status={status} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
