import { Router } from "express";
import {
    createDriver,
    deleteDriver,
    getDriverById,
    getDrivers,
    getNextKey,
    updateDriver,
} from "../controllers/drivers.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const driversRouter = Router();

driversRouter.get("/next-key", [authenticate], getNextKey);
driversRouter.post("/",        [authenticate], createDriver);
driversRouter.get("/",         [authenticate], getDrivers);
driversRouter.get("/:id",      [authenticate], getDriverById);
driversRouter.patch("/:id",    [authenticate], updateDriver);
driversRouter.delete("/:id",   [authenticate, requireAdmin], deleteDriver);

export default driversRouter;
