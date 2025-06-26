import { useState, useEffect } from 'react';

// API Response Types (matching your Rust RowData struct)
interface ApiStudent {
  name: string;
  group_id: string;
  ta: string | null;
  attendance: string | null;
  fa: number | null;
  fb: number | null;
  fc: number | null;
  fd: number | null;
  bonus_attempt: number | null;
  bonus_answer_quality: number | null;
  bonus_follow_up: number | null;
  exercise_submitted: string | null;
  exercise_test_passing: string | null;
  exercise_good_documentation: string | null;
  exercise_good_structure: string | null;
  total: number | null;
  mail: string;
  week: number;
}

// Frontend Display Types
interface StudentResult {
  name: string;
  email: string;
  totalScore: number;
}


// Props interface (if you need to pass props later)
type ResultPageProps = object

export const ResultPage: React.FC<ResultPageProps> = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: Response = await fetch('https://admin.bitshala.org/students/total_scores');
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data: ApiStudent[] = await response.json();
        
        // Map the API response to match your table structure and limit to 10
        const mappedResults: StudentResult[] = data
          .filter((student: ApiStudent) => student.total !== null && student.total > 0) 
          .map((student: ApiStudent) => ({
            name: student.name,
            email: student.mail, // Note: API uses 'mail' field
            totalScore: student.total || 0
          }))
          .slice(0, 10); // Limit to top 10 students
        
        setResults(mappedResults);
      } catch (err) {
        const errorMessage: string = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white font-inter">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 font-inter">Error: {error}</div>
      </div>
    );
  }

  // Helper function to get score color class
  const getScoreColorClass = (score: number): string => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-inter">Cohort Result</h1>
          <p className="text-zinc-400 font-inter">Top 10 Performers this cohort</p>
        </div>
        
        {/* Table */}
        <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-700/50 border-b border-zinc-600/50">
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Rank</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((student: StudentResult, index: number) => (
                <tr
                  key={`${student.email}-${index}`}
                  className="border-b border-zinc-700/30 hover:bg-zinc-700/20 transition-colors duration-200"
                >
                  <td className="p-4 text-zinc-300 font-inter font-semibold">#{index + 1}</td>
                  <td className="p-4 text-white font-inter">{student.name}</td>
                  <td className="p-4 text-zinc-400 font-inter">{student.email}</td>
                  <td className="p-4 font-inter">
                    <span className={`font-semibold ${getScoreColorClass(student.totalScore)}`}>
                      {student.totalScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};