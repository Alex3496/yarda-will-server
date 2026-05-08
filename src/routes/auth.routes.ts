import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login } from "../controllers/auth.controller";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Demasiados intentos de login, intenta de nuevo en 15 minutos" },
    standardHeaders: true,
    legacyHeaders: false,
});

const authRouter = Router();

authRouter.post("/login", loginLimiter, login);

export default authRouter;
