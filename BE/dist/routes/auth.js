"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.post("/register", [
    (0, express_validator_1.body)("username")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        let { username, email, password } = req.body;
        username = username.trim();
        email = email.toLowerCase().trim();
        const existingUser = await User_1.User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email or username already exists",
            });
        }
        const user = new User_1.User({
            username,
            email,
            password,
        });
        await user.save();
        const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 604800;
        const options = { expiresIn };
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, (process.env.JWT_SECRET || "fallback_secret"), options);
        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        let { email, password } = req.body;
        email = email.toLowerCase().trim();
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (!user.isActive) {
            return res.status(401).json({ message: "Account is deactivated" });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const expiresIn = Number(process.env.JWT_EXPIRES_IN) || 604800;
        const options = { expiresIn };
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, (process.env.JWT_SECRET || "fallback_secret"), options);
        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map