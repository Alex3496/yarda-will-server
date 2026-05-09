import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import { sanitizeUser } from "../utils/sanitize";
import { generateToken, TokenPayload } from "../utils/jwt";

/**
 * @function login
 * @description Authenticates a user using either their username or email 
 * along with their password. It checks if the user exists, verifies the password, 
 * and ensures the user is active before returning a successful login response.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password, remember } = req.body as {
            identifier?: string;
            password?: string;
            remember?: boolean;
        };

        const loginIdentifier = identifier;


        if (!loginIdentifier || !password) {
            res.status(400).json({
                message: "username/email y password son requeridos",
            });
            return;
        }

        //It can be either email or username, dynamic query
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

        const token = generateToken({
            id: user._id.toString(),
            username: user.username,
            role: user.role,
        });

        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict" as const,
            ...(remember ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
        };

        res.cookie("token", token, cookieOptions);
        res.status(200).json({
            message: "Login exitoso",
            user: sanitizeUser(user),
        });
    } catch (_error) {
        res.status(500).json({ message: "Error en login" });
    }
};

export const logout = (_req: Request, res: Response): void => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({ message: "Logout exitoso" });
};

export const me = (_req: Request, res: Response): void => {
    const user = res.locals.authUser as TokenPayload;
    res.status(200).json({ user });
};
