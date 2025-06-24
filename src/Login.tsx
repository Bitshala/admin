import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const TOKEN = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";

  const handleLogin = () => {
    fetch('https://admin.bitshala.org/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmail: email }),
    })
    .then(res => {
      if (!res.ok) throw new Error('Access denied');
      return res.json();
    })
    .then(data => {
      const token = data.token;
      if (token === TOKEN) {
        navigate('/select', { state: { token } });
      }
    })
    .catch(err => {
      setError(err.message || 'Login failed');
    });
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8 font-mono">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-wide">ORACLE</h1>
        </div>
        
        <div className="p-8 space-y-6 ">
          <div className="relative">
            <input
              className=" w-[350px] text-base p-4 bg-zinc-700  border-0 font-mono rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-zinc-500 text-lg">@</span>
            </div>
          </div>

          <button
            className="font-mono b-0 w-full py-4 text-base font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-500/20"
            onClick={handleLogin}
          >
            Sign In
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;