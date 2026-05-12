import { Router } from "express";
import {
    createBrand,
    deleteBrand,
    getBrandById,
    getBrands,
    getNextKey,
    updateBrand,
} from "../controllers/brands.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const brandsRouter = Router();

brandsRouter.get("/next-key", [authenticate], getNextKey);
brandsRouter.post("/",        [authenticate], createBrand);
brandsRouter.get("/",         [authenticate], getBrands);
brandsRouter.get("/:id",      [authenticate], getBrandById);
brandsRouter.patch("/:id",    [authenticate], updateBrand);
brandsRouter.delete("/:id",   [authenticate, requireAdmin], deleteBrand);

export default brandsRouter;
