const isLogin = (req, res, next) => {
  
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  next(); 
};

const cheksession = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login"); 
  }
  next(); 
};

  
  
  module.exports = { cheksession, isLogin }; 
  