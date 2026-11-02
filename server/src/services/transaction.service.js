import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';

export class TransactionService {
  /**
   * Catat pemasukan (INCOME) atau pengeluaran (EXPENSE)
   */
  static async createTransaction(userId, data) {
    const { walletId, categoryId, type, amount, description, date, isRecurring = false } = data;

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      throw new AppError('Tipe transaksi harus INCOME atau EXPENSE', 400);
    }

    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) {
      throw new AppError('Nominal transaksi harus lebih besar dari 0', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: walletId, userId },
      });

      if (!wallet) {
        throw new AppError('Dompet tidak ditemukan atau bukan milik Anda', 404);
      }

      if (type === 'EXPENSE') {
        const currentBalance = new Prisma.Decimal(wallet.balance);
        if (currentBalance.lt(decimalAmount)) {
          throw new AppError(
            `Saldo tidak mencukupi untuk pengeluaran ini. Saldo dompet ${wallet.name}: Rp ${currentBalance}`,
            400
          );
        }
      }

      const balanceChange = type === 'INCOME' ? decimalAmount : decimalAmount.negated();
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: balanceChange },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId,
          categoryId: categoryId || null,
          type,
          amount: decimalAmount,
          description: description || (type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'),
          date: date ? new Date(date) : new Date(),
          isRecurring: Boolean(isRecurring),
        },
        include: {
          wallet: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      });

      return transaction;
    });
  }

  /**
   * Update transaksi & sesuaikan saldo dompet secara atomik
   */
  static async updateTransaction(userId, transactionId, data) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!existing) {
        throw new AppError('Transaksi tidak ditemukan', 404);
      }

      if (existing.type === 'TRANSFER') {
        throw new AppError('Transaksi transfer tidak dapat diedit langsung, silakan hapus dan buat ulang', 400);
      }

      // 1. Kembalikan efek saldo lama pada dompet lama
      const oldAmount = new Prisma.Decimal(existing.amount);
      const reverseOld = existing.type === 'INCOME' ? oldAmount.negated() : oldAmount;
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: reverseOld } },
      });

      // 2. Terapkan efek baru pada dompet tujuan baru
      const nextWalletId = data.walletId || existing.walletId;
      const nextType = data.type || existing.type;
      const nextAmount = data.amount !== undefined ? new Prisma.Decimal(data.amount) : oldAmount;

      const targetWallet = await tx.wallet.findFirst({
        where: { id: nextWalletId, userId },
      });

      if (!targetWallet) {
        throw new AppError('Dompet tujuan tidak ditemukan', 404);
      }

      if (nextType === 'EXPENSE' && new Prisma.Decimal(targetWallet.balance).lt(nextAmount)) {
        throw new AppError(`Saldo dompet ${targetWallet.name} tidak mencukupi`, 400);
      }

      const applyNew = nextType === 'INCOME' ? nextAmount : nextAmount.negated();
      await tx.wallet.update({
        where: { id: nextWalletId },
        data: { balance: { increment: applyNew } },
      });

      // 3. Update record transaksi
      return await tx.transaction.update({
        where: { id: transactionId },
        data: {
          walletId: nextWalletId,
          type: nextType,
          amount: nextAmount,
          categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
          description: data.description !== undefined ? data.description : existing.description,
          date: data.date ? new Date(data.date) : existing.date,
          isRecurring: data.isRecurring !== undefined ? Boolean(data.isRecurring) : existing.isRecurring,
        },
        include: {
          wallet: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
      });
    });
  }

  /**
   * Hapus transaksi & rollback saldo dompet secara atomik
   */
  static async deleteTransaction(userId, transactionId) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
        include: { transfer: true },
      });

      if (!existing) {
        throw new AppError('Transaksi tidak ditemukan', 404);
      }

      if (existing.type === 'TRANSFER' && existing.transfer) {
        const tf = existing.transfer;
        const totalRefund = new Prisma.Decimal(tf.amount).plus(new Prisma.Decimal(tf.adminFee || 0));
        await tx.wallet.update({
          where: { id: tf.sourceWalletId },
          data: { balance: { increment: totalRefund } },
        });
        await tx.wallet.update({
          where: { id: tf.targetWalletId },
          data: { balance: { decrement: new Prisma.Decimal(tf.amount) } },
        });
        await tx.transaction.delete({ where: { id: transactionId } });
        await tx.transfer.delete({ where: { id: tf.id } });
      } else {
        const amt = new Prisma.Decimal(existing.amount);
        const reverseDelta = existing.type === 'INCOME' ? amt.negated() : amt;
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: reverseDelta } },
        });
        await tx.transaction.delete({ where: { id: transactionId } });
      }

      return { id: transactionId };
    });
  }

  /**
   * Transfer dana antar dompet (Atomic, ACID, tidak terjadi double expense)
   */
  static async transferFunds(userId, data) {
    const { sourceWalletId, targetWalletId, amount, adminFee = 0, notes } = data;

    if (sourceWalletId === targetWalletId) {
      throw new AppError('Dompet sumber dan dompet tujuan tidak boleh sama', 400);
    }

    const transferAmount = new Prisma.Decimal(amount);
    const feeAmount = new Prisma.Decimal(adminFee);

    if (transferAmount.lte(0)) {
      throw new AppError('Nominal transfer harus lebih dari 0', 400);
    }

    if (feeAmount.lt(0)) {
      throw new AppError('Biaya admin tidak boleh negatif', 400);
    }

    const totalDeduction = transferAmount.plus(feeAmount);

    return await prisma.$transaction(async (tx) => {
      const [sourceWallet, targetWallet] = await Promise.all([
        tx.wallet.findFirst({ where: { id: sourceWalletId, userId } }),
        tx.wallet.findFirst({ where: { id: targetWalletId, userId } }),
      ]);

      if (!sourceWallet) {
        throw new AppError('Dompet asal tidak ditemukan', 404);
      }
      if (!targetWallet) {
        throw new AppError('Dompet tujuan tidak ditemukan', 404);
      }

      const sourceBalance = new Prisma.Decimal(sourceWallet.balance);
      if (sourceBalance.lt(totalDeduction)) {
        throw new AppError(
          `Saldo dompet ${sourceWallet.name} tidak cukup (Dibutuhkan: Rp ${totalDeduction}, Saldo: Rp ${sourceBalance})`,
          400
        );
      }

      await tx.wallet.update({
        where: { id: sourceWalletId },
        data: { balance: { decrement: totalDeduction } },
      });

      await tx.wallet.update({
        where: { id: targetWalletId },
        data: { balance: { increment: transferAmount } },
      });

      const transfer = await tx.transfer.create({
        data: {
          userId,
          sourceWalletId,
          targetWalletId,
          amount: transferAmount,
          adminFee: feeAmount,
          notes,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: sourceWalletId,
          transferId: transfer.id,
          type: 'TRANSFER',
          amount: transferAmount,
          description: `Transfer ke ${targetWallet.name} ${notes ? `(${notes})` : ''}`.trim(),
        },
        include: {
          wallet: { select: { id: true, name: true } },
        },
      });

      return {
        transfer,
        transaction,
      };
    });
  }

  /**
   * Mengambil daftar transaksi terakhir dengan filter bulan & pencarian
   */
  static async getRecentTransactions(userId, limit = 100, filters = {}) {
    const where = { userId };

    if (filters.month && filters.year) {
      const m = Number(filters.month) - 1;
      const y = Number(filters.year);
      where.date = {
        gte: new Date(y, m, 1),
        lte: new Date(y, m + 1, 0, 23, 59, 59),
      };
    }

    if (filters.search) {
      where.description = { contains: filters.search, mode: 'insensitive' };
    }

    return await prisma.transaction.findMany({
      where,
      take: Number(limit),
      orderBy: { date: 'desc' },
      include: {
        wallet: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true } },
        transfer: true,
      },
    });
  }

  /**
   * Ringkasan arus kas pemasukan & pengeluaran bulan berjalan
   */
  static async getMonthlyCashFlow(userId, monthQuery, yearQuery) {
    const now = new Date();
    const m = monthQuery ? Number(monthQuery) - 1 : now.getMonth();
    const y = yearQuery ? Number(yearQuery) : now.getFullYear();
    const startOfMonth = new Date(y, m, 1);
    const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: { transfer: true },
    });

    let totalIncome = new Prisma.Decimal(0);
    let totalExpense = new Prisma.Decimal(0);

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        totalIncome = totalIncome.plus(new Prisma.Decimal(t.amount));
      } else if (t.type === 'EXPENSE') {
        totalExpense = totalExpense.plus(new Prisma.Decimal(t.amount));
      } else if (t.type === 'TRANSFER' && t.transfer?.adminFee) {
        totalExpense = totalExpense.plus(new Prisma.Decimal(t.transfer.adminFee));
      }
    }

    return {
      month: m + 1,
      year: y,
      totalIncome: totalIncome.toString(),
      totalExpense: totalExpense.toString(),
      netSavings: totalIncome.minus(totalExpense).toString(),
    };
  }
}
