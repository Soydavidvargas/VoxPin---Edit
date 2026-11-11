/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage, UserSession } from './components/auth/AuthPage';
import { VotalityDashboard } from './components/votality/VotalityDashboard';
import { VotalityJoinPage } from './components/votality/VotalityJoinPage';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import {
  CampaignPlanTier,
  CAMPAIGN_PLAN_TIERS,
} from './components/landing/CampaignPlansModal';
import { ThreeBackground } from './components/ThreeBackground';
import { CheckCircle2 } from 'lucide-react';

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

import { MASTER_TEST_USERS } from './utils/userStore';

// Limpieza inicial para garantizar que el entorno inicie desde cero con el usuario master activo
const CLEAN_SLATE_KEY = 'votality_clean_slate_reset_v4';
if (typeof window !== 'undefined' && !localStorage.getItem(CLEAN_SLATE_KEY)) {
  try {
    localStorage.removeItem('votality_user');
    localStorage.removeItem('voxpin_user');
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

  // Estado del usuario autenticado persistido en localStorage
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('votality_user') || localStorage.getItem('voxpin_user');
      if (saved) return JSON.parse(saved);
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

    if (planUpper === 'FREE' || !plan) {
      // Plan Básico (Free): pasa directo al mapa sin pasar por checkout
      showToast(`¡Bienvenido a Votality, ${user.name}! Estás en el Plan Básico (Free).`);
      navigate('/mapa');
    } else {
      // Plan por Campaña: redirige a pantalla temporal de pago
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
      planTier: 'COMUNAL',
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
              onOpenWorkspace={() => navigate('/mapa')}
              onLogout={handleLogout}
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
                if (currentUser) {
                  navigate('/mapa');
                } else {
                  navigate(`/registro?plan=${planCode}&rol=director_campana`);
                }
              }}
              onBackToLanding={() => navigate('/')}
            />
          }
        />
        <Route path="/checkout" element={<Navigate to="/pago" replace />} />

        {/* Redirección por defecto ante rutas desconocidas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
