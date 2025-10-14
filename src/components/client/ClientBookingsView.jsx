import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Package, DollarSign, LoaderCircle, Frown, XCircle } from 'lucide-react';

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

const BookingCard = ({ booking }) => {
    const { serviceName, businessName, bookingDate, timeSlots, package: pkg, status, id: bookingId } = booking;

    const formatTime = (slot) => {
        const [hour, minute] = slot.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${formattedHour}:${minute} ${ampm}`;
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
        <div className="bg-white p-5 rounded-xl modern-shadow border border-gray-200">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-violet-800">{serviceName}</h3>
                    <p className="text-sm text-gray-500">de {businessName}</p>
                </div>
                <BookingStatusBadge status={status} />
            </div>
            <div className="border-t my-3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-pink-500" /> <span>{new Date(bookingDate + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-pink-500" /> <span>{formatTime(timeSlots[0])} - {formatTime(timeSlots[timeSlots.length - 1])}</span></div>
                <div className="flex items-center gap-2"><Package className="w-4 h-4 text-pink-500" /> <span>Paquete: {pkg.name}</span></div>
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-pink-500" /> <span className="font-semibold">${pkg.price}</span></div>
            </div>
            {status === 'pending' && (
                <div className="flex justify-end mt-4">
                    <button onClick={handleCancelBooking} className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-1"><XCircle className="w-4 h-4" /> Cancelar Reserva</button>
                </div>
            )}
        </div>
    );
};

const ClientBookingsView = () => {
    const { userId } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || userId === 'guest') {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(db, `artifacts/${appId}/bookings`);
        const q = query(bookingsRef, where("clientId", "==", userId), orderBy("createdAt", "desc"));

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
        <div className="max-w-4xl mx-auto p-4 sm:p-8 min-h-screen">
            <h1 className="text-3xl font-bold text-violet-800 mb-6">Mis Reservas</h1>
            {bookings.length === 0 ? (
                <div className="text-center py-10 px-6 bg-white border rounded-xl modern-shadow">
                    <Frown className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                    <p className="font-bold text-yellow-800">Aún no has realizado ninguna reserva.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                </div>
            )}
        </div>
    );
};

export default ClientBookingsView;
