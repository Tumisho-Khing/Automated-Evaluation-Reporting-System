import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { LogIn, LogOut, LayoutDashboard, Search, ArrowRight, ShieldCheck, Clock, QrCode, GraduationCap, FileText, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto fade-in-up">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nti-navy/10 text-nti-navy text-sm font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Student Attendance System
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-nti-navy tracking-tight leading-tight">
          Track Attendance.<br />Simple, Fast, Secure.
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
          A modern attendance management system for NewBridge Training Institute students. Sign in, sign out, and monitor campus presence in real time.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signin"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-nti-navy text-white font-semibold text-sm hover:bg-nti-navy-light transition-all shadow-sm hover:shadow-md"
          >
            <LogIn className="w-4 h-4" />
            Sign In Now
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-nti-navy border border-gray-300 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Quick action cards */}
      <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ActionCard to="/signin" icon={LogIn} title="Student Sign In" desc="Register your attendance with ID upload." tone="navy" />
        <ActionCard to="/signout" icon={LogOut} title="Student Sign Out" desc="Record your departure for the day." tone="green" />
        <ActionCard to="/attendance" icon={LayoutDashboard} title="Attendance Dashboard" desc="Live overview of campus attendance." tone="amber" />
        <ActionCard to="/student-history" icon={Search} title="Student Lookup" desc="Search any student's full history." tone="navy" />
      </section>

      {/* Features */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-nti-navy text-center tracking-tight">Everything you need to manage attendance</h2>
        <p className="mt-2 text-gray-500 text-center max-w-xl mx-auto">
          Built for the daily flow of campus life — from student check-in to staff monitoring.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature icon={QrCode} title="QR Code Sign In" desc="Students can quickly scan to sign in and sign out, reducing queues and paperwork." />
          <Feature icon={FileText} title="ID Document Upload" desc="A readable photo of the student's ID is captured during sign-in for verification." />
          <Feature icon={Clock} title="Real-Time Tracking" desc="Attendance records update instantly — staff always see the current campus state." />
          <Feature icon={LayoutDashboard} title="Staff Dashboard" desc="Monitor who's on site, who's signed out, and who's missing ID photos at a glance." />
          <Feature icon={Users} title="Student History" desc="Look up any student by number or name to view their complete attendance record." />
          <Feature icon={ShieldCheck} title="Secure & Reliable" desc="Data is stored securely with row-level protection and automatic daily backups." />
        </div>
      </section>

      {/* Stats band */}
      <section className="mt-20 bg-nti-navy rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center">
        <GraduationCap className="w-12 h-12 text-white/80 mx-auto" />
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">Built for NewBridge Training Institute</h2>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">
          Designed to match the NTI branding and streamline daily attendance for students and staff alike.
        </p>
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-xl bg-white text-nti-navy font-semibold text-sm hover:bg-gray-100 transition-all"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </PageLayout>
  );
}

function ActionCard({ to, icon: Icon, title, desc, tone }: { to: string; icon: React.ElementType; title: string; desc: string; tone: 'navy' | 'green' | 'amber' }) {
  const tones = {
    navy: 'bg-nti-navy/10 text-nti-navy',
    green: 'bg-success-green/10 text-success-green',
    amber: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-nti-navy/20 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-nti-navy group-hover:gap-2 transition-all">
        Open <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl bg-nti-navy/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-nti-navy" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
