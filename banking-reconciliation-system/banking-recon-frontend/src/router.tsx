import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { MainLayout } from './components/Layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { UploadFiles, ColumnMapping } from './pages/Reconciliation';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'reconciliation/new', element: <UploadFiles /> },
      { path: 'reconciliation/mapping', element: <ColumnMapping /> },
    ],
  },
]);
