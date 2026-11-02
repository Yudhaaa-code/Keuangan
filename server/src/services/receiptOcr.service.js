import Tesseract from 'tesseract.js';

export class ReceiptOcrService {
  /**
   * Parse Indonesian Receipts via OCR & Heuristic regex extraction
   */
  static async parseReceiptImage(imageBufferOrPath) {
    try {
      console.log('🔍 Menjalankan OCR Tesseract pada struk...');
      
      const result = await Tesseract.recognize(
        imageBufferOrPath,
        'ind+eng', // Bahasa Indonesia & Inggris
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // progress logger
            }
          },
        }
      );

      const rawText = result.data.text || '';
      console.log('📝 Raw OCR Text:\n', rawText);

      return this.extractReceiptDetails(rawText);
    } catch (error) {
      console.error('Error saat proses OCR:', error);
      // Fallback: jika OCR gagal atau image tidak terbaca
      return this.extractReceiptDetails('');
    }
  }

  /**
   * Ekstrak Merchant, Tanggal, Item, dan Total dari teks OCR
   */
  static extractReceiptDetails(rawText) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Ekstrak Merchant (biasanya ada di 1-4 baris teratas)
    let merchant = 'Struk Belanja';
    let category = 'Belanja';

    const merchantKeywords = [
      { name: 'INDOMARET', match: /indomaret|indo\s*maret/i, category: 'Kebutuhan Rumah' },
      { name: 'ALFAMART', match: /alfamart|alfa\s*mart/i, category: 'Kebutuhan Rumah' },
      { name: 'SUPERINDO', match: /super\s*indo|superindo/i, category: 'Belanja' },
      { name: 'STARBUCKS', match: /starbucks/i, category: 'Makan & Minum' },
      { name: 'MCDONALDS', match: /mcdonald|mcd/i, category: 'Makan & Minum' },
      { name: 'KFC', match: /kfc|kentucky/i, category: 'Makan & Minum' },
      { name: 'SPBU PERTAMINA', match: /pertamina|spbu/i, category: 'Transportasi' },
      { name: 'KIMIA FARMA', match: /kimia\s*farma|apotek/i, category: 'Kesehatan' },
    ];

    for (const line of lines.slice(0, 5)) {
      for (const m of merchantKeywords) {
        if (m.match.test(line)) {
          merchant = m.name;
          category = m.category;
          break;
        }
      }
      if (merchant !== 'Struk Belanja') break;
    }

    // Jika tidak cocok keyword spesifik, gunakan baris pertama non-kosong sebagai merchant
    if (merchant === 'Struk Belanja' && lines.length > 0) {
      merchant = lines[0].replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 30).trim() || 'Struk Belanja';
    }

    // 2. Ekstrak Tanggal (DD/MM/YYYY atau DD-MM-YYYY)
    let date = new Date().toISOString().split('T')[0];
    const dateMatch = rawText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (dateMatch) {
      let day = dateMatch[1].padStart(2, '0');
      let month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      // Validasi range bulan
      if (Number(month) <= 12 && Number(day) <= 31) {
        date = `${year}-${month}-${day}`;
      }
    }

    // 3. Ekstrak Total Belanja
    let total = 0;
    const totalRegex = /(?:total|grand\s*total|total\s*bayar|total\s*belanja|tagihan|jumlah|bayar|cash|tunai)[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/i;
    
    // Cari dari baris ke bawah (karena TOTAL struk selalu di bagian bawah)
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(totalRegex);
      if (match && match[1]) {
        // Hilangkan titik ribuan atau koma
        const cleanNumber = match[1].replace(/\./g, '').replace(/,/g, '');
        const parsed = parseInt(cleanNumber, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100000000) {
          total = parsed;
          break;
        }
      }
    }

    // Fallback: Jika regex spesifik tidak dapat, cari angka terbesar di 5 baris terakhir
    if (total === 0) {
      const lastLines = lines.slice(-8).join(' ');
      const numbers = lastLines.match(/\b\d{1,3}(?:\.\d{3})+\b|\b\d{4,7}\b/g) || [];
      const parsedNumbers = numbers
        .map((n) => parseInt(n.replace(/\./g, ''), 10))
        .filter((n) => !isNaN(n) && n >= 1000 && n <= 10000000);
      
      if (parsedNumbers.length > 0) {
        total = Math.max(...parsedNumbers);
      }
    }

    return {
      merchant,
      category,
      date,
      totalAmount: total,
      rawTextSummary: lines.slice(0, 10).join(' | '),
    };
  }
}
