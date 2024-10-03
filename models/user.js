
const mongoose = require('mongoose');
const produitSchema = require('./produit'); // Assuming this file exports a valid schema/model
const orderSchema=require('./order')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    passwordHashed: { type: String, required: true },
    filiere: { type: String, required: true },
    carteID: { type: String, required: true, unique: true },
    solde: { type: Number, default: 0 },
    panier: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produit' }],
    order: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    notifications: [{
        date: { type: Date, default: Date.now },
        message: { type: String, required: true }
    }]
});


module.exports = mongoose.model('Utilisateur', userSchema);

