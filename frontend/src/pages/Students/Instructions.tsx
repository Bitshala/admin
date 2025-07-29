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

  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

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

  const getTimeUntilDeadline = () => {
    const deadline = new Date('2025-06-15T12:00:00+05:30');
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Deadline passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours remaining`;
    return `${hours} hours remaining`;
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header with Logo */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-7 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <div className="i-ph-currency-bitcoin w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-orange-600 mb-1">Learning Bitcoin</h2>
              <p className="text-sm text-zinc-400">Command Line Course</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-zinc-400">Logged in as</p>
              <p className="text-sm font-medium text-white">Alex Johnson</p>
            </div>
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <div className="i-ph-user w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-7">
        <div className="flex space-x-1 overflow-x-auto">
          {weeks.map((week) => (
            <button
              key={week.id}
              onClick={() => handleWeekClick(week)}
              className={getTabClasses(week)}
            >
              <div className={`${week.icon} w-4 h-4`} />
              {week.title}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-800/50 px-7 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">Course Progress</span>
          <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 h-full transition-all duration-500" style={{ width: '60%' }} />
          </div>
          <span className="text-sm font-medium text-orange-600">60%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-7 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <div className="i-ph-house w-4 h-4" />
            <span>/</span>
            <span>Course</span>
            <span>/</span>
            <span className="text-orange-600">Week 3</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Week 3: Bitcoin Transactions</h1>
          <p className="text-lg text-zinc-400">Master the art of creating and controlling Bitcoin transactions</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <div className="i-ph-book-open w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">13</p>
                <p className="text-sm text-zinc-400">Chapters</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <div className="i-ph-question w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-sm text-zinc-400">Questions</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <div className="i-ph-check-circle w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{attendanceData.attended}/{attendanceData.total}</p>
                <p className="text-sm text-zinc-400">Attendance</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <div className="i-ph-users w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{groupInfo.groupNumber}</p>
                <p className="text-sm text-zinc-400">Your Group</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Card */}
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-600/50 rounded-xl p-7 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div>
               <div className="flex items-center gap-3 mb-3">
                  <div className="i-ph-currency-bitcoin w-8 h-8 text-orange-600" />
                  <h2 className="text-2xl font-semibold text-white">Week 3 Assignment</h2>
                </div>
                <h3 className="text-lg text-orange-600 font-medium mb-2">
                  Sending & Controlling Bitcoin Transactions
                </h3>
                <p className="text-zinc-300 mb-4">
                  Complete hands-on exercises for Chapters 4 & 5 to master transaction creation and management
                </p>
              </div>
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg px-4 py-2 text-center">
                <div className="i-ph-clock w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs text-red-400 font-medium">Deadline</p>
                <p className="text-sm text-red-300 font-semibold">{getTimeUntilDeadline()}</p>
              </div>
            </div>
            <a
              href="https://classroom.github.com/a/hplYAdJY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-orange-600/20 hover:-translate-y-0.5"
            >
              <div className="i-ph-github-logo w-5 h-5" />
              Access GitHub Classroom
            </a>
          </div>
        </div>

        {/* This Week's Chapters */}
        <section className="mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white mb-5">
            <div className="i-ph-book w-6 h-6 text-orange-600" />
            This Week's Chapters
          </h2>
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition-all cursor-pointer group"
                onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        chapter.title.includes('Interlude') 
                          ? 'bg-blue-600/20 text-blue-400' 
                          : 'bg-orange-600/20 text-orange-400'
                      }`}>
                        {chapter.title.includes('Interlude') ? 'i' : index + 1}
                      </div>
                      <h3 className="text-lg font-medium text-white group-hover:text-orange-400 transition-colors">
                        {chapter.title}
                      </h3>
                    </div>
                    {expandedChapter === index && (
                      <p className="mt-3 text-zinc-400 ml-11">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                  <div className={`i-ph-caret-down w-5 h-5 text-zinc-500 transition-transform ${
                    expandedChapter === index ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discussion Questions */}
        <section className="mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white mb-5">
            <div className="i-ph-question w-6 h-6 text-orange-600" />
            Discussion Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition-all cursor-pointer"
                onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-sm font-semibold text-blue-400 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-400 mb-1">{question.title}</h4>
                    <p className={`text-zinc-300 text-sm ${expandedQuestion === index ? '' : 'line-clamp-2'}`}>
                      {question.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Group Info */}
          <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600/30 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="i-ph-users w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-sm text-purple-400 font-medium mb-2">Your Group</h3>
            <div className="text-3xl font-bold text-white mb-1">Group {groupInfo.groupNumber}</div>
            <p className="text-sm text-zinc-400">{groupInfo.groupName}</p>
          </div>

          {/* TA Info */}
          <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-600/30 rounded-xl p-6 text-center hover:border-green-600/50 transition-all">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="i-ph-chalkboard-teacher w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-sm text-green-400 font-medium mb-2">Teaching Assistant</h3>
            <div className="text-xl font-semibold text-white mb-1">{groupInfo.ta}</div>
            <p className="text-sm text-zinc-400">Group Sessions</p>
          </div>

          {/* Discord */}
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600/30 rounded-xl p-6 hover:border-blue-600/50 transition-all">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="i-ph-discord-logo w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm text-blue-400 font-medium mb-2">Discord Channel</h3>
            <p className="text-sm text-white mb-3">{groupInfo.discordChannel}</p>
            <a
              href={groupInfo.discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <div className="i-ph-arrow-square-out w-4 h-4" />
              Join
            </a>
          </div>

          {/* Attendance */}
          <div className="bg-gradient-to-br from-orange-600/10 to-orange-600/5 border border-orange-600/30 rounded-xl p-6 hover:border-orange-600/50 transition-all">
            <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="i-ph-chart-line w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-sm text-orange-400 font-medium mb-2">Attendance</h3>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round((attendanceData.attended / attendanceData.total) * 100)}%
            </div>
            <p className="text-sm text-zinc-400 mb-3">{attendanceData.attended}/{attendanceData.total} sessions</p>
            <div className="flex gap-1 justify-center">
              {attendanceData.sessions.map((attended, index) => (
                <button
                  key={index}
                  onClick={() => handleAttendanceClick(index)}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all hover:scale-110
                    ${attended 
                      ? 'bg-green-600 text-white' 
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }
                  `}
                  title={`Session ${index + 1}`}
                >
                  {attended ? '✓' : index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise Section */}
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-2 border-orange-600 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -ml-32 -mt-32" />
          <div className="relative">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="i-ph-code w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl text-white font-semibold mb-2">
              Ready to Practice?
            </h3>
            <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
              Complete the hands-on exercises for Chapters 4 & 5. Build real Bitcoin transactions and learn advanced control techniques.
            </p>
            <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-red-300 font-medium">
                <div className="i-ph-warning-circle w-5 h-5" />
                <span>Deadline: Sunday, June 15, 2025, 12:00 PM IST</span>
              </div>
              <p className="text-sm text-red-400 mt-1">{getTimeUntilDeadline()}</p>
            </div>
            <a
              href="https://classroom.github.com/a/hplYAdJY"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-orange-600/20 hover:-translate-y-0.5 text-lg"
            >
              <div className="i-ph-github-logo w-6 h-6" />
              Start Exercise Assignment
            </a>
            <p className="text-zinc-400 mt-6 text-sm">
              Need help? Ask questions in <span className="text-blue-400">#dev-help</span> forum on Discord
            </p>
          </div>
        </div>

        {/* Resources Section */}
        <section className="mt-10">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-white mb-5">
            <div className="i-ph-link w-6 h-6 text-orange-600" />
            Quick Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="#" className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                  <div className="i-ph-book-bookmark w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Course Materials</h4>
                  <p className="text-sm text-zinc-400">Access all readings</p>
                </div>
              </div>
            </a>
            <a href="#" className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                  <div className="i-ph-video w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Video Tutorials</h4>
                  <p className="text-sm text-zinc-400">Watch explanations</p>
                </div>
              </div>
            </a>
            <a href="#" className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                  <div className="i-ph-chat-circle w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Office Hours</h4>
                  <p className="text-sm text-zinc-400">Schedule support</p>
                </div>
              </div>
            </a>
          </div>
               </section>
      </div>
    </div>
  );
};

export default BitcoinDashboard;
      