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
                friendsVisited: true,
                comment: true
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email code is required" });
        }

        // Находим пользователя
        const user = await prisma.user.findUnique({
            where: { email },
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
                referralCode: true,
                totalVisits: true,
                createdAt: true,
                discount: true,
                friendsInvited: true,
                visits: {
                    orderBy: { visitDate: "desc" },
                    take: 1,
                    select: { visitDate: true }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }


        res.json(client);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


// отображение общей информации
router.get("/clients-brief", async (req, res) => {
    try {
        // общее количество клиентов
        const total = await prisma.user.count();

        // --- подсчёт визитов за месяц ---
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthVisits = await prisma.visit.count({
            where: {
                visitDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });


        res.json({ total, monthVisits });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// отображение таблицы всех клиентов

// router.get("/clients-table", async (req, res) => {
//     try {
//         let { page = 1, limit = 30 } = req.query;

//         page = parseInt(page, 10);
//         limit = parseInt(limit, 10);

//         if (isNaN(page) || page < 1) page = 1;
//         if (isNaN(limit) || limit < 1) limit = 30;

//         const skip = (page - 1) * limit;

//         // общее количество клиентов
//         const total = await prisma.user.count();

//         // список клиентов с последним визитом
//         const clients = await prisma.user.findMany({
//             skip,
//             take: limit,
//             orderBy: { createdAt: "desc" }, // например, новые сверху
//             select: {
//                 email: true,
//                 referralCode: true,
//                 createdAt: true,
//                 totalVisits: true,
//                 discount: true,
//                 friendsInvited: true,
//                 visits: {
//                     orderBy: { visitDate: "desc" },
//                     take: 1,
//                     select: { visitDate: true }
//                 }
//             }
//         });


//         res.json({ clients, total });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });




router.post("/clients-table", async (req, res) => {
    try {
        let { page = 1, limit = 30, filters = {} } = req.body;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 30;

        const skip = (page - 1) * limit;

        // where для фильтрации
        const where = {};

        // фильтр по дате регистрации
        if (filters.registrationDate?.from || filters.registrationDate?.to) {
            where.createdAt = {};
            if (filters.registrationDate.from) {
                where.createdAt.gte = new Date(filters.registrationDate.from);
            }
            if (filters.registrationDate.to) {
                where.createdAt.lte = new Date(filters.registrationDate.to);
            }
        }

        // фильтр по totalVisits
        if (filters.totalVisits?.from || filters.totalVisits?.to) {
            where.totalVisits = {};
            if (filters.totalVisits.from) {
                where.totalVisits.gte = parseInt(filters.totalVisits.from, 10);
            }
            if (filters.totalVisits.to) {
                where.totalVisits.lte = parseInt(filters.totalVisits.to, 10);
            }
        }

        // фильтр по скидке
        if (filters.discount?.from || filters.discount?.to) {
            where.discount = {};
            if (filters.discount.from) {
                where.discount.gte = parseFloat(filters.discount.from);
            }
            if (filters.discount.to) {
                where.discount.lte = parseFloat(filters.discount.to);
            }
        }

        // фильтр по друзьям
        if (filters.friends?.from || filters.friends?.to) {
            where.friendsInvited = {};
            if (filters.friends.from) {
                where.friendsInvited.gte = parseInt(filters.friends.from, 10);
            }
            if (filters.friends.to) {
                where.friendsInvited.lte = parseInt(filters.friends.to, 10);
            }
        }

        // фильтр по последнему визиту
        if (filters.lastVisit?.from || filters.lastVisit?.to) {
            where.visits = { some: { visitDate: {} } };
            if (filters.lastVisit.from) {
                where.visits.some.visitDate.gte = new Date(filters.lastVisit.from);
            }
            if (filters.lastVisit.to) {
                where.visits.some.visitDate.lte = new Date(filters.lastVisit.to);
            }
        }

        // общее количество
        const total = await prisma.user.count({ where });

        // список клиентов
        const clients = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                email: true,
                referralCode: true,
                createdAt: true,
                totalVisits: true,
                discount: true,
                friendsInvited: true,
                visits: {
                    orderBy: { visitDate: "desc" },
                    take: 1,
                    select: { visitDate: true }
                }
            }
        });

        res.json({ clients, total });
    } catch (err) {
        console.error("Error fetching clients with filters:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// список визитов клиента
router.post("/client-visits", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // находим клиента
        const client = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // достаём все визиты
        const visits = await prisma.visit.findMany({
            where: { userId: client.id },
            orderBy: { visitDate: "desc" },
            select: { visitDate: true }
        });

        // форматируем даты (например "2025-10-02")
        const formattedVisits = visits.map(v =>
            v.visitDate.toISOString().slice(0, 10)
        );

        res.json({ visits: formattedVisits });
    } catch (err) {
        console.error("Error fetching client visits:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// список приглашённых друзей
router.post("/client-friends", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // находим клиента с его рефералами
        const client = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                referrals: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        email: true,
                        referralCode: true,
                        createdAt: true,
                        totalVisits: true,
                        discount: true,
                        friendsInvited: true,
                        visits: {
                            orderBy: { visitDate: "desc" },
                            take: 1,
                            select: { visitDate: true }
                        }
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // форматируем visits (чтобы фронту было удобно сразу использовать slice(0,10))
        const friends = client.referrals.map(f => ({
            ...f,
            visits: f.visits.map(v => ({
                visitDate: v.visitDate.toISOString()
            }))
        }));

        res.json({ friends });
    } catch (err) {
        console.error("Error fetching client friends:", err);
        res.status(500).json({ error: "Server error" });
    }
});




export default router;