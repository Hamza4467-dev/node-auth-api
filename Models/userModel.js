import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema= new mongoose.Schema({
  name:String,
  email:String,
  password:{
    type:String,
    minlength:[8,"password must be at least 8 characters long"],
    maxlength:[32,"password must be less than 15 characters long"],
  },
  phone:String,
  accountVerified:{
    type:Boolean,
    default:false
  },
  verificationCode:Number,
  verificationCodeExpiresAt:Date,
  resetPasswordToken:String,
  resetPasswordExpiresAt:Date,
  createdAt:{
    type:Date,
    default:Date.now
  }
})
userSchema.pre("save",async function(next){
  if(!this.isModified("password")){
    next();
  }
  this.password=await bcrypt.hash(this.password,10)
  next()
})
userSchema.methods.comparePassword=async function(password){
  return await bcrypt.compare(password,this.password)
}


export const User=mongoose.model("User",userSchema)
