import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';

export class PlanningService {
  // ========================
  // CATEGORIES
  // ========================
  static async getCategories(userId) {
    return await prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(userId, { name, icon, type = 'EXPENSE' }) {
    if (!name) throw new AppError('Nama kategori wajib diisi', 400);
    return await prisma.category.create({
      data: { userId, name, icon: icon || null, type },
    });
  }

  static async deleteCategory(userId, id) {
    await prisma.category.deleteMany({ where: { id, userId } });
    return { id };
  }

  // ========================
  // BUDGETS
  // ========================
  static async getBudgets(userId, month, year) {
    const where = { userId };
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    return await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async upsertBudget(userId, { categoryId, categoryName, limit, month, year }) {
    const now = new Date();
    const m = Number(month || now.getMonth() + 1);
    const y = Number(year || now.getFullYear());
    const decLimit = new Prisma.Decimal(limit);

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName) {
      let cat = await prisma.category.findFirst({
        where: { userId, name: categoryName },
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: { userId, name: categoryName, type: 'EXPENSE' },
        });
      }
      resolvedCategoryId = cat.id;
    }

    if (!resolvedCategoryId) {
      throw new AppError('Kategori anggaran wajib dipilih', 400);
    }

    return await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: resolvedCategoryId,
          month: m,
          year: y,
        },
      },
      update: { limit: decLimit },
      create: {
        userId,
        categoryId: resolvedCategoryId,
        limit: decLimit,
        month: m,
        year: y,
      },
      include: { category: true },
    });
  }

  static async deleteBudget(userId, id) {
    await prisma.budget.deleteMany({ where: { id, userId } });
    return { id };
  }

  // ========================
  // DEBTS (UTANG & PIUTANG)
  // ========================
  static async getDebts(userId) {
    return await prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createDebt(userId, { type, personName, totalAmount, paidAmount = 0, dueDate, notes }) {
    if (!personName || !totalAmount) {
      throw new AppError('Nama pihak dan total nominal wajib diisi', 400);
    }
    const total = new Prisma.Decimal(totalAmount);
    const paid = new Prisma.Decimal(paidAmount || 0);
    const status = paid.gte(total) ? 'PAID' : paid.gt(0) ? 'PARTIALLY_PAID' : 'UNPAID';

    return await prisma.debt.create({
      data: {
        userId,
        type: type || 'PAYABLE',
        personName,
        totalAmount: total,
        paidAmount: paid,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        notes: notes || null,
      },
    });
  }

  static async payDebt(userId, id, { paymentAmount }) {
    const debt = await prisma.debt.findFirst({ where: { id, userId } });
    if (!debt) throw new AppError('Catatan utang/piutang tidak ditemukan', 404);

    const addPaid = new Prisma.Decimal(paymentAmount || 0);
    const nextPaid = Prisma.Decimal.min(
      new Prisma.Decimal(debt.totalAmount),
      new Prisma.Decimal(debt.paidAmount).plus(addPaid)
    );
    const nextStatus = nextPaid.gte(new Prisma.Decimal(debt.totalAmount))
      ? 'PAID'
      : nextPaid.gt(0)
        ? 'PARTIALLY_PAID'
        : 'UNPAID';

    return await prisma.debt.update({
      where: { id },
      data: {
        paidAmount: nextPaid,
        status: nextStatus,
      },
    });
  }

  static async deleteDebt(userId, id) {
    await prisma.debt.deleteMany({ where: { id, userId } });
    return { id };
  }

  // ========================
  // GOALS (TARGET TABUNGAN)
  // ========================
  static async getGoals(userId) {
    return await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createGoal(userId, { name, targetAmount, currentAmount = 0, deadline, colorHex }) {
    if (!name || !targetAmount) {
      throw new AppError('Nama target dan nominal wajib diisi', 400);
    }
    return await prisma.goal.create({
      data: {
        userId,
        name,
        targetAmount: new Prisma.Decimal(targetAmount),
        currentAmount: new Prisma.Decimal(currentAmount || 0),
        deadline: deadline ? new Date(deadline) : null,
        colorHex: colorHex || '#10B981',
      },
    });
  }

  static async contributeGoal(userId, id, { amount }) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new AppError('Target tabungan tidak ditemukan', 404);

    const nextAmount = new Prisma.Decimal(goal.currentAmount).plus(new Prisma.Decimal(amount || 0));
    return await prisma.goal.update({
      where: { id },
      data: { currentAmount: nextAmount },
    });
  }

  static async deleteGoal(userId, id) {
    await prisma.goal.deleteMany({ where: { id, userId } });
    return { id };
  }

  // ========================
  // ASSETS (PORTOFOLIO INVESTASI)
  // ========================
  static async getAssets(userId) {
    return await prisma.asset.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createAsset(userId, { name, category = 'OTHER', quantity = 1, buyPrice, currentValue }) {
    if (!name || buyPrice === undefined) {
      throw new AppError('Nama aset dan harga beli wajib diisi', 400);
    }
    return await prisma.asset.create({
      data: {
        userId,
        name,
        category,
        quantity: new Prisma.Decimal(quantity || 1),
        buyPrice: new Prisma.Decimal(buyPrice),
        currentValue: new Prisma.Decimal(currentValue !== undefined ? currentValue : buyPrice),
      },
    });
  }

  static async updateAsset(userId, id, { name, category, quantity, buyPrice, currentValue }) {
    const asset = await prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) throw new AppError('Aset tidak ditemukan', 404);

    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (quantity !== undefined) data.quantity = new Prisma.Decimal(quantity);
    if (buyPrice !== undefined) data.buyPrice = new Prisma.Decimal(buyPrice);
    if (currentValue !== undefined) data.currentValue = new Prisma.Decimal(currentValue);

    return await prisma.asset.update({ where: { id }, data });
  }

  static async deleteAsset(userId, id) {
    await prisma.asset.deleteMany({ where: { id, userId } });
    return { id };
  }
}

