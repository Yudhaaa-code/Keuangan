import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors.js';

export class WalletService {
  /**
   * Get all wallets for a user
   */
  static async getWalletsByUser(userId) {
    return await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new wallet
   */
  static async createWallet(userId, data) {
    const { name, type = 'CASH', initialBalance = 0, balance, accountNumber, colorHex } = data;
    const rawBalance = balance !== undefined ? balance : initialBalance;
    const decimalBalance = new Prisma.Decimal(rawBalance || 0);

    if (decimalBalance.lt(0)) {
      throw new AppError('Saldo awal tidak boleh negatif', 400);
    }

    return await prisma.wallet.create({
      data: {
        userId,
        name,
        type,
        balance: decimalBalance,
        accountNumber,
        colorHex: colorHex || '#3B82F6',
      },
    });
  }

  /**
   * Update an existing wallet (name, type, balance adjustment, colorHex)
   */
  static async updateWallet(userId, walletId, data) {
    const existing = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!existing) {
      throw new AppError('Dompet tidak ditemukan', 404);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
    if (data.colorHex !== undefined) updateData.colorHex = data.colorHex;
    if (data.balance !== undefined) {
      const dec = new Prisma.Decimal(data.balance);
      if (dec.lt(0)) throw new AppError('Saldo dompet tidak boleh negatif', 400);
      updateData.balance = dec;
    }

    return await prisma.wallet.update({
      where: { id: walletId },
      data: updateData,
    });
  }

  /**
   * Delete a wallet
   */
  static async deleteWallet(userId, walletId) {
    const existing = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!existing) {
      throw new AppError('Dompet tidak ditemukan', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { walletId } });
      await tx.transfer.deleteMany({
        where: { OR: [{ sourceWalletId: walletId }, { targetWalletId: walletId }] },
      });
      await tx.wallet.delete({ where: { id: walletId } });
    });

    return { id: walletId };
  }

  /**
   * Get total net worth summary across all wallets
   */
  static async getNetWorthSummary(userId) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    const totalBalance = wallets.reduce(
      (acc, w) => acc.plus(new Prisma.Decimal(w.balance)),
      new Prisma.Decimal(0)
    );

    return {
      walletsCount: wallets.length,
      totalNetWorth: totalBalance.toString(),
      wallets,
    };
  }
}
