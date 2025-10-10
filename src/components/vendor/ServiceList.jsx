import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import ServiceItem from './ServiceItem';
import AvailabilityModal from './AvailabilityModal';

/**
 * Muestra la lista de servicios publicados por el Prestador.
 */
const ServiceList = ({ userId }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!db || !userId) return;

        const servicesCollectionRef = collection(db, `artifacts/${appId}/public/data/services`);
        const q = query(servicesCollectionRef, where("vendorId", "==", userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedServices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            fetchedServices.sort((a, b) => b.createdAt - a.createdAt);
            
            setServices(fetchedServices);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener servicios:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleDelete = (serviceId, serviceName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio: ${serviceName}?`)) {
            alert(`Simulando eliminación del servicio: ${serviceId}. Esto sería un deleteDoc() en Firestore.`);
        }
    };
    
    const handleEdit = (service) => {
         alert(`Simulando edición del servicio: ${service.name}. Esto abriría el formulario de edición.`);
    };

    const handleManageAvailability = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = (shouldRefresh) => {
        setIsModalOpen(false);
        setSelectedService(null);
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
        <>
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
                            <ServiceItem 
                                key={service.id}
                                service={service}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onManageAvailability={handleManageAvailability}
                            />
                        ))}
                    </div>
                )}
            </div>
            {isModalOpen && (
                <AvailabilityModal service={selectedService} onClose={handleCloseModal} />
            )}
        </>
    );
};

export default ServiceList;