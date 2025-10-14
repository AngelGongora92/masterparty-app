import React from 'react';
import { Users, Trash2, Tag, Edit, Image as ImageIcon, CalendarDays } from 'lucide-react';

const ServiceItem = ({ service, onEdit, onDelete, onManageAvailability }) => {
    const firstImage = service.imageUrls && service.imageUrls.length > 0 ? service.imageUrls[0] : null;

    const getCapacityText = () => {
        if (!service.capacityTiers || service.capacityTiers.length === 0) {
            return service.baseCapacity || ''; // Fallback por si acaso
        }
        if (service.capacityTiers.length === 1) {
            return service.capacityTiers[0].capacity;
        }
        const capacities = service.capacityTiers.map(t => t.capacity);
        const min = Math.min(...capacities);
        const max = Math.max(...capacities);
        return `${min} - ${max}`;
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-row items-center gap-4 modern-shadow">
            {firstImage ? (
                <img src={firstImage} alt={service.name} className="w-24 h-24 sm:w-32 sm:h-24 object-cover rounded-xl flex-shrink-0" />
            ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                    <ImageIcon className="w-8 h-8" />
                </div>
            )}
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-violet-800">{service.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1"><Tag className="w-4 h-4 text-pink-500" /> {service.type} - <Users className="w-4 h-4 text-pink-500 ml-2" /> Capacidad: {getCapacityText()}</p>
                <p className="text-xl font-extrabold text-pink-600 mt-1">Desde ${service.basePrice}</p>
            </div>
            <div className="flex flex-col space-y-2 ml-auto">
                <button 
                    onClick={() => onManageAvailability(service)} 
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                    title="Gestionar Disponibilidad"
                ><CalendarDays className="w-5 h-5" /></button>
                <button 
                    onClick={() => onEdit(service)} 
                    className="p-2 bg-violet-100 text-violet-600 rounded-full hover:bg-violet-200 transition"
                    title="Editar Servicio"
                ><Edit className="w-5 h-5" /></button>
                <button 
                    onClick={() => onDelete(service.id, service.name)} 
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                    title="Eliminar Servicio"
                ><Trash2 className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export default ServiceItem;