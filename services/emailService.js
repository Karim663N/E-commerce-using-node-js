const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'your-email@example.com',
        pass: 'your-password'
    }
});

// Function to send email
const sendEmail = async (to, subject, html) => {
    try {
        // Send mail with defined transport object
        await transporter.sendMail({
            from: 'your-email@example.com',
            to,
            subject,
            html
        });

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };
