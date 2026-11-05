import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
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

  const { rows } = await query("SELECT id, name, email FROM public.users WHERE id = $1", [
    decoded.id,
  ]);

  if (!rows[0]) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  req.user = {
    _id: rows[0].id,
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
  };

  next();
});
