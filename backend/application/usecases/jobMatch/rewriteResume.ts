import Groq from "groq-sdk";
import type { AuditResult } from "./auditResume.js";

export interface RewriteResult {
  rewrittenResume: string;
  improvements: {
    title: string;
    explanation: string;
  }[];
}

export async function rewriteResumeWithAudit(
  resumeText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  audit: AuditResult
): Promise<RewriteResult> {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `You are an expert resume writer and career coach.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code blocks.
Do NOT write explanations before or after the JSON.

ORIGINAL RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

AUDIT FINDINGS:
- Match Score: ${audit.matchScore}/100
- Missing Keywords: ${audit.missingKeywords.join(", ")}
- Red Flags: ${audit.redFlags.join(" | ")}
- Weak Sections: ${audit.weakSections.map((s) => s.section).join(", ")}
- Generic Issues: ${audit.genericIssues.join(" | ")}

Return exactly:

{
  "rewrittenResume": "string",
  "improvements": [
    {
      "title": "string",
      "explanation": "string"
    }
  ]
}`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 2500,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content?.trim() || "";


  try {
    const parsed = JSON.parse(content);

    return {
      rewrittenResume: parsed.rewrittenResume || "",
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
    };
  } catch (error) {
    console.error("JSON PARSE ERROR:", error);
    console.error("RAW CONTENT:", content);

    throw new Error(
      `AI returned invalid JSON. Raw response: ${content}`
    );
  }
}