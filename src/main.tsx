import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createBrowserRouter, RouterProvider } from "react-router";
import './index.css'
import Login from './Login.tsx'
import TableView from './TableView.tsx'
import 'virtual:uno.css'
import { useLocation, Navigate } from 'react-router-dom';

const TOKEN  = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";
const isAuthenticated = (token?: string) => {
  if (token === TOKEN){
      return !!token;
  }
};

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const location = useLocation();
  const token = location.state?.token;
  return isAuthenticated(token) ? element : <Navigate to="/" replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/admin",
    element: <ProtectedRoute element={<TableView />} />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <RouterProvider router={router} />
  </StrictMode>,
)
