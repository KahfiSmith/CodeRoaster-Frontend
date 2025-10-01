# CodeRoaster Frontend

Aplikasi web frontend untuk CodeRoaster yang dibangun menggunakan React, TypeScript, dan Vite. Aplikasi ini memungkinkan pengguna untuk melakukan review kode dengan bantuan AI.

## Prasyarat

Pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi 16 atau lebih tinggi)
- [pnpm](https://pnpm.io/) (package manager yang direkomendasikan)

## Instalasi & Menjalankan Project

### 1. Clone Repository
```bash
git clone <repository-url>
cd CodeRoaster-Frontend
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
```bash
# Copy file .env.example menjadi .env.local
cp .env.example .env.local
```

Edit file `.env.local` dan isi dengan konfigurasi OpenAI Anda:
```bash
# OpenAI API Key (wajib diisi)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Model OpenAI yang akan digunakan (opsional, default: gpt-5-mini)
VITE_OPENAI_MODEL=gpt-5-mini

# Maksimum token untuk response (opsional, default: 3000)
# Nilai yang disarankan:
# - Review detail: 8000-12000
# - Review standar: 4000-6000
# - Review cepat: 2000-4000
VITE_OPENAI_MAX_TOKENS=3000

# Temperature/kreativitas AI (opsional, default: 0.3)
# Nilai yang disarankan:
# - Review kreatif/detail: 0.3-0.5
# - Review konsisten: 0.1-0.2
# - Review sangat konsisten: 0.0
VITE_OPENAI_TEMPERATURE=0.3

# Konfigurasi Aplikasi (opsional)
VITE_APP_NAME=Code Roaster
VITE_APP_VERSION=1.0.0
```

### 4. Menjalankan Development Server
```bash
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

## Script yang Tersedia

- `pnpm dev` - Menjalankan development server
- `pnpm build` - Build aplikasi untuk production
- `pnpm preview` - Preview build production secara lokal
- `pnpm lint` - Menjalankan ESLint untuk cek kode
- `pnpm test` - Menjalankan unit tests
- `pnpm test:ui` - Menjalankan test dengan UI
- `pnpm test:coverage` - Menjalankan test dengan coverage report

## Struktur Project

```
CodeRoaster-Frontend/
│
├── public/               # Asset statis
│   ├── fonts/           # Font files
│   └── icons/           # Icon SVG files
│
└── src/                 # Source code utama
    ├── components/      # React components
    │   ├── common/      # Komponen umum
    │   ├── features/    # Komponen fitur spesifik
    │   ├── layout/      # Komponen layout
    │   └── ui/          # Komponen UI dasar
    ├── hooks/           # Custom React hooks
    ├── lib/             # Utilitas dan helpers
    ├── pages/           # Halaman-halaman aplikasi
    ├── services/        # Service layer (API calls)
    ├── store/           # State management (Zustand)
    └── types/           # TypeScript type definitions
```

## Fitur Utama

- 📁 **File Upload**: Upload file kode untuk direview
- 🤖 **AI Code Review**: Review kode otomatis menggunakan OpenAI
- 📝 **Review History**: Lihat riwayat review yang telah dilakukan
- 🔖 **Bookmarks**: Simpan review favorit
- 🌙 **Dark/Light Mode**: Toggle tema terang dan gelap
- 📊 **Review Statistics**: Statistik penggunaan aplikasi

## Teknologi yang Digunakan

- **React 18** - Library UI
- **TypeScript** - Type safety
- **Vite** - Build tool yang cepat
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **OpenAI API** - AI code review
- **Vitest** - Testing framework

## Konfigurasi OpenAI

### Model yang Didukung
- `gpt-5-mini` - Untuk review paling detail (recommended)
- `gpt-5-nano` - Performa seimbang
- `gpt-4.1-mini` - Review lebih cepat
- `gpt-4.1-nano` - Review paling ringan
- `gpt-4o-mini`, `o1-mini`, `o4-mini` - Model alternatif

### Pengaturan Token
- **Max Tokens**: Menentukan panjang maksimum response AI
  - Nilai tinggi = review lebih detail tapi lebih mahal
  - Nilai rendah = review singkat tapi lebih murah

### Pengaturan Temperature
- **0.0-0.2**: Review sangat konsisten dan deterministik
- **0.3-0.5**: Review lebih kreatif dan bervariasi
- **0.6-1.0**: Review sangat kreatif (tidak disarankan untuk code review)

## Troubleshooting

### Error: "OpenAI API key not found"
Pastikan Anda telah mengatur `VITE_OPENAI_API_KEY` di file `.env.local`.

### Port 5173 sudah digunakan
Vite akan otomatis mencari port yang tersedia. Atau Anda bisa menentukan port spesifik:
```bash
pnpm dev --port 3000
```

### Dependencies error
Hapus `node_modules` dan install ulang:
```bash
rm -rf node_modules
pnpm install
```

## Kontribusi

1. Fork repository ini
2. Buat branch untuk fitur baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request
