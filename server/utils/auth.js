import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {

    console.log("authenticateToken called");

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.userId = user.userId;

        // console.log(user.userId)
        next();
    });
}