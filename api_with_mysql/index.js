require('dotenv').config();

const port=process.env.PORT;
const { config } = require('dotenv');
var express= require("express");
const app=express();

app.use(express.json());

const Joi= require('joi');
const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const bcrypt=require('bcryptjs')

//configuration

const dbConfig={
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database:process.env.DB_NAME,
};

// create mysql  connection pool

const pool=mysql.createPool(dbConfig);


// schema with joi for sign up and login

const userSchema = Joi.object({
    name:Joi.string().min(2).required(),
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required(),
    adhar_card_number:Joi.string().length(12).optional()
});

const loginSchema = Joi.object({
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required(),

});

//middleware to validate jwt token

const authenticationToken=(req,res,next)=>{
    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(' ')[1];

    if(token==null) return res.sendStatus(401);

    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,user1)=>{
        if(err) return res.sendStatus(403);
        req.user=user1;
        next(); 
    });
};


//sign up API

app.post('/signup',async(req,res) =>{

    // validating user given value with schema
    const {error}=userSchema.validate(req.body);
    if(error) return res.status(400).json({errors:error.details});

   //data destructuring

    const {name,email,password,adhar_card_number} = req.body;

    // hash the paasword with bcryptjs

    const hashed_password=await bcrypt.hash(password,10);

     //data insertion

     try{
        const [result] = await pool.execute('INSERT INTO users(name,email,password,adhar_card_number) VALUES (?,?,?,?)',[name,email,hashed_password,adhar_card_number]);
        res.status(201).json({id:result.insertId,name,email});
     }
     catch(err){
        res.status(500).json({error:'Database error'});
     }

});



//login api

app.post('/login',async(req,res)=>{

    //validate the schema
    const {error}=loginSchema.validate(req.body);

if (error) return res.status(400).json({errors:error.details});

  //destructuring
  
  const {email,password}=req.body;

  //match email given user given email (if it exists or not) and if exist fetch therow where it exists and then match password with user given password

    try{

        const [result]= await pool.execute('SELECT * FROM users WHERE email = ?',[email]);
        const userdetails=result[0];

        if(!userdetails || !(await bcrypt.compare(password,userdetails.password))){
            return res.status(401).json({error:'Invalid email or password'});
        }

        // now user is authorized as valid user so create authorization and refresh token for user

        const authToken=jwt.sign({id:userdetails.id},process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_EXPIRES_IN});

        const refreshToken=jwt.sign({id:userdetails.id},process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_REFRESH_EXPIRES_IN});


        await pool.execute('Update users SET auth_token=?,refresh_token=? WHERE id=?',[authToken,refreshToken,userdetails.id]);

        res.json({authToken,refreshToken});


    }
    catch(err){
            res.status(500).json({error:'Internal Server Error'});
    }

});

//list api

app.get('/list',authenticationToken,async(req,res)=>{
    
    //execute select query to get data
    try{
        const [rows]=await pool.execute('SELECT id,name,email,adhar_card_number FROM users');
        res.json({rows});
    }
    catch(err){
        res.status(500).json({error:'Internal Server Error'});
    }
});


//delete api

app.delete('/delete/:id',authenticationToken,async(req,res)=>{

    //fetch id
    const {id}=req.params;

    try{
            const [result]=await pool.execute('DELETE FROM users WHERE id=?',[id]);
            if(result.affectedRows===0){
                return res.status(400).json({error:'User not found'});
            }
        
            res.status(204).send();
    }
    catch(err){
        res.status(500).json({error:'Internal Server Error'});
    }
});


//update api

app.put('/update/:id',authenticationToken,async(req,res)=>{
    
    //fetch data

    const {id}=req.params;
    const {name,email,password,adhar_card_number}=req.body;

    //create updateSchema because in signup schema most of fields of req.body were compulsary but here it is not , only those fields thatneeds update
    const updateSchema=Joi.object({
    name:Joi.string().min(2).optional(),
    email:Joi.string().email().optional(),
    password:Joi.string().min(6).optional(),
    adhar_card_number:Joi.string().length(12).optional()
    });

    // validate user given details with update schema

    const {error}=updateSchema.validate(req.body);
    if(error) return res.status(400).json({errors:error.details});

    // make an array and push only those values which are given by user for updation

    const updateValues=[];

    if (name) updateValues.push(`name='${name}'`);
    if (email) updateValues.push(`email = '${email}'`);
    if (password) updateValues.push(`password = '${await bcrypt.hash(password, 10)}'`);
    if (adhar_card_number) updateValues.push(`adhar_card_number = '${adhar_card_number}'`);

    if(updateValues.length === 0) return res.status(400).json({error:"no field to update"});

    try{
        const [result]=await pool.execute(`Update users SET ${updateValues.join(',')} WHERE id=?`,[id]);
        if(result.affectedRows===0){
            return res.status(404).json({error:'User not found'});
        }
        res.status(200).json({message:'User updated successfully'});
    }
    catch(error)
    {
        res.status(500).json({error:"internal server error"});
    }

});


app.listen(port,()=>{
    console.log("server is running");
});