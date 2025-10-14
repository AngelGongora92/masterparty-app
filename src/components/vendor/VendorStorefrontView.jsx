import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { LoaderCircle, Frown, Store, Calendar, Users, Tag } from 'lucide-react';
import ServiceResultCard from '../client/ServiceResultCard';
import ServiceDetailModal from '../client/ServiceDetailModal';

const StorefrontFilters = ({ categories, onFilterChange, filters }) => {
    const { date, category, capacity } = filters;

    return (
        <div className="bg-white p-4 rounded-xl modern-shadow border mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="date-filter" className="block text-xs font-bold uppercase text-gray-600 mb-1">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <input
                            type="date"
                            id="date-filter"
                            value={date}
                            onChange={(e) => onFilterChange('date', e.target.value)}
                            className="w-full pl-10 p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="category-filter" className="block text-xs font-bold uppercase text-gray-600 mb-1">Categoría</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <select
                            id="category-filter"
                            value={category}
                            onChange={(e) => onFilterChange('category', e.target.value)}
                            className="w-full pl-10 p-2 border border-gray-300 rounded-lg appearance-none"
                        >
                            <option value="">Todas</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="capacity-filter" className="block text-xs font-bold uppercase text-gray-600 mb-1">Capacidad (personas)</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <input
                            type="number"
                            id="capacity-filter"
                            value={capacity}
                            onChange={(e) => onFilterChange('capacity', e.target.value)}
                            placeholder="Ej: 50"
                            min="1"
                            className="w-full pl-10 p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const VendorStorefrontView = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [vendorData, setVendorData] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({ date: '', category: '', capacity: '' });
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) {
                setError('URL de tienda no válida.');
                setLoading(false);
                return;
            }

            try {
                // 1. Find the vendor by slug
                const q = query(collectionGroup(db, 'provider'), where('slug', '==', slug));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error('No se encontró el proveedor.');
                }

                const vendorDoc = querySnapshot.docs[0];
                const vendorId = vendorDoc.ref.parent.parent.id;
                const vendorDetails = vendorDoc.data();
                setVendorData(vendorDetails);

                // 2. Fetch services for that vendor
                const servicesRef = collection(db, `artifacts/${appId}/public/data/services`);
                const servicesQuery = query(servicesRef, where("vendorId", "==", vendorId));
                const servicesSnapshot = await getDocs(servicesQuery);
                const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setServices(fetchedServices);

            } catch (err) {
                console.error("Error fetching storefront data:", err);
                setError(err.message || 'No se pudo cargar la tienda de este proveedor.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    // Efecto para abrir el modal si la URL lo indica (después de iniciar sesión)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const serviceToOpen = params.get('openService');

        if (serviceToOpen && services.length > 0) {
            const service = services.find(s => s.id === serviceToOpen);
            if (service) {
                handleViewDetails(service);
                // Limpiamos el parámetro de la URL para que no se vuelva a abrir al refrescar
                params.delete('openService');
                navigate(`${location.pathname}?${params.toString()}`, { replace: true });
            }
        }
    }, [services, location.search, navigate]);

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const availableCategories = useMemo(() => {
        const cats = new Set(services.map(s => s.mainCategory));
        return Array.from(cats).sort();
    }, [services]);

    const filteredServices = useMemo(() => {
        return services.filter(service => {
            // Date filter
            if (filters.date) {
                const isDateUnavailable = service.unavailableDates?.includes(filters.date);
                const allSlotsBlocked = service.blockedSlots?.[filters.date]?.[service.id]?.length === 48;
                if (isDateUnavailable || allSlotsBlocked) return false;
            }
            // Category filter
            if (filters.category && service.mainCategory !== filters.category) {
                return false;
            }
            // Capacity filter
            if (filters.capacity) {
                const capacityNum = parseInt(filters.capacity, 10);
                const hasCapacity = service.capacityTiers?.some(tier => tier.capacity >= capacityNum);
                if (!hasCapacity) return false;
            }
            return true;
        });
    }, [services, filters]);

    const handleViewDetails = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-500"><LoaderCircle className="animate-spin w-8 h-8 mr-3" />Cargando tienda...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <Store className="w-12 h-12 mx-auto text-pink-500 mb-2" />
                    <h1 className="text-4xl font-extrabold text-violet-800">{vendorData?.businessName || 'Tienda del Proveedor'}</h1>
                    <p className="text-gray-600 mt-2">Explora todos los servicios que ofrecemos.</p>
                </div>

                <StorefrontFilters categories={availableCategories} onFilterChange={handleFilterChange} filters={filters} />

                {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredServices.map(service => (
                            <ServiceResultCard key={service.id} service={service} onViewDetails={handleViewDetails} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white border border-gray-200 rounded-xl modern-shadow">
                        <Frown className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                        <p className="font-bold text-yellow-800">No se encontraron servicios que coincidan con los filtros aplicados.</p>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <ServiceDetailModal service={selectedService} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default VendorStorefrontView;