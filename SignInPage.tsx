import { useState, useRef } from 'react';
import PageLayout from '@/components/PageLayout';
import ConfirmationCard from '@/components/ConfirmationCard';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorState from '@/components/ErrorState';
import { signInStudent } from '@/lib/attendance';
import { Upload, User, CalendarDays } from 'lucide-react';

type Result = { name: string; studentNumber: string; date: string; timeIn: string };

type SignInForm = {
  programme: string;
  trainingDate: string;
  facilitator: string;
  surname: string;
  fullNames: string;
  identityNumber: string;
  company: string;
  cellPhone: string;
  workTel: string;
  email: string;
  partTime: boolean;
  fullTime: boolean;
  softSkills: boolean;
  businessCourses: boolean;
};

const initialForm: SignInForm = {
  programme: '',
  trainingDate: new Date().toISOString().slice(0, 10),
  facilitator: '',
  surname: '',
  fullNames: '',
  identityNumber: '',
  company: '',
  cellPhone: '',
  workTel: '',
  email: '',
  partTime: false,
  fullTime: false,
  softSkills: false,
  businessCourses: false,
};

export default function SignInPage() {
  const [form, setForm] = useState<SignInForm>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof SignInForm>(key: K, value: SignInForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onFile = (selected: File | null) => {
    setError('');
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(selected.type)) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Image must be 10MB or smaller.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.surname.trim() || !form.fullNames.trim() || !form.identityNumber.trim()) {
      setError('Please complete the delegate details (Surname, Full Names, Identity / Student Number).');
      return;
    }

    // Create default placeholder image if no photo uploaded
    let idFile = file;
    if (!idFile) {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('No Image', 20, 55);
      }
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), 'image/png'));
      idFile = new File([blob], 'placeholder.png', { type: 'image/png' });
    }

    setLoading(true);
    try {
      const { student, attendance } = await signInStudent({
        firstName: form.fullNames,
        lastName: form.surname,
        studentNumber: form.identityNumber,
        programme: form.programme,
        facilitator: form.facilitator,
        cellPhone: form.cellPhone,
        workTel: form.workTel,
        email: form.email,
        trainingDate: form.trainingDate,
        furtherStudies: {
          partTime: form.partTime,
          fullTime: form.fullTime,
          softSkills: form.softSkills,
          businessCourses: form.businessCourses,
        },
        file: idFile,
      });
      setResult({
        name: `${student.first_name} ${student.last_name}`,
        studentNumber: student.student_number,
        date: new Date(attendance.attendance_date).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' }),
        timeIn: new Date(attendance.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setForm(initialForm);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PageLayout>
        <ConfirmationCard title="Successfully Signed In">
          <Detail label="Delegate Name" value={result.name} />
          <Detail label="Identity / Student Number" value={result.studentNumber} />
          <Detail label="Attendance Date" value={result.date} />
          <Detail label="Time In" value={result.timeIn} />
          <div className="pt-2">
            <Button onClick={() => setResult(null)} variant="secondary">Complete Another Sign In</Button>
          </div>
        </ConfirmationCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PaperForm
        eyebrow="Please ensure that information is clearly and correctly completed."
        title="Student Sign In"
        subtitle="Please complete all information in capital letters where possible."
      >
        <form onSubmit={submit} className="space-y-6">
          <FormSection title="Personal Details">
            <div className="grid sm:grid-cols-[145px_1fr]">
              <FormLabel>Programme</FormLabel>
              <input value={form.programme} onChange={(e) => update('programme', e.target.value)} className={inputCls} placeholder="Programme or course" />
              <FormLabel>Date of Training</FormLabel>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" value={form.trainingDate} onChange={(e) => update('trainingDate', e.target.value)} className={`${inputCls} pl-10`} />
              </div>
              <FormLabel>Facilitator</FormLabel>
              <input value={form.facilitator} onChange={(e) => update('facilitator', e.target.value)} className={inputCls} placeholder="Facilitator name" />
              <FormLabel>Delegate Surname <Required /></FormLabel>
              <input value={form.surname} onChange={(e) => update('surname', e.target.value)} className={inputCls} placeholder="Surname" />
              <FormLabel>Delegate Full Names <Required /></FormLabel>
              <input value={form.fullNames} onChange={(e) => update('fullNames', e.target.value)} className={inputCls} placeholder="Full names" />
              <FormLabel>Identity / Student No. <Required /></FormLabel>
              <input value={form.identityNumber} onChange={(e) => update('identityNumber', e.target.value)} className={inputCls} placeholder="Identity or student number" />
              <FormLabel>Company / Sponsor</FormLabel>
              <input value={form.company} onChange={(e) => update('company', e.target.value)} className={inputCls} placeholder="Company or sponsor name" />
            </div>
          </FormSection>

          <FormSection title="Contact Details">
            <div className="grid sm:grid-cols-2 gap-px bg-gray-300 border border-gray-300">
              <LabeledInput label="Cell Phone Number" value={form.cellPhone} onChange={(value) => update('cellPhone', value)} />
              <LabeledInput label="Work Tel" value={form.workTel} onChange={(value) => update('workTel', value)} />
              <LabeledInput label="E-mail Address" value={form.email} onChange={(value) => update('email', value)} type="email" wide />
            </div>
          </FormSection>

          <FormSection title="Further Studies">
            <p className="text-xs text-gray-500 mb-3">Please state whether you would like to be notified about upcoming programmes below.</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
              <Check label="Part-time Programmes" checked={form.partTime} onChange={(value) => update('partTime', value)} />
              <Check label="Full-time Programmes" checked={form.fullTime} onChange={(value) => update('fullTime', value)} />
              <Check label="Soft-skills Packages" checked={form.softSkills} onChange={(value) => update('softSkills', value)} />
              <Check label="Business & Management Courses" checked={form.businessCourses} onChange={(value) => update('businessCourses', value)} />
            </div>
          </FormSection>

          <FormSection title="Identification Upload">
            <div onClick={() => fileRef.current?.click()} className="cursor-pointer border border-dashed border-gray-400 bg-gray-50 p-5 text-center hover:border-nti-navy hover:bg-nti-navy/5 transition-colors">
              {preview ? <img src={preview} alt="Identification preview" className="mx-auto max-h-44" /> : <div className="flex flex-col items-center text-gray-500"><Upload className="w-7 h-7 mb-2" /><p className="text-sm font-semibold">Upload a clear identification image</p><p className="text-xs mt-1">JPG, JPEG or PNG · Maximum 10MB</p></div>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </div>
          </FormSection>

          {error && <ErrorState message={error} />}
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-500">Fields marked <span className="text-red-500">*</span> are required.</p>
            {loading ? <LoadingSpinner label="Signing in..." /> : <Button type="submit"><User className="w-4 h-4" /> Sign In</Button>}
          </div>
        </form>
      </PaperForm>
    </PageLayout>
  );
}

const inputCls = 'w-full px-3 py-2.5 border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nti-navy/30';

function PaperForm({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto bg-white border border-gray-300 shadow-sm p-5 sm:p-8 fade-in"><div className="text-center border-b border-gray-200 pb-5 mb-6"><img src="/ngi_logo.png" alt="NewBridge Training Institute" className="h-14 sm:h-16 mx-auto object-contain" /><p className="mt-4 text-[10px] sm:text-xs font-semibold uppercase text-gray-600">{eyebrow}</p><p className="text-[10px] sm:text-xs font-bold uppercase text-gray-700">{subtitle}</p><h1 className="mt-4 text-2xl sm:text-3xl font-extrabold uppercase text-gray-900 tracking-wide">{title}</h1></div>{children}</div>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><div className="bg-gray-700 text-white px-3 py-2 text-sm font-bold">{title}</div><div className="border border-gray-300 border-t-0">{children}</div></section>;
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-100 border-b sm:border-b-0 sm:border-r border-gray-300 px-3 py-2.5 text-xs font-semibold text-gray-700 flex items-center">{children}</div>;
}

function Required() { return <span className="text-red-500 ml-1">*</span>; }

function LabeledInput({ label, value, onChange, type = 'text', wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return <label className={`bg-white border-b border-gray-300 last:border-b-0 ${wide ? 'sm:col-span-2' : ''}`}><span className="block px-3 pt-2 text-[10px] font-semibold uppercase text-gray-500">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder="Enter details" /></label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-nti-navy" /><span>{label}</span><span className="text-xs text-gray-400">(tick ✓)</span></label>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">{label}</span><span className="font-semibold text-gray-900 text-right">{value}</span></div>;
}
