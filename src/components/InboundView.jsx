import { useState } from 'react';
import { CheckCircle2, Minus, PackageCheck, Plus, Truck } from 'lucide-react';
import { formatNumber } from '../utils/stockHelpers.js';

export default function InboundView({ purchaseOrders, onReceiveLineItem }) {
  const [qtyEdits, setQtyEdits] = useState({});

  const getQtyValue = (poId, item) => {
    const key = `${poId}-${item.skuId}`;
    if (qtyEdits[key] !== undefined) return qtyEdits[key];
    return item.receivedQty;
  };

  const setQtyValue = (poId, item, nextVal) => {
    const key = `${poId}-${item.skuId}`;
    setQtyEdits((prev) => ({
      ...prev,
      [key]: Math.max(0, nextVal),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0B1C30]">
            รับสินค้าเข้าคลังและตรวจนับพาเลท
          </h2>
          <p className="text-[13px] text-[#444653] mt-0.5">
            ตรวจสอบรายการใบสั่งซื้อขาเข้าและยืนยันรับยอดเข้าตำแหน่ง Bin ในคลังสินค้าโดยตรง
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {purchaseOrders.map((po) => {
          const allReceived = po.items.every((item) => item.received);
          return (
            <section key={po.id} className="apex-card overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#1E40AF] shrink-0" aria-hidden="true" />
                    <span className="font-mono text-[14px] font-bold text-[#0F172A]">
                      {po.poNumber}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#444653] mt-0.5 truncate">
                    {po.supplier} · {po.dock} · {po.eta}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-sans text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                    allReceived
                      ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                      : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                  }`}
                >
                  {allReceived ? 'รับครบแล้ว' : po.status}
                </span>
              </div>

              <ul className="divide-y divide-[#E2E8F0]">
                {po.items.map((item) => {
                  const qty = getQtyValue(po.id, item);
                  return (
                    <li key={item.skuId} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold text-[#0F172A]">
                            {item.name}
                          </h3>
                          <div className="font-mono text-[12px] text-[#64748B] mt-0.5">
                            {item.sku} · เป้าหมาย{' '}
                            <span className="text-[#1E40AF] font-medium">
                              {item.targetBin}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[12px] text-[#444653] shrink-0 tabular-nums">
                          ยอดสั่ง: <strong>{formatNumber(item.expectedQty)}</strong>{' '}
                          {item.unit}
                        </div>
                      </div>

                      {item.received ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[13px] font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>รับเข้าตำแหน่ง {item.targetBin} เรียบร้อย</span>
                          </span>
                          <span className="font-mono font-bold tabular-nums">
                            +{formatNumber(item.receivedQty)} {item.unit}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setQtyValue(po.id, item, qty - 5)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9]"
                              aria-label="ลดจำนวนรับเข้า 5"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) =>
                                setQtyValue(
                                  po.id,
                                  item,
                                  Number.parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="apex-input w-24 h-[44px] px-2 text-center font-mono text-[15px] font-bold tabular-nums"
                              aria-label={`จำนวนที่รับจริงสำหรับ ${item.sku}`}
                            />
                            <button
                              type="button"
                              onClick={() => setQtyValue(po.id, item, qty + 5)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9]"
                              aria-label="เพิ่มจำนวนรับเข้า 5"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="font-mono text-[12px] text-[#64748B] ml-1">
                              {item.unit}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onReceiveLineItem(po.id, po.poNumber, item.skuId, qty)
                            }
                            disabled={qty <= 0}
                            className="min-h-[44px] px-4 rounded bg-[#1E40AF] hover:bg-[#1E3A8A] disabled:opacity-40 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <PackageCheck className="w-4 h-4" aria-hidden="true" />
                            <span>ยืนยันรับเข้า Bin</span>
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
