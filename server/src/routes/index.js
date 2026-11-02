import { Router } from 'express';
import walletRoutes from './wallet.routes.js';
import transactionRoutes from './transaction.routes.js';
import planningRoutes from './planning.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Keuangan API Service',
  });
});

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/planning', planningRoutes);

export default router;
