# ScientiaX

Backend API untuk aplikasi pembelajaran interaktif dengan AI.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 atau lebih baru)
- Docker & Docker Compose
- PostgreSQL
- Redis

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd Sochratic-The-Luminary-b
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env file dengan konfigurasi database dan API keys
```

4. **Run with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Start development server**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🔗 Frontend Integration

Untuk mengakses API dari frontend yang berada di folder project berbeda, ikuti langkah-langkah berikut:

### 1. Konfigurasi CORS
Backend sudah dikonfigurasi untuk mengizinkan akses dari berbagai port frontend:
- React (3000, 3001)
- Vite (5173)
- Vue CLI (8080)
- Angular (4200)

### 2. Environment Variables Frontend
Tambahkan di file `.env` frontend Anda:
```env
VITE_API_URL=http://localhost:3000/api
# atau
REACT_APP_API_URL=http://localhost:3000/api
```

### 3. Testing Frontend
Buka file `frontend-example.html` di browser untuk testing API secara langsung.

### 4. Dokumentasi Lengkap
Lihat `FRONTEND_INTEGRATION_GUIDE.md` untuk panduan lengkap integrasi frontend.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user

### Chat
- `POST /api/chat/send` - Kirim pesan chat
- `GET /api/chat/history` - Ambil riwayat chat

### Session
- `POST /api/session/create` - Buat session baru
- `GET /api/session/:id` - Ambil session by ID
- `PUT /api/session/:id/complete` - Selesaikan session

### Topic
- `GET /api/topic` - Ambil semua topic
- `GET /api/topic/:id` - Ambil topic by ID

### Experience Points
- `GET /api/exp/user` - Ambil exp user
- `POST /api/exp/add` - Tambah exp user

## 🛠️ Development

### Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Testing
```bash
# Test API health
curl http://localhost:3000/

# Test dengan frontend example
open frontend-example.html
```

## 📁 Project Structure

```
src/
├── index.js              # Main server file
├── routes/               # API routes
│   ├── authRoutes.js     # Authentication routes
│   ├── chatRoutes.js     # Chat routes
│   ├── expRoutes.js      # Experience points routes
│   ├── sessionRoutes.js  # Session routes
│   └── topicRoutes.js    # Topic routes
└── services/             # Business logic
    ├── aiService.js      # AI integration
    ├── chatService.js    # Chat functionality
    ├── expService.js     # Experience points logic
    └── ...
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `FRONTEND_URL` - Frontend URL untuk CORS (optional)
- `PORT` - Server port (default: 3000)

### CORS Configuration
Backend mendukung CORS untuk frontend di berbagai port:
- localhost:3000, localhost:3001 (React)
- localhost:5173 (Vite)
- localhost:8080 (Vue CLI)
- localhost:4200 (Angular)

## 🐛 Troubleshooting

### CORS Issues
1. Pastikan backend berjalan di port 3000
2. Periksa URL frontend sudah diizinkan dalam CORS config
3. Gunakan `credentials: 'include'` di frontend requests
4. Periksa console browser untuk error details

### Database Connection
1. Pastikan PostgreSQL berjalan
2. Periksa `DATABASE_URL` di file `.env`
3. Jalankan `npx prisma migrate dev`

### Redis Connection
1. Pastikan Redis berjalan
2. Periksa `REDIS_URL` di file `.env`

## 📄 License

ISC