const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection(function(error, connection) {
    if (error) {
        console.log('Database connection failed');
        console.log(error);
    } else {
        console.log('Database connected successfully');
        connection.release();
    }
});

function runQuery(query, values) {
    return new Promise(function(resolve, reject) {
        db.query(query, values, function(error, results) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/', async function(req, res) {
    try {
        const studentsResult = await runQuery('SELECT COUNT(*) AS totalStudents FROM students', []);
        const coursesResult = await runQuery('SELECT COUNT(*) AS totalCourses FROM courses', []);
        const assignmentsResult = await runQuery('SELECT COUNT(*) AS totalAssignments FROM assignments', []);
        const pendingResult = await runQuery("SELECT COUNT(*) AS pendingAssignments FROM assignments WHERE status = 'Pending'", []);
        const progressResult = await runQuery("SELECT COUNT(*) AS progressAssignments FROM assignments WHERE status = 'In Progress'", []);
        const completedResult = await runQuery("SELECT COUNT(*) AS completedAssignments FROM assignments WHERE status = 'Completed'", []);

        const recentAssignments = await runQuery(`
            SELECT 
                assignments.id, 
                assignments.title, 
                assignments.due_date, 
                assignments.priority, 
                assignments.status, 
                courses.title AS course_title
            FROM assignments
            JOIN courses ON assignments.course_id = courses.id
            ORDER BY assignments.due_date ASC
            LIMIT 5
        `, []);

        res.render('index', {
            totalStudents: studentsResult[0].totalStudents,
            totalCourses: coursesResult[0].totalCourses,
            totalAssignments: assignmentsResult[0].totalAssignments,
            pendingAssignments: pendingResult[0].pendingAssignments,
            progressAssignments: progressResult[0].progressAssignments,
            completedAssignments: completedResult[0].completedAssignments,
            recentAssignments: recentAssignments
        });
    } catch (error) {
        console.log('Dashboard query failed');
        console.log(error);
        res.status(500).send('Database query failed. Check Docker MySQL tables and app logs.');
    }
});

app.get('/students', async function(req, res) {
    try {
        const search = req.query.search || '';
        const message = req.query.message || '';

        let query = 'SELECT * FROM students';
        let values = [];

        if (search !== '') {
            query += ' WHERE name LIKE ? OR email LIKE ?';
            values.push('%' + search + '%');
            values.push('%' + search + '%');
        }

        query += ' ORDER BY id DESC';

        const students = await runQuery(query, values);

        res.render('students', {
            students: students,
            search: search,
            message: message
        });
    } catch (error) {
        console.log('Students page query failed');
        console.log(error);
        res.status(500).send('Students page database query failed.');
    }
});

app.post('/students/add', async function(req, res) {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const semester = req.body.semester;

        await runQuery(
            'INSERT INTO students (name, email, semester) VALUES (?, ?, ?)',
            [name, email, semester]
        );

        res.redirect('/students?message=Student added successfully');
    } catch (error) {
        console.log('Student insert failed');
        console.log(error);
        res.redirect('/students?message=Student could not be added');
    }
});

app.post('/students/delete/:id', async function(req, res) {
    try {
        await runQuery('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.redirect('/students?message=Student deleted successfully');
    } catch (error) {
        console.log('Student delete failed');
        console.log(error);
        res.redirect('/students?message=Student could not be deleted');
    }
});

app.get('/courses', async function(req, res) {
    try {
        const search = req.query.search || '';
        const message = req.query.message || '';

        let query = 'SELECT * FROM courses';
        let values = [];

        if (search !== '') {
            query += ' WHERE title LIKE ? OR code LIKE ? OR instructor LIKE ?';
            values.push('%' + search + '%');
            values.push('%' + search + '%');
            values.push('%' + search + '%');
        }

        query += ' ORDER BY id DESC';

        const courses = await runQuery(query, values);

        res.render('courses', {
            courses: courses,
            search: search,
            message: message
        });
    } catch (error) {
        console.log('Courses page query failed');
        console.log(error);
        res.status(500).send('Courses page database query failed.');
    }
});

app.post('/courses/add', async function(req, res) {
    try {
        const title = req.body.title;
        const code = req.body.code;
        const instructor = req.body.instructor;

        await runQuery(
            'INSERT INTO courses (title, code, instructor) VALUES (?, ?, ?)',
            [title, code, instructor]
        );

        res.redirect('/courses?message=Course added successfully');
    } catch (error) {
        console.log('Course insert failed');
        console.log(error);
        res.redirect('/courses?message=Course could not be added');
    }
});

app.post('/courses/delete/:id', async function(req, res) {
    try {
        await runQuery('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.redirect('/courses?message=Course deleted successfully');
    } catch (error) {
        console.log('Course delete failed');
        console.log(error);
        res.redirect('/courses?message=Course could not be deleted');
    }
});

app.get('/assignments', async function(req, res) {
    try {
        const status = req.query.status || 'All';
        const priority = req.query.priority || 'All';
        const search = req.query.search || '';
        const message = req.query.message || '';

        let query = `
            SELECT 
                assignments.id,
                assignments.title,
                assignments.due_date,
                assignments.priority,
                assignments.status,
                courses.title AS course_title
            FROM assignments
            JOIN courses ON assignments.course_id = courses.id
            WHERE 1 = 1
        `;

        let values = [];

        if (status !== 'All') {
            query += ' AND assignments.status = ?';
            values.push(status);
        }

        if (priority !== 'All') {
            query += ' AND assignments.priority = ?';
            values.push(priority);
        }

        if (search !== '') {
            query += ' AND assignments.title LIKE ?';
            values.push('%' + search + '%');
        }

        query += ' ORDER BY assignments.due_date ASC';

        const assignments = await runQuery(query, values);
        const courses = await runQuery('SELECT * FROM courses ORDER BY title ASC', []);

        res.render('assignments', {
            assignments: assignments,
            courses: courses,
            selectedStatus: status,
            selectedPriority: priority,
            search: search,
            message: message
        });
    } catch (error) {
        console.log('Assignments page query failed');
        console.log(error);
        res.status(500).send('Assignments page database query failed.');
    }
});

app.post('/assignments/add', async function(req, res) {
    try {
        const title = req.body.title;
        const course_id = req.body.course_id;
        const due_date = req.body.due_date;
        const priority = req.body.priority;
        const status = req.body.status;

        await runQuery(
            'INSERT INTO assignments (title, course_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?)',
            [title, course_id, due_date, priority, status]
        );

        res.redirect('/assignments?message=Assignment added successfully');
    } catch (error) {
        console.log('Assignment insert failed');
        console.log(error);
        res.redirect('/assignments?message=Assignment could not be added');
    }
});

app.post('/assignments/status/:id', async function(req, res) {
    try {
        const status = req.body.status;

        await runQuery(
            'UPDATE assignments SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.redirect('/assignments?message=Assignment status updated successfully');
    } catch (error) {
        console.log('Assignment status update failed');
        console.log(error);
        res.redirect('/assignments?message=Assignment status could not be updated');
    }
});

app.post('/assignments/delete/:id', async function(req, res) {
    try {
        await runQuery('DELETE FROM assignments WHERE id = ?', [req.params.id]);
        res.redirect('/assignments?message=Assignment deleted successfully');
    } catch (error) {
        console.log('Assignment delete failed');
        console.log(error);
        res.redirect('/assignments?message=Assignment could not be deleted');
    }
});

app.get('/health', function(req, res) {
    res.send('Application is healthy and running');
});

app.listen(process.env.PORT, function() {
    console.log('Server running on port ' + process.env.PORT);
});