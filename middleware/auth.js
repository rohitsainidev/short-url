const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function checkAuth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/user/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id;

        const user = await User.findById(userId);

        if (!user) {
            res.clearCookie("token");
            return res.redirect("/user/login");
        }

        req.user = user;
        res.locals.user = user;

        next();
    } catch (error) {
        res.clearCookie("token");
        return res.redirect("/user/login");
    }
}

module.exports = checkAuth;