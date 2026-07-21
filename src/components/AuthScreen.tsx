import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  MessageSquareText,
  Phone,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { ApiError, apiClient, isValidJordanPhone, normalizeJordanPhone, type OtpChallenge } from '../services/apiClient';
import type { AppProfile, AuthIntent } from '../types';
import { cleanSingleLineText, formatCountdown, isValidFullName, secondsUntil } from '../validation';

interface AuthScreenProps {
  onAuthenticated: (profile: AppProfile) => void;
}

const RESEND_COOLDOWN_SECONDS = 60;
const maskPhone = (phone: string): string => phone.length < 8 ? phone : `${phone.slice(0, 5)} ••• ${phone.slice(-3)}`;

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [intent, setIntent] = useState<AuthIntent>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendLeft, setResendLeft] = useState(0);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const normalizedPhone = useMemo(() => normalizeJordanPhone(phone), [phone]);
  const cleanName = useMemo(() => cleanSingleLineText(fullName, 100), [fullName]);
  const validPhone = isValidJordanPhone(phone);
  const validSignup = intent === 'login' || (isValidFullName(cleanName) && acceptedTerms);
  const expired = step === 'otp' && secondsLeft <= 0;

  useEffect(() => {
    if (step !== 'otp' || !challenge) return undefined;
    const update = () => {
      setSecondsLeft(secondsUntil(challenge.expiresAt));
      setResendLeft(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendAvailableAt, step]);

  const resetFlow = (nextIntent = intent) => {
    if (busy) return;
    setIntent(nextIntent);
    setStep('details');
    setChallenge(null);
    setOtpCode('');
    setSecondsLeft(0);
    setResendLeft(0);
    setResendAvailableAt(0);
    setError('');
  };

  const changeIntent = (next: AuthIntent) => {
    if (next === intent && step === 'details') return;
    resetFlow(next);
  };

  const requestOtp = async (event?: FormEvent<HTMLFormElement>, isResend = false) => {
    event?.preventDefault();
    setError('');
    if (!validPhone) {
      setError('أدخل رقم هاتف أردني صحيح.');
      return;
    }
    if (intent === 'signup' && !isValidFullName(cleanName)) {
      setError('أدخل اسمك الكامل بشكل صحيح.');
      return;
    }
    if (intent === 'signup' && !acceptedTerms) {
      setError('وافق على الشروط وسياسة الخصوصية لإكمال إنشاء الحساب.');
      return;
    }
    if (isResend && resendLeft > 0) {
      setError(`يمكنك إعادة طلب الرمز بعد ${resendLeft} ثانية.`);
      return;
    }

    setBusy(true);
    try {
      const next = await apiClient.requestPhoneOtp(phone, intent);
      setPhone(next.phone);
      setChallenge(next);
      setOtpCode('');
      setSecondsLeft(secondsUntil(next.expiresAt));
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setResendLeft(RESEND_COOLDOWN_SECONDS);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر طلب الرمز.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!challenge) {
      setStep('details');
      return;
    }
    if (expired) {
      setError('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.');
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setError('أدخل رمز التحقق المكوّن من 6 أرقام.');
      return;
    }

    setBusy(true);
    try {
      const result = await apiClient.verifyPhoneOtp(challenge, otpCode, cleanName);
      onAuthenticated(result.profile);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.code === 'ACCOUNT_NOT_FOUND') {
        setError('هذا الرقم غير مسجل. اختر إنشاء حساب جديد بنفس الرقم.');
      } else if (apiError?.code === 'ACCOUNT_EXISTS') {
        setError('هذا الرقم مسجل مسبقًا. اختر تسجيل الدخول.');
      } else {
        setError(err instanceof Error ? err.message : 'تعذر التحقق من الرمز.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page" dir="rtl">
      <div className="lattice" aria-hidden="true" />
      <section className="auth-card screen-enter auth-choice-card" key={`${intent}-${step}`}>
        <header className="brand">
          <div className="logo-circle"><img src="/safretak-logo.svg" alt="شعار سفرتك" className="app-logo" /></div>
          <h1>سفرتك</h1>
          <p>منصة السفر والسياحة الأردنية</p>
        </header>

        <div className="auth-switch" role="tablist" aria-label="اختيار نوع الدخول">
          <button type="button" role="tab" aria-selected={intent === 'login'} className={intent === 'login' ? 'active' : ''} onClick={() => changeIntent('login')} disabled={busy}>
            <LogIn size={16} />تسجيل الدخول
          </button>
          <button type="button" role="tab" aria-selected={intent === 'signup'} className={intent === 'signup' ? 'active' : ''} onClick={() => changeIntent('signup')} disabled={busy}>
            <UserPlus size={16} />إنشاء حساب
          </button>
        </div>

        <div className="login-heading">
          {step === 'otp' ? <MessageSquareText size={22} /> : intent === 'signup' ? <UserPlus size={22} /> : <ShieldCheck size={22} />}
          <div>
            <h2>{step === 'otp' ? (intent === 'signup' ? 'تأكيد إنشاء الحساب' : 'تأكيد تسجيل الدخول') : intent === 'signup' ? 'إنشاء حساب مسافر' : 'أهلًا بعودتك'}</h2>
            <p>{step === 'otp' ? 'أدخل رمز التحقق المرسل إلى رقمك.' : intent === 'signup' ? 'أدخل اسمك ورقم هاتفك لإنشاء حساب جديد.' : 'أدخل رقم هاتف حسابك للمتابعة.'}</p>
          </div>
        </div>

        {step === 'details' ? (
          <form className="form-area" onSubmit={(event) => requestOtp(event)} noValidate>
            {intent === 'signup' ? (
              <label className="field-group">
                <span>الاسم الكامل</span>
                <div className="input-box">
                  <input value={fullName} onChange={(event) => setFullName(event.target.value.normalize('NFKC').slice(0, 100))} placeholder="الاسم كما سيظهر في الحجوزات" autoComplete="name" maxLength={100} disabled={busy} aria-invalid={Boolean(fullName) && !isValidFullName(cleanName)} />
                  <UserRound size={17} />
                </div>
              </label>
            ) : null}

            <label className="field-group">
              <span>رقم الهاتف</span>
              <div className="phone-row">
                <div className="country-box" aria-hidden="true"><span>JO</span><strong>+962</strong></div>
                <div className="input-box phone-input">
                  <input type="tel" inputMode="tel" autoComplete="tel-national" name="phone" value={phone} onChange={(event) => setPhone(event.target.value.normalize('NFKC').replace(/[^+\d\s()-]/g, '').slice(0, 18))} placeholder="07XXXXXXXX" disabled={busy} dir="ltr" maxLength={18} aria-invalid={Boolean(phone) && !validPhone} />
                  <Phone size={17} />
                </div>
              </div>
            </label>

            {intent === 'signup' ? (
              <label className="terms-check">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} disabled={busy} />
                <span>أوافق على شروط الاستخدام وسياسة الخصوصية.</span>
              </label>
            ) : null}

            {error ? <div className="login-alert" role="alert">{error}</div> : null}
            <button type="submit" className="gold-button" disabled={busy || !validPhone || !validSignup}>
              {busy ? <Loader2 className="spin" size={17} /> : intent === 'signup' ? <UserPlus size={17} /> : <LogIn size={17} />}
              {intent === 'signup' ? 'إرسال رمز إنشاء الحساب' : 'إرسال رمز الدخول'}
            </button>
          </form>
        ) : (
          <form className="form-area" onSubmit={verify} noValidate>
            <div className="otp-phone">{maskPhone(challenge?.phone || normalizedPhone)}</div>
            <label className="field-group">
              <span>رمز التحقق</span>
              <div className="input-box otp-input">
                <input type="text" inputMode="numeric" autoComplete="one-time-code" name="otp" value={otpCode} onChange={(event) => setOtpCode(event.target.value.normalize('NFKC').replace(/\D/g, '').slice(0, 6))} placeholder="••••••" disabled={busy || expired} dir="ltr" maxLength={6} autoFocus aria-invalid={Boolean(error)} />
                <MessageSquareText size={17} />
              </div>
            </label>
            <div className={`mode-note ${expired ? 'expired' : ''}`} aria-live="polite">
              {expired ? <RotateCcw size={14} /> : <Clock3 size={14} />}
              <span>{expired ? 'انتهت صلاحية الرمز.' : `صلاحية الرمز ${formatCountdown(secondsLeft)}`}</span>
            </div>
            {error ? <div className="login-alert" role="alert">{error}</div> : null}
            <button type="submit" className="gold-button" disabled={busy || expired || otpCode.length !== 6}>
              {busy ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}
              {intent === 'signup' ? 'إنشاء الحساب والدخول' : 'تأكيد الدخول'}
            </button>
            <div className="otp-actions">
              <button type="button" onClick={() => requestOtp(undefined, true)} disabled={busy || resendLeft > 0}><RotateCcw size={14} />{resendLeft > 0 ? `إعادة الإرسال (${resendLeft})` : 'إعادة طلب الرمز'}</button>
              <button type="button" onClick={() => resetFlow(intent)} disabled={busy}><ArrowRight size={14} />تعديل البيانات</button>
            </div>
            {error.includes('غير مسجل') ? <button type="button" className="inline-auth-link" onClick={() => changeIntent('signup')}>إنشاء حساب جديد بهذا الرقم</button> : null}
            {error.includes('مسجل مسبقًا') ? <button type="button" className="inline-auth-link" onClick={() => changeIntent('login')}>الانتقال إلى تسجيل الدخول</button> : null}
          </form>
        )}

        <footer className="secure-note"><ShieldCheck size={15} /><span>الدخول وإنشاء الحساب يتمان برمز تحقق إلى رقم الهاتف.</span></footer>
      </section>
    </main>
  );
}
