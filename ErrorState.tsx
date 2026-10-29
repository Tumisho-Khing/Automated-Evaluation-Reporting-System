import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
