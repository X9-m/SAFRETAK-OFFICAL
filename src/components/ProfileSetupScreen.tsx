import { Loader2, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import type { AppProfile } from '../types';
import { cleanSingleLineText, isValidFullName } from '../validation';

interface ProfileSetupScreenProps {
  profile: AppProfile;
  onComplete: (fullName: string) => Promise<void>;
  onLogout: () => Promise<void> | void;
}

export function ProfileSetupScreen({ profile, onComplete, onLogout }: ProfileSetupScreenProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cleanName = useMemo(() => cleanSingleLineText(name, 100), [name]);
  const validName = isValidFullName(cleanName);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!validName) {
      setError('أدخل اسمك الكامل بشكل صحيح.');
      return;
    }
    setBusy(true);
    try {
      await onComplete(cleanName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إكمال الحساب. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page" dir="rtl">
      <div className="lattice" aria-hidden="true" />
      <section className="auth-card screen-enter profile-setup-card">
        <header className="brand">
          <div className="logo-circle"><img src="/safretak-logo.jpeg" alt="شعار سفرتك" className="app-logo" /></div>
          <h1>سفرتك</h1>
          <p>منصة السفر والسياحة الأردنية</p>
        </header>

        <div className="login-heading">
          <UserRound size={22} />
          <div>
            <h2>أكمل حسابك</h2>
            <p>أضف اسمك حتى تظهر الحجوزات والطلبات باسمك الصحيح.</p>
          </div>
        </div>

        <form className="form-area" onSubmit={submit} noValidate>
          <label className="field-group">
            <span>الاسم الكامل</span>
            <div className="input-box">
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value.normalize('NFKC').slice(0, 100))}
                placeholder="مثال: محمد أحمد"
                maxLength={100}
                disabled={busy}
                autoFocus
                aria-invalid={Boolean(name) && !validName}
                aria-describedby={error ? 'profile-setup-error' : undefined}
              />
              <UserRound size={17} />
            </div>
            <small className="field-hint">سيظهر هذا الاسم في حجوزاتك وطلبات الدعم.</small>
          </label>

          <label className="field-group">
            <span>رقم الهاتف</span>
            <input className="readonly-field" value={profile.phone} disabled dir="ltr" />
          </label>

          {error ? <div id="profile-setup-error" className="login-alert" role="alert">{error}</div> : null}

          <button type="submit" className="gold-button" disabled={busy || !validName}>
            {busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            إكمال الحساب
          </button>
        </form>

        <button type="button" className="setup-logout" onClick={() => void onLogout()} disabled={busy}>
          <LogOut size={15} />استخدام رقم آخر
        </button>
        <footer className="secure-note"><ShieldCheck size={15} /><span>رقم هاتفك هو وسيلة الدخول إلى حسابك.</span></footer>
      </section>
    </main>
  );
}
