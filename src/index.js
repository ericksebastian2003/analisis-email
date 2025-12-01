import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import emailRoutes from "./routes/emailRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import clientRouter from "./routes/clientRoutes.js";


dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

connectDB();

// Rutas públicas
app.use("/api/v1/auth", authRoutes);

// Rutas protegidas
app.use("/api/v1/emails", emailRoutes);
app.use("/api/v1/clients", clientRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
