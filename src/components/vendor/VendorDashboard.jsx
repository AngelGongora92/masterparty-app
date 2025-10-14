import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CalendarClock, Bell, PlusCircle, Store, Link as LinkIcon, Save, LoaderCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ServiceList from './ServiceList';
import { doc, collectionGroup, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

const SlugEditor = ({ currentSlug, userId }) => {
    const [slug, setSlug] = useState(currentSlug);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const providerDetailsRef = doc(db, `artifacts/${appId}/users/${userId}/provider/details`);

    const handleSlugChange = (e) => {
        const newSlug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '');
        setSlug(newSlug);
    };

    const handleSaveSlug = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        if (slug === currentSlug) {
            setLoading(false);
            return;
        }

        if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3) {
            setError('La URL solo puede contener letras minúsculas, números, guiones y tener al menos 3 caracteres.');
            setLoading(false);
            return;
        }

        try {
            // Verificar que el slug sea único (excluyendo el propio del usuario)
            const slugQuery = query(collectionGroup(db, 'provider'), where('slug', '==', slug));
            const querySnapshot = await getDocs(slugQuery);
            
            if (!querySnapshot.empty && querySnapshot.docs[0].ref.parent.parent.id !== userId) {
                setError('Esta URL ya está en uso. Por favor, elige otra.');
                setLoading(false);
                return;
            }

            await updateDoc(providerDetailsRef, { slug: slug });
            setSuccess('¡URL actualizada con éxito!');

        } catch (err) {
            console.error("Error al actualizar el slug:", err);
            setError('No se pudo actualizar la URL. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl modern-shadow border mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><LinkIcon className="w-5 h-5 text-pink-500" /> URL de tu Tienda</h2>
            <div className="flex items-center gap-2">
                <span className="text-gray-500 bg-gray-100 p-3 rounded-l-lg border border-r-0 border-gray-300">masterparty.app/store/</span>
                <input type="text" value={slug} onChange={handleSlugChange} className="flex-grow p-2.5 border border-gray-300 rounded-r-lg focus:ring-violet-500 focus:border-violet-500" />
                <button onClick={handleSaveSlug} disabled={loading || slug === currentSlug} className="bg-violet-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-violet-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                    {loading ? <LoaderCircle className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    Guardar
                </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            {success && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {success}</p>}
        </div>
    );
};

/**
 * Vista principal para el Prestador de Servicios.
 */
const VendorDashboardView = ({ serviceCategories }) => {
    // Estado para forzar la recarga de la lista después de añadir un servicio
    const { userId, userData, user } = useAuth();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0); 

    const forceRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-violet-800 flex items-center gap-2 mb-4">
                <Briefcase className="w-7 h-7 text-pink-500" /> {userData?.businessName ? `Panel de ${userData.businessName}` : 'Panel de servicios'}
            </h1>
            <p className="text-gray-600 mb-6">Tu centro de control para gestionar servicios, calendario y reservas.</p>

            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <button onClick={() => navigate('/vendor/bookings')} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition">
                    <Bell className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Gestionar Reservas</div><div className="text-xs text-gray-500">Acepta o rechaza solicitudes</div></div>
                </button>
                <button
                    onClick={() => navigate('/vendor/calendar')}
                    className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition" 
                >
                    <CalendarClock className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Gestionar Calendario</div><div className="text-xs text-gray-500">Define tu disponibilidad</div></div>
                </button>
                <button onClick={() => navigate('/vendor/services/new')} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition">
                    <PlusCircle className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Crear Nuevo Servicio</div><div className="text-xs text-gray-500">Añade un servicio a tu catálogo</div></div>
                </button>
                <button onClick={() => navigate(`/store/${userData.slug}`)} disabled={!userData?.slug} className="bg-white p-4 rounded-xl modern-shadow border flex items-center gap-3 text-left hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Store className="w-6 h-6 text-pink-500" />
                    <div><div className="font-bold text-gray-800">Ver mi Tienda</div><div className="text-xs text-gray-500">Tu página pública</div></div>
                </button>
            </div>
            
            {/* Editor de Slug */}
            {userData?.slug && <SlugEditor currentSlug={userData.slug} userId={userId} />}

            {/* Listado de Servicios */}
            <ServiceList userId={userId} key={refreshKey} />
        </div>
    );
};

export default VendorDashboardView;