import { Router } from 'express';
import {
  startSession,
  saveAnswer,
  completeSession,
  getSession,
  getMySessions,
  abandonSession,
  getSessionReview,
} from '../controllers/session.controller.js';
import { protect } from '../middlewares/auth.middleware.js';


const router = Router();

router.use(protect);

router.post('/start',           startSession);
router.get('/',                 getMySessions);
router.get('/:id',              getSession);
router.get('/:id/review',       getSessionReview);
router.put('/:id/answer',       saveAnswer);
router.put('/:id/complete',     completeSession);
router.put('/:id/abandon',      abandonSession);

export default router;