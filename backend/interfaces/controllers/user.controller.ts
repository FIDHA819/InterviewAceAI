import type { Request, Response } from 'express';
import User from '../../infrastructure/database/models/User.model.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import Session from "../../infrastructure/database/models/Session.model.js";
import Feedback from "../../infrastructure/database/models/Feedback.model.js";
import Interview from "../../infrastructure/database/models/Interview.model.js";

// GET /api/users/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: { user } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/users/profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const name = req.body.name;

    const updateData: any = {
      name,
    };

    if (req.file) {
      updateData.avatar =
        `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

// PUT /api/users/change-password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hash

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/stats
export const getUserStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    const totalInterviews = await Session.countDocuments({
      userId,
      status: "completed",
    });

    const feedbacks = await Feedback.find({ userId });

    const averageScore =
      feedbacks.length > 0
        ? Math.round(
            feedbacks.reduce(
              (sum, f) => sum + f.scores.overall,
              0
            ) / feedbacks.length
          )
        : 0;

    const recentSessions = await Session.find({
      userId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("interviewId", "title category");

    const formattedSessions = await Promise.all(
      recentSessions.map(async (session) => {
        const feedback = await Feedback.findOne({
          sessionId: session._id,
        });

        const interview: any = session.interviewId;

        return {
          _id: session._id,
          title: interview?.title || "Interview",
          category: interview?.category || "general",
          score: feedback?.scores?.overall || 0,
          date: session.createdAt,
        };
      })
    );

    const categoryMap: Record<string, number[]> = {};

    formattedSessions.forEach((session) => {
      if (!categoryMap[session.category]) {
        categoryMap[session.category] = [];
      }

      categoryMap[session.category].push(
        session.score
      );
    });

    let bestCategory = "—";
    let bestAverage = 0;

    Object.entries(categoryMap).forEach(
      ([category, scores]) => {
        const avg =
          scores.reduce((a, b) => a + b, 0) /
          scores.length;

        if (avg > bestAverage) {
          bestAverage = avg;
          bestCategory = category;
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {
        totalInterviews,
        averageScore,
        streak: totalInterviews,
        bestCategory,
        recentSessions: formattedSessions,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};