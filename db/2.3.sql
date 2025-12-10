USE elearning_db;

DELIMITER $$

CREATE PROCEDURE sp_get_enrolled_courses (
    IN pStudentID INT
)
BEGIN
    -- Kiểm tra student hợp lệ
    IF NOT EXISTS (
        SELECT 1
        FROM End_user
        WHERE End_userID = pStudentID
          AND SFlag = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid student: StudentID is not a valid student.';
    END IF;

    SELECT
        c.CourseID,
        c.courseName,
        u.Name AS InstructorName,
        e.Enrollment_Date
    FROM Enroll e
    JOIN Course c 
        ON e.CourseID = c.CourseID
    JOIN `Create` cr
        ON cr.CourseID = c.CourseID
    JOIN End_user eu
        ON eu.End_userID = cr.InstructorID
    JOIN User u
        ON u.ID = eu.End_userID
    WHERE e.StudentID = pStudentID
    ORDER BY e.Enrollment_Date DESC, c.courseName ASC;
END$$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_get_popular_courses (
    IN pMinStudents INT,
    IN pInstructorID INT  -- có thể truyền NULL để xem tất cả instructors
)
BEGIN
    /*
      Trả về danh sách các khóa học phổ biến,
      cùng với tên khóa, tên giảng viên và số lượng học viên.
    */

    SELECT
        c.CourseID,
        c.courseName,
        u.Name AS InstructorName,
        COUNT(DISTINCT e.StudentID) AS TotalStudents
    FROM Enroll e
    JOIN Course c
        ON e.CourseID = c.CourseID
    JOIN `Create` cr
        ON cr.CourseID = c.CourseID
    JOIN End_user eu
        ON eu.End_userID = cr.InstructorID
    JOIN User u
        ON u.ID = eu.End_userID
    WHERE
        (pInstructorID IS NULL OR cr.InstructorID = pInstructorID)
    GROUP BY
        c.CourseID,
        c.courseName,
        u.Name
    HAVING
        COUNT(DISTINCT e.StudentID) >= pMinStudents
    ORDER BY
        TotalStudents DESC,
        c.courseName ASC;
END$$

DELIMITER ;
