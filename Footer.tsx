import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-600">Need more information about NewBridge Training Institute?</p>
        <a
          href="https://nti.edu.za/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-nti-navy font-semibold hover:underline"
        >
          Official Website
          <ExternalLink className="w-4 h-4" />
        </a>
        <p className="mt-6 text-xs text-gray-400">© NewBridge Training Institute</p>
      </div>
    </footer>
  );
}
