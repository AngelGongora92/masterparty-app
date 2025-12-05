import React, { useState, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Lista completa de los estados de México para el dropdown.
const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
  "Zacatecas"
];

function ProviderSignupForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState(''); // Nuevo estado para el estado/provincia
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!executeRecaptcha) {
      setError("El validador reCAPTCHA no está listo. Intenta de nuevo.");
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Generamos el token de reCAPTCHA para esta acción
      const token = await executeRecaptcha('providerSignup');

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, state, token }), // Enviamos el token al backend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal.');
      }

      setMessage(data.success);
      setEmail(''); // Limpia el campo después del éxito
      setState(''); // Limpia el estado también
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [email, state, executeRecaptcha]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-lg text-center">
      <h3 className="text-xl font-bold text-white mb-2">¿Eres proveedor de servicios para eventos?</h3>
      <p className="text-gray-300 mb-4">Déjanos tu correo para avisarte del acceso beta a nuestro directorio.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          disabled={isLoading}
            className="flex-grow px-4 py-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-pink-500 focus:border-pink-500"
        />
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            disabled={isLoading}
            className="px-4 py-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="" disabled>Selecciona tu estado</option>
            {mexicanStates.map(stateName => (
              <option key={stateName} value={stateName}>{stateName}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isLoading} className="px-6 py-3 rounded-md font-bold text-white bg-pink-600 hover:bg-pink-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
          {isLoading ? 'Enviando...' : '¡Avísenme!'}
        </button>
      </form>
      {message && <p className="text-green-400 mt-3">{message}</p>}
      {error && <p className="text-red-400 mt-3">{error}</p>}
    </div>
  );
}

export default ProviderSignupForm;