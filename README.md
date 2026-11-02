# Keuangan - Financial Application & Net Worth Tracker

Aplikasi manajemen finansial personal dan aset multi-dompet yang aman, modular, dan presisi tinggi menggunakan **React (Vite + Tailwind CSS v4 + Lucide React)** dan **Node.js (Express.js + Prisma ORM + PostgreSQL Decimal)**.

---

## 📁 Struktur Monorepo

```text
keuangan/
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/         # Navbar, TransactionModal, TransferModal
│   │   ├── pages/              # Dashboard (Overview, Wallets, Recent Tx)
│   │   ├── App.jsx             # Main container & Privacy mode state
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma       # Skema 8 entitas lengkap (Decimal 15,2)
│   ├── src/
│   │   ├── config/             # Prisma client instance
│   │   ├── controllers/        # Wallet & Transaction controllers
│   │   ├── middlewares/        # Auth & Global Error Handler
│   │   ├── routes/             # RESTful API Endpoints
│   │   ├── services/           # Business logic ACID ($transaction)
│   │   ├── app.js              # Express app
│   │   └── index.js            # Server entrypoint
│   ├── package.json
│   └── .env                    # Konfigurasi database & port
└── README.md
```

---

## 🚀 Cara Menjalankan

### 1. Jalankan Frontend (Client)
```bash
cd client
npm run dev
```
Aplikasi frontend akan aktif di: **`http://localhost:5173`**

### 2. Jalankan Backend (Server)
Sesuaikan kredensial PostgreSQL pada file `server/.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/keuangan_db?schema=public"
PORT=5000
```

Jalankan migrasi database dan start server:
```bash
cd server
npm run prisma:generate
npx prisma db push # atau npm run prisma:migrate
npm run dev
```
API server akan aktif di: **`http://localhost:5000/api/v1`**

---

## 🔒 Fitur Unggulan Phase 1
- **Presisi Decimal Finansial:** Menggunakan tipe data `Decimal(15, 2)` PostgreSQL melalui Prisma, bebas dari *floating-point rounding issue*.
- **Transfer Atomic (ACID):** Transfer saldo antar dompet dieksekusi dalam satu transaksi database (`prisma.$transaction`) dan tidak tercatat sebagai pengeluaran ganda (*double-counting*).
- **Proteksi Saldo Negatif:** Pengecekan otomatis saldo dompet asal agar transaksi tidak menghasilkan saldo minus.
- **Mode Privasi (Hide Balance):** Tombol sensor nominal (*masking*) langsung dari header dan dashboard untuk keamanan di tempat publik.
- **State Persistence:** Dukungan penyimpanan instan di browser sehingga dashboard langsung dapat dicoba secara interaktif.
