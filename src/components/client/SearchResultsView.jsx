import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { ArrowLeft, Frown, LoaderCircle } from 'lucide-react';
import ServiceDetailModal from './ServiceDetailModal';
import ServiceResultCard from './ServiceResultCard';

const SearchResultsView = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchError, setSearchError] = useState('');

    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            setLoading(true);
            setSearchError('');
            setSearchResults(null);

            const eventDate = searchParams.get('date');
            const mainCategory = searchParams.get('mainCategory');
            const subCategory = searchParams.get('subCategory');

            try {
                const servicesRef = collection(db, `artifacts/${appId}/public/data/services`);
                const queryConstraints = [];

                if (mainCategory) {
                    queryConstraints.push(where("mainCategory", "==", mainCategory));
                }
                if (subCategory) {
                    queryConstraints.push(where("type", "==", subCategory));
                }

                const q = query(servicesRef, ...queryConstraints);
                const querySnapshot = await getDocs(q);
                let services = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filtrado por fecha en el lado del cliente
                if (eventDate) {
                    services = services.filter(service => {
                        // Un día está no disponible si está en la lista de unavailableDates
                        const isDateUnavailable = service.unavailableDates?.includes(eventDate);
                        // O si todas las 48 franjas horarias de ese día están bloqueadas
                        const allSlotsBlocked = service.blockedSlots?.[eventDate]?.[service.id]?.length === 48;
                        
                        return !isDateUnavailable && !allSlotsBlocked;
                    }
                    );
                }

                setSearchResults(services);
            } catch (error) {
                console.error("Error al buscar servicios:", error);
                setSearchError("Ocurrió un error al realizar la búsqueda. Por favor, intenta de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [searchParams]);

    // Efecto para abrir el modal si la URL lo indica (después de iniciar sesión)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const serviceToOpen = params.get('openService');

        if (serviceToOpen && searchResults) {
            const service = searchResults.find(s => s.id === serviceToOpen);
            if (service) {
                handleViewDetails(service);
                // Limpiamos el parámetro de la URL para que no se vuelva a abrir al refrescar
                params.delete('openService');
                navigate(`${location.pathname}?${params.toString()}`, { replace: true });
            }
        }
    }, [searchResults, location.search, navigate]);

    const handleViewDetails = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const onBack = () => navigate('/');

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                    <ArrowLeft className="w-5 h-5" />
                    Volver al inicio
                </button>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Resultados de la Búsqueda</h1>

                {loading ? (
                    <div className="flex items-center justify-center text-gray-500 py-10">
                        <LoaderCircle className="animate-spin w-8 h-8 mr-3" />Buscando servicios...
                    </div>
                ) : searchError ? (
                    <p className="text-center text-red-600">{searchError}</p>
                ) : searchResults && searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.map(service => (
                            <ServiceResultCard key={service.id} service={service} onViewDetails={handleViewDetails} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white border border-gray-200 rounded-xl modern-shadow">
                        <Frown className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                        <p className="font-bold text-yellow-800">No se encontraron servicios que coincidan con tu búsqueda.</p>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <ServiceDetailModal service={selectedService} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default SearchResultsView;