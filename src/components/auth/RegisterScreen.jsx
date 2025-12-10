import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../../firebase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mexicoStates } from '../../data/mexico-locations'; // Importamos los datos completos
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Sparkles, User, Mail, Lock, Calendar, Users, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const RegisterScreen = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthDate: null, // Cambiado de '' a null para react-datepicker
        gender: 'Otro',
        phoneNumber: '',
        state: '',
        city: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [cities, setCities] = useState([]);

    const from = location.state?.from || "/";

    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Lógica para actualizar las ciudades cuando se cambia el estado
        if (name === 'state') {
            const selectedState = mexicoStates.find(s => s.nombre === value);
            if (selectedState) {
                setCities(selectedState.municipios);
                // Reseteamos la ciudad seleccionada para que el usuario elija una nueva
                setFormData(prev => ({ ...prev, city: '' }));
            } else {
                setCities([]); // Si no se selecciona estado (o se deselecciona), vaciamos las ciudades
            }
        }
    };

    // Handler específico para el DatePicker
    const handleDateChange = (date) => {
        setFormData({ ...formData, birthDate: date });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Crear el usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const newUser = userCredential.user;

            // --- FLUJO DE VERIFICACIÓN PERSONALIZADO ---
            // Llamamos a nuestra Cloud Function para que genere el enlace y envíe el correo con Brevo.
            await fetch('/api/send-verification-email', { // Usamos el proxy de Vite
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUser.email }),
            });

            // 2. Crear el documento de perfil del usuario en Firestore (estructura simplificada)
            const userDocRef = doc(db, `artifacts/${appId}/users/${newUser.uid}`);
            await setDoc(userDocRef, {
                roles: ['cliente'], // Rol inicial como un array
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                birthDate: formData.birthDate, // Guardamos la fecha de nacimiento
                gender: formData.gender,
                phoneNumber: formData.phoneNumber,
                state: formData.state,
                city: formData.city,
                createdAt: Date.now(),
                emailVerified: newUser.emailVerified, // Guardamos el estado de verificación
            });

            // El listener onAuthStateChanged en App.jsx se encargará de redirigir.

        } catch (err) {
            // Loguear el error completo para depuración
            console.error("Error detallado en el registro:", err);
            
            // Mostrar errores más específicos al usuario
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo electrónico ya está en uso.');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else if (err.code === 'permission-denied') {
                setError('Error de permisos. No se pudo crear el perfil de usuario en la base de datos. Revisa las reglas de seguridad de Firestore.');
            } else {
                setError('Ocurrió un error durante el registro. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
            <Link to="/" className="absolute top-6 left-6 text-sm text-gray-500 hover:text-violet-600 hover:underline flex items-center gap-1 z-10">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
            </Link>

            <div className="max-w-lg w-full bg-white p-8 rounded-2xl modern-shadow border border-gray-200">
                <div className="text-center mb-8">
                    <Sparkles className="mx-auto w-12 h-12 text-pink-500" />
                    <h1 className="text-3xl font-extrabold text-violet-700 mt-2">Crea tu Cuenta</h1>
                    <p className="text-gray-500">Únete a la comunidad MasterParty.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="firstName" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="lastName" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                        <input type="email" name="email" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <div className="relative mt-1 group">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type={showPassword ? 'text' : 'password'} name="password" onChange={handleChange} required className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-xl" />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Teléfono</label>
                        <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="tel" name="phoneNumber" onChange={handleChange} required className="w-full pl-10 p-3 border border-gray-300 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estado</label>
                            <select name="state" value={formData.state} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl bg-white">
                                <option value="">Selecciona un estado</option>
                                {mexicoStates.map(state => (
                                    <option key={state.nombre} value={state.nombre}>{state.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ciudad / Municipio</label>
                            <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.state} className="mt-1 w-full p-3 border border-gray-300 rounded-xl bg-white disabled:bg-gray-100">
                                <option value="">{formData.state ? 'Selecciona una ciudad' : 'Primero elige un estado'}</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                            <DatePicker
                                selected={formData.birthDate}
                                onChange={handleDateChange}
                                required
                                className="mt-1 w-full p-3 border border-gray-300 rounded-xl"
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Selecciona una fecha"
                                maxDate={new Date()} // No se pueden seleccionar fechas futuras
                                showYearDropdown
                                scrollableYearDropdown
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sexo</label>
                            <select name="gender" onChange={handleChange} className="mt-1 w-full p-3 border border-gray-300 rounded-xl">
                                <option>Otro</option>
                                <option>Masculino</option>
                                <option>Femenino</option>
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                    <button type="submit" disabled={loading} className="cta-button w-full text-white font-bold py-3 rounded-xl shadow-lg disabled:bg-pink-300">
                        {loading ? 'Creando cuenta...' : 'Registrarme'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-semibold text-violet-600 hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterScreen;