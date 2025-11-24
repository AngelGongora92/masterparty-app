import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Tag, Users, ChevronRight, Building2 } from 'lucide-react';

const ServiceResultCard = ({ service, onViewDetails }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageUrls = service.imageUrls || [];
    const hasMultipleImages = imageUrls.length > 1;

    useEffect(() => {
        if (hasMultipleImages) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageUrls.length);
            }, 2500); // 2 segundos de visualización + 0.5s de transición
            return () => clearInterval(interval);
        }
    }, [imageUrls, hasMultipleImages]);

    // Función para obtener el texto de capacidad a partir de los paquetes
    const getCapacityText = () => {
        const packagesWithCapacity = service.packages?.filter(p => p.capacity && p.capacity.trim() !== '' && p.capacity.trim().toLowerCase() !== 'n/a');

        if (!packagesWithCapacity || packagesWithCapacity.length === 0) {
            return null; // Devuelve null si no hay paquetes con capacidad válida
        }
        if (packagesWithCapacity.length === 1) {
            return packagesWithCapacity[0].capacity;
        }
        // Si hay varios paquetes, calcula el rango de capacidad
        const capacities = packagesWithCapacity.map(p => parseInt(p.capacity, 10)).filter(c => !isNaN(c));
        return capacities.length > 0 ? `${Math.min(...capacities)} - ${Math.max(...capacities)}` : null;
    };

    return (
        <div
            onClick={() => onViewDetails(service)}
            className="bg-white rounded-xl border border-gray-200 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 modern-shadow transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer overflow-hidden"
        >
            {/* Contenedor de la Imagen */}
            <div className="w-28 h-28 sm:w-full sm:h-40 flex-shrink-0 relative sm:rounded-b-none overflow-hidden">
                {imageUrls.length > 0 ? (
                    imageUrls.map((url, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                            style={{ backgroundImage: `url(${url})` }}
                        />
                    ))
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                )}
            </div>

            {/* Contenedor del Contenido */}
            <div className="flex-grow flex flex-col p-0 sm:p-4">
                <h3 className="font-bold text-lg text-violet-800 truncate">{service.name}</h3>
                {service.businessName && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5"><Building2 className="w-3.5 h-3.5 text-pink-500" /> {service.businessName}</p>}
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Tag className="w-4 h-4 text-pink-500" /> {service.type}</p>
                {getCapacityText() && ( // Renderiza condicionalmente si hay capacidad
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Users className="w-4 h-4 text-pink-500" /> Capacidad: {getCapacityText()}</p>
                )}
                <p className="text-xl font-extrabold text-pink-600 mt-2">Desde ${service.basePrice.toLocaleString('es-MX')}</p>
                <div className="hidden sm:block mt-auto pt-2">
                    <button className="w-full bg-violet-600 text-white font-semibold py-2 rounded-lg hover:bg-violet-700 transition">Ver Detalles</button>
                </div>
            </div>
            {/* Flecha para indicar acción en móvil */}
            <div className="ml-auto sm:hidden pr-2">
                <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
        </div>
    );
};

export default ServiceResultCard;