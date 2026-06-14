import type { Response }    from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Resume          from '../../infrastructure/database/models/Resume.model.js';
import {
  extractTextFromPDF,
  analyzeResumeWithAI,
} from '../../application/usecases/resume/analyseResume.js';

// POST /api/resume/upload
export const uploadAndAnalyze = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No PDF file uploaded' });
      return;
    }

    const { originalname, buffer, size } = req.file;

    // Extract text
    let parsedText: string;
    try {
      parsedText = await extractTextFromPDF(buffer);
    } catch (err: any) {
      res.status(422).json({ success: false, message: err.message });
      return;
    }

    if (!parsedText || parsedText.length < 50) {
      res.status(422).json({
        success: false,
        message: 'Could not extract text from PDF. Try a text-based PDF (not a scanned image).',
      });
      return;
    }

    // Analyse with AI
    let analysis;
    try {
      analysis = await analyzeResumeWithAI(parsedText);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'AI analysis failed — try again',
      });
      return;
    }

    // Save to DB (replace previous resume for this user)
    const resume = await Resume.findOneAndUpdate(
      { userId: req.userId },
      {
        userId:     req.userId,
        fileName:   originalname,
        fileSize:   size,
        parsedText,
        analysis,
        analyzedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Resume analysed successfully',
      data:    { resume },
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ success: false, message: 'Server error during analysis' });
  }
};

// GET /api/resume
export const getMyResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ userId: req.userId }).select('-parsedText');

    if (!resume) {
      res.status(404).json({ success: false, message: 'No resume found' });
      return;
    }

    res.status(200).json({ success: true, data: { resume } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch resume' });
  }
};

// DELETE /api/resume
export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Resume.findOneAndDelete({ userId: req.userId });
    res.status(200).json({ success: true, message: 'Resume deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete resume' });
  }
};