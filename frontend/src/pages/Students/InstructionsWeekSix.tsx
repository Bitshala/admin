import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../../services/auth';

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

export default function InstructionsWeekSix() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [, setLoading] = useState(false);

  // Load saved data from localStorage when component mounts
  useEffect(() => {
    // Try to load saved data from localStorage
    const savedData = localStorage.getItem('week6_student_data');
    const storedEmail = localStorage.getItem('user_email');
    const storedUsername = localStorage.getItem('user_username');

    // Use stored credentials if available
    if (storedEmail) setUserEmail(storedEmail);
    if (storedUsername) setUsername(storedUsername);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const isDataFresh = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        
        if (isDataFresh && parsed.email && parsed.studentData) {
          setUserEmail(parsed.email);
          setUsername(parsed.username);
          setStudentData(parsed.studentData);
          console.log('✅ Loaded student data from localStorage');
        }
      } catch (error) {
        console.error('❌ Error parsing saved data:', error);
        localStorage.removeItem('week6_student_data');
      }
    }
  }, []);

  const fetchStudentData = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/individual_data_email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
        
        localStorage.setItem('week6_student_data', JSON.stringify({
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
    
    if (params.get('auth') === 'discord') {
      const token = params.get('token');
      const role = params.get('role');
      const email = params.get('email');
      const name = params.get('username');
      
      if (token && role === 'participant') {
        if (email) setUserEmail(email);
        if (name) setUsername(name);
        
        navigate('/instructions/6', { 
          replace: true,
          state: { token, role, email, username: name }
        });
        return;
      }
    }
    
    const email = location.state?.email || params.get('email');
    const name = location.state?.username || params.get('username');
    
    if (email) {
      setUserEmail(email);
      if (studentData.length === 0) {
        fetchStudentData(email);
      }
    }
    if (name) setUsername(name);
    
    if (params.has('email') || params.has('username') || params.has('token') || params.has('role')) {
      navigate('/instructions/6', { 
        replace: true,
        state: { email: email || userEmail, username: name || username }
      });
    }
  }, [location, navigate, studentData.length, fetchStudentData, userEmail, username]);

  const week6Data = studentData.find(data => data.week === 6);

  return (
    <div className="min-h-screen bg-zinc-800 font-mono">
      {/* Terminal Window */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-zinc-900 border border-orange-300 shadow-2xl rounded-lg overflow-hidden">
          {/* Terminal Window Header */}
          <div className="bg-zinc-700 px-4 py-3 flex items-center space-x-2 border-b border-orange-300">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1 text-center">
              <span className="text-gray-300 text-sm">Terminal — week_6_instructions.sh</span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 bg-zinc-900">
            {/* Terminal command header */}
            <div className="mb-6 pb-3 border-b border-orange-300">
              <div className="text-orange-300">
                <span className="text-orange-400">user@bitshala:~$</span> week_6_instructions.sh --week=6
              </div>
              <div className="text-orange-200 text-sm mt-1">
                Loading Week 6 Programming Bitcoin study instructions
              </div>
            </div>

            {/* Navigation Back */}
            <div className="mb-6">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 bg-zinc-700 text-orange-300 hover:bg-zinc-600 border border-orange-300 hover:border-orange-400 p-2 transition-colors"
              >
                <span>←</span>
                <span>Back to General Instructions</span>
              </button>
            </div>

            {/* Header */}
            <div className="mb-8 pb-4 border-b border-orange-400">
              <h1 className="text-3xl font-bold text-orange-300 mb-4">
                <span className="text-orange-400">[06]</span> Week 6 Instructions
              </h1>
              
              {userEmail && (
                <div className="bg-zinc-800 border border-orange-400 p-4 mb-4">
                  <div className="text-orange-300">
                    <span className="text-orange-400">AUTHENTICATED_USER:</span> {username || 'Participant'}
                  </div>
                  <div className="text-orange-200 text-sm">
                    <span className="text-orange-400">EMAIL:</span> {userEmail}
                  </div>
                </div>
              )}

              <div className="text-orange-200">
                Welcome to Week 6 of the <span className="text-orange-300 font-semibold">Programming Bitcoin</span> Study Cohort.
                This week we explore <span className="text-orange-300 font-semibold">Networking and Simplified Payment Verification (SPV)</span>.
              </div>
            </div>

            {/* Status Display */}
            {week6Data && (
              <div className="mb-8 bg-zinc-800 border border-orange-400 overflow-hidden">
                <div className="bg-zinc-700 px-4 py-3 border-b border-orange-400">
                  <h2 className="text-xl font-semibold text-orange-300">
                    <span className="text-orange-400">[STATUS]</span> Your Week 6 Progress
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-700 border border-orange-400 p-4">
                      <div className="text-orange-300 font-semibold mb-2">Attendance</div>
                      <div className={`text-sm ${
                        week6Data.attendance_status === 'present' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {week6Data.attendance_status === 'present' ? '✓ Present' : '✗ Absent'}
                      </div>
                    </div>
                    <div className="bg-zinc-700 border border-orange-400 p-4">
                      <div className="text-orange-300 font-semibold mb-2">Group Discussion</div>
                      <div className="text-orange-200 text-sm">
                        Score: {week6Data.group_discussion_score || 0}/100
                      </div>
                    </div>
                    <div className="bg-zinc-700 border border-orange-400 p-4">
                      <div className="text-orange-300 font-semibold mb-2">Exercise</div>
                      <div className="text-orange-200 text-sm">
                        Score: {week6Data.weekly_exercise_score || 0}/100
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            <div className="mb-8 bg-zinc-800 border border-orange-400 overflow-hidden">
              <div className="bg-zinc-700 px-4 py-3 border-b border-orange-400">
                <h2 className="text-xl font-semibold text-orange-300">
                  <span className="text-orange-400">[OBJECTIVES]</span> This Week's Learning Goals
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    'Understand Bitcoin network message structure and handshake process',
                    'Analyze different network message payloads and their purposes',
                    'Compare timestamp formats used in version messages vs block headers',
                    'Identify major network messages and their relative sizes',
                    'Define Simplified Payment Verification (SPV) and its applications',
                    'Understand Merkle tree fundamentals and derivation process',
                    'Analyze provability benefits and Bitcoin protocol integration',
                    'Explain block data integration with Merkle trees'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="text-orange-400 font-mono">
                        [{(index + 1).toString().padStart(2, '0')}]
                      </div>
                      <div className="text-orange-200">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Week Content */}
            <div className="mb-8 bg-zinc-800 border border-orange-400 overflow-hidden">
              <div className="bg-zinc-700 px-4 py-3 border-b border-orange-400">
                <h2 className="text-xl font-semibold text-orange-300">
                  <span className="text-orange-400">[CONTENT]</span> This Week's Chapters
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-2">Chapter 10: Networking</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-orange-400">📖 Read:</span>{' '}
                        <a href="https://github.com/jimmysong/programmingbitcoin/blob/master/ch10.asciidoc" 
                           className="text-blue-400 hover:text-blue-300 underline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                          Chapter 10 - Networking
                        </a>
                      </div>
                      <div className="text-orange-200">
                        Focus on: Network message structure, handshake process, payload formats, and timestamp analysis
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-2">Chapter 11: Simplified Payment Verification (SPV)</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-orange-400">📖 Read:</span>{' '}
                        <a href="https://github.com/jimmysong/programmingbitcoin/blob/master/ch11.asciidoc" 
                           className="text-blue-400 hover:text-blue-300 underline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                          Chapter 11 - Simplified Payment Verification
                        </a>
                      </div>
                      <div className="text-orange-200">
                        Focus on: SPV definition and utility, Merkle trees, provability benefits, and block data integration
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Topics */}
            <div className="mb-8 bg-zinc-800 border border-orange-400 overflow-hidden">
              <div className="bg-zinc-700 px-4 py-3 border-b border-orange-400">
                <h2 className="text-xl font-semibold text-orange-300">
                  <span className="text-orange-400">[TOPICS]</span> Key Study Areas
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">1. Transaction Message Structure</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Understand the structure of a tx message and its components</p>
                      <p>• Analyze the significance of each field in transaction messages</p>
                      <p>• Study how transactions are serialized for network transmission</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">2. Network Handshake Process</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Learn the network handshake procedure between Bitcoin nodes</p>
                      <p>• Identify information propagated in handshake messages</p>
                      <p>• Understand why this information is essential for establishing connections</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">3. Network Message Payloads</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Analyze different payload structures (reference: <a href="https://classroom.github.com/a/UoMbTvKv" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">assignment repository</a>)</p>
                      <p>• Specifically study the payload structure of getheaders messages</p>
                      <p>• Compare various message types and their data formats</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">4. Timestamp Analysis</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Compare timestamp formats used in different contexts</p>
                      <p>• Understand why version messages use 8-byte timestamps</p>
                      <p>• Analyze why block headers use 4-byte timestamps</p>
                      <p>• Study the implications of these design choices</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">5. Network Communication</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Identify major network messages exchanged between nodes</p>
                      <p>• Determine the largest and smallest network messages</p>
                      <p>• Understand the purpose and frequency of different message types</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">6. Simplified Payment Verification (SPV)</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Define SPV and explain its utility in Bitcoin</p>
                      <p>• Provide examples of real-world mobile applications using SPV</p>
                      <p>• Understand the trade-offs between SPV and full node validation</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">7. Merkle Tree Fundamentals</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Explain what a Merkle tree is and its properties</p>
                      <p>• Describe the process of deriving a Merkle root from leaf nodes</p>
                      <p>• Understand the mathematical foundation of Merkle trees</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">8. Merkle Tree Applications</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Analyze the provability benefits of Merkle trees</p>
                      <p>• Identify where Merkle trees are used in the Bitcoin protocol</p>
                      <p>• Understand how Merkle proofs enable efficient verification</p>
                    </div>
                  </div>

                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <h3 className="text-orange-300 font-semibold mb-3">9. Block Data Integration</h3>
                    <div className="text-orange-200 text-sm space-y-2">
                      <p>• Explain how Merkle tree data is incorporated into blocks</p>
                      <p>• Describe how nodes utilize this data for verification</p>
                      <p>• Understand the relationship between block headers and Merkle roots</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercise */}
            <div className="bg-zinc-800 border border-orange-400 overflow-hidden">
              <div className="bg-zinc-700 px-4 py-3 border-b border-orange-400">
                <h2 className="text-xl font-semibold text-orange-300">
                  <span className="text-orange-400">[EXERCISE]</span> Week 6 Assignment
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-zinc-700 border border-orange-400 p-4 mb-4">
                  <div className="text-orange-300 font-semibold mb-2">Assignment Repository</div>
                  <div className="text-orange-200 text-sm">
                    <span className="text-orange-400">🔗 GitHub Classroom:</span>{' '}
                    <a href="https://classroom.github.com/a/UoMbTvKv" 
                       className="text-blue-400 hover:text-blue-300 underline" 
                       target="_blank" 
                       rel="noopener noreferrer">
                      Week 6 - Networking and SPV Assignment
                    </a>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <div className="text-orange-300 font-semibold mb-2">Assignment Focus</div>
                    <div className="text-orange-200 text-sm space-y-1">
                      <p>• Implement network message parsing and construction</p>
                      <p>• Build SPV client functionality</p>
                      <p>• Create Merkle tree verification algorithms</p>
                      <p>• Analyze network message payloads and structures</p>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-700 border border-orange-400 p-4">
                    <div className="text-orange-300 font-semibold mb-2">Submission Guidelines</div>
                    <div className="text-orange-200 text-sm space-y-1">
                      <p>• Complete all exercises in the GitHub repository</p>
                      <p>• Ensure your code passes all provided tests</p>
                      <p>• Submit by the cohort end date plus two weeks</p>
                      <p>• Code will be reviewed and graded by TAs based on quality and correctness</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-700 border border-orange-400 p-4">
                  <div className="text-orange-300">
                    <span className="text-orange-400">HELP:</span> For any questions about the exercise, ask in the <span className="font-semibold">#dev-help</span> Discord channel.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
 }