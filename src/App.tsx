import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppShell from './components/layout/AppShell';
import { useSystemColorMode } from './hooks/useSystemColorMode';
import { ROUTE_PATHS } from './config/navigation';
import { AuthProvider } from './contexts/AuthContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AccessibilityAudit = lazy(() => import('./pages/AccessibilityAudit'));
const AuditResults = lazy(() => import('./pages/AuditResults'));
const DemandLetters = lazy(() => import('./pages/DemandLetters'));
const ComplianceChecklist = lazy(() => import('./pages/ComplianceChecklist'));
const Resources = lazy(() => import('./pages/Resources'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Pricing = lazy(() => import('./pages/Pricing'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DocumentAnalysisTest = lazy(() => import('./pages/admin/DocumentAnalysisTest'));
const PatternLibrary = lazy(() => import('./pages/PatternLibrary'));

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
        <AppShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={ROUTE_PATHS.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTE_PATHS.AUDIT} element={<AccessibilityAudit />} />
              <Route path={ROUTE_PATHS.AUDIT_RESULTS} element={<AuditResults />} />
              <Route path={ROUTE_PATHS.LETTERS} element={<DemandLetters />} />
              <Route path={ROUTE_PATHS.CHECKLIST} element={<ComplianceChecklist />} />
              <Route path={ROUTE_PATHS.RESOURCES} element={<Resources />} />
              <Route path={ROUTE_PATHS.HELP} element={<HelpCenter />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/pattern-library" element={<PatternLibrary />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/billing" element={<UserManagement />} />
              <Route path="/admin/settings" element={<UserManagement />} />
              <Route path="/admin/test-analysis" element={<DocumentAnalysisTest />} />
            </Routes>
          </Suspense>
        </AppShell>
      </Router>
    </AuthProvider>
  );
}

export default App;
