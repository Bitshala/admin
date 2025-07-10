import { ExternalLink } from 'lucide-react';
import { getScoreColor, computeGdTotal, computeBonusTotal, computeExerciseTotal } from '../../utils/calculations';
import { fetchStudentRepoLink } from '../../services/studentService';
import type { WeeklyData } from '../../types/student';

interface WeeklyBreakdownCardProps {
  week: WeeklyData;
  studentName: string;
}

export const WeeklyBreakdownCard = ({ week, studentName }: WeeklyBreakdownCardProps) => {
  const handleRepoLink = async () => {
    const url = await fetchStudentRepoLink(week.week, studentName);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const renderScoreBar = (value: number, max: number, color: string) => (
    <div className="flex items-center space-x-2">
      <div className="w-20 bg-zinc-700 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-zinc-200">{value}/{max}</span>
    </div>
  );

  const renderBooleanScore = (isTrue: boolean, points: number) => (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
      isTrue ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
    }`}>
      {isTrue ? `✓ ${points} pts` : `✗ 0 pts`}
    </span>
  );

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
      {/* Week Header */}
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

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GD Scores */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">GD Scores</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Communication (FA)</span>
              {renderScoreBar(week.gdScore.fa, 5, 'bg-amber-500')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Depth of Answer (FB)</span>
              {renderScoreBar(week.gdScore.fb, 5, 'bg-amber-500')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Technical Fluency (FC)</span>
              {renderScoreBar(week.gdScore.fc, 5, 'bg-amber-500')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Engagement (FD)</span>
              {renderScoreBar(week.gdScore.fd, 5, 'bg-amber-500')}
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
              {renderScoreBar(week.bonusScore.attempt, 5, 'bg-green-500')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Quality</span>
              {renderScoreBar(week.bonusScore.good, 5, 'bg-green-500')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Follow Up</span>
              {renderScoreBar(week.bonusScore.followUp, 5, 'bg-green-500')}
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
              {renderBooleanScore(week.exerciseScore.Submitted, 10)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Tests Pass</span>
              {renderBooleanScore(week.exerciseScore.privateTest, 50)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Good Structure</span>
              {renderBooleanScore(week.exerciseScore.goodStructure, 20)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Good Documentation</span>
              {renderBooleanScore(week.exerciseScore.goodDoc, 20)}
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

      {/* GitHub Link */}
      {week.exerciseScore.Submitted && (
        <div className="mt-6 pt-6 border-t border-zinc-700">
          <button 
            onClick={handleRepoLink}
            className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View GitHub Submission for Week {week.week}</span>
          </button>
        </div>
      )}
    </div>
  );
};