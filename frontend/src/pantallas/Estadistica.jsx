import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from 'recharts';
import {
  FaChartLine, FaComments, FaHeart, FaNewspaper,
  FaArrowUp, FaCalendarAlt, FaUserFriends, FaSpinner
} from 'react-icons/fa';
import axios from 'axios';
import '../App.css'
import '../pantallas/index.css'

const Estadistica = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('semana');
  const [animacion, setAnimacion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para los datos
  const [datosPrincipales, setDatosPrincipales] = useState({
    publicaciones: 0,
    comentarios: 0,
    reaccionesRecibidas: 0,
    reaccionesDadas: 0,
    tendencias: {
      publicaciones: 0,
      comentarios: 0,
      reaccionesRecibidas: 0,
      reaccionesDadas: 0
    }
  });
  
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [datosDistribucion, setDatosDistribucion] = useState([]);

  // Cargar datos al montar el componente y cuando cambia el período
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        
        // Cargar estadísticas principales
        const statsResponse = await axios.get('http://localhost:3000/api/estadisticas/usuario', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (statsResponse.data.success) {
          setDatosPrincipales(statsResponse.data.data);
        }
        
        // Cargar datos para la gráfica según el período
        const graficaResponse = await axios.get(`http://localhost:3000/api/estadisticas/grafica?periodo=${periodo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (graficaResponse.data.success) {
          setDatosGrafica(graficaResponse.data.data);
        }
        
        // Cargar distribución de interacciones
        const distribucionResponse = await axios.get('http://localhost:3000/api/estadisticas/distribucion', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (distribucionResponse.data.success) {
          setDatosDistribucion(distribucionResponse.data.data);
        }
        
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [periodo]);

  useEffect(() => {
    setAnimacion(true);
  }, []);

  const totalInteracciones = datosDistribucion.reduce((sum, item) => sum + item.valor, 0);

  const StatCard = ({ icon: Icon, titulo, valor, color, tendencia }) => (
    <div className="bg-slate rounded-xl p-4 border hover:border-emerald-500 transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`text-${color} text-xl`} />
        </div>
        {tendencia !== undefined && (
          <div className={`flex items-center text-xs ${tendencia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <FaArrowUp className={`mr-1 text-xs ${tendencia < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(tendencia)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{valor}</div>
      <div className="text-gray-400 text-sm">{titulo}</div>
    </div>
  );

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-slate p-6 font-sans flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-slate p-6 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-slate p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/mi-perfil')}
            className="flex items-center gap-2 bg-slate hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 border hover:border-red-600"
          >
            <span>Volver</span>
          </button>

          <div className="flex gap-2 bg-slate p-1 rounded-lg border">
            {['semana', 'mes', 'año'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${periodo === p
                  ? 'button text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-[#252836]'
                }`}
              >
                {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        <div className={`text-center mb-10 transform transition-all duration-700 ${animacion ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-4xl font-bold highlight bg-clip-text mb-2">
            Panel de Estadísticas
          </h1>
          <p className="text-gray-400">Visualiza tu rendimiento y actividad</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={FaNewspaper} 
            titulo="Publicaciones" 
            valor={datosPrincipales.publicaciones} 
            color="white" 
            tendencia={datosPrincipales.tendencias?.publicaciones}
          />
          <StatCard 
            icon={FaComments} 
            titulo="Comentarios" 
            valor={datosPrincipales.comentarios} 
            color="white" 
            tendencia={datosPrincipales.tendencias?.comentarios}
          />
          <StatCard 
            icon={FaHeart} 
            titulo="Reacciones Recibidas" 
            valor={datosPrincipales.reaccionesRecibidas} 
            color="pink-500" 
            tendencia={datosPrincipales.tendencias?.reaccionesRecibidas}
          />
          <StatCard 
            icon={FaHeart} 
            titulo="Mis me gusta" 
            valor={datosPrincipales.reaccionesDadas} 
            color="pink-500" 
            tendencia={datosPrincipales.tendencias?.reaccionesDadas}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate border-2 rounded-xl p-6 hover:border-emerald-500 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">Distribución de Interacciones</h3>
              <FaChartLine className="highlight text-xl" />
            </div>
            <div className="h-80">
              {datosDistribucion.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosDistribucion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="valor"
                      stroke="none"
                    >
                      {datosDistribucion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid #2d4a41' }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {datosDistribucion.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-300 text-sm">{item.nombre}: {item.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate border-2 rounded-xl p-6 hover:border-emerald-500 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">
                Evolución por {periodo === 'semana' ? 'día' : periodo === 'mes' ? 'semana' : 'mes'}
              </h3>
              <FaChartLine className="highlight text-xl" />
            </div>
            <div className="h-80">
              {datosGrafica.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d4a41" />
                    <XAxis dataKey="dia" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid #2d4a41' }}
                      labelStyle={{ color: 'white' }}
                    />
                    <Bar dataKey="reacciones" fill="#60f0d0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comentarios" fill="#bc69b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="publicaciones" fill="#f08060" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No hay datos disponibles para este período
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate border-2 rounded-xl p-6 hover:border-emerald-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-semibold">Tendencia de Actividad</h3>
            <FaChartLine className="highlight text-xl" />
          </div>
          <div className="h-80">
            {datosGrafica.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafica}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d4a41" />
                  <XAxis dataKey="dia" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid #2d4a41' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Line type="monotone" dataKey="reacciones" stroke="#60f0d0" strokeWidth={2} dot={{ fill: '#60f0d0' }} />
                  <Line type="monotone" dataKey="comentarios" stroke="#bc69b8" strokeWidth={2} dot={{ fill: '#bc69b8' }} />
                  <Line type="monotone" dataKey="publicaciones" stroke="#f08060" strokeWidth={2} dot={{ fill: '#f08060' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No hay datos disponibles para este período
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-slate rounded-xl border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm">Total de interacciones generadas</p>
              <p className="text-3xl font-bold text-white">{totalInteracciones}</p>
            </div>
            <div className="text-sm text-gray-400">
              <p>Actualizado al día de hoy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadistica;