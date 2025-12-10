USE elearning_db;

USE elearning_db;

-- DELIMITER $$

-- DROP TRIGGER IF EXISTS tr_check_prerequisite $$
-- CREATE TRIGGER tr_check_prerequisite
-- BEFORE INSERT ON Enroll
-- FOR EACH ROW
-- BEGIN
--     -- Nếu course mới có bất kỳ prerequisite nào mà student CHƯA có certificate → chặn
--     IF EXISTS (
--         SELECT 1
--         FROM Prerequisites pr
--         WHERE pr.SubcourseID = NEW.CourseID
--           AND NOT EXISTS (
--               SELECT 1
--               FROM Receive r
--               JOIN Certificate c ON r.Cer_ID = c.Cer_ID
--               WHERE r.StudentID = NEW.StudentID
--                 AND c.CourseID = pr.PrecourseID
--           )
--     ) THEN
--         SIGNAL SQLSTATE '45000'
--             SET MESSAGE_TEXT = 'Cannot enroll: student has not completed all prerequisite courses.';
--     END IF;
-- END$$
DELIMITER $$

DELIMITER $$

DROP TRIGGER IF EXISTS tr_check_prerequisite $$
CREATE TRIGGER tr_check_prerequisite
BEFORE INSERT ON Enroll
FOR EACH ROW
BEGIN
    DECLARE v_msg VARCHAR(255);

    -- Nếu course mới có bất kỳ prerequisite nào mà student CHƯA có certificate → chặn
    IF EXISTS (
        SELECT 1
        FROM Prerequisites pr
        WHERE pr.SubcourseID = NEW.CourseID
          AND NOT EXISTS (
              SELECT 1
              FROM Receive r
              JOIN Certificate c ON r.Cer_ID = c.Cer_ID
              WHERE r.StudentID = NEW.StudentID
                AND c.CourseID = pr.PrecourseID
          )
    ) THEN
        SET v_msg = CONCAT(
            'Cannot enroll student ', NEW.StudentID,
            ' into course ', NEW.CourseID,
            ': missing prerequisite(s).'
        );

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_msg;
    END IF;
END$$

DELIMITER ;


/* ========================================
   2. BEFORE UPDATE ON Enroll
   - Check prerequisite khi đổi course (transfer)
   ======================================== */
CREATE TRIGGER tr_check_prerequisite_update
BEFORE UPDATE ON Enroll
FOR EACH ROW
BEGIN
    -- Chỉ cần check khi CourseID thực sự thay đổi
    IF NEW.CourseID <> OLD.CourseID THEN
        IF EXISTS (
            SELECT 1
            FROM Prerequisites pr
            WHERE pr.SubcourseID = NEW.CourseID
              AND NOT EXISTS (
                  SELECT 1
                  FROM Receive r
                  JOIN Certificate c ON r.Cer_ID = c.Cer_ID
                  WHERE r.StudentID = NEW.StudentID
                    AND c.CourseID = pr.PrecourseID
              )
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot transfer: student has not completed all prerequisite courses for the new course.';
        END IF;
    END IF;
END$$

DELIMITER ;


DELIMITER $$

/* ===========================================
   1. AFTER INSERT ON Enroll
   - Student enroll khóa mới -> cộng thêm Price
   =========================================== */
CREATE TRIGGER tr_amountdue_after_enroll_insert
AFTER INSERT ON Enroll
FOR EACH ROW
BEGIN
    DECLARE vPrice DECIMAL(10,2);

    -- Lấy giá khóa vừa enroll
    SELECT Price INTO vPrice
    FROM Course
    WHERE CourseID = NEW.CourseID;

    -- Tăng tổng nợ của student
    UPDATE End_user
    SET Total_Amount_Due = COALESCE(Total_Amount_Due, 0) + vPrice
    WHERE End_userID = NEW.StudentID
      AND SFlag = TRUE;
END$$


/* ===========================================
   2. AFTER DELETE ON Enroll
   - Student unenroll khỏi khóa -> trừ Price
   =========================================== */
CREATE TRIGGER tr_amountdue_after_enroll_delete
AFTER DELETE ON Enroll
FOR EACH ROW
BEGIN
    DECLARE vPrice DECIMAL(10,2);

    -- Lấy giá khóa vừa unenroll
    SELECT Price INTO vPrice
    FROM Course
    WHERE CourseID = OLD.CourseID;

    -- Giảm tổng nợ của student
    UPDATE End_user
    SET Total_Amount_Due = COALESCE(Total_Amount_Due, 0) - vPrice
    WHERE End_userID = OLD.StudentID
      AND SFlag = TRUE;
END$$


/* ===========================================
   3. AFTER UPDATE ON Enroll
   - Case transfer: đổi CourseID trong cùng hàng Enroll
   - Trừ giá khóa cũ, cộng giá khóa mới
   =========================================== */
CREATE TRIGGER tr_amountdue_after_enroll_update
AFTER UPDATE ON Enroll
FOR EACH ROW
BEGIN
    DECLARE vOldPrice DECIMAL(10,2);
    DECLARE vNewPrice DECIMAL(10,2);

    -- Chỉ xử lý khi CourseID thực sự đổi
    IF NEW.CourseID <> OLD.CourseID THEN
        -- Giá khóa cũ
        SELECT Price INTO vOldPrice
        FROM Course
        WHERE CourseID = OLD.CourseID;

        -- Giá khóa mới
        SELECT Price INTO vNewPrice
        FROM Course
        WHERE CourseID = NEW.CourseID;

        -- Điều chỉnh tổng nợ
        UPDATE End_user
        SET Total_Amount_Due = COALESCE(Total_Amount_Due, 0) - vOldPrice + vNewPrice
        WHERE End_userID = NEW.StudentID
          AND SFlag = TRUE;
    END IF;
END$$
DROP TRIGGER IF EXISTS tr_check_prerequisite;

DROP TRIGGER IF EXISTS tr_amountdue_after_enroll_insert;
DROP TRIGGER IF EXISTS tr_amountdue_after_enroll_delete;
DROP TRIGGER IF EXISTS tr_amountdue_after_enroll_update;

SHOW TRIGGERS;
DROP TRIGGER IF EXISTS trg_no_instructor_self_enroll;


