import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
    const [activeRole, setActiveRole] = useState('cliente');

    useEffect(() => {
        let unsubProfile = () => {};
        let unsubProvider = () => {};

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // Limpia los listeners del usuario anterior antes de configurar los nuevos.
            unsubProfile();
            unsubProvider();

            setUser(currentUser);

            if (currentUser) {
                // 1. Carga inicial y escucha de cambios en el perfil del usuario.
                const profileRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/profile/settings`);
                unsubProfile = onSnapshot(profileRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data();
                        const roles = profileData.roles || [];
                        setUserRoles(roles);
                        setActiveRole(prevActiveRole => roles.includes(prevActiveRole) ? prevActiveRole : 'cliente');
                        // Fusiona los datos del perfil con los datos existentes (del proveedor, si los hay).
                        setUserData(prevData => ({ ...prevData, ...profileData }));
                    } else {
                        // Si no existe el perfil, lo creamos con el rol de cliente.
                        await setDoc(profileRef, { roles: ['cliente'], createdAt: Date.now() }, { merge: true });
                        setUserData({ roles: ['cliente'] });
                        setUserRoles(['cliente']);
                        setActiveRole('cliente');
                    }
                }, (error) => {
                    console.error("Error al escuchar el perfil del usuario:", error);
                    setUserData(null);
                });

                // 2. Carga inicial y escucha de cambios en los detalles del proveedor.
                const providerRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/provider/details`);
                unsubProvider = onSnapshot(providerRef, (providerSnap) => {
                    if (providerSnap.exists()) {
                        // Fusiona los datos del proveedor con los datos existentes (del perfil).
                        setUserData(prevData => ({ ...prevData, ...providerSnap.data() }));
                    }
                });
            } else {
                // Resetear estados al cerrar sesión
                setUserRoles([]);
                setUserData(null);
                setActiveRole('cliente');
            }
            setIsAuthReady(true);
        });

        // Limpieza de los listeners
        return () => {
            unsubscribe();
            unsubProfile();
            unsubProvider();
        };
    }, []);

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