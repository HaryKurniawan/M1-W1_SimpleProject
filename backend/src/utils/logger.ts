/**
 * =============================================================
 * [OWASP A09 - Logging & Monitoring Failures]
 * 
 * Utility logger sederhana untuk mencatat event-event keamanan.
 * Tanpa logging yang memadai, serangan seperti brute-force login
 * atau akses tidak sah tidak akan terdeteksi oleh administrator.
 * 
 * Pada production, sebaiknya gunakan library logging seperti
 * Winston atau Pino yang mendukung log levels, file rotation,
 * dan integrasi dengan monitoring tools (e.g. Datadog, Sentry).
 * =============================================================
 */

// Enum untuk level log
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY', // Level khusus untuk event keamanan
}

// Format timestamp ISO 8601
const getTimestamp = (): string => new Date().toISOString();

/**
 * Fungsi utama logger — mencetak log ke console dengan format terstruktur.
 * Di production, output ini sebaiknya diarahkan ke file atau logging service.
 */
const log = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...(meta && { meta }),
  };

  // [A09] Pastikan semua log tercatat, jangan gunakan catch(e){} kosong
  console.log(JSON.stringify(logEntry));
};

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log(LogLevel.WARN, message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log(LogLevel.ERROR, message, meta),

  /**
   * [A09] Log khusus untuk event keamanan seperti:
   * - Login gagal berulang kali
   * - Akses endpoint tanpa otorisasi
   * - Percobaan manipulasi token
   */
  security: (message: string, meta?: Record<string, unknown>) => log(LogLevel.SECURITY, message, meta),
};

export default logger;
