import express from "express";
import { bulkInsertEmails, searchEmails } from "../controllers/emailController.js";

const emailRoutes = express.Router();

// CLIENTE inserta emails
emailRoutes.post("/:id", bulkInsertEmails);

// ADMIN busca emails
emailRoutes.get("/:id", searchEmails);

export default emailRoutes;
