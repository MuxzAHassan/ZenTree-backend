import bcrypt from "bcryptjs";
// [FIX 2026-03-29] Use findUserByEmailForLogin (includes password) for login,
// and findUserByEmail (no password) for duplicate check during signup (#6)
import { findUserByEmail, findUserByEmailForLogin, createUser } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, gender, dateOfBirth, phone, email, role = "user", password } =
      req.body;

    // Validate role - ensure it's lowercase and valid
    const normalizedRole = (role || "user").toLowerCase().trim();
    if (!["user", "partner"].includes(normalizedRole)) {
      // [FIX 2026-03-29] Standardized response format with success: false (#10)
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'user' or 'partner'" });
    }

    // [FIX 2026-03-29] Removed debug console.log that logged email addresses in production (#11)

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const parsedDOB = new Date(dateOfBirth);
    if (isNaN(parsedDOB)) {
      return res.status(400).json({ success: false, message: "Invalid dateOfBirth format" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      firstName,
      lastName,
      gender,
      dateOfBirth: parsedDOB,
      phone,
      email,
      role: normalizedRole,
      password: hashedPassword,
    });

    // [FIX 2026-03-29] Added success: true to match standardized response format (#10)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    // [FIX 2026-03-29] Replaced verbose console.error with conditional dev-only logging (#11)
    if (process.env.NODE_ENV === "development") {
      console.error("Signup error:", error.message);
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // [FIX 2026-03-29] Use findUserByEmailForLogin which includes password hash (#6)
    const user = await findUserByEmailForLogin(email);
    if (!user) {
      // [FIX 2026-03-29] Changed from Malay "email atau password salah oi" to English,
      // and added consistent success: false (#9, #10)
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // [FIX 2026-03-29] Changed from Malay to English for consistency (#9)
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    // [FIX 2026-03-29] Conditional dev-only logging instead of always logging (#11)
    if (process.env.NODE_ENV === "development") {
      console.error("Login error:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};