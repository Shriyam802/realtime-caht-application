import React, {useState, useCallback, useEffect } from 'react'
import { IoSend } from "react-icons/io5";
import axios from "axios";
import {useDispatch,useSelector} from "react-redux";
import { addMessage } from '../redux/messageSlice';
import { BASE_URL } from '..';
import toast from 'react-hot-toast';

const SendInput = () => {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useDispatch();
    const {selectedUser} = useSelector(store=>store.user);
    const {socket} = useSelector(store=>store.socket);
    const {authUser} = useSelector(store=>store.user);

    // Optional: Add socket error handling
    useEffect(() => {
        if (socket) {
            const handleMessageError = (error) => {
                console.error('Socket message error:', error);
               // toast.error(error.message || 'Failed to send message');
                setIsSubmitting(false);
            };

            socket.on('messageSendError', handleMessageError);

            return () => {
                socket.off('messageSendError', handleMessageError);
            };
        }
    }, [socket]);

    const onSubmitHandler = useCallback(async (e) => {
        e.preventDefault();
        
        // Validate input and selected user
        if (!message.trim() || !selectedUser?._id) {
            toast.error("Please enter a message and select a user");
            return;
        }

        // Prevent multiple submissions
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            // Prepare message data
            const messageData = {
                senderId: authUser._id,
                receiverId: selectedUser._id,
                message: message.trim()
            };

            // Use socket for real-time messaging
            if (socket) {
                socket.emit("sendMessage", messageData);
            }

            // Backup HTTP request
            const res = await axios.post(
                `${BASE_URL}/api/v1/message/send/${selectedUser._id}`, 
                { message: message.trim() }, 
                {
                    headers: {
                         'Content-Type': 'application/json',

                    },
                    withCredentials: true
                }
            );
         

            // More robust response checking
            if (!res || !res.data) {
                console.error('Invalid server response:', res);
                toast.error('Invalid response from server');
                return;
            }

            // Add the new message to Redux store
            if (res.data.newMessage) {
                dispatch(addMessage(res.data.newMessage));
            }

            // Clear input after successful send
            setMessage("");
          //  toast.success('Message sent successfully');
        } catch (error) {
            console.error('Message send error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            // More specific error handling
            if (error.response?.status === 401) {
                toast.error("Session expired. Please login again.");
            } else {
                toast.error(
                    error.response?.data?.message || 
                    "Failed to send message. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [message, selectedUser, authUser, socket, dispatch]);

    return (
        <form onSubmit={onSubmitHandler} className='px-4 my-3'>
            <div className='w-full relative'>
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder='Send a message...'
                    className='border text-sm rounded-lg block w-full p-3 border-zinc-500 bg-gray-600 text-white'
                    disabled={isSubmitting || !selectedUser}
                />
                <button 
                    type="submit" 
                    className='absolute flex inset-y-0 end-0 items-center pr-4'
                    disabled={isSubmitting || !selectedUser || !message.trim()}
                >
                    <IoSend />
                </button>
            </div>
        </form>
    )
}

export default SendInput;
