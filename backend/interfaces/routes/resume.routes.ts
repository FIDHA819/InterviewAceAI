import { Router }    from 'express';
import {
  uploadAndAnalyze,
  getMyResume,
  deleteResume,
} from '../controllers/resume.controller.js';
import { protect }   from '../middlewares/auth.middleware.js';
import { uploadPDF } from '../../infrastructure/storage/multer.config.js';

const router = Router();

router.use(protect);

router.post('/upload', uploadPDF.single('resume'), uploadAndAnalyze);
router.get('/',        getMyResume);
router.delete('/',     deleteResume);

export default router;