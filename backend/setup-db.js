const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '1234'
        });

        console.log('Connected to MySQL server successfully');

        await connection.query('CREATE DATABASE IF NOT EXISTS job_applications');
        console.log('Database created or already exists');

        await connection.query('USE job_applications');
        console.log('Using job_applications database');

        // Create applications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(1000),
                last_name VARCHAR(1000),
                email VARCHAR(100),
                gender VARCHAR(50),
                phone_area VARCHAR(20),
                phone_number VARCHAR(50),
                position_applied VARCHAR(100),
                start_date DATE,
                resume_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Applications table created or already exists');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS experiences (
                id INT PRIMARY KEY AUTO_INCREMENT,
                application_id INT,
                organization VARCHAR(100),
                position VARCHAR(100),
                period VARCHAR(100),
                description TEXT,
                FOREIGN KEY (application_id) REFERENCES applications(id)
            )
        `);
        console.log('Experiences table created or already exists');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\nERROR: Cannot connect to MySQL server. Please make sure:');
            console.error('1. MySQL is installed and running');
            console.error('2. The port 3306 is correct');
            console.error('3. The username and password are correct');
            console.error('\nTo check if MySQL is running:');
            console.error('- On Mac: brew services list');
            console.error('- On Windows: Open Services app and look for MySQL');
            console.error('- On Linux: sudo service mysql status');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

setupDatabase().catch(console.error);