// Stub implementation for email
import logger from "../../logger.js";
import nodemailer from "nodemailer";

const user = "anuragarwalkar@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendNotification(to, subject, html) {
  logger.info(`Email would be sent to: ${to}, Subject: ${subject}`);
  
  return transporter.sendMail({
    from: user,
    to,
    subject,
    html,
  });
}
