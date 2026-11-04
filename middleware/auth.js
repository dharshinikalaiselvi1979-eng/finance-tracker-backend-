import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }

  req.user = await User.findById(decoded.id);
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  next();
});
