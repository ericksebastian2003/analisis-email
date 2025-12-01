import { ClientsCompany } from "../models/ClientsCompany.js";
import { Email } from "../models/Email.js";



export const bulkInsertEmails = async (req, res) => {
    try {
        const clientId = req.params.id;
        const emails = Array.isArray(req.body.emails) ? req.body.emails : req.body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: "Se debe enviar un arreglo de correos" });
        }

        console.log(`Recibidos ${emails.length} correos`);

        // 1️⃣ Obtener todos los smtpId enviados
        const smtpIds = emails.map(e => e.smtpId);

        // 2️⃣ Buscar smtpId duplicados en BD en UNA sola consulta
        const existingSmtpIds = await Email.find({ smtpId: { $in: smtpIds } })
            .select("smtpId");

        const existingSet = new Set(existingSmtpIds.map(e => e.smtpId));

        // 3️⃣ Obtener dominios permitidos
        const clientCompanies = await ClientsCompany.find({ clientId });
        const validDomains = new Set(clientCompanies.map(c => c.domain.toLowerCase()));

        const validToInsert = [];
        const failed = [];

        emails.forEach((e, i) => {

            // Validación de campos
            if (!e.recipient || !e.sender || !e.senderDomain || !e.sentAt || !e.smtpId || !e.content) {
                failed.push({ index: i, reason: "Campos obligatorios faltantes", email: e });
                return;
            }

            // smtpId duplicado
            if (existingSet.has(e.smtpId)) {
                failed.push({ index: i, reason: `smtpId duplicado: ${e.smtpId}`, email: e });
                return;
            }

            // Dominio no permitido
            if (!validDomains.has(e.senderDomain.toLowerCase())) {
                failed.push({ index: i, reason: `Empresa no autorizada: ${e.senderDomain}`, email: e });
                return;
            }

            // Insert aprobado
            validToInsert.push({
                clientId,
                recipient: e.recipient,
                sender: e.sender,
                senderDomain: e.senderDomain,
                sentAt: e.sentAt,
                smtpId: e.smtpId,
                content: e.content
            });
        });

        if (validToInsert.length > 0) {
            await Email.insertMany(validToInsert, { ordered: false });
        }

        return res.json({
            inserted: validToInsert.length,
            failed
        });

    } catch (err) {
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