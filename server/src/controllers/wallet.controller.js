import { WalletService } from '../services/wallet.service.js';

export const getWalletsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallets = await WalletService.getWalletsByUser(userId);
    return res.json({
      success: true,
      data: wallets,
    });
  } catch (error) {
    next(error);
  }
};

export const createWalletHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await WalletService.createWallet(userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Dompet berhasil dibuat',
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWalletHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await WalletService.updateWallet(userId, req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Dompet berhasil diperbarui',
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWalletHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await WalletService.deleteWallet(userId, req.params.id);
    return res.json({
      success: true,
      message: 'Dompet berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

export const getNetWorthHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await WalletService.getNetWorthSummary(userId);
    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
