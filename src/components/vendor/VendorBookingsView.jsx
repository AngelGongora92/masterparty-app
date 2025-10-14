import React from 'react';
import { Bell } from 'lucide-react';

const VendorBookingsView = () => {
    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-violet-800 flex items-center gap-2">
                    <Bell className="w-7 h-7 text-pink-500" /> Gestión de Reservas
                </h1>
            </div>
            <p className="text-gray-600 mb-6">Aquí podrás ver y gestionar todas tus solicitudes de reserva.</p>
            <div className="bg-white p-10 rounded-xl modern-shadow text-center text-gray-500">Próximamente: Listado de reservas pendientes, confirmadas y rechazadas.</div>
        </div>
    );
};

export default VendorBookingsView;