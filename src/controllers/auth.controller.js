import bcrypt from "bcryptjs";
import { findUserByEmail, findUserByEmailForLogin, createUser } from "../models/user.model.js";
import jwt from "jsonwebtoken"; //added JWT

export const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      email,
      role = "user",
      password,
    } = req.body;

    if (!firstName || !lastName || !gender || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedRole = (role || "user").toLowerCase().trim();
    if (!["user", "partner"].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'user' or 'partner'" });
    }

    console.log("Signup attempt for email:", email, "with role:", normalizedRole);

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

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await findUserByEmailForLogin(email);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    //Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

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
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
