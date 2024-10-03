require('dotenv').config
const PORT=5000
const MONGODB_URL="mongodb://0.0.0.0:27017/"
//const MONGODB_URL="mongodb+srv://user2000:test234@cluster0.i1qvjcj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const SECRET='ROGER'

module.exports={PORT,MONGODB_URL,SECRET}