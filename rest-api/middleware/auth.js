const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key';
function verifyToken(req, res, next) {
    console.log(req.headers.authorization);
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token);
    if (!token) return res.status(401).json({
        error:
            'Missing token'
    });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({
            error: 'Invalid token'
        });
    }
}
module.exports = { verifyToken };