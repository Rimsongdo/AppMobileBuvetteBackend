const mongoose = require('mongoose');
const userSchema=require('./user')

const orderSchema = new mongoose.Schema({
    name: { type: String },
    price: { type: Number },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Received', 'Processing', 'Ready'] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }
});

module.exports = mongoose.model('Order', orderSchema);
