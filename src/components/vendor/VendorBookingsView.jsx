import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Calendar, Clock, Package, User, DollarSign, LoaderCircle, Frown, Check, X } from 'lucide-react';

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
            return <span className={`${baseClasses} bg-gray-200 text-gray-600`}>Cancelada por cliente</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const BookingCard = ({ booking }) => {
    const { clientName, serviceName, slotsByDate, package: pkg, status, id: bookingId } = booking;

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

    const handleUpdateStatus = async (newStatus) => {
        if (status !== 'pending') return;
        const bookingRef = doc(db, `artifacts/${appId}/bookings`, bookingId);
        try {
            await updateDoc(bookingRef, { status: newStatus });
        } catch (error) {
            console.error("Error al actualizar el estado de la reserva:", error);
            alert('No se pudo actualizar la reserva.');
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl modern-shadow border border-gray-200">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-violet-800">{serviceName}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><User className="w-4 h-4 text-pink-500" /> Solicitado por: <span className="font-semibold">{clientName}</span></p>
                </div>
                <BookingStatusBadge status={status} />
            </div>
            <div className="border-t my-3"></div>
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
            {status === 'pending' && (
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => handleUpdateStatus('rejected')} className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-1"><X className="w-4 h-4" /> Rechazar</button>
                    <button onClick={() => handleUpdateStatus('accepted')} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1"><Check className="w-4 h-4" /> Aceptar</button>
                </div>
            )}
        </div>
    );
};

const VendorBookingsView = () => {
    const { userId } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || userId === 'guest') {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(db, `artifacts/${appId}/bookings`);
        const q = query(bookingsRef, where("vendorId", "==", userId), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-violet-800 flex items-center gap-2">
                    <Bell className="w-7 h-7 text-pink-500" /> Gestión de Reservas
                </h1>
            </div>
            <p className="text-gray-600 mb-6">Aquí podrás ver y gestionar todas tus solicitudes de reserva.</p>
            {bookings.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white border rounded-xl modern-shadow">
                    <Frown className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                    <p className="font-bold text-yellow-800">Aún no tienes ninguna solicitud de reserva.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                </div>
            )}
        </div>
    );
};

export default VendorBookingsView;