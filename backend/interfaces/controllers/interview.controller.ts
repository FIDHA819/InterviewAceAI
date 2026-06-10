import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Interview from '../../infrastructure/database/models/Interview.model.js';
import { generateInterviewQuestions } from '../../application/usecases/interview/generateQuestion.js';

const categoryTitles: Record<string, string> = {
  frontend:      'Frontend Developer Interview',
  backend:       'Backend Developer Interview',
  fullstack:     'Full Stack Developer Interview',
  'system-design': 'System Design Interview',
  hr:            'HR & Behavioral Interview',
  dsa:           'DSA & Coding Interview',
};

// POST /api/interviews/generate
export const generateInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, difficulty, count } = req.body;

    // Validation
    const validCategories = ['frontend', 'backend', 'fullstack', 'system-design', 'hr', 'dsa'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    const questionCount = Math.min(Math.max(Number(count) || 10, 5), 20);

    if (!validCategories.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({ success: false, message: 'Invalid difficulty' });
      return;
    }

    // Generate via AI
    const questions = await generateInterviewQuestions(category, difficulty, questionCount);

    // Save to DB
    const interview = await Interview.create({
      userId: req.userId,
      title: `${categoryTitles[category] || 'Interview'} — ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
      category,
      difficulty,
      questions,
      questionCount: questions.length,
      status: 'active',
      estimatedDuration: Math.ceil((questions.length * (difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2))),
    });

    res.status(201).json({
      success: true,
      message: 'Interview generated successfully',
      data: { interview },
    });
  } catch (error: any) {
    console.error('Generate interview error:', error.message);

    if (error.message?.includes('invalid JSON')) {
      res.status(500).json({ success: false, message: 'AI generation failed — please try again' });
      return;
    }
    if (error.status === 401 || error.message?.includes('API key')) {
      res.status(500).json({ success: false, message: 'AI service not configured. Check ANTHROPIC_API_KEY in .env' });
      return;
    }

    res.status(500).json({ success: false, message: 'Failed to generate interview' });
  }
};

// GET /api/interviews — list user's interviews
export const getMyInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      Interview.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-questions') // don't send full questions list in index
        .lean(),
      Interview.countDocuments({ userId: req.userId }),
    ]);

    res.status(200).json({
      success: true,
      data: { interviews, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
};

// GET /api/interviews/:id — get one interview with questions
export const getInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    res.status(200).json({ success: true, data: { interview } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch interview' });
  }
};

// DELETE /api/interviews/:id
export const deleteInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Interview deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete interview' });
  }
};