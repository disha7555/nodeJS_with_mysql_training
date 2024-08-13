require('dotenv').config();
var mysql=require("mysql2");

var connection=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database:process.env.DB_NAME
});

connection.connect(function(err){
    if (err) throw err;
    console.log("Connected!");
    
    var sql="CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL,email VARCHAR(255) UNIQUE NOT NULL , password VARCHAR(100) UNIQUE NOT NULL, adhar_card_number VARCHAR(250) UNIQUE,auth_token VARCHAR(250),refresh_token VARCHAR(250))";
                connection.query(sql,function (err,result)
            {
                if (err) throw err;
                console.log("table created");
            })
});