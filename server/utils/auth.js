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

export function authenticateAdmin(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token" });
        }

        // Проверяем, что это админский токен
        if (payload.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }

        req.role = "admin"; // можешь добавить для инфы
        next();
    });
}