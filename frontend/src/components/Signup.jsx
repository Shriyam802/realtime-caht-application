import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from '..';

const Signup = () => {
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const navigate = useNavigate();
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!user.fullName || !user.username || !user.password || !user.confirmPassword || !user.gender) {
      toast.error("Please fill in all fields");
      return;
    }

    if (user.password !== user.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
     // console.log('Sending signup request:', user);
      const res = await axios.post(`${BASE_URL}/api/v1/user/register`, user, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      //console.log('Signup response:', res);
      
      // More robust response checking
      if (!res || !res.data) {
        console.error('Invalid server response:', res);
        toast.error('Invalid response from server');
        return;
      }

      // Check for success status
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message || "Account created successfully");
      } else {
        // Handle case where success is not true
        toast.error(res.data.message || "Signup failed");
      }
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data.message || 
                             error.response.data.error || 
                             "An error occurred during signup";
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response received from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("Error setting up signup request");
      }
    } finally {
      // Reset form
      setUser({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        gender: "",
      });
    }
  }

  return (
    <div className="min-w-96 mx-auto">
      <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 border border-gray-100'>
        <h1 className='text-3xl font-bold text-center'>Signup</h1>
        <form onSubmit={onSubmitHandler} action="">
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Full Name</span>
            </label>
            <input
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              className='w-full input input-bordered h-10'
              type="text"
              placeholder='Full Name' />
          </div>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Username</span>
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className='w-full input input-bordered h-10'
              type="text"
              placeholder='Username' />
          </div>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Password</span>
            </label>
            <input
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className='w-full input input-bordered h-10'
              type="password"
              placeholder='Password' />
          </div>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Confirm Password</span>
            </label>
            <input
              value={user.confirmPassword}
              onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
              className='w-full input input-bordered h-10'
              type="password"
              placeholder='Confirm Password' />
          </div>
          <div>
            <label className='label p-2'>
              <span className='text-base label-text'>Gender</span>
            </label>
            <select
              value={user.gender}
              onChange={(e) => setUser({ ...user, gender: e.target.value })}
              className='w-full select select-bordered'
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <p className='text-center my-2'>Already have an account? <Link to="/login"> Login </Link></p>
          <div>
            <button type="submit" className='btn btn-block btn-sm mt-2 border border-slate-700'>Signup</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup