import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import SignInPage from '@/pages/SignInPage';
import SignOutPage from '@/pages/SignOutPage';
import AttendanceDashboard from '@/pages/AttendanceDashboard';
import StudentHistoryPage from '@/pages/StudentHistoryPage';
import AdminAuthGuard from '@/components/AdminAuthGuard';

export default function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signout" element={<SignOutPage />} />
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
  );
}
