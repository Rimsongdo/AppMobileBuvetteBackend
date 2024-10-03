const express=require('express')
const Utilisateur = require('../models/user');
const userLogin=express.Router()
const bcrypt = require('bcrypt');
const Produit=require('../models/produit')
const Order=require('../models/order')
const nodemailer = require('nodemailer');
// Controller pour le login    

userLogin.post('/signUp',async (req, res) => {
    const { name, username, password, filiere, carteID,solde} = req.body;
    
    // Vérification des champs requis
    if (!name || !username || !password || !filiere || !carteID) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const passwordHashed=await bcrypt.hash(password,10)
       
        const newUser = new Utilisateur({
            name,
            username,
            passwordHashed:passwordHashed,
            filiere,
            carteID,
            solde: solde || 0,
        });

        await newUser.save();
        return res.status(201).json({ message: 'Utilisateur ajouté avec succès.', user: newUser });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Le nom d\'utilisateur ou la carte ID existe déjà.' });
        }
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'utilisateur.', error });
    }
})

userLogin.get('/beverages', async (req, res) => {
    try {
        const products = await Produit.find({categorie:"beverage"});
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});

userLogin.get('/foods', async (req, res) => {
    try {
        const products = await Produit.find({categorie:"food"});
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});

userLogin.get('/others', async (req, res) => {
    try {
        const products = await Produit.find({categorie:"other"});
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});
userLogin.post('/login',async (req, res) => {
    const { carteID, password } = req.body;

    // Vérification des champs requis
    if (!carteID || !password) {
        return res.status(400).json({ message: 'Carte ID et mot de passe requis.' });
    }

    try {
        // Recherche de l'utilisateur par carteID
        const user = await Utilisateur.findOne({ carteID });

        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(password, user.passwordHashed);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        // Connexion réussie
        return res.status(200).json({ message: 'Connexion réussie.', user: { name: user.name, username: user.username, carteID: user.carteID,userId:user._id } });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la connexion.', error });
    }
})

userLogin.post('/addtocart',async (req, res) => {
    const { userId, produitId } = req.body;
   
    try {
        // Find the user by ID
    const user = await Utilisateur.findOne({carteID:userId});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        

        // Find the produit by ID
        const produit = await Produit.findOne({_id:produitId});
        if (!produit) {
            return res.status(404).json({ message: 'Produit not found' });
        }
       
       
        if (user.panier.includes(produitId)) { 
            return res.status(400).json({ message: 'Produit already in panier' });
        }       
       
        // Add the produit to the user's panier
        user.panier.push(produit);
        await user.save();

        return res.status(200).json({ message: 'Produit added to panier', panier: user.panier });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
})  

userLogin.post('/yourcart',async (req,res)=>{
    const {userId}=req.body
    try{
        const response=await Utilisateur.findOne({carteID:userId}).populate('panier').exec()
        const panierDetails = response.panier.map(produit => ({
            
            produit, 
        }));

        res.json(response.panier);
    }
    catch(e){
        res.json(e)
    }
})

userLogin.delete('/deleteelement', async (req, res) => {
    const { userId, produitId } = req.body;

    try {
        const user = await Utilisateur.findByIdAndUpdate(
            userId,
            { $pull: { panier: produitId } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Item removed from panier', panier: user.panier });
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from panier', error });
    }
});

userLogin.post('/order', async (req, res) => {
    const { _id, amount } = req.body;
    try {
        const user = await Utilisateur.findById(_id).populate('panier');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.solde < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        const commandes = await Promise.all(user.panier.map(async (produit) => {
            const ordre = new Order({
                name: produit.name,
                price: produit.price,
                status: 'Received', // Statut initial de la commande
                userId: user._id // Ajoutez l'ID de l'utilisateur ici
            });

            // Sauvegarder chaque commande
            await ordre.save();

            return ordre; // Retourner la commande créée
        }));

        user.solde -= amount;
        user.order.push(...commandes.map(ordre => ordre._id));
        user.panier=[];
        await user.save();
        res.json({ message: 'Order processed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

userLogin.post('/amount',async (req,res)=>{
    const {id}=req.body
  
    try{
        const user=await Utilisateur.findOne({carteID:id}).populate('order')
        res.json(user)
    }
    catch(e){
        res.json(e)
    }
})

userLogin.put('/change-password', async (req, res) => {
    const { id,oldPassword, newPassword } = req.body;

    try {
        // Find the user by username
        const user = await Utilisateur.findOne({carteID:id});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare old password with the stored hashed password
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHashed);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHashed = hashedNewPassword;

        // Save the user with the new password
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

userLogin.get('/products',async (req,res)=>{
    try{
        const products=await Produit.find({})
        res.json(products)
    }
    catch(e){
        res.json(e)
    }
})

userLogin.post('/send-email', async (req, res) => {
    const { email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER, // Ton adresse email
            pass: process.env.EMAIL_PASS // Ton mot de passe
        }
    });

    const mailOptions = {
        from: email, // L'adresse de l'utilisateur
        to: "rimssawadogo@gmail.com", // Ton adresse email
        subject: 'Message de l\'utilisateur', // Tu peux définir un sujet par défaut
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Email envoyé avec succès');
    } catch (error) {
        res.status(500).send('Erreur lors de l\'envoi de l\'email');
    }
});



module.exports = { userLogin };
