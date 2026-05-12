import { Router } from "express";
import {
    createVehicleModel,
    deleteVehicleModel,
    getVehicleModelById,
    getVehicleModels,
    getNextKey,
    updateVehicleModel,
} from "../controllers/vehicleModels.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const vehicleModelsRouter = Router();

vehicleModelsRouter.get("/next-key", [authenticate], getNextKey);
vehicleModelsRouter.post("/",        [authenticate], createVehicleModel);
vehicleModelsRouter.get("/",         [authenticate], getVehicleModels);
vehicleModelsRouter.get("/:id",      [authenticate], getVehicleModelById);
vehicleModelsRouter.patch("/:id",    [authenticate], updateVehicleModel);
vehicleModelsRouter.delete("/:id",   [authenticate, requireAdmin], deleteVehicleModel);

export default vehicleModelsRouter;
