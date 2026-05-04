CREATE DATABASE IF NOT EXISTS studytrack_db;

USE studytrack_db;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    semester INT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    instructor VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    course_id INT NOT NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

INSERT INTO students (name, email, semester)
VALUES
('Talal Ahsan', 'talal@example.com', 7),
('Muhammad Usman', 'usman@example.com', 7);

INSERT INTO courses (title, code, instructor)
VALUES
('DevOps for Cloud Computing', 'CSC-DevOps', 'Qasim Malik'),
('Advanced Web Technologies', 'CSC-Web', 'Memoona');

INSERT INTO assignments (title, course_id, due_date, priority, status)
VALUES
('Selenium Test Cases', 1, '2026-05-10', 'High', 'Pending'),
('Jenkins Pipeline Report', 1, '2026-05-15', 'High', 'In Progress'),
('MongoDB Schema Task', 2, '2026-05-20', 'Medium', 'Completed');