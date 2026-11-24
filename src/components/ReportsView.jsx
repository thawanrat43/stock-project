import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  PackageCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import StatusChip from './StatusChip.jsx';
import { WAREHOUSE_ZONES } from '../data/initialInventory.js';
import {
  ACTION_LABELS_TH,
  formatNumber,
  getStockStatus,
} from '../utils/stockHelpers.js';

const ZONE_FILTERS = ['ทุกโซน', 'Zone A', 'Zone B', 'Zone C', 'Zone D'];

export default function ReportsView({
  skus,
  logs,
  purchaseOrders,
  users,
  onFilterByZone,
}) {
  const [selectedZone, setSelectedZone] = useState('ทุกโซน');

  const scopedSkus = useMemo(() => {
    if (selectedZone === 'ทุกโซน') return skus;
    return skus.filter((item) => item.zone === selectedZone);
  }, [skus, selectedZone]);

  const scopedLogs = useMemo(() => {
    if (selectedZone === 'ทุกโซน') return logs;
    const skuIds = new Set(scopedSkus.map((s) => s.id));
    return logs.filter((entry) => skuIds.has(entry.skuId));
  }, [logs, scopedSkus, selectedZone]);

  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let depleted = 0;
    let totalUnits = 0;
    const unitTotals = { PCS: 0, BOX: 0, PALLET: 0 };

    scopedSkus.forEach((item) => {
      totalUnits += item.quantity;
      if (unitTotals[item.unit] !== undefined) {
        unitTotals[item.unit] += item.quantity;
      }
      const status = getStockStatus(item.quantity, item.minThreshold);
      if (status === 'In Stock') inStock += 1;
      else if (status === 'Low Stock') lowStock += 1;
      else depleted += 1;
    });

    const totalSkus = scopedSkus.length;
    const healthyPct =
      totalSkus > 0 ? Math.round((inStock / totalSkus) * 1000) / 10 : 0;

    let inboundUnits = 0;
    let outboundUnits = 0;
    scopedLogs.forEach((entry) => {
      if (entry.delta > 0) inboundUnits += entry.delta;
      if (entry.delta < 0) outboundUnits += Math.abs(entry.delta);
    });

    const pendingPoLines = purchaseOrders.reduce(
      (sum, po) => sum + po.items.filter((i) => !i.received).length,
      0
    );

    const activeUsers = users.filter((u) => u.status === 'Active').length;

    return {
      totalSkus,
      totalUnits,
      unitTotals,
      inStock,
      lowStock,
      depleted,
      attentionCount: lowStock + depleted,
      healthyPct,
      inboundUnits,
      outboundUnits,
      totalMovements: scopedLogs.length,
      pendingPoLines,
      activeUsers,
    };
  }, [scopedSkus, scopedLogs, purchaseOrders, users]);

  const zoneBreakdown = useMemo(() => {
    return WAREHOUSE_ZONES.map((zone) => {
      const zoneItems = skus.filter((s) => s.zone === zone.id);
      let inStock = 0;
      let lowStock = 0;
      let depleted = 0;
      let units = 0;

      zoneItems.forEach((item) => {
        units += item.quantity;
        const st = getStockStatus(item.quantity, item.minThreshold);
        if (st === 'In Stock') inStock += 1;
        else if (st === 'Low Stock') lowStock += 1;
        else depleted += 1;
      });

      const occupancyPct = Math.min(
        100,
        Math.round((zoneItems.length / zone.capacity) * 100)
      );

      return {
        ...zone,
        count: zoneItems.length,
        inStock,
        lowStock,
        depleted,
        units,
        occupancyPct,
      };
    });
  }, [skus]);

  const actionBreakdown = useMemo(() => {
    const order = ['Inbound', 'Adjustment', 'Verified', 'Transfer', 'Discrepancy'];
    const map = {};
    order.forEach((key) => {
      map[key] = { action: key, count: 0, netDelta: 0 };
    });

    scopedLogs.forEach((entry) => {
      if (!map[entry.action]) {
        map[entry.action] = { action: entry.action, count: 0, netDelta: 0 };
      }
      map[entry.action].count += 1;
      map[entry.action].netDelta += entry.delta;
    });

    const maxCount = Math.max(
      1,
      ...Object.values(map).map((item) => item.count)
    );

    return Object.values(map).map((item) => ({
      ...item,
      label: ACTION_LABELS_TH[item.action] || item.action,
      barPct: Math.round((item.count / maxCount) * 100),
    }));
  }, [scopedLogs]);

  const reorderQueue = useMemo(() => {
    return scopedSkus
      .filter((item) => getStockStatus(item.quantity, item.minThreshold) !== 'In Stock')
      .map((item) => ({
        ...item,
        status: getStockStatus(item.quantity, item.minThreshold),
        shortfall: Math.max(0, item.minThreshold - item.quantity),
        ratio: item.minThreshold > 0 ? item.quantity / item.minThreshold : 1,
      }))
      .sort((a, b) => a.ratio - b.ratio);
  }, [scopedSkus]);

  // SVG Donut Geometry (r = 54, circumference = 2 * pi * 54 ≈ 339.292)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const totalForChart = Math.max(1, stats.totalSkus);
  const inStockLen = (stats.inStock / totalForChart) * circumference;
  const lowStockLen = (stats.lowStock / totalForChart) * circumference;
  const depletedLen = (stats.depleted / totalForChart) * circumference;

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0B1C30]">
            รายงานสถิติภาพรวมคลังสินค้า
          </h2>
          <p className="text-[13px] text-[#444653] mt-0.5">
            สรุปความพร้อมของสต็อก ปริมาณการเคลื่อนไหวรายโซน และคิวสินค้าที่ต้องสั่งซื้อเร่งด่วน
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg overflow-x-auto max-w-full">
          {ZONE_FILTERS.map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`min-h-[34px] px-3 py-1 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedZone === zone
                  ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                  : 'text-[#444653] hover:text-[#0F172A]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Executive KPI Strip */}
      <section
        aria-label="ตัวชี้วัดสถิติภาพรวม"
        className="apex-card grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0] overflow-hidden"
      >
        <div className="p-4">
          <span className="text-[12px] font-medium text-[#444653] block">
            ยอดคงเหลือรวม ({selectedZone})
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#0F172A] tabular-nums">
              {formatNumber(stats.totalUnits)}
            </span>
            <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
              {stats.totalSkus} SKU
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-[#64748B] truncate">
            {formatNumber(stats.unitTotals.PCS)} PCS · {formatNumber(stats.unitTotals.BOX)} BOX ·{' '}
            {formatNumber(stats.unitTotals.PALLET)} PALLET
          </div>
        </div>

        <div className="p-4 border-l border-[#E2E8F0] lg:border-l-0">
          <span className="text-[12px] font-medium text-[#444653] block">
            อัตราความพร้อมจ่าย (In Stock)
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#059669] tabular-nums">
              {stats.healthyPct}%
            </span>
            <span className="font-mono text-[11px] text-[#065F46] tabular-nums">
              {stats.inStock}/{stats.totalSkus} SKU
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-[#444653]">
            รายการที่มีสต็อกสูงกว่าเกณฑ์ขั้นต่ำ
          </div>
        </div>

        <div className="p-4">
          <span className="text-[12px] font-medium text-[#444653] block">
            ปริมาณเคลื่อนไหวสะสม
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#1E40AF] tabular-nums">
              {formatNumber(stats.totalMovements)}
            </span>
            <span className="text-[11px] text-[#64748B]">รายการ</span>
          </div>
          <div className="mt-1.5 font-mono text-[11px] tabular-nums">
            <span className="text-[#059669]">+{formatNumber(stats.inboundUnits)} รับเข้า</span>
            <span className="text-[#94A3B8] mx-1.5">·</span>
            <span className="text-[#DC2626]">-{formatNumber(stats.outboundUnits)} จ่ายออก</span>
          </div>
        </div>

        <div className="p-4 border-l border-[#E2E8F0] lg:border-l-0">
          <span className="text-[12px] font-medium text-[#444653] block">
            ต้องเติมสต็อก &amp; รอรับเข้า
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#D97706] tabular-nums">
              {formatNumber(stats.attentionCount)}
            </span>
            <span className="font-mono text-[11px] text-[#92400E] tabular-nums">
              PO รอรับ {stats.pendingPoLines} รายการ
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-[#64748B] tabular-nums">
            ต่ำกว่าเกณฑ์ {stats.lowStock} · หมด {stats.depleted} · ผู้ใช้ Active {stats.activeUsers}
          </div>
        </div>
      </section>

      {/* Main Analytics Grid: Zone Comparison (7 cols) + Stock Health Donut (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Zone Distribution & Capacity */}
        <section className="lg:col-span-7 apex-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                สัดส่วนสถานะสินค้าและการใช้พื้นที่รายโซน
              </h3>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                คลิกที่โซนเพื่อดูรายการสินค้าในโซนนั้น
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#1E40AF] shrink-0" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            {zoneBreakdown.map((zone) => {
              const total = Math.max(1, zone.count);
              const inPct = (zone.inStock / total) * 100;
              const lowPct = (zone.lowStock / total) * 100;
              const depPct = (zone.depleted / total) * 100;

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onFilterByZone(zone.id)}
                  className="w-full text-left p-3 rounded-md border border-[#E2E8F0] hover:border-[#1E40AF] hover:bg-[#F8FAFC] transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[13px] font-bold text-[#1E40AF]">
                        {zone.id}
                      </span>
                      <span className="text-[13px] font-medium text-[#0F172A] truncate">
                        {zone.title.replace(`${zone.id} — `, '')}
                      </span>
                    </div>
                    <div className="font-mono text-[12px] text-[#444653] tabular-nums shrink-0 flex items-center gap-2">
                      <span>{formatNumber(zone.units)} หน่วย</span>
                      <span className="text-[#94A3B8]">·</span>
                      <span>
                        {zone.count}/{zone.capacity} ช่อง ({zone.occupancyPct}%)
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#1E40AF]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Segmented Stock Health Bar */}
                  <div className="h-2.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden flex">
                    {zone.count > 0 && (
                      <>
                        {zone.inStock > 0 && (
                          <div
                            className="h-full bg-[#059669]"
                            style={{ width: `${inPct}%` }}
                            title={`สต็อกปกติ: ${zone.inStock}`}
                          />
                        )}
                        {zone.lowStock > 0 && (
                          <div
                            className="h-full bg-[#D97706]"
                            style={{ width: `${lowPct}%` }}
                            title={`สต็อกต่ำ: ${zone.lowStock}`}
                          />
                        )}
                        {zone.depleted > 0 && (
                          <div
                            className="h-full bg-[#DC2626]"
                            style={{ width: `${depPct}%` }}
                            title={`สินค้าหมด: ${zone.depleted}`}
                          />
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 font-mono text-[11px] text-[#64748B] tabular-nums">
                    <span className="text-[#065F46]">ปกติ {zone.inStock}</span>
                    <span className="text-[#92400E]">สต็อกต่ำ {zone.lowStock}</span>
                    <span className="text-[#991B1B]">หมด {zone.depleted}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Stock Health Donut Breakdown */}
        <section className="lg:col-span-5 apex-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              สัดส่วนความสมบูรณ์สต็อก ({selectedZone})
            </h3>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              จำแนกตามเกณฑ์แจ้งเตือนขั้นต่ำของแต่ละ SKU
            </p>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="16"
                />
                {stats.totalSkus > 0 && (
                  <>
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="16"
                      strokeDasharray={`${inStockLen} ${circumference}`}
                      strokeDashoffset={0}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="16"
                      strokeDasharray={`${lowStockLen} ${circumference}`}
                      strokeDashoffset={-inStockLen}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="16"
                      strokeDasharray={`${depletedLen} ${circumference}`}
                      strokeDashoffset={-(inStockLen + lowStockLen)}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-[24px] font-bold text-[#0F172A] tabular-nums leading-none">
                  {formatNumber(stats.totalSkus)}
                </span>
                <span className="text-[11px] text-[#64748B] mt-1">รายการ SKU</span>
              </div>
            </div>
          </div>

          <ul className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] text-[13px]">
            <li className="py-2.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[#0F172A] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                <span>สต็อกปกติ (พร้อมจ่าย)</span>
              </span>
              <span className="font-mono font-semibold text-[#065F46] tabular-nums">
                {stats.inStock} SKU ({stats.totalSkus > 0 ? Math.round((stats.inStock / stats.totalSkus) * 100) : 0}%)
              </span>
            </li>
            <li className="py-2.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[#0F172A] font-medium">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                <span>สต็อกต่ำกว่าเกณฑ์</span>
              </span>
              <span className="font-mono font-semibold text-[#92400E] tabular-nums">
                {stats.lowStock} SKU ({stats.totalSkus > 0 ? Math.round((stats.lowStock / stats.totalSkus) * 100) : 0}%)
              </span>
            </li>
            <li className="py-2.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[#0F172A] font-medium">
                <XCircle className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                <span>สินค้าหมด (ต้องเติมด่วน)</span>
              </span>
              <span className="font-mono font-semibold text-[#991B1B] tabular-nums">
                {stats.depleted} SKU ({stats.totalSkus > 0 ? Math.round((stats.depleted / stats.totalSkus) * 100) : 0}%)
              </span>
            </li>
          </ul>
        </section>
      </div>

      {/* Bottom 2-Column Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Activity Breakdown */}
        <section className="lg:col-span-5 apex-card p-5 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              สถิติกิจกรรมคลังสินค้า ({selectedZone})
            </h3>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              จำนวนครั้งและผลต่างยอดสุทธิแยกตามประเภทการดำเนินการ
            </p>
          </div>

          <ul className="divide-y divide-[#E2E8F0]">
            {actionBreakdown.map((item) => (
              <li key={item.action} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-medium text-[#0F172A]">{item.label}</span>
                  <div className="font-mono text-[12px] tabular-nums flex items-center gap-2">
                    <span className="font-semibold text-[#0F172A]">
                      {item.count} ครั้ง
                    </span>
                    {item.netDelta !== 0 && (
                      <span
                        className={
                          item.netDelta > 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                        }
                      >
                        ({item.netDelta > 0
                          ? `+${formatNumber(item.netDelta)}`
                          : formatNumber(item.netDelta)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full bg-[#1E40AF] rounded-full transition-all duration-200"
                    style={{ width: `${item.count > 0 ? Math.max(8, item.barPct) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Reorder Priority Queue */}
        <section className="lg:col-span-7 apex-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                รายการต้องเติมสต็อกเร่งด่วน
              </h3>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                เรียงลำดับตามระดับความวิกฤตเทียบกับเกณฑ์ขั้นต่ำ
              </p>
            </div>
            <span className="font-mono text-[12px] font-semibold text-[#1E40AF] tabular-nums">
              {reorderQueue.length} รายการ
            </span>
          </div>

          {reorderQueue.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <PackageCheck
                className="w-8 h-8 text-[#059669] mx-auto"
                aria-hidden="true"
              />
              <p className="text-[14px] font-semibold text-[#0F172A]">
                สต็อกทุกรายการอยู่ในเกณฑ์ปกติ
              </p>
              <p className="text-[12px] text-[#64748B]">
                ไม่มีสินค้าต่ำกว่าเกณฑ์ขั้นต่ำใน {selectedZone}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {reorderQueue.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-[#0F172A]">
                        {item.nameTh || item.name}
                      </span>
                      <StatusChip status={item.status} />
                    </div>
                    <div className="font-mono text-[12px] text-[#64748B] tabular-nums">
                      {item.sku} · {item.bin} · คงเหลือ{' '}
                      <strong className="text-[#0F172A]">
                        {formatNumber(item.quantity)}
                      </strong>{' '}
                      / ขั้นต่ำ {formatNumber(item.minThreshold)} {item.unit} (ขาดอีก{' '}
                      <span className="text-[#DC2626] font-semibold">
                        {formatNumber(item.shortfall)}
                      </span>{' '}
                      {item.unit})
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
