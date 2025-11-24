import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ReactCalendar from 'react-calendar';
import { X, Tag, Users, DollarSign, ChevronLeft, ChevronRight, Calendar, Send, LogIn, Clock, Package } from 'lucide-react';
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

const AvailabilityCalendar = ({ unavailableDates = [], blockedSlots = {}, onDateChange, selectedDate }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDayUnavailable = (date) => {
        const dateString = date.toISOString().split('T')[0];
        // Un día está no disponible si está en la lista de unavailableDates
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
            onChange={onDateChange}
            value={selectedDate}
            tileClassName={({ date, view }) => view === 'month' && isDayUnavailable(date) ? 'unavailable-day' : null}
            tileDisabled={({ date }) => isDayUnavailable(date)}
        />
    );
};

const ServiceDetailModal = ({ service, onClose, initialView = 'details' }) => {
    const [view, setView] = useState(initialView); // 'details' o 'availability'
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null); // Ahora es el paquete completo
    const [selectedCapacityTier, setSelectedCapacityTier] = useState(null);
    const [notes, setNotes] = useState(''); // Estado para las notas
    const { userId, userData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    if (!service) return null;

    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = (hours % 1) * 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        return h > 0 ? `${h}h` : `${m}m`;
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2).toString().padStart(2, '0');
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour}:${minute}`;
    });

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlots([]); // Reset slots when date changes
        // No reseteamos el paquete, el usuario puede querer el mismo paquete para otra fecha
    };

    // Efecto para recalcular los slots si el paquete cambia después de haber seleccionado una hora.
    useEffect(() => {
        if (selectedPackage && selectedSlots.length > 0) {
            const startSlot = selectedSlots[0];
            const durationInSlots = (selectedPackage.duration || 1) / 0.5;
            const startIndex = timeSlots.indexOf(startSlot);

            if (startIndex === -1) return;

            const requiredSlots = timeSlots.slice(startIndex, startIndex + durationInSlots);

            const dateString = selectedDate.toISOString().split('T')[0];
            const blockedForDay = service.blockedSlots?.[dateString]?.[service.id] || [];
            const areAllSlotsAvailable = requiredSlots.every(slot => !blockedForDay.includes(slot));

            if (requiredSlots.length === durationInSlots && areAllSlotsAvailable) {
                setSelectedSlots(requiredSlots);
            } else {
                setSelectedSlots([]);
                alert("La duración del nuevo paquete no cabe en este horario. Por favor, selecciona una nueva hora de inicio.");
            }
        }
    }, [selectedPackage]);

    // --- Lógica de Reserva ---

    const handleStartTimeSelect = (startSlot) => {
        if (!selectedPackage) return; // No se puede seleccionar hora sin un paquete

        const durationInSlots = (selectedPackage.duration || 1) / 0.5;
        const startIndex = timeSlots.indexOf(startSlot);
        if (startIndex === -1) return;

        const requiredSlotsInfo = [];
        let currentDay = new Date(selectedDate);
        currentDay.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < durationInSlots; i++) {
            const slotIndex = (startIndex + i) % timeSlots.length;
            const slot = timeSlots[slotIndex];

            // Si el índice del slot vuelve a 0, significa que hemos pasado al día siguiente
            if (i > 0 && slotIndex === 0) {
                currentDay.setUTCDate(currentDay.getUTCDate() + 1);
            }

            const dateString = currentDay.toISOString().split('T')[0];
            requiredSlotsInfo.push({ slot, date: dateString });
        }

        // Verificar si todos los slots requeridos están disponibles en sus respectivas fechas
        const areAllSlotsAvailable = requiredSlotsInfo.every(slotInfo => {
            const blockedForDay = service.blockedSlots?.[slotInfo.date]?.[service.id] || [];
            return !blockedForDay.includes(slotInfo.slot);
        });

        if (areAllSlotsAvailable) {
            setSelectedSlots(requiredSlotsInfo);
        } else {
            alert("No hay suficiente tiempo disponible a partir de esta hora para la duración del servicio.");
            setSelectedSlots([]);
        }
    };

    const handleBookingRequest = async () => {
        // Validación robusta antes de crear la reserva
        if (!selectedPackage || !selectedDate || selectedSlots.length === 0) {
            alert('Por favor, completa todos los pasos: selecciona un paquete, una fecha y una hora de inicio.');
            return;
        }
        if (userId === 'guest') {
            // Esta lógica ya se maneja en handlePrimaryAction, pero es una buena práctica de defensa.
            return;
        }

        // Agrupamos los slots por fecha para guardarlos en Firestore
        const slotsByDate = selectedSlots.reduce((acc, slotInfo) => {
            acc[slotInfo.date] = acc[slotInfo.date] || [];
            acc[slotInfo.date].push(slotInfo.slot);
            return acc;
        }, {});
        
        const firstDateString = Object.keys(slotsByDate).sort()[0];

        const bookingData = {
            clientId: userId,
            clientName: `${userData.firstName} ${userData.lastName}`,
            vendorId: service.vendorId,
            serviceId: service.id,
            businessName: service.businessName,
            serviceName: service.name,
            bookingDate: new Date(firstDateString + 'T00:00:00'), // Guardar como objeto Date/Timestamp
            package: selectedPackage, // Guardamos el paquete completo
            slotsByDate: slotsByDate, // Nueva estructura para los slots
            status: 'pending',
            notes: notes, // Guardamos las notas
            createdAt: serverTimestamp(),
        };
        try {
            await addDoc(collection(db, `artifacts/${appId}/bookings`), bookingData);
            alert('¡Solicitud de reserva enviada! El proveedor será notificado.');
            onClose();
        } catch (err) {
            console.error("Error al crear la reserva:", err);
            alert('Hubo un error al enviar tu solicitud. Intenta de nuevo.');
        }
    };

    const handlePrimaryAction = async () => {
        if (userId === 'guest') {
            // Construimos la URL de retorno con el ID del servicio para poder reabrir el modal.
            const fromLocation = {
                pathname: location.pathname,
                search: `${location.search}${location.search ? '&' : '?'}openService=${service.id}`
            };
            navigate('/login', { state: { from: fromLocation } });
        } else {
            await handleBookingRequest();
        }
    };

    // El botón se deshabilita solo si el usuario está logueado y no ha seleccionado fecha/hora.
    // Si es invitado, el botón siempre está habilitado para llevarlo al login.
    const isBookingDisabled = userId !== 'guest' && (!selectedDate || selectedSlots.length === 0 || !selectedPackage);

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
                    </div>
                    
                    {view === 'details' && (
                        <>
                            <p className="text-gray-700 mt-4">{service.description}</p>
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Paquetes Disponibles</h3>
                                <div className="space-y-3">
                                    {service.packages?.map((pkg, index) => (
                                        <div key={index} className="bg-violet-50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center font-bold">
                                                <span className="text-gray-800">{pkg.name}</span>
                                                <span className="text-lg text-violet-800">${pkg.price}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(pkg.duration)}</span>
                                                {pkg.capacity && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {pkg.capacity} personas</span>}
                                                </div>
                                            <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {view === 'availability' && (
                        <>
                            <div className="mt-4 calendar-container-client">
                                <AvailabilityCalendar 
                                    unavailableDates={service.unavailableDates} 
                                    blockedSlots={service.blockedSlots}
                                    onDateChange={handleDateChange}
                                    selectedDate={selectedDate}
                                />
                            </div>
                            {/* Selector de Paquete */}
                            <div className="mt-4">
                                <h4 className="font-bold text-gray-700 mb-2">1. Selecciona un paquete:</h4>
                                <div className="space-y-2">
                                    {service.packages?.map((pkg, index) => (
                                        <button key={index} onClick={() => setSelectedPackage(pkg)} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedPackage?.name === pkg.name ? 'bg-violet-100 border-violet-500' : 'bg-white border-gray-200 hover:border-violet-300'}`}>
                                            <div className="flex justify-between items-center"><span className="font-semibold text-gray-700">{pkg.name}</span><span className="font-bold text-violet-800">${pkg.price}</span></div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                                <span>Duración: {formatDuration(pkg.duration)}</span>
                                                {pkg.capacity && <span>Capacidad: {pkg.capacity}</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {selectedDate && selectedPackage && (
                                <div className="mt-4 space-y-4">
                                    {/* Selector de Horas */}
                                    <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                                        <h4 className="font-bold text-gray-700 text-center">2. Selecciona la hora de inicio:</h4>
                                        <div className="max-w-[10rem] mx-auto space-y-2">
                                            {hours.map(hour => {
                                                const hourString = hour.toString().padStart(2, '0');
                                                const durationInSlots = (selectedPackage.duration || 1) / 0.5;

                                                return (
                                                <div key={hour} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="w-12 text-center text-sm font-bold text-gray-500">{hourString}</div>
                                                    <div className="flex-grow flex flex-col gap-1">
                                                        {[`${hourString}:00`, `${hourString}:30`].map(slot => {
                                                            // Lógica corregida para verificar si un slot está bloqueado, considerando que puede cruzar la medianoche.
                                                            let isBlocked = false;
                                                            const startIndex = timeSlots.indexOf(slot);
                                                            let tempDate = new Date(selectedDate);
                                                            tempDate.setUTCHours(0, 0, 0, 0);

                                                            for (let i = 0; i < durationInSlots; i++) {
                                                                const slotIndex = (startIndex + i) % timeSlots.length;
                                                                if (i > 0 && slotIndex === 0) {
                                                                    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
                                                                }
                                                                const dateString = tempDate.toISOString().split('T')[0];
                                                                const blockedForDay = service.blockedSlots?.[dateString]?.[service.id] || [];
                                                                if (blockedForDay.includes(timeSlots[slotIndex])) {
                                                                    isBlocked = true;
                                                                    break;
                                                                }
                                                            }

                                                            const isSelected = selectedSlots.some(s => s.slot === slot);
                                                            const isSelectionStart = selectedSlots[0]?.slot === slot;

                                                            return (
                                                                <button
                                                                    key={slot}
                                                                    disabled={isBlocked}
                                                                    onClick={() => handleStartTimeSelect(slot)}
                                                                    className={`p-2 text-left rounded-md text-xs transition-colors select-none ${
                                                                        isBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed border' :
                                                                        isSelectionStart ? 'bg-violet-600 text-white border-violet-700 border-2' :
                                                                        isSelected ? 'bg-violet-200 text-violet-800 border-violet-400 border-dashed border' :
                                                                        'bg-white hover:bg-violet-100 border border-gray-300'
                                                                    }`}
                                                                >{slot.endsWith('00') ? ':00' : ':30'}</button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Campo de Notas/Comentarios */}
                            <div className="mt-6">
                                <h4 className="font-bold text-gray-700 mb-2">3. Notas o comentarios (opcional)</h4>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                                    rows="3"
                                    placeholder="¿Alguna petición especial o pregunta para el proveedor?"
                                ></textarea>
                            </div>
                        </>
                    )}
                </div>
                <div className="p-6 border-t mt-auto">
                    {view === 'details' ? (
                        <button onClick={() => setView('availability')} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <Calendar className="w-5 h-5" /> Ver disponibilidad
                        </button>
                    ) : (
                        <button 
                            onClick={handlePrimaryAction}
                            disabled={isBookingDisabled}
                            className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {userId === 'guest' ? <LogIn className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                            {userId === 'guest' ? 'Iniciar sesión para reservar' : 'Enviar Solicitud de Reserva'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;