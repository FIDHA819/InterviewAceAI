import mongoose from 'mongoose';
import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Session from '../../infrastructure/database/models/Session.model.js';
import Interview from '../../infrastructure/database/models/Interview.model.js';


// ── POST /api/sessions/start ──────────────────────────────────────────────────
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.body;

    if (!mongoose.isValidObjectId(interviewId)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID' });
      return;
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.userId });
    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    // Resume existing in-progress session if present
    const existing = await Session.findOne({
      interviewId,
      userId: req.userId,
      status: 'in-progress',
    });
    if (existing) {
      res.status(200).json({ success: true, message: 'Resuming session', data: { session: existing } });
      return;
    }

    const answers = interview.questions.map((q) => ({
      questionId: q.id,
      text:       '',
      savedAt:    new Date(),
      timeSpent:  0,
    }));

    const session = await Session.create({
      userId:               req.userId,
      interviewId,
      answers,
      currentQuestionIndex: 0,
      status:               'in-progress',
    });

    await Interview.findByIdAndUpdate(interviewId, { status: 'active' });

    res.status(201).json({ success: true, message: 'Session started', data: { session } });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ success: false, message: 'Failed to start session' });
  }
};

// ── PUT /api/sessions/:id/answer  (auto-save single answer) ──────────────────
export const saveAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId, text, timeSpent, currentQuestionIndex } = req.body;

    if (!questionId) {
      res.status(400).json({ success: false, message: 'questionId is required' });
      return;
    }

    const session = await Session.findOne({
      _id:    req.params.id,
      userId: req.userId,
      status: 'in-progress',
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Active session not found' });
      return;
    }

    const idx = session.answers.findIndex((a) => a.questionId === questionId);
    if (idx !== -1) {
      session.answers[idx].text      = typeof text === 'string' ? text : '';
      session.answers[idx].savedAt   = new Date();
      session.answers[idx].timeSpent = Number(timeSpent) || 0;
    }

    if (typeof currentQuestionIndex === 'number') {
      session.currentQuestionIndex = currentQuestionIndex;
    }

    // markModified needed for array sub-doc mutation
    session.markModified('answers');
    await session.save();

    res.status(200).json({ success: true, message: 'Answer saved', data: { savedAt: new Date() } });
  } catch (err) {
    console.error('Save answer error:', err);
    res.status(500).json({ success: false, message: 'Failed to save answer' });
  }
};

// ── PUT /api/sessions/:id/complete ────────────────────────────────────────────
export const completeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers, totalTime } = req.body;

    const session = await Session.findOne({
      _id:    req.params.id,
      userId: req.userId,
      status: 'in-progress',
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Active session not found' });
      return;
    }

    // Merge final answers
    if (Array.isArray(answers)) {
      answers.forEach((a: { questionId: string; text: string; timeSpent: number }) => {
        const idx = session.answers.findIndex((sa) => sa.questionId === a.questionId);
        if (idx !== -1) {
          session.answers[idx].text      = a.text      ?? session.answers[idx].text;
          session.answers[idx].timeSpent = a.timeSpent ?? session.answers[idx].timeSpent;
          session.answers[idx].savedAt   = new Date();
        }
      });
    }

    session.status    = 'completed';
    session.endTime   = new Date();
    session.totalTime = Number(totalTime) ||
      Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    session.markModified('answers');
    await session.save();

    await Interview.findByIdAndUpdate(session.interviewId, { status: 'completed' });

    res.status(200).json({
      success: true,
      message: 'Interview completed successfully',
      data:    { session },
    });
  } catch (err) {
    console.error('Complete session error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete session' });
  }
};



// ── GET /api/sessions ─────────────────────────────────────────────────────────
export const getMySessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: req.userId };
    if (req.query.status) filter.status = req.query.status;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('interviewId', 'title category difficulty questionCount estimatedDuration')
        .lean(),
      Session.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { sessions, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// ── GET /api/sessions/:id ─────────────────────────────────────────────────────
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId })
      .populate('interviewId');

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.status(200).json({ success: true, data: { session } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
};

// ── PUT /api/sessions/:id/abandon ─────────────────────────────────────────────
export const abandonSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, status: 'in-progress' },
      { status: 'abandoned', endTime: new Date() },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Active session not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Session abandoned' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to abandon session' });
  }
};

// ── GET /api/sessions/:id/review ─────────────────────────────────────────────
// Returns session + interview questions side by side for review
export const getSessionReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOne({
      _id:    req.params.id,
      userId: req.userId,
      status: { $in: ['completed', 'abandoned'] },
    }).populate('interviewId');

    if (!session) {
      res.status(404).json({ success: false, message: 'Completed session not found' });
      return;
    }

    res.status(200).json({ success: true, data: { session } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
};