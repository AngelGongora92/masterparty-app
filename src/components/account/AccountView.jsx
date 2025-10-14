import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Calendar, Users, ArrowLeft } from 'lucide-react';

const AccountView = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        age: '',
        gender: 'Otro',
    });
    const { userId } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const userDocRef = useCallback(() => {
        return doc(db, `artifacts/${appId}/users/${userId}/profile/settings`);
    }, [userId]);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const docSnap = await getDoc(userDocRef());
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                } else {
                    setError('No se pudo encontrar el perfil del usuario.');
                }
            } catch (err) {
                console.error("Error al obtener datos del usuario:", err);
                setError('Ocurrió un error al cargar tus datos.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId, userDocRef]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            await updateDoc(userDocRef(), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                age: parseInt(formData.age, 10),
                gender: formData.gender,
            });
            setSuccess('¡Tus datos han sido actualizados con éxito!');
        } catch (err) {
            console.error("Error al actualizar el perfil:", err);
            setError('No se pudieron guardar los cambios. Intenta de nuevo.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Cargando tus datos...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver a mi perfil
            </button>

            <div className="bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <h1 className="text-3xl font-extrabold text-violet-700 mb-6 flex items-center gap-3">
                    <User className="w-8 h-8" /> Mi Cuenta
                </h1>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Correo Electrónico (no se puede cambiar)</label>
                        <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="email" name="email" value={formData.email} readOnly className="w-full pl-10 p-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Teléfono</label>
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Edad</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sexo</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full p-3 border border-gray-300 rounded-xl">
                                <option>Otro</option>
                                <option>Masculino</option>
                                <option>Femenino</option>
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                    {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

                    <button type="submit" disabled={updating} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg disabled:bg-pink-300">
                        {updating ? 'Actualizando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AccountView;