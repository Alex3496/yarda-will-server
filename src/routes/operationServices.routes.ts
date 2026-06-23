import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
    listOperationServices,
    operationServicesReportPDF,
} from "../controllers/operationServices.controller";

const operationServicesRouter = Router();

operationServicesRouter.get("/report-pdf", [authenticate], operationServicesReportPDF);
operationServicesRouter.get("/",           [authenticate], listOperationServices);

export default operationServicesRouter;
