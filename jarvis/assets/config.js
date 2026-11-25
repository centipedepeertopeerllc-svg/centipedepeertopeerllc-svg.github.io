// Centipede Peer to Peer, LLC — Jarvis Dashboard configuration.
// The Jarvis Dashboard is the Chief Executive Officer's PRIVATE workspace
// in the company Portal (CPP-POL-2026-055). Its sign-in list holds ONE
// name only: the CEO's. No other person — staff, board, or family — has
// an account on this dashboard, and no account is added without the
// CEO's written direction amending CPP-POL-2026-055.
window.JARVIS_DASH_CONFIG = {
  // Sign-in users (username + password + 2FA — see assets/auth.js).
  // Only the SHA-256 hash of the CEO's one-time TEMPORARY password is
  // stored here; the temporary password itself is never in any file.
  // At first sign-in he must set his own password (at least 10
  // characters, at least one letter, never only numbers) and enroll an
  // authenticator app — the same gate as every company dashboard.
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "cec71dcf978ab90a120f201c26110313914f995172c3c5e0c66a0d23897341c2" }
    { username: "levi.recovery", name: "Levi Allen Spears (Recovery)", role: "Chief Executive Officer — Recovery Login", admin: true, tempPasswordSha256: "9eb7cc05173e7465ab8971643286057d0d909b6272f26d9ae82a5fafa68d9855" },
  ]
};
