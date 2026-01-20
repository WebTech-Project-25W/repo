let cfg = require('../config.json')
const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    try {
        const token = req.headers.cookie.split('=')[1];
        if (!token) {
            return res.status(401).json({message: "Authentication failed: no token."});
        }

        const user = jwt.verify(token, cfg.auth.jwt_key);
        req.user = user;
        next();
        
    } catch (error) {
        return res.status(401).json({message: "Authentication failed"});
    }

};  
