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
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" }
  ]
};
