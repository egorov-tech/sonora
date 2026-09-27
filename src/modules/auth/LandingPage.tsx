import { useCallback, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { BrandLogo } from '@/app/components/BrandLogo';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { VkOneTapAuth } from '@/modules/auth/VkOneTapAuth';
import { LandingStickyAuth } from '@/modules/auth/LandingStickyAuth';
import { LandingPreview } from '@/modules/auth/LandingPreview';
import { AmbientBackdrop } from '@/shared/ui/AmbientBackdrop';
import { useMoodAmbient } from '@/shared/hooks/useMoodAmbient';
import { authStore, playerStore } from '@/store/store';
import { loginWithLocalDemo, loginWithVkIdentity } from '@/modules/auth/authService';
import { APP_ROUTES } from '@/app/config/routes';
import { useIsMobileShell } from '@/shared/hooks/useMediaQuery';
import type { MoodKey } from '@/shared/api/jamendo';

const LANDING_FEATURES = [
  'Подборки по настроению',
  'Поиск через Jamendo API',
  'Плеер с hotkeys',
] as const;

export const LandingPage = observer(function LandingPage() {
  const navigate = useNavigate();
  const isMobileShell = useIsMobileShell();
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasHttpsOrigin = window.location.protocol === 'https:';

  const pageRef = useRef<HTMLElement | null>(null);
  const [moodKey, setMoodKey] = useState<MoodKey>(() => {
    const stored = playerStore.selectedHomeMoodKey;
    if (
      stored === 'morning' ||
      stored === 'energy' ||
      stored === 'relax' ||
      stored === 'focus' ||
      stored === 'night'
    ) {
      return stored;
    }
    return 'energy';
  });
  useMoodAmbient(moodKey, pageRef);

  const handleSelectMood = useCallback((key: MoodKey) => {
    setMoodKey(key);
    playerStore.setSelectedHomeMoodKey(key);
  }, []);

  const onLogin = useCallback(() => loginWithLocalDemo(navigate), [navigate]);

  const onVkSuccess = useCallback(
    (payload: { username: string; email: string }) => loginWithVkIdentity(payload, navigate),
    [navigate],
  );

  if (authStore.authHydrated && authStore.isAuthenticated) {
    return <Navigate to={APP_ROUTES.app} replace />;
  }

  const showLocalDemo = isLocalhost;
  const showVkAuth = hasHttpsOrigin;
  const showVkHint = isLocalhost && !hasHttpsOrigin;

  return (
    <main className="landing-page" ref={pageRef}>
      <AmbientBackdrop />

      <header className="landing-header">
        <BrandLogo />
        {isMobileShell ? <ThemeToggle compact /> : null}
      </header>

      <div className="landing-shell">
        <section className="landing-intro" aria-labelledby="landing-title">
          <p className="landing-auth-kicker">Portfolio · React 19 / TypeScript</p>
          <h1 id="landing-title">Музыка под твоё настроение</h1>
          <p className="landing-auth-lead">
            Подборки, поиск и плеер в одном интерфейсе — учебный проект на React 19 с API Jamendo.
          </p>

          <ul className="landing-features">
            {LANDING_FEATURES.map((feature) => (
              <li key={feature}>
                <span className="landing-feature-led" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <LandingPreview activeMoodKey={moodKey} onSelectMood={handleSelectMood} />

        <section className="landing-auth-body" aria-label="Возможности и вход">
          {showLocalDemo || showVkAuth ? (
            <LandingStickyAuth>
              {showLocalDemo ? (
                <button
                  type="button"
                  className="btn btn-primary btn-lg landing-cta"
                  onClick={onLogin}
                >
                  Начать слушать
                </button>
              ) : null}
              {showLocalDemo && showVkAuth ? <div className="landing-divider">или</div> : null}
              {showVkAuth ? <VkOneTapAuth onSuccess={onVkSuccess} /> : null}
            </LandingStickyAuth>
          ) : null}

          {showVkHint ? (
            <p className="landing-hint landing-auth-hint">VK ID доступен на проде с HTTPS.</p>
          ) : null}

          {!showLocalDemo && !showVkAuth ? (
            <p className="landing-error landing-auth-hint">
              Для VK ID нужен HTTPS origin (например, GitHub Pages).
            </p>
          ) : null}
        </section>
      </div>

      <footer className="landing-footer">
        <span>Учебный проект</span>
        <span aria-hidden="true">·</span>
        <span>Sonora UI</span>
      </footer>
    </main>
  );
});
