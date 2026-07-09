import mongoose from "mongoose";

const taskSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pendiente", "En Progreso", "Completada"],
      default: "Pendiente",
    },
    clienteId: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, clienteId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
