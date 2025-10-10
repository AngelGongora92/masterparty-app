import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, CalendarClock } from 'lucide-react';
import ServiceList from './ServiceList';
import ServiceForm from './ServiceForm';

/**
 * Vista principal para el Prestador de Servicios.
 */
const VendorDashboardView = ({ userId, serviceCategories, onManageCalendar }) => {
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
                <button
                    onClick={onManageCalendar}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-lg flex items-center gap-2"
                >
                    <CalendarClock className="w-5 h-5" /> Gestionar Calendario
                </button>
            </div>
            <p className="text-gray-600 mb-6">Tu control maestro para gestionar servicios y disponibilidad.</p>
            
            {/* Listado de Servicios */}
            <ServiceList userId={userId} key={refreshKey} />

            {/* Formulario de Nuevo Servicio */}
            <div className="mt-8">
                <ServiceForm userId={userId} onServiceAdded={forceRefresh} serviceCategories={serviceCategories} />
            </div>
        </div>
    );
};

export default VendorDashboardView;