// const express = require('express')// method-1
import express from "express"; // method-2
import dotenv from "dotenv"; 
import connectDB from "./config/database.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app,server } from "./socket/socket.js";
dotenv.config({});

// Ensure PORT is correctly parsed
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

console.log('Environment PORT:', process.env.PORT);
console.log('Resolved PORT:', PORT);

// middleware
app.use(express.urlencoded({extended:true}));
app.use(express.json()); 
app.use(cookieParser());

// Detailed CORS configuration
const corsOption = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000', 
            'http://localhost:3001', 
            'http://localhost:3002', 
            'http://localhost:3003', 
            'http://localhost:3004', 
            'http://localhost:3007',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8083',
            'https://realtime-caht-application-y6cm.vercel.app',
            undefined // Allow undefined origin (for local development)
        ];
        
        // Always allow localhost origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOption)); 

// routes
app.use("/api/v1/user",userRoute); 
app.use("/api/v1/message",messageRoute);
 
server.listen(PORT, ()=>{
    connectDB();
    console.log(`🚀 Server started successfully`);
    console.log(`📍 Server listening on port ${PORT}`);
    console.log(`🌐 Access server at: http://localhost:${PORT}`);
});
