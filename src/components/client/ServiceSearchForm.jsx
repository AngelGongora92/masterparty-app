import React, { useState } from 'react';
import { Search, Briefcase, CalendarCheck, Tag } from 'lucide-react';

const ServiceSearchForm = ({ onSearch, serviceCategories, isSearching, userId }) => {
    const [eventDate, setEventDate] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ eventDate, mainCategory, subCategory });
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl modern-shadow w-full border-2 border-pink-500/20">
            <h3 className="text-gray-900 text-xl font-black mb-4 text-left">Busca por Fecha y Servicio</h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Campo Fecha (CRÍTICO) */}
                <div className="md:col-span-2">
                    <label htmlFor="date-input" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Fecha de tu Evento</label>
                    <div className="relative">
                        <CalendarCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <input
                            type={eventDate ? "date" : "text"}
                            id="date-input"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            placeholder="Todas las fechas"
                            className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 h-12"
                        />
                    </div>
                </div>
                
                {/* Campo Tipo de Servicio */}
                <div className="md:col-span-1">
                    <label htmlFor="type-select" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Tipo de Servicio</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <select 
                            id="type-select" 
                            value={mainCategory}
                            onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); }}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 appearance-none h-12"
                        >
                            <option value="">Categorías</option>
                            {Object.keys(serviceCategories).map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Campo Sub-Categoría */}
                <div className="md:col-span-1">
                    <label htmlFor="subtype-select" className="block text-xs font-bold uppercase text-gray-600 text-left mb-1">Servicio</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-500 w-5 h-5" />
                        <select 
                            id="subtype-select" 
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            disabled={!mainCategory}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-gray-800 appearance-none h-12 disabled:bg-gray-100"
                        >
                            <option value="">Todos</option>
                            {(serviceCategories[mainCategory] || []).map(sub => <option key={sub}>{sub}</option>)}
                        </select>
                    </div>
                </div>
                
                {/* Botón de Búsqueda */}
                <div className="md:col-span-4 lg:col-span-1 flex items-end mt-2 md:mt-0">
                    <button type="submit" disabled={isSearching} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-xl flex justify-center items-center gap-2 h-12 disabled:opacity-50">
                        <Search className="w-5 h-5" />
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-right italic">
                ID de Usuario: {userId}
            </p>
        </div>
    );
};

export default ServiceSearchForm;