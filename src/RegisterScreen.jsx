import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from './firebase';
import { Sparkles, User, Mail, Lock, Calendar, Users, Phone, Eye, EyeOff } from 'lucide-react';

const RegisterScreen = ({ onSwitchView }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        age: '',
        gender: 'Otro',
        phoneNumber: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Crear el usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const newUser = userCredential.user;

            // 2. Crear el documento de perfil en Firestore
            const userDocRef = doc(db, `artifacts/${appId}/users/${newUser.uid}/profile/settings`);
            await setDoc(userDocRef, {
                roles: ['cliente'], // Rol inicial como un array
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                age: parseInt(formData.age, 10),
                gender: formData.gender,
                phoneNumber: formData.phoneNumber,
                createdAt: Date.now(),
            });

            // El listener onAuthStateChanged en App.jsx se encargará de redirigir.

        } catch (err) {
            console.error("Error en el registro:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo electrónico ya está en uso.');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else {
                setError('Ocurrió un error durante el registro. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
                            <label className="block text-sm font-medium text-gray-700">Edad</label>
                            <input type="number" name="age" onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-xl" />
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
                    <button onClick={() => onSwitchView('login')} className="font-semibold text-violet-600 hover:underline">
                        Inicia sesión
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterScreen;