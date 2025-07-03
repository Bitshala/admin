import { useState, useEffect, type JSX } from 'react';

// API Response Types (matching your Rust RowData struct)

// Frontend Display Types
interface StudentResult {
  name: string;
  email: string;
  total_score: number;
  exercise_total_score?: number;
}

// Sort types
type SortType = 'default' | 'total_score_asc' | 'total_score_desc' | 'exercise_score_asc' | 'exercise_score_desc';

// Props interface (if you need to pass props later)
type ResultPageProps = object

export const ResultPage: React.FC<ResultPageProps> = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [, setOriginalResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<SortType>('default');

  useEffect(() => {
    const fetchResults = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: Response = await fetch('https://admin.bitshala.org/students/total_scores');
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data: StudentResult[] = await response.json();
        console.log('API Response:', data);
        
        console.log('Mapped Results:', data);
        setOriginalResults(data); // Store original order
        setResults(data);
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
  const handleTotalScoreSort = (): void => {
    if (currentSort === 'total_score_desc') {
      // Switch to ascending
      setCurrentSort('total_score_asc');
      const sortedResults = [...results].sort((a: StudentResult, b: StudentResult) => {
        return a.total_score - b.total_score; // Ascending
      });
      setResults(sortedResults);
    } else {
      // Switch to descending (default)
      setCurrentSort('total_score_desc');
      const sortedResults = [...results].sort((a: StudentResult, b: StudentResult) => {
        return b.total_score - a.total_score; // Descending
      });
      setResults(sortedResults);
    }
  };

  const handleExerciseScoreSort = (): void => {
    if (currentSort === 'exercise_score_desc') {
      // Switch to ascending
      setCurrentSort('exercise_score_asc');
      const sortedResults = [...results].sort((a: StudentResult, b: StudentResult) => {
        const aScore = a.exercise_total_score ?? 0;
        const bScore = b.exercise_total_score ?? 0;
        return aScore - bScore; // Ascending
      });
      setResults(sortedResults);
    } else {
      // Switch to descending (default)
      setCurrentSort('exercise_score_desc');
      const sortedResults = [...results].sort((a: StudentResult, b: StudentResult) => {
        const aScore = a.exercise_total_score ?? 0;
        const bScore = b.exercise_total_score ?? 0;
        return bScore - aScore; // Descending
      });
      setResults(sortedResults);
    }
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

  // Helper function to get sort indicator for total score
  const getTotalScoreSortIndicator = (): JSX.Element | null => {
    if (currentSort === 'total_score_desc') {
      return <span className="ml-2 text-xs text-zinc-400">↓</span>;
    }
    if (currentSort === 'total_score_asc') {
      return <span className="ml-2 text-xs text-zinc-400">↑</span>;
    }
    return null;
  };

  // Helper function to get sort indicator for exercise score
  const getExerciseScoreSortIndicator = (): JSX.Element | null => {
    if (currentSort === 'exercise_score_desc') {
      return <span className="ml-2 text-xs text-zinc-400">↓</span>;
    }
    if (currentSort === 'exercise_score_asc') {
      return <span className="ml-2 text-xs text-zinc-400">↑</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-inter">Cohort Result</h1>
          <p className="text-zinc-400 font-inter">Scores for this cohort</p>
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
                <th 
                  className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter cursor-pointer hover:text-white transition-colors duration-200 select-none"
                  onClick={handleExerciseScoreSort}
                  title="Click to sort by Exercise Score"
                >
                  <div className="flex items-center">
                    Exercise Score
                    {getExerciseScoreSortIndicator()}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-semibold text-zinc-300 font-inter cursor-pointer hover:text-white transition-colors duration-200 select-none"
                  onClick={handleTotalScoreSort}
                  title="Click to sort by Total Score"
                >
                  <div className="flex items-center">
                    Total Score
                    {getTotalScoreSortIndicator()}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((student: StudentResult, index: number) => {
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
                      <span className={`font-semibold ${getScoreColorClass(student.exercise_total_score ?? 0)}`}>
                        {student.exercise_total_score}
                      </span>
                    </td>
                    <td className="p-4 font-inter">
                      <span className={`font-semibold ${getScoreColorClass(student.total_score)}`}>
                        {student.total_score}
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