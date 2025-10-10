import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Sparkles, Menu, CalendarCheck, Briefcase, ShieldCheck, DollarSign, Building2, Utensils, Gift, Music, Camera, Sofa, Plus, MapPin, Tag, Euro, X, Trash2, Edit, User, Users, ArrowLeft } from 'lucide-react';
import { auth, db, appId } from './firebase.js';
import LoginScreen from './components/auth/LoginScreen.jsx';
import RegisterScreen from './components/auth/RegisterScreen.jsx';
import AccountView from './components/account/AccountView.jsx';
import AccountDisplayView from './components/account/AccountDisplayView.jsx';
import BecomeProviderView from './components/account/BecomeProviderView.jsx';
import VendorDashboardView from './components/vendor/VendorDashboard.jsx';
import CategoryManagerPage from './components/admin/CategoryManagerPage.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';
import ClientHomeView from './components/client/ClientHomeView.jsx';
import FullCalendarManager from './components/vendor/FullCalendarManager.jsx';
import SearchResultsView from './components/client/SearchResultsView.jsx';
import ServiceDetailModal from './components/client/ServiceDetailModal.jsx';

// =====================================================================
// 1. CONFIGURACIÓN INICIAL
// =====================================================================

// La lista de categorías ahora se carga dinámicamente desde Firestore en el componente App.

// =====================================================================
// 2. COMPONENTES DE VISTA ESPECÍFICOS
// =====================================================================

/**
 * Vista de Bienvenida/Login simple.
 */
const LandingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-violet-700 text-white">
        <Sparkles className="w-12 h-12 text-pink-400 mb-4" />
        <h1 className="text-4xl font-extrabold mb-4">MasterParty Pro</h1>
        <p className="text-lg mb-8">Cargando los mejores servicios para tu evento...</p>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
    </div>
);


// =====================================================================
// 3. COMPONENTE PRINCIPAL (APP)
// =====================================================================

