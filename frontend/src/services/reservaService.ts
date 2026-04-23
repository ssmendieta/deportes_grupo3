const API_URL = "http://localhost:3000"; // Confirma con tu amigo si es el puerto 3000 o 8000

export const getEspacios = async () => {
    const response = await fetch(`${API_URL}/api/espacios`);
    return await response.json();
};

export const crearReserva = async (datos: any) => {
    const response = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await response.json();
};