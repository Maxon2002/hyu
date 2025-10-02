import express from "express";
import jwt from "jsonwebtoken";
import { authenticateAdmin } from "../utils/auth.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

// авторизация
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


// проверка токена
router.get("/verify-token", authenticateAdmin, (req, res) => {
    return res.json({ success: true });
});


// сканер
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

        if (newFreeDishProgress > 5) {
            newFreeDishProgress = 1;
        }

        // Увеличиваем количество визитов
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                totalVisits: { increment: 1 },
                freeDishProgress: newFreeDishProgress
            }
        });

        // Создаём запись визита
        await prisma.visit.create({
            data: {
                userId: user.id,
                // visitDate автоматически поставится now(), так как в модели default(now())
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


// clients

// Поиск клиентов по email
router.get("/search", async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email query is required" });
        }

        // Ищем пользователей, где email содержит запрос, регистронезависимо
        const clients = await prisma.user.findMany({
            where: {
                email: {
                    contains: email,
                    mode: "insensitive",
                },
            },
            select: {
                email: true
            },
            take: 20, // ограничим количество результатов
        });

        res.json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


// Выбор клиента из поиска
router.get("/search-result", async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email query is required" });
        }

        // Находим пользователя
        const client = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                referralCode: true,
                totalVisits: true,
                createdAt: true,
                discount: true,
                friendsInvited: true
            }
        });

        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        const lastVisit = await prisma.visit.findFirst({
            where: { userId: client.id },
            orderBy: { visitDate: "desc" },
            select: { visitDate: true }
        });

        res.json({
            ...client,
            lastVisit: lastVisit ? lastVisit.visitDate : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



export default router;