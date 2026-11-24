import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Search,
  Shield,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react';
import BottomSheet from './BottomSheet.jsx';
import { ROLE_DEFAULT_PERMISSIONS, USER_ROLES } from '../data/initialUsers.js';
import { formatNumber, formatTimestamp } from '../utils/stockHelpers.js';

const USER_STATUS_FILTERS = [
  { id: 'All', label: 'ทั้งหมด' },
  { id: 'Active', label: 'ใช้งานอยู่' },
  { id: 'Pending', label: 'รอเปิดใช้งาน' },
  { id: 'Suspended', label: 'ระงับสิทธิ์' },
];

const USER_STATUS_META = {
  Active: {
    label: 'ใช้งานอยู่',
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#065F46]',
    border: 'border-[#A7F3D0]',
    Icon: CheckCircle2,
  },
  Pending: {
    label: 'รอเปิดใช้งาน',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
    Icon: AlertTriangle,
  },
  Suspended: {
    label: 'ระงับสิทธิ์',
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
    Icon: XCircle,
  },
};

const ALL_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

const PERMISSION_LABELS = [
  { key: 'adjustStock', label: 'ปรับปรุงและยืนยันยอดสต็อก' },
  { key: 'receiveInbound', label: 'ตรวจรับสินค้าเข้าคลัง (Inbound)' },
  { key: 'exportCsv', label: 'ส่งออกรายงานประวัติ CSV' },
  { key: 'manageUsers', label: 'จัดการบัญชีและสิทธิ์ผู้ใช้งาน' },
];

