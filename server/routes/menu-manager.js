import express from "express";
import jwt from "jsonwebtoken";
import { authenticateAdmin } from "../utils/auth.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();




router.get("/categories", async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({
            orderBy: { position: "asc" },
            include: {
                translations: true
            }
        });

        res.json({ success: true, categories });
    } catch (err) {
        console.error("Error loading categories:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

export default router;