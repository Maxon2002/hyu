import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendReservationMail(content) {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Table Booking" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_RECEIVER,
    subject: "New Reservation from Website",
    text: content
  });
}