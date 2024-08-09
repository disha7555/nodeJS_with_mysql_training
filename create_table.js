var mysql=require("mysql");

var connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"db"
});

connection.connect(function(err){
    if (err) throw err;
    console.log("Connected!");
    
    var sql="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255),email VARCHAR(255) UNIQUE NOT NULL , password VARCHAR(100) UNIQUE NOT NULL, adhar_card_number VARCHAR(250),auth_token VARCHAR(250),refresh_token VARCHAR(250))";
                connection.query(sql,function (err,result)
            {
                if (err) throw err;
                console.log("table created");
            })
});