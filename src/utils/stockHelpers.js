export function getStockStatus(quantity, minThreshold) {
  if (quantity <= 0) {
    return 'Depleted';
  }
  if (quantity < minThreshold) {
    return 'Low Stock';
  }
  return 'In Stock';
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export const STATUS_LABELS_TH = {
  'In Stock': 'สต็อกปกติ',
  'Low Stock': 'สต็อกต่ำ',
  Depleted: 'สินค้าหมด',
};

export const ACTION_LABELS_TH = {
  Inbound: 'รับเข้าคลัง',
  Adjustment: 'ปรับยอด',
  Verified: 'ยืนยันนับแล้ว',
  Transfer: 'ย้ายตำแหน่ง Bin',
  Discrepancy: 'เสียหาย/ตัดยอด',
};

export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function exportAuditCsv(logs) {
  const headers = [
    'วันเวลา',
    'รหัส SKU',
    'ชื่อสินค้า',
    'ประเภทกิจกรรม',
    'เปลี่ยนแปลง',
    'ยอดคงเหลือ',
    'หน่วย',
    'ตำแหน่ง Bin',
    'ผู้ดำเนินการ',
    'หมายเหตุ',
  ];

  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = logs.map((entry) => [
    entry.timestamp,
    entry.sku,
    entry.itemName,
    ACTION_LABELS_TH[entry.action] || entry.action,
    entry.delta > 0 ? `+${entry.delta}` : entry.delta,
    entry.resultingQty,
    entry.unit,
    entry.bin,
    entry.operator,
    entry.note,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `apex-stock-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInventorySummaryCsv(skus) {
  const headers = [
    'รหัส SKU',
    'ชื่อสินค้า (ไทย)',
    'ชื่อสินค้า (อังกฤษ)',
    'หมวดหมู่',
    'โซน',
    'ตำแหน่ง Bin',
    'คงเหลือ',
    'เกณฑ์ขั้นต่ำ',
    'หน่วย',
    'สถานะ',
    'ผู้จัดจำหน่าย',
  ];

  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = skus.map((item) => {
    const statusKey = getStockStatus(item.quantity, item.minThreshold);
    return [
      item.sku,
      item.nameTh || item.name,
      item.name,
      item.category,
      item.zone,
      item.bin,
      item.quantity,
      item.minThreshold,
      item.unit,
      STATUS_LABELS_TH[statusKey] || statusKey,
      item.supplier,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `apex-inventory-summary-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
