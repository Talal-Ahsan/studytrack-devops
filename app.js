const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(function(error) {
    if (error) {
        console.log('Database connection failed');
        console.log(error);
    } else {
        console.log('Database connected successfully');
    }
});

app.get('/', function(req, res) {
    const studentsQuery = 'SELECT COUNT(*) AS totalStudents FROM students';
    const coursesQuery = 'SELECT COUNT(*) AS totalCourses FROM courses';
    const assignmentsQuery = 'SELECT COUNT(*) AS totalAssignments FROM assignments';
    const pendingQuery = "SELECT COUNT(*) AS pendingAssignments FROM assignments WHERE status = 'Pending'";
    const progressQuery = "SELECT COUNT(*) AS progressAssignments FROM assignments WHERE status = 'In Progress'";
    const completedQuery = "SELECT COUNT(*) AS completedAssignments FROM assignments WHERE status = 'Completed'";

    const recentQuery = `
        SELECT assignments.id, assignments.title, assignments.due_date, assignments.priority, assignments.status, courses.title AS course_title
        FROM assignments
        JOIN courses ON assignments.course_id = courses.id
        ORDER BY assignments.due_date ASC
        LIMIT 5
    `;

    db.query(studentsQuery, function(error1, studentsResult) {
        db.query(coursesQuery, function(error2, coursesResult) {
            db.query(assignmentsQuery, function(error3, assignmentsResult) {
                db.query(pendingQuery, function(error4, pendingResult) {
                    db.query(progressQuery, function(error5, progressResult) {
                        db.query(completedQuery, function(error6, completedResult) {
                            db.query(recentQuery, function(error7, recentAssignments) {
                                res.render('index', {
                                    totalStudents: studentsResult[0].totalStudents,
                                    totalCourses: coursesResult[0].totalCourses,
                                    totalAssignments: assignmentsResult[0].totalAssignments,
                                    pendingAssignments: pendingResult[0].pendingAssignments,
                                    progressAssignments: progressResult[0].progressAssignments,
                                    completedAssignments: completedResult[0].completedAssignments,
                                    recentAssignments: recentAssignments
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/students', function(req, res) {
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

    db.query(query, values, function(error, students) {
        res.render('students', {
            students: students,
            search: search,
            message: message
        });
    });
});

app.post('/students/add', function(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const semester = req.body.semester;

    db.query(
        'INSERT INTO students (name, email, semester) VALUES (?, ?, ?)',
        [name, email, semester],
        function(error) {
            if (error) {
                res.redirect('/students?message=Student could not be added');
            } else {
                res.redirect('/students?message=Student added successfully');
            }
        }
    );
});

app.post('/students/delete/:id', function(req, res) {
    db.query('DELETE FROM students WHERE id = ?', [req.params.id], function(error) {
        if (error) {
            res.redirect('/students?message=Student could not be deleted');
        } else {
            res.redirect('/students?message=Student deleted successfully');
        }
    });
});

app.get('/courses', function(req, res) {
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

    db.query(query, values, function(error, courses) {
        res.render('courses', {
            courses: courses,
            search: search,
            message: message
        });
    });
});

app.post('/courses/add', function(req, res) {
    const title = req.body.title;
    const code = req.body.code;
    const instructor = req.body.instructor;

    db.query(
        'INSERT INTO courses (title, code, instructor) VALUES (?, ?, ?)',
        [title, code, instructor],
        function(error) {
            if (error) {
                res.redirect('/courses?message=Course could not be added');
            } else {
                res.redirect('/courses?message=Course added successfully');
            }
        }
    );
});

app.post('/courses/delete/:id', function(req, res) {
    db.query('DELETE FROM courses WHERE id = ?', [req.params.id], function(error) {
        if (error) {
            res.redirect('/courses?message=Course could not be deleted');
        } else {
            res.redirect('/courses?message=Course deleted successfully');
        }
    });
});

app.get('/assignments', function(req, res) {
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

    db.query(query, values, function(error1, assignments) {
        db.query('SELECT * FROM courses ORDER BY title ASC', function(error2, courses) {
            res.render('assignments', {
                assignments: assignments,
                courses: courses,
                selectedStatus: status,
                selectedPriority: priority,
                search: search,
                message: message
            });
        });
    });
});

app.post('/assignments/add', function(req, res) {
    const title = req.body.title;
    const course_id = req.body.course_id;
    const due_date = req.body.due_date;
    const priority = req.body.priority;
    const status = req.body.status;

    db.query(
        'INSERT INTO assignments (title, course_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?)',
        [title, course_id, due_date, priority, status],
        function(error) {
            if (error) {
                res.redirect('/assignments?message=Assignment could not be added');
            } else {
                res.redirect('/assignments?message=Assignment added successfully');
            }
        }
    );
});

app.post('/assignments/status/:id', function(req, res) {
    const status = req.body.status;

    db.query(
        'UPDATE assignments SET status = ? WHERE id = ?',
        [status, req.params.id],
        function(error) {
            if (error) {
                res.redirect('/assignments?message=Assignment status could not be updated');
            } else {
                res.redirect('/assignments?message=Assignment status updated successfully');
            }
        }
    );
});

app.post('/assignments/delete/:id', function(req, res) {
    db.query('DELETE FROM assignments WHERE id = ?', [req.params.id], function(error) {
        if (error) {
            res.redirect('/assignments?message=Assignment could not be deleted');
        } else {
            res.redirect('/assignments?message=Assignment deleted successfully');
        }
    });
});

app.get('/health', function(req, res) {
    res.send('Application is healthy and running');
});

app.listen(process.env.PORT, function() {
    console.log('Server running on port ' + process.env.PORT);
});