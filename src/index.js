//import dotenv from 'dotenv'; dotenv.config();
import app from "./app.js"; 

app.listen(3000, ()=> {
  let message = "Server is running on port 3000"  ; 
  console.log(message); 

} ); 
