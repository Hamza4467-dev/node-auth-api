import mongoose from "mongoose";
export const connection=()=>{
  mongoose.connect(process.env.MONGOURL,{
    dbName:"auth_db"
  }).then(()=>{
    console.log("connect database")
  }).catch((err)=>{
console.log("db connection faild")
  })
}