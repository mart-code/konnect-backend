import jwt from "jsonwebtoken";

export const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.jwt;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
};

export const getUserIdFromRequest = (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = jwt.verify(token, process.env.JWT_KEY);
  return payload.userId;
};

export const verifyToken = (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    req.userId = userId;
    next();
  } catch (_err) {
    return res.status(403).json({ message: "Token is not valid" });
  }
};
