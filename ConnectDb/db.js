const mongoose= require('mongoose');
const env = require ("dotenv").config()

const connectDB = async ()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGODB_URI,{})
        console.log(`mongoDB Connected: ${conn.connection.host}`);

        }catch (error){
            console.log(error)
            process.exit(1)
            
        }
      
        
}

module.exports=connectDB