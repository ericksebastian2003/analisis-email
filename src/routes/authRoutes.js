import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Registro de usuarios - Ruta protegida para los admins
router.post("/register", (req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    next();
}, register);

// Login
router.post("/login", (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y password obligatorios" });
    }

    next();
}, login);

export default router;
