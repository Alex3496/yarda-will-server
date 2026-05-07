import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model";

const sanitizeUser = (userDoc: unknown): Record<string, unknown> => {
    const user = userDoc as { toObject: () => Record<string, unknown> };
    const plainUser = user.toObject();
    delete plainUser.password;
    return plainUser;
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, username, email, password } = req.body as {
            identifier?: string;
            username?: string;
            email?: string;
            password?: string;
        };

        const loginIdentifier = identifier ?? username ?? email;

        if (!loginIdentifier || !password) {
            res.status(400).json({
                message: "username/email y password son requeridos",
            });
            return;
        }

        const normalizedIdentifier = loginIdentifier.trim();
        const query = normalizedIdentifier.includes("@")
            ? { email: normalizedIdentifier.toLowerCase() }
            : { username: normalizedIdentifier };

        const user = await User.findOne(query).select("+password");

        if (!user) {
            res.status(401).json({ message: "Credenciales invalidas" });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ message: "Credenciales invalidas" });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ message: "Usuario inactivo" });
            return;
        }

        res.status(200).json({
            message: "Login exitoso",
            user: sanitizeUser(user),
        });
    } catch (error) {
        res.status(500).json({ message: "Error en login", error });
    }
};
