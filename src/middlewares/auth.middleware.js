import jwt, { decode } from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headeres.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split("")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
