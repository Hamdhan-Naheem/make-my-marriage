import { PrismaWeddingRepository } from "./wedding.repository.js";
import { WeddingService } from "./wedding.service.js";

export const weddingService = new WeddingService(new PrismaWeddingRepository());

