import { Router } from 'express';
import { getOverview, getHistory } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/history',  getHistory);

export default router;