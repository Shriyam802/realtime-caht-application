import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        console.log('Received registration request:', req.body);
        const { fullName, username, password, confirmPassword, gender } = req.body;
        
        // Detailed validation logging
        if (!fullName) console.log('Missing fullName');
        if (!username) console.log('Missing username');
        if (!password) console.log('Missing password');
        if (!confirmPassword) console.log('Missing confirmPassword');
        if (!gender) console.log('Missing gender');

        if (!fullName || !username || !password || !confirmPassword || !gender) {
            return res.status(400).json({ 
                message: "All fields are required",
                missingFields: {
                    fullName: !fullName,
                    username: !username,
                    password: !password,
                    confirmPassword: !confirmPassword,
                    gender: !gender
                }
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: "Username already exists. Try a different username." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // profilePhoto
        const maleProfilePhoto = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const femaleProfilePhoto = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = await User.create({
            fullName,
            username,
            password: hashedPassword,
            profilePhoto: gender === "male" ? maleProfilePhoto : femaleProfilePhoto,
            gender
        });
        
        console.log('User registered successfully:', newUser._id);
        
        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                profilePhoto: newUser.profilePhoto,
                token: await jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ 
            message: "Error registering user", 
            error: error.message,
            success: false 
        });
    }
};
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        };
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect username or password",
                success: false
            })
        };
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect username or password",
                success: false
            })
        };
        const tokenData = {
            userId: user._id
        };

        const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' }).json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            profilePhoto: user.profilePhoto
        });

    } catch (error) {
        console.log(error);
    }
}
export const logout = async (req, res) => {
    try {
        // Clear JWT cookie
        res.cookie('jwt', '', { 
            httpOnly: true, 
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Update user's online status
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { 
                isOnline: false,
                lastActiveAt: new Date() 
            });
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: "Error during logout" });
    }
};
export const getOtherUsers = async (req, res) => {
    try {
        const loggedInUserId = req.id;
        const otherUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        return res.status(200).json(otherUsers);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching users" });
    }
}