import mongoose from "mongoose";

const clientCompanySchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Types.ObjectId,
            ref: "Clients",
            required: true,
            index: true
        },

        companyName: {
            type: String,
            required: true,
            trim: true
        },

        domain: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Evitar duplicados: el mismo cliente no puede registrar la misma empresa + dominio
clientCompanySchema.index(
    { clientId: 1, companyName: 1, domain: 1 },
    { unique: true }
);

export const ClientsCompany = mongoose.model("ClientsCompany", clientCompanySchema);
