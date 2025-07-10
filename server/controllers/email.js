const nodemailer = require('nodemailer');

const user = "anuragarwalkar@gmail.com";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

async function sendNotification(to, subject, html) {
   return transporter.sendMail({
            from: user,
            to,
            subject,
            html
        });
}

module.exports = {
   sendNotification
}