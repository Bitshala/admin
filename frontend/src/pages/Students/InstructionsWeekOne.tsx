import React from 'react';

export default function InstructionsWeekOne() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-semibold text-gray-800">Week 1 Instructions</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Welcome to Week 1 of the <a href="#" className="text-blue-600 hover:underline">Programming Bitcoin</a> Study Cohort. 
          Please follow the action items below to prepare for this week's discussion.
        </p>
      </div>

      {/* Your Action Items */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ✅ Your Action Items
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">1</span>
              <span>Introduce yourself on Discord if you haven't already.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">2</span>
              <span>Read Chapters 1 and 2: Finite Fields and Elliptic Curves. The course content is hosted on 
                <a href="https://github.com/jimmysong/programmingbitcoin" className="text-blue-600 hover:underline ml-1">GitHub</a>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">3</span>
              <span>Review the assigned group, chapter(s), and question(s) provided below. Prepare your answers for the group discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">4</span>
              <span>If assigned as a deputy🤠, familiarize yourself with the expectations outlined in the link. Your assistance will be valuable in guiding and facilitating the discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">5</span>
              <span>Join the assigned Group Discussion room on time.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">6</span>
              <span>Introduce yourself and answer the assigned questions with the help of the deputy🤠 during the group discussion.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-xs">7</span>
              <span>After the group discussion, return to the main hall to conclude the discussion with all participants of the cohort.</span>
            </li>
          </ol>
        </div>
      </div>

      {/* This Week's Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            📚 This Week's Chapters
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid gap-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Week 1: Chapters 1 and 2 – Finite Fields and Elliptic Curves</h4>
              <div className="text-sm space-y-1">
                <div>
                  <a href="https://raw.githubusercontent.com/jimmysong/programmingbitcoin/master/ch01.asciidoc" className="text-blue-600 hover:underline">📖 Chapter 1: Finite Fields</a>
                </div>
                <div>
                  <a href="https://raw.githubusercontent.com/jimmysong/programmingbitcoin/master/ch02.asciidoc" className="text-blue-600 hover:underline">📖 Chapter 2: Elliptic Curves</a>
                </div>
                <div>
                  <a href="https://github.com/jimmysong/programmingbitcoin/tree/master/code-ch01" className="text-blue-600 hover:underline">💻 Chapter 1 Code</a>
                </div>
                <div>
                  <a href="https://github.com/jimmysong/programmingbitcoin/tree/master/code-ch02" className="text-blue-600 hover:underline">💻 Chapter 2 Code</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* This Week's Questions */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            ❓ This Week's Questions
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Round 1:</h4>
            <ul className="space-y-2 text-sm">
              <li>What is a modulo operation? What are the mathematical properties of finite fields? Why are these properties important to have?</li>
              <li>Can you explain in simple terms what does order of a finite field means? Why finite fields are constructed with a prime modulo? What happens if its not a prime?</li>
              <li>Explain Fermat's little theorem. What is it used for?</li>
              <li>How to express negative numbers in finite field? What would be the positive number equivalent of -27mod(5)?</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Round 2:</h4>
            <ul className="space-y-2 text-sm">
              <li>What is an elliptic curve? What was the earliest known elliptic curve? Why elliptic curves are useful in cryptography?</li>
              <li>Explain elliptic curve point addition in simple terms.</li>
              <li>For elliptic curve point addition the last step is to reflect the resulting point across x-axis. Why is this needed? What happens if there was no reflection?</li>
              <li>What is the Point of Infinity? What curve operation produces the point of Infinity? Is it useful in real life crypto implementation?</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exercise */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            💻 Exercise
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Week 1 assignment</h4>
            <p className="text-sm mb-2">
              Assignment link: <a href="https://classroom.github.com/a/ppiMSaBz" className="text-blue-600 hover:underline">https://classroom.github.com/a/ppiMSaBz</a>
            </p>
            <p className="text-sm mb-2">
              To get started with all the exercises, check for the respective chapters in the PB book. Head to the Programming Bitcoin book and look for the respective Chapter's code.
            </p>
            <div className="text-sm space-y-1">
              <p className="font-medium">Setup Instructions:</p>
              <ol className="ml-4 space-y-1 text-xs">
                <li>Install Python 3.5+</li>
                <li>Clone: <code className="bg-gray-200 px-1 rounded">git clone https://github.com/jimmysong/programmingbitcoin</code></li>
                <li>Install requirements: <code className="bg-gray-200 px-1 rounded">pip install -r requirements.txt</code></li>
                <li>Run Jupyter Notebook</li>
              </ol>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">
              For any help related to the exercise feel free to ask questions in the <strong>#dev-help</strong> forum of discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}