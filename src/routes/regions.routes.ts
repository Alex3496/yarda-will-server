import { Router } from "express";
import {
    createRegion,
    deleteRegion,
    getRegionById,
    getRegions,
    getNextKey,
    updateRegion,
} from "../controllers/regions.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const regionsRouter = Router();

regionsRouter.get("/next-key", [authenticate], getNextKey);
regionsRouter.post("/",        [authenticate], createRegion);
regionsRouter.get("/",         [authenticate], getRegions);
regionsRouter.get("/:id",      [authenticate], getRegionById);
regionsRouter.patch("/:id",    [authenticate], updateRegion);
regionsRouter.delete("/:id",   [authenticate, requireAdmin], deleteRegion);

export default regionsRouter;
