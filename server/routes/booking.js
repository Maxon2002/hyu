import express from "express";
import { sendReservationMail } from "../utils/mailer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { date, time, guests, name, phone, email, message, user } = req.body;

  let content

  if (!user) {
    content = `
🪑 New Reservation

Date: ${date}
Time: ${time}
Guests: ${guests}

Name: ${name}
Phone: ${phone}
Email: ${email || "Not provided"}
Message: ${message || "None"}
`;
  } else {
    content = `
🪑 New Reservation

Date: ${date}
Time: ${time}
Guests: ${guests}

Name: ${name}
Phone: ${phone}
Email: ${email || "Not provided"}
Message: ${message || "None"}

Account info:

Discount: ${user.discount}
Visits: ${user.totalVisits}
Comment: ${user.comment ? user.comment : "No comments"}`;

  }

  try {
    await sendReservationMail(content);
    res.status(200).json({ success: true, message: "Reservation sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
});

export default router;