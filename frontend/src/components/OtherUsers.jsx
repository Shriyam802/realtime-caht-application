import React from 'react'
import OtherUser from './OtherUser';
import useGetOtherUsers from '../hooks/useGetOtherUsers';
import {useSelector} from "react-redux";
import { FaSpinner } from "react-icons/fa";

const OtherUsers = () => {
    // my custom hook
    const { isLoading } = useGetOtherUsers();
    const {otherUsers, authUser} = useSelector(store => store.user);
    
    if (isLoading) {
        return (
            <div className='flex justify-center items-center h-full'>
                <FaSpinner className='animate-spin text-3xl text-blue-500'/>
            </div>
        );
    }

    if (!otherUsers || otherUsers.length === 0) {
        return (
            <div className='text-center p-4 text-gray-500'>
                No users found. Try refreshing or check your connection.
            </div>
        );
    }
     
    return (
        <div className='overflow-auto flex-1'>
            <h3 className='text-xl font-semibold p-4 text-center bg-gray-700'>
                All Registered Members ({otherUsers.length})
            </h3>
            {
    otherUsers
        .filter(user => user._id !== authUser._id) // Logged-in user ko hata raha hai
        .map((user) => (
            <OtherUser key={user._id} user={user} />
        ))
}
        </div>
    )
}

export default OtherUsers;