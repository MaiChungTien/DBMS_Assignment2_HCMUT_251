// server/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- 1. DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2142005', // <--- REPLACE THIS WITH YOUR ACTUAL PASSWORD
    database: 'elearning_db'
});

db.connect(err => {
    if (err) { 
        console.error('❌ DB Connection Failed:', err.message); 
        return; 
    }
    console.log('✅ Connected to MySQL Database!');
});

// --- 2. API ROUTES ---

// REQ 3.1 & 3.2: Get All Courses (For List)
app.get('/api/courses', (req, res) => {
    db.query("SELECT * FROM Course", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// REQ 3.1: Insert Course (Calls Stored Procedure)
app.post('/api/courses', (req, res) => {
    const { courseName, Description, Difficulty_Level, Price } = req.body;
    const sql = "CALL sp_insert_course(?, ?, ?, ?)";
    db.query(sql, [courseName, Description, Difficulty_Level, Price], (err, result) => {
        if (err) return res.status(400).json({ error: err.sqlMessage });
        res.json({ message: "Course created successfully" });
    });
});

// REQ 3.1: Update Course (Calls Stored Procedure)
app.put('/api/courses/:id', (req, res) => {
    const { courseName, Description, Difficulty_Level, Price } = req.body;
    const sql = "CALL sp_update_course(?, ?, ?, ?, ?)";
    db.query(sql, [req.params.id, courseName, Description, Difficulty_Level, Price], (err, result) => {
        if (err) return res.status(400).json({ error: err.sqlMessage });
        res.json({ message: "Course updated successfully" });
    });
});

// REQ 3.1: Delete Course (Calls Stored Procedure)
app.delete('/api/courses/:id', (req, res) => {
    const sql = "CALL sp_delete_course(?)";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(400).json({ error: err.sqlMessage });
        res.json({ message: "Course deleted successfully" });
    });
});

// REQ 3.3: Get Enrollment List (Calls Procedure)
app.get('/api/enrollments/:courseId', (req, res) => {
    const sql = "CALL Get_Student_Enrollment_List(?)";
    db.query(sql, [req.params.courseId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]); // Return the first result set
    });
});

// REQ 3.3: Evaluate Grade & Risk (Calls Functions)
app.get('/api/evaluate/:studentId/:courseId', (req, res) => {
    const { studentId, courseId } = req.params;
    const sql = `SELECT 
        Calculate_Final_Grade(?, ?) AS FinalGrade,
        Evaluate_Student_Risk_Level(?, ?) AS RiskLevel`;
        
    db.query(sql, [studentId, courseId, studentId, courseId], (err, result) => {
        if (err) return res.status(500).json(err);
        if (!result[0].FinalGrade && !result[0].RiskLevel) {
             return res.status(404).json({ error: "No data found" });
        }
        res.json(result[0]);
    });
});

// Start Server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});