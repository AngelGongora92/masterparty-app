import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, addDoc, query, where } from 'firebase/firestore';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Sparkles, Menu, CalendarCheck, Briefcase, ShieldCheck, DollarSign, Building2, Utensils, Gift, Music, Camera, Sofa, Plus, MapPin, Tag, Euro, X, Trash2, Edit } from 'lucide-react';

// =====================================================================
// 1. CONFIGURACIÓN INICIAL DE FIREBASE (REQUIERE VARIABLES GLOBALES)
// =====================================================================

// Se asume que estas variables globales son inyectadas por el entorno de Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-masterparty-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;

if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // Para depuración, se puede descomentar si es necesario:
    // import { setLogLevel } from 'firebase/firestore';
    // setLogLevel('debug'); 
}

// Lista de Categorías de Servicio
const serviceCategories = ['Lugar', 'Catering', 'Mobiliario', 'Decoración', 'Música/DJ', 'Fotografía', 'Transporte', 'Otros'];

// =====================================================================
// 2. COMPONENTES DE VISTA ESPECÍFICOS
// =====================================================================

/**
 * Vista de la página de inicio para el cliente. (Sin cambios mayores)
 */
const ClientHomeView = ({ userId }) => {
    // Hooks de estado para manejar la selección de filtros del cliente (Fecha y Tipo)
    const [eventDate, setEventDate] = useState('2024-12-31');
    const [serviceType, setServiceType] = useState('Lugar');

    // Maneja la acción de búsqueda
    const handleFormSubmit = (e) => {
        e.preventDefault();
        alert(`Búsqueda simulada. Se buscaría en Firestore la disponibilidad para ${eventDate} y tipo: ${serviceType}.`);
    };

    const categories = serviceCategories.map(name => {
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
                                    type="date" 
                                    id="date-input" 
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
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
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 appearance-none h-12"
                                >
                                    {serviceCategories.map(cat => <option key={cat}>{cat}</option>)}
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
                
                <div className="flex space-x-4 px-4 overflow-x-auto horizontal-scroll-container sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:space-x-0 sm:gap-6">
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

// --- Sub-Componentes del Prestador ---

/**
 * Formulario para crear o editar un servicio.
 */
const ServiceForm = ({ userId, onServiceAdded }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState(serviceCategories[0]);
    const [zone, setZone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;

        setLoading(true);
        try {
            const newService = {
                vendorId: userId,
                name,
                description,
                price: parseFloat(price),
                type,
                zone,
                createdAt: Date.now(),
            };

            // Guardar el servicio en la colección pública de servicios
            const servicesRef = collection(db, `artifacts/${appId}/public/data/services`);
            await addDoc(servicesRef, newService);

            // Limpiar formulario y notificar
            alert('¡Servicio Publicado con éxito!');
            setName('');
            setDescription('');
            setPrice('');
            setZone('');
            
            if (onServiceAdded) onServiceAdded();

        } catch (error) {
            console.error("Error al publicar el servicio:", error);
            alert(`Error al publicar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200">
            <h2 className="text-2xl font-black text-violet-700 mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-pink-500" /> Publicar Nuevo Servicio
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre del Servicio */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción Detallada</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                        rows="3"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"
                    ></textarea>
                </div>

                {/* Fila de Tipo, Precio y Zona */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tipo de Servicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Tag className="w-4 h-4 text-violet-500" /> Tipo</label>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)} 
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"
                        >
                            {serviceCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Precio Base */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Euro className="w-4 h-4 text-violet-500" /> Precio Base (USD/MXN)</label>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)} 
                            required 
                            min="0"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"
                        />
                    </div>

                    {/* Zona/Ubicación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><MapPin className="w-4 h-4 text-violet-500" /> Zona de Servicio</label>
                        <input 
                            type="text" 
                            value={zone} 
                            onChange={(e) => setZone(e.target.value)} 
                            required 
                            placeholder="Ej: Zona Norte, Centro Histórico"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"
                        />
                    </div>
                </div>

                {/* Botón de Publicar */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:bg-pink-300 disabled:cursor-not-allowed transition"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Publicando...
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            Publicar Servicio
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

/**
 * Muestra la lista de servicios publicados por el Prestador.
 */
const ServiceList = ({ userId }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId) return;

        // Definir la ruta de la colección pública de servicios
        const servicesCollectionRef = collection(db, `artifacts/${appId}/public/data/services`);
        
        // Crear una consulta para obtener solo los servicios del usuario actual
        // Necesita un índice compuesto en Firestore: vendorId (asc) y createdAt (desc)
        const q = query(
            servicesCollectionRef, 
            where("vendorId", "==", userId)
            // En una app real, aquí se usaría orderBy('createdAt', 'desc')
        );

        // Suscribirse a los cambios en tiempo real
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedServices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Ordenar en el cliente (para evitar el error de índice de orderBy en este entorno)
            fetchedServices.sort((a, b) => b.createdAt - a.createdAt);
            
            setServices(fetchedServices);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener servicios:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    // Función para manejar la eliminación (placeholder)
    const handleDelete = (serviceId, serviceName) => {
        // Usamos window.confirm en lugar de confirm() o alert() para evitar problemas en el entorno de iframe
        if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio: ${serviceName}?`)) {
            // Se debe usar un modal personalizado en lugar de window.confirm() en un entorno de producción
            alert(`Simulando eliminación del servicio: ${serviceId}. Esto sería un deleteDoc() en Firestore.`);
            // Implementación futura: await deleteDoc(doc(db, servicesCollectionRef, serviceId));
        }
    };
    
    // Función para manejar la edición (placeholder)
    const handleEdit = (service) => {
         alert(`Simulando edición del servicio: ${service.name}. Esto abriría el formulario de edición.`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10 text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mr-3"></div>
                Cargando tus servicios...
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-black text-violet-700 mb-4">
                Tus Publicaciones ({services.length})
            </h2>
            
            {services.length === 0 ? (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-center">
                    Aún no tienes servicios publicados. ¡Usa el formulario de arriba para empezar!
                </div>
            ) : (
                <div className="space-y-4">
                    {services.map(service => (
                        <div key={service.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center modern-shadow">
                            <div className="flex-grow mb-3 sm:mb-0">
                                <h3 className="font-bold text-lg text-violet-800">{service.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Tag className="w-4 h-4 text-pink-500" /> {service.type} - 
                                    <MapPin className="w-4 h-4 text-pink-500 ml-2" /> {service.zone}
                                </p>
                                <p className="text-xl font-extrabold text-pink-600 mt-1">${service.price}</p>
                            </div>
                            <div className="flex space-x-2">
                                {/* Botones de acción */}
                                <button 
                                    onClick={() => handleEdit(service)}
                                    className="p-2 bg-violet-100 text-violet-600 rounded-full hover:bg-violet-200 transition"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(service.id, service.name)}
                                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


/**
 * Vista principal para el Prestador de Servicios.
 */
const VendorDashboardView = ({ userId }) => {
    // Estado para forzar la recarga de la lista después de añadir un servicio
    const [refreshKey, setRefreshKey] = useState(0); 

    const forceRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);
    
    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-violet-800 mb-6 flex items-center gap-2">
                <Briefcase className="w-7 h-7 text-pink-500" /> Panel del Prestador
            </h1>
            <p className="text-gray-600 mb-6">Tu control maestro para gestionar servicios y disponibilidad.</p>
            
            {/* Formulario de Nuevo Servicio */}
            <ServiceForm userId={userId} onServiceAdded={forceRefresh} />
            
            {/* Gestión de Disponibilidad (PRÓXIMO PASO) */}
            <div className="mt-8 p-6 bg-white rounded-xl modern-shadow border-t-4 border-pink-500">
                 <h2 className="text-2xl font-black text-pink-700 mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6" /> Calendario y Disponibilidad
                </h2>
                <p className="text-gray-700">
                    <span className="font-bold text-violet-600">PRÓXIMO PASO CRÍTICO:</span> Aquí implementaremos la interfaz de calendario para que puedas **bloquear fechas** y asegurar que los clientes solo vean tus servicios cuando estás disponible.
                </p>
            </div>

            {/* Listado de Servicios */}
            <ServiceList userId={userId} key={refreshKey} />
            
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
    const [userRole, setUserRole] = useState('cliente'); // Estado para simular el rol

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

        const handleAuth = async () => {
            try {
                // 1. Intenta autenticar con el token si está disponible
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    // 2. Si no hay token, inicia sesión anónimamente
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Error al iniciar sesión en Firebase:", error);
            }
        };

        // 3. Escucha cambios en el estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // 4. Cargar el rol del usuario de Firestore o establecer un valor por defecto
                try {
                    // Ruta de perfil privada: /artifacts/{appId}/users/{userId}/profile/settings
                    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/profile/settings`);
                    const docSnap = await getDoc(userDocRef);
                    
                    if (docSnap.exists() && docSnap.data().role) {
                        setUserRole(docSnap.data().role);
                    } else {
                        // Crear el documento de rol por primera vez si no existe
                        await setDoc(userDocRef, { role: 'cliente', createdAt: Date.now() }, { merge: true });
                        setUserRole('cliente');
                    }
                } catch (e) {
                    console.error("Error al obtener/establecer el rol del usuario:", e);
                }
            }
            setIsAuthReady(true);
        });

        // Ejecutar el manejo de autenticación si aún no se ha iniciado
        if (!user && !isAuthReady) {
            handleAuth();
        }

        return () => unsubscribe();
    }, [isAuthReady]);


    // ----------------------------------------------------
    // Renderizado Condicional
    // ----------------------------------------------------

    if (!isAuthReady) {
        return <LandingView />;
    }

    const renderContent = () => {
        switch (userRole) {
            case 'cliente':
                return <ClientHomeView userId={userId} />;
            case 'prestador':
                return <VendorDashboardView userId={userId} />;
            case 'admin':
                // Implementación futura del panel de Admin
                return <VendorDashboardView userId={userId} />;
            default:
                return <ClientHomeView userId={userId} />;
        }
    };

    return (
        <div className="font-sans">
            {/* ESTILOS GLOBALES MOBILE-FIRST */}
            {/* FIX: Se eliminan los atributos 'jsx' y 'global' del tag <style> para evitar warnings de React en entornos no-styled-jsx. */}
            <style>{`
                /* Fuente Inter y fondo */
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #fcfcfd;
                }
                /* Degradado del Hero (Violeta y Rosa) */
                .hero-background {
                    background: linear-gradient(135deg, rgba(109, 40, 217, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%), url('https://placehold.co/1200x400/6D28D9/FFFFFF?text=Fondo+MasterParty') center center/cover;
                    background-blend-mode: multiply;
                }
                /* Sombra suave y moderna (Material Suave) */
                .modern-shadow {
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                }
                /* Botón CTA (Rosa Vibrante) */
                .cta-button {
                    background-color: #EC4899; 
                    transition: background-color 0.3s, transform 0.2s;
                }
                .cta-button:hover {
                    background-color: #DB2777;
                    transform: scale(1.01); 
                }
                /* Ocultar barra de desplazamiento para categorías en móvil */
                .horizontal-scroll-container::-webkit-scrollbar {
                    display: none;
                }
                .horizontal-scroll-container {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            {/* Barra de Navegación */}
            <nav className="bg-white border-b border-gray-100 p-3 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Nombre de la Marca */}
                    <div className="text-xl font-black text-violet-700 flex items-center gap-1 sm:text-2xl">
                        <Sparkles className="text-pink-500 w-5 h-5 sm:w-6 sm:h-6" />
                        MasterParty
                    </div>
                    
                    {/* Selector de Rol (Herramienta de Desarrollo) */}
                    <div className="flex items-center space-x-4">
                        <select 
                            value={userRole} 
                            onChange={(e) => setUserRole(e.target.value)} 
                            className="text-sm bg-violet-100 text-violet-700 font-semibold rounded-lg p-2 border border-violet-300"
                        >
                            <option value="cliente">Cliente</option>
                            <option value="prestador">Prestador</option>
                            <option value="admin">Admin</option>
                        </select>
                        
                        {/* Botón de Acceder/Menú */}
                        <a href="#" className="cta-button text-white px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:block">
                            Acceder
                        </a>
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