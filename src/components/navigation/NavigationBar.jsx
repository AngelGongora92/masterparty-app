import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Menu, ShieldCheck, Briefcase, Users, User, X } from 'lucide-react';

const NavigationBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuButtonRef = useRef(null);
    const { user, userData, userRoles, activeRole, setActiveRole, isAuthReady } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut(auth);
        navigate('/'); // Redirige al home de invitado inmediatamente
        setIsMenuOpen(false); // Cierra el menú al salir
    };

    // Efecto para cerrar el menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isMenuOpen &&
                menuRef.current && !menuRef.current.contains(event.target) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <nav className="bg-white border-b border-gray-100 p-3 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Nombre de la Marca */}
                <Link
                    to="/"
                    onClick={() => {
                        // Si el usuario está logueado, lo lleva al home de cliente, si no, al home de invitado.
                        if (user) {
                            setActiveRole('cliente');
                        }
                    }}
                    className="text-xl font-black text-violet-700 flex items-center gap-1 sm:text-2xl cursor-pointer"
                >
                    <Sparkles className="text-pink-500 w-5 h-5 sm:w-6 sm:h-6" />
                    MasterParty
                </Link>
                
                {/* Acciones de Usuario */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {user ? (
                        <>
                            {userData?.firstName && (
                                <span className="font-semibold text-gray-600 hidden sm:block">
                                    Hola {userData.firstName},
                                </span>
                            )}
                            {userRoles.includes('admin') && (
                                 <Link
                                    to="/admin"
                                    className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Panel Admin
                                </Link>
                            )}
                            {userRoles.includes('cliente') && activeRole === 'prestador' && (
                                <Link
                                    to="/"
                                    onClick={() => {
                                        setActiveRole('cliente');
                                    }}
                                    className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    <Users className="w-4 h-4" />
                                    Modo Cliente
                                </Link>
                            )}
                            {userRoles.includes('prestador') && activeRole === 'cliente' && (
                                <>
                                 <Link
                                    to="/vendor/dashboard"
                                    onClick={() => setActiveRole('prestador')}
                                    className="px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    <Briefcase className="w-4 h-4" /> Panel servicios
                                </Link>
                                </>
                            )}
                            <Link
                                to="/account"
                                className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Mi Cuenta
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-md font-semibold text-sm hidden sm:block"
                            >
                                Salir
                            </button>
                            <button 
                                className="sm:hidden text-gray-700 text-xl p-1"
                                ref={menuButtonRef}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </>
                    ) : (
                        isAuthReady && (
                            <>
                                <Link
                                    to="/login"
                                    className="cta-button text-white px-4 py-2 rounded-xl shadow-md font-semibold text-sm"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-md font-semibold text-sm hidden sm:block"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )
                    )}
                </div>
            </div>

            {/* Menú Móvil Desplegable */}
            <div
                ref={menuRef}
                className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="mt-3 space-y-2 pb-4 border-t border-gray-200">
                    {userRoles.includes('admin') && ( <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="w-full text-left px-3 py-2 rounded-md font-medium text-yellow-800 hover:bg-yellow-50 flex items-center gap-2"> <ShieldCheck className="w-5 h-5" /> Panel Admin </Link> )}
                    {userRoles.includes('cliente') && activeRole === 'prestador' && ( <Link to="/" onClick={() => { setActiveRole('cliente'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"> <Users className="w-5 h-5" /> Modo Cliente </Link> )}
                    {userRoles.includes('prestador') && activeRole === 'cliente' && ( <Link to="/vendor/dashboard" onClick={() => { setActiveRole('prestador'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2"> <Briefcase className="w-5 h-5" /> Panel servicios </Link> )}
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="w-full text-left px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <User className="w-5 h-5" /> Mi Cuenta
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                        Salir
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;