// -- Create database
// CREATE DATABASE student_management;
// USE student_management;

// -- Students table
// CREATE TABLE students (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     student_id VARCHAR(20) UNIQUE NOT NULL,
//     name VARCHAR(100) NOT NULL,
//     email VARCHAR(100) UNIQUE NOT NULL,
//     phone VARCHAR(15),
//     date_of_birth DATE,
//     address TEXT,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// -- Courses table
// CREATE TABLE courses (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     course_code VARCHAR(20) UNIQUE NOT NULL,
//     course_name VARCHAR(100) NOT NULL,
//     credits INT NOT NULL,
//     description TEXT,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// -- Marks table
// CREATE TABLE marks (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     student_id INT,
//     course_id INT,
//     marks DECIMAL(5,2) CHECK (marks >= 0 AND marks <= 100),
//     semester VARCHAR(20),
//     academic_year VARCHAR(10),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
//     FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
//     UNIQUE KEY unique_student_course (student_id, course_id, semester, academic_year)
// );




const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_management'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Add root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Student Management API is running!',
        endpoints: {
            students: '/api/students',
            courses: '/api/courses',
            marks: '/api/marks'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Students API Routes
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM students ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const { student_id, name, email, phone, date_of_birth } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO students (student_id, name, email, phone, date_of_birth) VALUES (?, ?, ?, ?, ?)',
            [student_id, name, email, phone, date_of_birth]
        );
        res.json({ id: result.insertId, message: 'Student added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, name, email, phone, date_of_birth } = req.body;
        await pool.execute(
            'UPDATE students SET student_id=?, name=?, email=?, phone=?, date_of_birth=? WHERE id=?',
            [student_id, name, email, phone, date_of_birth, id]
        );
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Courses API Routes
app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM courses ORDER BY course_code');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const { course_code, course_name, credits, description } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO courses (course_code, course_name, credits, description) VALUES (?, ?, ?, ?)',
            [course_code, course_name, credits, description]
        );
        res.json({ id: result.insertId, message: 'Course added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name, credits, description } = req.body;
        await pool.execute(
            'UPDATE courses SET course_code=?, course_name=?, credits=?, description=? WHERE id=?',
            [course_code, course_name, credits, description, id]
        );
        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Marks API Routes
app.get('/api/marks', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.*, 
                   s.name as student_name, 
                   s.student_id, 
                   c.course_name, 
                   c.course_code,
                   ROUND((m.marks_obtained / m.total_marks) * 100, 2) as percentage
            FROM marks m 
            JOIN students s ON m.student_id = s.id 
            JOIN courses c ON m.course_id = c.id 
            ORDER BY m.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/marks', async (req, res) => {
    try {
        const { student_id, course_id, marks_obtained, total_marks, semester } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO marks (student_id, course_id, marks_obtained, total_marks, semester) VALUES (?, ?, ?, ?, ?)',
            [student_id, course_id, marks_obtained, total_marks || 100, semester]
        );
        res.json({ id: result.insertId, message: 'Marks added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/marks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, course_id, marks_obtained, total_marks, semester } = req.body;
        await pool.execute(
            'UPDATE marks SET student_id=?, course_id=?, marks_obtained=?, total_marks=?, semester=? WHERE id=?',
            [student_id, course_id, marks_obtained, total_marks || 100, semester, id]
        );
        res.json({ message: 'Marks updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/marks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM marks WHERE id = ?', [id]);
        res.json({ message: 'Marks deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get marks by student ID
app.get('/api/marks/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const [rows] = await pool.execute(`
            SELECT m.*, c.course_name, c.course_code, c.credits
            FROM marks m 
            JOIN courses c ON m.course_id = c.id 
            WHERE m.student_id = ?
        `, [studentId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        availableRoutes: ['/', '/api/health', '/api/students', '/api/courses', '/api/marks']
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});