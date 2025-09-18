import express from "express";
import crypto from "crypto";
import redis from "../redis.js"; // используем подключение из redis.js
import { sendOtpMail } from "../utils/mailer.js";
import { authenticateToken } from "../utils/auth.js";

import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import { sendResetPasswordMail } from "../utils/mailer.js"; // функция отправки письма

const router = express.Router();



// --- Генерация случайного OTP ---
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


// --- Отправка OTP ---
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Проверяем, есть ли пользователь с таким email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.json({ success: false, message: "Email already registered" });
        }

        const otp = generateOtp();

        // Сохраняем OTP в Redis на 5 минут
        await redis.setex(`otp:${email}`, 300, otp);

        // Отправляем письмо
        await sendOtpMail(email, otp);

        return res.json({ success: true, message: "OTP sent" });
    } catch (err) {
        console.error("Error in /send-otp:", err);
        return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});



// --- Проверка OTP ---
router.post("/validate-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ valid: false, message: "Email and OTP are required" });
        }

        // Получаем OTP из Redis
        const storedOtp = await redis.get(`otp:${email}`);

        if (storedOtp && storedOtp === otp) {
            // При успешной проверке можно удалить OTP, чтобы нельзя было использовать повторно
            await redis.del(`otp:${email}`);
            return res.json({ valid: true });
        } else {
            return res.json({ valid: false });
        }
    } catch (err) {
        console.error("Error in /validate-otp:", err);
        return res.status(500).json({ valid: false, message: "OTP validation failed" });
    }
});


// --- Проверка реферального кода ---
router.post("/validate-referral", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ valid: false, message: "Referral code is required" });
        }

        // Ищем пользователя с таким ID
        const user = await prisma.user.findUnique({
            where: { referralCode: code }
        });

        if (user) {
            return res.json({ valid: true });
        } else {
            return res.json({ valid: false });
        }
    } catch (err) {
        console.error("Error in /validate-referral:", err);
        return res.status(500).json({ valid: false, message: "Referral validation failed" });
    }
});



// --- Функция генерации случайного кода ---
function generateReferralCode(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// --- Генерация уникального кода ---
async function generateUniqueReferralCode() {
    let unique = false;
    let code;
    while (!unique) {
        code = generateReferralCode();
        const existing = await prisma.user.findUnique({
            where: { referralCode: code }
        });
        if (!existing) unique = true;
    }
    return code;
}

// --- Регистрация ---
router.post("/sign-up", async (req, res) => {
    try {
        const { name, email, password, referralCode: invitedByCode, phone } = req.body;

        // Проверка уникальности email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.json({ success: false, message: "Email already registered" });
        }

        // 1. Ищем пригласившего, если есть код
        let invitedById = null;
        if (invitedByCode) {
            const inviter = await prisma.user.findUnique({ where: { referralCode: invitedByCode } });
            if (inviter) invitedById = inviter.id;
        }

        // 2. Хэшируем пароль
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Генерируем уникальный referralCode для нового пользователя
        const newReferralCode = await generateUniqueReferralCode();

        // 4. Создаём пользователя
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phoneNumber: phone || null,
                passwordHash,
                invitedById,
                referralCode: newReferralCode
            }
        });

        // 5. Обновляем пригласившего (если был)
        if (invitedById) {
            const inviter = await prisma.user.update({
                where: { id: invitedById },
                data: { friendsInvited: { increment: 1 } },
            });

            // Проверка достижений
            if (inviter.friendsInvited + 1 === 5) {
                await prisma.achievement.create({
                    data: {
                        userId: inviter.id,
                        type: "invite_5",
                        isCompleted: true,
                        achievedAt: new Date(),
                    },
                });
            }

            if (inviter.friendsInvited + 1 === 10) {
                await prisma.achievement.create({
                    data: {
                        userId: inviter.id,
                        type: "invite_10",
                        isCompleted: true,
                        achievedAt: new Date(),
                    },
                });
            }
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET, // секрет из .env
            { expiresIn: "7d" } // срок жизни токена
        );

        // Регистрация успешна
        return res.json({ success: true, token });

    } catch (err) {
        console.error("Error in /sign-up:", err);
        return res.status(500).json({ success: false, message: "Registration failed" });
    }
});



// --- Авторизация ---
router.post("/sign-in", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Ищем пользователя по email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Сравниваем пароль
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET, // секрет из .env
            { expiresIn: "7d" } // срок жизни токена
        );

        // Авторизация успешна
        return res.json({ success: true, token });
    } catch (err) {
        console.error("Error in /sign-in:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.json({ success: false, message: "Email not registered" });
        }

        // Генерируем токен
        const token = crypto.randomBytes(32).toString("hex");

        // Сохраняем токен в Redis на 1 час
        await redis.setex(`resetPassword:${token}`, 3600, user.id);

        // Отправляем письмо со ссылкой
        const resetLink = `https://hyu.ae/reset-password?token=${token}`;
        await sendResetPasswordMail(email, resetLink);

        return res.json({ success: true, message: "Password reset link sent" });
    } catch (err) {
        console.error("Error in /forgot-password:", err);
        return res.status(500).json({ success: false, message: "Failed to send reset link" });
    }
});



// --- Сброс пароля ---
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: "Token and new password are required" });
        }

        // Получаем userId по токену из Redis
        const userId = await redis.get(`resetPassword:${token}`);
        if (!userId) {
            return res.json({ success: false, message: "Token is invalid or expired" });
        }

        // Хэшируем новый пароль
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Обновляем пользователя
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });

        // Удаляем токен
        await redis.del(`resetPassword:${token}`);

        return res.json({ success: true });
    } catch (err) {
        console.error("Error in /reset-password:", err);
        return res.status(500).json({ success: false, message: "Password reset failed" });
    }
});



// --- Получение данных аккаунта ---
router.get("/account", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                referralCode: true,
                email: true,
                name: true,
                phoneNumber: true,
                discount: true,
                totalVisits: true,
                freeDishProgress: true,
                friendsInvited: true,
                friendsVisited: true,
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json(user);
    } catch (err) {
        console.error("Error in /account:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});




export default router;