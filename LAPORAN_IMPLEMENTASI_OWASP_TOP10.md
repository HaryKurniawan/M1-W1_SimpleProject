# Laporan Implementasi OWASP Top 10 (2025)

## Project: Simple Login & Register Application

**Tanggal**: 27 Februari 2026  
**Tech Stack**: React + Vite + TypeScript (Frontend) | Express + Prisma + PostgreSQL (Backend)

---

## Pendahuluan

OWASP (Open Web Application Security Project) adalah organisasi global non-profit yang berfokus pada peningkatan keamanan aplikasi web. OWASP Top 10 adalah daftar sepuluh kerentanan keamanan aplikasi yang paling sering menyebabkan kebocoran data, pengambilalihan akun, dan kerusakan sistem.

Dokumen ini merangkum implementasi langkah pencegahan untuk **seluruh 10 kategori OWASP Top 10 2025** pada project sederhana login & register.

---

## A01 — Broken Access Control

### Masalah

Broken Access Control terjadi ketika aplikasi gagal memastikan bahwa pengguna hanya bisa mengakses resource sesuai izinnya. Kesalahan umum adalah mengandalkan pembatasan di sisi frontend saja (menyembunyikan tombol/menu), padahal attacker bisa mengirim request langsung ke API.

### Implementasi Pencegahan

**1. Backend — Profil hanya diakses melalui JWT token, bukan parameter URL**

```typescript
// File: backend/src/controllers/user/userGetController.ts

// [OWASP A01] Menggunakan ID dari JWT token, BUKAN dari parameter URL
// Ini mencegah IDOR (Insecure Direct Object Reference)
// Contoh TIDAK AMAN: GET /api/users/:id → user bisa ganti ID ❌
// Contoh AMAN:       GET /api/users/profile → ID dari token ✅
const userId = req.user?.id; // ID dari JWT yang sudah diverifikasi

const userProfile = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    // password TIDAK di-select — jangan pernah kirim ke client
  },
});
```

**2. Backend — Tipe data ketat untuk JWT Payload**

```typescript
// File: backend/src/middlewares/authMiddleware.ts

// [OWASP A01] Interface ketat untuk data JWT
// Sebelumnya menggunakan `any` yang tidak aman
export interface JwtPayload {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // Bukan `any` lagi
}
```

**3. Frontend — Komentar penjelasan bahwa akses kontrol frontend hanya UX**

```tsx
// File: simple_login_register/src/App.tsx

// [OWASP A01] PENTING: Pembatasan akses di frontend hanyalah untuk UX.
// Keamanan sesungguhnya HARUS divalidasi di BACKEND.
// Attacker bisa melewati frontend dan mengirim request langsung ke API.
const ProtectedRoute = ({ children }) => {
  // Ini hanya UX guard, bukan security guard
};
```

---

## A02 — Security Misconfiguration

### Masalah

Security Misconfiguration terjadi ketika aplikasi memiliki konfigurasi yang tidak aman, seperti CORS terlalu permisif, secret credential yang masuk ke frontend bundle, atau tidak adanya security headers.

### Implementasi Pencegahan

**1. Backend — Helmet untuk HTTP Security Headers**

```typescript
// File: backend/src/index.ts

// [OWASP A02] Helmet menambahkan security headers otomatis:
// X-Content-Type-Options, X-Frame-Options, HSTS, X-XSS-Protection
import helmet from "helmet";
app.use(helmet());
```

**2. Backend — CORS dikonfigurasi ketat**

```typescript
// File: backend/src/index.ts

// [OWASP A02] CORS hanya mengizinkan origin frontend yang spesifik
// SEBELUMNYA: app.use(cors()) → semua origin diizinkan ❌
// SEKARANG: Hanya frontend yang terdaftar ✅
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**3. Frontend — API Key dihapus dari environment variable**

```env
# File: simple_login_register/.env

# [OWASP A02] SEBELUMNYA (TIDAK AMAN):
# VITE_API_KEY=api_key_123 → masuk ke JS bundle → bocor! ❌

