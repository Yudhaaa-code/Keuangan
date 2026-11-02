import { PlanningService } from '../services/planning.service.js';

export const getCategoriesHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.getCategories(req.user.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const createCategoryHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.createCategory(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteCategoryHandler = async (req, res, next) => {
  try {
    await PlanningService.deleteCategory(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const getBudgetsHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.getBudgets(req.user.id, req.query.month, req.query.year);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const upsertBudgetHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.upsertBudget(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteBudgetHandler = async (req, res, next) => {
  try {
    await PlanningService.deleteBudget(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const getDebtsHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.getDebts(req.user.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const createDebtHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.createDebt(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const payDebtHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.payDebt(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteDebtHandler = async (req, res, next) => {
  try {
    await PlanningService.deleteDebt(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const getGoalsHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.getGoals(req.user.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const createGoalHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.createGoal(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const contributeGoalHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.contributeGoal(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteGoalHandler = async (req, res, next) => {
  try {
    await PlanningService.deleteGoal(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const getAssetsHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.getAssets(req.user.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const createAssetHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.createAsset(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateAssetHandler = async (req, res, next) => {
  try {
    const data = await PlanningService.updateAsset(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteAssetHandler = async (req, res, next) => {
  try {
    await PlanningService.deleteAsset(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

