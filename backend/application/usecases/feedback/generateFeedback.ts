import Groq from "groq-sdk";


export interface FeedbackInput {
  category:  string;
  difficulty: string;
  questions: {
    id:                string;
    text:              string;
    expectedKeyPoints: string[];
  }[];
  answers: {
    questionId: string;
    text:       string;
    timeSpent:  number;
  }[];
}

export interface GeneratedFeedback {
  scores: {
    technical:     number;
    communication: number;
    confidence:    number;
    overall:       number;
  };
  summary:     string;
  strengths:   string[];
  weaknesses:  string[];
  suggestions: string[];
  questionFeedback: {
    questionId:       string;
    score:            number;
    feedback:         string;
    keyPointsCovered: string[];
    keyPointsMissed:  string[];
  }[];
}

export async function generateFeedback(input: FeedbackInput): Promise<GeneratedFeedback> {
    
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
  const { category, difficulty, questions, answers } = input;

  // Build Q&A pairs for the prompt
  const qaPairs = questions.map((q) => {
    const answer = answers.find((a) => a.questionId === q.id);
    const mins   = answer ? Math.floor((answer.timeSpent || 0) / 60) : 0;
    const secs   = answer ? (answer.timeSpent || 0) % 60 : 0;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return `
QUESTION [${q.id}]: ${q.text}
EXPECTED KEY POINTS: ${q.expectedKeyPoints.join(' | ')}
CANDIDATE ANSWER (time spent: ${timeStr}):
${answer?.text?.trim() || '[No answer provided]'}
---`;
  }).join('\n');

  const prompt = `You are a senior technical interviewer at a top tech company evaluating a ${difficulty} level ${category} developer interview.

Analyse each question and answer carefully, then produce a structured evaluation.

INTERVIEW SESSION:
${qaPairs}

SCORING RUBRIC:
- Technical Score (0-100): Accuracy of technical knowledge, depth of understanding, correct use of terminology
- Communication Score (0-100): Clarity of explanation, structure, use of examples, coherence  
- Confidence Score (0-100): Completeness of answers, directness, certainty (not hedging everything)
- Overall Score: Weighted average (technical×0.5 + communication×0.3 + confidence×0.2)

Per-question score (0-100):
- 0-30:  Wrong or completely blank
- 31-50: Vague, major gaps
- 51-70: Partially correct, some key points missing
- 71-85: Good answer, minor gaps
- 86-100: Excellent — comprehensive, accurate, well-structured

IMPORTANT:
- Be honest and specific — do not inflate scores
- keyPointsCovered: only list points actually addressed by the candidate
- keyPointsMissed: key points from EXPECTED KEY POINTS that were NOT covered
- suggestions: actionable and specific (e.g. "Study React reconciliation algorithm" not "learn more React")
- summary: 2-3 sentences overall assessment, mention category and level

Return ONLY valid JSON, no markdown fences, no explanation:

{
  "scores": {
    "technical": <number 0-100>,
    "communication": <number 0-100>,
    "confidence": <number 0-100>,
    "overall": <number 0-100>
  },
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness>", "<specific weakness>"],
  "suggestions": ["<actionable suggestion>", "<actionable suggestion>", "<actionable suggestion>"],
  "questionFeedback": [
    {
      "questionId": "<id>",
      "score": <number 0-100>,
      "feedback": "<2-3 sentence specific feedback for this answer>",
      "keyPointsCovered": ["<point actually mentioned>"],
      "keyPointsMissed": ["<expected point not covered>"]
    }
  ]
}`;

 const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
});

const text = completion.choices[0]?.message?.content?.trim();

if (!text) {
  throw new Error("No response from Groq");
}

const cleaned = text
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();

  let result: GeneratedFeedback;
  try {
    result = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON for feedback');
  }

  // Clamp all scores to 0-100
  result.scores.technical     = Math.min(100, Math.max(0, result.scores.technical));
  result.scores.communication = Math.min(100, Math.max(0, result.scores.communication));
  result.scores.confidence    = Math.min(100, Math.max(0, result.scores.confidence));
  result.scores.overall       = Math.min(100, Math.max(0, result.scores.overall));

  return result;
}