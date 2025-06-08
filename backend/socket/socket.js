import {Server} from "socket.io";
import http from "http";
import express from "express";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import { Conversation } from "../models/conversationModel.js";
import crypto from 'crypto';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin:['https://realtime-caht-application-cb62.vercel.app' ],
        methods:['GET', 'POST'],
        credentials: true
    },
});

// Map to store user socket connections
const userSocketMap = {}; // {userId: socketId}
// Map to track recently sent message IDs to prevent duplicates
const recentMessageIds = new Map();

// Function to get socket ID for a specific user
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Function to get all online users
export const getOnlineUsers = () => {
    return Object.keys(userSocketMap);
};

// Function to generate a unique message identifier
const generateMessageId = (senderId, receiverId, message) => {
    const hash = crypto.createHash('md5');
    hash.update(`${senderId}-${receiverId}-${message}-${Date.now()}`);
    return hash.digest('hex');
};

// Function to check and prevent duplicate message emission
const shouldEmitMessage = (messageId) => {
    // Check if message was recently sent
    if (recentMessageIds.has(messageId)) {
        return false;
    }

    // Store message ID with expiration
    recentMessageIds.set(messageId, Date.now());

    // Remove old message IDs periodically
    if (recentMessageIds.size > 1000) {
        const now = Date.now();
        for (const [id, timestamp] of recentMessageIds.entries()) {
            // Remove IDs older than 5 minutes
            if (now - timestamp > 5 * 60 * 1000) {
                recentMessageIds.delete(id);
            }
        }
    }

    return true;
};

io.on('connection', async (socket) => {
    console.log('New socket connection:', socket.id);

    // Get user ID from socket handshake query
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== 'undefined') {
        // Store socket connection for the user
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected`);

        // Update user's online status in the database
        try {
            await User.findByIdAndUpdate(userId, { 
                isOnline: true,
                lastActiveAt: new Date() 
            });
        } catch (error) {
            console.error('Error updating user online status:', error);
        }

        // Broadcast online users to all clients
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    }

    // Socket event for sending messages
    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, message } = data;

        // Validate input
        if (!senderId || !receiverId || !message) {
            socket.emit('messageSendError', { 
                message: 'Invalid message data',
                details: { senderId, receiverId, message }
            });
            return;
        }

        try {
            // Verify sender and receiver exist
            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);

            if (!sender || !receiver) {
                socket.emit('messageSendError', { 
                    message: 'Sender or receiver not found',
                    details: { senderId, receiverId }
                });
                return;
            }

            // Find or create conversation
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, receiverId]
                });
            }

            // Generate unique message ID
            const uniqueMessageId = generateMessageId(senderId, receiverId, message);

            // Create new message
            const newMessage = await Message.create({
                _id: uniqueMessageId,
                senderId,
                receiverId,
                message,
                conversationId: conversation._id
            });

            // Update conversation
            conversation.messages.push(newMessage._id);
            await conversation.save();

            // Get receiver's socket ID
            const receiverSocketId = getReceiverSocketId(receiverId);
            
            // Send message to receiver if online and not a duplicate
            if (receiverSocketId && shouldEmitMessage(uniqueMessageId)) {
                io.to(receiverSocketId).emit('newMessage', {
                    ...newMessage.toObject(),
                    _id: uniqueMessageId
                });
            }

            // Acknowledge message sent to sender
            socket.emit('messageSent', {
                ...newMessage.toObject(),
                _id: uniqueMessageId
            });

        } catch (error) {
            console.error('Error in sendMessage socket event:', error);
            
            // Send detailed error back to client
            socket.emit('messageSendError', { 
                message: 'Failed to send message', 
                error: error.toString(),
                details: { senderId, receiverId, message }
            });
        }
    });

    // Socket event for deleting messages
    socket.on('deleteMessage', async (data) => {
        const { messageId, senderId } = data;

        try {
            // Find the message
            const message = await Message.findById(messageId);

            if (!message) {
                socket.emit('messageDeleteError', { 
                    message: 'Message not found for deletion',
                    details: { messageId, senderId }
                });
                return;
            }

            // Verify sender
            if (message.senderId.toString() !== senderId) {
                socket.emit('messageDeleteError', { 
                    message: 'Unauthorized to delete this message',
                    details: { messageId, senderId }
                });
                return;
            }

            // Delete the message
            await Message.findByIdAndDelete(messageId);

            // Get socket IDs for sender and receiver
            const receiverSocketId = getReceiverSocketId(message.receiverId);
            const senderSocketId = getReceiverSocketId(senderId);

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

        } catch (error) {
            console.error('Error in deleteMessage socket event:', error);
            
            // Send detailed error back to client
            socket.emit('messageDeleteError', { 
                message: 'Failed to delete message', 
                error: error.toString(),
                details: { messageId, senderId }
            });
        }
    });

    // Optional: Add a ping event to keep connection alive
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        // Remove user from online users map
        const userId = Object.keys(userSocketMap).find(
            key => userSocketMap[key] === socket.id
        );

        if (userId) {
            delete userSocketMap[userId];
            
            // Update user's online status
            try {
                await User.findByIdAndUpdate(userId, { 
                    isOnline: false,
                    lastActiveAt: new Date() 
                });
            } catch (error) {
                console.error('Error updating user offline status:', error);
            }

            // Broadcast updated online users
            io.emit('getOnlineUsers', Object.keys(userSocketMap));
        }
    });
});

export { app, io, server };
