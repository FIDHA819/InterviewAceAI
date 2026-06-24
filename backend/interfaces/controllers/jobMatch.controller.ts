import type { Response }    from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import JobMatch        from '../../infrastructure/database/models/JobMatch.model.js';
import Resume          from '../../infrastructure/database/models/Resume.model.js';
import User            from '../../infrastructure/database/models/User.model.js';
import { auditResumeAgainstJob }          from '../../application/usecases/jobMatch/auditResume.js';
import { rewriteResumeWithAudit }         from '../../application/usecases/jobMatch/rewriteResume.js';
import { generateCoverLetterAndEmail }    from '../../application/usecases/jobMatch/generateCoverletter.js';

// ── POST /api/jobmatch/audit ───────────────────────────────────────────────────
export const runAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobTitle, companyName, jobDescription, jobUrl } = req.body;

    if (!jobTitle || !companyName || !jobDescription) {
      res.status(400).json({ success: false, message: 'jobTitle, companyName and jobDescription are required' });
      return;
    }

    // Fetch user's resume
    const resume = await Resume.findOne({ userId: req.userId });
    if (!resume || !resume.parsedText) {
      res.status(404).json({
        success: false,
        message: 'No resume found. Please upload your resume on the Resume page first.',
      });
      return;
    }

    // Run AI audit
    const audit = await auditResumeAgainstJob({
      resumeText:    resume.parsedText,
      jobTitle,
      companyName,
      jobDescription,
    });

    // Save to DB
    const jobMatch = await JobMatch.create({
      userId:         req.userId,
      resumeId:       resume._id,
      jobTitle,
      companyName,
      jobDescription,
      jobUrl:         jobUrl || '',
      audit,
      status:         'audit_done',
    });

    res.status(201).json({
      success: true,
      message: 'Resume audit complete',
      data:    { jobMatch },
    });
  } catch (err: any) {
    console.error('Audit error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Audit failed' });
  }
};

// ── POST /api/jobmatch/:id/rewrite ────────────────────────────────────────────
export const runRewrite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobMatch = await JobMatch.findOne({ _id: req.params.id, userId: req.userId });
    if (!jobMatch) {
      res.status(404).json({ success: false, message: 'Job match not found' });
      return;
    }

    // Return cached rewrite
    if (jobMatch.rewrite?.rewrittenResume) {
      res.status(200).json({ success: true, message: 'Using cached rewrite', data: { jobMatch } });
      return;
    }

    const resume = await Resume.findOne({ userId: req.userId });
    if (!resume?.parsedText) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    const rewrite = await rewriteResumeWithAudit(
      resume.parsedText,
      jobMatch.jobTitle,
      jobMatch.companyName,
      jobMatch.jobDescription,
      jobMatch.audit
    );

    jobMatch.rewrite = rewrite;
    jobMatch.status  = 'rewrite_done';
    await jobMatch.save();

    res.status(200).json({ success: true, message: 'Resume rewritten', data: { jobMatch } });
  } catch (err: any) {
    console.error('Rewrite error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Rewrite failed' });
  }
};

// ── POST /api/jobmatch/:id/cover-letter ───────────────────────────────────────
export const runCoverLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobMatch = await JobMatch.findOne({ _id: req.params.id, userId: req.userId });
    if (!jobMatch) {
      res.status(404).json({ success: false, message: 'Job match not found' });
      return;
    }

    if (!jobMatch.rewrite?.rewrittenResume) {
      res.status(400).json({ success: false, message: 'Run rewrite first before generating cover letter' });
      return;
    }

    // Return cached cover letter
    if (jobMatch.coverLetter) {
      res.status(200).json({ success: true, message: 'Using cached cover letter', data: { jobMatch } });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const result = await generateCoverLetterAndEmail(
      user.name,
      user.email,
      jobMatch.jobTitle,
      jobMatch.companyName,
      jobMatch.jobDescription,
      jobMatch.rewrite.rewrittenResume
    );

    jobMatch.coverLetter      = result.coverLetter;
    jobMatch.applicationEmail = result.applicationEmail;
    await jobMatch.save();

    res.status(200).json({ success: true, message: 'Cover letter generated', data: { jobMatch } });
  } catch (err: any) {
    console.error('Cover letter error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Cover letter failed' });
  }
};

// ── GET /api/jobmatch ─────────────────────────────────────────────────────────
export const getMyJobMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobMatches = await JobMatch.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-jobDescription -rewrite.rewrittenResume -coverLetter -applicationEmail')
      .lean();

    res.status(200).json({ success: true, data: { jobMatches } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch job matches' });
  }
};

// ── GET /api/jobmatch/:id ─────────────────────────────────────────────────────
export const getJobMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobMatch = await JobMatch.findOne({ _id: req.params.id, userId: req.userId });
    if (!jobMatch) {
      res.status(404).json({ success: false, message: 'Job match not found' });
      return;
    }
    res.status(200).json({ success: true, data: { jobMatch } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch job match' });
  }
};

// ── DELETE /api/jobmatch/:id ──────────────────────────────────────────────────
export const deleteJobMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await JobMatch.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.status(200).json({ success: true, message: 'Job match deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};