import  { useState, useEffect } from 'react';
import { ArrowLeft, Mail, User, Calendar, ExternalLink, Download, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

// Type definitions for better type safety
interface WeeklyData {
  week: number;
  attendance: boolean;
  gdScore: { fa: number; fb: number; fc: number; fd: number };
  bonusScore: { attempt: number; good: number; followUp: number };
  exerciseScore: { Submitted: boolean; privateTest: boolean; goodStructure: boolean; goodDoc: boolean };
  total: number;
  group: string;
  ta: string;
}

interface StudentData {
  id?: number;
  name: string;
  email: string;
  group: string;
  ta: string;
  weeklyData: WeeklyData[];
}

const StudentDetailPage = ({ studentName }: { studentName?: string }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  interface StudentBackground {
    describe_yourself?: string;
    background?: string;
    skills?: string;
    location?: string;
    why?: string;
    year?: string;
    book?: string;
  }
  
  const [studentBackground, setStudentBackground] = useState<StudentBackground>({});
  const [error, setError] = useState<string | null>(null);

  // Get student name from URL params if not provided as prop
  const getStudentName = () => {
    if (studentName) return studentName;
    
    // Extract from URL path or search params
    const urlParams = new URLSearchParams(window.location.search);
    const fromParams = urlParams.get('student');
    if (fromParams) return fromParams;
    
    // Extract from path (assuming format like /students/Alice%20Johnson)
    const pathParts = window.location.pathname.split('/');
    const nameFromPath = pathParts[pathParts.length - 1];
    return nameFromPath ? decodeURIComponent(nameFromPath) : null;
  };

  // Transform raw data to expected format
  interface RawStudentRecord {
    week: number;
    name: string;
    mail: string;
    group_id: string;
    ta: string;
    attendance: string;
    fa: number;
    fb: number;
    fc: number;
    fd: number;
    bonus_attempt: number;
    bonus_answer_quality: number;
    bonus_follow_up: number;
    exercise_submitted: string;
    exercise_test_passing: string;
    exercise_good_structure: string;
    exercise_good_documentation: string;
    total: number;
  }

  const transformStudentData = (rawData: RawStudentRecord[]): StudentData | null => {
    if (!rawData || rawData.length === 0) return null;

    // Get student info from the most recent record (excluding week 0 if possible)
    const latestRecord = rawData.find(record => record.week > 0) || rawData[0];
    
    const transformedData: StudentData = {
      name: latestRecord.name.replace('_', ' '), // Convert underscore to space
      email: latestRecord.mail,
      group: latestRecord.group_id,
      ta: latestRecord.ta,
      weeklyData: rawData.map(record => ({
        week: record.week,
        attendance: record.attendance === 'yes',
        gdScore: {
          fa: record.fa,
          fb: record.fb,
          fc: record.fc,
          fd: record.fd
        },
        bonusScore: {
          attempt: record.bonus_attempt,
          good: record.bonus_answer_quality,
          followUp: record.bonus_follow_up
        },
        exerciseScore: {
          Submitted: record.exercise_submitted === 'yes',
          privateTest: record.exercise_test_passing === 'yes',
          goodStructure: record.exercise_good_structure === 'yes',
          goodDoc: record.exercise_good_documentation === 'yes'
        },
        total: record.total,
        group: record.group_id,
        ta: record.ta
      }))
    };

    return transformedData;
  };

  // Fetch student data from backend
  const fetchStudentData = async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encode the student name for URL
      const encodedName = encodeURIComponent(name);
      console.log('Fetching data for student:', encodedName);

      const response = await fetch(`https://admin.bitshala.org/students/${encodedName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Student not found');
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log('Fetched raw student data:', rawData);
      
      const transformedData = transformStudentData(rawData);
      console.log('Transformed student data:', transformedData);
      
      setStudent(transformedData);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const name = getStudentName();
    if (name) {
      fetchStudentData(name);
    } else {
      setError('No student name provided');
      setLoading(false);
    }
  }, [studentName]);

  const getStudentBackgroundData = async (email: string) => {
    try {
      const response = await fetch(`https://admin.bitshala.org/data/${email}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch background data: ${response.status}`);
      }
      
      const data = await response.json();
      setStudentBackground(data);

      return data;
    } catch (err) {
      console.error('Error fetching background data:', err);
      return null;
    }
  }

