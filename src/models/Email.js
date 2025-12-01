import mongoose from "mongoose";

// ===============================
// 📌 Email Schema
// ===============================

const emailSchema = new mongoose.Schema(
    {
        // Cliente dueño del correo
        clientId: { 
            type: mongoose.Types.ObjectId,
            ref: "Clients",
            required: true
        },

        recipient: { 
            type: String, 
            required: true,
            trim: true
        },
        sender: { 
            type: String, 
            required: true,
            trim: true
        },

        senderDomain: { 
            type: String, 
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },

        sentAt: { 
            type: Date, 
            required: true 
        },
        smtpId: { 
            type: String,             
            required: true,
            unique: true,           
            trim: true
        },

        content: { 
            type: String, 
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Índice de texto para búsqueda
emailSchema.index({ content: "text" });

// Búsquedas rápidas por cliente + dominio
emailSchema.index({ clientId: 1, senderDomain: 1 });

export const Email = mongoose.model("Email", emailSchema);
