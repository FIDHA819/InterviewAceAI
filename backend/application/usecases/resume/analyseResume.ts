import Groq from "groq-sdk";


import { PDFParse } from "pdf-parse";


export interface ResumeAnalysisResult {
  atsScore:      number;
  skills:        string[];
  missingSkills: string[];
  experience:    string;
  education:     string;
  suggestions:   string[];
  jobTitles:     string[];
  keywords:      string[];
  formatScore:   number;
  contentScore:  number;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    return result.text?.trim() || "";
  } catch (err) {
    throw new Error('Failed to parse PDF — make sure it is not password-protected');
  }
}

export async function analyzeResumeWithAI(
  resumeText: string
): Promise<ResumeAnalysisResult> {
  const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

  // Truncate to ~3000 words to stay within token limits
  const truncated = resumeText.slice(0, 6000);

  const prompt = `You are an expert ATS (Applicant Tracking System) specialist and professional resume reviewer with 15 years of experience in technical recruiting.

Analyse the resume below and return a detailed evaluation.

RESUME TEXT:
"""
${truncated}
"""

SCORING CRITERIA:

ATS Score (0-100): Overall ATS compatibility
- Keyword density and relevance (30%)
- Formatting and parsability (20%)
- Section structure (20%)
- Quantified achievements (15%)
- Action verbs and clarity (15%)

Format Score (0-100): Layout, readability, structure
- Clear sections with headers
- Consistent formatting
- Appropriate length
- No tables/columns that confuse ATS

Content Score (0-100): Quality of content
- Quantified achievements (e.g. "increased sales by 30%")
- Strong action verbs
- Relevant experience descriptions
- Clear career progression

IMPORTANT RULES:
- skills: technologies, frameworks, tools, languages actually found in the resume
- missingSkills: important modern skills a developer SHOULD have based on their level/role but are NOT mentioned (e.g., Docker, CI/CD, testing frameworks)
- jobTitles: exact job titles mentioned in the resume
- keywords: important terms for ATS matching
- suggestions: specific, actionable improvements (NOT generic advice)
- Be honest — do not inflate scores
- If a section is missing (e.g. no education mentioned), say so

Return ONLY valid JSON, no markdown, no explanation:

{
  "atsScore": <number 0-100>,
  "formatScore": <number 0-100>,
  "contentScore": <number 0-100>,
  "experience": "<1-2 sentences summarising total experience and level>",
  "education": "<education summary or 'Not mentioned'>",
  "skills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "jobTitles": ["title1", "title2"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "suggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>",
    "<specific actionable suggestion 4>",
    "<specific actionable suggestion 5>"
  ]
}`;
const completion = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  max_tokens: 2000,
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
});

const cleaned =
  completion.choices[0]?.message?.content
    ?.replace(/```json\n?/g, "")
    ?.replace(/```\n?/g, "")
    ?.trim() || "";
    
  let result: ResumeAnalysisResult;
  try {
    result = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON — please try again');
  }

  // Clamp scores
  result.atsScore     = Math.min(100, Math.max(0, Number(result.atsScore)     || 0));
  result.formatScore  = Math.min(100, Math.max(0, Number(result.formatScore)  || 0));
  result.contentScore = Math.min(100, Math.max(0, Number(result.contentScore) || 0));

  return result;
}