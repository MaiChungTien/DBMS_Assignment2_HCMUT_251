-- Create a database
CREATE DATABASE IF NOT EXISTS elearning_db;
USE elearning_db;

/*
=========================
BLOCK 1: USER HIERARCHY
=========================
*/

-- 1. User (Superclass)
-- This table is the parent for all user types.
CREATE TABLE IF NOT EXISTS User (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Street VARCHAR(255),
    City VARCHAR(100),
    Postal_Code VARCHAR(20)
);

-- 2. Administrator (Subclass of User)
CREATE TABLE IF NOT EXISTS Administrator (
    Admin_ID INT PRIMARY KEY,
	FOREIGN KEY (Admin_ID) REFERENCES User(ID)
	ON DELETE CASCADE
	ON UPDATE CASCADE,
    
    Role VARCHAR(50) NOT NULL
);

-- 3. End_user (Subclass of User)
-- This table acts as a superclass for Students and Instructors
CREATE TABLE IF NOT EXISTS End_user (
    End_userID INT PRIMARY KEY,
    FOREIGN KEY (End_userID) REFERENCES User(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    SFlag BOOLEAN DEFAULT FALSE, -- Student Flag
    Background TEXT,             -- Student Attribute
    IFlag BOOLEAN DEFAULT FALSE, -- Instructor Flag
    Specialization VARCHAR(255) -- Instructor Attribute
);

-- 4. Language_Of_Instruction (Multivalued attribute for End_user)
-- This table stores the teaching languages for instructors.
CREATE TABLE IF NOT EXISTS Language_Of_Instruction (
    ID INT,
    FOREIGN KEY (ID) REFERENCES End_user(End_userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    Alanguage VARCHAR(50) not null,
    
    PRIMARY KEY (ID, Alanguage)
);

/*
=========================
BLOCK 2: COURSE AND CONTENT ENTITIES
=========================
*/

-- 5. Course
CREATE TABLE IF NOT EXISTS Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    courseName VARCHAR(255) NOT NULL UNIQUE,
    Description TEXT,
    Difficulty_Level VARCHAR(50),
    Price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    CHECK (Price >= 0),
    CHECK (Difficulty_Level IN ('Beginner', 'Intermediate', 'Advanced'))
);

-- 6. Category (Multivalued attribute for Course)
CREATE TABLE IF NOT EXISTS Category (
    CourseID INT,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    ACategory VARCHAR(100) NOT NULL,
    
    PRIMARY KEY (CourseID, ACategory)
);

-- 7. Language (Multivalued attribute for Course)
CREATE TABLE IF NOT EXISTS Language (
    CourseID INT,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    Alanguage VARCHAR(50) NOT NULL,
    
    PRIMARY KEY (CourseID, Alanguage)
);

-- 8. Prerequisites (M:N relationship of Course to itself)
CREATE TABLE IF NOT EXISTS Prerequisites (
    PrecourseID INT, -- The course that is required
    FOREIGN KEY (PrecourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    SubcourseID INT, -- The course that has the prerequisite
    FOREIGN KEY (SubcourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    PRIMARY KEY (PrecourseID, SubcourseID)
);

-- 9. Lesson (Weak entity/Identifying relationship to Course)
CREATE TABLE IF NOT EXISTS Lesson (
    LessonID INT AUTO_INCREMENT PRIMARY KEY,
    LessonTitle VARCHAR(255) NOT NULL,
    CourseID INT NOT NULL,

    UNIQUE KEY uk_Lesson_Title_Course (LessonTitle, CourseID), -- Unique title per course only
    -- UNIQUE (LessonTitle)
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 10. Lesson_Resource (Weak entity dependent on Lesson)
CREATE TABLE IF NOT EXISTS Lesson_Resource (
    LessonID INT NOT NULL,
    FOREIGN KEY (LessonID) REFERENCES Lesson(LessonID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    ResourceID INT NOT NULL,
    Resource_Type VARCHAR(50) NOT NULL,
    Storage_URL VARCHAR(1024) NOT NULL,
    FileName VARCHAR(255),
    
    PRIMARY KEY (LessonID, ResourceID),
    
    CHECK (Resource_Type IN ('video', 'document', 'link', 'other'))
);

/*
=========================
BLOCK 3: ASSESSMENT AND EVALUATION HIERARCHY
=========================
*/

-- 11. Assessment_Method (Superclass for Quiz/Project)
CREATE TABLE IF NOT EXISTS Assessment_Method (
    AssessmentID INT AUTO_INCREMENT PRIMARY KEY,
    Weight_Ratio DECIMAL(5, 2) NOT NULL,
    Release_date DATETIME,
    Due_date DATETIME,
    CourseID INT NOT NULL,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    CHECK (Weight_Ratio > 0 AND Weight_Ratio <= 1.0),
    CHECK (Due_date >= Release_date)
);

-- 12. Quiz (Subclass of Assessment_Method)
CREATE TABLE IF NOT EXISTS Quiz (
    QuizID INT PRIMARY KEY,
    FOREIGN KEY (QuizID) REFERENCES Assessment_Method(AssessmentID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    Num_attempt INT DEFAULT 1,
    Passing_score DECIMAL(5, 2) NOT NULL,
    Time_limit INT,

    CHECK (Num_attempt > 0),
    CHECK (Passing_score >= 0)
);

-- 13. Project (Subclass of Assessment_Method)
CREATE TABLE IF NOT EXISTS Project (
    ProjectID INT PRIMARY KEY,
    FOREIGN KEY (ProjectID) REFERENCES Assessment_Method(AssessmentID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    Team_size INT DEFAULT 1,
    Description TEXT,
    Name VARCHAR(255),
    
    CHECK (Team_size >= 1)
);

-- 14. Quiz_Question (Weak entity dependent on Quiz)
CREATE TABLE IF NOT EXISTS Quiz_Question (
    QuizID INT,
    FOREIGN KEY (QuizID) REFERENCES Quiz(QuizID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    QuestionID INT,
    Question_Text TEXT NOT NULL,
    Type VARCHAR(50) NOT NULL,
    
    PRIMARY KEY (QuizID, QuestionID)
);

-- 15. Answer (Multivalued attribute for Quiz_Question)
CREATE TABLE IF NOT EXISTS Answer (
    QuizID INT,
    QuestionID INT,
    AAnswer VARCHAR(500),
    
    PRIMARY KEY (QuizID, QuestionID, AAnswer),
    FOREIGN KEY (QuizID, QuestionID) REFERENCES Quiz_Question(QuizID, QuestionID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

/*
=========================
BLOCK 4: CERTIFICATE, REVIEW, AND PAYMENT ENTITIES
=========================
*/

-- 16. Certificate
CREATE TABLE IF NOT EXISTS Certificate (
    Cer_ID INT AUTO_INCREMENT PRIMARY KEY,
    Cer_Name VARCHAR(255) NOT NULL,
    Issue_Date DATE NOT NULL,
    CourseID INT NOT NULL,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 17. Review (Weak entity dependent on Student)
CREATE TABLE IF NOT EXISTS Review (
    ReviewID INT AUTO_INCREMENT,
    StudentID INT,
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    Description TEXT,
    Rating INT NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (ReviewID, StudentID),
    
    CHECK (Rating >= 1 AND Rating <= 5)
);

-- 18. Payment (Weak entity dependent on Student)
CREATE TABLE IF NOT EXISTS Payment (
    PaymentID INT AUTO_INCREMENT,
    StudentID INT,
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    TimeStamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (PaymentID, StudentID),
    
    CHECK (Amount > 0)
);

-- 19. Method (Multivalued attribute for Payment)
CREATE TABLE IF NOT EXISTS Method (
    PaymentID INT,
    StudentID INT,
    Amethod VARCHAR(50),
    
    PRIMARY KEY (PaymentID, StudentID, Amethod),
    FOREIGN KEY (PaymentID, StudentID) REFERENCES Payment(PaymentID, StudentID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

/*
=========================
BLOCK 5: RELATIONSHIP (JUNCTION) TABLES
=========================
*/

-- 20. Enroll (M:N between Student and Course)
CREATE TABLE IF NOT EXISTS Enroll (
    StudentID INT,
    CourseID INT,
    Enrollment_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE cascade
        ON UPDATE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE restrict
        ON UPDATE CASCADE
);

-- 21. Create (M:N between Instructor and Course)
CREATE TABLE IF NOT EXISTS `Create` (
    CourseID INT,
    InstructorID INT,
    Creation_Date DATE NOT NULL DEFAULT (CURDATE()),
    
    PRIMARY KEY (CourseID, InstructorID),
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (InstructorID) REFERENCES End_user(End_userID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 22. Aprrove (N:1 relationship between Administrator and Course)
CREATE TABLE IF NOT EXISTS Aprrove (
    CourseID INT PRIMARY KEY,
    AdminID INT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',

    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (AdminID) REFERENCES Administrator(Admin_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CHECK (Status IN ('Pending', 'Approved', 'Rejected'))
);

-- 23. Attempt_In (M:N between Student and Assessment_Method)
CREATE TABLE IF NOT EXISTS Attempt_In (
    StudentID INT,
    AssessmentID INT,
    Score DECIMAL(5, 2) NULL,
    Feedback TEXT,
    Attempt_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (StudentID, AssessmentID),
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (AssessmentID) REFERENCES Assessment_Method(AssessmentID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (Score >= 0)
);

-- 24. Receive (N:1 relationship between Student and Certificate)
CREATE TABLE IF NOT EXISTS Receive (
    Cer_ID INT PRIMARY KEY,
    StudentID INT NOT NULL,

    FOREIGN KEY (Cer_ID) REFERENCES Certificate(Cer_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 25. Study (M:N between Student and Lesson)
CREATE TABLE IF NOT EXISTS Study (
    LessonID INT,
    StudentID INT,
    
    PRIMARY KEY (LessonID, StudentID),
    FOREIGN KEY (LessonID) REFERENCES Lesson(LessonID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (StudentID) REFERENCES End_user(End_userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 26. Review_On (N:1 relationship between Review and Course)
CREATE TABLE IF NOT EXISTS Review_On (
    ReviewID INT,
    StudentID INT,
    CourseID INT NOT NULL,
    
    PRIMARY KEY (ReviewID, StudentID),
    FOREIGN KEY (ReviewID, StudentID) REFERENCES Review(ReviewID, StudentID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 27. Paid_For (1:1 relationship between Payment and Course)
CREATE TABLE IF NOT EXISTS Paid_For (
    PaymentID INT,
    StudentID INT,
    CourseID INT NOT NULL,
    
    PRIMARY KEY (PaymentID, StudentID),
    FOREIGN KEY (PaymentID, StudentID) REFERENCES Payment(PaymentID, StudentID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS Competition (
    CompetitionID INT AUTO_INCREMENT PRIMARY KEY,
    Name         VARCHAR(255) NOT NULL UNIQUE,
    Description  TEXT,
    Start_date   DATETIME NOT NULL,
    End_date     DATETIME NOT NULL,
    
    CHECK (End_date >= Start_date)
);

CREATE TABLE IF NOT EXISTS Organize (
    AdminID        INT,
    CompetitionName VARCHAR(255),
    PRIMARY KEY (AdminID, CompetitionName),
    FOREIGN KEY (AdminID)        REFERENCES Administrator(Admin_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CompetitionName) REFERENCES Competition(Name)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE  TABLE IF NOT EXISTS Participate (
    StudentID       INT,
    CompetitionName VARCHAR(255),

    PRIMARY KEY (StudentID, CompetitionName),
    FOREIGN KEY (StudentID)       REFERENCES End_user(End_userID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CompetitionName) REFERENCES Competition(Name)
        ON DELETE CASCADE ON UPDATE CASCADE
);



















