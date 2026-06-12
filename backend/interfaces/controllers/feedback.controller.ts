import type { Response }    from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Feedback        from '../../infrastructure/database/models/Feedback.model.js';
import Session         from '../../infrastructure/database/models/Session.model.js';
import Interview       from '../../infrastructure/database/models/Interview.model.js';
import { generateFeedback } from '../../application/usecases/feedback/generateFeedback.js';

// POST /api/feedback/generate
export const generateFeedbackController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    // Return cached feedback if already generated
    const existing = await Feedback.findOne({ sessionId });
    if (existing) {
      res.status(200).json({
        success: true,
        message: 'Feedback already generated',
        data:    { feedback: existing },
      });
      return;
    }

    // Load session + interview
    const session = await Session.findOne({
      _id:    sessionId,
      userId: req.userId,
      status: 'completed',
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Completed session not found. Submit the interview first.',
      });
      return;
    }

    const interview = await Interview.findById(session.interviewId);
    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    // Call AI
    const aiResult = await generateFeedback({
      category:   interview.category,
      difficulty: interview.difficulty,
      questions:  interview.questions.map((q) => ({
        id:                q.id,
        text:              q.text,
        expectedKeyPoints: q.expectedKeyPoints,
      })),
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        text:       a.text,
        timeSpent:  a.timeSpent,
      })),
    });

    // Enrich questionFeedback with question/answer text
    const enriched = aiResult.questionFeedback.map((qf) => {
      const q = interview.questions.find((q) => q.id === qf.questionId);
      const a = session.answers.find((a) => a.questionId === qf.questionId);
      return {
        ...qf,
        questionText: q?.text  || '',
        answerText:   a?.text  || '',
      };
    });

    // Save to DB
    // Save or update existing feedback
const feedback = await Feedback.findOneAndUpdate(
  { sessionId },
  {
    sessionId,
    interviewId: interview._id,
    userId: req.userId,
    scores: aiResult.scores,
    summary: aiResult.summary,
    strengths: aiResult.strengths,
    weaknesses: aiResult.weaknesses,
    suggestions: aiResult.suggestions,
    questionFeedback: enriched,
    generatedAt: new Date(),
  },
  {
    new: true,
    upsert: true,
  }
);

    res.status(201).json({
      success: true,
      message: 'Feedback generated',
      data:    { feedback },
    });
  } catch (err: any) {
    console.error('Feedback generation error:', err.message);

    if (err.message?.includes('invalid JSON')) {
      res.status(500).json({ success: false, message: 'AI returned invalid response — try again' });
      return;
    }
   if (err.status === 401) {
  res.status(500).json({
    success: false,
    message: 'Check GROQ_API_KEY in .env'
  });
  return;
}

    res.status(500).json({ success: false, message: 'Failed to generate feedback' });
  }
};

// GET /api/feedback/:sessionId
export const getFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findOne({
      sessionId: req.params.sessionId,
      userId:    req.userId,
    });

    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback not found' });
      return;
    }

    res.status(200).json({ success: true, data: { feedback } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
};

// GET /api/feedback — list all feedback for user
export const getMyFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('interviewId', 'title category difficulty')
      .lean();

    res.status(200).json({ success: true, data: { feedbacks } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch feedbacks' });
  }
};