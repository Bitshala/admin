import { TrendingUp } from 'lucide-react';
import { getProgressColor } from '../../utils/studentUtils';
import type { WeeklyData } from '../../types/student';

interface WeeklyProgressChartProps {
  weeklyData: WeeklyData[];
}

export const WeeklyProgressChart = ({ weeklyData }: WeeklyProgressChartProps) => {
  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mb-8">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Weekly Progress
      </h2>
      
      <div className="space-y-3">
        {weeklyData.map((week) => (
          <div key={week.week} className="flex items-center space-x-4">
            <div className="w-16 text-sm font-medium text-zinc-300">
              Week {week.week}
            </div>
            
            <div className="flex-1 bg-zinc-700 rounded-full h-6 relative">
              <div 
                className={`h-6 rounded-full ${getProgressColor((week.total / 200) * 100)} transition-all duration-300`}
                style={{ width: `${Math.min((week.total / 200) * 100, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white mix-blend-difference">
                  {week.total}/200
                </span>
              </div>
            </div>
            
            <div className={`w-20 text-sm font-medium text-right ${
              week.attendance ? 'text-green-400' : 'text-red-400'
            }`}>
              {week.attendance ? 'Present' : 'Absent'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};