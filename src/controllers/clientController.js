
import { ClientCompany } from "../models/ClientCompany.js";
import Clients from "../models/Clients.js";

export const createClient = async (req, res) => {
    try {
        const {name , ruc , email , address , phone} = req.body;
        const client = await Clients.create({
            name: req.body.name,
            ruc: req.body.ruc,
            email: req.body.email,            
            address: req.body.address,
            phone: req.body.phone,
        });

        return res.json(client);
    } catch (error) {
        console.error("Error al crear el cliente:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
};



export const addClientAuthorization = async (req, res) => {
    try {
        const { id } = req.params; // ID del cliente
        const { companyName, domain } = req.body;

    
        if (!companyName || !domain) {
            return res.status(400).json({
                error: "Todos los campos son obligatorios"
            });
        }

        const client = await Clients.findById(id);
        if (!client) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

    
        const company = await ClientCompany.create({
            clientId: id,
            companyName,
            domain: domain.toLowerCase().trim()
        });

        return res.json({
            message: "Empresa autorizada registrada correctamente",
            company
        });

    } catch (error) {
        console.error("Error agregando autorización:", error);

        // Manejar error si se intenta duplicar (violación del índice único)
        if (error.code === 11000) {
            return res.status(400).json({
                error: "Esta empresa ya está registrada para este cliente"
            });
        }

        return res.status(500).json({ error: "Error del servidor" });
    }
};
