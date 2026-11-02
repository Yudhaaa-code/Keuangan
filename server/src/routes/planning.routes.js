import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getCategoriesHandler,
  createCategoryHandler,
  deleteCategoryHandler,
  getBudgetsHandler,
  upsertBudgetHandler,
  deleteBudgetHandler,
  getDebtsHandler,
  createDebtHandler,
  payDebtHandler,
  deleteDebtHandler,
  getGoalsHandler,
  createGoalHandler,
  contributeGoalHandler,
  deleteGoalHandler,
  getAssetsHandler,
  createAssetHandler,
  updateAssetHandler,
  deleteAssetHandler,
} from '../controllers/planning.controller.js';

const router = Router();
router.use(requireAuth);

// Categories
router.get('/categories', getCategoriesHandler);
router.post('/categories', createCategoryHandler);
router.delete('/categories/:id', deleteCategoryHandler);

// Budgets
router.get('/budgets', getBudgetsHandler);
router.post('/budgets', upsertBudgetHandler);
router.delete('/budgets/:id', deleteBudgetHandler);

// Debts
router.get('/debts', getDebtsHandler);
router.post('/debts', createDebtHandler);
router.patch('/debts/:id/pay', payDebtHandler);
router.delete('/debts/:id', deleteDebtHandler);

// Goals
router.get('/goals', getGoalsHandler);
router.post('/goals', createGoalHandler);
router.patch('/goals/:id/contribute', contributeGoalHandler);
router.delete('/goals/:id', deleteGoalHandler);

// Assets
router.get('/assets', getAssetsHandler);
router.post('/assets', createAssetHandler);
router.put('/assets/:id', updateAssetHandler);
router.delete('/assets/:id', deleteAssetHandler);

export default router;

