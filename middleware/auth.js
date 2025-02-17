const checkSession = (req,res,next)=>{
    if( req.session && req.session.user){
        next()
    }else{
        res.redirect('/login')
    }
}

const isLogin = (req, res, next) => {
    console.log('andiiiiiii');
    
    console.log(req.session.user );
    console.log('kundiiiiiiiiiiiiii');
    
    if (req.session && req.session.user) {
        return res.redirect('/');
    } else {
        return next();
    }
};

module.exports={checkSession,isLogin} 