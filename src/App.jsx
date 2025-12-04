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
import ProviderSignupForm from './components/common/ProviderSignupForm.jsx';

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
        // Eventos
        'Bodas', 'XV Años', 'Fiestas Infantiles', 'Bautizos', 'Primeras Comuniones', 'Eventos Corporativos', 'Graduaciones', 'Aniversarios', 'Baby Showers', 'Despedidas de Soltero/a', 'Propuestas de Matrimonio',
        // Lugares
        'Salones de Eventos', 'Jardines para Fiestas', 'Haciendas', 'Terrazas para Eventos', 'Quintas', 'Lofts para Fiestas', 'Pool Parties', 'Renta de Yates', 'Espacios Industriales',
        // Comida y Bebida
        'Catering Gourmet', 'Banquetes', 'Taquizas a Domicilio', 'Barras de Snacks', 'Mesas de Dulces y Postres', 'Pasteles Personalizados', 'Food Trucks', 'Coctelería Móvil', 'Baristas de Café', 'Mixólogos', 'Servicio de Parrillada',
        // Entretenimiento
        'Música en Vivo', 'DJ Profesional', 'Mariachis', 'Bandas de Rock', 'Grupos Versátiles', 'Magos y Mentalistas', 'Payasos y Animadores', 'Shows de Stand-up', 'Performance de Fuego', 'Bailarines', 'Karaoke',
        // Decoración y Mobiliario
        'Decoración Temática', 'Arreglos Florales', 'Centros de Mesa', 'Decoración con Globos', 'Mobiliario Lounge', 'Renta de Sillas y Mesas', 'Carpas y Toldos', 'Pistas de Baile Iluminadas', 'Letras Gigantes',
        // Tecnología y Multimedia
        'Iluminación Arquitectónica', 'Sonido Profesional', 'Pantallas LED', 'Proyectores de Video', 'Fotografía Profesional', 'Video y Cinematografía de Eventos', 'Cabinas de Fotos 360', 'Drones para Eventos', 'Transmisión en Vivo',
        // Servicios Adicionales
        'Invitaciones Digitales', 'Planeador de Eventos (Wedding Planner)', 'Coordinador de Día', 'Hostess y Edecanes', 'Valet Parking', 'Seguridad para Eventos', 'Maquillaje y Peinado', 'Renta de Autos Clásicos', 'Animación para Adultos'
    ];

    // Para crear un efecto de scroll infinito, duplicamos la lista de servicios
    // y los dividimos en columnas.
    const numColumns = 7;
    const columns = Array.from({ length: numColumns }, () => []);
    services.forEach((service, index) => {
        columns[index % numColumns].push(service);
    });

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white overflow-hidden">
            {/* Fondo animado con columnas en cascada */}
            <div className="absolute inset-0 z-0 flex justify-center gap-x-4 md:gap-x-8 opacity-20 pointer-events-none">
                {columns.map((column, colIndex) => (
                    <div
                        key={colIndex}
                        className="animate-scroll-vertical"
                        style={{
                            // Duraciones aleatorias para el efecto de paralaje
                            animationDuration: `${Math.random() * 20 + 30}s`,
                            // Alternamos la dirección del scroll
                            animationDirection: colIndex % 2 === 0 ? 'reverse' : 'normal',
                        }}
                    >
                        {/* Duplicamos el contenido DENTRO del div animado para un bucle perfecto */}
                        <div className="flex flex-col space-y-4">
                            {column.map((service, serviceIndex) => <span key={serviceIndex} className="text-lg text-gray-400 whitespace-nowrap">{service}</span>)}
                        </div>
                        <div className="flex flex-col space-y-4" aria-hidden="true">
                            {column.map((service, serviceIndex) => <span key={`dup-${serviceIndex}`} className="text-lg text-gray-400 whitespace-nowrap">{service}</span>)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contenido Principal */}
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-bold text-violet-400 mb-3 tracking-tight">Master Party</h1>
                <p className="text-xl md:text-2xl font-light text-pink-400 mb-12">El control maestro de tu celebración.</p>
                <p className="text-2xl md:text-3xl font-light animate-pulse">Muy pronto...</p>
            </div>

            {/* Formulario para proveedores */}
            <div className="relative z-10 mt-16 w-full max-w-lg px-4">
                <ProviderSignupForm />
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