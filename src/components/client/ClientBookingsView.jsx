import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Package, DollarSign, LoaderCircle, Frown, XCircle, Image as ImageIcon } from 'lucide-react';
import ServiceDetailModal from './ServiceDetailModal';

const BookingStatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-bold rounded-full inline-block";
    switch (status) {
        case 'pending':
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pendiente</span>;
        case 'accepted':
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Aceptada</span>;
        case 'rejected':
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rechazada</span>;
        case 'canceled_by_client':
            return <span className={`${baseClasses} bg-gray-200 text-gray-600`}>Cancelada</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const BookingCard = ({ booking, onShowDetails }) => {
    const { serviceName, businessName, slotsByDate, package: pkg, status, id: bookingId, imageUrls, serviceDetails } = booking;

    const formatTime = (slot) => {
        const [hour, minute] = slot.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    // Función para obtener la primera fecha de la reserva desde slotsByDate
    const getBookingDate = () => {
        if (!slotsByDate || Object.keys(slotsByDate).length === 0) {
            return 'Fecha no disponible';
        }
        const firstDate = Object.keys(slotsByDate).sort()[0];
        // El formato 'YYYY-MM-DD' necesita 'T00:00:00' para evitar problemas de zona horaria
        return new Date(firstDate + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Función para obtener el rango de tiempo de la reserva a partir de slotsByDate
    const getBookingTimeRange = () => {
        if (!slotsByDate || Object.keys(slotsByDate).length === 0) {
            return 'N/A';
        }

        const sortedDates = Object.keys(slotsByDate).sort();
        const firstDate = sortedDates[0];
        const lastDate = sortedDates[sortedDates.length - 1];

        const firstSlots = slotsByDate[firstDate];
        const lastSlots = slotsByDate[lastDate];

        if (!firstSlots || firstSlots.length === 0 || !lastSlots || lastSlots.length === 0) return 'N/A';
        return `${formatTime(firstSlots[0])} - ${formatTime(lastSlots[lastSlots.length - 1])}`;
    };

    const handleCancelBooking = async () => {
        if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            const bookingRef = doc(db, `artifacts/${appId}/bookings`, bookingId);
            try {
                await updateDoc(bookingRef, { status: 'canceled_by_client' });
                alert('Reserva cancelada.');
            } catch (error) {
                console.error("Error al cancelar la reserva:", error);
                alert('No se pudo cancelar la reserva.');
            }
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl modern-shadow border border-gray-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Sección de la imagen del servicio */}
                <div className="w-full sm:w-32 h-32 sm:h-24 rounded-lg overflow-hidden relative flex-shrink-0">
                    {imageUrls && imageUrls.length > 0 ? (
                        <img src={imageUrls[0]} alt={serviceName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                    )}
                </div>
                <div className="flex-grow w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-violet-800">{serviceName}</h3>
                            <p className="text-sm text-gray-500">de {businessName}</p>
                        </div>
                        <BookingStatusBadge status={status} />
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-pink-500" />
                            <span>{getBookingDate()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-pink-500" />
                            <span>{getBookingTimeRange()}</span>
                        </div>
                        <div className="flex items-center gap-2"><Package className="w-4 h-4 text-pink-500" /> <span>Paquete: {pkg.name}</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-pink-500" /> <span className="font-semibold">${pkg.price.toLocaleString('es-MX')}</span></div>
                    </div>
                </div>
                {status === 'pending' && (
                    <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2 mt-2 sm:mt-0">
                        <button onClick={handleCancelBooking} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center gap-1"><XCircle className="w-4 h-4" /> Cancelar</button>
                    </div>
                )}
            </div>
            {serviceDetails?.description && (
                <div className="w-full text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-gray-700 mb-1">Información del servicio:</p>
                    <p className="line-clamp-3">{serviceDetails.description}</p>
                </div>
            )}
        </div>
    );
};

const ClientBookingsView = () => {
    const { userId } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);

    useEffect(() => {
        if (!userId || userId === 'guest') {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(db, `artifacts/${appId}/bookings`);
        const q = query(bookingsRef, where("clientId", "==", userId), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedBookingsPromises = snapshot.docs.map(async docSnapshot => {
                const bookingData = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // Obtener los detalles del servicio para las URLs de las imágenes
                const serviceRef = doc(db, `artifacts/${appId}/public/data/services`, bookingData.serviceId);
                const serviceSnap = await getDoc(serviceRef);
                
                if (serviceSnap.exists()) {
                    const serviceData = serviceSnap.data();
                    bookingData.imageUrls = serviceData.imageUrls || [];
                    bookingData.serviceDetails = { id: serviceSnap.id, ...serviceData };
                } else {
                    bookingData.imageUrls = []; // Si el servicio no se encuentra, usar un array vacío
                }
                return bookingData;
            });
            const fetchedBookings = await Promise.all(fetchedBookingsPromises);
            setBookings(fetchedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener las reservas:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    if (loading) {
        return <div className="flex justify-center items-center p-10"><LoaderCircle className="animate-spin w-8 h-8 text-violet-500" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 min-h-screen">
            <h1 className="text-3xl font-bold text-violet-800 mb-6">Mis Reservas</h1>
            {bookings.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white border rounded-xl modern-shadow">
                    <Frown className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                    <p className="font-bold text-yellow-800">Aún no has realizado ninguna reserva.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => <BookingCard key={booking.id} booking={booking} onShowDetails={setSelectedService} />)}
                </div>
            )}
            {selectedService && (
                <ServiceDetailModal 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)}
                    initialView="details"
                />
            )}
        </div>
    );
};

export default ClientBookingsView;
