

USE elearning_db;

DELIMITER $$

USE elearning_db;
DELIMITER $$

DROP FUNCTION IF EXISTS fn_student_category_preferences $$
CREATE FUNCTION fn_student_category_preferences(
    pStudentID INT
)
RETURNS VARCHAR(1000)
DETERMINISTIC
BEGIN
    -- 1. Biến
    DECLARE done INT DEFAULT 0;
    DECLARE vCategory VARCHAR(100);
    DECLARE vCatCount INT DEFAULT 0;
    DECLARE vTotal INT DEFAULT 0;
    DECLARE vRatio DECIMAL(10,2) DEFAULT 0;
    DECLARE vResult VARCHAR(1000) DEFAULT '';
    DECLARE flag INT DEFAULT 0;

    -- 2. CURSOR: duyệt từng category mà student này đã học
    DECLARE curCategory CURSOR FOR
        SELECT DISTINCT c2.ACategory
        FROM Enroll e2
        JOIN Category c2 ON c2.CourseID = e2.CourseID
        WHERE e2.StudentID = pStudentID;

    -- 3. HANDLER
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- 4. Validate student
    SELECT COUNT(*) INTO flag
    FROM End_user
    WHERE End_userID = pStudentID AND SFlag = TRUE;

    IF flag = 0 THEN
        RETURN 'Invalid student';
    END IF;

    -- 5. Tổng số course student đã enroll
    SELECT COUNT(*) INTO vTotal
    FROM Enroll
    WHERE StudentID = pStudentID;

    IF vTotal = 0 THEN
        RETURN 'Student has not enrolled in any course.';
    END IF;

    -- 6. Mở cursor và duyệt
    OPEN curCategory;

    read_loop: LOOP
        FETCH curCategory INTO vCategory;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        -- Đếm số course của student này thuộc category đang xét
        SELECT COUNT(DISTINCT e.CourseID) INTO vCatCount
        FROM Enroll e
        JOIN Category c ON c.CourseID = e.CourseID
        WHERE e.StudentID = pStudentID
          AND c.ACategory = vCategory;

        IF vCatCount > 0 THEN
            SET vRatio = vCatCount / vTotal;

            SET vResult = CONCAT(
                vResult,
                vCategory, ' (', ROUND(vRatio * 100, 2), '%), '
            );
        END IF;

    END LOOP;

    CLOSE curCategory;

    -- 7. Trim dấu phẩy cuối
    SET vResult = TRIM(TRAILING ', ' FROM vResult);

    RETURN vResult;
END$$

DELIMITER ;


USE elearning_db;
DELIMITER $$

DROP FUNCTION IF EXISTS fn_course_score_report $$
CREATE FUNCTION fn_course_score_report(
    pStudentID INT,
    pCourseID INT
)
RETURNS VARCHAR(2000)
DETERMINISTIC
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE vAssessmentID INT;
    DECLARE vWeight DECIMAL(5,2);
    DECLARE vScore DECIMAL(10,2);
    DECLARE vName VARCHAR(255);
    DECLARE vReport VARCHAR(2000) DEFAULT '';
    DECLARE vFinal DECIMAL(10,2) DEFAULT 0;
    DECLARE vFirst INT DEFAULT 1;
    DECLARE vCnt INT;

    -- ⚠️ TẤT CẢ DECLARE CURSOR + HANDLER PHẢI ĐỂ Ở ĐÂY
    DECLARE cur CURSOR FOR
        SELECT 
            am.AssessmentID,
            am.Weight_Ratio,
            COALESCE(
                pr.Name,                     -- Project name
                CONCAT('Quiz ', q.QuizID),   -- Quiz label
                CONCAT('Assessment ', am.AssessmentID) -- fallback
            ) AS AssessName,
            ai.Score
        FROM Assessment_Method am
        LEFT JOIN Project pr ON pr.ProjectID = am.AssessmentID
        LEFT JOIN Quiz q    ON q.QuizID     = am.AssessmentID
        LEFT JOIN Attempt_In ai 
               ON ai.AssessmentID = am.AssessmentID
              AND ai.StudentID    = pStudentID
        WHERE am.CourseID = pCourseID
        ORDER BY am.AssessmentID;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- 1. Validate student
    SELECT COUNT(*) INTO vCnt
    FROM End_user
    WHERE End_userID = pStudentID
      AND SFlag = TRUE;

    IF vCnt = 0 THEN
        RETURN CONCAT('Invalid student: ', pStudentID);
    END IF;

    -- 2. Validate course
    SELECT COUNT(*) INTO vCnt
    FROM Course
    WHERE CourseID = pCourseID;

    IF vCnt = 0 THEN
        RETURN CONCAT('Invalid course: ', pCourseID);
    END IF;

    -- 3. Duyệt toàn bộ assessment trong course
    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO vAssessmentID, vWeight, vName, vScore;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        -- Thêm dấu phẩy ngăn cách
        IF vFirst = 0 THEN
            SET vReport = CONCAT(vReport, ', ');
        ELSE
            SET vFirst = 0;
        END IF;

        -- Ghi từng phần: Quiz 1(20%): 4
        SET vReport = CONCAT(
            vReport,
            vName, '(',
            ROUND(vWeight * 100, 0), '%): ',
            IFNULL(vScore, '0')
        );

        -- Cộng final score nếu có điểm
        IF vScore IS NOT NULL THEN
            SET vFinal = vFinal + (vScore * vWeight);
        END IF;
    END LOOP;

    CLOSE cur;

    -- 4. Thêm Final Score vào cuối chuỗi
    SET vReport = CONCAT(vReport, ', Final Score: ', vFinal);

    RETURN vReport;
END$$

DELIMITER ;
SELECT fn_course_score_report(32, 3);


