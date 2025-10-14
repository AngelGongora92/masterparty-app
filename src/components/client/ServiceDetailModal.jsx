import React, { useState } from 'react';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ReactCalendar from 'react-calendar';
import { X, Tag, Users, DollarSign, ChevronLeft, ChevronRight, Calendar, Send } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const ImageCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded-t-xl">No hay imágenes</div>;
    }

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="relative h-56 sm:h-64 w-full group">
            <div className="w-full h-full rounded-t-xl bg-center bg-cover duration-500" style={{ backgroundImage: `url(${images[currentIndex]})` }}></div>
            {images.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute top-1/2 left-2 transform -translate-y-1/2 cursor-pointer bg-black bg-opacity-30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={goToNext} className="absolute top-1/2 right-2 transform -translate-y-1/2 cursor-pointer bg-black bg-opacity-30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={24} />
                    </button>
                </>
            )}
        </div>
    );
};

const AvailabilityCalendar = ({ unavailableDates = [], blockedSlots = {} }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDayUnavailable = (date) => {
        const dateString = date.toISOString().split('T')[0];
        if (unavailableDates.includes(dateString)) return true;

        const daySlots = blockedSlots[dateString];
        if (daySlots && Object.values(daySlots).some(slots => slots.length === 48)) {
            return true;
        }
        return false;
    };

    return (
        <ReactCalendar
            minDate={today}
            tileClassName={({ date, view }) => view === 'month' && isDayUnavailable(date) ? 'unavailable-day' : null}
            tileDisabled={({ date }) => isDayUnavailable(date)}
        />
    );
};

const ServiceDetailModal = ({ service, onClose }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const { userId } = useAuth(); // Obtenemos el ID del cliente logueado
    if (!service) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl modern-shadow w-full max-w-2xl relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 bg-white/50 backdrop-blur-sm rounded-full p-1 z-10">
                    <X className="w-6 h-6" />
                </button>

                <ImageCarousel images={service.imageUrls} />

                <div className="p-6 overflow-y-auto">
                    <h2 className="text-3xl font-extrabold text-violet-800">{service.name}</h2>
                    <div className="flex justify-between items-start mt-1">
                        <p className="text-md text-gray-600 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-pink-500" /> {service.type}
                        </p>
                        <button 
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                        >
                            <Calendar className="w-4 h-4" /> {showCalendar ? 'Volver a detalles' : 'Ver disponibilidad'}
                        </button>
                    </div>
                    
                    {showCalendar && (
                        <div className="mt-4 calendar-container-client"><AvailabilityCalendar unavailableDates={service.unavailableDates} blockedSlots={service.blockedSlots} /></div>
                    )}

                    <p className="text-gray-700 mt-4">{service.description}</p>

                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Precios por Capacidad</h3>
                        <div className="space-y-2">
                            {service.capacityTiers.map((tier, index) => (
                                <div key={index} className="flex justify-between items-center bg-violet-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-violet-600" />
                                        <span className="font-semibold text-gray-700">{tier.capacity} personas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-violet-600" />
                                        <span className="font-bold text-lg text-violet-800">${tier.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t mt-auto">
                    <button 
                        onClick={() => {
                            // Aquí iría la lógica para seleccionar fecha y hora antes de reservar.
                            // Por ahora, simularemos una reserva para el día de hoy a las 10:00.
                            const bookingData = {
                                clientId: userId,
                                vendorId: service.vendorId,
                                serviceId: service.id,
                                serviceName: service.name,
                                bookingDate: new Date().toISOString().split('T')[0],
                                timeSlots: ['10:00', '10:30'],
                                status: 'pending',
                                createdAt: serverTimestamp(),
                            };
                            addDoc(collection(db, `artifacts/${appId}/bookings`), bookingData)
                                .then(() => {
                                    alert('¡Solicitud de reserva enviada! El proveedor será notificado.');
                                    onClose();
                                })
                                .catch(err => console.error("Error al crear la reserva:", err));
                        }}
                        className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    ><Send className="w-5 h-5" /> Enviar Solicitud de Reserva</button>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;