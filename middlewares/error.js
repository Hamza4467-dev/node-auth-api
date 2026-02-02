class ErrorHandler extends Error{
  constructor(message,statusCode){
    super(message)
    this.statusCode=statusCode
  }
}
export const errorMiddleware=(err,req,res,next)=>{
  err.message=err.message||"internal server error"
  err.statusCode=err.statusCode||500
  if(err.name==="CastError"){
    err.message=`resource not found invalid ${err.path}:${err.value}`
    err.statusCode=400
  }
  if(err.code===11000){
    err.message=`duplicate ${Object.keys(err.keyValue)} entered`
    err.statusCode=400
  }
  if(err.name==="JsonWebTokenError"){
    err.message=`json web token is invalid try again`
    err.statusCode=400
  }
  if(err.name==="TokenExpiredError"){
    err.message=`json web token is expired try again`
    err.statusCode=400
  }
  returnres.status(err.statusCode).json({
    success:false,
    message:err.message
  })
}
export default ErrorHandler