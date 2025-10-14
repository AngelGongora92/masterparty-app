import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, userRoles, isAuthReady } = useAuth();
    const location = useLocation();

    if (!isAuthReady) {
        // Muestra un loader o null mientras se verifica la autenticación.
        // App.jsx se encarga de mostrar la LandingView global.
        return null;
    }

    if (!user) {
        // Si no está autenticado, redirige a login, guardando la ruta a la que intentaba acceder.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasRequiredRole = allowedRoles ? allowedRoles.some(role => userRoles.includes(role)) : true;

    if (!hasRequiredRole) {
        // Si el usuario está logueado pero no tiene el rol, lo mandamos a la página principal.
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;