import React, { useState } from 'react';

function ProviderSignupForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal.');
      }

      setMessage(data.success);
      setEmail(''); // Limpia el campo después del éxito
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-lg text-center">
      <h3 className="text-xl font-bold text-white mb-2">¿Eres proveedor de servicios para eventos?</h3>
      <p className="text-gray-300 mb-4">Déjanos tu correo para avisarte del acceso beta a nuestro directorio.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          disabled={isLoading}
          className="flex-grow px-4 py-3 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-pink-500 focus:border-pink-500"
        />
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