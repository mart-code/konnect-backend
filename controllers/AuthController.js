import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const tokenMaxAge = "3d";

const createToken = (email, userId) => {
    return jwt.sign({email, userId
    }, process.env.JWT_KEY, {expiresIn: tokenMaxAge})
}

const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        maxAge,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
    };
};


function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}


export const signUp = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send('Email and password are required')

        }

        if(!validateEmail(email)){
            return res.status(400).send('Invalid email or email format')
        }

        if(!validatePassword(password)){
            return res.status(400).send('Invalid password, password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character')
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).send('Email already exists, Login instead')
        }
        const user = await User.create({email, password});
        res.cookie("jwt", createToken(email, user.id), getCookieOptions()); 

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
        res.cookie("jwt", createToken(email, user.id), getCookieOptions()); 

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

export const logout = async (req, res, next) => {
    try {
        res.cookie("jwt", "", { ...getCookieOptions(), maxAge: 1 });
        return res.status(200).send("Logged out successfully");
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}
