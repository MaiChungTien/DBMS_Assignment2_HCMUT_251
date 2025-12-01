import React, { useState, useEffect } from 'react';

// --- MOCK DATA (Simulating DB connection for UI Testing) ---
const MOCK_COURSES = [
  { CourseID: 1, courseName: 'Intro to SQL', Description: 'Database basics', Difficulty_Level: 'Beginner', Price: 49.99 },
  { CourseID: 2, courseName: 'Advanced Python', Description: 'Coding mastery', Difficulty_Level: 'Advanced', Price: 99.99 },
  { CourseID: 3, courseName: 'Web Design', Description: 'HTML/CSS', Difficulty_Level: 'Intermediate', Price: 79.99 },
  { CourseID: 4, courseName: 'Calculus 101', Description: 'Math basics', Difficulty_Level: 'Beginner', Price: 59.99 },
  { CourseID: 5, courseName: 'World History', Description: 'History overview', Difficulty_Level: 'Beginner', Price: 29.99 },
];

const MOCK_ENROLLMENT = [
  { StudentID: 8, StudentName: 'Student John', Email: 'john@stu.com', Enrollment_Date: '2023-01-15' },
  { StudentID: 9, StudentName: 'Student Jane', Email: 'jane@stu.com', Enrollment_Date: '2023-01-16' },
];

