import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

const protectRoute = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies.token || 
                      req.cookies.jwt ||
                      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }

        // Find user and attach to request
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Attach user to request object
        req.user = user;
        
        // CRITICAL: Set req.id for message controllers
        req.id = user._id;

        // Continue to next middleware
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized - Token expired" });
        }

        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export default protectRoute;
