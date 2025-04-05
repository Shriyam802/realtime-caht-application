import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { BASE_URL } from '..';
import axios from 'axios';

const OnlineUsers = () => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const { user } = useSelector(state => state.auth);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(${BASE_URL}/api/v1/user/all-users, {
                    withCredentials: true
                });
                setAllUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (user) {
            fetchUsers();
            const newSocket = io(BASE_URL, {
                query: { userId: user._id }
            });

            setSocket(newSocket);

            newSocket.on('getOnlineUsers', (users) => {
           //     console.log('Online users updated:', users);
                setOnlineUsers(users);
            });

            const pingInterval = setInterval(() => {
                newSocket.emit('ping');
            }, 30000);

            return () => {
                clearInterval(pingInterval);
                newSocket.close();
            };
        }
    }, [user]);

    const onlineUserDetails = allUsers.filter(u => 
        onlineUsers.includes(u._id) && u._id !== user._id
    );

    return (
        <div className="online-users-container p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Online Users</h2>
            {onlineUserDetails.length > 0 ? (
                <ul>
                    {onlineUserDetails.map(onlineUser => (
                        <li key={onlineUser._id} className="flex items-center mb-2">
                            <div className="relative w-10 h-10">
                                <img 
                                    src={onlineUser.profilePhoto} 
                                    alt={onlineUser.username} 
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div 
                                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                                ></div>
                            </div>
                            <div className="ml-3">
                                <p className="font-semibold text-sm">{onlineUser.username}</p>
                                <p className="text-xs text-gray-500">{onlineUser.fullName}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-center">No other users online</p>
            )}
        </div>
    );
};

export default OnlineUsers;