# SEKARANG: Hanya data publik di frontend env ✅
VITE_API_URL=http://localhost:3000/api
```

**4. Frontend — Meta tag keamanan di index.html**

```html
<!-- File: simple_login_register/index.html -->
<!-- [OWASP A02] Mencegah kebocoran URL via referrer -->
<meta name="referrer" content="no-referrer" />
```

---

## A03 — Software Supply Chain Failures

### Masalah

Risiko dari dependency pihak ketiga yang bisa mengandung malicious code. Jika maintainer package diretas, kode berbahaya bisa masuk melalui update otomatis.

### Implementasi Pencegahan

**1. Dependency keamanan yang ditambahkan**

```json
// File: backend/package.json
{
  "dependencies": {
    "helmet": "...", // HTTP security headers
    "express-rate-limit": "...", // Rate limiting
    "cookie-parser": "..." // HttpOnly cookie parsing
  }
}
```

**2. Best practice yang direkomendasikan**

```bash
# Gunakan npm ci (bukan npm install) untuk install dari lock file
npm ci

# Audit dependency secara rutin
npm audit

# Gunakan Dependabot atau Snyk untuk monitoring otomatis
```

---

## A04 — Cryptographic Failures

### Masalah

Kegagalan melindungi data sensitif dengan kriptografi yang benar. Kesalahan umum adalah menyimpan token JWT di `localStorage` yang rentan terhadap serangan XSS.

### Implementasi Pencegahan

**1. Backend — Token dikirim via HttpOnly Cookie**

```typescript
// File: backend/src/controllers/user/userLoginController.ts

// [OWASP A04] SEBELUMNYA: res.json({ token }) → disimpan di localStorage ❌
// SEKARANG: Token dikirim via HttpOnly cookie ✅
res.cookie("authToken", token, {
  httpOnly: true, // JavaScript TIDAK bisa akses cookie ini
  secure: process.env.NODE_ENV === "production", // HTTPS only di production
  sameSite: "lax", // Mitigasi CSRF
  maxAge: 24 * 60 * 60 * 1000, // 24 jam
});
```

**2. Backend — Middleware membaca token dari cookie**

```typescript
// File: backend/src/middlewares/authMiddleware.ts

// [OWASP A04] Token dibaca dari HttpOnly cookie
const tokenFromCookie = req.cookies?.authToken;
const authHeader = req.headers["authorization"];
const tokenFromHeader = authHeader && authHeader.split(" ")[1];
const token = tokenFromCookie || tokenFromHeader;
```

**3. Frontend — Tidak lagi menyimpan token di localStorage**

```tsx
// File: simple_login_register/src/pages/Login.tsx

// [OWASP A04] SEBELUMNYA:
// localStorage.setItem('authToken', token); ❌

// SEKARANG: Cookie dikirim otomatis oleh browser.
// Token tidak pernah menyentuh JavaScript. ✅
setIsAuthenticated(true);
navigate("/");
```

**4. Frontend — Cookie dikirim otomatis via withCredentials**

```typescript
// File: simple_login_register/src/services/api.ts

// [OWASP A04] Browser mengirim HttpOnly cookie otomatis
const apiService = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Cookie dikirim pada setiap request
});
```

**5. Backend — Endpoint logout untuk menghapus cookie**

```typescript
// File: backend/src/controllers/user/userGetController.ts

// [OWASP A04] Cookie HttpOnly tidak bisa dihapus oleh JavaScript
// Harus dihapus dari server
export const logoutUser = async (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logout berhasil." });
};
```

---

## A05 — Injection (XSS)

### Masalah

Injection terjadi ketika input pengguna dimasukkan ke sistem tanpa validasi. Pada frontend, bentuk yang paling umum adalah Cross-Site Scripting (XSS) — ketika input user dirender sebagai HTML.

### Implementasi Pencegahan

**1. Backend — Validasi tipe data dan format input**

```typescript
// File: backend/src/controllers/user/userLoginController.ts

