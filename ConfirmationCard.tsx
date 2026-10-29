import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmationCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10 max-w-2xl mx-auto text-center fade-in">
      <div className="mx-auto w-16 h-16 rounded-full bg-success-green/10 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-success-green" />
      </div>
      <h2 className="mt-5 text-2xl sm:text-3xl font-bold text-nti-navy">{title}</h2>
      <div className="mt-6 text-left bg-gray-50 rounded-xl p-5 sm:p-6 space-y-3">{children}</div>
    </div>
  );
}
