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