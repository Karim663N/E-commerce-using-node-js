const express = require('express');
const mysql = require("mysql");

const router = express.Router();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

router.get('/', async (req, res) => {
    try {
        // Retrieve data from the database (replace 'query' with the appropriate method)
        db.query('SELECT * FROM produits', (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            // Pass the database results to the index view
            return res.render('index', { produits: results });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/connexion', (req, res) => {
    res.render('connexion');
});

router.get('/creercompte', (req, res) => {
    res.render('creercompte');
});

router.get('/listproduits', (req, res) => {
    res.render('listproduits');
});

router.get('/listproduitparcategorie', (req, res) => {
    res.render('listproduitparcategorie');
});

router.get('/motdepasseoublieeform', (req, res) => {
    res.render('motdepasseoublieeform');
});

router.get('/adminaddproductinfo', (req, res) => {
    res.render('adminaddproductinfo');
});

router.get('/adminaddproductecran', (req, res) => {
    res.render('adminaddproductecran');
});

router.get('/adminaddproduct', (req, res) => {
    res.render('adminaddproduct');
});

router.get('/restaurermotdepasse', (req, res) => {
    res.render('restaurermotdepasse');
});

module.exports = router;