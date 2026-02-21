import mongoose from "mongoose";
import {genSalt, hash} from "bcrypt";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    password : {
        type: String,
        required: [true, "Password is required"],
    },
    firstName : {
        type: String,
        requried: false
    },
    lastName : {
        type: String,
        requried: false
    },
    image: {
        type: String,
        requried: false
    },
    color: {
        type: Number,
        requried: false 
    },
    profileSetup: {
        type: Boolean,
        default: false
    },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
    // ✅ No next() call needed with async
});

const User = mongoose.model("User", userSchema);

export default User;