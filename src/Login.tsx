import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const TOKEN = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";

  // Handle redirect from Discord with token
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authSource = params.get("auth");
    const token = params.get("token");

    if (authSource === "discord" && token === TOKEN) {
      navigate('/select', { state: { token } });
    }
  }, [location, navigate]);

  const handleDiscordLogin = () => {
    const CLIENT_ID = '1365322199413821572';
    const REDIRECT_URI = encodeURIComponent('http://admin.bitshala.org/discord/callback');
    const SCOPES = encodeURIComponent('identify guilds');
    const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPES}`;
    window.location.href = discordOAuthUrl;
  };

  const handleEmailLogin = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    
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
        } else {
          setError('Invalid token returned from server.');
        }
      })
      .catch(err => {
        setError(err.message || 'Login failed');
      });
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center font-mono">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="text-center  from-zinc-700 to-zinc-800">
          <h1 className="text-5xl font-bold text-white tracking-wide">ORACLE</h1>
       
        </div>

        <div className="p-8 space-y-3">
          {/* Discord OAuth Button */}
          <button
            onClick={handleDiscordLogin}
            className="b-0 w-full py-4 text-base font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Sign in with Discord</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-800 text-zinc-400">or</span>
            </div>
          </div>

          {/* Email input */}
          <div className="relative">
            <input
              className=" b-0 w-88 text-base p-4 bg-zinc-700 border border-zinc-600 font-mono rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEmailLogin();
                }
              }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-zinc-500 text-lg">@</span>
            </div>
          </div>

          {/* Email Sign In Button */}
          <button
            className="b-0 w-full py-4 text-base font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-500/20 flex items-center justify-center space-x-3"
            onClick={handleEmailLogin}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Sign In with Email</span>
          </button>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-2 text-red-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;