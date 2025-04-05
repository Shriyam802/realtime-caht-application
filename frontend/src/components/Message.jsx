import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { BASE_URL } from '..';
import toast from 'react-hot-toast';
import { deleteMessage } from '../redux/messageSlice';
import { FaTrash } from 'react-icons/fa';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Function to format timestamp
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If message is from today, show time
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from this year, show date and time
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // If message is from a different year, show full date
    return date.toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

const Message = ({message}) => {
    const dispatch = useDispatch();
    const scroll = useRef();
    const {authUser, selectedUser} = useSelector(store=>store.user);
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(()=>{
        scroll.current?.scrollIntoView({behavior:"smooth"});
    },[message]);

    const handleDeleteMessage = async () => {
        if (isDeleting) return;

        try {
            setIsDeleting(true);
            const response = await axios.delete(
                `${BASE_URL}/api/v1/message/${message._id}`, 
                { withCredentials: true }
            );

            // Dispatch delete action to remove from Redux state
            dispatch(deleteMessage(message._id));

            toast.success("Message deleted successfully");
        } catch (error) {
            console.error("Full error object:", error);
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                console.error("Error response headers:", error.response.headers);
                
              //  toast.error(error.response.data.error || "Failed to delete message");
            } else if (error.request) {
                // The request was made but no response was received
                console.error("No response received:", error.request);
                toast.error("No response from server. Check your network connection.");
            } else {
                // Something happened in setting up the request
                console.error("Error setting up request:", error.message);
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsDeleting(false);
        }
    };
    
    // Check if message can be deleted (sender or receiver)
    const canDelete = 
        message.senderId === authUser._id || 
        message.receiverId === authUser._id;

    return (
        <div 
            ref={scroll} 
            className={`chat group ${message?.senderId === authUser?._id ? 'chat-end' : 'chat-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                    <img alt="User Avatar" src={message?.senderId === authUser?._id ? authUser?.profilePhoto  : selectedUser?.profilePhoto } />
                </div>
            </div>
            <div className="relative">
                <div className={`chat-bubble relative ${message?.senderId !== authUser?._id ? 'bg-gray-200 text-black' : ''} `}>
                    {message?.message}
                    {canDelete && isHovered && (
                        <button 
                            onClick={handleDeleteMessage}
                            disabled={isDeleting}
                            className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                            {/* Removed delete icon */}
                        </button>
                    )}
                </div>
            </div>
            <div className="text-xs opacity-50 text-white mt-1">
                {message?.createdAt ? formatTimestamp(message.createdAt) : 'Just now'}
            </div>
        </div>
    )
}

export default Message;