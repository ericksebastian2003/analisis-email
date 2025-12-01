import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.URL_MONGODB);
        console.log("Conexión exitosa");       
    }
    catch(err){
        console.error("Error al conectarse:", err.message);
    }
} 