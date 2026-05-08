import jwt from "jsonwebtoken";

export interface TokenPayload {
    id: string;
    username: string;
    role: string;
}

export const generateToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no está configurado');

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as string;
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};
