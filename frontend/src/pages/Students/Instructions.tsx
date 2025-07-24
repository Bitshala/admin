import React, { useState } from 'react';

// Types
interface Week {
  id: number;
  title: string;
  status: 'completed' | 'active' | 'locked';
  icon: string;
}

interface Chapter {
  title: string;
  description: string;
}

interface Question {
  title: string;
  text: string;
}

interface GroupInfo {
  groupNumber: number;
  groupName: string;
  ta: string;
  discordChannel: string;
  discordLink: string;
}

interface AttendanceData {
  attended: number;
  total: number;
  sessions: boolean[];
}

const BitcoinDashboard: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    attended: 3,
    total: 5,
    sessions: [true, true, true, false, false]
  });

  const weeks: Week[] = [
    { id: 1, title: 'Week 1', status: 'completed', icon: 'i-ph-check-circle' },
    { id: 2, title: 'Week 2', status: 'completed', icon: 'i-ph-check-circle' },
    { id: 3, title: 'Week 3', status: 'active', icon: 'i-ph-play-circle' },
    { id: 4, title: 'Week 4', status: 'locked', icon: 'i-ph-lock' },
    { id: 5, title: 'Week 5', status: 'locked', icon: 'i-ph-lock' },
  ];

  const chapters: Chapter[] = [
    {
      title: 'Chapter 4.0: Sending Bitcoin Transactions',
      description: 'Learn the fundamentals of creating and sending Bitcoin transactions from the command line.'
    },
    {
      title: 'Chapter 4.1: Sending Coins the Easy Way',
      description: 'Master the basic sendtoaddress command for simple Bitcoin transfers.'
    },
    {
      title: 'Chapter 4.2: Creating a Raw Transaction',
      description: 'Dive deep into raw transaction creation for maximum control and understanding.'
    },
    {
      title: 'Interlude: Using JQ',
      description: 'Learn to use JQ for parsing and manipulating JSON data from Bitcoin Core.'
    },
    {
      title: 'Chapter 4.3: Raw Transaction with Named Arguments',
      description: 'Improve your raw transaction skills with named arguments for better readability.'
    },
    {
      title: 'Chapter 4.4: Sending Coins with Raw Transactions',
      description: 'Execute raw transactions and understand the complete transaction lifecycle.'
    },
    {
      title: 'Interlude: Using Curl',
      description: 'Master Curl commands for interacting with Bitcoin Core\'s RPC interface.'
    },
    {
      title: 'Chapter 4.5: Automated Raw Transactions',
      description: 'Learn to automate raw transaction creation and sending processes.'
    },
    {
      title: 'Chapter 4.6: Creating a SegWit Transaction',
      description: 'Learn about Segregated Witness transactions and their benefits.'
    },
    {
      title: 'Chapter 5.0: Controlling Bitcoin Transactions',
      description: 'Master advanced transaction control and manipulation techniques.'
    },
    {
      title: 'Chapter 5.1: Watching for Stuck Transactions',
      description: 'Monitor transaction status and identify stuck transactions in the mempool.'
    },
    {
      title: 'Chapter 5.2: Resending with RBF',
      description: 'Use Replace-By-Fee to unstick transactions with higher fees.'
    },
    {
      title: 'Chapter 5.3: Funding with CPFP',
      description: 'Understand Child-Pays-For-Parent transactions for fee bumping.'
    }
  ];

  const questions: Question[] = [
    {
      title: 'Transaction Components',
      text: 'What are the components of a transaction? Describe in brief each component and the data they contain.'
    },
    {
      title: 'Transaction Fees',
      text: 'What is the transaction fee? Why do transactions need to pay fee? How to determine a suitable fee at the time of transaction creation?'
    },
    {
      title: 'UTXO Selection',
      text: 'What is an unspent transaction output (UTXO)? How does bitcoind select UTXOs in case of sendtoaddress call?'
    },
    {
      title: 'Transaction Confirmations',
      text: 'What does the confirmation of a transaction indicate? Why should we wait for a certain confirmation number on a transaction before spending them?'
    },
    {
      title: 'Change Addresses',
      text: 'What is a change address? What happens if we don\'t put the change address in createrawtransaction call?'
    },
    {
      title: 'Raw vs Fund Transactions',
      text: 'What is the difference between createrawtransaction and fundrawtransaction call? When to use one over the other?'
    },
    {
      title: 'SegWit vs Normal',
      text: 'What is the difference between a segwit and a normal transaction?'
    },
    {
      title: 'Sequence Numbers',
      text: 'What is sequence number? What are the different ways it can be used to lock transactions?'
    },
    {
      title: 'RBF (Replace-By-Fee)',
      text: 'What is RBF? What is it useful for?'
    },
    {
      title: 'CPFP vs RBF',
      text: 'What is CPFP? When to use it instead of RBF? Does RBF change txid? If so, why?'
    },
    {
      title: 'CPFP Use Cases',
      text: 'What are some practical use cases of CPFP (hint: Lightning anchor outputs in channel opening transactions)?'
    },
    {
      title: 'RBF + CPFP Interaction',
      text: 'What happens when a transaction being bumped by CPFP also gets fee bumped by RBF at the same time? What happens to the child transaction?'
    }
  ];

  const groupInfo: GroupInfo = {
    groupNumber: 3,
    groupName: 'Data Structures Team',
    ta: 'Delcin',
    discordChannel: '#group-3-data-structures',
    discordLink: 'https://discord.gg/gm8DQSUn6G'
  };

  const handleWeekClick = (week: Week) => {
    if (week.status !== 'locked') {
      // Handle week navigation
      console.log(`Navigating to ${week.title}`);
    }
  };

  const handleAttendanceClick = (index: number) => {
    if (!attendanceData.sessions[index]) {
      const newSessions = [...attendanceData.sessions];
      newSessions[index] = true;
      const newAttended = newSessions.filter(Boolean).length;
      
      setAttendanceData({
        ...attendanceData,
        attended: newAttended,
        sessions: newSessions
      });
    }
  };

  const getTabClasses = (week: Week) => {
    const baseClasses = 'flex items-center justify-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-all text-sm font-medium whitespace-nowrap';
    
    switch (week.status) {
      case 'completed':
        return `${baseClasses} border-green-600 bg-green-600/10 text-green-400`;
      case 'active':
        return `${baseClasses} border-orange-600 bg-orange-600/10 text-orange-400`;
      case 'locked':
        return `${baseClasses} border-transparent text-zinc-500 opacity-50 cursor-not-allowed`;
      default:
        return `${baseClasses} border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600`;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 ">
      {/* Header with Logo */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-7 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-orange-600 mb-1">Learning Bitcoin</h2>
            <p className="text-sm text-zinc-400">Command Line Course</p>
          </div>
        </div>
      </div>

      {/* Week Tabs */}
      <div className=" bg-zinc-950 border-b border-zinc-800 px-7">
        <div className="flex space-x-1 overflow-x-auto">
          {weeks.map((week) => (
            <button
              key={week.id}
              onClick={() => handleWeekClick(week)}
              className={getTabClasses(week)}
            >
              <div className={`${week.icon} w-4 h-4  `} />
              {week.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-7">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Student Dashboard</h1>
          <p className="text-lg text-zinc-400 mb-1">Welcome back, Alex Johnson</p>
          <p className="text-orange-600 font-semibold">Currently viewing: Week 3</p>
        </div>

        {/* Assignment Card */}
        <div className="bg-zinc-800 border border-orange-600 rounded-xl p-7 mb-7">
          <div className="flex items-center gap-4 mb-5">
            <div className="i-ph-currency-bitcoin w-8 h-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Week 3 Assignment</h2>
            </div>
          </div>
          <h3 className="text-lg text-orange-600 font-medium mb-5">
            Week 3: Sending Bitcoin Transactions & Controlling Bitcoin Transactions
          </h3>
          <a
            href="https://classroom.github.com/a/hplYAdJY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5"
          >
            <div className="i-ph-github-logo w-4 h-4" />
            Access GitHub Classroom
          </a>
        </div>

        {/* This Week's Chapters */}
        <section className="mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white mb-5">
            <div className="i-ph-book w-6 h-6 text-orange-600" />
            This Week's Chapters
          </h2>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-7 mb-7">
            <ul className="space-y-3">
              {chapters.map((chapter, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-zinc-300 hover:text-white transition-colors"
                >
                  <div className="i-ph-circle-fill w-2 h-2 text-orange-600 mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{chapter.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Discussion Questions */}
        <section className="mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white mb-5">
            <div className="i-ph-question w-6 h-6 text-orange-600" />
            Discussion Questions
          </h2>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-7">
            <ul className="space-y-4">
              {questions.map((question, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-zinc-300"
                >
                  <div className="i-ph-circle-fill w-2 h-2 text-orange-600 mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-orange-600">{question.title}:</span>{' '}
                    <span className="leading-relaxed">{question.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
          {/* Group Info */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center">
            <h3 className="flex items-center justify-center gap-2 text-lg text-orange-600 font-semibold mb-4">
              <div className="i-ph-users w-5 h-5" />
              Your Group
            </h3>
            <div className="text-4xl font-bold text-orange-600 mb-2">Group {groupInfo.groupNumber}</div>
            <p className="text-zinc-400">{groupInfo.groupName}</p>
          </div>

          {/* TA Info */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center">
            <h3 className="flex items-center justify-center gap-2 text-lg text-orange-600 font-semibold mb-4">
              <div className="i-ph-chalkboard-teacher w-5 h-5" />
              Teaching Assistant
            </h3>
            <div className="text-xl font-semibold text-white mb-1">{groupInfo.ta}</div>
            <p className="text-zinc-400 text-sm">Group Discussion Sessions</p>
          </div>

          {/* Discord */}
          <div className="bg-zinc-800 border border-blue-500/30 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg text-orange-600 font-semibold mb-4">
              <div className="i-ph-discord-logo w-5 h-5" />
              Group Channel
            </h3>
            <p className="text-zinc-300 mb-3">{groupInfo.discordChannel}</p>
            <p className="text-zinc-400 mb-4 text-sm">Connect with your group members</p>
            <a
              href={groupInfo.discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <div className="i-ph-discord-logo w-4 h-4" />
              Join Discord
            </a>
          </div>

          {/* Attendance */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center">
            <h3 className="flex items-center justify-center gap-2 text-lg text-orange-600 font-semibold mb-4">
              <div className="i-ph-chart-line w-5 h-5" />
              Attendance
            </h3>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {attendanceData.attended}/{attendanceData.total}
            </div>
            <p className="text-zinc-400 mb-4">sessions attended ({(attendanceData.attended / attendanceData.total * 100)}%)</p>
            <div className="flex gap-2 justify-center">
              {attendanceData.sessions.map((attended, index) => (
                <button
                  key={index}
                  onClick={() => handleAttendanceClick(index)}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all hover:scale-110
                    ${attended 
                      ? 'bg-green-600 text-white' 
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise Section */}
        <div className="bg-zinc-800 border-2 border-orange-600 rounded-xl p-7 text-center">
          <h3 className="flex items-center justify-center gap-3 text-2xl text-orange-600 font-semibold mb-4">
            <div className="i-ph-code w-6 h-6" />
            Exercise Assignment
          </h3>
          <p className="text-zinc-300 mb-4">Complete the hands-on exercises for Chapters 4 & 5</p>
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4 text-red-300 font-medium">
            <div className="i-ph-clock inline w-4 h-4 mr-2" />
            Deadline: Sunday, June 15, 2025, at 12:00 PM IST
          </div>
          <a
            href="https://classroom.github.com/a/hplYAdJY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5"
          >
            <div className="i-ph-github-logo w-4 h-4" />
            Start Exercise
          </a>
          <p className="text-zinc-400 mt-4 text-sm">
            Need help? Ask questions in the #dev-help forum on Discord
          </p>
        </div>
      </div>
    </div>
  );
};

export default BitcoinDashboard;