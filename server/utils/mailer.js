import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();


// --- Отправка письма о бронировании ---
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



// --- Отправка OTP ---
export async function sendOtpMail(to, otp) {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER_AUTH,   // auth@hyu.ae
      pass: process.env.MAIL_PASS_AUTH
    }
  });

  const text = `Your verification code: ${otp}. It is valid for 5 minutes.`;
  const html = `<p>Your verification code: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`;

  await transporter.sendMail({
    from: `"Hyu Auth" <${process.env.MAIL_USER_AUTH}>`,
    to,
    subject: "Hyu Restaurant — Verification code",
    text,
    html
  });
}



// --- Сброс пароля ---
export async function sendResetPasswordMail(to, link) {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER_AUTH,
      pass: process.env.MAIL_PASS_AUTH
    }
  });

  const text = `You requested a password reset. Click the link to reset your password: ${link}`;
  const html = `
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${link}">${link}</a>
    <p>This link is valid for 60 minutes.</p>
  `;

  await transporter.sendMail({
    from: `"Hyu Auth" <${process.env.MAIL_USER_AUTH}>`,
    to,
    subject: "Hyu Restaurant — Password Reset",
    text,
    html
  });
}