// [OWASP A05] Validasi bahwa input bertipe string
if (
  !email ||
  !password ||
  typeof email !== "string" ||
  typeof password !== "string"
) {
  res.status(400).json({ message: "Email dan password wajib diisi!" });
  return;
}

// [OWASP A05] Validasi format email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  res.status(400).json({ message: "Format email tidak valid!" });
  return;
}
```

**2. Backend — Sanitasi input (trim whitespace)**

```typescript
// File: backend/src/controllers/user/userRegisterController.ts

// [OWASP A05] Sanitasi input
const cleanName = name.trim();
const cleanEmail = email.toLowerCase().trim();

// [OWASP A05] Validasi nama — hanya huruf dan spasi
const nameRegex = /^[a-zA-Z\s]+$/;
if (
  !nameRegex.test(cleanName) ||
  cleanName.length < 2 ||
  cleanName.length > 100
) {
  res
    .status(400)
    .json({ message: "Nama hanya boleh terdiri dari huruf dan spasi!" });
  return;
}
```

**3. Backend — Batasi ukuran request body**

```typescript
// File: backend/src/index.ts

// [OWASP A05] Mencegah DoS via payload besar
app.use(express.json({ limit: "10kb" }));
```

**4. Frontend — React auto-escaping mencegah XSS**

```tsx
// File: simple_login_register/src/pages/Home.tsx

// [OWASP A05] React auto-escaping: data user ditampilkan aman
// YANG BERBAHAYA: <div dangerouslySetInnerHTML={{ __html: data }} /> ❌
// YANG AMAN:      <p>{pengguna?.name}</p> ✅
// → Jika nama mengandung <script>, ditampilkan sebagai teks biasa
<span className="text-blue-600">{pengguna?.name}</span>
```

---

## A06 — Insecure Design

### Masalah

Insecure Design bukan bug kode, tetapi kesalahan dalam merancang alur sistem. Contoh: endpoint tanpa pembatasan request yang bisa di-abuse oleh bot.

### Implementasi Pencegahan

**1. Backend — Rate Limiter Global**

```typescript
// File: backend/src/index.ts

// [OWASP A06] Membatasi setiap IP maks 100 request per 15 menit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Terlalu banyak request, coba lagi nanti." },
});
app.use(globalLimiter);
```

**2. Backend — Rate Limiter Khusus Auth (lebih ketat)**

```typescript
// File: backend/src/routes/userRoutes.ts

// [OWASP A06] Rate limiter khusus auth: maks 10 req per 15 menit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Terlalu banyak percobaan, coba lagi nanti." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
```

---

## A07 — Authentication Failures

### Masalah

Mekanisme login yang tidak aman, termasuk penyimpanan password plaintext, tidak ada pembatasan percobaan login, dan password policy yang lemah.

### Implementasi Pencegahan

**1. Backend — Password hashing dengan bcrypt (salt rounds 12)**

```typescript
// File: backend/src/controllers/user/userRegisterController.ts

// [OWASP A07] bcrypt dengan salt rounds 12
// bcrypt memiliki salt otomatis dan sengaja lambat (anti brute force)
// JANGAN bandingkan password langsung: if (password === user.password) ❌
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
```

**2. Backend — Password strength policy**

```typescript
// File: backend/src/controllers/user/userRegisterController.ts

// [OWASP A07] Password policy minimum
if (password.length < 8) {
  res.status(400).json({ message: "Password minimal 8 karakter!" });
}
if (!/[a-zA-Z]/.test(password)) {
  res
    .status(400)
    .json({ message: "Password harus mengandung minimal 1 huruf!" });
}
if (!/[0-9]/.test(password)) {
  res
    .status(400)
    .json({ message: "Password harus mengandung minimal 1 angka!" });
}
```

**3. Backend — Anti user-enumeration**

```typescript
// File: backend/src/controllers/user/userLoginController.ts

