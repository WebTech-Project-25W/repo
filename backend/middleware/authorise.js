module.exports = (allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(500).json({ message: "Authorisation failed: no user context found." });
    }

    if (!req.user.role) {
      return res.status(500).json({ message: "Authorisation failed: no user role association with user." });
    }

    const role = req.user.role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: `Forbidden: Role '${role}' does not have permission to access this resource.` });
    }

    // authorisation succesfull
    next();
  }
}