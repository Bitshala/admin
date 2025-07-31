import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CohortCard from '../components/CohortCard';

export const CohortSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const cohorts = [
    {
      title: 'LBTCL',
      students: 24,
      startDate: 'March 15, 2025',
      status: 'Active',
      dbPath: 'lbtcl_cohort.db',
    },
    {
      title: 'Programming Bitcoin',
      students: 18,
      startDate: 'June 1, 2025',
      status: 'Upcoming',
      dbPath: 'pb_cohort.db',
    },
    {
      title: 'BPD',
      students: 12,
      startDate: 'January 10, 2025',
      status: 'Active',
      dbPath: 'bpd_cohort.db',
    },
    {
      title: 'MB',
      students: 20,
      startDate: 'April 5, 2025',
      status: 'Upcoming',
      dbPath: 'mb_cohort.db',
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

  const switchCohort = async (dbPath: string, cohortTitle: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8081/switch_cohort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ db_path: dbPath }),
      });

      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('selected_cohort', cohortTitle);
        localStorage.setItem('selected_cohort_db_path', dbPath);
        console.log('Successfully switched cohort:', result.message);
        navigate('/admin', { state: { token } });
      } else {
        console.error('Failed to switch cohort:', result.message);
        alert('Failed to switch cohort: ' + result.message);
      }
    } catch (error) {
      console.error('Error switching cohort:', error);
      alert('Error switching cohort. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCohortClick = (dbPath: string, cohortTitle: string) => {
    switchCohort(dbPath, cohortTitle);
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
            onClick={() => handleCohortClick(cohort.dbPath, cohort.title)}
          />
        ))}
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-zinc-800 p-6 rounded-lg text-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200 mx-auto mb-4"></div>
            <p>Switching cohort...</p>
          </div>
        </div>
      )}
    </div>
  );
};
