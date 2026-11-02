import { Router } from 'express';
import multer from 'multer';
import { 
  createTransactionHandler, 
  updateTransactionHandler,
  deleteTransactionHandler,
  transferFundsHandler, 
  getRecentTransactionsHandler,
  getCashFlowHandler,
  scanReceiptHandler
} from '../controllers/transaction.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth);

router.post('/', createTransactionHandler);
router.put('/:id', updateTransactionHandler);
router.delete('/:id', deleteTransactionHandler);
router.post('/transfer', transferFundsHandler);
router.get('/recent', getRecentTransactionsHandler);
router.get('/cash-flow', getCashFlowHandler);
router.post('/scan-receipt', upload.single('receipt'), scanReceiptHandler);

export default router;
