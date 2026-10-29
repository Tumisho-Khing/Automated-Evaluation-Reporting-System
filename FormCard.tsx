import { ReactNode } from 'react';

export default function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-nti-navy tracking-tight">{title}</h1>
      <p className="mt-2 text-gray-500 text-base sm:text-lg">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