// [OWASP A07] Pesan error SAMA untuk email salah dan password salah
// Jika berbeda, attacker bisa mengetahui email mana yang terdaftar
if (!user) {
  res.status(401).json({ message: "Email atau password tidak valid!" });
}
if (!isMatch) {
  res.status(401).json({ message: "Email atau password tidak valid!" });
}
```

**4. Backend — Tidak menggunakan fallback JWT secret**

```typescript
// File: backend/src/middlewares/authMiddleware.ts

// [OWASP A07] JANGAN gunakan fallback secret yang lemah
// SEBELUMNYA: jwt.verify(token, process.env.JWT_SECRET || 'secret') ❌
// SEKARANG: Gagal jika JWT_SECRET tidak dikonfigurasi ✅
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
  return;
}
```

**5. Frontend — Password strength indicator**

```tsx
// File: simple_login_register/src/pages/Register.tsx

// [OWASP A07] Indikator kekuatan password visual
// Membantu user membuat password yang lebih kuat
const hitungKekuatanPassword = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  // → Tampilkan: Lemah / Cukup / Kuat / Sangat Kuat
};
```

---

## A08 — Software/Data Integrity Failures

### Masalah

Aplikasi memuat kode dari sumber eksternal (CDN) tanpa verifikasi integritas. Jika CDN diretas, attacker bisa mengganti script dengan malware.

### Implementasi Pencegahan

**Komentar best practice di index.html**

```html
<!-- File: simple_login_register/index.html -->

<!-- [OWASP A08] Jika memuat script dari CDN, WAJIB gunakan SRI:
<script 
  src="https://cdn.example.com/library.js"
  integrity="sha384-xxxHASHxxx"
  crossorigin="anonymous">
</script>

SRI memastikan browser memverifikasi hash file sebelum menjalankannya.
Jika file diubah, browser akan MENOLAK menjalankan script. -->
```

> **Catatan**: Aplikasi ini tidak memuat script CDN eksternal, sehingga SRI belum diperlukan secara langsung. Namun komentar ini mengedukasi developer tentang best practice jika nantinya menggunakan CDN.

---

## A09 — Logging & Monitoring Failures

### Masalah

Aktivitas mencurigakan tidak tercatat atau dipantau. Attacker bisa melakukan brute force berkali-kali tanpa diketahui administrator.

### Implementasi Pencegahan

**1. Backend — Logger utility terstruktur**

```typescript
// File: backend/src/utils/logger.ts (FILE BARU)

// [OWASP A09] Logger terstruktur dengan level khusus SECURITY
const logger = {
  info: (message, meta?) => log(LogLevel.INFO, message, meta),
  warn: (message, meta?) => log(LogLevel.WARN, message, meta),
  error: (message, meta?) => log(LogLevel.ERROR, message, meta),
  security: (message, meta?) => log(LogLevel.SECURITY, message, meta),
};

// Output: JSON terstruktur dengan timestamp untuk monitoring
// {"timestamp":"2026-02-27T...","level":"SECURITY","message":"Login gagal","meta":{...}}
```

**2. Backend — Log event keamanan di setiap controller**

```typescript
// File: backend/src/controllers/user/userLoginController.ts

// [OWASP A09] Log login gagal untuk deteksi brute force
logger.security("Login gagal - password salah", {
  userId: user.id,
  email: user.email,
  ip: req.ip,
});

// [OWASP A09] Log login berhasil untuk audit trail
logger.info("Login berhasil", {
  userId: user.id,
  ip: req.ip,
});
```

**3. Backend — Log akses tidak sah di middleware**

```typescript
// File: backend/src/middlewares/authMiddleware.ts

// [OWASP A09] Log percobaan akses tanpa token
logger.security("Percobaan akses tanpa token", {
  ip: req.ip,
  path: req.path,
});
```

**4. Frontend/Backend — Tidak ada catch kosong**

```typescript
// [OWASP A09] JANGAN gunakan catch kosong:
// catch(e) {} ❌ → Error hilang tanpa jejak

