import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignOutPage from '@/pages/SignOutPage';

export default function SignOutApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignOutPage />} />
        <Route path="/signout" element={<SignOutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
