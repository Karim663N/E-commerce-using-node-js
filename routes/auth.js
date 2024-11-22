const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();


router.post('/creercompte', authController.creercompte);
router.post('/motdepasseoubliee', authController.motdepasseoubliee);
router.post('/restaurermotdepasse', authController.restaurermotdepasse);


module.exports = router;