import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../src/config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Configurar axios con el token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Verificar si hay usuario guardado al cargar
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado && token) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch (e) {
                console.error('Error parsing usuario:', e);
                localStorage.removeItem('usuario');
            }
        }
        setLoading(false);
    }, [token]);

    // Login
    const login = async (correo, contrasena) => {
        try {
            const response = await axios.post(`${API_URL}/api/usuarios/login`, {
                correo,
                contrasena
            });

            const { token: nuevoToken, usuario: usuarioData } = response.data;

            setToken(nuevoToken);
            setUsuario(usuarioData);
            localStorage.setItem('token', nuevoToken);
            localStorage.setItem('usuario', JSON.stringify(usuarioData));

            return { success: true, usuario: usuarioData };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al iniciar sesión'
            };
        }
    };

    // Registro
    const registro = async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/api/usuarios/registro`, userData);

            const { token: nuevoToken, usuario: usuarioData } = response.data;

            setToken(nuevoToken);
            setUsuario(usuarioData);
            localStorage.setItem('token', nuevoToken);
            localStorage.setItem('usuario', JSON.stringify(usuarioData));

            return { success: true, usuario: usuarioData };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al registrarse'
            };
        }
    };

    // Logout
    const logout = () => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        delete axios.defaults.headers.common['Authorization'];
    };

    const actualizarPerfil = async (datos) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/usuarios/perfil`,
                datos,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const { token: nuevoToken, usuario: usuarioActualizado } = response.data;

            setToken(nuevoToken);
            setUsuario(usuarioActualizado);
            localStorage.setItem('token', nuevoToken);
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

            return { success: true, usuario: usuarioActualizado };
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al actualizar perfil'
            };
        }
    };


    const actualizarFotoPerfil = async (formData) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/usuarios/perfil/foto`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Respuesta actualizar foto:', response.data);

            const { token: nuevoToken, usuario: usuarioActualizado } = response.data;

            setToken(nuevoToken);
            setUsuario(usuarioActualizado);
            localStorage.setItem('token', nuevoToken);
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

            return { success: true, usuario: usuarioActualizado };
        } catch (error) {
            console.error('Error actualizando foto:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al actualizar foto'
            };
        }
    };

    const value = {
        usuario,
        token,
        loading,
        login,
        registro,
        logout,
        actualizarPerfil,
        actualizarFotoPerfil,
        isAuthenticated: !!usuario && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};