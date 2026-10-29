import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignInPage from '@/pages/SignInPage';

export default function SignInApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
