import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import ServiceForm from './ServiceForm';
import { ArrowLeft } from 'lucide-react';

const NewServicePage = () => {
    const { userId } = useAuth();
    const navigate = useNavigate();
    const [serviceCategories, setServiceCategories] = useState({});

    useEffect(() => {
        const publicDataDocRef = doc(db, `artifacts/${appId}/public/data`);
        const unsubscribe = onSnapshot(publicDataDocRef, (docSnap) => {
            if (docSnap.exists() && typeof docSnap.data().service_categories === 'object') {
                setServiceCategories(docSnap.data().service_categories);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleServiceAdded = useCallback(() => {
        navigate('/vendor/dashboard');
    }, [navigate]);

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-violet-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                Volver al panel
            </button>
            <ServiceForm userId={userId} onServiceAdded={handleServiceAdded} serviceCategories={serviceCategories} />
        </div>
    );
};

export default NewServicePage;