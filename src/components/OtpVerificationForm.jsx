import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

export default function OtpVerificationForm({
  email,
  onEmailChange,
  onVerified,
  onBackToLogin,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(59);
  const [editingEmail, setEditingEmail] = useState(false);
  const [error, setError] = useState('');
  const [resentNotice, setResentNotice] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = [...digits];
      for (let i = 0; i < 6 - index && i < clean.length; i += 1) {
        next[index + i] = clean[i];
      }
      setDigits(next);
      const focusIdx = Math.min(5, index + clean.length);
      inputRefs.current[focusIdx]?.focus();
      if (error) setError('');
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (error) setError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    if (error) setError('');
    const focusIdx = Math.min(5, pasted.length);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = () => {
    setCountdown(59);
    setResentNotice(true);
    setError('');
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleFillDemoOtp = () => {
    setDigits(['4', '8', '2', '9', '1', '0']);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('กรุณากรอกรหัส OTP ให้ครบทั้ง 6 หลัก');
      return;
    }
    setError('');
    onVerified(code);
  };

  const formattedCountdown = `00:${String(countdown).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[#1E40AF]">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.04em]">
            ขั้นตอนที่ 1 / 2 · ยืนยันตัวตน
          </span>
        </div>
        <h2 className="text-[22px] leading-[28px] font-bold tracking-[-0.015em] text-[#0B1C30]">
          กรอกรหัสยืนยัน OTP
        </h2>
        <p className="text-[14px] text-[#444653]">
          ระบบได้ส่งรหัส OTP 6 หลักไปยัง{' '}
          <span className="font-mono font-medium text-[#0F172A]">
            {email || 'somchai@apex.co.th'}
          </span>{' '}
          <button
            type="button"
            onClick={() => setEditingEmail((prev) => !prev)}
            className="text-[#1E40AF] hover:underline font-medium text-[13px]"
          >
            {editingEmail ? 'เสร็จสิ้น' : 'เปลี่ยนอีเมล'}
          </button>
        </p>
      </div>

      {editingEmail && (
        <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
          <label
            htmlFor="otp-target-email"
            className="block text-[12px] font-medium text-[#444653]"
          >
            อีเมลสำหรับรับรหัส OTP
          </label>
          <input
            id="otp-target-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="somchai@apex.co.th"
            className="apex-input w-full h-[42px] px-3 text-[13px] text-[#0F172A]"
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {resentNotice && !error && (
        <div
          role="status"
          className="p-3 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[13px] font-medium"
        >
          ส่งรหัส OTP รอบใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว (รหัสอ้างอิง REF-9024)
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#0F172A]">
              รหัสยืนยัน 6 หลัก
            </span>
            <button
              type="button"
              onClick={handleFillDemoOtp}
              className="text-[12px] font-medium text-[#1E40AF] hover:underline"
            >
              กรอกรหัสสาธิต (482910)
            </button>
          </div>

          <div
            className="grid grid-cols-6 gap-2 sm:gap-2.5"
            onPaste={handlePaste}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`รหัส OTP หลักที่ ${index + 1}`}
                className="apex-input w-full h-12 sm:h-14 text-center font-mono text-[22px] font-bold text-[#0F172A] tabular-nums"
              />
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#64748B]">
            <span className="font-mono">รหัสอ้างอิง: REF-8492</span>
            {countdown > 0 ? (
              <span className="font-mono tabular-nums">
                ส่งรหัสใหม่ได้ใน {formattedCountdown}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1 text-[#1E40AF] hover:underline font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ส่งรหัส OTP อีกครั้ง</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#00288E] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>ยืนยันรหัส OTP</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full min-h-[44px] rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
