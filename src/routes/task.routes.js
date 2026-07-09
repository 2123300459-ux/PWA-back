import { Router } from "express";
import {auth} from "../middleware/auth.js";
import {list, create, update, remove, bulksync} from "../controllers/task.controller.js";

const router = Router();

router.use(auth);

router.get("/", list); // Obtener todas las tareas
router.post("/", create); // Crear una nueva tarea
router.put("/:id", update); // Actualizar una tarea por ID
router.delete("/:id", remove); // Eliminar una tarea por ID
router.post('/bulksync', bulksync); //sincronizar tareas en bloque (crear, actualizar, eliminar)

export default router;