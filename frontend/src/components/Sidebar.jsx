import React, { useState, useEffect } from 'react'
import { BiSearchAlt2, BiLogOut } from "react-icons/bi";
import { FaUser, FaUsers } from "react-icons/fa";
import OtherUsers from './OtherUsers';
import axios from "axios";
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom";
import {useSelector, useDispatch} from "react-redux";
import { setAuthUser, setOtherUsers, setSelectedUser } from '../redux/userSlice';
import { setMessages } from '../redux/messageSlice';
import { BASE_URL } from '..';
import store from '../redux/store';
import useGetOtherUsers from '../hooks/useGetOtherUsers';

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("users");
    const {otherUsers, authUser} = useSelector(store=>store.user);
    const {socket} = useSelector(store=>store.socket);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { fetchAllUsers } = useGetOtherUsers();

    // Fetch users when users tab is clicked
    useEffect(() => {
        if (activeTab === 'users') {
            fetchAllUsers();
        }
    }, [activeTab]);

    const logoutHandler = async () => {
        try {
            // Try to logout via API
            try {
                await axios.get(`${BASE_URL}/api/v1/user/logout`, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000 // 5 second timeout
                });
            } catch (apiError) {
                console.warn("Logout API call failed:", apiError.message);
                // Continue with local logout even if API call fails
            }

            // Clear socket connection if exists
            if (socket) {
                socket.disconnect();
            }

            // Clear local storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // Reset Redux store
            dispatch(setAuthUser(null));
            dispatch(setMessages(null));
            dispatch(setOtherUsers(null));
            dispatch(setSelectedUser(null));

            // Navigate to login
            navigate("/login");
            toast.success("Logged out successfully");

        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout. Please try again.");
            
            // Force navigation to login as a fallback
            navigate("/login");
        }
    }

    const searchSubmitHandler = (e) => {
        e.preventDefault();
        const conversationUser = otherUsers?.find((user)=> 
            user.fullName.toLowerCase().includes(search.toLowerCase())
        );
        if(conversationUser){
            dispatch(setOtherUsers([conversationUser]));
        }else{
            toast.error("User not found!");
        }
    }

    return (
        <div className='w-full max-w-[300px] bg-gray-800 text-white flex flex-col h-full shadow-xl rounded-lg overflow-hidden border-y border-gray-700'>
            {/* User Profile Header */}
            <div className='bg-gray-900 p-4 flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                    <div className='avatar'>
                        <div className='w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
                            <img src={authUser?.profilePhoto} alt="User Profile" />
                        </div>
                    </div>
                    <div>
                        <h2 className='text-lg font-semibold'>{authUser?.fullName}</h2>
                        <p className='text-sm text-gray-400'>@{authUser?.username}</p>
                    </div>
                </div>
                <button 
                    onClick={logoutHandler} 
                    className='btn btn-ghost btn-sm text-red-500 hover:bg-red-100 hover:text-red-700'
                    title='Logout'
                >
                    <BiLogOut className='w-6 h-6'/>
                </button>
            </div>

            {/* Search and Tabs */}
            <div className='p-4'>
                <form onSubmit={searchSubmitHandler} className='flex mb-4'>
                    <input
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                        className='input input-bordered w-full rounded-l-md' 
                        type="text"
                        placeholder='Search users...'
                    />
                    <button 
                        type='submit' 
                        className='btn bg-blue-600 text-white rounded-r-md border-none hover:bg-blue-700'
                    >
                        <BiSearchAlt2 className='w-6 h-6'/>
                    </button>
                </form>

                {/* Tabs */}
                <div className='tabs tabs-boxed mb-4'>
                    <a 
                        className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`} 
                        onClick={() => setActiveTab('users')}
                    >
                        <FaUsers className='mr-2'/> Users
                    </a>
                    <a 
                        className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`} 
                        onClick={() => setActiveTab('profile')}
                    >
                        <FaUser className='mr-2'/> Profile
                    </a>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 overflow-y-auto'>
                {activeTab === 'users' ? (
                    <OtherUsers/>
                ) : (
                    <div className='p-4'>
                        <h3 className='text-xl font-semibold mb-4'>My Profile</h3>
                        <div className='flex flex-col items-center'>
                            <div className='avatar mb-4'>
                                <div className='w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2'>
                                    <img src={authUser?.profilePhoto} alt="User Profile" />
                                </div>
                            </div>
                            <h4 className='text-lg font-bold'>{authUser?.fullName}</h4>
                            <p className='text-gray-400'>@{authUser?.username}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar;