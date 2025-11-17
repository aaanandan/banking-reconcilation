import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { store } from './store';
import { router } from './router';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890FF',
              borderRadius: 4,
            },
          }}
        >
          <RouterProvider router={router} />
        </ConfigProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
