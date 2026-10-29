import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Inbox className="w-7 h-7 text-gray-400" />
      </div>
      <p className="mt-4 text-gray-700 font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
