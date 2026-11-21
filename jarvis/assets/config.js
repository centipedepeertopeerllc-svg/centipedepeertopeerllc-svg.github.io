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
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "138e9b00dca0a00f6642db21c4d79799f2c0d47e783ce60c9ecc1c75d66df576" }
  ]
};
