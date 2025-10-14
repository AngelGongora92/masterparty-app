import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, GeoPoint } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Briefcase, Plus, Users, DollarSign, Trash2, Tag, MousePointerClick, Truck, UploadCloud, X, Clock, Package, UserCheck } from 'lucide-react';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const loadGoogleMapsScript = (apiKey, callback) => {
    if (window.google && window.google.maps) {
        callback();
        return;
    }
    const existingScript = document.getElementById('googleMapsScript');
    if (existingScript) {
        existingScript.addEventListener('load', callback);
        return;
    }
    const script = document.createElement('script');
    script.id = 'googleMapsScript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
};

const MapPicker = ({ value, onChange }) => {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);
    const markerInstanceRef = React.useRef(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);

    useEffect(() => {
        loadGoogleMapsScript(import.meta.env.VITE_GOOGLE_MAPS_API_KEY, () => {
            setIsApiLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (isApiLoaded && mapRef.current && !mapInstanceRef.current) {
            const initialLatLng = new window.google.maps.LatLng(value.latitude || 25.6866, value.longitude || -100.3161);
            const map = new window.google.maps.Map(mapRef.current, {
                center: initialLatLng,
                zoom: 12,
                disableDefaultUI: true,
                zoomControl: true,
            });
            const marker = new window.google.maps.Marker({ position: initialLatLng, map: map });

            mapInstanceRef.current = map;
            markerInstanceRef.current = marker;

            map.addListener('click', (e) => {
                const newLocation = { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
                onChange(newLocation);
            });
        }
    }, [isApiLoaded, onChange, value.latitude, value.longitude]);

    useEffect(() => {
        if (markerInstanceRef.current && mapInstanceRef.current && value.latitude && value.longitude) {
            const newLatLng = new window.google.maps.LatLng(value.latitude, value.longitude);
            markerInstanceRef.current.setPosition(newLatLng);
            if (mapInstanceRef.current.getCenter().lat() !== value.latitude || mapInstanceRef.current.getCenter().lng() !== value.longitude) {
                mapInstanceRef.current.panTo(newLatLng);
            }
        }
    }, [value.latitude, value.longitude]);

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

/**
 * Formulario para crear o editar un servicio.
 */
const ServiceForm = ({ userId, onServiceAdded, serviceCategories }) => {
    const { userData } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mainCategory: '',
        subCategory: '',
        costPerKm: '',
        freeKmRadius: '',
        packages: [{ name: '', duration: 1, capacity: '', price: '' }],
        location: { latitude: '', longitude: '' }
    });
    const [loading, setLoading] = useState(false);
    const [appliesShipping, setAppliesShipping] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const MAX_TIERS = 5;

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }
                    }));
                },
                () => {
                    console.warn("Permiso de ubicación denegado por el usuario.");
                }
            );
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newState = { ...formData, [name]: value };
        if (name === 'mainCategory') {
            newState.subCategory = '';
        }
        setFormData(newState);
    };

    const handleLocationChange = (newLocation) => {
        setFormData(prev => ({ ...prev, location: newLocation }));
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', mainCategory: '', subCategory: '', costPerKm: '', freeKmRadius: '', packages: [{ name: '', duration: 1, capacity: '', price: '' }], location: { latitude: '', longitude: '' } });
        setImageFiles([]);
        setImagePreviews([]);
        setAppliesShipping(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;

        setLoading(true);
        try {
            if (!formData.packages[0] || !formData.packages[0].name || !formData.packages[0].price) {
                alert('Por favor, completa al menos el nombre y el precio del primer paquete.');
                setLoading(false);
                return;
            }

            if (imageFiles.length === 0) {
                alert('Por favor, sube al menos una imagen para el servicio.');
                setLoading(false);
                return;
            }

            const processedPackages = formData.packages
                .filter(pkg => pkg.name && pkg.price)
                .map(pkg => ({ ...pkg, price: parseFloat(pkg.price), duration: parseFloat(pkg.duration), capacity: pkg.capacity || null }));

            const location = new GeoPoint(
                parseFloat(formData.location.latitude), 
                parseFloat(formData.location.longitude)
            );

            if (processedPackages.length === 0) throw new Error("Debe haber al menos un paquete válido.");

            const newService = {
                vendorId: userId,
                businessName: userData.businessName,
                name: formData.name,
                description: formData.description,
                mainCategory: formData.mainCategory,
                type: formData.subCategory,
                isActive: true,
                packages: processedPackages,
                basePrice: processedPackages[0].price,
                transferFeeRule: {
                    type: 'distance_radius',
                    costPerKm: parseFloat(formData.costPerKm),
                    freeKmRadius: parseInt(formData.freeKmRadius, 10),
                },
                location,
                imageUrls: [],
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            };

            // 1. Crear el documento del servicio en Firestore para obtener el ID
            const servicesRef = collection(db, `artifacts/${appId}/public/data/services`);
            const serviceDocRef = await addDoc(servicesRef, newService);
            const serviceId = serviceDocRef.id;

            // 2. Subir imágenes a Firebase Storage
            const storage = getStorage();
            const imageUrls = [];
            for (const file of imageFiles) {
                const imageRef = ref(storage, `services/${userId}/${serviceId}/${uuidv4()}`);
                await uploadBytes(imageRef, file);
                const url = await getDownloadURL(imageRef);
                imageUrls.push(url);
            }

            // 3. Actualizar el documento del servicio con las URLs de las imágenes
            await updateDoc(serviceDocRef, { imageUrls });

            alert('¡Servicio publicado con éxito!');
            resetForm();

            if (onServiceAdded) onServiceAdded();

        } catch (error) {
            console.error("Error al publicar el servicio:", error);
            alert(`Error al publicar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePackageChange = (index, e) => {
        const { name, value } = e.target;
        const newPackages = [...formData.packages];
        newPackages[index][name] = value;
        setFormData(prev => ({ ...prev, packages: newPackages }));
    };

    const addPackage = () => {
        if (formData.packages.length < MAX_TIERS) {
            setFormData(prev => ({ ...prev, packages: [...prev.packages, { name: '', duration: 1, capacity: '', price: '' }] }));
        }
    };

    const removePackage = (index) => {
        setFormData(prev => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (imageFiles.length + files.length > 5) {
            alert("Puedes subir un máximo de 5 imágenes.");
            return;
        }

        const newFiles = [...imageFiles, ...files];
        setImageFiles(newFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newFiles = imageFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        // Revocar el Object URL para liberar memoria
        URL.revokeObjectURL(imagePreviews[index]);

        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };

    return (
        <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200">
            <h2 className="text-2xl font-black text-violet-700 mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-pink-500" /> Publicar Nuevo Servicio
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Detalles Principales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Briefcase className="w-4 h-4 text-violet-500" /> Categoría Principal</label>
                            <select name="mainCategory" value={formData.mainCategory} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border">
                                <option value="">Selecciona una categoría</option>
                                {Object.keys(serviceCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Tag className="w-4 h-4 text-violet-500" /> Tipo de Servicio</label>
                            <select name="subCategory" value={formData.subCategory} onChange={handleChange} required disabled={!formData.mainCategory || serviceCategories[formData.mainCategory]?.length === 0} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border disabled:bg-gray-100">
                                <option value="">Selecciona un servicio</option>
                                {(serviceCategories[formData.mainCategory] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción Detallada</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border"></textarea>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Paquetes del Servicio</h3>
                    {formData.packages.map((pkg, index) => (
                        <div key={index} className="p-4 bg-violet-50 rounded-lg space-y-3 relative border border-violet-100">
                            <div className="flex-grow"><label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Package className="w-4 h-4 text-violet-500" /> Nombre del Paquete</label><input type="text" name="name" value={pkg.name} onChange={(e) => handlePackageChange(index, e)} required placeholder="Ej: Paquete Básico" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex-grow"><label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Clock className="w-4 h-4 text-violet-500" /> Duración</label><select name="duration" value={pkg.duration} onChange={(e) => handlePackageChange(index, e)} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border">{Array.from({ length: 16 }, (_, i) => { const hours = 0.5 * (i + 1); const hourPart = Math.floor(hours); const minutePart = (hours % 1) * 60; const label = `${hourPart > 0 ? `${hourPart}h` : ''} ${minutePart > 0 ? `${minutePart}min` : ''}`.trim(); return <option key={hours} value={hours}>{label}</option>; })}</select></div>
                                <div className="flex-grow"><label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Users className="w-4 h-4 text-violet-500" /> Capacidad</label><input type="text" name="capacity" value={pkg.capacity} onChange={(e) => handlePackageChange(index, e)} placeholder="Ej: 50 o N/A" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
                                <div className="flex-grow"><label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><DollarSign className="w-4 h-4 text-violet-500" /> Precio ($)</label><input type="number" name="price" value={pkg.price} onChange={(e) => handlePackageChange(index, e)} required min="0" placeholder="Ej: 1200" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
                            </div>
                            {formData.packages.length > 1 && (<button type="button" onClick={() => removePackage(index)} className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"><Trash2 className="w-4 h-4" /></button>)}
                        </div>
                    ))}
                    {formData.packages.length < MAX_TIERS && (<button type="button" onClick={addPackage} className="w-full text-violet-700 font-semibold py-2 px-4 border-2 border-dashed border-violet-300 rounded-lg hover:bg-violet-100 transition flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Añadir otro paquete</button>)}
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Ubicación y Tarifas de Traslado</h3>
                    <div className="bg-violet-50 border border-violet-200 text-violet-800 p-3 rounded-lg text-sm flex items-start gap-2">
                        <MousePointerClick className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div><span className="font-bold">Instrucción:</span> Haz clic en el mapa para seleccionar la ubicación exacta de tu servicio. El marcador se moverá al punto que elijas.</div>
                    </div>
                    <div className="h-64 w-full rounded-lg overflow-hidden border"><MapPicker value={formData.location} onChange={handleLocationChange} /></div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                        <input
                            id="appliesShipping"
                            name="appliesShipping"
                            type="checkbox"
                            checked={appliesShipping}
                            onChange={(e) => setAppliesShipping(e.target.checked)}
                            className="h-5 w-5 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                        />
                        <label htmlFor="appliesShipping" className="ml-3 block text-sm font-medium text-gray-800 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-violet-500" />
                            Aplica envío / traslado
                        </label>
                    </div>

                    {appliesShipping && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">Radio Gratuito (Km)</label><input type="number" name="freeKmRadius" value={formData.freeKmRadius} onChange={handleChange} required placeholder="Ej: 15" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Costo por Km extra</label><input type="number" step="any" name="costPerKm" value={formData.costPerKm} onChange={handleChange} required placeholder="Ej: 0.65" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-600 border-b pb-2">Imágenes del Servicio (hasta 5)</h3>
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <label htmlFor="image-upload" className="cursor-pointer text-violet-600 font-semibold flex flex-col items-center justify-center">
                            <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                            <span>Seleccionar imágenes</span>
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={imageFiles.length >= 5}
                        />
                    </div>
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img src={preview} alt={`Vista previa ${index + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button type="submit" disabled={loading} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:bg-pink-300 disabled:cursor-not-allowed transition">
                    {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Publicando...</>) : (<><Plus className="w-5 h-5" /> Publicar Servicio</>)}
                </button>
            </form>
        </div>
    );
};

export default ServiceForm;