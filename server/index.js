// server/index.js
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. SETUP SEQUELIZE CONNECTION
// Replace with your actual MySQL password
const sequelize = new Sequelize('elearning_db', 'root', 'YOUR_PASSWORD', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false // Keep console clean
});

// Test Connection
sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err));

// ==================================================
// TASK 1 ROUTES: VIEW DATA (Tests 1-4)
// ==================================================

// TEST 1: VIEW FULL STUDENT PROFILES
app.get('/api/task1/profiles', async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT u.ID, u.Name, u.Email, e.Background 
            FROM User u
            JOIN End_user e ON u.ID = e.End_userID
            WHERE e.SFlag = 1;
        `);
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// TEST 2: VIEW INSTRUCTORS AND THEIR COURSES
app.get('/api/task1/instructors', async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT u.Name AS Instructor_Name, c.courseName AS Course_Taught, cr.Creation_Date
            FROM User u
            JOIN End_user e ON u.ID = e.End_userID
            JOIN \`Create\` cr ON e.End_userID = cr.InstructorID
            JOIN Course c ON cr.CourseID = c.CourseID;
        `);
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// TEST 3: VIEW STUDENT ENROLLMENTS
app.get('/api/task1/enrollments', async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT u.Name AS Student_Name, c.courseName AS Enrolled_Course, en.Enrollment_Date
            FROM User u
            JOIN Enroll en ON u.ID = en.StudentID
            JOIN Course c ON en.CourseID = c.CourseID;
        `);
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// TEST 4: VIEW COURSE CONTENT HIERARCHY
app.get('/api/task1/hierarchy', async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT c.courseName, l.LessonTitle, r.Resource_Type, r.FileName
            FROM Course c
            LEFT JOIN Lesson l ON c.CourseID = l.CourseID
            LEFT JOIN Lesson_Resource r ON l.LessonID = r.LessonID;
        `);
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// ==================================================
// TASK 2 ROUTES: PROCEDURES & FUNCTIONS (Tests 1-8)
// ==================================================

// TEST 1: INSERT PROCEDURE (Add Course)
app.post('/api/task2/course', async (req, res) => {
    const { name, desc, diff, price } = req.body;
    try {
        await sequelize.query(
            `CALL sp_insert_course(:name, :desc, :diff, :price)`,
            { replacements: { name, desc, diff, price } }
        );
        res.json({ message: "Course inserted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.original.sqlMessage || err.message });
    }
});

// TEST 2: UPDATE PROCEDURE
app.put('/api/task2/course/:id', async (req, res) => {
    const { id } = req.params;
    const { name, desc, diff, price } = req.body;
    try {
        await sequelize.query(
            `CALL sp_update_course(:id, :name, :desc, :diff, :price)`,
            { replacements: { id, name, desc, diff, price } }
        );
        res.json({ message: "Course updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.original.sqlMessage });
    }
});

// TEST 3: TRIGGER VERIFICATION (Enrollment)
// This calls a raw INSERT. If the trigger fails, MySQL throws an error, which we catch.
app.post('/api/task2/enroll', async (req, res) => {
    const { studentId, courseId } = req.body;
    try {
        await sequelize.query(
            `INSERT INTO Enroll (StudentID, CourseID) VALUES (:studentId, :courseId)`,
            { replacements: { studentId, courseId } }
        );
        res.json({ message: "Enrollment successful" });
    } catch (err) {
        // This catches the SIGNAL SQLSTATE '45000' from your Trigger
        res.status(400).json({ error: err.original.sqlMessage });
    }
});

// TEST 4: DELETE PROCEDURE
app.delete('/api/task2/course/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sequelize.query(
            `CALL sp_delete_course(:id)`,
            { replacements: { id } }
        );
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.original.sqlMessage });
    }
});

// TEST 5: GET ENROLLMENT LIST (Procedure)
app.get('/api/task2/enrollment-list/:courseId', async (req, res) => {
    try {
        const results = await sequelize.query(
            `CALL Get_Student_Enrollment_List(:courseId)`,
            { replacements: { courseId: req.params.courseId } }
        );
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// TEST 6: GET TOP PERFORMERS (Procedure)
app.get('/api/task2/top-performers/:courseId', async (req, res) => {
    try {
        const results = await sequelize.query(
            `CALL Get_Top_Performers_By_Course(:courseId, 50.0)`,
            { replacements: { courseId: req.params.courseId } }
        );
        res.json(results);
    } catch (err) { res.status(500).json(err); }
});

// TEST 7 & 8: CALCULATE GRADE & RISK (Functions)
// We run a SELECT query that calls the functions defined in Task 2.4
app.get('/api/task2/evaluate/:studentId/:courseId', async (req, res) => {
    const { studentId, courseId } = req.params;
    try {
        const [results] = await sequelize.query(`
            SELECT 
                Calculate_Final_Grade(:studentId, :courseId) as FinalGrade,
                Evaluate_Student_Risk_Level(:studentId, :courseId) as RiskLevel
        `, { replacements: { studentId, courseId } });
        res.json(results[0]);
    } catch (err) { res.status(500).json(err); }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));