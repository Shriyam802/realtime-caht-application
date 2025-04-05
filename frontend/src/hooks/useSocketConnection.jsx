import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setOnlineUsers } from '../redux/userSlice';
import { setSocket } from '../redux/socketSlice';
import { addMessage } from '../redux/messageSlice';
import { BASE_URL } from '..';
import toast from 'react-hot-toast';

const useSocketConnection = () => {
    const dispatch = useDispatch();
    const { authUser } = useSelector(store => store.user);
    const { selectedUser } = useSelector(store => store.user);
    
    // Use a function to safely check for processed messages
    const isMessageProcessed = useCallback((processedIds, messageId) => {
        // Ensure messageId is a valid string
        if (!messageId || typeof messageId !== 'string') {
            return true; // Treat invalid messages as already processed
        }
        
        return Array.isArray(processedIds) 
            ? processedIds.indexOf(messageId) !== -1 
            : false;
    }, []);

    // Use a function to safely add processed message
    const addProcessedMessage = useCallback((processedIds, messageId) => {
        // Ensure messageId is a valid string
        if (!messageId || typeof messageId !== 'string') {
            return processedIds;
        }

        if (!Array.isArray(processedIds)) {
            processedIds = [];
        }
        
        // Add message ID if not already present
        if (processedIds.indexOf(messageId) === -1) {
            processedIds.push(messageId);
        }

        // Limit processed message IDs
        if (processedIds.length > 500) {
            processedIds.shift();
        }

        return processedIds;
    }, []);
    
    // Ref to track processed message IDs
    const processedMessageIds = useRef([]);

    useEffect(() => {
        if (authUser) {
            // Establish socket connection
            const socket = io(BASE_URL, {
                query: {
                    userId: authUser._id
                },
                withCredentials: true
            });

            // Set socket in Redux
            dispatch(setSocket(socket));

            // Listen for online users
            socket.on('getOnlineUsers', (onlineUsers) => {
                dispatch(setOnlineUsers(onlineUsers));
            });

            // Listen for new messages
            socket.on('newMessage', (newMessage) => {
                // Validate message object
                if (!newMessage || !newMessage._id) {
                    console.warn('Received invalid message:', newMessage);
                    return;
                }

                // Prevent duplicate message processing
                if (!isMessageProcessed(processedMessageIds.current, newMessage._id)) {
                    // Only add message if it's for the current user or in the current conversation
                    if (
                        newMessage.receiverId === authUser._id || 
                        (selectedUser && 
                         (newMessage.senderId === selectedUser._id || 
                          newMessage.receiverId === selectedUser._id))
                    ) {
                        // Additional null checks before dispatching
                        const safeMessage = {
                            _id: newMessage._id,
                            senderId: newMessage.senderId || null,
                            receiverId: newMessage.receiverId || null,
                            message: newMessage.message || '',
                            conversationId: newMessage.conversationId || null,
                            createdAt: newMessage.createdAt || new Date().toISOString()
                        };

                        dispatch(addMessage(safeMessage));
                        
                        // Show toast only for messages from other users
                        if (newMessage.senderId !== authUser._id) {
                            toast.success('New message received');
                        }
                    }

                    // Mark message as processed
                    processedMessageIds.current = addProcessedMessage(
                        processedMessageIds.current, 
                        newMessage._id
                    );
                }
            });

            // Listen for message send confirmation
            socket.on('messageSent', (sentMessage) => {
                // Validate message object
                if (!sentMessage || !sentMessage._id) {
                    console.warn('Received invalid sent message:', sentMessage);
                    return;
                }

                // Prevent duplicate message processing
                if (!isMessageProcessed(processedMessageIds.current, sentMessage._id)) {
                    // Additional null checks before dispatching
                    const safeMessage = {
                        _id: sentMessage._id,
                        senderId: sentMessage.senderId || null,
                        receiverId: sentMessage.receiverId || null,
                        message: sentMessage.message || '',
                        conversationId: sentMessage.conversationId || null,
                        createdAt: sentMessage.createdAt || new Date().toISOString()
                    };

                    dispatch(addMessage(safeMessage));
                    
                    // Mark message as processed
                    processedMessageIds.current = addProcessedMessage(
                        processedMessageIds.current, 
                        sentMessage._id
                    );
                }
            });

            // Listen for message send errors
            socket.on('messageSendError', (error) => {
                console.error('Message send error:', error);
               // toast.error(error.message || 'Failed to send message');
            });

            // Cleanup socket connection on unmount
            return () => {
                socket.disconnect();
                dispatch(setSocket(null));
                
                // Clear processed message IDs
                processedMessageIds.current = [];
            };
        }
    }, [authUser, selectedUser, dispatch, isMessageProcessed, addProcessedMessage]);
};

export default useSocketConnection;
