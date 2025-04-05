import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setOtherUsers } from '../redux/userSlice';
import { BASE_URL } from '..';
import toast from 'react-hot-toast';

const useGetOtherUsers = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { authUser } = useSelector(store => store.user);

    const fetchAllUsers = async () => {
        try {
            setIsLoading(true);
            
            const res = await axios.get(`${BASE_URL}/api/v1/user/all-users`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            // Log all fetched users for debugging
           // console.log("All registered users:", res.data);
            
            if (res.data.length === 0) {
                toast.info("No users found in the system");
            } else {
                // Optional: Add a count toast
               // toast.success(`Found ${res.data.length} registered users`);
            }

            // Dispatch ALL users
            dispatch(setOtherUsers(res.data));
        } catch (error) {
            console.error("Error fetching all users:", error);
            
            // Detailed error handling
            if (error.response) {
                toast.error(error.response.data.message || "Failed to fetch users");
            } else if (error.request) {
                toast.error("No response from server. Check your connection.");
            } else {
                toast.error("Error setting up user fetch request");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only attempt to fetch if user is authenticated
        if (authUser) {
            fetchAllUsers();
        }
    }, [authUser]);

    // Expose the fetch function and loading state
    return { 
        isLoading, 
        fetchAllUsers 
    };
}

export default useGetOtherUsers;