'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePostHog } from 'posthog-js/react';
import { CheckCircle2, XCircle, Award, Download } from 'lucide-react';

type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_id: string;
  explanation: string | null;
};

export function LessonQuiz({
  questions,
  lessonId,
  bootcampId,
  isFinalDay,
  nextUrl,
}: {
  questions: Question[];
  lessonId: string;
  bootcampId: string;
  isFinalDay: boolean;
  nextUrl: string;
}) {
  const supabase = createClient();
  const ph = usePostHog();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [certSerial, setCertSerial] = useState<string | null>(null);

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correct_id).length
    : 0;

  async function submit() {
    setSubmitted(true);
    setSaving(true);
    const correct = questions.filter((q) => answers[q.id] === q.correct_id).length;
    const percent = Math.round((correct / questions.length) * 100);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Save lesson progress
    await supabase.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        quiz_score: percent,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

    ph?.capture('lesson_completed', {
      lesson_id: lessonId,
      bootcamp_id: bootcampId,
      quiz_score: percent,
      is_final_day: isFinalDay,
    });

    // On the final day, try to issue a certificate
    if (isFinalDay) {
      const { data: cert } = await supabase
        .rpc('try_issue_certificate', { p_bootcamp_id: bootcampId });
      if (cert && (cert as any).serial) {
        setCertSerial((cert as any).serial);
        ph?.capture('certificate_earned', {
          bootcamp_id: bootcampId,
          serial: (cert as any).serial,
        });
      }
    }

    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => (
        <fieldset key={q.id} className="card">
          <legend className="font-medium mb-4">
            <span className="font-mono text-xs text-ink-muted mr-2">Q{idx + 1}</span>
            {q.prompt}
          </legend>

          <div className="space-y-2">
            {q.options.map((opt) => {
              const picked  = answers[q.id] === opt.id;
              const correct = submitted && opt.id === q.correct_id;
              const wrong   = submitted && picked && opt.id !== q.correct_id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${picked  ? 'border-ink bg-ink/5' : 'border-ink/15 hover:border-ink/40'}
                    ${correct ? '!border-primary-600 bg-primary-50' : ''}
                    ${wrong   ? '!border-red-400 bg-red-50' : ''}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={picked}
                    disabled={submitted}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt.id })}
                    className="accent-primary-800"
                  />
                  <span className="flex-1">{opt.text}</span>
                  {correct && <CheckCircle2 className="h-5 w-5 text-primary-800" aria-label="Correct" />}
                  {wrong   && <XCircle     className="h-5 w-5 text-red-600"    aria-label="Incorrect" />}
                </label>
              );
            })}
          </div>

          {submitted && q.explanation && (
            <p className="mt-4 text-sm text-ink-soft bg-sand-100 p-3 rounded-lg">
              <strong>Explanation:</strong> {q.explanation}
            </p>
          )}
        </fieldset>
      ))}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length || saving}
          className="btn-primary"
        >
          Submit answers
        </button>
      ) : certSerial ? (
        <div
          role="status"
          aria-live="polite"
          className="card !border-primary-600/30 bg-gradient-to-br from-primary-50 to-sand-100"
        >
          <div className="flex items-center gap-3 text-primary-800">
            <Award className="h-7 w-7" aria-hidden="true" />
            <h3 className="font-display text-2xl">Sprint complete.</h3>
          </div>
          <p className="mt-3 text-ink-soft">
            You scored <strong>{score}/{questions.length}</strong> on the final quiz.
            Your certificate has been issued —{' '}
            <span className="font-mono text-xs">{certSerial}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/api/certificates/${certSerial}`}
              target="_blank"
              rel="noopener"
              className="btn-primary"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </a>
            <Link href={`/verify/${certSerial}`} className="btn-ghost">
              View verification page
            </Link>
          </div>
        </div>
      ) : (
        <div className="card bg-primary-50 border-primary-200 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-display text-2xl">
              {score} / {questions.length} correct
            </p>
            <p className="text-sm text-ink-soft mt-1">
              {score === questions.length ? 'Flawless. On to tomorrow.' : 'Not bad — review the explanations above.'}
            </p>
          </div>
          <Link href={nextUrl} className="btn-primary">Continue →</Link>
        </div>
      )}
    </div>
  );
}
