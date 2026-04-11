import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentStatus,
  deleteDocument,
} from '../controllers/document.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// Tất cả routes cần authentication
router.use(auth);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.get('/:id/status', getDocumentStatus);
router.delete('/:id', deleteDocument);

export default router;
