import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CohortCard from './components/CohortCard';

export const CohortSelection = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("token")) {
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  const token = localStorage.getItem("bitshala_token");

  const handleCohortClick = () => {
    navigate('/admin', { state: { token } });
  };

  return (
    <div className="bg-zinc-900 font-mono min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-200 mb-2">Cohort Selection</h1>
      <p className="text-gray-700 mb-8">Select a cohort to Manage Students.</p>

      <div className="flex flex-wrap justify-center">
        <CohortCard
          title="LBTCL"
          students={24}
          startDate="March 15, 2025"
          onClick={handleCohortClick}
        />
        <CohortCard
          title="Programming Bitcoin"
          students={18}
          startDate="June 1, 2025"
          onClick={handleCohortClick}
        />
      </div>
    </div>
  );
};