/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { SkeletonProvider } from './context/SkeletonContext';
import type { UserSession } from './components/auth/AuthPage';
import {
  CampaignPlanTier,
  CAMPAIGN_PLAN_TIERS,
} from './components/landing/CampaignPlansModal';
import { ThreeBackground } from './components/ThreeBackground';
import { PageLoader } from './components/PageLoader';
import { CheckCircle2 } from 'lucide-react';

// Code-Splitting por página: Carga bajo demanda de JavaScript para optimizar First Contentful Paint
const LandingPage = lazy(() =>
  import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const AuthPage = lazy(() =>
  import('./components/auth/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const VotalityDashboard = lazy(() =>
  import('./components/votality/VotalityDashboard').then((m) => ({ default: m.VotalityDashboard }))
);
const VotalityJoinPage = lazy(() =>
  import('./components/votality/VotalityJoinPage').then((m) => ({ default: m.VotalityJoinPage }))
);
const CheckoutPage = lazy(() =>
  import('./components/checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const TermsPage = lazy(() =>
  import('./components/legal/TermsPage').then((m) => ({ default: m.TermsPage }))
);

/**
 * Componente de Protección de Rutas:
 * Asegura que el panel del Mapa SIG sea accesible únicamente si el usuario está autenticado.
 * Si no hay sesión activa, redirige inmediatamente a la vista de login.
 */
function RutaProtegida({
  user,
  children,
}: {
  user: UserSession | null;
  children: React.ReactElement;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Envoltorio para vistas de Autenticación (/login, /registro, /auth)
 */
function AuthWrapper({
  mode,
  onLoginSuccess,
  onRegisterSuccess,
}: {
  mode: 'login' | 'register';
  onLoginSuccess: (user: UserSession) => void;
  onRegisterSuccess: (user: UserSession, selectedPlan?: CampaignPlanTier | null) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planCode = searchParams.get('plan') || searchParams.get('tipo_plan');
  const selectedPlan = planCode
    ? CAMPAIGN_PLAN_TIERS.find(
        (p) =>
          p.codigo.toLowerCase() === planCode.toLowerCase() ||
          p.id.toLowerCase() === planCode.toLowerCase()
      ) || null
    : null;

  return (
    <>
      <ThreeBackground />
      <AuthPage
        initialMode={mode}
        selectedPlan={selectedPlan}
        onBackToLanding={() => navigate('/')}
        onLoginSuccess={onLoginSuccess}
        onRegisterSuccess={onRegisterSuccess}
      />
    </>
  );
}

/**
 * Envoltorio para el flujo de Invitación a Encuestadores (/unirse/:token)
 */
function JoinWrapper({
  onJoined,
}: {
  onJoined: (encuestador: {
    id: string;
    name: string;
    username: string;
    sessionToken: string;
    role: string;
  }) => void;
}) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <VotalityJoinPage
      token={token}
      onJoined={onJoined}
      onBackToHome={() => navigate('/')}
    />
  );
}

/**
 * Envoltorio para la vista de Checkout / Pago (/pago, /checkout)
 */
function CheckoutWrapper({
  user,
  onContinueToWorkspace,
  onBackToLanding,
}: {
  user: UserSession | null;
  onContinueToWorkspace: (planCode: string) => void;
  onBackToLanding: () => void;
}) {
  const [searchParams] = useSearchParams();
  const planCode = searchParams.get('plan') || searchParams.get('tipo_plan') || 'comunal';
  const selectedPlan = planCode
    ? CAMPAIGN_PLAN_TIERS.find(
        (p) =>
          p.codigo.toLowerCase() === planCode.toLowerCase() ||
          p.id.toLowerCase() === planCode.toLowerCase()
      ) || null
    : null;

  return (
    <CheckoutPage
      user={user}
      selectedPlan={selectedPlan}
      onContinueToWorkspace={() => onContinueToWorkspace(selectedPlan?.codigo?.toLowerCase() || planCode.toLowerCase())}
      onBackToLanding={onBackToLanding}
    />
  );
}

import { MASTER_TEST_USERS, findUserByEmail, updateUserPlanInStore } from './utils/userStore';

// Limpieza inicial para garantizar que el entorno inicie desde cero con el usuario master activo
const CLEAN_SLATE_KEY = 'votality_clean_slate_reset_v4';
if (typeof window !== 'undefined' && !localStorage.getItem(CLEAN_SLATE_KEY)) {
  try {
    localStorage.removeItem('votality_user');
    localStorage.removeItem('voxpin_user');
    localStorage.removeItem('votality_user_plan');
    localStorage.removeItem('votality_premium_paid');
    localStorage.removeItem('votality_invitaciones_history_v2');
    localStorage.removeItem('votality_team_activos');
    localStorage.removeItem('votality_last_project_name');
    localStorage.removeItem('voxpin_last_project_name');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('voxpin_') || key.startsWith('votality_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem('votality_users_db', JSON.stringify(MASTER_TEST_USERS));
    localStorage.setItem(CLEAN_SLATE_KEY, 'done');
  } catch (e) {
    console.error('Error al limpiar datos previos:', e);
  }
}

function AppRoutes() {
  const navigate = useNavigate();

  // Estado del usuario autenticado persistido en localStorage con aislamiento estricto de licencias por cuenta
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      localStorage.removeItem('votality_user_plan');
      localStorage.removeItem('votality_premium_paid');
      const saved = localStorage.getItem('votality_user') || localStorage.getItem('voxpin_user');
      if (saved) {
        const parsed: UserSession = JSON.parse(saved);
        if (parsed.email) {
          const cleanEmail = parsed.email.trim().toLowerCase();
          const specificOverride = localStorage.getItem(`votality_user_plan_${cleanEmail}`);
          if (specificOverride === 'PREMIUM') {
            parsed.planTier = 'PREMIUM';
            parsed.plan = {
              codigo: 'PREMIUM',
              nombre: 'Plan Premium',
              limite_encuestadores: 30,
              limite_pines: 1000,
            };
          } else {
            // Si no tiene override específico a su correo, restaurar al plan original registrado en base de datos
            const dbUser = findUserByEmail(cleanEmail);
            if (dbUser) {
              parsed.planTier = dbUser.planTier;
              parsed.role = dbUser.role;
              parsed.plan = dbUser.plan;
            }
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, duration = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('votality_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(`¡Bienvenido de vuelta, ${user.name}!`);
    navigate('/mapa');
  };

  const handleRegisterSuccess = (user: UserSession, plan?: CampaignPlanTier | null) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('votality_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    const planUpper = (user.planTier || plan?.codigo || '').toUpperCase();
    const isPaid =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('pagado') === 'true' ||
        localStorage.getItem('votality_premium_paid') === 'true');

    if (planUpper === 'FREE' || planUpper === 'PREMIUM' || isPaid || !plan) {
      // Plan Básico o Plan Premium Pagado: pasa directo al mapa sin pasar por checkout
      showToast(`¡Bienvenido a Votality, ${user.name}! Tu mesa de trabajo está lista.`);
      navigate('/mapa');
    } else {
      // Plan por Campaña pendiente de pago: redirige a pantalla temporal de pago
      showToast(`¡Cuenta creada con éxito, ${user.name}!`);
      navigate(`/pago?plan=${plan.codigo}`);
    }
  };

  const handleInterviewerJoined = (encuestador: {
    id: string;
    name: string;
    username: string;
    sessionToken: string;
    role: string;
    projectName?: string;
    campaignName?: string;
    director?: string;
  }) => {
    const projName =
      encuestador.projectName ||
      encuestador.campaignName ||
      localStorage.getItem('votality_last_project_name') ||
      '';

    const user: UserSession = {
      id: encuestador.id,
      name: encuestador.name,
      email: `${encuestador.username}@votality.campo`,
      provider: 'email',
      role: 'ENCUESTADOR',
      planTier: 'BASICO',
      projectName: projName,
      proyecto_nombre: projName,
      token: encuestador.sessionToken,
    };
    setCurrentUser(user);
    try {
      localStorage.setItem('votality_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(`¡Bienvenido ${encuestador.name}! Te has unido al proyecto ${projName}.`);
    navigate('/mapa');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('votality_user');
      localStorage.removeItem('voxpin_user');
      localStorage.removeItem('votality_user_plan');
      localStorage.removeItem('votality_premium_paid');
    } catch (e) {
      console.error(e);
    }
    showToast('Has cerrado sesión correctamente.', 3000);
    navigate('/');
  };

  const handleUpdateProjectName = (name: string) => {
    try {
      localStorage.setItem('votality_last_project_name', name);
    } catch (e) {
      console.error(e);
    }
    if (currentUser) {
      const updatedUser: UserSession = {
        ...currentUser,
        projectName: name,
        proyecto_nombre: name,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('votality_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <>
      {/* Toast flotante global */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121212] border border-white/30 text-white px-4 py-2.5 rounded-[3.6px] font-mono text-xs flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Suspense fallback={<PageLoader minDurationMs={300} />}>
        <Routes>
          {/* Entrada principal por defecto: Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                currentUser={currentUser}
                onOpenAuth={(mode) => navigate(mode === 'register' ? '/registro' : '/login')}
                onSelectBasicPlan={() => navigate('/registro?plan=free&rol=director_free')}
                onSelectCampaignPlan={(plan) => {
                  navigate(`/pago?plan=${plan.codigo.toLowerCase()}&rol=director_campana`);
                }}
                onSelectPremiumPlan={() => {
                  navigate('/pago?plan=premium&rol=director_campana');
                }}
                onOpenWorkspace={() => navigate('/mapa')}
                onLogout={handleLogout}
                onInterviewerJoined={handleInterviewerJoined}
              />
            }
          />

          {/* Autenticación */}
          <Route
            path="/login"
            element={
              <AuthWrapper
                mode="login"
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
              />
            }
          />
          <Route
            path="/registro"
            element={
              <AuthWrapper
                mode="register"
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
              />
            }
          />
          <Route
            path="/auth"
            element={
              <AuthWrapper
                mode="login"
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
              />
            }
          />

          {/* Flujo de invitación para encuestadores */}
          <Route
            path="/unirse/:token"
            element={<JoinWrapper onJoined={handleInterviewerJoined} />}
          />

          {/* Aplicativo interno / Mapa SIG (Ruta Protegida) */}
          <Route
            path="/mapa"
            element={
              <RutaProtegida user={currentUser}>
                <VotalityDashboard
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onNavigateToJoin={(tok) => navigate(`/unirse/${tok}`)}
                  onUpdateProjectName={handleUpdateProjectName}
                  onNavigateToLanding={() => navigate('/')}
                />
              </RutaProtegida>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/mapa" replace />} />
          <Route path="/app" element={<Navigate to="/mapa" replace />} />

          {/* Pantalla de Checkout / Pago */}
          <Route
            path="/pago"
            element={
              <CheckoutWrapper
                user={currentUser}
                onContinueToWorkspace={(planCode) => {
                  const upperPlan = (planCode || 'PREMIUM').toUpperCase();
                  if (currentUser) {
                    const cleanEmail = currentUser.email?.trim().toLowerCase();
                    const limiteEnc = upperPlan === 'PREMIUM' ? 30 : upperPlan === 'MUNICIPAL' ? 50 : upperPlan === 'DEPARTAMENTAL' ? 200 : 15;
                    const limitePin = upperPlan === 'PREMIUM' ? 1000 : upperPlan === 'MUNICIPAL' ? 50000 : upperPlan === 'DEPARTAMENTAL' ? 250000 : 10000;
                    const updatedUser: UserSession = {
                      ...currentUser,
                      planTier: upperPlan,
                      role: upperPlan === 'FREE' ? 'USUARIO_FREE' : 'ADMIN_CAMPANA',
                      plan: {
                        codigo: upperPlan,
                        nombre:
                          upperPlan === 'PREMIUM'
                            ? 'Plan Premium'
                            : `Plan Campaña ${planCode.charAt(0).toUpperCase() + planCode.slice(1)}`,
                        limite_encuestadores: limiteEnc,
                        limite_pines: limitePin,
                      },
                    };
                    setCurrentUser(updatedUser);
                    try {
                      localStorage.setItem('votality_user', JSON.stringify(updatedUser));
                      if (cleanEmail) {
                        localStorage.setItem(`votality_user_plan_${cleanEmail}`, upperPlan);
                        updateUserPlanInStore(cleanEmail, upperPlan);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                    showToast(`¡Tu cuenta ha sido actualizada al nuevo ${updatedUser.plan?.nombre}!`);
                    navigate('/mapa');
                  } else {
                    navigate(`/registro?plan=${planCode}&rol=director_campana&pagado=true`);
                  }
                }}
                onBackToLanding={() => navigate('/')}
              />
            }
          />
          <Route path="/checkout" element={<Navigate to="/pago" replace />} />

          {/* Términos y Condiciones, Suscripciones y Políticas */}
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/terminos-y-condiciones" element={<Navigate to="/terminos" replace />} />
          <Route path="/politicas" element={<Navigate to="/terminos" replace />} />

          {/* Redirección por defecto ante rutas desconocidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <SkeletonProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SkeletonProvider>
  );
}
