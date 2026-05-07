import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

export const useReaccion = (publicacionId) => {
  const { usuario, token, isAuthenticated } = useAuth();
  const [tieneLike, setTieneLike] = useState(false);
  const [cantidadLikes, setCantidadLikes] = useState(0);
  const [cargando, setCargando] = useState(false);

  
  const obtenerEstadoLike = useCallback(async () => {
    if (!isAuthenticated || !publicacionId) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/publicaciones/${publicacionId}/reacciones/mi-reaccion`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tiene = response.data.reaccion === 'like';
      
      setTieneLike(tiene);
      return tiene;
    } catch (error) {
      console.error('Error obteniendo estado del like:', error);
      return false;
    }
  }, [publicacionId, isAuthenticated, token]);

 
  const obtenerCantidadLikes = useCallback(async () => {
    if (!publicacionId) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/publicaciones/${publicacionId}/reacciones`
      );
      const cantidad = response.data.total || response.data.likes || 0;
    
      setCantidadLikes(cantidad);
      return cantidad;
    } catch (error) {
      console.error('Error obteniendo cantidad de likes:', error);
      return 0;
    }
  }, [publicacionId]);

  
  const toggleLike = async () => {
    if (!isAuthenticated) {
      alert('Inicia sesión para dar like');
      return false;
    }
    
    setCargando(true);
 
    const previousTieneLike = tieneLike;
    const previousCantidad = cantidadLikes;
    
    
    setTieneLike(!tieneLike);
    setCantidadLikes(prev => !previousTieneLike ? prev + 1 : prev - 1);
    
    try {
      const response = await axios.post(
        `${API_URL}/publicaciones/${publicacionId}/reacciones`,
        { tipo: 'like' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Respuesta del servidor:', response.data);
     
      const nuevoEstado = response.data.reaccion === 'like';
      const nuevaCantidad = response.data.likes || cantidadLikes;
      
      setTieneLike(nuevoEstado);
      setCantidadLikes(nuevaCantidad);
      
      return true;
    } catch (error) {
      console.error('Error al dar like:', error);
      // Revertir cambios si hay error
      setTieneLike(previousTieneLike);
      setCantidadLikes(previousCantidad);
      alert('Error al procesar el like. Intenta de nuevo.');
      return false;
    } finally {
      setCargando(false);
    }
  };

  // Función para refrescar ambos estados (like y cantidad)
  const refreshLikes = useCallback(async () => {
    await Promise.all([
      obtenerCantidadLikes(),
      isAuthenticated ? obtenerEstadoLike() : Promise.resolve()
    ]);
  }, [obtenerCantidadLikes, obtenerEstadoLike, isAuthenticated]);

  useEffect(() => {
    if (publicacionId) {
      obtenerCantidadLikes();
      if (isAuthenticated) {
        obtenerEstadoLike();
      }
    }
  }, [publicacionId, isAuthenticated, token, obtenerCantidadLikes, obtenerEstadoLike]);

  return {
    tieneLike,
    cantidadLikes,
    cargando,
    toggleLike,
    refreshLikes,  // AÑADIDO: función para refrescar manualmente
    obtenerEstadoLike,  // AÑADIDO: por si se necesita individualmente
    obtenerCantidadLikes  // AÑADIDO: por si se necesita individualmente
  };
};