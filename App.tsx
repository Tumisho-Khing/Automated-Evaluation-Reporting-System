import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const targetEnv = import.meta.env.VITE_TARGET_PAGE;

const SignInPage = lazy(() => import('@/pages/SignInPage'));
const SignOutPage = lazy(() => import('@/pages/SignOutPage'));
const AttendanceDashboard = lazy(() => import('@/pages/AttendanceDashboard'));
const StudentHistoryPage = lazy(() => import('@/pages/StudentHistoryPage'));
const AdminAuthGuard = lazy(() => import('@/components/AdminAuthGuard'));

function getTargetMode(): 'signin' | 'signout' | 'admin' {
  // 1. Build-time environment variable priority
  if (targetEnv === 'signin' || targetEnv === 'signout' || targetEnv === 'admin') {
    return targetEnv;
  }

  // 2. Dynamic runtime hostname detection fallback
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('sign-in') || host.includes('signin')) {
      return 'signin';
    }
    if (host.includes('sign-out') || host.includes('signout')) {
      return 'signout';
    }
  }

  return 'admin';
}

export default function App() {
  const [mode] = useState<'signin' | 'signout' | 'admin'>(getTargetMode);

  if (mode === 'signin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">Loading Sign-In...</div>}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    );
  }

  if (mode === 'signout') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">Loading Sign-Out...</div>}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignOutPage />} />
            <Route path="/signout" element={<SignOutPage />} />
            <Route path="*" element={<Navigate to="/signout" replace />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    );
  }

  // Admin Target (Gated by AdminAuthGuard)
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">Loading Admin...</div>}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AdminAuthGuard>
                <AttendanceDashboard />
              </AdminAuthGuard>
            }
          />
          <Route
            path="/attendance"
            element={
              <AdminAuthGuard>
                <AttendanceDashboard />
              </AdminAuthGuard>
            }
          />
          <Route
            path="/student-history"
            element={
              <AdminAuthGuard>
                <StudentHistoryPage />
              </AdminAuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}
