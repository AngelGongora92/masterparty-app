import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, writeBatch, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId, auth } from '../../firebase';
import { ArrowLeft, Building, Phone, Mail, Sparkles, Link as LinkIcon, Globe, Instagram, Facebook } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BecomeProviderView = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        phoneNumber: '',
        contactEmail: '',
        instagramUrl: '',
        facebookUrl: '',
        tiktokUrl: '',
        websiteUrl: '',
    });
    const { userId } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userProfileRef = useCallback(() => {
        return doc(db, `artifacts/${appId}/users/${userId}`);
    }, [userId]);

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 50);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
            // 1. Verificar si el nombre del negocio ya está en uso.
            // Para hacer la comparación insensible a mayúsculas/minúsculas, normalizamos ambos a minúsculas.
            const providersRef = collection(db, `artifacts/${appId}/providers`);
            const q = query(providersRef, where("businessNameNormalized", "==", formData.businessName.toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setError('Este nombre de negocio ya está en uso. Por favor, elige otro.');
                setLoading(false);
                return;
            }

            // 2. Generar el slug a partir del nombre, que ahora sabemos que es único.
            const slug = generateSlug(formData.businessName);

            // Usamos un batch para asegurar que todas las operaciones sean atómicas
            const batch = writeBatch(db);
            const providersCollectionRef = collection(db, `artifacts/${appId}/providers`);
            
            // 1. Crear el nuevo documento del proveedor para obtener un ID
            const newProviderRef = doc(providersCollectionRef);

            // 2. Preparar los datos del nuevo proveedor
            const providerData = {
                ownerId: userId, // Guardamos quién es el dueño original
                adminUids: [userId], // Un array para futuros administradores
                businessNameNormalized: processedData.businessName.toLowerCase(), // Guardamos la versión normalizada para búsquedas
                businessName: processedData.businessName,
                phoneNumber: processedData.phoneNumber,
                contactEmail: processedData.contactEmail,
                instagramUrl: processedData.instagramUrl,
                facebookUrl: processedData.facebookUrl,
                tiktokUrl: processedData.tiktokUrl,
                websiteUrl: processedData.websiteUrl,
                slug: slug,
            };
            batch.set(newProviderRef, providerData);

            // 3. Actualizar el documento del usuario para añadir el rol y el ID del proveedor
            batch.update(userProfileRef(), {
                roles: arrayUnion('prestador'),
                providerId: newProviderRef.id, // Vinculamos el usuario al proveedor
            });

            // 4. Ejecutar las operaciones en la base de datos.
            await batch.commit();

            alert('¡Felicidades! Ahora eres un proveedor. La página se recargará para mostrar tu nuevo panel.');
            await auth.currentUser.getIdToken(true); // Forzar refresco del token para que App.jsx detecte el cambio
            navigate('/vendor/dashboard');

        } catch (err) {
            console.error("Error al registrarse como proveedor:", err);
            setError('Ocurrió un error al guardar tus datos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
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

                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-2">Redes Sociales (Opcional)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Instagram</label>
                                <div className="relative mt-1">
                                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="text" name="instagramUrl" placeholder="instagram.com/tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Facebook</label>
                                <div className="relative mt-1">
                                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="text" name="facebookUrl" placeholder="facebook.com/tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">TikTok</label>
                                <div className="relative mt-1">
                                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="text" name="tiktokUrl" placeholder="tiktok.com/@tunegocio" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Página Web</label>
                                <div className="relative mt-1">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input type="text" name="websiteUrl" placeholder="tunegocio.com" onChange={handleChange} className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
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