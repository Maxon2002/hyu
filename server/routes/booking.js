import express from "express";
import { sendReservationMail } from "../utils/mailer.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();

router.post("/", async (req, res) => {
  const { date, time, guests, name, phone, email, message, user } = req.body;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  let content

  if (!user) {
    content = `
🪑 New Reservation

Date: ${date}
Time: ${time}
Guests: ${guests}

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Message: ${message || "None"}
`;
  } else {
    content = `
🪑 New Reservation

Date: ${date}
Time: ${time}
Guests: ${guests}

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Message: ${message || "None"}

Account info:

Discount: ${user.discount}
Visits: ${user.totalVisits}
Comment: ${user.comment ? user.comment : "No comments"}`;

  }

  try {

    // Сохраняем бронирование в базу
    await prisma.booking.create({
      data: {
        date: parsedDate,
        time,
        guests: Number(guests),
        name,
        phone: phone || null,
        email,
        message: message || null,
        userId: user?.id || null
      }
    });

    // Отправляем письмо
    await sendReservationMail(content);

    res.status(200).json({ success: true, message: "Reservation saved and sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
});

export default router;