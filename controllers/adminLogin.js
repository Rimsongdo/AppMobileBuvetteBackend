const bcrypt=require('bcrypt')
const express=require('express')
const Utilisateur = require('../models/user'); // Assure-toi que le chemin est correct
const adminLogin=express.Router()
// Controller pour ajouter un utilisateur
adminLogin.post('/users',async (req, res) => {
    const { name, username, password, filiere, carteID, solde } = req.body;

    // Vérification des champs requis
    if (!name || !username || !password || !filiere || !carteID) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const passwordHashed=await bcrypt.hash(password,10)
        const newUser = new Utilisateur({
            name,
            username,
            passwordHashed,
            filiere,
            carteID,
            solde: solde || 0, // Utiliser le solde par défaut si non fourni
        });

        await newUser.save();
        return res.status(201).json({ message: 'Utilisateur ajouté avec succès.', user: newUser });
    } catch (error) {
        if (error.code === 11000) {
            // Erreur de doublon pour les champs uniques
            return res.status(400).json({ message: 'Le nom d\'utilisateur ou la carte ID existe déjà.' });
        }
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'utilisateur.', error });
    }
})

module.exports = { adminLogin };
