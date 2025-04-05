import express from "express";
import { 
    sendMessage, 
    getMessage, 
    deleteMessage 
} from "../controllers/messageController.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/send/:id", protectRoute, sendMessage);
router.get("/:id", protectRoute, getMessage);

// New route to delete a specific message
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;