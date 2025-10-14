import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Calendar, Users, ArrowLeft, Edit, Briefcase } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-3 border-b border-gray-200">
        <Icon className="w-5 h-5 text-violet-500 mt-1 mr-4" />
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value || 'No especificado'}</p>
        </div>
    </div>
);

const AccountDisplayView = () => {
    const { userId, userData: contextUserData } = useAuth();
    const [userData, setUserData] = useState(contextUserData); // Usar el del contexto como valor inicial
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        if (contextUserData) {
            setUserData(contextUserData);
            setLoading(false);
        } else if (userId === 'guest') {
            setError('Debes iniciar sesión para ver tu perfil.');
            setLoading(false);
        }
    }, [contextUserData, userId]);

    if (loading) {
        return <div className="text-center p-10">Cargando tus datos...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }

    if (!userData) {
        return <div className="text-center p-10">No se encontraron datos del perfil.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al panel
            </button>

            <div className="bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-violet-700 flex items-center gap-3">
                        <User className="w-8 h-8" /> Mi Perfil
                    </h1>
                    <Link
                        to="/account/edit"
                        className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Actualizar
                    </Link>
                </div>

                <div className="space-y-2">
                    <InfoRow
                        icon={User}
                        label="Nombre Completo"
                        value={`${userData.firstName} ${userData.lastName}`}
                    />
                    <InfoRow
                        icon={Mail}
                        label="Correo Electrónico"
                        value={userData.email}
                    />
                    <InfoRow
                        icon={Phone}
                        label="Número de Teléfono"
                        value={userData.phoneNumber}
                    />
                    <InfoRow icon={Calendar} label="Edad" value={userData.age} />
                    <InfoRow icon={Users} label="Sexo" value={userData.gender} />
                </div>

                {/* Sección para convertirse en proveedor */}
                {userData.roles && !userData.roles.includes('prestador') && (
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-600 mb-4">¿Quieres ofrecer tus servicios en MasterParty?</p>
                        <Link
                            to="/account/become-provider"
                            className="font-semibold text-violet-600 hover:text-violet-800 transition disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            Registrarme como proveedor de servicios
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountDisplayView;