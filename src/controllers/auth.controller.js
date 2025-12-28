import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../models/user.model.js";
import jwt from "jsonwebtoken"; //added JWT

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, gender, dateOfBirth, phone, email, password } =
      req.body;

    console.log("Signup attempt for email:", email); // Debug log

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const parsedDOB = new Date(dateOfBirth);
    if (isNaN(parsedDOB)) {
      return res.status(400).json({ message: "Invalid dateOfBirth format" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      firstName,
      lastName,
      gender,
      dateOfBirth: parsedDOB,
      phone,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error); // More detailed error log
    console.error("Error stack:", error.stack); // Stack trace
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined, // Show error in dev
    });
  }
};

export const login = async (req, res) => {
  try{
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "email atau password salah oi" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "email atau password salah oi" });
    }

    //Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    //return token
    res.status(200).json({ success: true, message: "Login successful", 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName 
        }
    });
  }

  catch(error){
    console.error("Login error:", error); // Login detail error log
    res.status(500).json({ message: "Internal server error" });
  }
};