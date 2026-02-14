// -------------------------
// Auth Middleware
// -------------------------
// Protects API routes. Returns 401 if not logged in.
// Supports both Passport (req.user) and manual session (req.session.user).

export function requireAuth(req, res, next) {
  const user = req.user || req.session?.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorised. Please log in." });
  }

  // Attach user to req for easy access in controllers
  req.currentUser = { id: user.id, name: user.name, email: user.email };
  next();
}