import { useState } from 'react';
import BottomSheet from './BottomSheet.jsx';

export default function AddSkuModal({ isOpen, onClose, onCreateSku }) {
  const [nameTh, setNameTh] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('SKU-');
  const [category, setCategory] = useState('ระบบอัตโนมัติ');
  const [zone, setZone] = useState('Zone A');
  const [bin, setBin] = useState('LOC-A05-02');
  const [quantity, setQuantity] = useState('100');
  const [minThreshold, setMinThreshold] = useState('25');
  const [unit, setUnit] = useState('PCS');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!nameTh.trim() && !name.trim()) || !sku.trim() || !bin.trim()) {
      setError('กรุณากรอกชื่อสินค้า รหัส SKU และตำแหน่ง Bin ให้ครบถ้วน');
      return;
    }

    onCreateSku({
      name: name.trim() || nameTh.trim(),
      nameTh: nameTh.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      zone,
      bin: bin.trim().toUpperCase(),
      batch: `BATCH-${new Date().getFullYear().toString().slice(-2)}N`,
      supplier: supplier.trim() || 'รับเข้าจากผู้จำหน่ายโดยตรง',
      quantity: Math.max(0, Number.parseInt(quantity, 10) || 0),
      minThreshold: Math.max(1, Number.parseInt(minThreshold, 10) || 10),
      unit,
    });

    setName('');
    setNameTh('');
    setSku('SKU-');
    setSupplier('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ลงทะเบียน SKU ใหม่"
      subtitle="เพิ่มรายการสินค้าเข้าสู่ฐานข้อมูลคลังสินค้า"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
        <div>
          <label className="block text-[12px] font-medium text-[#444653] mb-1">
            ชื่อสินค้า (ภาษาไทย) *
          </label>
          <input
            type="text"
            value={nameTh}
            onChange={(e) => setNameTh(e.target.value)}
            placeholder="เช่น กระบอกสูบลมนิวเมติกส์ 50 มม."
            className="apex-input w-full h-[44px] px-3 text-[14px] text-[#0F172A]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#444653] mb-1">
            ชื่อสินค้า (ภาษาอังกฤษ - ไม่บังคับ)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Pneumatic Air Cylinder 50mm"
            className="apex-input w-full h-[44px] px-3 text-[14px] text-[#0F172A]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#444653] mb-1">
            รหัส SKU *
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="apex-input w-full h-[44px] px-3 font-mono text-[13px] uppercase text-[#0F172A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              โซนจัดเก็บ
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="apex-input w-full h-[44px] px-2.5 text-[13px] text-[#0F172A]"
            >
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D">Zone D</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              ตำแหน่ง Bin *
            </label>
            <input
              type="text"
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              className="apex-input w-full h-[44px] px-3 font-mono text-[13px] uppercase text-[#0F172A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              ยอดเริ่มต้น
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="apex-input w-full h-[44px] px-3 font-mono text-[14px] tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              จุดแจ้งเตือนขั้นต่ำ
            </label>
            <input
              type="number"
              min="1"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="apex-input w-full h-[44px] px-3 font-mono text-[14px] tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              หน่วยนับ
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="apex-input w-full h-[44px] px-2.5 font-mono text-[13px] text-[#0F172A]"
            >
              <option value="PCS">PCS</option>
              <option value="BOX">BOX</option>
              <option value="PALLET">PALLET</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              หมวดหมู่
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="apex-input w-full h-[44px] px-3 text-[13px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              ผู้จัดจำหน่าย
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="ชื่อผู้จัดจำหน่าย"
              className="apex-input w-full h-[44px] px-3 text-[13px] text-[#0F172A]"
            />
          </div>
        </div>

        {error && <p className="text-[12px] text-[#DC2626] font-medium">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-[14px] font-semibold transition-colors"
          >
            บันทึก SKU ใหม่
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
