import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ErrorBoundary from './componentes/ErrorBoundary';
import './App.css'

// Importar pantallas
import Home from './pantallas/home';
import AuthPage from './pantallas/AuthPage';
import Perfil from './pantallas/Perfil';
import PerfilPublico from './pantallas/PerfilPublico';
import EditarPerfil from './pantallas/EditarPerfil';
import Configuracion from './pantallas/Configuracion';
import Estadistica from './pantallas/Estadistica';
import PublicarCarta from './pantallas/PublicarCarta';
import Coleccion from './pantallas/Coleccion';
import DetalleCarta from './pantallas/DetalleCarta';
import Feed from './pantallas/Feed';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Componente que maneja las rutas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/perfil/:userId?" element={<PerfilPublico />} />

      {/* Rutas protegidas */}
      <Route path="/mi-perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />

      <Route path="/editar-perfil" element={
        <ProtectedRoute>
          <EditarPerfil />
        </ProtectedRoute>
      } />

      <Route path="/coleccion" element={
        <ProtectedRoute>
          <Coleccion />
        </ProtectedRoute>
      } />

      <Route path="/configuracion" element={
        <ProtectedRoute>
          <Configuracion />
        </ProtectedRoute>
      } />

      <Route path="/estadistica" element={
        <ProtectedRoute>
          <Estadistica />
        </ProtectedRoute>
      } />

      <Route path="/publicar" element={
        <ProtectedRoute>
          <PublicarCarta />
        </ProtectedRoute>
      } />

      <Route path="/detalle/:tipo/:id" element={
        <ProtectedRoute>
          <DetalleCarta />
        </ProtectedRoute>
      } />

      <Route path="/ventas" element={
        <ProtectedRoute>
          <Feed />
        </ProtectedRoute>
      } />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


function App() {
  const selectedTheme = localStorage.getItem("theme");

  if (selectedTheme) {
    document.documentElement.setAttribute("data-theme", selectedTheme);

  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>

  );
}

export default App;