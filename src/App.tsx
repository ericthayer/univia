import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppShell from './components/layout/AppShell';
import { useSystemColorMode } from './hooks/useSystemColorMode';
import { ROUTE_PATHS } from './config/navigation';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, ProtectedRoute } from './components/auth/RouteGuards';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AccessibilityAudit = lazy(() => import('./pages/AccessibilityAudit'));
const AuditResults = lazy(() => import('./pages/AuditResults'));
const DemandLetters = lazy(() => import('./pages/DemandLetters'));
const ComplianceChecklist = lazy(() => import('./pages/ComplianceChecklist'));
const ActionsPlan = lazy(() => import('./pages/ActionPlanBuilder'));
const Resources = lazy(() => import('./pages/Resources'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const AnalyzeReport = lazy(() => import('./pages/AnalyzeReport'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Pricing = lazy(() => import('./pages/Pricing'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DocumentAnalysisTest = lazy(() => import('./pages/admin/DocumentAnalysisTest'));
const GeminiStreamingDemo = lazy(() => import('./pages/admin/GeminiStreamingDemo'));
const PatternLibrary = lazy(() => import('./pages/PatternLibrary'));
const SignIn = lazy(() => import('./pages/auth/SignIn'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));

const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60svh'
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  useSystemColorMode();

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth Routes - Standalone */}
            <Route path={ROUTE_PATHS.SIGN_IN} element={<SignIn />} />
            <Route path={ROUTE_PATHS.SIGN_UP} element={<SignUp />} />
            <Route path={ROUTE_PATHS.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPassword />} />
            <Route path={ROUTE_PATHS.AUTH_CALLBACK} element={<AuthCallback />} />

            {/* App Routes - With Shell */}
            <Route
              path="*"
              element={
                <AppShell>
                  <Routes>
                    <Route
                      path={ROUTE_PATHS.DASHBOARD}
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTE_PATHS.AUDIT}
                      element={
                        <ProtectedRoute>
                          <AccessibilityAudit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTE_PATHS.AUDIT_RESULTS}
                      element={
                        <ProtectedRoute>
                          <AuditResults />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTE_PATHS.LETTERS}
                      element={
                        <ProtectedRoute>
                          <DemandLetters />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTE_PATHS.CHECKLIST}
                      element={
                        <ProtectedRoute>
                          <ComplianceChecklist />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTE_PATHS.ACTION_PLAN}
                      element={
                        <ProtectedRoute>
                          <ActionsPlan />
                        </ProtectedRoute>
                      }
                    />
                    <Route path={ROUTE_PATHS.RESOURCES} element={<Resources />} />
                    <Route path={ROUTE_PATHS.HELP} element={<HelpCenter />} />
                    <Route
                      path={ROUTE_PATHS.ANALYZE_REPORT}
                      element={
                        <ProtectedRoute>
                          <AnalyzeReport />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <AccountSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/pattern-library" element={<PatternLibrary />} />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/billing"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/test-analysis"
                      element={
                        <AdminRoute>
                          <DocumentAnalysisTest />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/streaming-demo"
                      element={
                        <AdminRoute>
                          <GeminiStreamingDemo />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </AppShell>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
