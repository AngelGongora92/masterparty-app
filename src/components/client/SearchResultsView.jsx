import React, { useState } from 'react';
import { ArrowLeft, Frown, Image as ImageIcon, Tag, Users } from 'lucide-react';
import ServiceDetailModal from './ServiceDetailModal';

const ServiceResultCard = ({ service, onViewDetails }) => {
    const firstImage = service.imageUrls && service.imageUrls.length > 0 ? service.imageUrls[0] : null;

    const getCapacityText = () => {
        if (!service.capacityTiers || service.capacityTiers.length === 0) return service.baseCapacity || '';
        if (service.capacityTiers.length === 1) return service.capacityTiers[0].capacity;
        const capacities = service.capacityTiers.map(t => t.capacity);
        return `${Math.min(...capacities)} - ${Math.max(...capacities)}`;
    };

    return (
        <div className="bg-white rounded-2xl modern-shadow border border-gray-200 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            {firstImage ? (
                <img src={firstImage} alt={service.name} className="w-full h-40 object-cover" />
            ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                </div>
            )}
            <div className="p-4">
                <h3 className="font-bold text-lg text-violet-800 truncate">{service.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Tag className="w-4 h-4 text-pink-500" /> {service.type}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Users className="w-4 h-4 text-pink-500" /> Capacidad: {getCapacityText()}</p>
                <p className="text-2xl font-extrabold text-pink-600 mt-2">Desde ${service.basePrice}</p>
                <button onClick={() => onViewDetails(service)} className="w-full mt-4 bg-violet-600 text-white font-semibold py-2 rounded-lg hover:bg-violet-700 transition">
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

const SearchResultsView = ({ searchResults, onBack, searchError }) => {
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                    <ArrowLeft className="w-5 h-5" />
                    Volver a la búsqueda
                </button>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Resultados de la Búsqueda</h1>

                {searchError ? (
                    <p className="text-center text-red-600">{searchError}</p>
                ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.map(service => (
                            <ServiceResultCard key={service.id} service={service} onViewDetails={handleViewDetails} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-yellow-50 border border-yellow-200 rounded-xl">
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