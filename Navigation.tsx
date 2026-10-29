import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search } from 'lucide-react';

function getTargetMode(): string {
  const env = import.meta.env.VITE_TARGET_PAGE;
  if (env) return env;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('sign-in') || host.includes('signin')) return 'signin';
    if (host.includes('sign-out') || host.includes('signout')) return 'signout';
  }

  return 'admin';
}

const allLinks = [
  { to: '/attendance', label: 'Attendance Dashboard', icon: LayoutDashboard, targets: ['admin'] },
  { to: '/student-history', label: 'Student Lookup', icon: Search, targets: ['admin'] },
];

export default function Navigation() {
  const { pathname } = useLocation();
  const mode = getTargetMode();

  const links = allLinks.filter((link) => link.targets.includes(mode));

  if (links.length <= 1) {
    return null; // Omit top nav bar if single page target domain
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {links.map(({ to, label, icon: Icon }) => {
            const active = to === '/attendance' ? pathname === '/' || pathname === '/attendance' : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-nti-navy text-nti-navy'
                      : 'border-transparent text-gray-500 hover:text-nti-navy hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
