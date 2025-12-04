

import React, { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('courses');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- REAL DATA STATES ---
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'CourseID', direction: 'asc' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('insert'); 
  const [currentCourse, setCurrentCourse] = useState({ CourseID: '', courseName: '', Description: '', Difficulty_Level: 'Beginner', Price: '' });

  // Procedure States
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [evalForm, setEvalForm] = useState({ studentId: '', courseId: '' });

  // --- API URL ---
  const API_URL = 'http://localhost:3001/api';

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchCourses();
  }, []);

  // --- HELPERS ---
  const showNotification = (type, msg) => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const fetchCourses = () => {
    setIsLoading(true);
    fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setFilteredCourses(data); // Initialize filter
        setIsLoading(false);
      })
      .catch(err => {
        showNotification('error', 'Failed to connect to Database');
        setIsLoading(false);
      });
  };

  // --- SEARCH & FILTER LOGIC ---
  useEffect(() => {
    let result = [...courses];
    if (searchTerm) {
      result = result.filter(c => 
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.Description && c.Description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
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

  // --- CRUD HANDLERS (Talking to Real DB) ---

  const handleSaveCourse = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = modalMode === 'insert' ? `${API_URL}/courses` : `${API_URL}/courses/${currentCourse.CourseID}`;
    const method = modalMode === 'insert' ? 'POST' : 'PUT';

    fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCourse)
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Database Error');
      
      showNotification('success', data.message);
      setIsModalOpen(false);
      fetchCourses(); // Refresh list from DB
    })
    .catch(err => {
      showNotification('error', err.message);
      setIsLoading(false);
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setIsLoading(true);

    fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Database Error');
        
        showNotification('success', 'Course deleted successfully');
        fetchCourses(); // Refresh list
    })
    .catch(err => {
        // This will catch the SQL Constraint error (students enrolled)
        showNotification('error', err.message); 
        setIsLoading(false);
    });
  };

  // --- PROCEDURE HANDLERS ---

  const handleGetEnrollments = () => {
    if (!enrollCourseId) return showNotification('error', 'Enter Course ID');
    setIsLoading(true);
    
    fetch(`${API_URL}/enrollments/${enrollCourseId}`)
    .then(res => res.json())
    .then(data => {
        setEnrollmentList(data);
        showNotification('success', `Found ${data.length} students.`);
        setIsLoading(false);
    })
    .catch(err => {
        showNotification('error', 'Failed to fetch enrollments');
        setIsLoading(false);
    });
  };

  const handleEvaluate = () => { 
    if (!evalForm.studentId || !evalForm.courseId) return showNotification('error', 'Enter IDs');
    setIsLoading(true);

    fetch(`${API_URL}/evaluate/${evalForm.studentId}/${evalForm.courseId}`)
    .then(async res => {
        if (!res.ok) throw new Error('No data found');
        return res.json();
    })
    .then(data => {
        setEvalResult(data);
        showNotification('success', 'Calculation complete.');
        setIsLoading(false);
    })
    .catch(err => {
        setEvalResult(null);
        showNotification('error', err.message);
        setIsLoading(false);
    });
  };

  // --- UI RENDER (Same Layout) ---
  const openModal = (mode, course = null) => {
    setModalMode(mode);
    if (mode === 'update' && course) {
      setCurrentCourse(course);
    } else {
      setCurrentCourse({ CourseID: '', courseName: '', Description: '', Difficulty_Level: 'Beginner', Price: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-wide">E-Learning Management System</h1>
                <p className="text-blue-200 text-sm mt-1">Assignment 2 - Part 3: Live Database Connection</p>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded font-bold text-xs uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                Connected to MySQL
            </div>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex">
          <button onClick={() => setActiveTab('courses')} className={`flex-1 py-4 text-center font-semibold text-sm uppercase tracking-wide transition-colors ${activeTab === 'courses' ? 'border-b-4 border-blue-600 text-blue-800 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>Course Management</button>
          <button onClick={() => setActiveTab('other')} className={`flex-1 py-4 text-center font-semibold text-sm uppercase tracking-wide transition-colors ${activeTab === 'other' ? 'border-b-4 border-blue-600 text-blue-800 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>Procedures & Functions</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* NOTIFICATIONS */}
        {notification.message && (
            <div className={`fixed top-24 right-6 p-4 rounded shadow-lg border-l-4 z-50 animate-bounce ${notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-green-100 border-green-500 text-green-700'}`}>
                <div className="flex items-center"><span className="font-bold mr-2">{notification.type === 'error' ? 'Error:' : 'Success:'}</span>{notification.message}</div>
            </div>
        )}

        {/* LOADING */}
        {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-5 rounded shadow-lg flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mr-3"></div>
                    <span className="font-semibold text-gray-700">Processing Database Request...</span>
                </div>
            </div>
        )}

        {/* TAB 1: COURSES */}
        {activeTab === 'courses' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex w-full md:w-auto gap-2">
                        <input type="text" placeholder="Search courses..." className="w-full md:w-80 pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => openModal('insert')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow transition transform active:scale-95">New Course</button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {['CourseID', 'courseName', 'Difficulty_Level', 'Price'].map((key) => (
                                    <th key={key} onClick={() => handleSort(key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none">
                                        {key} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCourses.map((course) => (
                                <tr key={course.CourseID} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{course.CourseID}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{course.courseName}</div><div className="text-sm text-gray-500 truncate w-48">{course.Description}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.Difficulty_Level === 'Beginner' ? 'bg-green-100 text-green-800' : course.Difficulty_Level === 'Advanced' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{course.Difficulty_Level}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${course.Price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal('update', course)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(course.CourseID)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB 2: PROCEDURES */}
        {activeTab === 'other' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Get Enrollment List</h3>
                    <div className="flex gap-2 mb-4">
                        <input type="number" placeholder="Course ID (e.g. 1)" className="flex-1 p-2 border rounded" value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} />
                        <button onClick={handleGetEnrollments} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {enrollmentList.map((stu) => (
                            <li key={stu.StudentID} className="text-sm bg-gray-50 p-2 rounded flex justify-between"><span>{stu.StudentName}</span><span className="text-gray-400 text-xs">{new Date(stu.Enrollment_Date).toLocaleDateString()}</span></li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Calculate Grade & Risk</h3>
                    <div className="space-y-3 mb-4">
                        <input placeholder="Student ID (e.g. 8)" className="w-full p-2 border rounded" value={evalForm.studentId} onChange={(e) => setEvalForm({...evalForm, studentId: e.target.value})} />
                         <input placeholder="Course ID (e.g. 1)" className="w-full p-2 border rounded" value={evalForm.courseId} onChange={(e) => setEvalForm({...evalForm, courseId: e.target.value})} />
                        <button onClick={handleEvaluate} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Calculate</button>
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

        {/* MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{modalMode === 'insert' ? 'Create New Course' : `Edit Course #${currentCourse.CourseID}`}</h3>
                    <form onSubmit={handleSaveCourse} className="space-y-4">
                        <div><label className="block text-sm font-medium mb-1">Course Name</label><input className="w-full p-2 border rounded" value={currentCourse.courseName} onChange={(e) => setCurrentCourse({...currentCourse, courseName: e.target.value})} required /></div>
                        <div><label className="block text-sm font-medium mb-1">Description</label><textarea className="w-full p-2 border rounded" rows="2" value={currentCourse.Description} onChange={(e) => setCurrentCourse({...currentCourse, Description: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium mb-1">Difficulty</label><select className="w-full p-2 border rounded" value={currentCourse.Difficulty_Level} onChange={(e) => setCurrentCourse({...currentCourse, Difficulty_Level: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                            <div><label className="block text-sm font-medium mb-1">Price</label><input type="number" step="0.01" className="w-full p-2 border rounded" value={currentCourse.Price} onChange={(e) => setCurrentCourse({...currentCourse, Price: e.target.value})} required /></div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t mt-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">Cancel</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{modalMode === 'insert' ? 'Save' : 'Update'}</button>
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