import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from './firebase.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import NavigationBar from './components/navigation/NavigationBar.jsx';
import Footer from './components/common/Footer.jsx';
import LoginScreen from './components/auth/LoginScreen.jsx';
import RegisterScreen from './components/auth/RegisterScreen.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/navigation/MainLayout.jsx';
import AccountView from './components/account/AccountView.jsx';
import AccountDisplayView from './components/account/AccountDisplayView.jsx';
import BecomeProviderView from './components/account/BecomeProviderView.jsx';
import EditProviderView from './components/vendor/EditProviderView.jsx';
import VendorDashboardView from './components/vendor/VendorDashboard.jsx';
import CategoryManagerPage from './components/admin/CategoryManagerPage.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';
import ClientHomeView from './components/client/ClientHomeView.jsx';
import FullCalendarManager from './components/vendor/FullCalendarManager.jsx';
import NewServicePage from './components/vendor/NewServicePage.jsx';
import SearchResultsView from './components/client/SearchResultsView.jsx';
import ServiceDetailModal from './components/client/ServiceDetailModal.jsx';
import VendorBookingsView from './components/vendor/VendorBookingsView.jsx';
import ClientBookingsView from './components/client/ClientBookingsView.jsx';
import VendorStorefrontView from './components/vendor/VendorStorefrontView.jsx';

// =====================================================================
// 1. CONFIGURACIÓN INICIAL
// =====================================================================
// =====================================================================
// 2. COMPONENTES DE VISTA ESPECÍFICOS
// =====================================================================

/**
 * Vista de Bienvenida/Login simple.
 */
export const LandingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-violet-700 text-white">
        <Sparkles className="w-12 h-12 text-pink-400 mb-4" />
        <h1 className="text-4xl font-extrabold mb-4">Master Party</h1>
        <p className="text-lg mb-8">Cargando los mejores servicios para tu evento...</p>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
    </div>
);

/**
 * Vista temporal de "Próximamente".
 */
const ComingSoonView = () => {
    const services = [
        // Tipos de Evento
        'Bodas', 'XV Años', 'Sweet 16', 'XV años', 'Fiestas Infantiles', 'Bautizos', 'Primeras Comuniones', 'Eventos Corporativos',
        // Lugares
        'Salones de Eventos', 'Jardines para Eventos', 'Haciendas', 'Terrazas',
        // Comida y Bebida
        'Catering', 'Banquetes', 'Taquizas', 'Barras de Snacks', 'Mesas de Dulces', 'Pasteles', 'Food Trucks', 'Coctelería',
        // Entretenimiento
        'Música en Vivo', 'DJ', 'Magos', 'Payasos', 'Show Infantil', 'Animadores', 'Bandas Musicales',
        // Servicios y Decoración
        'Decoración', 'Globos', 'Mobiliario', 'Renta de Sillas y Mesas', 'Carpas y Lonas', 'Pistas de Baile', 'Iluminación Profesional',
        // Multimedia
        'Fotografía', 'Video', 'Cabinas de Fotos',
        // Otros
        'Invitaciones', 'Planeador de Eventos'
    ];

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white overflow-hidden">
            {/* Contenedor de palabras animadas */}
            <div className="absolute inset-0 z-0">
                {services.map((service, index) => {
                    const style = {
                        left: `${Math.random() * 90}%`,
                        animationDuration: `${Math.random() * 10 + 10}s`, // Duración entre 10s y 20s
                        animationDelay: `${Math.random() * 15}s`, // Retraso hasta 15s
                        fontSize: `${Math.random() * 1 + 1}rem`, // Tamaño de fuente entre 1rem y 2rem
                    };
                    return (
                        <span
                            key={index}
                            className="absolute bottom-0 opacity-0 text-gray-400/40 animate-float-up"
                            style={style}
                        >
                            {service}
                        </span>
                    );
                })}
            </div>

            {/* Contenido Principal */}
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-5xl md:text-6xl font-extrabold text-violet-400 mb-3">Master Party</h1>
                <p className="text-xl md:text-2xl text-pink-400 mb-12">El control maestro de tu celebración.</p>
                <p className="text-2xl md:text-3xl font-light animate-pulse">Muy pronto...</p>
            </div>
        </div>
    );
};

// =====================================================================
// 3. COMPONENTE PRINCIPAL (APP)
// =====================================================================
const AppContent = () => {
    const { user, activeRole, isAuthReady } = useAuth();
    const [serviceCategories, setServiceCategories] = useState({}); // Categorías de servicio dinámicas

    useEffect(() => {
        const publicDataDocRef = doc(db, `artifacts/${appId}/public/data`);

        const unsubscribe = onSnapshot(publicDataDocRef, (docSnap) => {
            if (docSnap.exists() && typeof docSnap.data().service_categories === 'object') {
                setServiceCategories(docSnap.data().service_categories);
            }
        }, (error) => {
            console.error("Error al cargar las categorías de servicio:", error);
        });

        return () => unsubscribe();
    }, []);

    if (!isAuthReady) {
        return <LandingView />;
    }

    return (
        <Routes>
            {/* Rutas públicas y de autenticación */}
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />

            {/* Rutas principales con NavigationBar y Footer */}
            <Route element={<MainLayout />}>
                {/* Ruta principal (Home) */}
                <Route 
                    path="/" 
                    element={
                        user && activeRole === 'prestador' ? <Navigate to="/vendor/dashboard" replace /> :
                        user && activeRole === 'admin' ? <Navigate to="/admin" replace /> :
                        <ClientHomeView serviceCategories={serviceCategories} />
                    } 
                />
                <Route path="/search" element={<SearchResultsView />} />
                <Route path="/store/:slug" element={<VendorStorefrontView serviceCategories={serviceCategories} />} />

                {/* Rutas Protegidas */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/account" element={<AccountDisplayView />} />
                    <Route path="/account/edit" element={<AccountView />} />
                    <Route path="/my-bookings" element={<ClientBookingsView />} />
                    <Route path="/account/become-provider" element={<BecomeProviderView />} />
                </Route>

                {/* Rutas de Proveedor */}
                <Route element={<ProtectedRoute allowedRoles={['prestador', 'admin']} />}>
                    <Route path="/vendor/dashboard" element={<VendorDashboardView serviceCategories={serviceCategories} />} />
                    <Route path="/vendor/calendar" element={<FullCalendarManager />} />
                    <Route path="/vendor/services/new" element={<NewServicePage />} />
                    <Route path="/vendor/bookings" element={<VendorBookingsView />} />
                    <Route path="/vendor/edit-profile" element={<EditProviderView />} />
                </Route>

                {/* Rutas de Administrador */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/admin/categories" element={<CategoryManagerPage />} />
                </Route>

                {/* Ruta para cualquier otra URL no encontrada */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <ComingSoonView />
        // <AuthProvider>
        //     <BrowserRouter>
        //         <AppContent />
        //     </BrowserRouter>
        // </AuthProvider>
    );
}