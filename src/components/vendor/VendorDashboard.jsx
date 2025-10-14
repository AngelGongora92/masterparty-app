import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CalendarClock, Bell, PlusCircle, Store, FilePenLine } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ServiceList from './ServiceList';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

/**
 * Vista principal para el Prestador de Servicios.
 */
const VendorDashboardView = ({ serviceCategories }) => {
    // Estado para forzar la recarga de la lista después de añadir un servicio
    const { userId, userData, user } = useAuth();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0); 

    const forceRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

    const handleDeleteService = async (serviceId, serviceName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${serviceName}"? Esta acción no se puede deshacer.`)) {
            try {
                // Lógica para eliminar el servicio de Firestore
                const serviceDocRef = doc(db, `artifacts/${appId}/public/data/services/${serviceId}`);
                await deleteDoc(serviceDocRef);
                
                // Aquí también podrías añadir la lógica para eliminar las imágenes asociadas del Storage si lo necesitas.
                
                alert('Servicio eliminado con éxito.');
                forceRefresh(); // Refresca la lista de servicios
            } catch (error) {
                console.error("Error deleting service: ", error);
                alert('Ocurrió un error al eliminar el servicio.');
            }
        }
    };
    
    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-violet-800 flex items-center gap-2 mb-4">
                <Briefcase className="w-7 h-7 text-pink-500" /> {userData?.businessName ? `Panel de ${userData.businessName}` : 'Panel de servicios'}
            </h1>
            <p className="text-gray-600 mb-6">Tu centro de control para gestionar servicios, calendario y reservas.</p>

            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <button onClick={() => navigate('/vendor/bookings')} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition">
                    <Bell className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Gestionar Reservas</div><div className="text-xs text-gray-500">Acepta o rechaza solicitudes</div></div>
                </button>
                <button
                    onClick={() => navigate('/vendor/calendar')}
                    className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition" 
                >
                    <CalendarClock className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Gestionar Calendario</div><div className="text-xs text-gray-500">Define tu disponibilidad</div></div>
                </button>
                <button onClick={() => navigate('/vendor/services/new')} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition">
                    <PlusCircle className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Crear Nuevo Servicio</div><div className="text-xs text-gray-500">Añade un servicio a tu catálogo</div></div>
                </button>
                <button onClick={() => navigate('/vendor/edit-profile')} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition">
                    <FilePenLine className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Editar Perfil</div><div className="text-xs text-gray-500">Actualiza datos de tu negocio</div></div>
                </button>
                <button onClick={() => navigate(`/store/${userData.slug}`)} disabled={!userData?.slug} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Store className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Ver mi Tienda</div><div className="text-xs text-gray-500">Tu página pública</div></div>
                </button>
            </div>
            
            {/* Listado de Servicios */}
            <ServiceList userId={userId} key={refreshKey} onDeleteService={handleDeleteService} />
        </div>
    );
};

export default VendorDashboardView;