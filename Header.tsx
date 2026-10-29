import Navigation from './Navigation';

export default function Header() {
  return (
    <header className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center text-center">
        <img src="/ngi_logo.png" alt="NewBridge Training Institute" className="h-16 sm:h-20 object-contain" />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-400">NewBridge Training Institute</p>
      </div>
      <Navigation />
    </header>
  );
}
