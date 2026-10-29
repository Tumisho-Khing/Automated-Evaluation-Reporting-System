import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import ConfirmationCard from '@/components/ConfirmationCard';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorState from '@/components/ErrorState';
import { signOutStudent } from '@/lib/attendance';
import { LogOut, Star } from 'lucide-react';

type Result = { name: string; timeOut: string };
type RatingKey = 'course' | 'facilitator' | 'journey';

const courseQuestions = [
  'The course outcomes were clear and specific and addressed the outcomes.',
  'The course content was current and relevant.',
  'Topics were presented in a logical sequence and flow.',
  'Learning activities were relevant to the course content.',
  'Sufficient time was allocated for learning activities.',
  'Sufficient time was allocated for discussion and understanding of the content.',
  'Material presented was easily readable, visible, attractive, useful, understandable and of a high standard.',
  'Overall, how would you rate the content of the course?',
];

const facilitatorQuestions = [
  'Was well prepared, knowledgeable and able to share a practical application of his/her knowledge.',
  'Was able to relay learnings effectively.',
  'Was enthusiastic and approachable and answered questions effectively.',
  'Gave clear instructions regarding exercises, use of materials etc.',
  'Handled course mechanics effectively (timing, course breaks, equipment etc.).',
  'Ensured that I was actively involved during each stage of the learning solution by keeping the programme varied, dynamic and interesting.',
  'Overall, how would you rate the facilitator?',
];

const journeyQuestions = [
  'The learning solution outcomes met my training needs and expectations.',
  'Given the opportunity, I will be able to apply what I have learnt, in my job.',
  'The learning climate and atmosphere was positive.',
  'I would recommend this programme to others.',
  'Overall, how would you rate the course?',
];

