import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Download, Calendar } from 'lucide-react';


import { StudentBackground } from '../components/student/StudentBackground';
import { StudentSummary } from '../components/student/StudentSummary';
import { WeeklyProgressChart } from '../components/student/WeeklyProgressChart';
import { WeeklyBreakdownCard } from '../components/student/WeeklyBreakdownCard';

import { fetchStudentData, fetchStudentBackgroundData } from '../services/studentService';
import { getStudentNameFromUrl, exportStudentData } from '../utils/studentUtils';
import { calculateStudentStats } from '../utils/calculations';
import type { StudentData, StudentBackground as StudentBgType } from '../types/student';

const StudentDetailPage = () => {
  const navigate = useNavigate();
  const { studentName: paramStudentName } = useParams();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [studentBackground, setStudentBackground] = useState<StudentBgType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get student name from URL params or search params

  const getStudentName = useCallback((): string | null => {
    if (paramStudentName) return decodeURIComponent(paramStudentName);

    const fromParams = searchParams.get('student');
    if (fromParams) return fromParams;

    return getStudentNameFromUrl();
  }, [paramStudentName, searchParams]);

  // Load student data
  const loadStudentData = async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const studentData = await fetchStudentData(name);
      setStudent(studentData);

      // Fetch background data if student has email
      if (studentData?.email) {
        try {
          const backgroundData = await fetchStudentBackgroundData(studentData.email);
          setStudentBackground(backgroundData);
        } catch (bgErr) {
          console.warn('Failed to fetch background data:', bgErr);
          // Don't set error for background data failure
        }
      }
    } catch (err) {
      console.error('Error loading student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const name = getStudentName();
    if (name) {
      loadStudentData(name);
    } else {
      setError('No student name provided');
      setLoading(false);
    }
  }, [paramStudentName,getStudentName]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleExport = () => {
    exportStudentData(student);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="text-xl">Loading student data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-red-400">Error Loading Student Data</h2>
          <p className="text-zinc-400">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={handleGoBack}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => {
                const name = getStudentName();
                if (name) loadStudentData(name);
              }}
              className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No student data
  if (!student) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">No Student Data</h2>
          <p className="text-zinc-400">Student data could not be loaded.</p>
          <button 
            onClick={handleGoBack}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStudentStats(student.weeklyData);
  const validWeeks = student.weeklyData.filter(week => week.week > 0);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation and Actions */}
            <div className="flex items-center justify-between">
              <button 
                onClick={handleGoBack}
                className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Students</span>
              </button>
              
              <button 
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>
            
            {/* Student Info */}
            <div className="mt-6 flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-medium">
                {student.name.charAt(0)}{(student.name.split(' ')[1]?.charAt(0) || '').toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-100">{student.name}</h1>
                <div className="flex items-center space-x-6 text-zinc-400 mt-2">
                  <span>{student.email}</span>
                  <span>Group: {student.group}</span>
                  <span>TA: {student.ta}</span>
                </div>
              </div>
            </div>

            {/* Student Background */}
            {studentBackground && (
              <StudentBackground background={studentBackground} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <StudentSummary stats={stats} />
        
        {/* Progress Chart */}
        <WeeklyProgressChart weeklyData={validWeeks} />
        
        {/* Weekly Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Detailed Weekly Breakdown
          </h2>
          <div className="space-y-6">
            {validWeeks.map((week) => (
              <WeeklyBreakdownCard 
                key={week.week} 
                week={week} 
                studentName={student.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;