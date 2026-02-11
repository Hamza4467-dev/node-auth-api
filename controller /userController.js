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
    sendEmail({ email, subject: "Verification Code", message })

  }
  else if(verificationMethod === "phone"){

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

// function generateEmailTemplate(verificationCode){
//   return `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//     <h2 style="color: #333;">Email Verification Code</h2>
//     <p style="font-size: 18px; color: #555;">Your verification code is:</p>
//     <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
//       <div style="font-size: 24px; font-weight: bold; color: #007bff;">${verificationCode}</div>
//     </div>
//     <p style="font-size: 16px; color: #666;">This code will expire in 5 minutes.</p>
//   </div>
// `;
// }
function generateEmailTemplate(verificationCode) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding:30px 15px;">
      <tr>
        <td align="center">

          <!-- Container -->
          <table width="600" cellpadding="0" cellspacing="0" border="0"
            style="background-color:#ffffff; border-radius:8px;">

            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 20px 10px 20px;">
                <h1 style="margin:0; font-size:22px; color:#111827;">
                  Verify Your Email
                </h1>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="padding:10px 40px 25px 40px;">
                <p style="margin:0; font-size:16px; color:#4b5563; line-height:1.6;">
                  Please use the verification code below to complete your authentication process.
                </p>
              </td>
            </tr>

            <!-- Code Box -->
            <tr>
              <td align="center" style="padding:0 40px 30px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center"
                      style="background-color:#eef2ff; padding:20px; border-radius:6px;">
                      
                      <span style="
                        font-size:30px;
                        font-weight:700;
                        letter-spacing:6px;
                        color:#4f46e5;
                        display:inline-block;">
                        ${verificationCode}
                      </span>

                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Expiry Info -->
            <tr>
              <td align="center" style="padding:0 40px 20px 40px;">
                <p style="margin:0; font-size:14px; color:#6b7280;">
                  This code will expire in <strong>5 minutes</strong>.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:10px 40px;">
                <hr style="border:none; border-top:1px solid #e5e7eb;">
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:20px 40px 30px 40px;">
                <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
                  If you did not request this verification, you can safely ignore this email.
                </p>
              </td>
            </tr>

          </table>
          <!-- End Container -->

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}
