import { Router } from 'express';
import {
  runAudit,
  runRewrite,
  runCoverLetter,
  getMyJobMatches,
  getJobMatch,
  deleteJobMatch,
} from '../controllers/jobMatch.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/',                   runAudit);
router.get('/',                    getMyJobMatches);
router.get('/:id',                 getJobMatch);
router.post('/:id/rewrite',        runRewrite);
router.post('/:id/cover-letter',   runCoverLetter);
router.delete('/:id',              deleteJobMatch);

export default router;