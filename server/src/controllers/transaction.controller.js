import { TransactionService } from '../services/transaction.service.js';
import { ReceiptOcrService } from '../services/receiptOcr.service.js';

export const createTransactionHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transaction = await TransactionService.createTransaction(userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dicatat',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransactionHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transaction = await TransactionService.updateTransaction(userId, req.params.id, req.body);
    return res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransactionHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await TransactionService.deleteTransaction(userId, req.params.id);
    return res.json({
      success: true,
      message: 'Transaksi berhasil dihapus dan saldo dikembalikan',
    });
  } catch (error) {
    next(error);
  }
};

export const transferFundsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await TransactionService.transferFunds(userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Transfer saldo berhasil diproses',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentTransactionsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 100;
    const { month, year, search } = req.query;
    const transactions = await TransactionService.getRecentTransactions(userId, limit, {
      month,
      year,
      search,
    });
    return res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export const getCashFlowHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const cashFlow = await TransactionService.getMonthlyCashFlow(userId, month, year);
    return res.json({
      success: true,
      data: cashFlow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Scan Struk Belanja Otomatis (OCR)
 */
export const scanReceiptHandler = async (req, res, next) => {
  try {
    let imageSource = null;

    if (req.file) {
      imageSource = req.file.buffer;
    } else if (req.body?.base64Image) {
      const base64Data = req.body.base64Image.replace(/^data:image\/\w+;base64,/, '');
      imageSource = Buffer.from(base64Data, 'base64');
    }

    if (!imageSource) {
      return res.status(400).json({
        success: false,
        message: 'Foto struk belanja diperlukan (upload file atau base64Image)',
      });
    }

    const extracted = await ReceiptOcrService.parseReceiptImage(imageSource);

    return res.json({
      success: true,
      message: 'Struk berhasil dianalisis oleh AI OCR',
      data: extracted,
    });
  } catch (error) {
    next(error);
  }
};
