import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { CalendarCheck, Save, LoaderCircle, X } from 'lucide-react';
import Calendar from 'react-calendar';
import { db, appId } from '../../firebase';
import 'react-calendar/dist/Calendar.css';

// --- Funciones Auxiliares para Fechas (Manejo Consistente en UTC) ---

/**
 * Convierte un objeto Date a un string 'YYYY-MM-DD'.
 * Es crucial para almacenar las fechas de forma estandarizada en Firestore.
 */
const toISODateString = (date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Crea un objeto Date para el día de hoy a medianoche, en UTC.
 * Esto evita problemas de zona horaria al establecer la fecha mínima del calendario.
 */
const getTodayInUTC = () => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
};

const AvailabilityModal = ({ service, onClose }) => {
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [saving, setSaving] = useState(false);

    // Efecto para inicializar el estado con las fechas del servicio cuando el modal se abre.
    useEffect(() => {
        if (!service) return;
        
        // Convierte los strings 'YYYY-MM-DD' de Firestore a objetos Date en UTC.
        const dates = (service.unavailableDates || []).map(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        });
        setUnavailableDates(dates);
    }, [service]);

    // Maneja el clic en un día del calendario para marcarlo/desmarcarlo.
    const handleDateChange = (date) => {
        // Normaliza la fecha seleccionada a UTC para evitar inconsistencias.
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dateString = toISODateString(utcDate);

        const dateExists = unavailableDates.some(d => toISODateString(d) === dateString);

        if (dateExists) {
            // Si la fecha ya está marcada, la quitamos.
            setUnavailableDates(unavailableDates.filter(d => toISODateString(d) !== dateString));
        } else {
            // Si no está marcada, la añadimos.
            setUnavailableDates([...unavailableDates, utcDate]);
        }
    };

    // Guarda la lista de fechas no disponibles en Firestore.
    const handleSave = async () => {
        if (!service?.id) return;
        setSaving(true);
        const serviceDocRef = doc(db, `artifacts/${appId}/public/data/services/${service.id}`);
        try {
            // Convierte los objetos Date de vuelta a strings 'YYYY-MM-DD' para guardarlos.
            const dateStrings = unavailableDates.map(toISODateString);
            await updateDoc(serviceDocRef, { unavailableDates: dateStrings });
            alert('¡Disponibilidad guardada con éxito!');
            onClose();
        } catch (error) {
            console.error("Error al guardar la disponibilidad:", error);
            alert("Hubo un error al guardar el calendario.");
        } finally {
            setSaving(false);
        }
    };

    // Función para aplicar una clase CSS a los días marcados como no disponibles.
    const tileClassName = ({ date, view }) => {
        // Normaliza la fecha del calendario a UTC para una comparación segura.
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        if (view === 'month' && unavailableDates.some(d => d.getTime() === utcDate.getTime())) {
            return 'unavailable-day';
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
            <div className="bg-white p-6 rounded-xl modern-shadow w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-black text-pink-700 mb-2 flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6" /> Disponibilidad de "{service?.name}"
                </h2>
                <p className="text-gray-600 mb-4">Marca los días en que este servicio **NO** estará disponible.</p>
                
                <div className="space-y-4">
                    <div className="calendar-container">
                        <Calendar
                            onChange={handleDateChange}
                            value={null}
                            tileClassName={tileClassName}
                            minDate={getTodayInUTC()} // Usa la fecha de hoy en UTC como mínimo
                            selectRange={false}
                        />
                    </div>
                    <button onClick={handleSave} disabled={saving} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:bg-pink-300 disabled:cursor-not-allowed transition">
                        {saving ? <LoaderCircle className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityModal;