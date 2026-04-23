'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Loader2, ArrowLeft, Save, Wand2 } from 'lucide-react';

// ---------- Types matching the API output ----------
type Question = {
  prompt: string;
  options: { id: string; text: string }[];
  correct_id: string;
  explanation: string;
};
type Lesson = {
  day_number: number;
  title: string;
  content_md: string;
  estimated_minutes: number;
  questions: Question[];
};
type Curriculum = {
  tagline: string;
  description: string;
  lessons: Lesson[];
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export default function NewBootcampPage() {
  const router = useRouter();
  const supabase = createClient();

  // Metadata
  const [title, setTitle]         = useState('');
  const [category, setCategory]   = useState('AI');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Prompt inputs
  const [topic, setTopic]       = useState('');
  const [audience, setAudience] = useState('beginner');
  const [styleNote, setStyleNote] = useState('');

  // Flow state
  const [stage, setStage] = useState<'form' | 'generating' | 'review'>('form');
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [saving, setSaving] = useState(false);

  const slug = useMemo(() => slugify(title), [title]);

  async function onGenerate() {
    setError(null);
    if (!title.trim())  { setError('Give your bootcamp a title first.'); return; }
    if (topic.trim().length < 8) { setError('Describe the topic in more detail.'); return; }

    setStage('generating');
    try {
      const res = await fetch('/api/generate-curriculum', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, audience, style: styleNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generation failed');
      setCurriculum(json.curriculum as Curriculum);
      setStage('review');
    } catch (e: any) {
      setError(e.message);
      setStage('form');
    }
  }

  function updateLesson(idx: number, patch: Partial<Lesson>) {
    if (!curriculum) return;
    const next = { ...curriculum, lessons: curriculum.lessons.map((l, i) => i === idx ? { ...l, ...patch } : l) };
    setCurriculum(next);
  }

  async function onSave(publish: boolean) {
    if (!curriculum) return;
    setError(null);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Insert bootcamp
      const { data: bc, error: bcErr } = await supabase
        .from('bootcamps')
        .insert({
          slug, title, category, difficulty,
          tagline: curriculum.tagline,
          description: curriculum.description,
          creator_id: user.id,
          is_published: publish,
        })
        .select('id')
        .single();
      if (bcErr || !bc) throw new Error(bcErr?.message || 'Could not create bootcamp');

      // 2. Insert lessons
      const lessonRows = curriculum.lessons.map((l) => ({
        bootcamp_id: bc.id,
        day_number: l.day_number,
        title: l.title,
        content_md: l.content_md,
        estimated_minutes: l.estimated_minutes,
      }));
      const { data: insertedLessons, error: lErr } = await supabase
        .from('lessons').insert(lessonRows).select('id, day_number');
      if (lErr || !insertedLessons) throw new Error(lErr?.message || 'Could not create lessons');

      // 3. Insert quiz questions keyed by day_number → lesson_id
      const byDay: Record<number, string> = {};
      for (const l of insertedLessons) byDay[l.day_number] = l.id;

      const quizRows = curriculum.lessons.flatMap((l) =>
        l.questions.map((q, pos) => ({
          lesson_id: byDay[l.day_number],
          prompt: q.prompt,
          options: q.options,
          correct_id: q.correct_id,
          explanation: q.explanation,
          position: pos,
        }))
      );
      if (quizRows.length) {
        const { error: qErr } = await supabase.from('quiz_questions').insert(quizRows);
        if (qErr) throw new Error(qErr.message);
      }

      router.push('/admin');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ============ Render ============
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Admin
      </Link>

      <h1 className="mt-6 font-display text-display-md">New bootcamp</h1>
      <p className="mt-2 text-ink-soft">Describe the skill. Claude will draft all 7 days.</p>

      {error && (
        <p role="alert" className="mt-6 text-sm p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
          {error}
        </p>
      )}

      {/* ---------- METADATA + PROMPT ---------- */}
      {stage !== 'review' && (
        <section className="mt-10 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Bootcamp title" htmlFor="title">
              <input
                id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Prompt Engineering in 7 Days"
                className="field" required
              />
              {title && <p className="mt-1.5 text-xs text-ink-muted font-mono">/{slug}</p>}
            </Field>
            <Field label="Category" htmlFor="category">
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
                <option>AI</option><option>Web Dev</option><option>Data</option><option>Design</option><option>Career</option>
              </select>
            </Field>
            <Field label="Difficulty" htmlFor="difficulty">
              <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="field">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Target audience" htmlFor="audience">
              <input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="field" placeholder="e.g. backend engineers new to LLMs" />
            </Field>
          </div>

          <Field label="What should this bootcamp teach?" htmlFor="topic" hint="Be specific. The more concrete, the better the curriculum.">
            <textarea
              id="topic" rows={4}
              value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="A hands-on sprint that teaches how to build a RAG pipeline with pgvector and OpenAI embeddings. By day 7 the learner should have a working Q&A app over their own documents."
              className="field resize-none"
              required
            />
          </Field>

          <Field label="Style notes (optional)" htmlFor="style" hint="Tone, examples to include/avoid, prerequisites to assume…">
            <input id="style" value={styleNote} onChange={(e) => setStyleNote(e.target.value)} className="field" placeholder="Assume comfort with Python; prefer TypeScript examples where possible." />
          </Field>

          <div className="pt-4">
            <button
              type="button"
              onClick={onGenerate}
              disabled={stage === 'generating' || !title.trim() || topic.trim().length < 8}
              className="btn-primary"
            >
              {stage === 'generating' ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" aria-hidden="true" /> Generate with AI</>
              )}
            </button>
            <p className="mt-3 text-xs text-ink-muted">Usually takes 20–40 seconds. Powered by Claude Sonnet 4.6.</p>
          </div>
        </section>
      )}

      {/* ---------- GENERATING STATE ---------- */}
      {stage === 'generating' && (
        <div className="mt-10 card text-center py-16" role="status" aria-live="polite">
          <Wand2 className="h-8 w-8 mx-auto text-primary-800 animate-pulse" aria-hidden="true" />
          <p className="mt-4 font-display text-xl">Drafting your curriculum…</p>
          <p className="mt-2 text-sm text-ink-muted">7 lessons, ~20 quiz questions. Hang tight.</p>
        </div>
      )}

      {/* ---------- REVIEW / EDIT ---------- */}
      {stage === 'review' && curriculum && (
        <section className="mt-10 space-y-6">
          <div className="card bg-primary-50/40 border-primary-600/20">
            <p className="chip mb-3">Draft</p>
            <Field label="Tagline" htmlFor="tagline">
              <input
                id="tagline" value={curriculum.tagline}
                onChange={(e) => setCurriculum({ ...curriculum, tagline: e.target.value })}
                className="field font-display text-lg"
              />
            </Field>
            <div className="mt-4">
              <Field label="Description" htmlFor="desc">
                <textarea
                  id="desc" rows={3} value={curriculum.description}
                  onChange={(e) => setCurriculum({ ...curriculum, description: e.target.value })}
                  className="field resize-none"
                />
              </Field>
            </div>
          </div>

          {curriculum.lessons.map((lesson, idx) => (
            <details key={lesson.day_number} className="card" open={idx === 0}>
              <summary className="cursor-pointer flex items-center justify-between list-none">
                <div>
                  <span className="font-mono text-xs text-ink-muted">Day {lesson.day_number}</span>
                  <h3 className="font-display text-xl mt-1">{lesson.title}</h3>
                </div>
                <span className="text-xs text-ink-muted">{lesson.questions.length} questions</span>
              </summary>

              <div className="mt-6 space-y-4 border-t border-ink/10 pt-6">
                <Field label="Title" htmlFor={`t-${idx}`}>
                  <input id={`t-${idx}`} value={lesson.title}
                    onChange={(e) => updateLesson(idx, { title: e.target.value })} className="field" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Estimated minutes" htmlFor={`m-${idx}`}>
                    <input id={`m-${idx}`} type="number" min={5} max={60}
                      value={lesson.estimated_minutes}
                      onChange={(e) => updateLesson(idx, { estimated_minutes: Number(e.target.value) })}
                      className="field" />
                  </Field>
                </div>
                <Field label="Content (markdown)" htmlFor={`c-${idx}`}>
                  <textarea id={`c-${idx}`} rows={10} value={lesson.content_md}
                    onChange={(e) => updateLesson(idx, { content_md: e.target.value })}
                    className="field font-mono text-sm resize-y" />
                </Field>

                <div>
                  <h4 className="font-medium text-sm mb-3">Quiz questions</h4>
                  <ul className="space-y-4">
                    {lesson.questions.map((q, qi) => (
                      <li key={qi} className="rounded-lg border border-ink/10 p-4 bg-sand-50">
                        <p className="font-medium text-sm">{qi + 1}. {q.prompt}</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {q.options.map((o) => (
                            <li key={o.id} className={o.id === q.correct_id ? 'text-primary-800 font-medium' : 'text-ink-soft'}>
                              {o.id}. {o.text} {o.id === q.correct_id && '✓'}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-ink-muted italic">{q.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}

          <div className="flex items-center gap-3 pt-4 sticky bottom-4 bg-sand-50/90 backdrop-blur-sm p-4 rounded-full border border-ink/10 shadow-lg">
            <button onClick={() => onSave(false)} disabled={saving} className="btn-ghost flex-1">
              {saving ? 'Saving…' : 'Save as draft'}
            </button>
            <button onClick={() => onSave(true)}  disabled={saving} className="btn-primary flex-1">
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save & publish'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- Tiny field helper ----------
function Field({ label, htmlFor, hint, children }: {
  label: string; htmlFor: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
