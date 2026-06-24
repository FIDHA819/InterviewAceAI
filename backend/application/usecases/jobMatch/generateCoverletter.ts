import Groq from "groq-sdk";

export interface CoverLetterResult {
  coverLetter: string;
  applicationEmail: string;
}

export async function generateCoverLetterAndEmail(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  rewrittenResume: string
): Promise<CoverLetterResult> {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `
You are an expert career coach.

Return ONLY a valid JSON object.

Do NOT use markdown.
Do NOT use code blocks.
Do NOT add explanations before or after the JSON.

CANDIDATE:
${candidateName} (${candidateEmail})

ROLE:
${jobTitle} at ${companyName}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

OPTIMIZED RESUME:
${rewrittenResume.slice(0, 2000)}

Create:

1. A personalized cover letter
2. A professional application email

Required JSON format:

{
  "coverLetter": "full cover letter",
  "applicationEmail": "subject line and email body"
}
`;

  try {
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

    

    // First attempt
    try {
      const parsed = JSON.parse(content);

      return {
        coverLetter: parsed.coverLetter || "",
        applicationEmail: parsed.applicationEmail || "",
      };
    } catch {
      // Backup extraction if model wraps JSON with text
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        const jsonText = content.substring(start, end + 1);

        const parsed = JSON.parse(jsonText);

        return {
          coverLetter: parsed.coverLetter || "",
          applicationEmail: parsed.applicationEmail || "",
        };
      }

      throw new Error("Could not locate valid JSON in AI response");
    }
  } catch (error: any) {
    console.error("COVER LETTER GENERATION ERROR:");
    console.error(error);

    throw new Error(
      error?.message || "Failed to generate cover letter"
    );
  }
}