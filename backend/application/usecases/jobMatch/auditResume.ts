import Groq from "groq-sdk";



export interface AuditInput {
  resumeText:     string;
  jobTitle:       string;
  companyName:    string;
  jobDescription: string;
}

export interface AuditResult {
  matchScore:        number;
  missingKeywords:   string[];
  redFlags:          string[];
  strongSections:    { section: string; reason: string }[];
  weakSections:      { section: string; reason: string }[];
  genericIssues:     string[];
  comparisonInsight: string;
}

export async function auditResumeAgainstJob(input: AuditInput): Promise<AuditResult> {
     const client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
  const { resumeText, jobTitle, companyName, jobDescription } = input;

  const prompt = `You are a senior recruiter and hiring manager at ${companyName} hiring for the role of ${jobTitle}.

You have 10 seconds to decide if a resume moves forward. Be brutally honest, specific, and direct.

RESUME:
"""
${resumeText.slice(0, 5000)}
"""

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 3000)}
"""

Analyse this resume against the job description from the perspective of a senior recruiter at ${companyName}.

Return ONLY valid JSON, no markdown, no extra text:

{
  "matchScore": <number 0-100, be honest>,
  "missingKeywords": [
    "<exact keyword/skill/tool/phrase from JD not in resume>",
    "<another missing keyword>"
  ],
  "redFlags": [
    "<biggest red flag a hiring manager notices in under 10 seconds>",
    "<second red flag>",
    "<third red flag>"
  ],
  "strongSections": [
    { "section": "<section name e.g. Work Experience>", "reason": "<specific reason why it is strong>" },
    { "section": "<another strong section>", "reason": "<why>" }
  ],
  "weakSections": [
    { "section": "<weak section name>", "reason": "<specific reason why it is weak>" },
    { "section": "<another weak section>", "reason": "<why>" }
  ],
  "genericIssues": [
    "<specific thing that makes candidate look underqualified, unclear, or generic>",
    "<another generic issue>",
    "<third issue>"
  ],
  "comparisonInsight": "<2-3 sentences comparing this resume to a strong candidate for this exact role at ${companyName}. Be specific about the gap.>"
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
  

  let result: AuditResult;
  try {
    result = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON for audit');
  }

  result.matchScore = Math.min(100, Math.max(0, Number(result.matchScore) || 0));
  return result;
}