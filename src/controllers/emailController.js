import { ClientsCompany } from "../models/ClientsCompany.js";
import { Email } from "../models/Email.js";


export const bulkInsertEmails = async (req, res) => {
    try {
        const clientId = req.params.id;
        const emails = Array.isArray(req.body.emails) ? req.body.emails : req.body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: "Se debe enviar un arreglo de correos" });
        }

        const failed = [];
        const validToInsert = [];

        console.log(`Procesando ${emails.length} correos para cliente ${clientId}`);

        for (let i = 0; i < emails.length; i++) {
            const e = emails[i];
            console.log(`[${i}] Correo recibido:`, e);

            // Verificar campos obligatorios
            const requiredFields = e.recipient && e.sender && e.senderDomain && e.sentAt && e.smtpId && e.content;
            if (!requiredFields) {
                console.warn(`[${i}] Falló por campos faltantes`);
                failed.push({ index: i, reason: "Campos obligatorios faltantes", email: e });
                continue;
            }

            // Verificar si el smtpId ya existe
            const exists = await Email.findOne({ smtpId: e.smtpId });
            if (exists) {
                console.warn(`[${i}] smtpId duplicado: ${e.smtpId}`);
                failed.push({ index: i, reason: `smtpId duplicado: ${e.smtpId}`, email: e });
                continue;
            }

            // Verificar si la empresa del remitente está autorizada para este cliente
            const companyExists = await ClientsCompany.findOne({
                clientId,
                domain: e.senderDomain.toLowerCase(), // Normalizamos a minúsculas
            });

            if (!companyExists) {
                console.warn(`[${i}] Empresa no autorizada: ${e.senderDomain}`);
                failed.push({ index: i, reason: `Empresa no autorizada: ${e.senderDomain}`, email: e });
                continue;
            }

            // Preparar correo válido para insertar
            validToInsert.push({
                clientId,
                recipient: e.recipient,
                sender: e.sender,
                senderDomain: e.senderDomain,
                sentAt: e.sentAt,
                smtpId: e.smtpId,
                content: e.content
            });

            console.log(`[${i}] Correo listo para insertar: recipient=${e.recipient}, sender=${e.sender}, senderDomain=${e.senderDomain}, sentAt=${e.sentAt}`);
        }

        // Insertar todos los correos válidos
        if (validToInsert.length > 0) {
            await Email.insertMany(validToInsert);
            console.log(`Se insertaron ${validToInsert.length} correos correctamente`);
        }

        return res.json({
            inserted: validToInsert.length,
            failed
        });

    } catch (err) {
        console.error("Error en bulkInsertEmails:", err);
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