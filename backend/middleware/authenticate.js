let cfg = require('../config.json')
const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    try {
        cookies = req.headers.cookie.split('; ');

        jwtCookie = cookies.find(row => row.startsWith('jwt='));
    
        let token;
        if (jwtCookie) { token = jwtCookie.split('=')[1]; } 

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
