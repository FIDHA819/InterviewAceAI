import type { Request, Response } from 'express';
import User from '../../infrastructure/database/models/User.model.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

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
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // These will be real aggregations in Day 8 — for now return safe defaults
    const Session = mongoose.models.Session;
    
    if (!Session) {
      res.status(200).json({
        success: true,
        data: {
          totalInterviews: 0,
          averageScore: 0,
          streak: 0,
          bestCategory: '—',
          recentSessions: [],
        },
      });
      return;
    }

    const sessions = await Session.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalInterviews: sessions.length,
        averageScore: 0,
        streak: 0,
        bestCategory: '—',
        recentSessions: sessions,
      },
    });
  } catch {
    res.status(200).json({
      success: true,
      data: {
        totalInterviews: 0,
        averageScore: 0,
        streak: 0,
        bestCategory: '—',
        recentSessions: [],
      },
    });
  }
};