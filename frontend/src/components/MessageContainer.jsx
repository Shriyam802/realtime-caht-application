import React from 'react'
import { BiArrowBack, BiInfoCircle } from 'react-icons/bi';
import SendInput from './SendInput'
import Messages from './Messages';
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from '../redux/userSlice';

const MessageContainer = () => {
    const { selectedUser, authUser, onlineUsers } = useSelector(store => store.user);
    const dispatch = useDispatch();

    const isOnline = onlineUsers?.includes(selectedUser?._id);
   
    return (
        <div className='flex flex-col w-[500px] h-full bg-gray-900 rounded-lg overflow-hidden shadow-xl border-y border-gray-700'>
            {selectedUser !== null ? (
                <>
                    {/* Chat Header */}
                    <div className='bg-gray-800 px-4 py-3 flex items-center justify-between'>
                        <div className='flex items-center space-x-4'>
                            <button 
                                onClick={() => dispatch(setSelectedUser(null))} 
                                className='btn btn-ghost btn-circle text-white hover:bg-gray-700'
                            >
                                <BiArrowBack className='w-6 h-6'/>
                            </button>
                            <div className={`avatar ${isOnline ? 'online' : ''}`}>
                                <div className='w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
                                    <img src={selectedUser?.profilePhoto} alt="user-profile" />
                                </div>
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-white'>{selectedUser?.fullName}</h3>
                                <p className='text-sm text-gray-400'>
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                        <button 
                            className='btn btn-ghost btn-circle text-white hover:bg-gray-700'
                            title='User Info'
                        >
                            <BiInfoCircle className='w-6 h-6'/>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className='flex-1 overflow-y-auto bg-gray-900 p-4'>
                        <Messages />
                    </div>

                    {/* Send Message Input */}
                    <div className='bg-gray-800 p-3'>
                        <SendInput />
                    </div>
                </>
            ) : (
                <div className='flex flex-col justify-center items-center h-full text-white bg-gray-900'>
                    <div className='text-center'>
                        <h1 className='text-4xl font-bold mb-4'>Welcome, {authUser?.fullName}!</h1>
                        <p className='text-xl text-gray-400 mb-6'>
                            Select a user to start a conversation
                        </p>
                        <div className='animate-pulse'>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                className="w-24 h-24 mx-auto text-gray-600"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    stroke="currentColor" 
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MessageContainer;