export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRoles, setUserRoles] = useState([]); // Almacena todos los roles del usuario
    const [userData, setUserData] = useState(null); // Almacena datos del perfil del usuario
    const [activeRole, setActiveRole] = useState('cliente'); // El rol/vista que el usuario está usando (cliente, prestador)
    const [authView, setAuthView] = useState('login'); // 'login' o 'register'
    const [serviceCategories, setServiceCategories] = useState({}); // Categorías de servicio dinámicas
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'accountDisplay', 'accountEdit', 'becomeProvider', 'manageCategories'
    const [searchResults, setSearchResults] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const userId = user?.uid || 'guest';

    // ----------------------------------------------------
    // Efecto 1: Inicialización de Firebase y Autenticación
    // ----------------------------------------------------
    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth no está inicializado.");
            setIsAuthReady(true);
            return;
        }

        // Escucha cambios en el estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Cargar los roles y datos del usuario de Firestore
                try {
                    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/profile/settings`);
                    const docSnap = await getDoc(userDocRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data); // Guardar datos del perfil
                        const roles = data.roles || [];
                        setUserRoles(roles);
                        // Mantiene el rol activo si es válido, si no, vuelve a cliente
                        setActiveRole(prevActiveRole => roles.includes(prevActiveRole) ? prevActiveRole : 'cliente');
                    } else {
                        // Fallback si el perfil no existe (no debería pasar con el flujo actual)
                        await setDoc(userDocRef, { roles: ['cliente'], createdAt: Date.now() }, { merge: true });
                        setUserData({ roles: ['cliente'] });
                        setUserRoles(['cliente']);
                        setActiveRole('cliente');
                    }
                } catch (e) {
                    console.error("Error al obtener/establecer los roles del usuario:", e);
                    setUserRoles(['cliente']); // Fallback a cliente en caso de error
                    setUserData(null);
                    setActiveRole('cliente');
                }
            } else {
                // Resetear estados al cerrar sesión
                setUserRoles([]);
                setUserData(null);
                setActiveRole('cliente');
                setActiveView('dashboard'); // Vuelve a la vista principal al cerrar sesión
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe(); // Se ejecuta al desmontar el componente
    }, []); // Este efecto solo debe correr una vez al montar el componente

    // ----------------------------------------------------
    // Efecto 2: Carga de Categorías de Servicio
    // ----------------------------------------------------
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

    // Efecto para resetear la vista cuando el usuario cierra sesión
    useEffect(() => {
        if (!user) {
            setActiveView('dashboard'); // Resetea a la vista principal al salir
            setActiveRole('cliente');
            setIsMenuOpen(false);
        }
    }, [user]);


    // ----------------------------------------------------
    // Renderizado Condicional
    // ----------------------------------------------------

    if (!isAuthReady) {
        return <LandingView />;
    }

    const renderContent = () => {
        if (activeView === 'accountDisplay') {
            return <AccountDisplayView 
                        userId={userId} 
                        onBack={() => setActiveView('dashboard')} 
                        onEdit={() => setActiveView('accountEdit')} 
                        onBecomeProvider={() => setActiveView('becomeProvider')}
                    />;
        }
        if (activeView === 'accountEdit') {
            return <AccountView userId={userId} onBack={() => setActiveView('accountDisplay')} />;
        }
        if (activeView === 'becomeProvider') {
            return <BecomeProviderView userId={userId} onBack={() => setActiveView('accountDisplay')} />;
        }
        if (activeView === 'manageCategories') {
            return <CategoryManagerPage onBack={() => setActiveView('dashboard')} />;
        }
        if (activeView === 'adminPanel') {
            return <AdminPanel onBack={() => setActiveView('dashboard')} onManageCategories={() => setActiveView('manageCategories')} />;
        }
        if (activeView === 'fullCalendarManager') {
            return <FullCalendarManager userId={userId} onBack={() => setActiveView('dashboard')} />;
        }
        if (activeView === 'searchResults') {
            return <SearchResultsView searchResults={searchResults} onBack={() => setActiveView('dashboard')} />;
        }

        // Lógica de renderizado principal
        if (user) {
            switch (activeRole) {
                case 'prestador':
                    return <VendorDashboardView userId={userId} serviceCategories={serviceCategories} onManageCalendar={() => setActiveView('fullCalendarManager')} />;
                case 'admin':
                    // Implementación futura del panel de Admin
                    return <VendorDashboardView userId={userId} serviceCategories={serviceCategories} onManageCalendar={() => setActiveView('fullCalendarManager')} onManageCategories={() => setActiveView('manageCategories')} />;
                case 'cliente':
                default:
                    return <ClientHomeView userId={userId} serviceCategories={serviceCategories} onSearchResults={(results) => { setSearchResults(results); setActiveView('searchResults'); }} />;
            }
        } else {
            // Vistas para usuarios no logueados
            if (activeView === 'login') return <LoginScreen onSwitchView={() => setActiveView('register')} />;
            if (activeView === 'register') return <RegisterScreen onSwitchView={() => setActiveView('login')} />;
            // Por defecto, mostrar la vista de cliente
            return <ClientHomeView userId={userId} serviceCategories={serviceCategories} onSearchResults={(results) => { setSearchResults(results); setActiveView('searchResults'); }} />;
        }
    };

    return (
        <div className="font-sans">
            {/* Barra de Navegación */}
            <nav className="bg-white border-b border-gray-100 p-3 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Nombre de la Marca */}
                    <button
                        onClick={() => {
                            setActiveView('dashboard');
                            setActiveRole('cliente');
                        }}
                        className="text-xl font-black text-violet-700 flex items-center gap-1 sm:text-2xl cursor-pointer"
                    >
                        <Sparkles className="text-pink-500 w-5 h-5 sm:w-6 sm:h-6" />
                        MasterParty
                    </button>
                    
                    {/* Acciones de Usuario */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                {userData?.firstName && (
                                    <span className="font-semibold text-gray-600 hidden sm:block">
                                        Hola {userData.firstName},
                                    </span>
                                )}
                                {/* Saludo para móvil */}
                                {userData?.firstName && (
                                    <span className="font-semibold text-gray-600 text-sm sm:hidden">
                                        Hola {userData.firstName},
                                    </span>
                                )}
                                {userRoles.includes('admin') && (
                                     <button
                                        onClick={() => setActiveView('adminPanel')}
                                        className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Panel Admin
                                    </button>
                                )}
                                {userRoles.includes('cliente') && activeRole === 'prestador' && (
                                    <button
                                        onClick={() => {
                                            setActiveRole('cliente');
                                            setActiveView('dashboard');
                                        }}
                                        className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >
                                        <Users className="w-4 h-4" />
                                        Modo Cliente
                                    </button>
                                )}
                                {userRoles.includes('prestador') && activeRole === 'cliente' && (
                                     <button
                                        onClick={() => {
                                            setActiveRole('prestador');
                                            setActiveView('dashboard');
                                        }}
                                        className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        Panel Proveedor
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveView('accountDisplay')}
                                    className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    Mi Cuenta
                                </button>
                                <button
                                    onClick={() => signOut(auth)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:block"
                                >
                                    Salir
                                </button>
                                <button 
                                    className="sm:hidden text-gray-700 text-xl p-1"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </>
                        ) : (
                            activeView === 'login' || activeView === 'register' ? (
                                <button
                                    onClick={() => setActiveView('dashboard')}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-md font-semibold text-sm flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setActiveView('login')}
                                        className="cta-button text-white px-4 py-2 rounded-xl shadow-md font-semibold text-sm"
                                    >
                                        Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={() => setActiveView('register')}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-md font-semibold text-sm hidden sm:block"
                                    >
                                        Registrarse
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>

                {/* Menú Móvil Desplegable */}
                {user && isMenuOpen && (
                    <div className="sm:hidden mt-3 space-y-2 pb-4 border-t border-gray-200">
                        {userRoles.includes('admin') && (
                             <button
                                onClick={() => { setActiveView('adminPanel'); setIsMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-md font-medium text-yellow-800 hover:bg-yellow-50 flex items-center gap-2"
                            >
                                <ShieldCheck className="w-5 h-5" /> Panel Admin
                            </button>
                        )}
                        {userRoles.includes('cliente') && activeRole === 'prestador' && (
                            <button
                                onClick={() => { setActiveRole('cliente'); setActiveView('dashboard'); setIsMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <Users className="w-5 h-5" /> Modo Cliente
                            </button>
                        )}
                        {userRoles.includes('prestador') && activeRole === 'cliente' && (
                             <button
                                onClick={() => { setActiveRole('prestador'); setActiveView('dashboard'); setIsMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <Briefcase className="w-5 h-5" /> Panel Proveedor
                            </button>
                        )}
                        <button
                            onClick={() => { setActiveView('accountDisplay'); setIsMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <User className="w-5 h-5" /> Mi Cuenta
                        </button>
                        <button
                            onClick={() => signOut(auth)}
                            className="w-full text-left px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            Salir
                        </button>
                    </div>
                )}
            </nav>

            {/* Contenido según el rol */}
            {renderContent()}

            {/* Footer */}
            <footer className="py-6 bg-gray-800 text-white text-center">
                <p className="text-sm">&copy; 2024 MasterParty. Desarrollado con Firebase y React.</p>
            </footer>
        </div>
    );
}

// Nota: No se requiere ReactDOM.render() en este entorno.