export default function SignOutPage() {
  const [studentNumber, setStudentNumber] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [programme, setProgramme] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ratings, setRatings] = useState<Record<RatingKey, Record<number, number>>>({ course: {}, facilitator: {}, journey: {} });
  const [comments, setComments] = useState({ course: '', facilitator: '', journey: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const setRating = (section: RatingKey, index: number, value: number) => {
    setRatings((current) => ({ ...current, [section]: { ...current[section], [index]: value } }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!studentNumber.trim()) {
      setError('Please enter your student number before submitting your evaluation.');
      return;
    }

    const courseRatings = courseQuestions.map((_, index) => ratings.course[index] || 0);
    const facilitatorRatings = facilitatorQuestions.map((_, index) => ratings.facilitator[index] || 0);
    const journeyRatings = journeyQuestions.map((_, index) => ratings.journey[index] || 0);

    setLoading(true);
    try {
      const { student, attendance } = await signOutStudent(studentNumber, {
        candidateName,
        programme,
        facilitator,
        venue,
        cellPhone: '',
        workTel: '',
        furtherStudies: {
          partTime: false,
          fullTime: false,
          softSkills: false,
          businessCourses: false,
        },
        courseRatings,
        facilitatorRatings,
        journeyRatings,
        courseComments: comments.course,
        facilitatorComments: comments.facilitator,
        journeyComments: comments.journey,
      });
      setResult({
        name: `${student.first_name} ${student.last_name}`,
        timeOut: attendance.time_out ? new Date(attendance.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      });
      setStudentNumber('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PageLayout>
        <ConfirmationCard title="Successfully Signed Out">
          <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">Student Name</span><span className="font-semibold text-gray-900 text-right">{result.name}</span></div>
          <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">Time Out</span><span className="font-semibold text-gray-900 text-right">{result.timeOut}</span></div>
          <div className="pt-2"><Button onClick={() => setResult(null)} variant="secondary">Complete Another Sign Out</Button></div>
        </ConfirmationCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-sm p-5 sm:p-8 fade-in">
        <div className="text-center border-b border-gray-200 pb-5 mb-6">
          <img src="/ngi_logo.png" alt="NewBridge Training Institute" className="h-14 sm:h-16 mx-auto object-contain" />
          <h1 className="mt-4 text-xl sm:text-2xl font-extrabold uppercase text-gray-900 tracking-wide">Learning Evaluation Form</h1>
          <p className="mt-2 text-xs text-gray-500">Your opinions and comments will assist us in improving learning efficiency.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <section className="border border-gray-300">
            <div className="grid sm:grid-cols-2 gap-px bg-gray-300">
              <LabeledInput label="Candidate Name" value={candidateName} onChange={setCandidateName} />
              <LabeledInput label="Facilitator Name" value={facilitator} onChange={setFacilitator} />
              <LabeledInput label="Name of Programme" value={programme} onChange={setProgramme} />
              <LabeledInput label="Venue" value={venue} onChange={setVenue} />
              <LabeledInput label="Date" value={date} onChange={setDate} type="date" />
              <LabeledInput label="Student Number (required for sign out)" value={studentNumber} onChange={setStudentNumber} required />
            </div>
            <div className="bg-gray-100 border-t border-gray-300 px-3 py-2 text-xs text-gray-600">
              Please rate each statement using the scale: <strong>1 Poor</strong> · <strong>2 Adequate</strong> · <strong>3 Good</strong> · <strong>4 Very Good</strong> · <strong>5 Excellent</strong>.
            </div>
          </section>

          <EvaluationSection title="Course Content" section="course" questions={courseQuestions} ratings={ratings.course} onRate={setRating} comments={comments.course} onComments={(value) => setComments((current) => ({ ...current, course: value }))} />
          <EvaluationSection title="Facilitator Evaluation" section="facilitator" questions={facilitatorQuestions} ratings={ratings.facilitator} onRate={setRating} comments={comments.facilitator} onComments={(value) => setComments((current) => ({ ...current, facilitator: value }))} />
          <EvaluationSection title="Your Learning Journey" section="journey" questions={journeyQuestions} ratings={ratings.journey} onRate={setRating} comments={comments.journey} onComments={(value) => setComments((current) => ({ ...current, journey: value }))} />

          {error && <ErrorState message={error} />}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-5">
            <p className="text-xs text-gray-500">Thank you for completing this evaluation form. Your comments are highly valued.</p>
            {loading ? <LoadingSpinner label="Signing out..." /> : <Button type="submit"><LogOut className="w-4 h-4" /> Submit & Sign Out</Button>}
          </div>
        </form>
      </div>
    </PageLayout>
  );
}

function LabeledInput({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block bg-white"><span className="block px-3 pt-2 text-[10px] font-semibold uppercase text-gray-500">{label}{required && <span className="text-red-500"> *</span>}</span><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nti-navy/30" placeholder="Enter details" /></label>;
}

function EvaluationSection({ title, section, questions, ratings, onRate, comments, onComments }: { title: string; section: RatingKey; questions: string[]; ratings: Record<number, number>; onRate: (section: RatingKey, index: number, value: number) => void; comments: string; onComments: (value: string) => void }) {
  return <section className="border border-gray-300"><div className="bg-gray-700 text-white px-3 py-2 text-sm font-bold uppercase tracking-wide">{title}<span className="float-right text-xs font-normal normal-case">Rating</span></div><div className="hidden sm:grid grid-cols-[1fr_210px] bg-gray-100 border-b border-gray-300 text-[10px] text-gray-500"><span className="px-3 py-2">Please use this scale to evaluate your learning solution.</span><span className="grid grid-cols-5 text-center"><span className="py-2">1</span><span className="py-2">2</span><span className="py-2">3</span><span className="py-2">4</span><span className="py-2">5</span></span></div>{questions.map((question, index) => <div key={question} className="grid sm:grid-cols-[1fr_210px] border-b border-gray-200 min-h-10"><p className="px-3 py-2 text-xs text-gray-700"><strong>{index + 1}.</strong> {question}</p><div className="grid grid-cols-5 border-t sm:border-t-0 sm:border-l border-gray-200">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="flex items-center justify-center gap-1 cursor-pointer hover:bg-nti-navy/5"><input type="radio" name={`${section}-${index}`} checked={ratings[index] === value} onChange={() => onRate(section, index, value)} className="accent-nti-navy" /><span className="sm:hidden text-[10px] text-gray-500">{value}</span></label>)}</div></div>)}<label className="block"><span className="block px-3 py-2 text-[10px] font-semibold uppercase text-gray-500">Comments and suggestions — please comment</span><textarea value={comments} onChange={(e) => onComments(e.target.value)} rows={3} className="w-full border-t border-gray-200 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nti-navy/30" placeholder="Your comments" /></label></section>;
}
