import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        role: {
            type: String,
            enum: ["admin", "client"],
            required: true
        },

        clientId: {
            type: mongoose.Types.ObjectId,
            ref: "Client",
            required: function () {
                return this.role === "client";
            }
        },

        isActive: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
);

// ================================================
// 🔐 Hash de contraseña antes de guardar
// ================================================
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});

// ================================================
// 🔑 Método: Validar contraseña
// ================================================
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// ================================================
// 🔑 Método: Generar JWT
// ================================================
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        {
            id: this._id,
            role: this.role,
            clientId: this.clientId || null
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

export const User = mongoose.model("User", userSchema);
