import { Router } from 'express';
import {
  generateInterview,
  getMyInterviews,
  getInterview,
  deleteInterview,
} from '../controllers/interview.controller.js';
import  { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/generate',  generateInterview);
router.get('/',           getMyInterviews);
router.get('/:id',        getInterview);
router.delete('/:id',     deleteInterview);

export default router;