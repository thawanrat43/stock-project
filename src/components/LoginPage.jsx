import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import OtpVerificationForm from './OtpVerificationForm.jsx';
import ResetPasswordForm from './ResetPasswordForm.jsx';

const AUTH_MODES = [
  { id: 'login', label: 'เข้าสู่ระบบ' },
  { id: 'otp', label: 'กรอก OTP' },
  { id: 'reset', label: 'เปลี่ยนรหัสผ่าน' },
];

export default function LoginPage({ onLogin }) {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('somchai@apex.co.th');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail) {
      setError('กรุณากรอกอีเมลผู้ใช้งาน');
      return;
    }
    if (!cleanedEmail.includes('@') || !cleanedEmail.includes('.')) {
      setError('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง');
      return;
    }
    if (password.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setError('');
    onLogin({
      operatorName: cleanedEmail,
      rememberMe,
    });
  };

  const handleDemoAccess = () => {
    setError('');
    onLogin({
      operatorName: 'สมชาย ก. (หัวหน้าคลังสินค้า)',
      rememberMe: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand & Operational Overview Panel (Desktop) */}
      <aside className="lg:col-span-5 bg-[#00288E] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
        <div>
          <div className="text-[20px] font-bold tracking-[-0.02em] text-white">
            Apex Stock Engine
          </div>

          <div className="mt-10 lg:mt-16 max-w-md space-y-4">
            <h1 className="text-[26px] lg:text-[32px] leading-[1.25] font-bold tracking-[-0.015em] text-white [text-wrap:balance]">
              ระบบบริหารจัดการสต็อกและคลังสินค้าองค์กร
            </h1>
            <p className="text-[15px] leading-[24px] text-[#DCE9FF]">
              ตรวจสอบยอดคงเหลือ จัดการตำแหน่งจัดเก็บ และบันทึกประวัติการตรวจนับสินค้าได้อย่างแม่นยำทั้งบนมือถือหน้างานและเดสก์ท็อป
            </p>
          </div>
        </div>

        <div className="hidden lg:block pt-10 border-t border-white/15">
          <dl className="divide-y divide-white/15 text-[13px]">
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#A8B8FF]">โครงสร้างคลังสินค้า</dt>
              <dd className="font-mono font-medium text-white">Zone A – Zone D</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#A8B8FF]">การติดตามยอด</dt>
              <dd className="font-medium text-white">รับเข้า · ปรับยอด · ย้าย Bin</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-[#A8B8FF]">การยืนยันความปลอดภัย</dt>
              <dd className="font-medium text-white">รหัส OTP 6 หลัก &amp; เปลี่ยนรหัสผ่าน</dd>
            </div>
          </dl>
        </div>
      </aside>

      {/* Right Auth Form Canvas */}
      <main className="lg:col-span-7 flex flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px] space-y-4">
          {/* Segmented Auth Screen Switcher */}
          <div
            role="tablist"
            aria-label="สลับหน้าจอยืนยันตัวตน"
            className="grid grid-cols-3 gap-1 p-1 bg-[#E2E8F0]/70 rounded-lg"
          >
            {AUTH_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={authMode === mode.id}
                onClick={() => {
                  setAuthMode(mode.id);
                  setError('');
                }}
                className={`min-h-[38px] px-2 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap truncate ${
                  authMode === mode.id
                    ? 'bg-white text-[#1E40AF] font-semibold shadow-xs'
                    : 'text-[#444653] hover:text-[#0F172A]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="apex-card p-6 sm:p-8">
            {authMode === 'login' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-[22px] leading-[28px] font-bold tracking-[-0.015em] text-[#0B1C30]">
                    เข้าสู่ระบบปฏิบัติการ
                  </h2>
                  <p className="text-[14px] text-[#444653]">
                    ลงชื่อเข้าใช้ด้วยอีเมลและรหัสผ่านของคุณ
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
                      htmlFor="login-email"
                      className="block text-[13px] font-medium text-[#0F172A] mb-1.5"
                    >
                      อีเมล
                    </label>
                    <div className="relative">
                      <Mail
                        className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="เช่น somchai@apex.co.th"
                        className="apex-input w-full h-[46px] pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block text-[13px] font-medium text-[#0F172A]"
                      >
                        รหัสผ่าน
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setAuthMode('otp');
                        }}
                        className="text-[12px] font-medium text-[#1E40AF] hover:underline"
                      >
                        ลืมรหัสผ่าน / เปลี่ยนรหัสผ่าน?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
                        className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="กรอกรหัสผ่านอย่างน้อย 4 ตัวอักษร"
                        className="apex-input w-full h-[46px] pl-9 pr-11 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="min-h-[40px] flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E40AF] focus:ring-[#1E40AF]"
                    />
                    <span className="text-[13px] text-[#444653]">
                      จดจำการเข้าสู่ระบบบนอุปกรณ์นี้
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>

                <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
                  <div className="text-[12px] text-[#64748B] text-center">
                    หรือเข้าดูระบบคลังสินค้าทันทีด้วยบัญชีสาธิต
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoAccess}
                    className="w-full min-h-[44px] px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-medium transition-colors"
                  >
                    เข้าใช้งานด่วน (หัวหน้าคลังสินค้า)
                  </button>
                </div>
              </div>
            )}

            {authMode === 'otp' && (
              <OtpVerificationForm
                email={email}
                onEmailChange={setEmail}
                onVerified={() => setAuthMode('reset')}
                onBackToLogin={() => setAuthMode('login')}
              />
            )}

            {authMode === 'reset' && (
              <ResetPasswordForm
                email={email}
                onSuccessToLogin={() => {
                  setPassword('');
                  setAuthMode('login');
                }}
                onBackToOtp={() => setAuthMode('otp')}
              />
            )}
          </div>

          <p className="text-center text-[12px] text-[#64748B]">
            Apex Stock Engine · ระบบจัดการคลังสินค้าภายในองค์กร
          </p>
        </div>
      </main>
    </div>
  );
}
