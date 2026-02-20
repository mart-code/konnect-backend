import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

const createToken = (email, userId) => {
    return jwt.sign({email, userId
    }, process.env.JWT_KEY, {expiresIn: maxAge})
}

export const signUp = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send('Email and password are required')

        }

        const user = await User.create({email, password});
        res.cookie("jwt", createToken(email, user.id), {
          maxAge,
          secure: true,
          sameSite: "None",
        }); 

        return res.status(201).json({
            user: {
                email: user.email,
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
                profileSetup: user.profileSetup
            }   
        });
       
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error')
    }
}

export const login = async (req, res, next)=>{
        try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send('Email and password are required')

        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).send('Invalid email')
        }

        const auth = await compare(password, user.password);
        if(!auth){
            return res.status(400).send('Password is incorrect');
        }
        res.cookie("jwt", createToken(email, user.id), {
          maxAge,
          secure: true,
          sameSite: "None",
        }); 

        return res.status(201).json({
            user: {
                email: user.email,
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
                profileSetup: user.profileSetup
            }   
        });
       
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error')
    }
}

export const getUserInfo = async (req, res, next) => {
    try {
        const userData = await User.findById(req.userId);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

   return res.status(200).json({
         
                email: userData.email,
                id: userData._id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                image: userData.image,
                color: userData.color,
                profileSetup: userData.profileSetup
       
        });
    }catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export const updateProfile = async (req, res, next) => {
    try {
        const {userId} = req;
        const {firstName, lastName, image, color} = req.body;
        if(!firstName || !lastName ) {
            return res.status(400).json({message: "First name, last name and color are required"})
        }

        const userData = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName, color,
            profileSetup: true,
          
        }, {new: true, runValidators: true});
    
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

   return res.status(201).json({
         
                email: userData.email,
                id: userData._id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                image: userData.image,
                color: userData.color,
                profileSetup: userData.profileSetup
       
        });
    }catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}