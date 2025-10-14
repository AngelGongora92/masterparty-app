import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from './NavigationBar.jsx';
import Footer from '../common/Footer';

const MainLayout = () => {
    return (
        <div className="font-sans bg-gray-50 min-h-screen flex flex-col">
            <NavigationBar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;