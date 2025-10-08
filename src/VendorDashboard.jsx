import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, onSnapshot, GeoPoint } from 'firebase/firestore';
import { Briefcase, Plus, Users, DollarSign, Trash2, Tag, Edit, CalendarCheck, MapPin, Settings, ChevronDown, Info, MousePointerClick } from 'lucide-react';
import { db, appId } from './firebase';

const loadGoogleMapsScript = (apiKey, callback) => {
    if (window.google && window.google.maps) {
        callback();
        return;
    }
    const existingScript = document.getElementById('googleMapsScript');
    if (existingScript) {
        existingScript.addEventListener('load', callback);
        return;
    }
    const script = document.createElement('script');
    script.id = 'googleMapsScript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
};

const MapPicker = ({ value, onChange }) => {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);
    const markerInstanceRef = React.useRef(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);

    // Efecto para cargar el script de Google Maps
    useEffect(() => {
        loadGoogleMapsScript(import.meta.env.VITE_GOOGLE_MAPS_API_KEY, () => {
            setIsApiLoaded(true);
        });
    }, []);

    // Efecto para inicializar el mapa y el listener de click (solo se ejecuta una vez)
    useEffect(() => {
        if (isApiLoaded && mapRef.current && !mapInstanceRef.current) {
            const initialLatLng = new window.google.maps.LatLng(value.latitude || 25.6866, value.longitude || -100.3161);
            const map = new window.google.maps.Map(mapRef.current, {
                center: initialLatLng,
                zoom: 12,
                disableDefaultUI: true,
                zoomControl: true,
            });
            const marker = new window.google.maps.Marker({ position: initialLatLng, map: map });

            mapInstanceRef.current = map;
            markerInstanceRef.current = marker;

            map.addListener('click', (e) => {
                const newLocation = { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
                onChange(newLocation);
            });
        }
    }, [isApiLoaded, onChange, value.latitude, value.longitude]);

    // Efecto para actualizar la posición del marcador cuando el valor cambia
    useEffect(() => {
        if (markerInstanceRef.current && mapInstanceRef.current && value.latitude && value.longitude) {
            const newLatLng = new window.google.maps.LatLng(value.latitude, value.longitude);
            markerInstanceRef.current.setPosition(newLatLng);
            // Solo centramos el mapa si el cambio es significativo para no interferir con el paneo del usuario
            if (mapInstanceRef.current.getCenter().lat() !== value.latitude || mapInstanceRef.current.getCenter().lng() !== value.longitude) {
                mapInstanceRef.current.panTo(newLatLng);
            }
        }
    }, [value.latitude, value.longitude]);

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

/**
 * Formulario para crear o editar un servicio.
 */
const ServiceForm = ({ userId, onServiceAdded, serviceCategories }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mainCategory: '',
        subCategory: '',
        costPerKm: '',
        freeKmRadius: '',
        capacityTiers: [{ capacity: '', price: '' }],
        location: {
            latitude: '',
            longitude: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const MAX_TIERS = 5;

    // Efecto para obtener la ubicación inicial del usuario
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }
                    }));
                },
                () => {
                    // Si el usuario deniega el permiso, no hacemos nada.
                    // El mapa usará su valor por defecto.
                    console.warn("Permiso de ubicación denegado por el usuario.");
                }
            );
        }
    }, []); // Se ejecuta solo una vez al montar el formulario

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newState = { ...formData, [name]: value };
        if (name === 'mainCategory') {
            newState.subCategory = ''; // Reset subcategory when main category changes
        }
        setFormData(newState);
    };

    const handleLocationChange = (newLocation) => {
        setFormData(prev => ({ ...prev, location: newLocation }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;

        setLoading(true);
        try {
            // Validar que al menos el primer nivel esté completo
            if (!formData.capacityTiers[0].capacity || !formData.capacityTiers[0].price) {
                alert('Por favor, completa al menos el primer nivel de capacidad y precio.');
                setLoading(false);
                return;
            }

            const processedTiers = formData.capacityTiers
                .filter(tier => tier.capacity && tier.price) // Filtrar niveles vacíos
                .map(tier => ({
                    capacity: parseInt(tier.capacity, 10),
                    price: parseFloat(tier.price),
                }));

            const location = new GeoPoint(
                parseFloat(formData.location.latitude), 
                parseFloat(formData.location.longitude)
            );

            const newService = {
                vendorId: userId,
                name: formData.name,
                description: formData.description,
                mainCategory: formData.mainCategory,
                type: formData.subCategory, // 'type' ahora es la sub-categoría
                isActive: true,
                capacityTiers: processedTiers,
                // Guardamos el precio y capacidad base para búsquedas y vistas rápidas
                basePrice: processedTiers[0].price,
                baseCapacity: processedTiers[0].capacity,
                transferFeeRule: {
                    type: 'distance_radius',
                    costPerKm: parseFloat(formData.costPerKm),
                    freeKmRadius: parseInt(formData.freeKmRadius, 10),
                },
                location, // Guardamos el GeoPoint
                imageUrls: [], // Placeholder para futuras imágenes
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            };

            // Guardar el servicio en la colección pública de servicios
            const servicesRef = collection(db, `artifacts/${appId}/public/data/services`);
            await addDoc(servicesRef, newService);

            // Limpiar formulario y notificar
            alert('¡Servicio Publicado con éxito!');
            setFormData({
                name: '',
                description: '',
                mainCategory: '',
                subCategory: '',
                costPerKm: '',
                freeKmRadius: '',
                capacityTiers: [{ capacity: '', price: '' }],
                location: { latitude: '', longitude: '' }
            });

            if (onServiceAdded) onServiceAdded();

        } catch (error) {
            console.error("Error al publicar el servicio:", error);
            alert(`Error al publicar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTierChange = (index, e) => {
        const { name, value } = e.target;
        const newTiers = [...formData.capacityTiers];
        newTiers[index][name] = value;
        setFormData(prev => ({ ...prev, capacityTiers: newTiers }));
    };

    const addTier = () => {
        if (formData.capacityTiers.length < MAX_TIERS) {
            setFormData(prev => ({ ...prev, capacityTiers: [...prev.capacityTiers, { capacity: '', price: '' }] }));
        }
    };

    const removeTier = (index) => {
        setFormData(prev => ({ ...prev, capacityTiers: prev.capacityTiers.filter((_, i) => i !== index) }));
    };

    return (
        <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200">
            <h2 className="text-2xl font-black text-violet-700 mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-pink-500" /> Publicar Nuevo Servicio
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- Detalles Principales --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Detalles Principales</h3>
                    {/* Nombre del Servicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción Detallada</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"></textarea>
                    </div>

                    {/* Categoría y Sub-categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Briefcase className="w-4 h-4 text-violet-500" /> Categoría Principal</label>
                            <select name="mainCategory" value={formData.mainCategory} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border">
                                <option value="">Selecciona una categoría</option>
                                {Object.keys(serviceCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Tag className="w-4 h-4 text-violet-500" /> Tipo de Servicio</label>
                            <select name="subCategory" value={formData.subCategory} onChange={handleChange} required disabled={!formData.mainCategory || serviceCategories[formData.mainCategory]?.length === 0} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border disabled:bg-gray-100">
                                <option value="">Selecciona un servicio</option>
                                {(serviceCategories[formData.mainCategory] || []).map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Niveles de Capacidad y Precio --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Capacidad y Precios</h3>
                    {formData.capacityTiers.map((tier, index) => (
                        <div key={index} className="flex items-end gap-2 p-3 bg-violet-50 rounded-lg">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Users className="w-4 h-4 text-violet-500" /> Capacidad (personas)</label>
                                <input type="number" name="capacity" value={tier.capacity} onChange={(e) => handleTierChange(index, e)} required min="1" placeholder="Ej: 50" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                            </div>
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><DollarSign className="w-4 h-4 text-violet-500" /> Precio ($)</label>
                                <input type="number" name="price" value={tier.price} onChange={(e) => handleTierChange(index, e)} required min="0" placeholder="Ej: 1200" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                            </div>
                            {formData.capacityTiers.length > 1 && (
                                <button type="button" onClick={() => removeTier(index)} className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition h-full">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {formData.capacityTiers.length < MAX_TIERS && (
                        <button type="button" onClick={addTier} className="w-full text-violet-700 font-semibold py-2 px-4 border-2 border-dashed border-violet-300 rounded-lg hover:bg-violet-100 transition flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Añadir otro nivel de capacidad
                        </button>
                    )}
                </div>

                {/* --- Geolocalización y Tarifas de Traslado --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Ubicación y Tarifas de Traslado</h3>
                    <div className="bg-violet-50 border border-violet-200 text-violet-800 p-3 rounded-lg text-sm flex items-start gap-2">
                        <MousePointerClick className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Instrucción:</span> Haz clic en el mapa para seleccionar la ubicación exacta de tu servicio. El marcador se moverá al punto que elijas.
                        </div>
                    </div>
                    <div className="h-64 w-full rounded-lg overflow-hidden border">
                        <MapPicker value={formData.location} onChange={handleLocationChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Latitud (auto)</label>
                            <input type="text" value={formData.location.latitude} readOnly className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border bg-gray-100" />
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">Longitud (auto)</label><input type="text" value={formData.location.longitude} readOnly className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border bg-gray-100" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Costo por Km extra</label>
                            <input type="number" step="any" name="costPerKm" value={formData.costPerKm} onChange={handleChange} required placeholder="Ej: 0.65" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Radio Gratuito (Km)</label>
                            <input type="number" name="freeKmRadius" value={formData.freeKmRadius} onChange={handleChange} required placeholder="Ej: 15" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                        </div>
                    </div>
                </div>

                {/* --- Imágenes (Placeholder) --- */}
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Imágenes del Servicio</h3>
                    <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                        <p className="font-semibold">Próximamente:</p>
                        <p className="text-sm">Aquí podrás subir las fotos de tu servicio.</p>
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
                    Aún no tienes servicios publicados. ¡Usa el formulario de abajo para empezar!
                </div>
            ) : (
                <div className="space-y-4">
                    {services.map(service => (
                        <div key={service.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center modern-shadow">
                            <div className="flex-grow mb-3 sm:mb-0">
                                <h3 className="font-bold text-lg text-violet-800">{service.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Tag className="w-4 h-4 text-pink-500" /> {service.type} -
                                    <Users className="w-4 h-4 text-pink-500 ml-2" /> Capacidad base: {service.baseCapacity}
                                </p>
                                <p className="text-xl font-extrabold text-pink-600 mt-1">Desde ${service.basePrice}</p>
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
const VendorDashboardView = ({ userId, onSwitchToClientView, serviceCategories, onManageCategories }) => {
    // Estado para forzar la recarga de la lista después de añadir un servicio
    const [refreshKey, setRefreshKey] = useState(0); 

    const forceRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-violet-800 flex items-center gap-2">
                    <Briefcase className="w-7 h-7 text-pink-500" /> Panel del Prestador
                </h1>
                <button onClick={onSwitchToClientView} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">
                    Cambiar a Modo Cliente
                </button>
            </div>
            <p className="text-gray-600 mb-6">Tu control maestro para gestionar servicios y disponibilidad.</p>
            
            {/* Listado de Servicios */}
            <ServiceList userId={userId} key={refreshKey} />
            
            {/* Gestión de Disponibilidad (PRÓXIMO PASO) */}
            <div className="mt-8 p-6 bg-white rounded-xl modern-shadow border-t-4 border-pink-500">
                 <h2 className="text-2xl font-black text-pink-700 mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6" /> Calendario y Disponibilidad
                </h2>
                <p className="text-gray-700">
                    <span className="font-bold text-violet-600">PRÓXIMO PASO CRÍTICO:</span> Aquí implementaremos la interfaz de calendario para que puedas **bloquear fechas** y asegurar que los clientes solo vean tus servicios cuando estás disponible.
                </p>
            </div>

            {/* Formulario de Nuevo Servicio */}
            <div className="mt-8">
                <ServiceForm userId={userId} onServiceAdded={forceRefresh} serviceCategories={serviceCategories} />
            </div>

            {/* Botón para Gestión de Categorías (Admin) */}
            <div className="mt-8 text-center">
                <button onClick={onManageCategories} className="bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto">
                    <Settings className="w-5 h-5" /> Gestionar Categorías (Admin)
                </button>
            </div>
            
        </div>
    );
};

export default VendorDashboardView;