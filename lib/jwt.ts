import jwt from "jsonwebtoken";

type UserTokenPayload = {
  userId: number;
  name: string;
  email: string;
  role: string;
};

export function createUserToken(payload: UserTokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign(payload, secret, { expiresIn: "1d" });
}