const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

const dbConfig = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'job_applications',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
        return;
    }
    if (connection) {
        console.log('Successfully connected to the database.');
        connection.release();
    }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT 1');
        res.json({ success: true, message: 'Database connection successful' });
    } catch (error) {
        console.error('Test query error:', error);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Submit application endpoint
app.post('/api/submit-application', upload.single('resume'), async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            email,
            gender,
            areacode,
            phone,
            position,
            startDate,
            experiences
        } = req.body;

        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            const [applicationResult] = await connection.query(
                `INSERT INTO applications 
                (first_name, last_name, email, gender, phone_area, phone_number, 
                 position_applied, start_date, resume_path) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [firstname, lastname, email, gender, areacode, phone, 
                 position, startDate, req.file ? req.file.path : null]
            );

            const applicationId = applicationResult.insertId;

            const experiencesArray = JSON.parse(experiences);
            for (const exp of experiencesArray) {
                await connection.query(
                    `INSERT INTO experiences 
                    (application_id, organization, position, period, description) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [applicationId, exp.organisation, exp.position, exp.period, exp.description]
                );
            }

            await connection.commit();
            connection.release();

            res.json({ 
                success: true, 
                message: 'Application submitted successfully',
                applicationId: applicationId
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting application',
            error: error.message 
        });
    }
});
// app.get('/api/search-applications', (req, res) => {
//     const { email } = req.query;
    
//     const query = `
//         SELECT * FROM applications 
//         WHERE email = '${email}'
//     `;
    
//     pool.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ 
//                 success: false, 
//                 message: 'Error searching applications',
//                 error: err.message 
//             });
//         }
//         res.json({ success: true, results });
//     });
// });
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});