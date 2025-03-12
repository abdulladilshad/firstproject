
const isLogin = (req, res, next) => {
  try {
      if (req.session && req.session.admin) {
          return res.redirect("/admin/dashboard");
      }
      next(); 
  } catch (error) {
      console.error("Error in isLogin middleware:", error);
      res.status(500).render("errorPage", { message: "An unexpected error occurred." });
  }
};

const cheksession = (req, res, next) => {
  try {
      if (!req.session || !req.session.admin) {
          return res.redirect("/admin/login"); 
      }
      next(); 
  } catch (error) {
      console.error("Error in cheksession middleware:", error);
      res.status(500).render("errorPage", { message: "An unexpected error occurred." });
  }
};

module.exports = { cheksession, isLogin };
