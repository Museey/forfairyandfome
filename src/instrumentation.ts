// Vercel reserves the "TZ" environment variable name (can't be set via the
// dashboard), but every date computation in this app (calendar day
// boundaries, Thai date formatting) assumes the server runs in Bangkok time.
// Setting it here runs before any route/module code, so it takes effect
// before the first Date/Intl call in the process.
export function register() {
  process.env.TZ = process.env.TZ || "Asia/Bangkok";
}
