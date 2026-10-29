import { ReactNode } from 'react';

type Tone = 'navy' | 'green' | 'amber' | 'red';

const tones: Record<Tone, string> = {
  navy: 'bg-nti-navy/10 text-nti-navy',
  green: 'bg-success-green/10 text-success-green',
  amber: 'bg-amber-500/10 text-amber-600',
  red: 'bg-red-500/10 text-red-600',
};

export default function DashboardCard({ label, value, icon: Icon, tone }: { label: string; value: ReactNode; icon: React.ElementType; tone: Tone }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
