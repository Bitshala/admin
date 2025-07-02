import { StrictMode, type JSX } from 'react'
import { createRoot } from 'react-dom/client'

import { createBrowserRouter, RouterProvider } from "react-router";
import Login from './Login.tsx'
import TableView from './TableView.tsx'
import 'virtual:uno.css'
import { useLocation, Navigate } from 'react-router-dom';
import { CohortSelection } from './CohortSelection.tsx';
import {ResultPage} from './ResultPage.tsx';
import  StudentDetailPage  from './StudentsPage.tsx';

const TOKEN  = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";
const isAuthenticated = (token?: string) => {
  if (token === TOKEN){
      return !!token;
  }
};

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const location = useLocation();
  const token = location.state?.token;
  console.log("ProtectedRoute token:", token);
  
  return isAuthenticated(token) ? element : <Navigate to="/" replace />;
};

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
    element:  <StudentDetailPage />,
  },
  {
    path: "/result",
    element: <ResultPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <RouterProvider router={router} />
  </StrictMode>,
)
