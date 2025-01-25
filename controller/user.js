const userschema= require('../models/usermodel')
const bcrypt=require('bcrypt')
const saltround =10



const loadregister = async (req, res) => {
    res.render('user/register', { message: null }); // Pass a default value
  };
  
const register= async (req,res)=>{

    try{
        const {email,password,confirmpassword}=req.body;
         console.log(email,password,confirmpassword)
         const user=await userschema.findOne({email})
         if(user){
            return res.render('user/register',{message:'user already exists'})
        }
        const hashedpassword = await bcrypt.hash(password,saltround)
        

        const deatails= new userschema({
            email,
            password : hashedpassword,
            confirmpassword : hashedpassword
        })
        await deatails.save()
         res.render('user/login',{message:'User created successfully'})

    }catch (error) {
        res.render('user/register',{message:'somthing went wrong'})
    }
}

const login = async (req,res)=>{
    try{
        const {email,password}=req.body
        const user= await userschema.findOne({email})
        console.log(user)
        if(!user){
            res.render('user/login',{message:'User does not exists'})
            console.log('if1')
        }
        const isMatch= await bcrypt.compare(password,user.password)
        console.log(isMatch);
        
        if(!isMatch){
            return res.render('user/login',{message:'incorrect password '})
        }
       
        res.render('user/Home')

    }catch (error){

    }
}

const Loadlogin = (req, res) => {
    const message = req.query.message || ''; 
    res.render('user/login', { message }); 
};


const Loadhome = (req,res)=>{
    
res.render('user/Home')
}


    const logout= (req,res)=>{
        req.session.user=null
        res.redirect('/user/login')
    }

module.exports={
    loadregister,
    register,
    Loadlogin,
    Loadhome,
    login,
    logout

}