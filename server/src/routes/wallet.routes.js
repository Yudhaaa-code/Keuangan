import { Router } from 'express';
import { 
  getWalletsHandler, 
  createWalletHandler, 
  updateWalletHandler,
  deleteWalletHandler,
  getNetWorthHandler 
} from '../controllers/wallet.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWalletsHandler);
router.post('/', createWalletHandler);
router.put('/:id', updateWalletHandler);
router.delete('/:id', deleteWalletHandler);
router.get('/net-worth', getNetWorthHandler);

export default router;
