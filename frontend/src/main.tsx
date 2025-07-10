import { StrictMode, type JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useLocation, Navigate } from 'react-router-dom';

import Login from './Login.tsx';
import TableView from './TableView.tsx';
import { CohortSelection } from './CohortSelection.tsx';
import { ResultPage } from './ResultPage.tsx';
import StudentDetailPage from './StudentsPage.tsx';

import 'virtual:uno.css';

// 🔐 The hardcoded token to validate against
const TOKEN = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";

// ✅ Utility to fetch token from any source
const getTokenFromLocation = (location: ReturnType<typeof useLocation>): string | null => {
  const queryToken = new URLSearchParams(location.search).get("token");
  const stateToken = location.state?.token;
  return stateToken || queryToken || localStorage.getItem("bitshala_token");
};

// ✅ Token validation logic
const isAuthenticated = (token?: string) => token === TOKEN;

// 🔒 Generic protected route component
const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const location = useLocation();
  const token = getTokenFromLocation(location) ?? undefined;

  if (token) {
    localStorage.setItem("bitshala_token", token);
  }


  return isAuthenticated(token) ? element : <Navigate to="/" replace />;
};

// 🧭 Router setup
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/select",
    element: <ProtectedRoute element={<CohortSelection />} />,
  },
  {
    path: "/admin",
    element: <ProtectedRoute element={<TableView />} />,
  },
  {
    path: "/student",
    element: <StudentDetailPage />,
  },
  {
    path: "/result",
    element: <ResultPage />,
  },
]);

// 🚀 App bootstrap
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
