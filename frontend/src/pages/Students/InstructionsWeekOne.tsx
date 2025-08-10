/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleDiscordCallback, getApiBaseUrl } from '../../services/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN_TA;

interface StudentData {
  name: string;
  mail: string;
  week: number;
  group_discussion_score: number;
  bonus_question_score: number;
  weekly_exercise_score: number;
  total_score: number;
  group_number: number;
  group_id: string;
  ta: string;
  assignment_submitted: boolean;
  attendance_status: string;
}

export default function InstructionsWeekOne() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('🏁 InstructionsWeekOne component loaded!');
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
  console.log('🔑 AUTH_TOKEN available:', !!AUTH_TOKEN);

  // Load saved data from localStorage and switch to pb_cohort when component mounts
  useEffect(() => {
    console.log('🔄 InstructionsWeekOne: Switching to pb_cohort...');
    switchToPbCohort();
    
    // Try to load saved data from localStorage
    const savedData = localStorage.getItem('week1_student_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Check if data is not too old (optional: 24 hours)
        const isDataFresh = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        
        if (isDataFresh && parsed.email && parsed.studentData) {
          setUserEmail(parsed.email);
          setUsername(parsed.username);
          setStudentData(parsed.studentData);
          console.log('✅ Loaded student data from localStorage');
        }
      } catch (error) {
        console.error('❌ Error parsing saved data:', error);
        localStorage.removeItem('week1_student_data');
      }
    }
  }, []);

  const switchToPbCohort = async () => {
    try {
      console.log('📡 Making API call to switch_cohort with pb_cohort.db');
      const response = await fetch(`${API_BASE_URL}/switch_cohort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${AUTH_TOKEN}`,
        },
        body: JSON.stringify({ db_path: 'pb_cohort.db' }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Successfully switched to pb_cohort:', result.message);
      } else {
        console.error('❌ Failed to switch to pb_cohort:', result.message);
      }
    } catch (error) {
      console.error('💥 Error switching to pb_cohort:', error);
    }
  };

  const fetchStudentData = useCallback(async (email: string) => {
    setLoading(true);
    try {
  
      const response = await fetch(`${getApiBaseUrl()}/individual_data_email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
        
        // Save data to localStorage for persistence
        localStorage.setItem('week1_student_data', JSON.stringify({
          email,
          username,
          studentData: data,
          timestamp: Date.now()
        }));
        
        console.log(data, "data res");
      } else {
        console.error('Failed to fetch student data');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Handle Discord callback and extract user info
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check if this is a Discord auth callback
    if (params.get('auth') === 'discord') {
      // Handle Discord callback manually to redirect to clean URL
      const token = params.get('token');
      const role = params.get('role');
      const email = params.get('email');
      const name = params.get('username');
      
      if (token && role === 'participant') {
        // Set user data and redirect to clean URL
        if (email) setUserEmail(email);
        if (name) setUsername(name);
        
        // Navigate to clean URL immediately
        navigate('/instructions/1', { 
          replace: true,
          state: { 
            token, 
            role, 
            email, 
            username: name 
          }
        });
        return;
      }
    }
    
    // Extract email and username from location state or URL params
    const email = location.state?.email || params.get('email');
    const name = location.state?.username || params.get('username');
    
    if (email) {
      setUserEmail(email);
      // Only fetch if we don't already have data from localStorage
      if (studentData.length === 0) {
        fetchStudentData(email);
      }
    }
    if (name) setUsername(name);
    
    // Clean up URL if it has OAuth parameters
    if (params.has('email') || params.has('username') || params.has('token') || params.has('role')) {
      navigate('/instructions/1', { 
        replace: true,
        state: { 
          email: email || userEmail, 
          username: name || username 
        }
      });
    }
  }, [location, navigate, studentData.length, fetchStudentData, userEmail, username]);
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Navigation Back */}
      <div className="mb-4">
        <a 
          href="/instructions" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
        >
          ← Back to General Instructions
        </a>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-semibold text-gray-800">Week 1 Instructions</h2>
        {userEmail && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-md mx-auto">
            <p className="text-sm text-green-800">
              Welcome, <span className="font-semibold">{username || 'Participant'}</span>!
            </p>
            <p className="text-xs text-green-600">Email: {userEmail}</p>
          </div>
        )}
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Welcome to Week 1 of the <a href="#" className="text-blue-600 hover:underline">Programming Bitcoin</a> Study Cohort. 
          Please follow the action items below to prepare for this week's discussion.
        </p>
      </div>

      {/* Week 1 Group Assignment */}
      {userEmail && studentData.length > 0 && (
        (() => {
          const week1Data = studentData.find(data => data.week === 1);
          return week1Data ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-blue-200">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-800">
                  👥 Your Week 1 Group Assignment
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium">Group</div>
                    <div className="text-lg font-semibold text-blue-800">{week1Data.group_id}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium">Teaching Assistant</div>
                    <div className="text-lg font-semibold text-blue-800">{week1Data.ta}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Remember:</strong> Join your assigned group discussion room on time and work with your TA during the session.
                  </p>
                </div>
              </div>
            </div>
          ) : null;
        })()
      )}


      {/* Your Action Items */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ✅ Your Action Items
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">1</span>
              <span>Introduce yourself on Discord if you haven't already.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">2</span>
              <span>Read Chapters 1 and 2: Finite Fields and Elliptic Curves. The course content is hosted on 
                <a href="https://github.com/jimmysong/programmingbitcoin" className="text-blue-600 hover:underline ml-1">GitHub</a>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">3</span>
              <span>Review the assigned group, chapter(s), and question(s) provided below. Prepare your answers for the group discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">4</span>
              <span>If assigned as a deputy🤠, familiarize yourself with the expectations outlined in the link. Your assistance will be valuable in guiding and facilitating the discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">5</span>
              <span>Join the assigned Group Discussion room on time.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">6</span>
              <span>Introduce yourself and answer the assigned questions with the help of the deputy🤠 during the group discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">7</span>
              <span>After the group discussion, return to the main hall to conclude the discussion with all participants of the cohort.</span>
            </li>
          </ol>
        </div>
      </div>

      {/* This Week's Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            📚 This Week's Chapters
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid gap-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Week 1: Chapters 1 and 2 – Finite Fields and Elliptic Curves</h4>
              <div className="text-sm space-y-1">
                <div>
                  <a href="https://raw.githubusercontent.com/jimmysong/programmingbitcoin/master/ch01.asciidoc" className="text-blue-600 hover:underline">📖 Chapter 1: Finite Fields</a>
                </div>
                <div>
                  <a href="https://raw.githubusercontent.com/jimmysong/programmingbitcoin/master/ch02.asciidoc" className="text-blue-600 hover:underline">📖 Chapter 2: Elliptic Curves</a>
                </div>
                <div>
                  <a href="https://github.com/jimmysong/programmingbitcoin/tree/master/code-ch01" className="text-blue-600 hover:underline">💻 Chapter 1 Code</a>
                </div>
                <div>
                  <a href="https://github.com/jimmysong/programmingbitcoin/tree/master/code-ch02" className="text-blue-600 hover:underline">💻 Chapter 2 Code</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* This Week's Questions */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ❓ This Week's Questions
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Round 1:</h4>
            <ul className="space-y-2 text-sm">
              <li>What is a modulo operation? What are the mathematical properties of finite fields? Why are these properties important to have?</li>
              <li>Can you explain in simple terms what does order of a finite field means? Why finite fields are constructed with a prime modulo? What happens if its not a prime?</li>
              <li>Explain Fermat's little theorem. What is it used for?</li>
              <li>How to express negative numbers in finite field? What would be the positive number equivalent of -27mod(5)?</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Round 2:</h4>
            <ul className="space-y-2 text-sm">
              <li>What is an elliptic curve? What was the earliest known elliptic curve? Why elliptic curves are useful in cryptography?</li>
              <li>Explain elliptic curve point addition in simple terms.</li>
              <li>For elliptic curve point addition the last step is to reflect the resulting point across x-axis. Why is this needed? What happens if there was no reflection?</li>
              <li>What is the Point of Infinity? What curve operation produces the point of Infinity? Is it useful in real life crypto implementation?</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exercise */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            💻 Exercise
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Week 1 assignment</h4>
            <p className="text-sm mb-2">
              Assignment link: <a href="https://classroom.github.com/a/XKBJqZMI" className="text-blue-600 hover:underline">https://classroom.github.com/a/XKBJqZMI</a>
            </p>
            <p className="text-sm mb-2">
              To get started with all the exercises, check for the respective chapters in the PB book. Head to the Programming Bitcoin book and look for the respective Chapter's code.
            </p>
            <div className="text-sm space-y-1">
              <p className="font-medium">Setup Instructions:</p>
              <ol className="ml-4 space-y-1 text-xs">
                <li>Install Python 3.5+</li>
                <li>Clone: <code className="bg-gray-200 px-1 rounded">git clone https://github.com/jimmysong/programmingbitcoin</code></li>
                <li>Install requirements: <code className="bg-gray-200 px-1 rounded">pip install -r requirements.txt</code></li>
                <li>Run Jupyter Notebook</li>
              </ol>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">
              For any help related to the exercise feel free to ask questions in the <strong>#dev-help</strong> forum of discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}