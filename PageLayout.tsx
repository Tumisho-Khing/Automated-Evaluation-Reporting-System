import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">{children}</main>
      <Footer />
    </div>
  );
}
