import React, { useState, useCallback } from 'react';
import { doc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db, appId, auth } from './firebase';
import { ArrowLeft, Building, Phone, Mail, Sparkles } from 'lucide-react';

const BecomeProviderView = ({ userId, onBack }) => {
    const [formData, setFormData] = useState({
        businessName: '',
        phoneNumber: '',
        contactEmail: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userProfileRef = useCallback(() => {
        return doc(db, `artifacts/${appId}/users/${userId}/profile/settings`);
    }, [userId]);

    const providerDetailsRef = useCallback(() => {
        return doc(db, `artifacts/${appId}/users/${userId}/provider/details`);
    }, [userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Usamos un batch para asegurar que ambas escrituras sean atómicas
            const batch = writeBatch(db);

            // 1. Guardar los nuevos detalles del proveedor
            batch.set(providerDetailsRef(), {
                businessName: formData.businessName,
                phoneNumber: formData.phoneNumber,
                contactEmail: formData.contactEmail,
                createdAt: Date.now(),
            });

            // 2. Actualizar el rol del usuario a 'prestador'
            batch.update(userProfileRef(), {
                roles: arrayUnion('prestador')
            });

            // Ejecutar el batch
            await batch.commit();

            alert('¡Felicidades! Ahora eres un proveedor. La página se recargará para mostrar tu nuevo panel.');
            await auth.currentUser.getIdToken(true); // Forzar refresco del token para que App.jsx detecte el cambio

        } catch (err) {
            console.error("Error al registrarse como proveedor:", err);
            setError('Ocurrió un error al guardar tus datos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver a mi perfil
            </button>

            <div className="bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <h1 className="text-3xl font-extrabold text-violet-700 mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-pink-500" /> ¡Conviértete en Proveedor!
                </h1>
                <p className="text-gray-600 mb-6">Completa los datos de tu negocio para empezar a ofrecer tus servicios.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                        <div className="relative mt-1">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="businessName" onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono del Negocio</label>
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="tel" name="phoneNumber" onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Correo de Contacto</label>
                        <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="email" name="contactEmail" onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <button type="submit" disabled={loading} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg disabled:bg-pink-300">
                        {loading ? 'Registrando...' : 'Finalizar Registro como Proveedor'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BecomeProviderView;