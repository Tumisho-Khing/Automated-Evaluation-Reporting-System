export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-nti-navy rounded-full animate-spin" />
      {label && <p className="mt-3 text-sm">{label}</p>}
    </div>
  );
}
