import { useEffect } from "react";
import {useSelector, useDispatch} from "react-redux";
import { addMessage, deleteMessage, setMessages } from "../redux/messageSlice";

const useGetRealTimeMessage = () => {
    const {socket} = useSelector(store=>store.socket);
    const {selectedUser, authUser} = useSelector(store=>store.user);
    const {messages} = useSelector(store=>store.message);
    const dispatch = useDispatch();

    useEffect(()=>{
        const handleNewMessage = (newMessage) => {
            // Comprehensive duplicate check
            const isDuplicate = messages.some(
                existingMsg => 
                    existingMsg.message === newMessage.message && 
                    existingMsg.senderId === newMessage.senderId && 
                    existingMsg.receiverId === newMessage.receiverId
            );

            // Check if the message is for the current conversation and not a duplicate
            if (
                ((newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id) ||
                (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id)) &&
                !isDuplicate
            ) {
                dispatch(addMessage(newMessage));
            }
        };

        const handleDeleteMessage = (data) => {
            // Check if the deleted message belongs to the current conversation
            dispatch(deleteMessage(data.messageId));
        };

        socket?.on("newMessage", handleNewMessage);
        socket?.on("messageDeleted", handleDeleteMessage);

        return () => {
            socket?.off("newMessage", handleNewMessage);
            socket?.off("messageDeleted", handleDeleteMessage);
        };
    },[socket, dispatch, selectedUser, authUser, messages]);
};

export default useGetRealTimeMessage;
