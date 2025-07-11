type CohortCardProps = {
  title: string;
  students: number;
  startDate: string;
  onClick: () => void;
};

const CohortCard = ({
  title,
  students,
  startDate,
  onClick,
}: CohortCardProps) => {
  return (
    <div
      className="group relative bg-zinc-800/80 backdrop-blur-sm rounded-xl p-5 m-4 w-80 cursor-pointer transform transition-all duration-300 hover:scale-101 overflow-hidden"
      onClick={onClick}
    >
      <div className="relative z-10">
        {/* Status badge + arrow icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md font-inter">
            Active
          </div>
          <div className="opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-300">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-400 to-amber-400 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-4 font-inter leading-snug group-hover:text-orange-300 transition-colors duration-200">
          {title}
        </h3>

        {/* Info row */}
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-md bg-orange-500/10 flex items-center justify-center mr-2">
              <svg
                className="w-3 h-3 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="font-medium font-inter text-zinc-300">
              {students} students
            </span>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center mr-2">
              <svg
                className="w-3 h-3 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-medium font-inter text-zinc-300">
              Starts {startDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortCard;
