import { Router } from 'express';
import {
  generateFeedbackController,
  getFeedback,
  getMyFeedbacks,
} from '../controllers/feedback.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/generate',          generateFeedbackController);
router.get('/',                   getMyFeedbacks);
router.get('/:sessionId',         getFeedback);

export default router;