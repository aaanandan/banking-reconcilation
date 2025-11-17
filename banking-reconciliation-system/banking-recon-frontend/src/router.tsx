import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login/Login';

// Placeholder components (will be replaced in Steps 76-90)
const Register = () => <div>Register Page</div>;
const Dashboard = () => <div>Dashboard Page</div>;
const UploadFiles = () => <div>Upload Files Page</div>;
const MainLayout = () => <div><h1>Main Layout</h1><Outlet /></div>;
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
