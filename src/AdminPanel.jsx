import React from 'react';
import { ArrowLeft, Shield, Settings } from 'lucide-react';

const AdminPanel = ({ onBack, onManageCategories }) => {
    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-8 min-h-screen bg-gray-50">
            <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al panel principal
            </button>

            <div className="bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <h1 className="text-3xl font-extrabold text-violet-700 flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-yellow-500" />
                    Panel de Administración
                </h1>
                <p className="text-gray-600">Aquí se mostrarán las herramientas y estadísticas para la administración de la plataforma.</p>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Herramientas</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={onManageCategories} className="bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 justify-center">
                            <Settings className="w-5 h-5" />
                            Gestionar Categorías
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;