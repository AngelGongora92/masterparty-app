import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    // Lee el rol activo desde localStorage o usa 'cliente' como default.
    const [activeRole, setActiveRoleState] = useState(() => localStorage.getItem('activeRole') || 'cliente');

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setUserData(null);
                setUserRoles([]);
                setActiveRoleState('cliente');
                localStorage.removeItem('activeRole');
            }
            setIsAuthReady(true);
        });
        return () => unsubscribeAuth();
    }, []);

    // Efecto para cargar el perfil del USUARIO
    useEffect(() => {
        if (!user) return;

        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
        const unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const userProfileData = docSnap.data();

                // --- SINCRONIZACIÓN DE VERIFICACIÓN DE CORREO ---
                // Comparamos el estado de Auth con el de Firestore.
                if (user.emailVerified && !userProfileData.emailVerified) {
                    console.log('Sincronizando estado de emailVerified en Firestore...');
                    // Si son diferentes, actualizamos el documento en Firestore.
                    await updateDoc(userDocRef, { emailVerified: true });
                    // Actualizamos el estado local para reflejar el cambio inmediatamente.
                    userProfileData.emailVerified = true;
                }

                const roles = userProfileData.roles || ['cliente'];
                setUserRoles(roles);
                // Inicialmente, establecemos solo los datos del perfil de usuario.
                // El siguiente useEffect se encargará de los datos del proveedor.
                setUserData(prev => ({ ...prev, ...userProfileData }));

                const currentActiveRole = localStorage.getItem('activeRole') || 'cliente';
                if (!roles.includes(currentActiveRole)) {
                    setActiveRoleState('cliente');
                    localStorage.setItem('activeRole', 'cliente');
                }
            } else {
                // Si el documento no existe (caso raro, el registro debería crearlo), lo creamos.
                const newUserProfile = { roles: ['cliente'], createdAt: Date.now(), email: user.email };
                await setDoc(userDocRef, newUserProfile);
                setUserRoles(newUserProfile.roles);
                setUserData(newUserProfile);
            }
        });

        return () => unsubscribeUser();
    }, [user]);

    // Efecto para cargar los datos del PROVEEDOR (si aplica)
    useEffect(() => {
        // Solo se ejecuta si tenemos los datos del usuario y este tiene un providerId
        const providerId = userData?.providerId;
        if (!providerId) {
            return;
        }

        const providerDocRef = doc(db, `artifacts/${appId}/providers/${providerId}`);
        const unsubscribeProvider = onSnapshot(providerDocRef, (providerSnap) => {
            if (providerSnap.exists()) {
                // Fusionamos los datos del proveedor con los datos existentes del usuario
                setUserData(prev => ({ ...prev, ...providerSnap.data() }));
            }
        });

        return () => unsubscribeProvider();
    }, [userData?.providerId]);

    const setActiveRole = (role) => {
        localStorage.setItem('activeRole', role);
        setActiveRoleState(role);
    };

    const value = {
        user,
        userData,
        userRoles,
        activeRole,
        setActiveRole,
        isAuthReady,
        userId: user?.uid || 'guest',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};