const mongoose=require('mongoose')

const produitSchema=new mongoose.Schema({
    name:{type:String,required:true},
    price:{type:Number,required:true},
    categorie:{type:String,required:true},
    image:{type:String,required:true}
})

module.exports=mongoose.model('Produit',produitSchema)