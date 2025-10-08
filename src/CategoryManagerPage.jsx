import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { db, appId } from './firebase';
import { Tag, Plus, Edit, Trash2, Save, X, LoaderCircle, ArrowLeft, FilePenLine, ChevronRight, Briefcase } from 'lucide-react';

const CategoryManagerPage = ({ onBack }) => {
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State for main category management
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // State for service (sub-category) management
    const [newServiceName, setNewServiceName] = useState('');
    const [editingService, setEditingService] = useState(null); // Stores the original name of the service being edited
    const [editingServiceName, setEditingServiceName] = useState('');

    const categoriesDocRef = doc(db, `artifacts/${appId}/public/data`);

    useEffect(() => {
        const unsubscribe = onSnapshot(categoriesDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().service_categories) {
                setCategories(docSnap.data().service_categories);
            } else {
                setCategories({});
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Effect to handle category deletion or renaming
    useEffect(() => {
        // If the selected category no longer exists, deselect it.
        if (selectedCategory && !categories[selectedCategory]) {
            setSelectedCategory(null);
        }
    }, [categories, selectedCategory]);


    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            await updateDoc(categoriesDocRef, {
                [`service_categories.${newCategoryName.trim()}`]: []
            });
            setNewCategoryName('');
        } catch (error) {
            console.error("Error adding category:", error);
            alert('Error al añadir la categoría. Asegúrate de que las reglas de Firestore estén configuradas.');
        }
    };

    const handleUpdateCategory = async (originalName) => {
        if (!editingCategoryName.trim()) return;
        try {
            const newCategories = { ...categories };
            const subCategories = newCategories[originalName];
            delete newCategories[originalName];
            newCategories[editingCategoryName.trim()] = subCategories;

            await setDoc(categoriesDocRef, { service_categories: newCategories }, { merge: true });

            setEditingCategoryId(null);
            setEditingCategoryName('');
        } catch (error) {
            console.error("Error updating category:", error);
            alert('Error al actualizar la categoría.');
        }
    };

    const handleDeleteCategory = async (categoryName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}" y todos sus servicios? Esta acción no se puede deshacer.`)) {
            try {
                await updateDoc(categoriesDocRef, {
                    [`service_categories.${categoryName}`]: deleteField()
                });
                // If the deleted category was the selected one, clear the selection
                if (selectedCategory === categoryName) {
                    setSelectedCategory(null);
                }
            } catch (error) {
                console.error("Error deleting category:", error);
                alert('Error al eliminar la categoría.');
            }
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        const serviceName = newServiceName.trim();
        if (!serviceName || !selectedCategory) return;
        try {
            await updateDoc(categoriesDocRef, {
                [`service_categories.${selectedCategory}`]: arrayUnion(serviceName)
            });
            setNewServiceName('');
        } catch (error) {
            console.error("Error adding service:", error);
            alert('Error al añadir el servicio.');
        }
    };

    const handleDeleteService = async (serviceName) => {
        if (!selectedCategory) return;
        if (window.confirm(`¿Seguro que quieres eliminar el servicio "${serviceName}"?`)) {
            try {
                await updateDoc(categoriesDocRef, {
                    [`service_categories.${selectedCategory}`]: arrayRemove(serviceName)
                });
            } catch (error) {
                console.error("Error deleting service:", error);
                alert('Error al eliminar el servicio.');
            }
        }
    };

    const handleUpdateService = async () => {
        const newName = editingServiceName.trim();
        if (!newName || !selectedCategory || !editingService || newName === editingService) {
            cancelEditingService();
            return;
        }

        try {
            const currentServices = categories[selectedCategory] || [];
            const serviceIndex = currentServices.indexOf(editingService);

            if (serviceIndex === -1) throw new Error("El servicio original no fue encontrado.");

            const updatedSubCategories = [...currentServices];
            updatedSubCategories[serviceIndex] = newName;

            await updateDoc(categoriesDocRef, {
                [`service_categories.${selectedCategory}`]: updatedSubCategories
            });

            cancelEditingService();
        } catch (error) {
            console.error("Error updating service:", error);
            alert('Error al actualizar el servicio.');
        }
    };

    const startEditing = (name) => {
        setEditingCategoryId(name);
        setEditingCategoryName(name);
    };

    const cancelEditing = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const startEditingService = (serviceName) => {
        setEditingService(serviceName);
        setEditingServiceName(serviceName);
    };

    const cancelEditingService = () => {
        setEditingService(null);
        setEditingServiceName('');
    };

    return (
        <div className="p-4 sm:p-8 max-w-2xl mx-auto min-h-screen bg-gray-50">
            <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al panel
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- Columna Izquierda: Categorías --- */}
                <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200">
                    <h2 className="text-xl font-black text-violet-700 mb-4 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-pink-500" /> Categorías Principales
                    </h2>
                    <div className="space-y-2 mb-6">
                        {loading ? (
                            <div className="flex items-center justify-center text-gray-500"><LoaderCircle className="animate-spin w-5 h-5 mr-2" />Cargando...</div>
                        ) : Object.keys(categories).length > 0 ? (
                            Object.keys(categories).sort().map(catName => (
                                <div key={catName} className={`group rounded-lg transition-all ${selectedCategory === catName ? 'bg-violet-100' : 'hover:bg-gray-50'}`}>
                                    {editingCategoryId === catName ? (
                                        <div className="flex items-center gap-2 p-3">
                                            <input type="text" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(catName)} className="flex-grow p-1 border border-violet-300 rounded-md font-semibold" autoFocus />
                                            <button onClick={() => handleUpdateCategory(catName)} className="p-1 text-green-600 hover:bg-green-100 rounded-full"><Save className="w-4 h-4" /></button>
                                            <button onClick={cancelEditing} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setSelectedCategory(catName)}>
                                            <span className={`font-semibold ${selectedCategory === catName ? 'text-violet-800' : 'text-gray-800'}`}>{catName}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                <button onClick={(e) => { e.stopPropagation(); startEditing(catName); }} className="p-1 text-gray-500 hover:text-violet-600 rounded-full"><Edit className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(catName); }} className="p-1 text-gray-500 hover:text-red-600 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                                <ChevronRight className={`w-5 h-5 transition-transform ${selectedCategory === catName ? 'text-violet-600' : 'text-gray-400'}`} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No hay categorías.</p>
                        )}
                    </div>
                    <form onSubmit={handleAddCategory} className="mt-4 pt-4 border-t flex gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nueva categoría"
                            className="flex-grow p-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button type="submit" className="bg-violet-500 text-white p-2 rounded-lg shadow-sm hover:bg-violet-600 flex items-center gap-1 text-sm">
                            <Plus className="w-4 h-4" /> Añadir
                        </button>
                    </form>
                </div>

                {/* --- Columna Derecha: Servicios --- */}
                <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200">
                    {selectedCategory ? (
                        <>
                            <h2 className="text-xl font-black text-violet-700 mb-4 flex items-center gap-2">
                                <Tag className="w-6 h-6 text-pink-500" /> Servicios en "{selectedCategory}"
                            </h2>
                            <div className="space-y-2 mb-6">
                                {(categories[selectedCategory] || []).map(serviceName => (
                                    <div key={serviceName} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                        {editingService === serviceName ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input type="text" value={editingServiceName} onChange={(e) => setEditingServiceName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateService()} className="flex-grow p-1 border border-violet-300 rounded-md text-sm" autoFocus />
                                                <button onClick={handleUpdateService} className="p-1 text-green-600 hover:bg-green-100 rounded-full"><Save className="w-4 h-4" /></button>
                                                <button onClick={cancelEditingService} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-gray-700">{serviceName}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                    <button onClick={() => startEditingService(serviceName)} className="p-1 text-gray-500 hover:text-violet-600 rounded-full"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteService(serviceName)} className="p-1 text-gray-500 hover:text-red-600 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {(categories[selectedCategory] || []).length === 0 && !loading && (
                                    <p className="text-center text-gray-500 py-4">No hay servicios en esta categoría.</p>
                                )}
                            </div>
                            <form onSubmit={handleAddService} className="mt-4 pt-4 border-t flex gap-2">
                                <input
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    placeholder="Nuevo servicio"
                                    className="flex-grow p-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button type="submit" className="bg-violet-500 text-white p-2 rounded-lg shadow-sm hover:bg-violet-600 flex items-center gap-1 text-sm">
                                    <Plus className="w-4 h-4" /> Añadir
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <FilePenLine className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="font-bold text-lg">Gestionar Servicios</h3>
                            <p>Selecciona una categoría de la izquierda para ver y editar sus servicios.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenedor principal del título, ahora fuera del layout de columnas */}
            <div className="bg-white p-6 rounded-xl modern-shadow border border-violet-200 hidden">
                {/* Este div se mantiene por si se quiere re-usar la estructura anterior, pero está oculto */}
                <form onSubmit={handleAddCategory} className="mt-6 pt-4 border-t flex gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nueva categoría principal"
                        className="flex-grow p-3 border border-gray-300 rounded-lg"
                    />
                    <button type="submit" className="cta-button text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Añadir
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CategoryManagerPage;