// SELALU log error:
// catch(e) { logger.error(e) } ✅
```

---

## A10 — Mishandling Exceptional Conditions

### Masalah

Aplikasi mengirim detail error internal (stack trace, SQL query, struktur database) ke frontend yang bisa dimanfaatkan attacker.

### Implementasi Pencegahan

**1. Backend — Pesan error generik ke client**

```typescript
// File: backend/src/controllers/user/userLoginController.ts

// [OWASP A10] SEBELUMNYA (TIDAK AMAN):
// res.status(500).json({ message: '...', error }) ❌
// → Response bisa berisi stack trace atau info database

// SEKARANG (AMAN):
logger.error("Error pada proses login", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
res.status(500).json({ message: "Terjadi kesalahan pada server." });
// → Detail error HANYA ada di server log ✅
```

**2. Diterapkan di SEMUA controller**

Pola yang sama diterapkan di:

- `userLoginController.ts`
- `userRegisterController.ts`
- `userGetController.ts`

---

## Ringkasan Implementasi

| No  | Kategori OWASP            | File yang Dimodifikasi                                                                      | Pencegahan Utama                                                               |
| --- | ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A01 | Broken Access Control     | `authMiddleware.ts`, `userGetController.ts`, `App.tsx`                                      | JWT typing ketat, IDOR prevention, komentar UX vs security                     |
| A02 | Security Misconfiguration | `index.ts`, `.env`, `index.html`, `api.ts`                                                  | Helmet, CORS ketat, hapus API key dari frontend                                |
| A03 | Supply Chain Failures     | `package.json`                                                                              | Dependency security baru, rekomendasi npm audit                                |
| A04 | Cryptographic Failures    | `userLoginController.ts`, `authMiddleware.ts`, `api.ts`, `App.tsx`, `Login.tsx`, `Home.tsx` | HttpOnly cookie menggantikan localStorage                                      |
| A05 | Injection (XSS)           | `userLoginController.ts`, `userRegisterController.ts`, `index.ts`, semua halaman frontend   | Input validation, sanitasi, body limit, React auto-escaping                    |
| A06 | Insecure Design           | `index.ts`, `userRoutes.ts`                                                                 | Rate limiting global + khusus auth                                             |
| A07 | Authentication Failures   | `userRegisterController.ts`, `userLoginController.ts`, `authMiddleware.ts`, `Register.tsx`  | Password policy, bcrypt salt 12, anti-enumeration, password strength indicator |
| A08 | Data Integrity Failures   | `index.html`                                                                                | Komentar SRI best practice                                                     |
| A09 | Logging & Monitoring      | `logger.ts` (baru), semua controller, `authMiddleware.ts`                                   | Logger terstruktur, security event logging                                     |
| A10 | Exceptional Conditions    | Semua controller backend                                                                    | Pesan error generik ke client, detail di server log                            |

---

## Struktur File Project

```
M1-W2_D2_Implement to simple project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── userController.ts
│   │   │   └── user/
│   │   │       ├── userLoginController.ts    ← A04, A05, A07, A09, A10
│   │   │       ├── userRegisterController.ts ← A05, A07, A09, A10
│   │   │       └── userGetController.ts      ← A01, A04, A09, A10
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts             ← A01, A04, A07, A09
│   │   ├── routes/
│   │   │   └── userRoutes.ts                 ← A02, A04, A06
│   │   ├── utils/
│   │   │   └── logger.ts                     ← A09 (FILE BARU)
│   │   └── index.ts                          ← A02, A04, A05, A06
│   └── .env                                  ← A02
│
└── simple_login_register/
    ├── src/
    │   ├── services/
    │   │   └── api.ts                        ← A02, A04, A09
    │   ├── pages/
    │   │   ├── Login.tsx                     ← A04, A05, A10
    │   │   ├── Register.tsx                  ← A05, A07, A10
    │   │   └── Home.tsx                      ← A04, A05, A09, A10
    │   └── App.tsx                           ← A01, A04
    ├── index.html                            ← A02, A08
    └── .env                                  ← A02
```
