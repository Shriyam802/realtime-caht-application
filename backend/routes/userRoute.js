import express from "express";
import { register, login, logout, getOtherUsers } from "../controllers/userController.js";
import protectRoute from "../middleware/protectRoute.js";
import { User } from "../models/userModel.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.get("/", protectRoute, getOtherUsers);

// Updated route to get ALL users, including the current user
router.get("/all-users", async (req, res) => {
    try {
        // Find all users, excluding sensitive information like password
        const users = await User.find({}).select("-password");
        
        // Log the total number of users for debugging
        console.log(`Fetched ${users.length} total registered users`);
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ 
            message: "Error fetching users", 
            error: error.message 
        });
    }
});

export default router;