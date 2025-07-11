const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN;
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI;

export const isAuthenticated = (token?: string): boolean => {
  return token === AUTH_TOKEN;
};

export const getTokenFromLocation = (location: {
  search: string;
  state?: { token?: string };
}): string | undefined => {
  const queryToken = new URLSearchParams(location.search).get('token');
  const stateToken = location.state?.token;
  const storedToken = localStorage.getItem('bitshala_token');

  return stateToken || queryToken || storedToken || undefined;
};

export const storeToken = (token: string): void => {
  localStorage.setItem('bitshala_token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('bitshala_token');
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('bitshala_token');
};

export const redirectToDiscordAuth = (): void => {
  const SCOPES = encodeURIComponent('identify guilds');
  const encodedRedirectUri = encodeURIComponent(DISCORD_REDIRECT_URI);

  const discordOAuthUrl =
    `https://discord.com/oauth2/authorize?` +
    `client_id=${DISCORD_CLIENT_ID}&` +
    `redirect_uri=${encodedRedirectUri}&` +
    `response_type=code&` +
    `scope=${SCOPES}`;

  window.location.href = discordOAuthUrl;
};

export const handleDiscordCallback = (
  location: { search: string },
  navigate: (path: string, options?: { state?: { token?: string } }) => void
): boolean => {
  const params = new URLSearchParams(location.search);
  const authSource = params.get('auth');
  const token = params.get('token');

  if (authSource === 'discord' && token === AUTH_TOKEN) {
    navigate('/select', { state: { token: token ?? undefined } });
    return true;
  }

  return false;
};

export const loginWithEmail = async (
  email: string
): Promise<{ success: boolean; error?: string; token?: string }> => {
  if (!email) {
    return { success: false, error: 'Please enter your email address' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmail: email }),
    });

    if (!response.ok) {
      throw new Error('Access denied');
    }

    const data = await response.json();
    const token = data.token;

    if (token === AUTH_TOKEN) {
      return { success: true, token };
    } else {
      return { success: false, error: 'Invalid token returned from server.' };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error };
  }
};

export const checkAuthentication = (location: {
  search: string;
  state?: { token?: string };
}): boolean => {
  const token = getTokenFromLocation(location);
  return isAuthenticated(token);
};

export const getAuthToken = (): string => {
  return AUTH_TOKEN;
};

export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};
