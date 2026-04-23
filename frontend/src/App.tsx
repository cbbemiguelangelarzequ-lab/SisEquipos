import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventario } from './pages/Inventario';
import { Secciones } from './pages/Secciones';
import { Administracion } from './pages/Administracion';
import { Mantenimiento } from './pages/Mantenimiento';
import { Bodega } from './pages/Bodega';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // datos válidos por 5 min — no re-fetches al navegar
      gcTime:    10 * 60 * 1000, // mantiene cache 10 min
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="secciones" element={<Secciones />} />
            <Route path="administracion" element={<Administracion />} />
            <Route path="mantenimiento" element={<Mantenimiento />} />
            <Route path="bodega" element={<Bodega />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
}

export default App;

