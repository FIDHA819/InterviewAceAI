import jwt from "jsonwebtoken";
import type { Response } from "express";

export const generateTokens = (
  userId: string,
  res: Response
) => {

  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET missing");
  }

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET missing");
  }

  const accessToken = jwt.sign(
    { id: userId },
    jwtSecret,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    refreshSecret,
    { expiresIn: "7d" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};