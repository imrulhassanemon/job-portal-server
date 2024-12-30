/* 
    *   After successful login: generate a jwt token
    *   npm i jsonwebtoken, cookie-parser
    *   jwt.sign(payload, secrate ,{expiresIn: '1h'})   
    

    *   send Token (generated in the server side) to the client side
    *   loaclstorage ----> easier 
    *   httpOnly cookies ---> better 
    

    *   for sensitive or secure or private or protected apis: send token to the server side 
    *   validate the token in the server side
    * app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true
    }));
    * 
    *   if(valid) --> provide data 
    *   if(not valid)---> logout

*/