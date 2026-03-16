import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppWrapper } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RiskProvider } from './context/RiskContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import Guide from './pages/Guide';
import InherentRiskEvaluation from './pages/InherentRiskEvaluation';
import Login from './pages/Login';
import MitigationPlan from './pages/MitigationPlan';
import Mitigations from './pages/Mitigations';
import MonthlyEvaluations from './pages/MonthlyEvaluations';
import MonthlyEvaluationForm from './pages/MonthlyEvaluationForm';
import NewRiskEntry from './pages/NewRiskEntry';
import Reports from './pages/Reports';
import RiskMeasurements from './pages/RiskMeasurements';
import RiskDetail from './pages/RiskDetail';
import RiskRegister from './pages/RiskRegister';
import Settings from './pages/Settings';

// Placeholder pages for other routes
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-(--shadow-card)">
      <div className="text-center">
        <i className="bi bi-gear text-6xl text-gray-300 mb-4"></i>
        <h2 className="text-xl text-gray-600">{title}</h2>
        <p className="text-gray-400">This page is under construction</p>
      </div>
    </div>
  );
}

// Role-based protected route — redirects to dashboard if role not allowed
function RoleProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-body-bg) dark:bg-(--color-body-bg-dark)">
        <div className="text-center">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-[#0c9361] mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Memeriksa kredensial...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-body-bg) dark:bg-(--color-body-bg-dark)">
        <div className="text-center">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-[#0c9361] mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Memeriksa kredensial...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-body-bg) dark:bg-(--color-body-bg-dark)">
        <div className="text-center">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-[#0c9361] mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Memeriksa kredensial...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Default route - redirect to login if not authenticated */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <Dashboard />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risks"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <RiskRegister />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risks/:riskId/detail"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <RiskDetail />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risks/new"
        element={
          <RoleProtectedRoute allowedRoles={['RISK_OFFICER']}>
            <AppWrapper>
              <NewRiskEntry />
            </AppWrapper>
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/risks/:riskId/risk-analysis"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <InherentRiskEvaluation />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risks/:riskId/mitigation-plan"
        element={
          <RoleProtectedRoute allowedRoles={['RISK_OFFICER', 'RISK_CHAMPION']}>
            <AppWrapper>
              <MitigationPlan />
            </AppWrapper>
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/measurements"
        element={
          <RoleProtectedRoute allowedRoles={['RISK_ASSESSMENT']}>
            <AppWrapper>
              <RiskMeasurements />
            </AppWrapper>
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/mitigations"
        element={
          <RoleProtectedRoute allowedRoles={['RISK_OFFICER', 'RISK_CHAMPION']}>
            <AppWrapper>
              <Mitigations />
            </AppWrapper>
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/evaluations"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <MonthlyEvaluations />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risks/:riskId/evaluation"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <MonthlyEvaluationForm />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <Reports />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <Settings />
            </AppWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/guide"
        element={
          <ProtectedRoute>
            <AppWrapper>
              <Guide />
            </AppWrapper>
          </ProtectedRoute>
        }
      />


      {/* Catch all - redirect to login if not authenticated, otherwise show 404 */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Page Not Found" />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <RiskProvider>
                <AppRoutes />
              </RiskProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
