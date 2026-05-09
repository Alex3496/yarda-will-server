import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../utils/jwt";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        const token: string | undefined = req.cookies?.token;

        if (!token) {
            res.status(401).json({ message: "Token no proporcionado o invalido" });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ message: "JWT_SECRET no configurado" });
            return;
        }

        const decoded = jwt.verify(token, secret) as TokenPayload;
        res.locals.authUser = decoded;
        next();
    } catch (_error) {
        res.status(401).json({ message: "Token invalido o expirado" });
    }
};

export const requireAdmin = (
    _req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const authUser = res.locals.authUser as TokenPayload | undefined;

    if (!authUser) {
        res.status(401).json({ message: "Usuario no autenticado" });
        return;
    }

    if (authUser.role !== "admin") {
        res.status(403).json({ message: "Acceso solo para administradores" });
        return;
    }

    next();
};
