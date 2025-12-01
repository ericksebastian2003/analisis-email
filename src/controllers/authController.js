import { User } from "../models/Users.js";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
    try {
        const { name, email, password, role, clientId } = req.body;

        // Validar campos obligatorios
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // Validar rol permitido
        if (!["admin", "client"].includes(role)) {
            return res.status(400).json({ error: "Rol inválido (permitidos: admin, client)" });
        }

        // Si el usuario es CLIENTE → debe tener clientId
        if (role === "client" && !clientId) {
            return res.status(400).json({
                error: "clientId es obligatorio para usuarios con rol 'client'"
            });
        }

        // Revisar duplicados
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        // Crear usuario
        const user = new User({
            name,
            email,
            password,
            role,
            clientId: role === "client" ? clientId : null
        });

        await user.save();

        // Token
        const token = user.generateJWT();

        return res.json({
            message: "Usuario registrado correctamente",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                clientId: user.clientId
            },
            token
        });

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar
        if (!email || !password) {
            return res.status(400).json({ error: "Email y password obligatorios" });
        }

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        // Confirmar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        // Generar token
        const token = user.generateJWT();

        return res.json({
            message: "Login exitoso",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                clientId: user.clientId
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error del servidor" });
    }
};
