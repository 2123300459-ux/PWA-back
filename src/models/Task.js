import mongoose from "mongoose";
import { timeStamp } from "node:console";
import { type } from "node:os";
import { ref } from "node:process";
import { required } from "zod/mini";

const taskSchema = mongoose.Schema(
    {
        user: { type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ['Pendiente', 'En proceso', 'Completada'],
            default: "Pendiente"
        },
        clienteId: {
            type: String
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {timestamp: true}
)

export default mongoose.model('Task', taskSchema);
