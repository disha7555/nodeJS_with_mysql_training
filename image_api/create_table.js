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
    
    var sql="CREATE TABLE images (id INT AUTO_INCREMENT PRIMARY KEY,filename VARCHAR(255) NOT NULL,filepath VARCHAR(255) NOT NULL,uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
                connection.query(sql,function (err,result)
            {
                if (err) throw err;
                console.log("table created");
            })
});