function UserStatusBadge({ status }) {
  const meta = USER_STATUS_META[status] || USER_STATUS_META.Active;
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap shrink-0 ${meta.bg} ${meta.text} ${meta.border}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

function UserDetailPanel({
  user,
  onSaveUser,
  onToggleStatus,
  onSendResetOtp,
  inDrawer = false,
}) {
  const [role, setRole] = useState(user?.role || USER_ROLES[0]);
  const [zones, setZones] = useState(user?.zones || []);
  const [permissions, setPermissions] = useState(
    user?.permissions || ROLE_DEFAULT_PERMISSIONS[USER_ROLES[0]]
  );

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setZones(user.zones);
    setPermissions(user.permissions);
  }, [user?.id, user?.role, user?.status]);

  if (!user) {
    return (
      <div className="apex-card p-6 text-center text-[#64748B]">
        <p className="text-[14px] font-medium text-[#0F172A]">
          เลือกผู้ใช้งานจากรายการ
        </p>
        <p className="text-[13px] mt-1">
          คลิกที่ผู้ใช้งานทางซ้ายเพื่อแก้ไขบทบาท โซนรับผิดชอบ และสิทธิ์การเข้าถึง
        </p>
      </div>
    );
  }

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    if (ROLE_DEFAULT_PERMISSIONS[nextRole]) {
      setPermissions({ ...ROLE_DEFAULT_PERMISSIONS[nextRole] });
    }
  };

  const toggleZone = (zoneName) => {
    setZones((prev) =>
      prev.includes(zoneName)
        ? prev.filter((z) => z !== zoneName)
        : [...prev, zoneName]
    );
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveUser(user.id, {
      role,
      zones: zones.length > 0 ? zones : ['Zone A'],
      permissions,
    });
  };

  const isSuspended = user.status === 'Suspended';

  return (
    <div className={inDrawer ? 'p-4 space-y-5' : 'apex-card p-5 space-y-5'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-medium text-[#1E40AF]">
            {user.code} · {user.role}
          </div>
          <h3 className="text-[18px] leading-[24px] font-semibold text-[#0B1C30] mt-0.5">
            {user.name}
          </h3>
          <p className="font-mono text-[12px] text-[#444653] mt-0.5 truncate">
            {user.email}
          </p>
        </div>
        <UserStatusBadge status={user.status} />
      </div>

      {/* Activity Info */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0] text-[13px]">
        <div>
          <span className="text-[#64748B] block text-[11px]">
            เข้าใช้งานล่าสุด
          </span>
          <span className="font-mono text-[12px] text-[#0F172A] mt-0.5 block">
            {user.lastActive ? formatTimestamp(user.lastActive) : 'ยังไม่เคยเข้าใช้'}
          </span>
        </div>
        <div>
          <span className="text-[#64748B] block text-[11px]">
            โซนที่รับผิดชอบ
          </span>
          <span className="font-mono text-[12px] font-medium text-[#0F172A] mt-0.5 block">
            {user.zones.length === 4 ? 'ทุกโซน (A–D)' : user.zones.join(', ')}
          </span>
        </div>
      </div>

      {/* Role & Permissions Editor */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#E2E8F0]">
        <div>
          <label
            htmlFor={`user-role-${user.id}`}
            className="block text-[12px] font-semibold text-[#0F172A] mb-1.5"
          >
            บทบาทหน้าที่ (Role)
          </label>
          <select
            id={`user-role-${user.id}`}
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="apex-input w-full h-[44px] px-3 text-[13px] text-[#0F172A]"
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-[12px] font-semibold text-[#0F172A] mb-1.5">
            โซนคลังสินค้าที่เข้าถึงได้
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_ZONES.map((z) => {
              const active = zones.includes(z);
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => toggleZone(z)}
                  className={`min-h-[40px] px-2 rounded border font-mono text-[12px] font-medium transition-colors ${
                    active
                      ? 'bg-[#EFF4FF] border-[#1E40AF] text-[#1E40AF] font-semibold'
                      : 'bg-white border-[#CBD5E1] text-[#444653] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {z}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-[12px] font-semibold text-[#0F172A] mb-1.5">
            สิทธิ์การดำเนินการในระบบ
          </span>
          <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-md bg-white">
            {PERMISSION_LABELS.map((perm) => (
              <label
                key={perm.key}
                className="min-h-[42px] px-3 py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FAFC]"
              >
                <span className="text-[13px] text-[#0F172A]">{perm.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(permissions[perm.key])}
                  onChange={() => togglePermission(perm.key)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E40AF] focus:ring-[#1E40AF]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[14px] font-semibold transition-colors"
          >
            บันทึกการเปลี่ยนแปลงสิทธิ์
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSendResetOtp(user)}
              className="min-h-[44px] px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#1E40AF]" aria-hidden="true" />
              <span>ส่งลิงก์ตั้งรหัสใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(user.id)}
              className={`min-h-[44px] px-3 rounded border text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                isSuspended
                  ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]'
                  : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'
              }`}
            >
              {isSuspended ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>เปิดใช้งานบัญชี</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ระงับการใช้งาน</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function UsersView({
  users,
  onCreateUser,
  onUpdateUser,
  onToggleUserStatus,
  onSendResetOtp,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add User Modal Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('เจ้าหน้าที่คลังสินค้า');
  const [newZones, setNewZones] = useState(['Zone A', 'Zone C']);
  const [newStatus, setNewStatus] = useState('Active');
  const [formError, setFormError] = useState('');

  const summary = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;
    users.forEach((u) => {
      if (u.status === 'Active') active += 1;
      else if (u.status === 'Pending') pending += 1;
      else suspended += 1;
    });
    return { total: users.length, active, pending, suspended };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      if (roleFilter !== 'All Roles' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || users[0] || null,
    [users, selectedUserId]
  );

  const handleSelectUser = (userId, openMobile = false) => {
    setSelectedUserId(userId);
    if (openMobile || window.innerWidth < 1024) {
      setMobileDrawerOpen(true);
    }
  };

  const handleToggleNewZone = (zoneName) => {
    setNewZones((prev) =>
      prev.includes(zoneName)
        ? prev.filter((z) => z !== zoneName)
        : [...prev, zoneName]
    );
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุล และอีเมลผู้ใช้งาน');
      return;
    }
    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      setFormError('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง');
      return;
    }

    const createdId = onCreateUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      zones: newZones.length > 0 ? newZones : ['Zone A'],
      status: newStatus,
      permissions: { ...(ROLE_DEFAULT_PERMISSIONS[newRole] || {}) },
    });

    if (createdId) {
      setSelectedUserId(createdId);
    }
    setNewName('');
    setNewEmail('');
    setNewRole('เจ้าหน้าที่คลังสินค้า');
    setNewZones(['Zone A', 'Zone C']);
    setNewStatus('Active');
    setFormError('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0B1C30]">
            การจัดการผู้ใช้งานและสิทธิ์การเข้าถึง
          </h2>
          <p className="text-[13px] text-[#444653] mt-0.5">
            กำหนดบทบาทเจ้าหน้าที่คลังสินค้า โซนที่รับผิดชอบ และควบคุมสถานะบัญชีผู้ใช้งาน
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="min-h-[44px] px-4 rounded bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span>เพิ่มผู้ใช้ใหม่</span>
        </button>
      </div>

      {/* Unified 4-Column User Summary Strip */}
      <section
        aria-label="สรุปสถานะผู้ใช้งาน"
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
            ผู้ใช้งานทั้งหมด
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#0F172A] tabular-nums">
              {formatNumber(summary.total)}
            </span>
            <span className="text-[11px] text-[#64748B]">บัญชี</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Active')}
          className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] border-l border-[#E2E8F0] lg:border-l-0 ${
            statusFilter === 'Active' ? 'bg-[#ECFDF5]/60' : ''
          }`}
        >
          <span className="text-[12px] font-medium text-[#444653] block">
            กำลังใช้งาน (Active)
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#059669] tabular-nums">
              {formatNumber(summary.active)}
            </span>
            <span className="text-[11px] font-medium text-[#065F46]">ปกติ</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending')}
          className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] ${
            statusFilter === 'Pending' ? 'bg-[#FFFBEB]/80' : ''
          }`}
        >
          <span className="text-[12px] font-medium text-[#444653] block">
            รอเปิดใช้งาน
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#D97706] tabular-nums">
              {formatNumber(summary.pending)}
            </span>
            <span className="text-[11px] font-medium text-[#92400E]">รอยืนยัน</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Suspended')}
          className={`p-3.5 lg:p-4 text-left transition-colors hover:bg-[#F8FAFC] border-l border-[#E2E8F0] lg:border-l-0 ${
            statusFilter === 'Suspended' ? 'bg-[#FEF2F2]/80' : ''
          }`}
        >
          <span className="text-[12px] font-medium text-[#444653] block">
            ระงับสิทธิ์ใช้งาน
          </span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[22px] lg:text-[24px] font-bold text-[#DC2626] tabular-nums">
              {formatNumber(summary.suspended)}
            </span>
            <span className="text-[11px] font-medium text-[#991B1B]">ปิดสิทธิ์</span>
          </div>
        </button>
      </section>

      {/* 12-Column Responsive Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search, Filters & User Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
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
                placeholder="ค้นหาชื่อ, อีเมล, รหัสผู้ใช้ หรือบทบาท..."
                aria-label="ค้นหาผู้ใช้งาน"
                className="apex-input w-full h-[46px] pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg overflow-x-auto max-w-full">
                {USER_STATUS_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-md text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                      statusFilter === item.id
                        ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                        : 'text-[#444653] hover:text-[#0F172A]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="กรองตามบทบาท"
                className="apex-input h-[38px] px-2.5 text-[12px] font-medium text-[#0F172A]"
              >
                <option value="All Roles">ทุกบทบาท</option>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="apex-card p-8 text-center space-y-3">
              <Shield className="w-8 h-8 text-[#94A3B8] mx-auto" aria-hidden="true" />
              <div>
                <p className="text-[15px] font-semibold text-[#0F172A]">
                  ไม่พบบัญชีผู้ใช้งานที่ตรงกับเงื่อนไข
                </p>
                <p className="text-[13px] text-[#64748B] mt-1">
                  ลองล้างคำค้นหาหรือเพิ่มบัญชีผู้ใช้งานใหม่เข้าสู่ระบบ
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setRoleFilter('All Roles');
                }}
                className="min-h-[40px] px-4 rounded border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#0F172A]"
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const isSuspended = user.status === 'Suspended';
                return (
                  <article
                    key={user.id}
                    className={`apex-card transition-colors duration-150 ${
                      isSelected
                        ? 'border-[#1E40AF] ring-1 ring-[#1E40AF] bg-[#EFF4FF]/45'
                        : 'hover:border-[#94A3B8]'
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectUser(user.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectUser(user.id);
                        }
                      }}
                      className="w-full text-left p-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1E40AF] rounded-t-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[16px] leading-[22px] font-semibold text-[#0B1C30] truncate">
                            {user.name}
                          </h3>
                          <p className="font-mono text-[12px] text-[#444653] truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <UserStatusBadge status={user.status} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[12px] text-[#444653]">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-[#0F172A]">
                            {user.code}
                          </span>
                          <span aria-hidden="true" className="text-[#94A3B8]">
                            ·
                          </span>
                          <span className="font-sans font-medium text-[#1E40AF]">
                            {user.role}
                          </span>
                          <span aria-hidden="true" className="text-[#94A3B8]">
                            ·
                          </span>
                          <span>
                            {user.zones.length === 4
                              ? 'ทุกโซน (A–D)'
                              : user.zones.join(', ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {user.lastActive
                            ? `ล่าสุด ${formatTimestamp(user.lastActive)}`
                            : 'รอเข้าสู่ระบบครั้งแรก'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-[#E2E8F0] bg-[#F8FAFC]/70 rounded-b-lg">
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(user.id)}
                        className={`min-h-[40px] px-3 rounded border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                          isSuspended
                            ? 'border-[#A7F3D0] bg-white text-[#065F46] hover:bg-[#ECFDF5]'
                            : 'border-[#CBD5E1] bg-white text-[#444653] hover:bg-[#FEF2F2] hover:text-[#991B1B] hover:border-[#FECACA]'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>เปิดใช้งาน</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>ระงับสิทธิ์</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectUser(user.id, true)}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded bg-[#1E40AF] text-white text-[12px] font-medium hover:bg-[#1E3A8A] transition-colors whitespace-nowrap"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>จัดการสิทธิ์</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: User Permission Editor (Desktop) */}
        <aside className="hidden lg:block lg:col-span-5 sticky top-20">
          <UserDetailPanel
            user={selectedUser}
            onSaveUser={onUpdateUser}
            onToggleStatus={onToggleUserStatus}
            onSendResetOtp={onSendResetOtp}
          />
        </aside>
      </div>

      {/* Mobile Bottom Sheet for User Detail */}
      <BottomSheet
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title={selectedUser ? selectedUser.name : 'จัดการสิทธิ์ผู้ใช้'}
        subtitle={
          selectedUser ? `${selectedUser.code} · ${selectedUser.email}` : ''
        }
      >
        <UserDetailPanel
          user={selectedUser}
          onSaveUser={(id, updates) => {
            onUpdateUser(id, updates);
            setMobileDrawerOpen(false);
          }}
          onToggleStatus={(id) => {
            onToggleUserStatus(id);
            setMobileDrawerOpen(false);
          }}
          onSendResetOtp={onSendResetOtp}
          inDrawer
        />
      </BottomSheet>

      {/* Add User Modal / Bottom Sheet */}
      <BottomSheet
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="เพิ่มผู้ใช้งานใหม่"
        subtitle="สร้างบัญชีและกำหนดสิทธิ์เข้าใช้งานคลังสินค้า"
      >
        <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="เช่น วีระชัย สุขสม"
              className="apex-input w-full h-[44px] px-3 text-[14px] text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#444653] mb-1">
              อีเมล *
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="เช่น weerachai@apex.co.th"
              className="apex-input w-full h-[44px] px-3 text-[14px] text-[#0F172A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#444653] mb-1">
                บทบาทหน้าที่
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="apex-input w-full h-[44px] px-2.5 text-[13px] text-[#0F172A]"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#444653] mb-1">
                สถานะเริ่มต้น
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="apex-input w-full h-[44px] px-2.5 text-[13px] text-[#0F172A]"
              >
                <option value="Active">ใช้งานอยู่</option>
                <option value="Pending">รอเปิดใช้งาน</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-[#444653] mb-1.5">
              โซนคลังสินค้าที่รับผิดชอบ
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_ZONES.map((z) => {
                const active = newZones.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => handleToggleNewZone(z)}
                    className={`min-h-[40px] px-2 rounded border font-mono text-[12px] font-medium transition-colors ${
                      active
                        ? 'bg-[#EFF4FF] border-[#1E40AF] text-[#1E40AF] font-semibold'
                        : 'bg-white border-[#CBD5E1] text-[#444653]'
                    }`}
                  >
                    {z}
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="text-[12px] text-[#DC2626] font-medium">{formError}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-[14px] font-semibold transition-colors"
            >
              บันทึกผู้ใช้งานใหม่
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
