import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name:"message",
    initialState:{
        messages:[],
        processedMessageIds: [] // Track processed message IDs as an array
    },
    reducers:{
        addMessage:(state, action) => {
            // Validate message object
            const message = action.payload;
            if (!message || !message._id) {
                console.warn('Attempted to add invalid message:', message);
                return;
            }

            const messageId = message._id;

            // Ensure all required fields have valid values
            const safeMessage = {
                _id: messageId,
                senderId: message.senderId || null,
                receiverId: message.receiverId || null,
                message: message.message || '',
                conversationId: message.conversationId || null,
                createdAt: message.createdAt || new Date().toISOString()
            };

            // Check if message has already been processed
            if (!state.processedMessageIds.includes(messageId)) {
                // Add message to the end of the array
                state.messages.push(safeMessage);
                
                // Mark message as processed
                state.processedMessageIds.push(messageId);

                // Sort messages by creation time to ensure chronological order
                state.messages.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );

                // Optionally, limit the number of processed IDs to prevent memory growth
                if (state.processedMessageIds.length > 500) {
                    state.processedMessageIds.shift(); // Remove the oldest ID
                }

                // Optionally, limit the number of messages to prevent excessive memory usage
                if (state.messages.length > 1000) {
                    state.messages.shift(); // Remove the oldest message
                }
            }
        },
        setMessages:(state, action) => {
            // Validate and sanitize messages
            const sanitizedMessages = (action.payload || [])
                .filter(msg => msg && msg._id)
                .map(msg => ({
                    _id: msg._id,
                    senderId: msg.senderId || null,
                    receiverId: msg.receiverId || null,
                    message: msg.message || '',
                    conversationId: msg.conversationId || null,
                    createdAt: msg.createdAt || new Date().toISOString()
                }))
                // Sort messages by creation time
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            state.messages = sanitizedMessages;
            // Reset processed message IDs when setting new messages
            state.processedMessageIds = sanitizedMessages.map(msg => msg._id);
        },
        clearMessages:(state) => {
            state.messages = [];
            state.processedMessageIds = [];
        },
        deleteMessage: (state, action) => {
            // Filter out the message with the given ID
            state.messages = state.messages.filter(
                message => message._id !== action.payload
            );
            // Remove from processed IDs
            state.processedMessageIds = state.processedMessageIds.filter(
                id => id !== action.payload
            );
        }
    }
});

export const {addMessage, setMessages, clearMessages, deleteMessage} = messageSlice.actions;
export default messageSlice.reducer;