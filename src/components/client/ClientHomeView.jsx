import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CalendarCheck, ShieldCheck, DollarSign, Building2, Utensils, Sofa, Gift, Music, Camera } from 'lucide-react';
import ServiceSearchForm from './ServiceSearchForm';

/**
 * Vista de la página de inicio para el cliente.
 */
const ClientHomeView = ({ serviceCategories }) => {
    const navigate = useNavigate();

    const handleSearch = async ({ eventDate, mainCategory, subCategory }) => {
        const params = new URLSearchParams();
        if (eventDate) params.set('date', eventDate);
        if (mainCategory) params.set('mainCategory', mainCategory);
        if (subCategory) params.set('subCategory', subCategory);
        
        navigate(`/search?${params.toString()}`);
    };

    const categories = Object.keys(serviceCategories).map(name => {
        let icon;
        switch(name) {
            case 'Lugar': icon = Building2; break;
            case 'Catering': icon = Utensils; break;
            case 'Mobiliario': icon = Sofa; break;
            case 'Decoración': icon = Gift; break;
            case 'Música/DJ': icon = Music; break;
            case 'Fotografía': icon = Camera; break;
            default: icon = Briefcase;
        }
        return { name, icon };
    });

    return (
        <div className="min-h-screen">
            {/* Sección Principal (Hero Compacto) */}
            <header className="hero-background pt-12 pb-16 sm:pt-20 sm:pb-32 text-white">
                <div className="max-w-5xl mx-auto text-center px-4">
                    <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        El Control Maestro de tu Celebración
                    </h1>
                    <p className="text-base sm:text-xl font-light opacity-95">
                        Proveedor de élite con disponibilidad confirmada.
                    </p>
                </div>
            </header>

            {/* Tarjeta de Búsqueda (CRÍTICA) */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transform -translate-y-12">
                <ServiceSearchForm 
                    onSearch={handleSearch}
                    serviceCategories={serviceCategories}
                />
            </div>

            {/* Sección de Categorías Destacadas */}
            <section className="py-12 max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-6 px-4 sm:px-0">Explora por Categoría</h2>
                
                <div className="flex space-x-4 px-4 pb-4 overflow-x-auto horizontal-scroll-container sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:space-x-0 sm:gap-6">
                    {categories.map((cat) => (
                        <div 
                            key={cat.name}
                            onClick={() => alert(`Simulando búsqueda por categoría: ${cat.name}`)}
                            className="category-card flex-shrink-0 w-[120px] sm:w-auto text-center p-4 bg-white rounded-xl border border-gray-200 modern-shadow hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1"
                        >
                            <cat.icon className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                            <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-8 text-center">Nuestras Ventajas MasterParty</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Beneficio 1 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <CalendarCheck className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Disponibilidad en Vivo</h3>
                            <p className="text-sm text-gray-600">Filtra servicios que realmente están libres para tu fecha.</p>
                        </div>
                        {/* Beneficio 2 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <ShieldCheck className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Garantía de Calidad</h3>
                            <p className="text-sm text-gray-600">Solo proveedores pre-aprobados y verificados.</p>
                        </div>
                        {/* Beneficio 3 */}
                        <div className="bg-white p-6 rounded-xl modern-shadow border-t-4 border-violet-500 text-center">
                            <DollarSign className="w-8 h-8 mx-auto text-violet-600 mb-3" />
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Precios sin Sorpresas</h3>
                            <p className="text-sm text-gray-600">Compara tarifas finales de forma transparente.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ClientHomeView;