const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const config = require('./utils/config');
const Produit = require('./models/produit');
const { adminLogin } = require('./controllers/adminLogin');
const {userLogin}=require('./controllers/userLogin')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier pour stocker les images
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier
    }
});

const upload = multer({ storage: storage });

// Connexion à MongoDB
mongoose.connect(config.MONGODB_URL)
    .then(() => {
        console.log('Connecté à MongoDB');
    })
    .catch((error) => console.error('Erreur de connexion à MongoDB:', error));

// Route pour uploader une image et sauvegarder le produit

app.post('/addproduits', upload.single('image'), async (req, res) => {
    const { name, price, categorie } = req.body;
    const imagePath = req.file.path; // Chemin de l'image sauvegardée

    const produit = new Produit({ name, price, categorie, image: imagePath });

    try {
        await produit.save();
        res.status(201).json(produit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



app.use('/admin',adminLogin)
app.use('/user',userLogin)

    
module.exports = app;
