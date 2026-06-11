import Groq from "groq-sdk";




export interface GeneratedQuestion {
  id: string;
  text: string;
  expectedKeyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  category: string;
}

const categoryContext: Record<string, string> = {
  frontend: `
    Focus areas: React, TypeScript, JavaScript (ES6+), CSS/Flexbox/Grid, 
    browser APIs, performance optimization, accessibility (a11y), 
    state management (Redux/Zustand), testing (Jest/RTL), bundlers (Vite/Webpack).
    Ask about real-world problems, not just definitions.`,

  backend: `
    Focus areas: Node.js, Express/Fastify, REST API design, database design 
    (MongoDB/PostgreSQL), authentication (JWT/OAuth), caching (Redis), 
    message queues, error handling, security best practices, API versioning.
    Include scenario-based questions about system behavior.`,

  fullstack: `
    Focus areas: End-to-end application architecture, how frontend and backend 
    interact, API design, authentication flows, deployment (Docker/CI-CD), 
    database choices, monorepo vs microservices, performance at both layers.`,

  'system-design': `
    Focus areas: Scalability patterns, load balancing, database sharding, 
    CAP theorem, microservices, event-driven architecture, caching strategies,
    CDN, message queues (Kafka/RabbitMQ), design patterns for high availability.
    All questions should involve designing a real system from scratch.`,

  hr: `
    Focus areas: STAR method behavioral questions, leadership, conflict 
    resolution, failure & learning stories, career goals, teamwork, 
    adaptability, time management, communication. 
    Questions should be open-ended and situational.`,

  dsa: `
    Focus areas: Arrays, linked lists, trees, graphs, dynamic programming,
    sorting algorithms, hash maps, recursion, BFS/DFS, time/space complexity.
    Ask the candidate to explain their approach and analyze trade-offs.`,
};

const timeLimitByDifficulty: Record<string, number> = {
  easy: 120,
  medium: 180,
  hard: 300,
};

export async function generateInterviewQuestions(
  category: string,
  difficulty: string,
  count: number
): Promise<GeneratedQuestion[]> {
    
  

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  const context = categoryContext[category] || categoryContext.fullstack;
  const timeLimit = timeLimitByDifficulty[difficulty] || 180;

  const prompt = `You are an expert technical interviewer at a top tech company.

Generate exactly ${count} interview questions for a ${difficulty.toUpperCase()} level ${category} developer interview.

Category context:
${context}

Rules:
- Questions must match ${difficulty} difficulty strictly
- Each question should be distinct — no overlapping topics
- For technical categories: mix conceptual, practical, and problem-solving
- For HR: use real situational scenarios
- expectedKeyPoints: 3-5 bullet points the interviewer expects in a strong answer
- Keep question text concise (1-3 sentences max)
- timeLimit is in seconds: easy=120, medium=180, hard=300

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
Format:
[
  {
    "id": "q1",
    "text": "question text here",
    "expectedKeyPoints": ["point 1", "point 2", "point 3"],
    "difficulty": "${difficulty}",
    "timeLimit": ${timeLimit},
    "category": "${category}"
  }
]`;
try {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
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

  const questions: GeneratedQuestion[] = JSON.parse(cleaned);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("AI returned empty question list");
  }

  return questions.map((q, i) => ({
    ...q,
    id: `q${i + 1}`,
  }));
} catch (error) {
  console.error("GROQ ERROR:", error);
  throw error;
}
}