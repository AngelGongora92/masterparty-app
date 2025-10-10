import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CalendarCheck, Save, LoaderCircle } from 'lucide-react';
import Calendar from 'react-calendar';
import { db, appId } from '../../firebase';
import 'react-calendar/dist/Calendar.css';

const AvailabilityManager = ({ userId }) => {
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Helper para convertir fechas a string YYYY-MM-DD ignorando la zona horaria
    const toISODateString = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (!userId) return;

        const fetchAvailability = async () => {
            setLoading(true);
            const availabilityDocRef = doc(db, `artifacts/${appId}/users/${userId}/provider/availability`);
            try {
                const docSnap = await getDoc(availabilityDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Convertir strings YYYY-MM-DD a objetos Date en UTC para evitar problemas de zona horaria
                    const dates = data.unavailableDates.map(dateStr => {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(Date.UTC(year, month - 1, day));
                    });
                    setUnavailableDates(dates);
                }
            } catch (error) {
                console.error("Error al cargar la disponibilidad:", error);
                alert("No se pudo cargar tu calendario de disponibilidad.");
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [userId]);

    const handleDateChange = (date) => {
        const dateString = toISODateString(date);
        const dateExists = unavailableDates.some(d => toISODateString(d) === dateString);

        if (dateExists) {
            setUnavailableDates(unavailableDates.filter(d => toISODateString(d) !== dateString));
        } else {
            setUnavailableDates([...unavailableDates, date]);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        const availabilityDocRef = doc(db, `artifacts/${appId}/users/${userId}/provider/availability`);
        try {
            const dateStrings = unavailableDates.map(toISODateString);
            await setDoc(availabilityDocRef, { unavailableDates: dateStrings }, { merge: true });
            alert('¡Disponibilidad guardada con éxito!');
        } catch (error) {
            console.error("Error al guardar la disponibilidad:", error);
            alert("Hubo un error al guardar tu calendario.");
        } finally {
            setSaving(false);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month' && unavailableDates.some(d => toISODateString(d) === toISODateString(date))) {
            return 'unavailable-day';
        }
        return null;
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-xl modern-shadow border-t-4 border-pink-500">
            <h2 className="text-2xl font-black text-pink-700 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6" /> Calendario y Disponibilidad
            </h2>
            <p className="text-gray-600 mb-4">Haz clic en los días del calendario para marcarlos como "No disponible". Vuelve a hacer clic para marcarlos como disponibles. No olvides guardar tus cambios.</p>
            {loading ? (
                <div className="flex justify-center items-center py-10 text-gray-600">
                    <LoaderCircle className="animate-spin w-8 h-8 mr-3" />
                    Cargando calendario...
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="calendar-container flex-grow">
                        <Calendar
                            onChange={handleDateChange}
                            value={unavailableDates}
                            tileClassName={tileClassName}
                            minDate={new Date()}
                            selectRange={false}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <button onClick={handleSave} disabled={saving} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:bg-pink-300 disabled:cursor-not-allowed transition">
                            {saving ? (<LoaderCircle className="animate-spin w-5 h-5" />) : (<Save className="w-5 h-5" />)}
                            {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManager;