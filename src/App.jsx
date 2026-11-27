import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Layers,
  LogOut,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  Truck,
  Users,
} from 'lucide-react';
import AddSkuModal from './components/AddSkuModal.jsx';
import AuditLogView from './components/AuditLogView.jsx';
import BottomSheet from './components/BottomSheet.jsx';
import InboundView from './components/InboundView.jsx';
import LocationsView from './components/LocationsView.jsx';
import LoginPage from './components/LoginPage.jsx';
import ReportsView from './components/ReportsView.jsx';
import SkuCard from './components/SkuCard.jsx';
import StockDetailPanel from './components/StockDetailPanel.jsx';
import UsersView from './components/UsersView.jsx';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_INBOUND_POS,
  INITIAL_SKUS,
} from './data/initialInventory.js';
import { INITIAL_USERS } from './data/initialUsers.js';
import { formatNumber, getStockStatus } from './utils/stockHelpers.js';

const STORAGE_KEY = 'apex-stock-engine-th-v1';
const AUTH_STORAGE_KEY = 'apex-stock-auth-th-v1';

const NAV_ITEMS = [
  { id: 'reports', label: 'รายงานภาพรวม', mobileLabel: 'ภาพรวม', Icon: BarChart3 },
  { id: 'inventory', label: 'คลังสินค้า', mobileLabel: 'คลังสินค้า', Icon: Layers },
  { id: 'inbound', label: 'รับสินค้าเข้า', mobileLabel: 'รับเข้า', Icon: Truck },
  { id: 'audit', label: 'ประวัติตรวจสอบ', mobileLabel: 'ประวัติ', Icon: ClipboardList },
  { id: 'users', label: 'จัดการผู้ใช้', mobileLabel: 'ผู้ใช้', Icon: Users },
];

const STATUS_FILTERS = [
  { id: 'All', label: 'ทั้งหมด' },
  { id: 'In Stock', label: 'สต็อกปกติ' },
  { id: 'Low Stock', label: 'สต็อกต่ำ' },
  { id: 'Depleted', label: 'สินค้าหมด' },
];

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.skus) && Array.isArray(parsed.logs)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function loadSavedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.loggedOut) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const saved = useMemo(() => loadSavedState(), []);
  const [authUser, setAuthUser] = useState(() => loadSavedAuth());

  const [activeTab, setActiveTab] = useState('reports');
  const [inventorySubView, setInventorySubView] = useState('list');
  const [skus, setSkus] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [logs, setLogs] = useState(() => saved?.logs || INITIAL_AUDIT_LOGS);
  const [purchaseOrders, setPurchaseOrders] = useState(
    () => saved?.purchaseOrders || INITIAL_INBOUND_POS
  );
  const [users, setUsers] = useState(
    () => (Array.isArray(saved?.users) ? saved.users : INITIAL_USERS)
  );

  const [selectedSkuId, setSelectedSkuId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [addSkuOpen, setAddSkuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [toast, setToast] = useState(null);
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ skus, logs, purchaseOrders, users })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [skus, logs, purchaseOrders, users]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        const [productsResponse, locationsResponse] = await Promise.all([
          fetch('http://localhost:4000/api/products'),
          fetch('http://localhost:4000/api/locations'),
        ]);

        const productsResult = await productsResponse.json();
        const locationsResult = await locationsResponse.json();

        if (!productsResponse.ok || !productsResult.success) {
          throw new Error('ไม่สามารถโหลดข้อมูลสินค้าจากฐานข้อมูลได้');
        }

        if (!locationsResponse.ok || !locationsResult.success) {
          throw new Error('ไม่สามารถโหลดตำแหน่งจัดเก็บได้');
        }

        setSkus(productsResult.data);
        setLocations(locationsResult.data);

        if (productsResult.data.length > 0) {
          setSelectedSkuId(productsResult.data[0].id);
        }
      } catch (error) {
        console.error('Load database data error:', error);
        showToast(error.message, 'warning');
      }
    };

    loadDatabaseData();
  }, []);
  // โหลดข้อมูลสินค้าจาก PostgreSQL ผ่าน Backend API
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError('');

        const response = await fetch(
          'http://localhost:4000/api/products'
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้'
          );
        }

        if (!cancelled) {
          setSkus(result.data);

          setSelectedSkuId((currentId) => {
            if (
              currentId &&
              result.data.some((item) => item.id === currentId)
            ) {
              return currentId;
            }

            return result.data[0]?.id || null;
          });
        }
      } catch (error) {
        if (!cancelled) {
          setProductsError(error.message);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);
  const showToast = (message, tone = 'success') => {
    setToast({ id: Date.now(), message, tone });
  };

  const summary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let depleted = 0;
    let totalUnits = 0;

    skus.forEach((item) => {
      totalUnits += item.quantity;
      const status = getStockStatus(item.quantity, item.minThreshold);
      if (status === 'In Stock') inStock += 1;
      else if (status === 'Low Stock') lowStock += 1;
      else depleted += 1;
    });

    return {
      totalSkus: skus.length,
      inStock,
      lowStock,
      depleted,
      totalUnits,
    };
  }, [skus]);

  const filteredSkus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return skus.filter((item) => {
      const status = getStockStatus(item.quantity, item.minThreshold);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (zoneFilter !== 'All Zones' && item.zone !== zoneFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.nameTh && item.nameTh.toLowerCase().includes(q)) ||
        item.sku.toLowerCase().includes(q) ||
        item.bin.toLowerCase().includes(q)
      );
    });
  }, [skus, searchQuery, statusFilter, zoneFilter]);

  const selectedSku = useMemo(
    () => skus.find((item) => item.id === selectedSkuId) || skus[0] || null,
    [skus, selectedSkuId]
  );

  const selectedSkuLogs = useMemo(() => {
    if (!selectedSku) return [];
    return logs.filter((entry) => entry.skuId === selectedSku.id);
  }, [logs, selectedSku]);

  const appendLog = (entry) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        operator: 'หัวหน้าคลังสินค้า',
        ...entry,
      },
      ...prev,
    ]);
  };

  const handleSelectSku = (skuId, openMobileSheet = false) => {
    setSelectedSkuId(skuId);
    if (openMobileSheet || window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  const handleApplyAdjustment = async ({
    skuId,
    newQuantity,
    action,
    note,
  }) => {
    const target = skus.find(
      (item) => Number(item.id) === Number(skuId)
    );

    if (!target) {
      showToast('ไม่พบข้อมูลสินค้า', 'warning');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:4000/api/stock/adjust',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: skuId,
            newQuantity,
            action,
            note,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'ไม่สามารถบันทึกสต็อกได้'
        );
      }

      // โหลดข้อมูลสินค้าล่าสุดจาก PostgreSQL
      const productsResponse = await fetch(
        'http://localhost:4000/api/products'
      );

      const productsResult = await productsResponse.json();

      if (!productsResponse.ok || !productsResult.success) {
        throw new Error('บันทึกสำเร็จ แต่โหลดข้อมูลสินค้าใหม่ไม่สำเร็จ');
      }

      setSkus(productsResult.data);

      // บันทึกประวัติที่ได้รับกลับจาก Backend
      const movement = result.data;

      appendLog({
        id: movement.movementId,
        skuId: movement.productId,
        sku: movement.sku,
        itemName: target.nameTh || target.name,
        action: movement.action,
        delta: movement.delta,
        resultingQty: movement.quantity,
        unit: movement.unit,
        bin: target.bin,
        timestamp: movement.createdAt,
        operator: authUser?.operatorName || 'ผู้ใช้งานระบบ',
        note: movement.note,
      });

      showToast(
        `บันทึก ${target.sku} สำเร็จ ยอดคงเหลือ ${formatNumber(
          movement.quantity
        )} ${movement.unit}`
      );
    } catch (error) {
      console.error('Save stock error:', error);

      showToast(error.message || 'เกิดข้อผิดพลาดในการบันทึก', 'warning');
    }
  };
  const handleQuickStep = (skuId, step) => {
    const target = skus.find((item) => item.id === skuId);
    if (!target) return;
    const nextQty = Math.max(0, target.quantity + step);
    if (nextQty === target.quantity) return;

    handleApplyAdjustment({
      skuId,
      newQuantity: nextQty,
      action: 'Adjustment',
      note: step > 0 ? 'ปรับเพิ่มยอดด่วน +1 หน้าชั้นวาง' : 'เบิกจ่ายด่วน -1 หน้าชั้นวาง',
    });
  };

  const handleVerifyItem = (skuId) => {
    const target = skus.find((item) => item.id === skuId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    setSkus((prev) =>
      prev.map((item) =>
        item.id === skuId
          ? { ...item, lastVerified: nowIso, verifiedBy: 'หัวหน้าคลังสินค้า' }
          : item
      )
    );

    appendLog({
      skuId: target.id,
      sku: target.sku,
      itemName: target.nameTh || target.name,
      action: 'Verified',
      delta: 0,
      resultingQty: target.quantity,
      unit: target.unit,
      bin: target.bin,
      note: 'ยืนยันยอดนับจริงหน้าชั้นวางตรงตามระบบ',
    });

    showToast(`ยืนยันยอด ${target.sku} (${formatNumber(target.quantity)} ${target.unit}) เรียบร้อย`);
  };

  
const handleTransferBin = async (skuId, destinationLocationId) => {
  const target = skus.find(
    (item) => Number(item.id) === Number(skuId)
  );

  if (!target) {
    showToast('ไม่พบข้อมูลสินค้า', 'warning');
    return false;
  }

  // เลือกเฉพาะตำแหน่งที่มียอดมากกว่า 0
  const activeLocations = (target.locations || []).filter(
    (location) => Number(location.quantity) > 0
  );

  // เวอร์ชันนี้รองรับการย้ายจาก Bin ต้นทางเดียว
  if (activeLocations.length !== 1) {
    showToast(
      'สินค้านี้มีหลายตำแหน่งหรือไม่มียอด กรุณาตรวจสอบข้อมูลก่อนย้าย',
      'warning'
    );
    return false;
  }

  const source = activeLocations[0];

  const destination = locations.find(
    (location) =>
      Number(location.id) === Number(destinationLocationId)
  );

  if (!destination) {
    showToast('ไม่พบตำแหน่งปลายทาง', 'warning');
    return false;
  }

  try {
    const response = await fetch(
      'http://localhost:4000/api/stock/transfer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: target.id,
          sourceLocationId: source.locationId,
          destinationZone: destination.zone,
          destinationBin: destination.bin,
          quantity: Number(source.quantity),
          note: `ย้ายจาก ${source.zone} · ${source.bin} ไปยัง ${destination.zone} · ${destination.bin}`,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'ย้ายสินค้าไม่สำเร็จ');
    }

    // โหลดสินค้าใหม่จาก PostgreSQL
    const productsResponse = await fetch(
      'http://localhost:4000/api/products'
    );

    const productsResult = await productsResponse.json();

    if (!productsResponse.ok || !productsResult.success) {
      throw new Error(
        'ย้ายสำเร็จแล้ว แต่โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ'
      );
    }

    setSkus(productsResult.data);

    const updatedItem = productsResult.data.find(
      (item) => Number(item.id) === Number(skuId)
    );

    appendLog({
      skuId: target.id,
      sku: target.sku,
      itemName: target.nameTh || target.name,
      action: 'Transfer',
      delta: 0,
      resultingQty: Number(source.quantity),
      unit: target.unit,
      bin: destination.bin,
      note: `ย้ายจาก ${source.bin} ไปยัง ${destination.zone} · ${destination.bin}`,
    });

    showToast(
      `ย้าย ${target.sku} ไปยัง ${destination.bin} สำเร็จ`
    );

    return true;
  } catch (error) {
    console.error('Transfer stock error:', error);
    showToast(error.message || 'เกิดข้อผิดพลาดในการย้ายสินค้า', 'warning');
    return false;
  }
};


  const handleReceiveLineItem = (poId, poNumber, skuId, qty) => {
    const target = skus.find((item) => item.id === skuId);
    if (!target || qty <= 0) return;

    const nextQty = target.quantity + qty;
    const nowIso = new Date().toISOString();

    setSkus((prev) =>
      prev.map((item) =>
        item.id === skuId
          ? {
              ...item,
              quantity: nextQty,
              lastVerified: nowIso,
              verifiedBy: 'ฝ่ายรับสินค้าเข้า',
            }
          : item
      )
    );

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === poId
          ? {
              ...po,
              items: po.items.map((line) =>
                line.skuId === skuId
                  ? { ...line, receivedQty: qty, received: true }
                  : line
              ),
            }
          : po
      )
    );

    appendLog({
      skuId: target.id,
      sku: target.sku,
      itemName: target.nameTh || target.name,
      action: 'Inbound',
      delta: qty,
      resultingQty: nextQty,
      unit: target.unit,
      bin: target.bin,
      operator: 'ฝ่ายรับสินค้าเข้า',
      note: `รับสินค้าเข้าตามใบสั่งซื้อ ${poNumber}`,
    });

    showToast(`รับเข้า +${formatNumber(qty)} ${target.unit} สำหรับ ${target.sku} แล้ว`);
  };

  const handleCreateSku = (payload) => {
    const newItem = {
      id: `sku-${Date.now()}`,
      ...payload,
      lastVerified: new Date().toISOString(),
      verifiedBy: 'หัวหน้าคลังสินค้า',
    };
    setSkus((prev) => [newItem, ...prev]);
    setSelectedSkuId(newItem.id);

    appendLog({
      skuId: newItem.id,
      sku: newItem.sku,
      itemName: newItem.nameTh || newItem.name,
      action: 'Inbound',
      delta: newItem.quantity,
      resultingQty: newItem.quantity,
      unit: newItem.unit,
      bin: newItem.bin,
      note: 'ลงทะเบียน SKU ใหม่เข้าสู่คลังสินค้า',
    });

    showToast(`เพิ่ม ${newItem.sku} เข้าตำแหน่ง ${newItem.bin} แล้ว`);
  };

  const handleCreateUser = (payload) => {
    const nextNumber = users.length + 1;
    const newId = `usr-${Date.now()}`;
    const newUser = {
      id: newId,
      code: `USR-${String(nextNumber).padStart(3, '0')}`,
      lastActive: '',
      ...payload,
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`เพิ่มบัญชีผู้ใช้ ${newUser.name} (${newUser.code}) แล้ว`);
    return newId;
  };

  const handleUpdateUser = (userId, updates) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (target) {
      showToast(`บันทึกสิทธิ์การใช้งานของ ${target.name} เรียบร้อยแล้ว`);
    }
  };

  const handleToggleUserStatus = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
    showToast(
      nextStatus === 'Suspended'
        ? `ระงับสิทธิ์บัญชี ${target.name} แล้ว`
        : `เปิดใช้งานบัญชี ${target.name} แล้ว`,
      nextStatus === 'Suspended' ? 'warning' : 'success'
    );
  };

  const handleSendResetOtp = (user) => {
    showToast(`ส่งรหัส OTP ตั้งรหัสผ่านใหม่ไปยัง ${user.email} แล้ว`);
  };

  const handleResetDemo = () => {
    setSkus(INITIAL_SKUS);
    setLogs(INITIAL_AUDIT_LOGS);
    setPurchaseOrders(INITIAL_INBOUND_POS);
    setUsers(INITIAL_USERS);
    setSelectedSkuId(INITIAL_SKUS[0].id);
    setSearchQuery('');
    setStatusFilter('All');
    setZoneFilter('All Zones');
    showToast('รีเซ็ตข้อมูลคลังสินค้ากลับสู่ค่าเริ่มต้นแล้ว');
  };

  const handleLogin = (userPayload) => {
    setAuthUser(userPayload);
    try {
      if (userPayload.rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userPayload));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    showToast(`ยินดีต้อนรับ ${userPayload.operatorName}`);
  };

  const handleLogout = () => {
    setAuthUser(null);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ loggedOut: true }));
    } catch {
      // Ignore storage errors
    }
  };

  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pendingPoCount = purchaseOrders.filter((po) =>
    po.items.some((item) => !item.received)
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 lg:pb-10">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-14 lg:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('inventory');
            }}
            className="text-[18px] lg:text-[20px] font-bold tracking-[-0.02em] text-[#0B1C30] whitespace-nowrap shrink-0"
          >
            Apex Stock Engine
          </a>

          {/* Zone 2: 4 concise single-line nav links (Desktop) */}
          <nav
            aria-label="เมนูหลัก"
            className="hidden lg:flex items-center gap-7 h-full"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full px-1 text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#1E40AF] text-[#1E40AF] font-semibold'
                      : 'border-transparent text-[#444653] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                  {item.id === 'inbound' && pendingPoCount > 0 && (
                    <span className="ml-1.5 font-mono text-[11px] text-[#D97706]">
                      ({pendingPoCount})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAddSkuOpen(true)}
              className="min-h-[40px] lg:min-h-[42px] px-3.5 lg:px-4 rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>เพิ่ม SKU</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6 space-y-5">
        {/* Operator Session & Logout Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0] text-[13px]">
          <div className="text-[#444653]">
            ผู้ปฏิบัติงาน:{' '}
              {productsLoading && (
                <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded">
                  กำลังโหลดข้อมูลสินค้าจากฐานข้อมูล...
                </div>
              )}
              {productsError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded">
                  โหลดข้อมูลสินค้าไม่สำเร็จ: {productsError}
                </div>
              )}
              <span className="font-semibold text-[#0F172A]">
              {authUser.operatorName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[36px] px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-[#444653]" aria-hidden="true" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
        {activeTab === 'inventory' && (
          <>
            {/* Unified 4-Column KPI Summary Strip */}
            <section
              aria-label="สรุปภาพรวมสต็อกสินค้า"
              className="apex-card grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] ${
                  statusFilter === 'All' ? 'bg-[#EFF4FF]/60' : ''
                }`}
              >
                <span className="text-[12px] font-medium text-[#444653] block">
                  รายการ SKU ทั้งหมด
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#0F172A] tabular-nums">
                    {formatNumber(summary.totalSkus)}
                  </span>
                  <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                    รวม {formatNumber(summary.totalUnits)} หน่วย
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('In Stock')}
                className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] border-l border-[#E2E8F0] lg:border-l-0 ${
                  statusFilter === 'In Stock' ? 'bg-[#ECFDF5]/60' : ''
                }`}
              >
                <span className="text-[12px] font-medium text-[#444653] block">
                  สต็อกปกติ (พร้อมจ่าย)
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#059669] tabular-nums">
                    {formatNumber(summary.inStock)}
                  </span>
                  <span className="text-[11px] font-medium text-[#065F46]">
                    เพียงพอ
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Low Stock')}
                className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] ${
                  statusFilter === 'Low Stock' ? 'bg-[#FFFBEB]/80' : ''
                }`}
              >
                <span className="text-[12px] font-medium text-[#444653] block">
                  แจ้งเตือนสต็อกต่ำ
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#D97706] tabular-nums">
                    {formatNumber(summary.lowStock)}
                  </span>
                  <span className="text-[11px] font-medium text-[#92400E]">
                    ควรสั่งซื้อเพิ่ม
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Depleted')}
                className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] border-l border-[#E2E8F0] lg:border-l-0 ${
                  statusFilter === 'Depleted' ? 'bg-[#FEF2F2]/80' : ''
                }`}
              >
                <span className="text-[12px] font-medium text-[#444653] block">
                  สินค้าหมด / ขาดสต็อก
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#DC2626] tabular-nums">
                    {formatNumber(summary.depleted)}
                  </span>
                  <span className="text-[11px] font-medium text-[#991B1B]">
                    เร่งด่วน
                  </span>
                </div>
              </button>
            </section>

            {/* Inventory Sub-View Switch: SKU List vs Zone Directory */}
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
                <button
                  type="button"
                  onClick={() => setInventorySubView('list')}
                  className={`min-h-[36px] px-3.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    inventorySubView === 'list'
                      ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                      : 'text-[#444653] hover:text-[#0F172A]'
                  }`}
                >
                  รายการสินค้า (SKU)
                </button>
                <button
                  type="button"
                  onClick={() => setInventorySubView('zones')}
                  className={`min-h-[36px] px-3.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                    inventorySubView === 'zones'
                      ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                      : 'text-[#444653] hover:text-[#0F172A]'
                  }`}
                >
                  ผังโซนตำแหน่งเก็บ
                </button>
              </div>
            </div>

            {inventorySubView === 'zones' ? (
              <LocationsView
                skus={skus}
                onSelectSkuFromLocation={(skuId) => {
                  setInventorySubView('list');
                  setSelectedSkuId(skuId);
                  if (window.innerWidth < 1024) {
                    setMobileDetailOpen(true);
                  }
                }}
              />
            ) : (
              /* 12-Column Responsive Split-Screen */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Search, Filters & SKU Directory (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Unified Barcode / SKU Search & Action Toolbar */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหา SKU, ชื่อสินค้า หรือตำแหน่ง Bin..."
                      aria-label="ค้นหา SKU, ชื่อสินค้า หรือตำแหน่งจัดเก็บ"
                      className="apex-input w-full h-[46px] pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                  </div>

                  {/* Segmented Status Filters & Zone Select */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg overflow-x-auto max-w-full">
                      {STATUS_FILTERS.map((statusItem) => (
                        <button
                          key={statusItem.id}
                          type="button"
                          onClick={() => setStatusFilter(statusItem.id)}
                          className={`min-h-[34px] px-3 py-1 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                            statusFilter === statusItem.id
                              ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                              : 'text-[#444653] hover:text-[#0F172A]'
                          }`}
                        >
                          {statusItem.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        aria-label="กรองตามโซนคลังสินค้า"
                        className="apex-input h-[38px] px-2.5 text-[12px] font-medium text-[#0F172A]"
                      >
                        <option value="All Zones">ทุกโซน</option>
                        <option value="Zone A">Zone A</option>
                        <option value="Zone B">Zone B</option>
                        <option value="Zone C">Zone C</option>
                        <option value="Zone D">Zone D</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleResetDemo}
                        title="รีเซ็ตข้อมูลคลังสินค้ากลับสู่ค่าเริ่มต้น"
                        className="min-h-[38px] px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#444653] text-[12px] font-medium inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">รีเซ็ต</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SKU Card List */}
                {filteredSkus.length === 0 ? (
                  <div className="apex-card p-8 text-center space-y-3">
                    <PackagePlus
                      className="w-8 h-8 text-[#94A3B8] mx-auto"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[15px] font-semibold text-[#0F172A]">
                        ไม่พบรายการ SKU ที่ตรงกับเงื่อนไข
                      </p>
                      <p className="text-[13px] text-[#64748B] mt-1">
                        ลองล้างคำค้นหาและตัวกรอง หรือลงทะเบียนรายการสินค้าใหม่เข้าสู่ระบบ
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('All');
                          setZoneFilter('All Zones');
                        }}
                        className="min-h-[40px] px-4 rounded border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#0F172A]"
                      >
                        ล้างตัวกรอง
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddSkuOpen(true)}
                        className="min-h-[40px] px-4 rounded bg-[#1E40AF] text-white text-[13px] font-medium"
                      >
                        เพิ่ม SKU ใหม่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSkus.map((item) => (
                      <SkuCard
                        key={item.id}
                        item={item}
                        isSelected={selectedSku?.id === item.id}
                        onSelect={handleSelectSku}
                        onQuickVerify={handleVerifyItem}
                        onQuickStep={handleQuickStep}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Instant Item Detail Panel (Desktop 5 cols) */}
              <aside className="hidden lg:block lg:col-span-5 sticky top-20">
                <StockDetailPanel
                  item={selectedSku}
                  itemLogs={selectedSkuLogs}
                  locations={locations}
                  onApplyAdjustment={handleApplyAdjustment}
                  onVerifyItem={handleVerifyItem}
                  onTransferBin={handleTransferBin}
                />
              </aside>
            </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <ReportsView
            skus={skus}
            logs={logs}
            purchaseOrders={purchaseOrders}
            users={users}
            onFilterByZone={(zoneId) => {
              setActiveTab('inventory');
              setInventorySubView('list');
              setZoneFilter(zoneId);
            }}
          />
        )}

        {activeTab === 'inbound' && (
          <InboundView
            purchaseOrders={purchaseOrders}
            onReceiveLineItem={handleReceiveLineItem}
          />
        )}

        {activeTab === 'audit' && <AuditLogView logs={logs} />}

        {activeTab === 'users' && (
          <UsersView
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onToggleUserStatus={handleToggleUserStatus}
            onSendResetOtp={handleSendResetOtp}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Dock (Thumb Zone Ergonomics) */}
      <nav
        aria-label="แถบนำทางมือถือ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#CBD5E1] h-16 px-1"
      >
        <div className="grid grid-cols-5 items-center h-full max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded transition-colors ${
                  active ? 'text-[#1E40AF] font-semibold' : 'text-[#64748B]'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] leading-tight whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Sheet Drawer for Selected SKU Adjustment */}
      <BottomSheet
        isOpen={mobileDetailOpen}
        onClose={() => setMobileDetailOpen(false)}
        title={
          selectedSku
            ? selectedSku.nameTh || selectedSku.name
            : 'ปรับปรุงยอดสต็อก'
        }
        subtitle={
          selectedSku
            ? `${selectedSku.sku} · ${selectedSku.bin}`
            : ''
        }
      >
        <StockDetailPanel
          item={selectedSku}
          itemLogs={selectedSkuLogs}
          onApplyAdjustment={(payload) => {
            handleApplyAdjustment(payload);
            setMobileDetailOpen(false);
          }}
          onVerifyItem={(id) => {
            handleVerifyItem(id);
            setMobileDetailOpen(false);
          }}
          onTransferBin={handleTransferBin}
          inDrawer
        />
      </BottomSheet>

      {/* Register New SKU Drawer/Modal */}
      <AddSkuModal
        isOpen={addSkuOpen}
        onClose={() => setAddSkuOpen(false)}
        onCreateSku={handleCreateSku}
      />

      {/* Operational Confirmation Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-50 px-4 py-3 rounded-lg apex-popover text-[13px] font-medium flex items-center gap-2 ${
            toast.tone === 'warning'
              ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
              : 'bg-[#0F172A] text-white border-[#1E293B]'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
