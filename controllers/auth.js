const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
var nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();


sgMail.setApiKey('K14D8FWT6PVST6Z7QF5PHH7D');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.creercompte = (req, res) => {
    console.log(req.body);

    const { nom, prenom, tel, adresse, email, password, passwordConfirm } = req.body;

        db.query('SELECT email FROM clients WHERE email = ?', [email], async (error, result) => {
            if (error) {
                console.log(error);
                return;
            }
            if (result.length > 0) {
                return res.render('creercompte', {
                    message: 'email deja existe'
                });
            } else if (password !== passwordConfirm) {
                return res.render('creercompte', {
                    message: 'Mots de passe non identiques'
                });
            }

            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);

            db.query('INSERT INTO clients SET ?', { nom: nom, prenom: prenom, tel: tel, adresse: adresse, email: email, password: hashedPassword }, (error, results) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log(results);
                    return res.render('connexion', {
                        message: 'Compte a ete cree'
                    });
                }
            });
        });
}

//restaurer mot de passe


exports.motdepasseoubliee = (req, res) => {
    const { email } = req.body;

    // Check if the email exists in the clients table
    db.query('SELECT * FROM clients WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Error checking for client:', error);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Client not found');
        }

        // Generate and save reset token
        const token = crypto.randomBytes(20).toString('hex');
        const clientId = results[0].id;
        req.session.clientId = clientId;
        console.log("id =", clientId);
        const resetTokenExpiration = Date.now() + 3600000; // 1 hour


        // Update reset token and expiration in the clients table
        db.query('UPDATE clients SET reset_token = ?, reset_token_expiration = ? WHERE id = ?', [token, resetTokenExpiration, clientId], (updateError, updateResults) => {
            if (updateError) {
                console.error('Error updating reset token:', updateError);
                return res.status(500).send('Internal Server Error');
            }

            // Create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'karim.nafti.10@gmail.com',
                    pass: 'epnd lhdx oawg wplr' // Use the App Password generated in Step 1
                }
            });

            // Mail options
            const mailOptions = {
                from: 'karim.nafti.10@gmail.com',
                to: email,
                subject: 'Password Reset',
                text: `You requested a password reset. Click the link to reset your password: http://localhost:8000/restaurermotdepasse?token=${token}&clientId=${clientId}`,
                html: `<p>You requested a password reset. Click the link to reset your password: <a href="http://localhost:8000/restaurermotdepasse?token=${token}&clientId=${clientId}">Reset Password</a></p>`
            };

            // Send mail
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).send('Error sending email');
                }
                console.log('Email sent: ' + info.response);
                return res.status(200).send('Password reset link sent to your email');
            });
        });
    });
};


exports.restaurermotdepasse = async (req, res) => {
    console.log(req.body);

    const { id, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
        return res.render('restaurermotdepasse', {
            message: 'Mots de passe non identiques'
        });
    }

    try {
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('UPDATE clients SET password = ? WHERE id = ?', [hashedPassword, id], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            } else if (results.affectedRows === 0) {
                return res.status(404).send('Client not found');
            } else {
                console.log(results);
                return res.render('connexion', {
                    message: 'Mot de passe mis a jour avec succes'
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};