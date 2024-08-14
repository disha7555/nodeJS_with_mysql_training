//import
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

//configuration

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

//pool (connection)

const pool = mysql.createPool(dbConfig);

// Multer setup for file uploads

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// upload variable for multer

const upload = multer({ storage });

// endpoint for uploading multiple images

app.post('/upload', upload.array('images', 10), async (req, res) => {
    try {

        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const promises = files.map(file => {
            return pool.execute(
                'INSERT INTO images (filename, filepath) VALUES (?, ?)',
                [file.filename, file.path]
            );
        });

        await Promise.all(promises);
        res.status(200).json({ message: 'Files uploaded successfully' });
   
    }
    catch(err){
        res.status(500).json({ error: 'Internal Server Error' });
    
    }
});
app.get('/images', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM images');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});