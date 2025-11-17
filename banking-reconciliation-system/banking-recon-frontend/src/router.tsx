import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { MainLayout } from './components/Layout/MainLayout';

// Placeholder components (will be replaced in Steps 86-90)
const Dashboard = () => <div>Dashboard Page</div>;
const UploadFiles = () => <div>Upload Files Page</div>;
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

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
    ],
  },
]);
