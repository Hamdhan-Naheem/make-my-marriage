import { PrismaTaskRepository } from "./task.repository.js";
import { TaskService } from "./task.service.js";

export const taskService = new TaskService(new PrismaTaskRepository());
