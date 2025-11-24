import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'react-calendar/dist/Calendar.css';
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';

// --- Funciones Auxiliares para Fechas (Manejo Consistente en UTC) ---
const toISODateString = (date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const FullCalendarManager = () => {
    const { userId } = useAuth();
    const navigate = useNavigate();
    // Estado para la fecha seleccionada en el calendario
    const [selectedDate, setSelectedDate] = useState(new Date());
    // Estado para almacenar los bloques horarios no disponibles
    // Estructura: { 'YYYY-MM-DD': { 'serviceId': ['HH:MM', 'HH:MM', ...] } }
    const [blockedSlots, setBlockedSlots] = useState({});

    // Estados para manejar la selección por arrastre
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartSlot, setDragStartSlot] = useState(null);
    const [dragCurrentSlots, setDragCurrentSlots] = useState([]);
    const [dragMode, setDragMode] = useState('block'); // 'block' o 'unblock'

    // Estado para los servicios del proveedor
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [selectedServices, setSelectedServices] = useState([]);

    // Carga los servicios del proveedor desde Firestore
    useEffect(() => {
        const fetchServices = async () => {
            if (!userId) return;
            setLoadingServices(true);
            try {
                const servicesCollectionRef = collection(db, `artifacts/${appId}/public/data/services`);
                const q = query(servicesCollectionRef, where("vendorId", "==", userId));
                const querySnapshot = await getDocs(q);
                const fetchedServices = querySnapshot.docs.map(doc => ({
                    id: doc.id, // Mantener el ID del documento
                    ...doc.data(), // Obtener todos los datos del documento, incluyendo 'packages' y 'capacity'
                }));
                setServices(fetchedServices);
            } catch (error) {
                console.error("Error fetching services: ", error);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [userId]);

    // Genera las horas del día
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Genera los bloques de una hora para el día seleccionado
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2).toString().padStart(2, '0');
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour}:${minute}`;
    });
    
    // Maneja el clic en un día del calendario
    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    // --- Lógica para selección por arrastre ---

    const getSlotsInRange = (start, end) => {
        const startIndex = timeSlots.indexOf(start);
        const endIndex = timeSlots.indexOf(end);
        if (startIndex === -1 || endIndex === -1) return [];

        const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
        return timeSlots.slice(min, max + 1);
    };

    const handleMouseDown = (slot) => {
        if (selectedServices.length === 0) {
            alert("Por favor, selecciona al menos un servicio para bloquear su disponibilidad.");
            return;
        }
        setIsDragging(true);
        setDragStartSlot(slot);
        setDragCurrentSlots([slot]);

        // Determina si la acción será bloquear o desbloquear basado en el primer slot
        const dateString = toISODateString(selectedDate);
        const isInitiallyBlocked = selectedServices.some(serviceId => 
            blockedSlots[dateString]?.[serviceId]?.includes(slot)
        );
        setDragMode(isInitiallyBlocked ? 'unblock' : 'block');
    };

    const handleMouseEnter = (slot) => {
        if (isDragging && dragStartSlot) {
            setDragCurrentSlots(getSlotsInRange(dragStartSlot, slot));
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;

        const dateString = toISODateString(selectedDate);
        
        setBlockedSlots(prev => {
            const newBlockedSlots = { ...prev };
            if (!newBlockedSlots[dateString]) {
                newBlockedSlots[dateString] = {};
            }

            // Aplica la acción (bloquear/desbloquear) a todos los servicios y slots seleccionados
            selectedServices.forEach(serviceId => {
                let serviceSlots = new Set(newBlockedSlots[dateString][serviceId] || []);
                
                if (dragMode === 'block') {
                    dragCurrentSlots.forEach(s => serviceSlots.add(s));
                } else {
                    dragCurrentSlots.forEach(s => serviceSlots.delete(s));
                }

                newBlockedSlots[dateString][serviceId] = Array.from(serviceSlots).sort();
            });

            return newBlockedSlots;
        });

        // Resetea el estado de arrastre
        setIsDragging(false);
        setDragStartSlot(null);
        setDragCurrentSlots([]);
    };

    // --- Fin de la lógica de arrastre ---

    const handleSave = () => {
        // Aquí iría la lógica para guardar `blockedSlots` en Firestore
        // Por ejemplo, iterar sobre las fechas modificadas y actualizar los documentos correspondientes.
        console.log("Guardando los siguientes bloqueos en Firestore:", blockedSlots);
        alert("Simulando guardado en Firestore. Revisa la consola para ver la estructura de datos.");
    };
    
    // Maneja la selección de un servicio individual
    const handleServiceSelection = (serviceId) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    // Maneja la selección de todos los servicios
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedServices(services.map(s => s.id));
        } else {
            setSelectedServices([]);
        }
    };
    
    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al Panel
            </button>
            <h1 className="text-3xl font-bold text-violet-800 mb-2">Gestión de Disponibilidad por Horas</h1>
            <p className="text-gray-600 mb-6">Gestiona tu disponibilidad por horas para cada servicio. Haz clic y arrastra para crear un bloqueo.</p>

            <div className="bg-white p-6 rounded-xl modern-shadow mb-6">
                <h2 className="text-lg font-bold text-gray-700 mb-3">Seleccionar Servicios a Gestionar</h2>
                {loadingServices ? (
                    <div className="flex items-center text-gray-500"><LoaderCircle className="animate-spin w-5 h-5 mr-2" />Cargando servicios...</div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center p-2 border-b">
                            <input
                                type="checkbox"
                                id="select-all"
                                onChange={handleSelectAll}
                                checked={services.length > 0 && selectedServices.length === services.length}
                                className="h-5 w-5 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                            />
                            <label htmlFor="select-all" className="ml-3 font-bold text-gray-800">Seleccionar Todos</label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-32 overflow-y-auto p-1">
                            {services.map(service => (
                                <div key={service.id} className="flex items-center p-2">
                                    <input
                                        type="checkbox"
                                        id={`service-${service.id}`}
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => handleServiceSelection(service.id)}
                                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-700">{service.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna del Calendario Mensual */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl modern-shadow calendar-container">
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        minDate={new Date()}
                    />
                </div>

                {/* Columna de Horas del Día Seleccionado */}
                <div className="bg-white p-4 rounded-xl modern-shadow">
                    <h3 className="text-lg font-bold text-violet-800 text-center mb-3">
                        {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div
                        className="space-y-2 max-h-[55vh] overflow-y-auto pr-2"
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp} // Termina la selección si el ratón sale del contenedor
                    >
                        {hours.map(hour => {
                            const hourString = hour.toString().padStart(2, '0');
                            const slot1 = `${hourString}:00`;
                            const slot2 = `${hourString}:30`;
                            const dateString = toISODateString(selectedDate);

                            const isBlocked1 = selectedServices.some(id => blockedSlots[dateString]?.[id]?.includes(slot1));
                            const isBlocked2 = selectedServices.some(id => blockedSlots[dateString]?.[id]?.includes(slot2));
                            const isDragged1 = dragCurrentSlots.includes(slot1);
                            const isDragged2 = dragCurrentSlots.includes(slot2);

                            const getSlotClass = (isBlocked, isDragged) => {
                                if (isDragged) return dragMode === 'block' ? 'bg-pink-300 border-pink-400' : 'bg-gray-300 border-gray-400';
                                if (isBlocked) return 'bg-pink-500 text-white border-pink-600';
                                return 'bg-gray-100 hover:bg-violet-100 border-gray-200';
                            };

                            return (
                                <div key={hour} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="w-12 text-center text-sm font-bold text-gray-500">{hourString}</div>
                                    <div className="flex-grow flex flex-col gap-1">
                                        <button
                                            onMouseDown={() => handleMouseDown(slot1)}
                                            onMouseEnter={() => handleMouseEnter(slot1)}
                                            className={`p-2 text-left rounded-md border text-xs transition-colors select-none ${getSlotClass(isBlocked1, isDragged1)}`}
                                        >:00</button>
                                        <button
                                            onMouseDown={() => handleMouseDown(slot2)}
                                            onMouseEnter={() => handleMouseEnter(slot2)}
                                            className={`p-2 text-left rounded-md border text-xs transition-colors select-none ${getSlotClass(isBlocked2, isDragged2)}`}
                                        >:30</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={handleSave} className="cta-button w-full text-white font-bold py-2.5 rounded-xl shadow-lg flex justify-center items-center gap-2 mt-3">
                        <Save className="w-5 h-5" />
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FullCalendarManager;
