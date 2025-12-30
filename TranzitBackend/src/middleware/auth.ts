import { clerkClient } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        await clerkClient.verifyToken(token);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
