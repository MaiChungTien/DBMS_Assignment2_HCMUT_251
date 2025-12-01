import React, { useState } from 'react';

// --- MOCK DATA (Simulates your SQL Database) ---
const MOCK_DATA = {
  profiles: [
    { ID: 8, Name: 'Student John', Email: 'john@stu.com', Background: 'High School' },
    { ID: 9, Name: 'Student Jane', Email: 'jane@stu.com', Background: 'Undergraduate' },
    { ID: 10, Name: 'Student Mike', Email: 'mike@stu.com', Background: 'Masters' },
  ],
  instructors: [
    { Instructor_Name: 'Inst. Smith', Course_Taught: 'Intro to SQL', Creation_Date: '2023-01-01' },
    { Instructor_Name: 'Inst. Jones', Course_Taught: 'Advanced Python', Creation_Date: '2023-02-01' },
  ],
  enrollments: [
    { Student_Name: 'Student John', Enrolled_Course: 'Intro to SQL', Enrollment_Date: '2023-01-15T08:00:00' },
    { Student_Name: 'Student Jane', Enrolled_Course: 'Intro to SQL', Enrollment_Date: '2023-01-16T09:30:00' },
  ],
  hierarchy: [
    { courseName: 'Intro to SQL', LessonTitle: 'SQL Basics', Resource_Type: 'video', FileName: 'intro.mp4' },
    { courseName: 'Intro to SQL', LessonTitle: 'Joins', Resource_Type: 'link', FileName: 'wiki_link' },
  ]
};

