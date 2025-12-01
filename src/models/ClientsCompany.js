import mongoose from "mongoose";

const clientsCompanySchema = new mongoose.Schema(
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

clientCompanySchema.index(
    { clientId: 1, companyName: 1, domain: 1 },
    { unique: true }
);

export const ClientsCompany = mongoose.model("ClientsCompany", clientsCompanySchema);
