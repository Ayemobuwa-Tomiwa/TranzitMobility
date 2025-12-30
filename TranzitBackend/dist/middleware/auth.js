"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");
    try {
        await clerk_sdk_node_1.clerkClient.verifyToken(token);
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
