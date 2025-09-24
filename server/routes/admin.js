import express from "express";
import jwt from "jsonwebtoken";
import { authenticateAdmin } from "../utils/auth.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

// POST /api/admin/sign-in
router.post("/sign-in", async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, message: "Login and password are required" });
        }

        // Проверяем логин/пароль с .env
        if (
            login !== process.env.ADMIN_LOGIN ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({ success: false, message: "Invalid login or password" });
        }

        // Генерация токена (роль admin)
        const token = jwt.sign(
            { role: "admin" }, // полезно добавить роль в payload
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({ success: true, token });
    } catch (err) {
        console.error("Error in /api/admin/sign-in:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/verify-token", authenticateAdmin, (req, res) => {
    return res.json({ success: true });
});

router.post("/client", authenticateAdmin, async (req, res) => {
    try {
        const { referralCode } = req.body;

        if (!referralCode) {
            return res.status(400).json({ success: false, message: "Referral code is required" });
        }

        const user = await prisma.user.findUnique({
            where: { referralCode },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                discount: true,
                totalVisits: true,
                friendsInvited: true,
                friendsVisited: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        return res.json({ success: true, user });
    } catch (err) {
        console.error("Error in /client:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


router.post("/mark-visit", authenticateAdmin, async (req, res) => {
    try {
        const { referralCode } = req.body;

        if (!referralCode) {
            return res.status(400).json({ success: false, message: "Referral code is required" });
        }

        // Находим пользователя
        const user = await prisma.user.findUnique({
            where: { referralCode },
            select: {
                id: true,
                totalVisits: true,
                freeDishProgress: true,
                invitedById: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        // Считаем новое значение freeDishProgress
        let newFreeDishProgress = user.freeDishProgress + 1;
        let freeDishEarned = false;

        if (newFreeDishProgress > 5) {
            newFreeDishProgress = 0;
            // freeDishEarned = true;
        }

        // Увеличиваем количество визитов
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                totalVisits: { increment: 1 },
                freeDishProgress: newFreeDishProgress
            }
        });

        // Если был приглашён кем-то, обновляем прогресс пригласившего
        if (user.invitedById) {
            const inviter = await prisma.user.update({
                where: { id: user.invitedById },
                data: { friendsVisited: { increment: 1 } }
            });


            if (inviter.friendsVisited + 1 === 5) {
                await prisma.achievement.create({
                    data: {
                        userId: inviter.id,
                        type: "friends_visited_5",
                        isCompleted: true,
                        achievedAt: new Date(),
                    },
                });
                await prisma.user.update({
                    where: { id: inviter.id },
                    data: { discount: { increment: 3 } } // увеличиваем скидку
                });
            }

            if (inviter.friendsVisited + 1 === 10) {
                await prisma.achievement.create({
                    data: {
                        userId: inviter.id,
                        type: "friends_visited_10",
                        isCompleted: true,
                        achievedAt: new Date(),
                    },
                });
                await prisma.user.update({
                    where: { id: inviter.id },
                    data: { discount: { increment: 3 } } // увеличиваем скидку
                });
            }

        }

        return res.json({ success: true, updatedVisits: updatedUser.totalVisits });
    } catch (err) {
        console.error("Error in /mark-visit:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});



export default router;