import express from "express";
import {
    addClientAuthorization,
    createClient,
    
} from "../controllers/clientController.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Crear cliente
router.post("/", auth, isAdmin, createClient);
// Agregar empresa a un cliente
router.post("/:id/companies", auth, isAdmin, addClientAuthorization);
export default router;