function App() {
  const [activeTab, setActiveTab] = useState('courses');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- STATE FOR REQUIREMENT 3.1 & 3.2 (COURSE MANAGEMENT) ---
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [filteredCourses, setFilteredCourses] = useState(MOCK_COURSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'CourseID', direction: 'asc' });
  
  // Modal State for Insert/Update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('insert'); // 'insert' or 'update'
  const [currentCourse, setCurrentCourse] = useState({ CourseID: '', courseName: '', Description: '', Difficulty_Level: 'Beginner', Price: '' });

  // --- STATE FOR REQUIREMENT 3.3 (OTHER PROCEDURES) ---
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [evalForm, setEvalForm] = useState({ studentId: '', courseId: '' });


  // --- HELPERS ---
  const showNotification = (type, msg) => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const simulateLoading = (callback) => {
    setIsLoading(true);
    setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 500);
  };

  // --- HANDLERS FOR REQ 3.1 & 3.2 (COURSE CRUD + LIST) ---

  // Search & Filter Logic (Req 3.2)
  useEffect(() => {
    let result = [...courses];
    if (searchTerm) {
      result = result.filter(c => 
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sorting Logic (Req 3.2)
    if (sortConfig.key) {
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    setFilteredCourses(result);
  }, [courses, searchTerm, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // INSERT / UPDATE Handler (Req 3.1)
  const handleSaveCourse = (e) => {
    e.preventDefault();
    simulateLoading(() => {
      // Input Validation (Req 3.2)
      if (!currentCourse.courseName || currentCourse.Price < 0) {
        showNotification('error', 'Error: Invalid input. Name required, Price must be >= 0.');
        return;
      }

      if (modalMode === 'insert') {
        // Calls sp_insert_course
        const newId = Math.max(...courses.map(c => c.CourseID)) + 1;
        const newCourse = { ...currentCourse, CourseID: newId };
        setCourses([...courses, newCourse]);
        showNotification('success', `Course "${newCourse.courseName}" created successfully!`);
      } else {
        // Calls sp_update_course
        setCourses(courses.map(c => c.CourseID === currentCourse.CourseID ? currentCourse : c));
        showNotification('success', `Course ID ${currentCourse.CourseID} updated successfully!`);
      }
      setIsModalOpen(false);
    });
  };

  // DELETE Handler (Req 3.2 - Logical Error Handling)
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    simulateLoading(() => {
        // Logical Error Handling Simulation (Req 3.2)
        if (id === 1) {
            showNotification('error', 'Database Error: Cannot delete Course 1 because students are currently enrolled.');
        } else {
            setCourses(courses.filter(c => c.CourseID !== id));
            showNotification('success', 'Course deleted successfully.');
        }
    });
  };

  const openModal = (mode, course = null) => {
    setModalMode(mode);
    if (mode === 'update' && course) {
      setCurrentCourse(course);
    } else {
      setCurrentCourse({ CourseID: '', courseName: '', Description: '', Difficulty_Level: 'Beginner', Price: '' });
    }
    setIsModalOpen(true);
  };

  // --- HANDLERS FOR REQ 3.3 (OTHER PROCEDURES) ---

  // Get Enrollment List (Calls Get_Student_Enrollment_List)
  const handleGetEnrollments = () => {
    simulateLoading(() => {
        if (!enrollCourseId) {
            showNotification('error', 'Please enter a Course ID.');
            return;
        }
        setEnrollmentList(MOCK_ENROLLMENT); // In real app, fetch based on enrollCourseId
        showNotification('success', `Retrieved students for Course ID ${enrollCourseId}`);
    });
  };

  // Calculate Grade (Calls Calculate_Final_Grade Function)
  const handleEvaluate = () => { 
    simulateLoading(() => {
      if (evalForm.studentId === '8') {
        setEvalResult({ FinalGrade: 85.5, RiskLevel: 'Safe' });
        showNotification('success', 'Calculation complete.');
      } else if (evalForm.studentId === '9') {
        setEvalResult({ FinalGrade: 45.0, RiskLevel: 'High Risk' });
        showNotification('warning', 'Student is at High Risk!');
      } else {
        setEvalResult(null);
        showNotification('error', 'Student or Course not found.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-wide">E-Learning Management System</h1>
                <p className="text-blue-200 text-sm mt-1">Assignment 2 - Part 3: Application Implementation</p>
            </div>
            <div className="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-bold text-xs uppercase tracking-wider">
                Mock UI Mode
            </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex">
          <button 
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-4 text-center font-semibold text-sm uppercase tracking-wide transition-colors ${activeTab === 'courses' ? 'border-b-4 border-blue-600 text-blue-800 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            req 3.1 & 3.2: Course Management
          </button>
          <button 
            onClick={() => setActiveTab('other')}
            className={`flex-1 py-4 text-center font-semibold text-sm uppercase tracking-wide transition-colors ${activeTab === 'other' ? 'border-b-4 border-blue-600 text-blue-800 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            req 3.3: Other Procedures
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* NOTIFICATION TOAST */}
        {notification.message && (
            <div className={`fixed top-24 right-6 p-4 rounded shadow-lg border-l-4 z-50 animate-bounce ${notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : notification.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-green-100 border-green-500 text-green-700'}`}>
                <div className="flex items-center">
                    <span className="font-bold mr-2">{notification.type === 'error' ? 'Error:' : notification.type === 'warning' ? 'Warning:' : 'Success:'}</span>
                    {notification.message}
                </div>
            </div>
        )}

        {/* LOADING SPINNER OVERLAY */}
        {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-5 rounded shadow-lg flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mr-3"></div>
                    <span className="font-semibold text-gray-700">Processing Database Request...</span>
                </div>
            </div>
        )}

        {/* === TAB 1: COURSE MANAGEMENT (Req 3.1 & 3.2) === */}
        {activeTab === 'courses' && (
            <div className="space-y-6">
                
                {/* TOOLBAR: SEARCH & CREATE (Req 3.2) */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search courses by name or desc..." 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => openModal('insert')}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow transition transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        New Course
                    </button>
                </div>

                {/* DATA LIST TABLE (Req 3.2) */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {['CourseID', 'courseName', 'Difficulty_Level', 'Price'].map((key) => (
                                    <th 
                                        key={key}
                                        onClick={() => handleSort(key)}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                                    >
                                        <div className="flex items-center gap-1">
                                            {key.replace('_', ' ')}
                                            {sortConfig.key === key && (
                                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <tr key={course.CourseID} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{course.CourseID}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                                            <div className="text-sm text-gray-500">{course.Description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.Difficulty_Level === 'Beginner' ? 'bg-green-100 text-green-800' : course.Difficulty_Level === 'Advanced' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {course.Difficulty_Level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${course.Price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal('update', course)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                            <button onClick={() => handleDelete(course.CourseID)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No courses found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* === TAB 2: OTHER PROCEDURES (Req 3.3) === */}
        {activeTab === 'other' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Enrollment List Procedure (Req 3.3 - Procedure 1) */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Get Enrollment List (Proc 2.3)</h3>
                    <p className="text-sm text-gray-500 mb-4">Demonstrates calling <code>Get_Student_Enrollment_List</code> with a WHERE clause parameter.</p>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="number" 
                            placeholder="Enter Course ID (e.g., 1)" 
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={enrollCourseId}
                            onChange={(e) => setEnrollCourseId(e.target.value)}
                        />
                        <button onClick={handleGetEnrollments} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
                    </div>

                    {enrollmentList.length > 0 && (
                        <div className="bg-gray-50 rounded border p-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Results:</h4>
                            <ul className="space-y-2">
                                {enrollmentList.map((stu) => (
                                    <li key={stu.StudentID} className="text-sm bg-white p-2 rounded shadow-sm flex justify-between">
                                        <span>{stu.StudentName}</span>
                                        <span className="text-gray-400 text-xs">{stu.Enrollment_Date}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 2. Calculate Grade Function (Req 3.3 - Function 1) */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Calculate Grade & Risk (Func 2.4)</h3>
                    <p className="text-sm text-gray-500 mb-4">Demonstrates calling <code>Calculate_Final_Grade</code> and <code>Evaluate_Student_Risk_Level</code>.</p>
                    
                    <div className="space-y-3 mb-4">
                        <input 
                            placeholder="Student ID (Try 8 for Safe, 9 for Risk)" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={evalForm.studentId}
                            onChange={(e) => setEvalForm({...evalForm, studentId: e.target.value})}
                        />
                         <input 
                            placeholder="Course ID (e.g. 1)" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={evalForm.courseId}
                            onChange={(e) => setEvalForm({...evalForm, courseId: e.target.value})}
                        />
                        <button onClick={handleEvaluate} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Calculate Status</button>
                    </div>

                    {evalResult && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded text-center border">
                                <div className="text-xs text-gray-500 uppercase font-bold">Final Grade</div>
                                <div className="text-2xl font-bold text-gray-800">{evalResult.FinalGrade}</div>
                            </div>
                            <div className={`p-3 rounded text-center border ${evalResult.RiskLevel === 'Safe' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="text-xs text-gray-500 uppercase font-bold">Risk Level</div>
                                <div className={`text-xl font-bold ${evalResult.RiskLevel === 'Safe' ? 'text-green-700' : 'text-red-700'}`}>{evalResult.RiskLevel}</div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        )}

        {/* === MODAL FOR INSERT/UPDATE (Req 3.1) === */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {modalMode === 'insert' ? 'Create New Course' : `Edit Course #${currentCourse.CourseID}`}
                    </h3>
                    
                    <form onSubmit={handleSaveCourse} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                            <input 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={currentCourse.courseName} 
                                onChange={(e) => setCurrentCourse({...currentCourse, courseName: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                rows="2"
                                value={currentCourse.Description} 
                                onChange={(e) => setCurrentCourse({...currentCourse, Description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                <select 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={currentCourse.Difficulty_Level} 
                                    onChange={(e) => setCurrentCourse({...currentCourse, Difficulty_Level: e.target.value})}
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={currentCourse.Price} 
                                    onChange={(e) => setCurrentCourse({...currentCourse, Price: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t mt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 shadow-md"
                            >
                                {modalMode === 'insert' ? 'Save Course' : 'Update Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;