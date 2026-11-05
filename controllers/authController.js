import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const authResponse = (user) => ({
  _id: user.id || user._id,
  name: user.name,
  email: user.email,
  token: generateToken(user.id || user._id),
});

const isText = (value) => typeof value === "string" && value.trim().length > 0;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (![name, email, password].every(isText)) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();

  const { rows: existing } = await query("SELECT id FROM public.users WHERE email = $1", [
    cleanEmail,
  ]);
  if (existing.length > 0) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows } = await query(
    "INSERT INTO public.users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name.trim(), cleanEmail, hashedPassword]
  );

  res.status(201).json(authResponse(rows[0]));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (![email, password].every(isText)) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const { rows } = await query(
    "SELECT id, name, email, password FROM public.users WHERE email = $1",
    [cleanEmail]
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json(authResponse(user));
});

export const getMe = asyncHandler(async (req, res) => {
  const { _id, name, email } = req.user;
  res.json({ _id, name, email });
});