useEffect(() => {
  if (student && student.email) {
    getStudentBackgroundData(student.email)
      .then(data => {
        if (data) {
          console.log('Background data:', data);
          // You can do something with the background data here if needed
        }
      })
      .catch(err => {
        console.error('Error fetching background data:', err);
      });
           
  }
}, [student]);
 
  // Calculation functions
  const computeGdTotal = (gd: { fa: number; fb: number; fc: number; fd: number }) => 
    (30 / 5) * gd.fa + (30 / 5) * gd.fb + (20 / 5) * gd.fc + (20 / 5) * gd.fd;
  
  const computeBonusTotal = (b: { attempt: number; good: number; followUp: number }) => 
    10 * b.attempt + 10 * b.good + 10 * b.followUp;
  
  const computeExerciseTotal = (e: { Submitted: boolean; privateTest: boolean; goodStructure: boolean; goodDoc: boolean }) => 
    (e.Submitted ? 10 : 0) + (e.privateTest ? 50 : 0) + (e.goodDoc ? 20 : 0) + (e.goodStructure ? 20 : 0);

  const getStudentStats = () => {
    if (!student) return { totalWeeks: 0, attendedWeeks: 0, totalScore: 0, avgScore: 0, attendanceRate: 0, overallPercentage: 0, maxPossibleScore: 0 };
    
    // Filter out week 0 for calculations
    const validWeeks = student.weeklyData.filter(w => w.week > 0);
    const totalWeeks = validWeeks.length;
    const attendedWeeks = validWeeks.filter(w => w.attendance).length;
    const totalScore = validWeeks.reduce((sum, w) => sum + w.total, 0);
    const avgScore = totalWeeks > 0 ? totalScore / totalWeeks : 0;
    const maxPossibleScore = totalWeeks * 200;
    const overallPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return {
      totalWeeks,
      attendedWeeks,
      totalScore,
      avgScore,
      attendanceRate: totalWeeks > 0 ? (attendedWeeks / totalWeeks) * 100 : 0,
      overallPercentage,
      maxPossibleScore
    };
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const fetchStudentRepoLink = async (week: number, studentName: string) => {
    try {
      const response = await fetch(`/students/${week}/${encodeURIComponent(studentName)}`);
      
      if (!response.ok) {
        console.error(`Server Error ${response.status}`);
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error("fetchStudentRepoLink error:", err);
    }
  };

  const exportStudentData = () => {
    if (!student) return;
    
    const dataStr = JSON.stringify(student, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.name.replace(/\s+/g, '_')}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
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
          <button 
            onClick={() => window.history.back()}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md transition-colors"
          >
            Go Back
          </button>
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
        </div>
      </div>
    );
  }

  const stats = getStudentStats();

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => window.history.back()}
                  className="b-0 bg-zinc-800 flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Students</span>
                </button>
              </div>
              <button 
                onClick={exportStudentData}
                className="b-0 flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>
            
            <div className="mt-6 flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-medium">
                {student.name.charAt(0)}{(student.name.split(' ')[1]?.charAt(0) || '').toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-100">{student.name}</h1>
                <div className="flex items-center space-x-6 text-zinc-400 mt-2">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Group: {student.group}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>TA: {student.ta}</span>
                  </div>
                </div>
              </div>
            </div>
              {studentBackground && (
  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">About Me</h3>
        <p className="text-sm text-zinc-300">{studentBackground.describe_yourself }</p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Background</h3>
        <p className="text-sm text-zinc-300">{studentBackground.background}</p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Location</h3>
        <p className="text-sm text-zinc-300">{studentBackground.location}</p>
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Technical Skills</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          {studentBackground.skills && studentBackground.skills.split(',').map((skill, index) => (
            <span key={index} className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-zinc-700 text-zinc-300">
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Motivation</h3>
        <p className="text-sm text-zinc-300">{studentBackground.why}</p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Year</h3>
        <p className="text-sm text-zinc-300">{studentBackground.year}</p>
      </div>
      {studentBackground.book && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Book</h3>
          <p className="text-sm text-zinc-300">{studentBackground.book}</p>
        </div>
      )}
    </div>
  </div>
)}

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 text-center">
            <div className="text-3xl font-bold text-zinc-100">{stats.totalScore}</div>
            <div className="text-sm text-zinc-400 mt-1">Total Score</div>
            <div className="text-xs text-zinc-500">of {stats.maxPossibleScore}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 text-center">
            <div className="text-3xl font-bold text-zinc-100">{stats.avgScore.toFixed(0)}</div>
            <div className="text-sm text-zinc-400 mt-1">Average Score</div>
            <div className="text-xs text-zinc-500">per week</div>
          </div>
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 text-center">
            <div className={`text-3xl font-bold ${stats.attendanceRate >= 80 ? 'text-green-400' : stats.attendanceRate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.attendanceRate.toFixed(0)}%
            </div>
            <div className="text-sm text-zinc-400 mt-1">Attendance</div>
            <div className="text-xs text-zinc-500">{stats.attendedWeeks}/{stats.totalWeeks} weeks</div>
          </div>
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 text-center">
            <div className={`text-3xl font-bold ${getScoreColor(stats.overallPercentage, 100)}`}>
              {stats.overallPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-zinc-400 mt-1">Overall</div>
            <div className="text-xs text-zinc-500">performance</div>
          </div>
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 text-center">
            <div className="text-3xl font-bold text-zinc-100">{stats.totalWeeks}</div>
            <div className="text-sm text-zinc-400 mt-1">Weeks</div>
            <div className="text-xs text-zinc-500">completed</div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Weekly Progress
          </h2>
          <div className="space-y-3">
            {student.weeklyData.filter(week => week.week > 0).map((week) => (
              <div key={week.week} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-zinc-300">Week {week.week}</div>
                <div className="flex-1 bg-zinc-700 rounded-full h-6 relative">
                  <div 
                    className={`h-6 rounded-full ${getProgressColor((week.total / 200) * 100)} transition-all duration-300`}
                    style={{ width: `${(week.total / 200) * 100}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {week.total}/200
                    </span>
                  </div>
                </div>
                <div className={`w-20 text-sm font-medium text-right ${week.attendance ? 'text-green-400' : 'text-red-400'}`}>
                  {week.attendance ? 'Present' : 'Absent'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Detailed Weekly Breakdown
          </h2>
          <div className="space-y-6">
            {student.weeklyData.filter(week => week.week > 0).map((week) => (
              <div key={week.week} className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-zinc-200">{week.week}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-100">Week {week.week}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          week.attendance ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                        }`}>
                          {week.attendance ? 'Present' : 'Absent'}
                        </span>
                        <span className="text-sm text-zinc-400">Group: {week.group}</span>
                        <span className="text-sm text-zinc-400">TA: {week.ta}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">Total Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(week.total, 200)}`}>
                      {week.total}<span className="text-lg text-zinc-500">/200</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* GD Scores */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">GD Scores</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Communication (FA)</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.gdScore.fa / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.gdScore.fa}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Depth of Answer (FB)</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.gdScore.fb / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.gdScore.fb}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Technical Fluency (FC)</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.gdScore.fc / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.gdScore.fc}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Engagement (FD)</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.gdScore.fd / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.gdScore.fd}/5</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-zinc-300">GD Total</span>
                          <span className="text-lg font-bold text-zinc-100">
                            {computeGdTotal(week.gdScore).toFixed(0)}<span className="text-sm text-zinc-500">/100</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Scores */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Bonus Scores</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Attempt</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.bonusScore.attempt / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.bonusScore.attempt}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Quality</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.bonusScore.good / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.bonusScore.good}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Follow Up</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(week.bonusScore.followUp / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-zinc-200">{week.bonusScore.followUp}/5</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-zinc-300">Bonus Total</span>
                          <span className="text-lg font-bold text-zinc-100">
                            {computeBonusTotal(week.bonusScore)}<span className="text-sm text-zinc-500">/30</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Scores */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Exercise Scores</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Submitted</span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            week.exerciseScore.Submitted ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {week.exerciseScore.Submitted ? '✓ 10 pts' : '✗ 0 pts'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Tests Pass</span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            week.exerciseScore.privateTest ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {week.exerciseScore.privateTest ? '✓ 50 pts' : '✗ 0 pts'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Good Structure</span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            week.exerciseScore.goodStructure ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {week.exerciseScore.goodStructure ? '✓ 20 pts' : '✗ 0 pts'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Good Documentation</span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            week.exerciseScore.goodDoc ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {week.exerciseScore.goodDoc ? '✓ 20 pts' : '✗ 0 pts'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-zinc-300">Exercise Total</span>
                          <span className="text-lg font-bold text-zinc-100">
                            {computeExerciseTotal(week.exerciseScore)}<span className="text-sm text-zinc-500">/100</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {week.exerciseScore.Submitted && (
                  <div className="mt-6 pt-6 border-t border-zinc-700">
                    <button 
                      onClick={() => fetchStudentRepoLink(week.week, student.name)}
                      className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View GitHub Submission for Week {week.week}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;
