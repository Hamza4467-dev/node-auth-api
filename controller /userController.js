import ErrorHandler from "../middlewares/error.js"
import catchAsyncError from "../middlewares/catchAsyncError.js"
import UserModel from "../Models/userModel.js"
import sendEmail from "../utils/sendEmail.js"
import twilio from "twilio"
const client=twilio(process.env.TWILIO_SID,process.env.TWILIO_TOKEN)
export const register = catchAsyncError(async (req, res, next) => {

  const { name, email, phone, password, verificationMethod } = req.body

  if (!name || !email || !phone || !password || !verificationMethod) {
    return next(new ErrorHandler("please fill all fields", 400))
  }

  const regex = /^\+923\d{9}$/
  if (!regex.test(phone)) {
    return next(new ErrorHandler("invalid phone number", 400))
  }

  const existingUser = await UserModel.findOne({ email })
  if (existingUser) {
    return next(new ErrorHandler("user already exists", 400))
  }

  const user = await UserModel.create({ name, email, phone, password })

  const verificationCode = user.generateVerificationCode()
  await user.save()

  sendVerificationCode(email, verificationCode, verificationMethod, phone)

  res.status(201).json({
    success: true,
    message: "user created successfully",
    user
  })
})

async function sendVerificationCode(email, verificationCode, verificationMethod, phone){
  try{if(verificationMethod==="email"){
    const message=generateEmailTemplate(verificationCode)
    sendEmail(email, "Verification Code", message)
  }
  else if(verificationCode==="phone"){
    const codespace=verificationCode.toString().split("").join(" ");
    await client.calls.create({
      twiml:`<Response><Say>Your verification code is: ${codespace}.Your verification code is: ${codespace}</Say> </Response>`,
      from:process.env.TWILIO_PHONENUMBER,
      to:phone
     
    })
  }
else{
  throw new ErrorHandler("Invalid verification method",500)
}
}catch(error){
  
      throw new ErrorHandler("Failed to send Verifications  code",500)
   
  }
  
 
}

function generateEmailTemplate(verificationCode){
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">Email Verification Code</h2>
    <p style="font-size: 18px; color: #555;">Your verification code is:</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">${verificationCode}</div>
    </div>
    <p style="font-size: 16px; color: #666;">This code will expire in 5 minutes.</p>
  </div>
`;
}