function App() {
  const [activeTab, setActiveTab] = useState('task1');
  const [viewData, setViewData] = useState([]);
  const [viewTitle, setViewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Notification State
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form States
  const [courseForm, setCourseForm] = useState({ id: '', name: '', desc: '', diff: 'Beginner', price: 0 });
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
  const [evalForm, setEvalForm] = useState({ studentId: '', courseId: '' });
  const [evalResult, setEvalResult] = useState(null);

  // --- MOCK HANDLERS (Simulate API Calls) ---

  const simulateNetworkRequest = (callback) => {
    setIsLoading(true);
    setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 600); // Simulate 600ms network delay
  };

  // Task 1: View Data
  const fetchMockView = (key, title) => {
    simulateNetworkRequest(() => {
      setViewData(MOCK_DATA[key]);
      setViewTitle(title);
      setError(null);
      setMessage(null);
    });
  };

  // Task 2: Insert/Update/Delete
  const handleInsertCourse = () => { 
    simulateNetworkRequest(() => {
      if (!courseForm.name) {
        setError("Error: Course Name cannot be empty (SQL Validation)");
        setMessage(null);
      } else {
        setMessage(`Success: Course '${courseForm.name}' Inserted (Test 1 Passed)`);
        setError(null);
      }
    });
  };

  const handleUpdateCourse = () => {
    simulateNetworkRequest(() => {
        setMessage(`Success: Course ID ${courseForm.id} Updated (Test 2 Passed)`);
        setError(null);
    });
  };

  const handleDeleteCourse = () => {
    simulateNetworkRequest(() => {
      // Simulate Logic: If ID is 1, fail (because students enroll). If ID is 99, success.
      if (courseForm.id === '1') {
        setError("Error: Cannot delete course because students are currently enrolled (Constraint Check)");
        setMessage(null);
      } else {
        setMessage("Success: Course Deleted (Test 4 Passed)");
        setError(null);
      }
    });
  };

  // Task 2: Trigger Simulation
  const handleEnroll = () => { 
    simulateNetworkRequest(() => {
      // Simulate Business Rule: ID 3 is an instructor for Course 1
      if (enrollForm.studentId === '3' && enrollForm.courseId === '1') {
        setError("Trigger Blocked Action: Instructor cannot enroll as a student in their own course.");
        setMessage(null);
      } else {
        setMessage("Success: Student Enrolled (Test 3 Passed)");
        setError(null);
      }
    });
  };

  // Task 2: Function Simulation
  const handleEvaluate = () => { 
    simulateNetworkRequest(() => {
      // Hardcoded simulation for Student 8 (Safe) vs Student 9 (Risk)
      if (evalForm.studentId === '8') {
        setEvalResult({ FinalGrade: 85.5, RiskLevel: 'Safe' });
      } else if (evalForm.studentId === '9') {
        setEvalResult({ FinalGrade: 45.0, RiskLevel: 'High Risk' });
      } else {
        setEvalResult({ FinalGrade: 0, RiskLevel: 'No Data' });
      }
      setError(null);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 shadow-md">
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignment 2: Database System</h1>
                <p className="mt-2 text-blue-200">Student: Mai Chung Tien | ID: 2353177</p>
            </div>
            <div className="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-bold text-sm">
                UI TEST MODE (No DB)
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => setActiveTab('task1')}
            className={`flex-1 py-4 text-center font-semibold transition-colors duration-200 ${activeTab === 'task1' ? 'border-b-4 border-blue-600 bg-white text-blue-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
          >
            Task 1: View Data (Tests 1-4)
          </button>
          <button 
            onClick={() => setActiveTab('task2')}
            className={`flex-1 py-4 text-center font-semibold transition-colors duration-200 ${activeTab === 'task2' ? 'border-b-4 border-blue-600 bg-white text-blue-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
          >
            Task 2: Procedures & Functions (Tests 1-8)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[500px]">
          
          {/* Notifications */}
          {isLoading && <div className="mb-4 text-blue-600 font-semibold animate-pulse">Processing Request...</div>}
          
          {message && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded border border-green-400 flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-400 font-bold flex items-center shadow-sm">
                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
            </div>
          )}

          {/* TASK 1 UI */}
          {activeTab === 'task1' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button onClick={() => fetchMockView('profiles', 'Full Student Profiles')} className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition active:scale-95">Test 1: Profiles</button>
                <button onClick={() => fetchMockView('instructors', 'Instructors & Courses')} className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition active:scale-95">Test 2: Instructors</button>
                <button onClick={() => fetchMockView('enrollments', 'Student Enrollments')} className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition active:scale-95">Test 3: Enrollments</button>
                <button onClick={() => fetchMockView('hierarchy', 'Course Content Hierarchy')} className="bg-blue-600 text-white p-3 rounded shadow hover:bg-blue-700 transition active:scale-95">Test 4: Hierarchy</button>
              </div>

              {viewTitle && (
                <div>
                  <h3 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3 text-gray-800">{viewTitle}</h3>
                  <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <tr>
                          {viewData.length > 0 && Object.keys(viewData[0]).map(key => (
                            <th key={key} className="p-3 border-b border-gray-300 font-bold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 text-sm">
                        {viewData.map((row, i) => (
                          <tr key={i} className="hover:bg-blue-50 border-b transition-colors">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="p-3">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASK 2 UI */}
          {activeTab === 'task2' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              
              {/* Left Column: Management */}
              <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Course Management (Tests 1, 2, 4)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course ID</label>
                    <input placeholder="1 (Try 1 to fail delete)" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none transition" value={courseForm.id} onChange={e => setCourseForm({...courseForm, id: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Name</label>
                    <input placeholder="Python for Beginners" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none transition" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Difficulty</label>
                        <select className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none transition" value={courseForm.diff} onChange={e => setCourseForm({...courseForm, diff: e.target.value})}>
                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                        <input type="number" placeholder="19.99" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none transition" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} />
                     </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button onClick={handleInsertCourse} className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700 shadow transition transform active:scale-95">Insert (Test 1)</button>
                    <button onClick={handleUpdateCourse} className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 shadow transition transform active:scale-95">Update (Test 2)</button>
                    <button onClick={handleDeleteCourse} className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700 shadow transition transform active:scale-95">Delete (Test 4)</button>
                  </div>
                </div>
              </div>

              {/* Right Column: Enrollment & Functions */}
              <div className="space-y-6">
                
                {/* Enrollment / Trigger Test */}
                <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Enrollment & Trigger (Test 3)</h3>
                  <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-bold">Test Scenario:</span> Try enrolling <b>Instructor ID 3</b> into <b>Course ID 1</b> to see the Trigger error UI.
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID</label>
                         <input placeholder="3" className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-400 outline-none" value={enrollForm.studentId} onChange={e => setEnrollForm({...enrollForm, studentId: e.target.value})} />
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course ID</label>
                         <input placeholder="1" className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-400 outline-none" value={enrollForm.courseId} onChange={e => setEnrollForm({...enrollForm, courseId: e.target.value})} />
                    </div>
                    <button onClick={handleEnroll} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 shadow transition transform active:scale-95 h-[42px]">Enroll</button>
                  </div>
                </div>

                {/* Grade Evaluation */}
                <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Grade & Risk (Tests 7 & 8)</h3>
                  <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-bold">Test Scenario:</span> 
                    <br/>- ID <b>8</b>: Safe (Score > 50)
                    <br/>- ID <b>9</b>: High Risk (Score &lt; 50)
                  </p>
                  <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student ID</label>
                        <input placeholder="8 or 9" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 outline-none" value={evalForm.studentId} onChange={e => setEvalForm({...evalForm, studentId: e.target.value})} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course ID</label>
                        <input placeholder="1" className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 outline-none" value={evalForm.courseId} onChange={e => setEvalForm({...evalForm, courseId: e.target.value})} />
                    </div>
                    <button onClick={handleEvaluate} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 shadow transition transform active:scale-95 h-[42px]">Calc</button>
                  </div>
                  
                  {evalResult && (
                    <div className="bg-gray-50 p-4 border rounded shadow-inner flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Final Grade (Test 7)</p>
                        <p className="text-xl font-bold text-gray-800">{evalResult.FinalGrade}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm text-gray-600">Risk Level (Test 8)</p>
                         <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${evalResult.RiskLevel === 'Safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {evalResult.RiskLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;