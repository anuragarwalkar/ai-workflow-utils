const nodemailer = require('nodemailer');

const user = "anuragarwalkar@gmail.com";

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

async function sendNotification(to, subject, html) {
    try {
        console.log('sending email...');
        const info = await transporter.sendMail({
            from: user,
            to,
            subject,
            html
        });
        console.log('Email notification sent:', info.response);
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

module.exports = {
   sendNotification
}