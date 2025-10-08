import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Sparkles, Menu, CalendarCheck, Briefcase, ShieldCheck, DollarSign, Building2, Utensils, Gift, Music, Camera, Sofa, Plus, MapPin, Tag, Euro, X, Trash2, Edit, User, Users } from 'lucide-react';
import { auth, db, appId } from './firebase';
import LoginScreen from './LoginScreen.jsx';
import RegisterScreen from './RegisterScreen.jsx';
import AccountView from './AccountView.jsx';
import AccountDisplayView from './AccountDisplayView.jsx';
import BecomeProviderView from './BecomeProviderView.jsx';
import VendorDashboardView from './VendorDashboard.jsx';
import CategoryManagerPage from './CategoryManagerPage.jsx';

// =====================================================================
// 1. CONFIGURACIÓN INICIAL
// =====================================================================

// La lista de categorías ahora se carga dinámicamente desde Firestore en el componente App.

// =====================================================================
// 2. COMPONENTES DE VISTA ESPECÍFICOS
// =====================================================================

/**
 * Vista de la página de inicio para el cliente. (Sin cambios mayores)
 */
const ClientHomeView = ({ userId, serviceCategories }) => {
    // Hooks de estado para manejar la selección de filtros del cliente (Fecha y Tipo)
    const [eventDate, setEventDate] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');

    // Maneja la acción de búsqueda
    const handleFormSubmit = (e) => {
        e.preventDefault();
        alert(`Búsqueda simulada. Se buscaría en Firestore la disponibilidad para ${eventDate}, categoría: ${mainCategory}, servicio: ${subCategory}.`);
    };

    const categories = Object.keys(serviceCategories).map(name => {
        let icon;
        switch(name) {
            case 'Lugar': icon = Building2; break;
            case 'Catering': icon = Utensils; break;
            case 'Mobiliario': icon = Sofa; break;
            case 'Decoración': icon = Gift; break;
            case 'Música/DJ': icon = Music; break;
            case 'Fotografía': icon = Camera; break;
            default: icon = Briefcase;
        }
        return { name, icon };
    });

    return (
        <div className="min-h-screen">
            {/* Sección Principal (Hero Compacto) */}
            <header className="hero-background pt-12 pb-16 sm:pt-20 sm:pb-32 text-white">
                <div className="max-w-5xl mx-auto text-center px-4">
                    <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        El Control Maestro de tu Celebración
                    </h1>
                    <p className="text-base sm:text-xl font-light opacity-95">
                        Proveedor de élite con disponibilidad confirmada.
                    </p>
                </div>
            </header>

            {/* Tarjeta de Búsqueda (CRÍTICA) */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transform -translate-y-12">
                <div className="bg-white p-6 sm:p-8 rounded-2xl modern-shadow w-full border-2 border-pink-500/20">
                    <h3 className="text-gray-900 text-xl font-black mb-4 text-left">Busca por Fecha y Servicio</h3>
                    
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Campo Fecha (CRÍTICO) */}
                        <div className="md:col-span-2">
                            <label htmlFor="date-input" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Fecha de tu Evento</label>
                            <div className="relative">
                                <CalendarCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                                <input
                                    type={eventDate ? "date" : "text"}
                                    id="date-input"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    onFocus={(e) => e.target.type = 'date'}
                                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                                    placeholder="Todas las fechas"
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 h-12"
                                />
                            </div>
                        </div>
                        
                        {/* Campo Tipo de Servicio */}
                        <div className="md:col-span-1">
                            <label htmlFor="type-select" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Tipo de Servicio</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                                <select 
                                    id="type-select" 
                                    value={mainCategory}
                                    onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); }}
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 appearance-none h-12"
                                >
                                    <option value="">Categorías</option>
                                    {Object.keys(serviceCategories).map(cat => <option key={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Campo Sub-Categoría */}
                        <div className="md:col-span-1">
                            <label htmlFor="subtype-select" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Servicio</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                                <select 
                                    id="subtype-select" 
                                    value={subCategory}
                                    onChange={(e) => setSubCategory(e.target.value)}
                                    disabled={!mainCategory}
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 appearance-none h-12 disabled:bg-gray-100"
                                >
                                    <option value="">Todos</option>
                                    {(serviceCategories[mainCategory] || []).map(sub => <option key={sub}>{sub}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {/* Botón de Búsqueda */}
                        <div className="md:col-span-1 flex items-end mt-2 md:mt-0">
                            <button type="submit" className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-xl flex justify-center items-center gap-2 h-12">
                                <Search className="w-5 h-5" />
                                Buscar
                            </button>
                        </div>
                    </form>
                    <p className="text-xs text-gray-500 mt-3 text-right italic">
                        ID de Usuario: {userId}
                    </p>
                </div>
            </div>

            {/* Sección de Categorías Destacadas */}
            <section className="py-12 max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-6 px-4 sm:px-0">Explora por Categoría</h2>
                
                <div className="flex space-x-4 px-4 pb-4 overflow-x-auto horizontal-scroll-container sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:space-x-0 sm:gap-6">
                    {categories.map((cat) => (
                        <div 
                            key={cat.name}
                            onClick={() => alert(`Simulando búsqueda por categoría: ${cat.name}`)}
                            className="category-card flex-shrink-0 w-[120px] sm:w-auto text-center p-4 bg-white rounded-xl border border-gray-200 modern-shadow hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1"
                        >
                            <cat.icon className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                            <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-8 text-center">Nuestras Ventajas MasterParty</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Beneficio 1 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <CalendarCheck className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Disponibilidad en Vivo</h3>
                            <p className="text-sm text-gray-600">Filtra servicios que realmente están libres para tu fecha.</p>
                        </div>
                        {/* Beneficio 2 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <ShieldCheck className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Garantía de Calidad</h3>
                            <p className="text-sm text-gray-600">Solo proveedores pre-aprobados y verificados.</p>
                        </div>
                        {/* Beneficio 3 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <DollarSign className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Precios sin Sorpresas</h3>
                            <p className="text-sm text-gray-600">Compara tarifas finales de forma transparente.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

/**
 * Vista de Bienvenida/Login simple.
 */
const LandingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-violet-700 text-white">
        <Sparkles className="w-12 h-12 text-pink-400 mb-4" />
        <h1 className="text-4xl font-extrabold mb-4">MasterParty Pro</h1>
        <p className="text-lg mb-8">Cargando aplicación y autenticación...</p>
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
    const [activeRole, setActiveRole] = useState('cliente'); // El rol/vista que el usuario está usando
    const [authView, setAuthView] = useState('login'); // 'login' o 'register'
    const [serviceCategories, setServiceCategories] = useState({}); // Categorías de servicio dinámicas
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'accountDisplay', 'accountEdit', 'becomeProvider', 'manageCategories'

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
                // Cargar los roles del usuario de Firestore
                try {
                    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/profile/settings`);
                    const docSnap = await getDoc(userDocRef);
                    
                    if (docSnap.exists() && docSnap.data().roles) {
                        const roles = docSnap.data().roles;
                        setUserRoles(roles);
                        // Mantiene el rol activo si es válido, si no, vuelve a cliente
                        setActiveRole(prevActiveRole => roles.includes(prevActiveRole) ? prevActiveRole : 'cliente');
                    } else {
                        // Fallback si el perfil no existe (no debería pasar con el flujo actual)
                        await setDoc(userDocRef, { roles: ['cliente'], createdAt: Date.now() }, { merge: true });
                        setUserRoles(['cliente']);
                        setActiveRole('cliente');
                    }
                } catch (e) {
                    console.error("Error al obtener/establecer los roles del usuario:", e);
                    setUserRoles(['cliente']); // Fallback a cliente en caso de error
                    setActiveRole('cliente');
                }
            } else {
                // Resetear estados al cerrar sesión
                setUserRoles([]);
                setActiveRole('cliente');
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
        }
    }, [user]);


    // ----------------------------------------------------
    // Renderizado Condicional
    // ----------------------------------------------------

    if (!isAuthReady) {
        return <LandingView />;
    }

    if (!user) {
        if (authView === 'login') {
            return <LoginScreen onSwitchView={setAuthView} />;
        }
        if (authView === 'register') {
            return <RegisterScreen onSwitchView={setAuthView} />;
        }
    }

    const handleSwitchToProviderView = () => {
        setActiveRole('prestador');
        setActiveView('dashboard'); // Ir directamente al dashboard del proveedor
    };

    const renderContent = () => {
        if (activeView === 'accountDisplay') {
            return <AccountDisplayView 
                        userId={userId} 
                        onBack={() => setActiveView('dashboard')} 
                        onEdit={() => setActiveView('accountEdit')} 
                        onBecomeProvider={() => setActiveView('becomeProvider')}
                        onSwitchToProviderView={handleSwitchToProviderView}
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

        switch (activeRole) {
            case 'cliente':
                return <ClientHomeView userId={userId} serviceCategories={serviceCategories} />;
            case 'prestador':
                return <VendorDashboardView userId={userId} onSwitchToClientView={() => setActiveRole('cliente')} serviceCategories={serviceCategories} onManageCategories={() => setActiveView('manageCategories')} />;
            case 'admin':
                // Implementación futura del panel de Admin
                return <VendorDashboardView userId={userId} onSwitchToClientView={() => setActiveRole('cliente')} serviceCategories={serviceCategories} onManageCategories={() => setActiveView('manageCategories')} />;
            default:
                return <ClientHomeView userId={userId} serviceCategories={serviceCategories} />;
        }
    };

    return (
        <div className="font-sans">
            {/* Barra de Navegación */}
            <nav className="bg-white border-b border-gray-100 p-3 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Nombre de la Marca */}
                    <div className="text-xl font-black text-violet-700 flex items-center gap-1 sm:text-2xl">
                        <Sparkles className="text-pink-500 w-5 h-5 sm:w-6 sm:h-6" />
                        MasterParty
                    </div>
                    
                    {/* Acciones de Usuario */}
                    <div className="flex items-center space-x-4">
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


                        <button className="sm:hidden text-gray-700 text-xl p-1">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
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