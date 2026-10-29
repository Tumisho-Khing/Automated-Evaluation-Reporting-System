import { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  Server,
  Info,
} from 'lucide-react';
import {
  getNotificationEmails,
  saveNotificationEmails,
  testEmailDelivery,
  DEFAULT_NOTIFICATION_EMAILS,
} from '@/lib/attendance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  recipient: string;
  success: boolean;
  id?: string;
  error?: string;
  timestamp: string;
}

export default function EmailDiagnosticsModal({ isOpen, onClose }: Props) {
  const [emails, setEmails] = useState<string[]>(() => getNotificationEmails());
  const [newEmail, setNewEmail] = useState('');
  const [testing, setTesting] = useState<string | 'all' | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'dns' | 'recipients'>('test');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    if (emails.includes(clean)) return;

    const updated = [...emails, clean];
    setEmails(updated);
    saveNotificationEmails(updated);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updated = emails.filter((e) => e !== emailToRemove);
    setEmails(updated);
    saveNotificationEmails(updated);
  };

  const handleResetDefaults = () => {
    setEmails(DEFAULT_NOTIFICATION_EMAILS);
    saveNotificationEmails(DEFAULT_NOTIFICATION_EMAILS);
  };

  const handleTestSingle = async (email: string) => {
    setTesting(email);
    const now = new Date().toLocaleTimeString();
    try {
      const result = await testEmailDelivery(email);
      const dispatch = result.data?.dispatches?.find((d: any) => d.recipient === email) || result.data?.dispatches?.[0];

      if (result.success && dispatch?.success) {
        setTestResults((prev) => ({
          ...prev,
          [email]: {
            recipient: email,
            success: true,
            id: dispatch.id || result.data?.sender,
            timestamp: now,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [email]: {
            recipient: email,
            success: false,
            error: dispatch?.error || result.error || 'Delivery rejected by provider',
            timestamp: now,
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [email]: {
          recipient: email,
          success: false,
          error: err?.message || 'Network failure',
          timestamp: now,
        },
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleTestAll = async () => {
    setTesting('all');
    const now = new Date().toLocaleTimeString();
    try {
      const result = await testEmailDelivery(undefined, emails);
      const dispatches = result.data?.dispatches || [];

      const newMap: Record<string, TestResult> = { ...testResults };
      for (const email of emails) {
        const item = dispatches.find((d: any) => d.recipient.toLowerCase() === email.toLowerCase());
        if (item) {
          newMap[email] = {
            recipient: email,
            success: Boolean(item.success),
            id: item.id,
            error: item.error,
            timestamp: now,
          };
        } else {
          newMap[email] = {
            recipient: email,
            success: Boolean(result.success),
            id: result.data?.resendId,
            error: result.error,
            timestamp: now,
          };
        }
      }
      setTestResults(newMap);
    } catch (err: any) {
      console.error('Test all failed:', err);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Email Notifications & Deliverability</h2>
              <p className="text-xs text-slate-400">Manage recipients, test live delivery & inspect DNS security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Live Delivery Tester
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'recipients'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Recipients ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('dns')}
            className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'dns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            DNS & Spam Prevention Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TESTER */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-xs text-blue-900">
                    <p className="font-semibold">Individual 1:1 Dispatch Pathway Active</p>
                    <p className="text-blue-700 mt-0.5">
                      Each recipient receives a distinct email payload with plain-text fallback and transactional headers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTestAll}
                  disabled={testing !== null}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  {testing === 'all' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing All...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Test All Recipients
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {emails.map((email) => {
                  const res = testResults[email];
                  const isCurTesting = testing === email || testing === 'all';

                  return (
                    <div
                      key={email}
                      className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{email}</span>
                          {email === 'maphallaamari@gmail.com' && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                              Account Owner
                            </span>
                          )}
                          {(email.includes('@nti.edu.za') || email.includes('@ngi.ac.za')) && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                              Institutional Mailbox
                            </span>
                          )}
                        </div>

                        {res && (
                          <div className="flex items-center gap-2 text-xs">
                            {res.success ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Dispatched (Resend ID: <span className="font-mono text-[11px]">{res.id?.slice(0, 8)}...</span>)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {res.error}
                              </span>
                            )}
                            <span className="text-slate-400">· {res.timestamp}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleTestSingle(email)}
                        disabled={testing !== null}
                        className="self-end sm:self-auto px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isCurTesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-slate-400" />
                            Test Send
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RECIPIENTS */}
          {activeTab === 'recipients' && (
            <div className="space-y-4">
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Add new notification email (e.g. staff@nti.edu.za)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {emails.map((e) => (
                  <div key={e} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-800">{e}</span>
                    <button
                      onClick={() => handleRemoveEmail(e)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                      title="Remove email"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset to default emails (maphallaamari, bradleym, lindadv)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DNS & SPAM PREVENTION */}
          {activeTab === 'dns' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Why do Microsoft 365 & corporate inboxes reject unverified domains?
                </div>
                <p>
                  Since 2024, Microsoft 365 (used by <strong>@nti.edu.za</strong> and <strong>@ngi.ac.za</strong>) strictly quarantines emails sent from subdomains without proper <strong>SPF</strong> and <strong>DMARC</strong> records. Adding the two TXT records below in your domain registrar (e.g. Cloudflare / cPanel / GoDaddy) guarantees 100% deliverability.
                </p>
              </div>

              {/* SPF Record */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[11px] rounded uppercase">
                      1. SPF TXT Record
                    </span>
                    <span className="text-xs text-slate-500 font-medium">(Authorizes Resend / SES)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('v=spf1 include:amazonses.com ~all', 'spf')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {copiedKey === 'spf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'spf' ? 'Copied' : 'Copy Value'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Type</span>
                    <span className="font-bold">TXT</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Name / Host</span>
                    <span className="font-bold">attendance</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Value</span>
                    <span className="text-blue-600 select-all font-semibold">v=spf1 include:amazonses.com ~all</span>
                  </div>
                </div>
              </div>

              {/* DMARC Record */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded uppercase">
                      2. DMARC TXT Record
                    </span>
                    <span className="text-xs text-slate-500 font-medium">(Prevents Quarantine on Exchange)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('v=DMARC1; p=none;', 'dmarc')}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {copiedKey === 'dmarc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'dmarc' ? 'Copied' : 'Copy Value'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Type</span>
                    <span className="font-bold">TXT</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Name / Host</span>
                    <span className="font-bold">_dmarc.attendance</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Value</span>
                    <span className="text-emerald-600 select-all font-semibold">v=DMARC1; p=none;</span>
                  </div>
                </div>
              </div>

              {/* MX Record */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[11px] rounded uppercase">
                      3. MX Record
                    </span>
                    <span className="text-xs text-slate-500 font-medium">(Resend Feedback Loop)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('feedback-smtp.us-east-1.amazonses.com', 'mx')}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    {copiedKey === 'mx' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'mx' ? 'Copied' : 'Copy Value'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Type / Priority</span>
                    <span className="font-bold">MX (10)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Name / Host</span>
                    <span className="font-bold">attendance</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Value / Mail Server</span>
                    <span className="text-purple-600 select-all font-semibold">feedback-smtp.us-east-1.amazonses.com</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Sender: <strong className="text-slate-700 font-mono text-[11px]">signin@attendance.niphokazi.com</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
