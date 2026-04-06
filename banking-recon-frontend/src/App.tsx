import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { store } from './store';
import { MainLayout } from './components/Layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { UploadFiles } from './pages/Reconciliation/UploadFiles';
import { ColumnMapping } from './pages/Reconciliation/ColumnMapping';
import { DateRange } from './pages/Reconciliation/DateRange';
import { Processing } from './pages/Reconciliation/Processing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <h2>{title}</h2>
    <p style={{ color: '#8c8c8c' }}>This screen is under development (Steps 121-220)</p>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Reconciliation flow */}
                <Route path="reconciliation">
                  <Route path="new" element={<UploadFiles />} />
                  <Route path="mapping" element={<ColumnMapping />} />
                  <Route path="date-range" element={<DateRange />} />
                  <Route path="processing" element={<Processing />} />
                </Route>

                {/* Placeholder routes for remaining screens */}
                <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
                <Route path="questions" element={<PlaceholderPage title="Learning Questions" />} />
                <Route path="profiles" element={<PlaceholderPage title="Entity Profiles" />} />
                <Route path="users" element={<PlaceholderPage title="User Management" />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="help" element={<PlaceholderPage title="Help & Documentation" />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
