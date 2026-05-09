import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, logout, me } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Demasiados intentos de login, intenta de nuevo en 15 minutos" },
    standardHeaders: true,
    legacyHeaders: false,
});

const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);

export default authRouter;
