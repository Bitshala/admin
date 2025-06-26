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

// Sort types
type SortType = 'default' | 'totalScore';

// Props interface (if you need to pass props later)
type ResultPageProps = object

export const ResultPage: React.FC<ResultPageProps> = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [originalResults, setOriginalResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<SortType>('default');

  useEffect(() => {
    const fetchResults = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: Response = await fetch('http://localhost:8081/students/total_scores');
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data: ApiStudent[] = await response.json();
        console.log('API Response:', data);
        
        // Map the API response to match your table structure and limit to 10
        const mappedResults: StudentResult[] = data
          .filter((student: ApiStudent) => student.total !== null && student.total > 0) 
          .map((student: ApiStudent) => ({
            name: student.name,
            email: student.mail, // Note: API uses 'mail' field
            totalScore: student.total || 0
          }));
        
        setOriginalResults(mappedResults); // Store original order
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

  // Sort functions
  const sortByDefault = (): void => {
    setCurrentSort('default');
    setResults([...originalResults]);
  };

  const sortByTotalScore = (): void => {
    setCurrentSort('totalScore');
    const sortedResults = [...results].sort((a: StudentResult, b: StudentResult) => {
      return b.totalScore - a.totalScore; // Always descending
    });
    setResults(sortedResults);
  };

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

  // Helper function to get rank styling
  const getRankStyling = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'text-yellow-400 font-bold'; // Gold
      case 2:
        return 'text-gray-300 font-bold'; // Silver
      case 3:
        return 'text-amber-600 font-bold'; // Bronze
      default:
        return 'text-zinc-300 font-semibold';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-inter">Cohort Result</h1>
          <p className="text-zinc-400 font-inter">Top 10 Performers this cohort</p>
        </div>
        
        {/* Sort Controls */}
        <div className="mb-6 flex justify-end gap-3">
          <button
            onClick={sortByDefault}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg 
                     transition-all duration-200 font-inter text-sm ${
                       currentSort === 'default'
                         ? 'bg-zinc-600 border-zinc-500 text-white'
                         : 'bg-zinc-700/50 hover:bg-zinc-700 border-zinc-600/50 text-zinc-300 hover:text-white'
                     }`}
          >
            <span>Default Order</span>
          </button>
          
          <button
            onClick={sortByTotalScore}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg 
                     transition-all duration-200 font-inter text-sm ${
                       currentSort === 'totalScore'
                         ? 'bg-zinc-600 border-zinc-500 text-white'
                         : 'bg-zinc-700/50 hover:bg-zinc-700 border-zinc-600/50 text-zinc-300 hover:text-white'
                     }`}
          >
            <span>Sort by Score</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs text-zinc-400">(High to Low)</span>
          </button>
        </div>
        
        {/* Table */}
        <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-16" />
              <col className="w-48" />
              <col className="w-64" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="bg-zinc-700/50 border-b border-zinc-600/50">
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Rank</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter">
                  Total Score
                  {currentSort === 'totalScore' && (
                    <span className="ml-2 text-xs text-zinc-400">↓</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((student: StudentResult, index: number) => {
                const rank = index + 1;
                return (
                  <tr
                    key={`${student.email}-${index}`}
                    className="border-b border-zinc-700/30 hover:bg-zinc-700/20 transition-colors duration-200"
                  >
                    <td className="p-4 font-inter">
                      <span className={getRankStyling(rank)}>#{rank}</span>
                    </td>
                    <td className="p-4 text-white font-inter truncate" title={student.name}>
                      {student.name}
                    </td>
                    <td className="p-4 text-zinc-400 font-inter truncate" title={student.email}>
                      {student.email}
                    </td>
                    <td className="p-4 font-inter">
                      <span className={`font-semibold ${getScoreColorClass(student.totalScore)}`}>
                        {student.totalScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Results Info */}
        <div className="mt-4 text-center text-zinc-400 text-sm font-inter">
          Showing top 10 of {results.length} students
        </div>
        
        {/* No results message */}
        {results.length === 0 && (
          <div className="text-center text-zinc-400 mt-8">
            <p className="font-inter">No results found with scores greater than 0.</p>
          </div>
        )}
      </div>
    </div>
  );
};