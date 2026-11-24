import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from 'lucide-react';

export default function ResetPasswordForm({
  email,
  onSuccessToLogin,
  onBackToOtp,
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndNumber =
    /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);
  const hasSpecialOrUpper =
    /[A-Z]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  let strengthLevel = 0;
  if (newPassword.length > 0) strengthLevel = 1;
  if (hasMinLength) strengthLevel = 2;
  if (hasMinLength && hasLetterAndNumber) strengthLevel = 3;
  if (hasMinLength && hasLetterAndNumber && hasSpecialOrUpper) strengthLevel = 4;

  const strengthText =
    strengthLevel === 0
      ? 'ยังไม่ได้กรอก'
      : strengthLevel === 1
        ? 'อ่อน'
        : strengthLevel === 2
          ? 'ปานกลาง'
          : strengthLevel === 3
            ? 'แข็งแรง'
            : 'ปลอดภัยสูง';

  const strengthColor =
    strengthLevel <= 1
      ? 'bg-[#DC2626]'
      : strengthLevel === 2
        ? 'bg-[#D97706]'
        : 'bg-[#059669]';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasMinLength) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (!hasLetterAndNumber) {
      setError('รหัสผ่านต้องประกอบด้วยตัวอักษรภาษาอังกฤษและตัวเลข');
      return;
    }
    if (!passwordsMatch) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setError('');
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="space-y-6 text-center py-2">
        <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[22px] leading-[28px] font-bold text-[#0B1C30]">
            เปลี่ยนรหัสผ่านสำเร็จ
          </h2>
          <p className="text-[14px] text-[#444653]">
            อัปเดตรหัสผ่านใหม่สำหรับบัญชี{' '}
            <span className="font-mono font-medium text-[#0F172A]">
              {email || 'somchai@apex.co.th'}
            </span>{' '}
            เรียบร้อยแล้ว
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccessToLogin}
          className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-[14px] font-semibold transition-colors"
        >
          เข้าสู่ระบบด้วยรหัสผ่านใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[#1E40AF]">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.04em]">
            ขั้นตอนที่ 2 / 2 · ตั้งรหัสผ่านใหม่
          </span>
        </div>
        <h2 className="text-[22px] leading-[28px] font-bold tracking-[-0.015em] text-[#0B1C30]">
          เปลี่ยนรหัสผ่าน
        </h2>
        <p className="text-[14px] text-[#444653]">
          กำหนดรหัสผ่านใหม่สำหรับ{' '}
          <span className="font-mono font-medium text-[#0F172A]">
            {email || 'somchai@apex.co.th'}
          </span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reset-new-password"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            รหัสผ่านใหม่
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="reset-new-password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="อย่างน้อย 8 ตัวอักษร (ตัวอักษร + ตัวเลข)"
              className="apex-input w-full h-[46px] pl-9 pr-11 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              aria-label={showNew ? 'ซ่อนรหัสผ่านใหม่' : 'แสดงรหัสผ่านใหม่'}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 4-segment Password Strength Gauge */}
          <div className="mt-2 space-y-1.5">
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 rounded-full transition-colors ${
                    strengthLevel >= level ? strengthColor : 'bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#64748B]">ความปลอดภัยรหัสผ่าน</span>
              <span className="font-medium text-[#0F172A]">{strengthText}</span>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="reset-confirm-password"
            className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
          >
            ยืนยันรหัสผ่านใหม่
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="reset-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              className="apex-input w-full h-[46px] pl-9 pr-11 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? 'ซ่อนยืนยันรหัสผ่าน' : 'แสดงยืนยันรหัสผ่าน'}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Policy Checklist */}
        <ul className="space-y-1.5 pt-1 text-[12px]">
          <li
            className={`flex items-center gap-2 ${
              hasMinLength ? 'text-[#059669] font-medium' : 'text-[#64748B]'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>มีความยาวอย่างน้อย 8 ตัวอักษร</span>
          </li>
          <li
            className={`flex items-center gap-2 ${
              hasLetterAndNumber ? 'text-[#059669] font-medium' : 'text-[#64748B]'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>ประกอบด้วยตัวอักษรภาษาอังกฤษและตัวเลข</span>
          </li>
          <li
            className={`flex items-center gap-2 ${
              passwordsMatch ? 'text-[#059669] font-medium' : 'text-[#64748B]'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>รหัสผ่านใหม่ทั้งสองช่องตรงกัน</span>
          </li>
        </ul>

        <div className="space-y-2.5 pt-1">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[14px] font-semibold transition-colors"
          >
            บันทึกรหัสผ่านใหม่
          </button>

          <button
            type="button"
            onClick={onBackToOtp}
            className="w-full min-h-[44px] rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>ย้อนกลับไปหน้ากรอก OTP</span>
          </button>
        </div>
      </form>
    </div>
  );
}
