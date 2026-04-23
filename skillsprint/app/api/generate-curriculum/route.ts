import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { captureServer } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ---------- Tool schema (forces structured output) ----------
const curriculumTool: Anthropic.Tool = {
  name: 'curriculum_generated',
  description:
    'Emit the full 7-day SkillSprint curriculum as structured data. Must be called exactly once with the complete plan.',
  input_schema: {
    type: 'object',
    required: ['tagline', 'description', 'lessons'],
    properties: {
      tagline: {
        type: 'string',
        description: 'One-line promise (≤ 90 chars). Energetic, action-oriented.',
      },
      description: {
        type: 'string',
        description: '2–3 sentence overview of what the learner will build and ship by day 7.',
      },
      lessons: {
        type: 'array',
        minItems: 7,
        maxItems: 7,
        items: {
          type: 'object',
          required: ['day_number', 'title', 'content_md', 'estimated_minutes', 'questions'],
          properties: {
            day_number: { type: 'integer', minimum: 1, maximum: 7 },
            title: { type: 'string', description: 'Lesson title (≤ 70 chars), concrete and skill-focused.' },
            content_md: {
              type: 'string',
              description:
                'Lesson body in markdown. 300–500 words. Must include: a short hook, 2–3 subsections with ## headings, at least one code block or concrete example, and a brief "today\'s action" at the end.',
            },
            estimated_minutes: { type: 'integer', minimum: 10, maximum: 40 },
            questions: {
              type: 'array',
              minItems: 2,
              maxItems: 3,
              items: {
                type: 'object',
                required: ['prompt', 'options', 'correct_id', 'explanation'],
                properties: {
                  prompt: { type: 'string' },
                  options: {
                    type: 'array',
                    minItems: 3,
                    maxItems: 4,
                    items: {
                      type: 'object',
                      required: ['id', 'text'],
                      properties: {
                        id:   { type: 'string', pattern: '^[a-d]$', description: 'Single lowercase letter a–d' },
                        text: { type: 'string' },
                      },
                    },
                  },
                  correct_id: { type: 'string', pattern: '^[a-d]$' },
                  explanation: { type: 'string', description: '1–2 sentences on why it is correct.' },
                },
              },
            },
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are a senior curriculum designer for SkillSprint, a platform that ships 7-day micro-bootcamps for adult learners in tech and AI.

Your job is to produce ONE complete 7-day curriculum, always emitted through the \`curriculum_generated\` tool. Never reply in plain text.

PEDAGOGICAL PRINCIPLES
• Each day has ONE clear outcome. By day 7 the learner has shipped something concrete.
• Build momentum: days 1–2 ground intuition, days 3–5 add depth, day 6 is a consolidation/project day, day 7 synthesises and ships.
• Voice: direct, concrete, second-person ("you"). Zero fluff. Think staff-engineer mentor.
• Examples > abstractions. Include real code, real tools, real URLs when relevant.
• Each lesson is ~20 minutes of actual work; content body is 300–500 words.
• Quizzes test understanding, not recall. Distractors should be plausible.

OUTPUT DISCIPLINE
• Markdown in \`content_md\` uses \`##\` for subsections (never \`#\`).
• End every lesson with a bolded "**Today's action:**" line containing a single, shippable task.
• Quiz options use ids "a"–"d". Exactly one correct.
• No emoji in lesson content. No promotional fluff.`;

export async function POST(req: Request) {
  // ---- auth ----
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles').select('is_creator').eq('id', user.id).single();
  if (!profile?.is_creator) {
    return Response.json({ error: 'Creator access required' }, { status: 403 });
  }

  // ---- validate input ----
  const body = await req.json().catch(() => null);
  if (!body || typeof body.topic !== 'string' || body.topic.trim().length < 8) {
    return Response.json({ error: 'Please describe the bootcamp topic (≥ 8 chars).' }, { status: 400 });
  }
  const { topic, audience = 'beginner', style = '' } = body as {
    topic: string; audience?: string; style?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 500 });
  }

  // ---- call Claude ----
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = [
    `Design a 7-day SkillSprint bootcamp on the following topic:`,
    ``,
    `Topic: ${topic.trim()}`,
    `Target audience level: ${audience}`,
    style ? `Style notes from the creator: ${style}` : null,
    ``,
    `Remember: emit the full curriculum via the \`curriculum_generated\` tool. Exactly 7 lessons, 2–3 quiz questions each.`,
  ].filter(Boolean).join('\n');

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: [curriculumTool],
      tool_choice: { type: 'tool', name: 'curriculum_generated' },
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err: any) {
    console.error('Anthropic API error:', err);
    return Response.json(
      { error: err?.message || 'Generation failed' },
      { status: 502 }
    );
  }

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
  );
  if (!toolUse) {
    return Response.json({ error: 'Model did not emit structured output.' }, { status: 500 });
  }

  // Track the generation server-side — useful for cost + usage dashboards.
  await captureServer('curriculum_generated', user.id, {
    audience,
    topic_length:   topic.length,
    has_style_note: Boolean(style),
    input_tokens:   message.usage.input_tokens,
    output_tokens:  message.usage.output_tokens,
    model:          'claude-sonnet-4-6',
  });

  return Response.json({
    curriculum: toolUse.input,
    usage: {
      input_tokens:  message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    },
  });
}
