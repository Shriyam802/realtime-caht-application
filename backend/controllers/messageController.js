import { Conversation } from "../models/conversationModel.js";
import { Message } from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { User } from "../models/userModel.js";

export const sendMessage = async (req,res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const {message} = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message content is required" });
        }

        let gotConversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]},
        });

        if(!gotConversation){
            gotConversation = await Conversation.create({
                participants:[senderId, receiverId]
            })
        };

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message,
            conversationId: gotConversation._id
        });

        if(newMessage){
            gotConversation.messages.push(newMessage._id);
        };

        await Promise.all([gotConversation.save(), newMessage.save()]);
         
        // SOCKET IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json({
            newMessage
        })
    } catch (error) {
        console.log("Error in sendMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMessage = async (req,res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.id;

        const conversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]}
        }).populate("messages"); 

        if (!conversation) return res.status(200).json([]);
        return res.status(200).json(conversation?.messages);
    } catch (error) {
        console.log("Error in getMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.id;

        // Find the message
        const message = await Message.findById(messageId);

        // Check if message exists
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Check if the user is the sender or receiver of the message
        if (message.senderId.toString() !== userId.toString() && 
            message.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this message" });
        }

        // Remove message from conversation
        await Conversation.findByIdAndUpdate(
            message.conversationId, 
            { $pull: { messages: messageId } }
        );

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        // Notify both sender and receiver about message deletion
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        const senderSocketId = getReceiverSocketId(message.senderId);

        // Emit delete event to both sender and receiver
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('messageDeleted', { 
                messageId, 
                conversationId: message.conversationId,
                senderId: message.senderId
            });
        }

        if (senderSocketId) {
            io.to(senderSocketId).emit('messageDeleted', { 
                messageId, 
                conversationId: message.conversationId,
                senderId: message.senderId
            });
        }

        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.log("Error in deleteMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};