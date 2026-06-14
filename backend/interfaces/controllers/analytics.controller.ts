import type { Response }    from 'express';
import mongoose        from 'mongoose';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Session         from '../../infrastructure/database/models/Session.model.js';
import Feedback        from '../../infrastructure/database/models/Feedback.model.js';
import Interview       from '../../infrastructure/database/models/Interview.model.js';

// ── GET /api/analytics/overview ──────────────────────────────────────────────
export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const [sessionStats, feedbackStats, categoryStats, recentTrend] = await Promise.all([

      // Total sessions + time spent
      Session.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $group: {
            _id:            null,
            totalSessions:  { $sum: 1 },
            totalTimeSpent: { $sum: '$totalTime' },
            avgTime:        { $avg: '$totalTime' },
          },
        },
      ]),

      // Average scores across all feedback
      Feedback.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id:              null,
            avgOverall:       { $avg: '$scores.overall'       },
            avgTechnical:     { $avg: '$scores.technical'     },
            avgCommunication: { $avg: '$scores.communication' },
            avgConfidence:    { $avg: '$scores.confidence'    },
            totalFeedbacks:   { $sum: 1                       },
            bestScore:        { $max: '$scores.overall'       },
          },
        },
      ]),

      // Category breakdown
      Feedback.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from:         'interviews',
            localField:   'interviewId',
            foreignField: '_id',
            as:           'interview',
          },
        },
        { $unwind: '$interview' },
        {
          $group: {
            _id:              '$interview.category',
            avgScore:         { $avg: '$scores.overall'   },
            avgTechnical:     { $avg: '$scores.technical' },
            count:            { $sum: 1                   },
            bestScore:        { $max: '$scores.overall'   },
          },
        },
        { $sort: { avgScore: -1 } },
      ]),

      // Last 10 sessions score trend
      Feedback.aggregate([
        { $match: { userId } },
        { $sort:  { createdAt: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from:         'interviews',
            localField:   'interviewId',
            foreignField: '_id',
            as:           'interview',
          },
        },
        { $unwind: '$interview' },
        {
          $project: {
            overall:       '$scores.overall',
            technical:     '$scores.technical',
            communication: '$scores.communication',
            confidence:    '$scores.confidence',
            category:      '$interview.category',
            difficulty:    '$interview.difficulty',
            createdAt:     1,
          },
        },
      ]),
    ]);

    // Compute streak (consecutive days with completed sessions)
    const recentSessions = await Session.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('createdAt')
      .lean();

    const streak = computeStreak(recentSessions.map((s) => new Date(s.createdAt)));

    // Best category
    const bestCat = categoryStats[0]?._id || '—';

    // Weak areas: categories scoring below 60
    const weakAreas = categoryStats
      .filter((c: any) => c.avgScore < 60)
      .map((c: any) => c._id);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSessions:  sessionStats[0]?.totalSessions  ?? 0,
          totalTimeSpent: sessionStats[0]?.totalTimeSpent ?? 0,
          avgTime:        Math.round(sessionStats[0]?.avgTime ?? 0),
          avgOverall:     Math.round(feedbackStats[0]?.avgOverall       ?? 0),
          avgTechnical:   Math.round(feedbackStats[0]?.avgTechnical     ?? 0),
          avgCommunication: Math.round(feedbackStats[0]?.avgCommunication ?? 0),
          avgConfidence:  Math.round(feedbackStats[0]?.avgConfidence    ?? 0),
          bestScore:      Math.round(feedbackStats[0]?.bestScore        ?? 0),
          streak,
          bestCategory:   bestCat,
          weakAreas,
        },
        categoryStats: categoryStats.map((c: any) => ({
          category:    c._id,
          avgScore:    Math.round(c.avgScore),
          avgTechnical: Math.round(c.avgTechnical),
          count:       c.count,
          bestScore:   Math.round(c.bestScore),
        })),
        scoreTrend: recentTrend.map((t: any, i: number) => ({
          session:       `S${i + 1}`,
          overall:       Math.round(t.overall),
          technical:     Math.round(t.technical),
          communication: Math.round(t.communication),
          confidence:    Math.round(t.confidence),
          category:      t.category,
          date:          new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        })),
      },
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// ── GET /api/analytics/history ───────────────────────────────────────────────
export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const page   = Math.max(Number(req.query.page)  || 1, 1);
    const limit  = Math.min(Number(req.query.limit) || 8, 20);
    const skip   = (page - 1) * limit;

    const [history, total] = await Promise.all([
      Feedback.aggregate([
        { $match: { userId } },
        { $sort:  { createdAt: -1 } },
        { $skip:  skip  },
        { $limit: limit },
        {
          $lookup: {
            from:         'interviews',
            localField:   'interviewId',
            foreignField: '_id',
            as:           'interview',
          },
        },
        { $unwind: '$interview' },
        {
          $lookup: {
            from:         'sessions',
            localField:   'sessionId',
            foreignField: '_id',
            as:           'session',
          },
        },
        { $unwind: {
      path: "$session",
      preserveNullAndEmptyArrays: true
    }},
        {
          $project: {
            overall:       '$scores.overall',
            technical:     '$scores.technical',
            communication: '$scores.communication',
            confidence:    '$scores.confidence',
            title:         '$interview.title',
            category:      '$interview.category',
            difficulty:    '$interview.difficulty',
            questionCount: '$interview.questionCount',
            totalTime:     '$session.totalTime',
            createdAt:     1,
          },
        },
      ]),
      Feedback.countDocuments({ userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        history: history.map((h: any) => ({
          ...h,
          overall:       Math.round(h.overall),
          technical:     Math.round(h.technical),
          communication: Math.round(h.communication),
          confidence:    Math.round(h.confidence),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Analytics history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

// ── Helper: streak ────────────────────────────────────────────────────────────
function computeStreak(dates: Date[]): number {
  if (!dates.length) return 0;

  const days = [...new Set(
    dates.map((d) => d.toISOString().split('T')[0])
  )].sort().reverse();

  let streak   = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const day of days) {
    const d = new Date(day);
    const expectedStr = expected.toISOString().split('T')[0];

    if (day === expectedStr) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (day < expectedStr) {
      break;
    }
  }

  return streak;
}