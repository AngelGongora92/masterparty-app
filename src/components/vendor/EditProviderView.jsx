import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Building, Phone, Mail, Globe, Instagram, Facebook, Link as LinkIcon, Save, LoaderCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const EditProviderView = () => {
    const { userData, isAuthReady } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        businessName: '',
        phoneNumber: '',
        contactEmail: '',
        instagramUrl: '',
        facebookUrl: '',
        tiktokUrl: '',
        websiteUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const providerDocRef = useCallback(() => {
        if (!userData?.providerId) return null;
        return doc(db, `artifacts/${appId}/providers/${userData.providerId}`);
    }, [userData?.providerId]);

    useEffect(() => {
        if (isAuthReady && userData) {
            setFormData({
                businessName: userData.businessName || '',
                phoneNumber: userData.phoneNumber || '',
                contactEmail: userData.contactEmail || '',
                instagramUrl: userData.instagramUrl || '',
                facebookUrl: userData.facebookUrl || '',
                tiktokUrl: userData.tiktokUrl || '',
                websiteUrl: userData.websiteUrl || '',
            });
            setLoading(false);
        }
    }, [isAuthReady, userData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        const ref = providerDocRef();
        if (!ref) {
            setError('No se pudo encontrar el perfil del proveedor.');
            setUpdating(false);
            return;
        }

        // Pre-procesar las URLs para añadir https:// si es necesario
        const processedData = { ...formData };
        const urlFields = ['instagramUrl', 'facebookUrl', 'tiktokUrl', 'websiteUrl'];
        urlFields.forEach(field => {
            const url = processedData[field];
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                processedData[field] = `https://${url}`;
            }
        });

        try {
            await updateDoc(ref, {
                // No actualizamos businessName ni businessNameNormalized
                phoneNumber: processedData.phoneNumber,
                contactEmail: processedData.contactEmail,
                instagramUrl: processedData.instagramUrl,
                facebookUrl: processedData.facebookUrl,
                tiktokUrl: processedData.tiktokUrl,
                websiteUrl: processedData.websiteUrl,
            });
            setSuccess('¡Perfil actualizado con éxito!');
        } catch (err) {
            console.error("Error al actualizar el perfil del proveedor:", err);
            setError('Ocurrió un error al guardar los cambios.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-10"><LoaderCircle className="animate-spin w-8 h-8 text-violet-500" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al panel
            </button>

            <div className="bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <h1 className="text-3xl font-extrabold text-violet-700 mb-6">Editar Perfil del Negocio</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Negocio (no se puede cambiar)</label>
                        <div className="relative mt-1">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" value={formData.businessName} readOnly className="w-full pl-10 p-3 border border-gray-300 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono del Negocio</label>
                        <div className="relative mt-1"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Correo de Contacto</label>
                        <div className="relative mt-1"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div>
                    </div>

                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-2">Redes Sociales y Web</h3>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700">Instagram</label><div className="relative mt-1"><Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" name="instagramUrl" value={formData.instagramUrl} placeholder="instagram.com/tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div></div>
                            <div><label className="block text-sm font-medium text-gray-700">Facebook</label><div className="relative mt-1"><Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" name="facebookUrl" value={formData.facebookUrl} placeholder="facebook.com/tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div></div>
                            <div><label className="block text-sm font-medium text-gray-700">TikTok</label><div className="relative mt-1"><LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" name="tiktokUrl" value={formData.tiktokUrl} placeholder="tiktok.com/@tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div></div>
                            <div><label className="block text-sm font-medium text-gray-700">Página Web</label><div className="relative mt-1"><Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" name="websiteUrl" value={formData.websiteUrl} placeholder="tunegocio.com" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" /></div></div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
                    {success && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {success}</p>}

                    <button type="submit" disabled={updating} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg disabled:bg-pink-300 flex items-center justify-center gap-2">
                        {updating ? <LoaderCircle className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProviderView;