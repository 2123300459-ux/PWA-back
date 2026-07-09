import Task from "../models/Task.js";

const allowed = ["Pendiente", "En Progreso", "Completada"];

export async function list(req, res) {
  try {
    const items = await Task.find({ user: req.userId, deleted: false }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener tareas" });
  }
}

export async function create(req, res) {
  try {
    const { title, description = "", status = "Pendiente", clienteId } = req.body;
    if (!title) return res.status(400).json({ message: "El titulo es requerido" });

    const task = await Task.create({
      user: req.userId,
      title,
      description,
      status: allowed.includes(status) ? status : "Pendiente",
      clienteId,
    });

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: "Error al crear tarea" });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Estado invalido" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId, deleted: false },
      updateData,
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar tarea" });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId, deleted: false },
      { deleted: true },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
}

export async function bulksync(req, res) {
  try {
    const { tasks = [] } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: "tasks debe ser array" });
    }

    const clean = tasks
      .filter((t) => t && t.clienteId && t.title)
      .map((t) => ({
        clienteId: String(t.clienteId),
        title: String(t.title),
        description: t.description ?? "",
        status: allowed.includes(t.status) ? t.status : "Pendiente",
      }));

    if (!clean.length) return res.json({ mapping: [] });

    const ops = clean.map((t) => ({
      updateOne: {
        filter: { user: req.userId, clienteId: t.clienteId },
        update: {
          $set: {
            title: t.title,
            description: t.description,
            status: t.status,
            deleted: false,
          },
          $setOnInsert: {
            user: req.userId,
            clienteId: t.clienteId,
          },
        },
        upsert: true,
      },
    }));

    await Task.bulkWrite(ops, { ordered: false });

    const clienteIds = clean.map((t) => t.clienteId);
    const docs = await Task.find({ user: req.userId, clienteId: { $in: clienteIds } })
      .select("_id clienteId");

    const mapping = docs.map((d) => ({ clienteId: d.clienteId, serverId: String(d._id) }));
    return res.json({ mapping });
  } catch (err) {
    console.error("bulksync error:", err);
    return res.status(500).json({ message: "Error en bulksync" });
  }
}
