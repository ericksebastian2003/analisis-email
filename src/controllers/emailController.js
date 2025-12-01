import { ClientsCompany } from "../models/ClientsCompany.js";
import { Email } from "../models/Email.js";
import mongoose from "mongoose";
export const bulkInsertEmails = async (req, res) => {
    try {
        const clientId = req.params.id;
        const emails = Array.isArray(req.body.emails) ? req.body.emails : req.body;
        
        // --- 1. Validación Inicial ---
        if (!Array.isArray(emails) || emails.length === 0) {
            console.warn("[E-01] Error 400: No se encontró un arreglo de correos para procesar.");
            return res.status(400).json({ error: "Se debe enviar un arreglo de correos" });
        }

        const smtpIdsToFind = emails.map(e => e.smtpId).filter(id => id);
        
        const existingEmails = await Email.find({ 
            clientId, 
            smtpId: { $in: smtpIdsToFind } 
        }, { smtpId: 1, _id: 0 }); 

        const existingSet = new Set(existingEmails.map(e => e.smtpId));
        const clientObjectId = new mongoose.Types.ObjectId(clientId);
        const clientCompanies = await ClientsCompany.find({ clientId: clientObjectId });
                const validEmails = new Set(
            clientCompanies.map(c => c.domain.toLowerCase())
        );
        
        const validToInsert = [];
        const failed = [];
        const seenSmtpIds = new Set();

        
        emails.forEach((e, i) => {
            let reason = null;
            
            const senderEmailLower = e.senderDomain ? e.senderDomain.toLowerCase() : '';
            
            if (!e.recipient || !e.sender || !e.senderDomain || !e.sentAt || !e.smtpId || !e.content) reason = "Todos los campos son obligatorios faltantes";
    
            if (!reason && !validEmails.has(senderEmailLower)) {
                reason = `Remitente no autorizado: ${e.senderDomain}`;
            }
            if (!reason && existingSet.has(e.smtpId)) {
                reason = `smtpId duplicado ya existente en DB: ${e.smtpId}`;
            }
            if (!reason) {
                if (seenSmtpIds.has(e.smtpId)) {
                    reason = `smtpId duplicado en el payload: ${e.smtpId}`;
                } else {
                    seenSmtpIds.add(e.smtpId);
                }
            }
            if (reason) {
                failed.push({ index: i, reason: reason, email: e });
            } else {
                validToInsert.push({
                    clientId,
                    recipient: e.recipient,
                    sender: e.sender,
                    senderDomain: e.senderDomain,
                    sentAt: e.sentAt,
                    smtpId: e.smtpId,
                    content: e.content
                })            }
        });
        
        if (validToInsert.length > 0) {
            console.log(`[I-01] Insertando ${validToInsert.length} correos en lote...`);
            await Email.insertMany(validToInsert, { ordered: false }); 
            console.log(`[I-02] Inserción en lote completada.`);
        } else {
            console.log("[I-01] No hay correos válidos para insertar.");
        }

        console.log(`--- FIN bulkInsertEmails ---`);
        return res.json({
            inserted: validToInsert.length,
            failed
        });

    } catch (err) {
        console.error("--- ERROR EN bulkInsertEmails ---");
        console.error("Mensaje de error:", err.message);
        console.error(err); 
        return res.status(500).json({ error: "Error del servidor" });
    }
};
export const searchEmails = async (req, res) => {
    try {
        const clientId = req.params.id;

        // Filtros recibidos por query string
        const { content, recipient, sender, senderDomain, fromDate, toDate } = req.query;

        if (!content) {
            return res.status(400).json({ error: "El filtro 'content' es obligatorio" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Construcción de filtros
        const filters = { 
            clientId, 
            content: { $regex: content, $options: "i" } 
        };

        if (recipient) filters.recipient = { $regex: recipient, $options: "i" };
        if (sender) filters.sender = { $regex: sender, $options: "i" };
        if (senderDomain) filters.senderDomain = { $regex: senderDomain, $options: "i" };

        if (fromDate || toDate) {
            filters.sentAt = {};
            if (fromDate) filters.sentAt.$gte = new Date(fromDate);
            if (toDate) filters.sentAt.$lte = new Date(toDate);
        }

        console.log("Filtros aplicados:", filters);

        const total = await Email.countDocuments(filters);

        const results = await Email.find(filters)
            .skip(skip)
            .limit(limit)
            .sort({ sentAt: -1 });

        console.log(`Mostrando página ${page} de resultados, limit ${limit}, total encontrados ${total}`);

        return res.json({
            page,
            limit,
            total,
            results,
        });

    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Error del servidor" });
    }
};