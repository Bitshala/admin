import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CohortCard from '../components/CohortCard';

export const CohortSelection = () => {
  const navigate = useNavigate();

  const cohorts = [
    {
      title: 'LBTCL',
      students: 24,
      startDate: 'March 15, 2025',
      status: 'Active',
    },
    {
      title: 'Programming Bitcoin',
      students: 18,
      startDate: 'June 1, 2025',
      status: 'Upcoming',
    },
  ];

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  const token = localStorage.getItem('bitshala_token');

  const handleCohortClick = () => {
    navigate('/admin', { state: { token } });
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-mono flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">
          Cohort Selection
        </h1>
        <p className="text-gray-700">Select a cohort to Manage Students.</p>
      </div>

      <div className="flex flex-wrap justify-center">
        {cohorts.map(cohort => (
          <CohortCard
            key={cohort.title}
            title={cohort.title}
            students={cohort.students}
            startDate={cohort.startDate}
            onClick={handleCohortClick}
          />
        ))}
      </div>
    </div>
  );
};
