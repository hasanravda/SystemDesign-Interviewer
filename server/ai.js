import OpenAI from 'openai';

const model = process.env.OPENAI_MODEL || 'gpt-5.5';
const baseInstructions = `You are System Design Copilot: an autonomous staff engineer and rigorous software interview coach.
Every output must be derived from the user's exact problem and the accumulated session decisions. Never reuse a canned architecture or assume the problem is a URL shortener.
Be concrete, technically correct, and explicit about tradeoffs. Match generated code, tests, APIs, and diagrams to prior decisions.
Mermaid values must contain valid Mermaid syntax without markdown fences. Code must be runnable rather than pseudocode. Never present estimated performance as measured; label estimates and assumptions explicitly.`;

const requirementsSchema = {
  type: 'object', additionalProperties: false,
  required: ['title', 'category', 'summary', 'functional', 'nonFunctional', 'constraints', 'assumptions', 'clarifyingQuestions'],
  properties: {
    title: { type: 'string' }, category: { type: 'string' }, summary: { type: 'string' },
    functional: { type: 'array', items: { type: 'string' } },
    nonFunctional: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    clarifyingQuestions: { type: 'array', items: { type: 'string' } }
  }
};

const artifactSchema = {
  type: 'object', additionalProperties: false,
  required: ['title', 'summary', 'sections', 'diagrams', 'codeFiles', 'metrics', 'nextQuestion'],
  properties: {
    title: { type: 'string' }, summary: { type: 'string' },
    sections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'content'], properties: { title: { type: 'string' }, content: { type: 'string' } } } },
    diagrams: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'mermaid'], properties: { title: { type: 'string' }, mermaid: { type: 'string' } } } },
    codeFiles: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['path', 'language', 'content'], properties: { path: { type: 'string' }, language: { type: 'string' }, content: { type: 'string' } } } },
    metrics: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'value', 'detail'], properties: { label: { type: 'string' }, value: { type: 'string' }, detail: { type: 'string' } } } },
    nextQuestion: { type: 'string' }
  }
};

function client() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured on the server.');
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function structured(name, schema, input) {
  const response = await client().responses.create({
    model,
    reasoning: { effort: 'medium' },
    instructions: baseInstructions,
    input,
    text: { format: { type: 'json_schema', name, strict: true, schema } }
  });
  return JSON.parse(response.output_text);
}

export function gatherRequirements(problem) {
  return structured('requirements', requirementsSchema, `Analyze this interview problem: ${problem}\nInfer only requirements relevant to this exact problem. End with high-value clarifying questions.`);
}

const phasePrompts = {
  design: 'Create high-level and deep design. Include system context, architecture, data flow, service interaction, components, REST APIs with errors, database tables/indexes/relationships, caching, and messaging when applicable. Provide multiple Mermaid diagrams.',
  mvp: 'Generate a coherent runnable MVP for the chosen backend and frontend stacks. Include folder structure, environment variables, Docker Compose, setup/run commands, and the most important real source files. Do not use pseudocode.',
  testing: 'Generate unit, integration, and API tests that match the generated MVP. Include executable test commands and an honest proposed coverage plan. Also generate k6 and JMeter-compatible load testing assets for 100, 1,000, and 10,000 users.',
  bottlenecks: 'Analyze likely database, cache, API, and network bottlenecks based on all prior decisions. Give evidence, detection signals, and prioritized remediations. Include an improved architecture Mermaid diagram.',
  scale: 'Plan for 100 million daily active users or beyond. Calculate capacity planning with stated assumptions, QPS, storage, bandwidth, and compute. Cover load balancing, gateway, CDN, caching, sharding, replication, events, multi-region deployment, retries, circuit breakers, rate limiting, and disaster recovery.',
  report: 'Produce an optimization report comparing initial and optimized latency, throughput, cost, and availability. Explain each optimization and create a concise pull request summary.',
  interview: 'Act as an interviewer. Ask one challenging follow-up question adapted to the candidate progress. Include a scoring rubric for requirements, scalability, database, APIs, tradeoffs, and communication, plus one progressive hint.'
};

export function generatePhase(session, phase) {
  if (!phasePrompts[phase]) throw Object.assign(new Error('Unknown phase.'), { status: 400 });
  const context = JSON.stringify({ problem: session.problem, preferences: session.preferences, requirements: session.requirements, completedPhases: session.artifacts }, null, 2);
  return structured(`${phase}_artifact`, artifactSchema, `${phasePrompts[phase]}\n\nAuthoritative session context:\n${context}`);
}

export function answerFollowUp(session, message, mode) {
  const context = JSON.stringify({ problem: session.problem, requirements: session.requirements, artifacts: session.artifacts }, null, 2);
  return structured('follow_up', artifactSchema, `Mode: ${mode}. Respond to the user's message and update or critique the design as appropriate.\nUser: ${message}\nSession context: ${context}`);
}
