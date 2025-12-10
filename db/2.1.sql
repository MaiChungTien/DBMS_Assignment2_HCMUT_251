USE elearning_db;

DELIMITER $$

CREATE PROCEDURE sp_enroll_create (
    IN pStudentID INT,
    IN pCourseID INT,
    IN pEnrollmentDate DATETIME
)
BEGIN
    -- 1. Check that student exists and is a valid student (SFlag = TRUE)
    IF NOT EXISTS (
        SELECT 1
        FROM End_user
        WHERE End_userID = pStudentID
          AND SFlag = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid student: StudentID is not a valid student.';
    END IF;

    -- 2. Check that course exists
    IF NOT EXISTS (
        SELECT 1
        FROM Course
        WHERE CourseID = pCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid course: CourseID does not exist.';
    END IF;

    -- 3. Course must be approved by an admin
    IF NOT EXISTS (
        SELECT 1
        FROM Aprrove
        WHERE CourseID = pCourseID
          AND Status = 'Approved'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Course is not approved for enrollment.';
    END IF;

    -- 4. Instructor cannot enroll as a student in their own course
    IF EXISTS (
        SELECT 1
        FROM `Create`
        WHERE CourseID = pCourseID
          AND InstructorID = pStudentID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Instructor cannot enroll as a student in their own course.';
    END IF;

    -- 5. Prevent duplicate enrollment
    IF EXISTS (
        SELECT 1
        FROM Enroll
        WHERE StudentID = pStudentID
          AND CourseID = pCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate enrollment: the student is already enrolled in this course.';
    END IF;
    -- 7. Perform the actual insert
    INSERT INTO Enroll (StudentID, CourseID, Enrollment_Date)
    VALUES (
        pStudentID,
        pCourseID,
        COALESCE(pEnrollmentDate, NOW())
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_enroll_update_transfer (
    IN pStudentID INT,
    IN pOldCourseID INT,
    IN pNewCourseID INT,
    IN pNewEnrollmentDate DATETIME
)
BEGIN
    DECLARE vEnrollmentDate DATETIME;

    -- 1. Enrollment cũ phải tồn tại + lấy Enrollment_Date
    SELECT Enrollment_Date
    INTO vEnrollmentDate
    FROM Enroll
    WHERE StudentID = pStudentID
      AND CourseID = pOldCourseID;

    IF vEnrollmentDate IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot transfer: original enrollment does not exist.';
    END IF;

    -- 2. Không cho chuyển nếu đã quá 10 ngày kể từ khi ghi danh
    IF DATEDIFF(CURDATE(), DATE(vEnrollmentDate)) >= 10 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot transfer: enrollment is older than or equal to 10 days.';
    END IF;

    -- 3. Khóa mới phải tồn tại
    IF NOT EXISTS (
        SELECT 1
        FROM Course
        WHERE CourseID = pNewCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid new course: CourseID does not exist.';
    END IF;

    -- 4. Khóa mới phải được approve
    IF NOT EXISTS (
        SELECT 1
        FROM Aprrove
        WHERE CourseID = pNewCourseID
          AND Status = 'Approved'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'New course is not approved for enrollment.';
    END IF;

    -- 5. Không cho instructor tự enroll vào khóa mới của chính mình
    IF EXISTS (
        SELECT 1
        FROM `Create`
        WHERE CourseID = pNewCourseID
          AND InstructorID = pStudentID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Instructor cannot enroll as a student in the new course they teach.';
    END IF;

    -- 6. Không cho transfer nếu đã enroll khóa mới rồi
    IF EXISTS (
        SELECT 1
        FROM Enroll
        WHERE StudentID = pStudentID
          AND CourseID = pNewCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot transfer: student is already enrolled in the new course.';
    END IF;

    -- 7. Nếu đã payment cho khóa cũ thì chỉ cho chuyển sang khóa mới có chung instructor
    -- IF EXISTS (
--         SELECT 1
--         FROM Paid_For pf
--         WHERE pf.StudentID = pStudentID
--           AND pf.CourseID = pOldCourseID
--     ) THEN
--         IF NOT EXISTS (
--             SELECT 1
--             FROM `Create` c_old
--             JOIN `Create` c_new
--               ON c_old.InstructorID = c_new.InstructorID
--             WHERE c_old.CourseID = pOldCourseID
--               AND c_new.CourseID = pNewCourseID
--         ) THEN
--             SIGNAL SQLSTATE '45000'
--                 SET MESSAGE_TEXT = 'Cannot transfer: payment exists and the new course is taught by a different instructor.';
--         END IF;
--     END IF;

    -- 8. (Optional) – giữ rule không cho chuyển nếu đã Attempt / Certificate
    IF EXISTS (
        SELECT 1
        FROM Receive r
        JOIN Certificate c ON r.Cer_ID = c.Cer_ID
        WHERE r.StudentID = pStudentID
          AND c.CourseID = pOldCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot transfer: You have completed the course. Please enroll new course';
    END IF;

    -- 10. Thực hiện update: chuyển sang khóa mới
    UPDATE Enroll
    SET CourseID = pNewCourseID,
        Enrollment_Date = COALESCE(pNewEnrollmentDate, Enrollment_Date)
    WHERE StudentID = pStudentID
      AND CourseID = pOldCourseID;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_enroll_delete (
    IN pStudentID INT,
    IN pCourseID INT
)
BEGIN
    -- 1. Kiểm tra enrollment tồn tại
    IF NOT EXISTS (
        SELECT 1
        FROM Enroll
        WHERE StudentID = pStudentID
          AND CourseID = pCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete: enrollment does not exist.';
    END IF;

    -- 2. Không cho xoá nếu đã có payment cho course này
    IF EXISTS (
        SELECT 1
        FROM Paid_For pf
        WHERE pf.StudentID = pStudentID
          AND pf.CourseID = pCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete enrollment: payment already exists for this course.';
    END IF;

    
    IF EXISTS (
        SELECT 1
        FROM Receive r
        JOIN Certificate c ON r.Cer_ID = c.Cer_ID
        WHERE r.StudentID = pStudentID
          AND c.CourseID = pCourseID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete enrollment: certificate has been issued for this course.';
    END IF;

    -- 5. Xoá enrollment (nếu không vi phạm rule nào ở trên)
    DELETE FROM Enroll
    WHERE StudentID = pStudentID
      AND CourseID = pCourseID;
END$$

DELIMITER ;



