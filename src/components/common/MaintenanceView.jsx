import React from 'react';

/**
 * Vista para cuando el sitio está en mantenimiento.
 */
const MaintenanceView = () => {
    const services = [
        // Eventos
        'Bodas', 'XV Años', 'Fiestas Infantiles', 'Bautizos', 'Primeras Comuniones', 'Eventos Corporativos', 'Graduaciones', 'Aniversarios', 'Baby Showers', 'Despedidas de Soltero/a', 'Propuestas de Matrimonio',
        // Lugares
        'Salones de Eventos', 'Jardines para Fiestas', 'Haciendas', 'Terrazas para Eventos', 'Quintas', 'Lofts para Fiestas', 'Pool Parties', 'Renta de Yates', 'Espacios Industriales',
        // Comida y Bebida
        'Catering Gourmet', 'Banquetes', 'Taquizas a Domicilio', 'Barras de Snacks', 'Mesas de Dulces y Postres', 'Pasteles Personalizados', 'Food Trucks', 'Coctelería Móvil', 'Baristas de Café', 'Mixólogos', 'Servicio de Parrillada',
        // Entretenimiento
        'Música en Vivo', 'DJ Profesional', 'Mariachis', 'Bandas de Rock', 'Grupos Versátiles', 'Magos y Mentalistas', 'Payasos y Animadores', 'Shows de Stand-up', 'Performance de Fuego', 'Bailarines', 'Karaoke',
        // Decoración y Mobiliario
        'Decoración Temática', 'Arreglos Florales', 'Centros de Mesa', 'Decoración con Globos', 'Mobiliario Lounge', 'Renta de Sillas y Mesas', 'Carpas y Toldos', 'Pistas de Baile Iluminadas', 'Letras Gigantes',
        // Tecnología y Multimedia
        'Iluminación Arquitectónica', 'Sonido Profesional', 'Pantallas LED', 'Proyectores de Video', 'Fotografía Profesional', 'Video y Cinematografía de Eventos', 'Cabinas de Fotos 360', 'Drones para Eventos', 'Transmisión en Vivo',
        // Servicios Adicionales
        'Invitaciones Digitales', 'Planeador de Eventos (Wedding Planner)', 'Coordinador de Día', 'Hostess y Edecanes', 'Valet Parking', 'Seguridad para Eventos', 'Maquillaje y Peinado', 'Renta de Autos Clásicos', 'Animación para Adultos'
    ];

    const numColumns = 7;
    const columns = Array.from({ length: numColumns }, () => []);
    services.forEach((service, index) => {
        columns[index % numColumns].push(service);
    });

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white overflow-hidden">
            {/* Fondo animado con columnas en cascada */}
            <div className="absolute inset-0 z-0 flex justify-center gap-x-4 md:gap-x-8 opacity-20 pointer-events-none">
                {columns.map((column, colIndex) => (
                    <div
                        key={colIndex}
                        className="animate-scroll-vertical"
                        style={{
                            animationDuration: `${Math.random() * 20 + 30}s`,
                            animationDirection: colIndex % 2 === 0 ? 'reverse' : 'normal',
                        }}
                    >
                        <div className="flex flex-col space-y-4">
                            {column.map((service, serviceIndex) => <span key={serviceIndex} className="text-lg text-gray-400 whitespace-nowrap">{service}</span>)}
                        </div>
                        <div className="flex flex-col space-y-4" aria-hidden="true">
                            {column.map((service, serviceIndex) => <span key={`dup-${serviceIndex}`} className="text-lg text-gray-400 whitespace-nowrap">{service}</span>)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contenido Principal */}
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight animate-pulse-shadow">Página en Mantenimiento</h1>
                <p className="text-2xl md:text-3xl font-light text-pink-400 animate-pulse text-shadow-custom">Pronto estaremos de regreso...</p>
            </div>

            {/* Correo de contacto */}
            <div className="absolute bottom-8 z-10 text-gray-400">
                <p>¿Necesitas ayuda? Contáctanos en <a href="mailto:contacto@masterparty.mx" className="font-semibold text-violet-300 hover:underline">contacto@masterparty.mx</a></p>
            </div>
        </div>
    );
};

export default MaintenanceView;