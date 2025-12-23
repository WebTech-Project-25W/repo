let cfg = require('./config.json')
const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    try {
        const authHeader  = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({message: "Authentication failed: no authentification header."});
        }

        const token = authHeader.split(' ')[1];
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
