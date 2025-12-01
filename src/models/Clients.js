import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        ruc: {
            type: String,             
            required: true,
            unique: true,
            minlength: 13,
            maxlength: 13,
            match: /^[0-9]{13}$/       
        },

        email: {
            type: String,
            required: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,            
            required: false,
            minlength: 7,
            maxlength: 10,
            match: /^[0-9]+$/
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model("Clients", clientSchema);
