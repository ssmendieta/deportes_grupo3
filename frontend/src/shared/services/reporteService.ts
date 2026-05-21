// ESTO ES SOLO PARA PROBAR TU LOGICA DE DESCARGA LOCALMENTE SIN BACKEND
export const descargarReporte = async (
  endpoint: string,
  formato: 'pdf' | 'excel',
  filtros: any = {},
  nombreArchivo: string
): Promise<void> => {
  // Simulamos un retraso de 1.5 segundos para ver el estado "Generando..."
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Creamos un archivo de texto de prueba simulando el reporte
  const contenidoPrueba = `Reporte UCB\nEndpoint: ${endpoint}\nFiltros: ${JSON.stringify(filtros)}`;
  const blob = new Blob([contenidoPrueba], { type: 'text/plain' });

  // Forzamos la descarga en el navegador
  const urlDescarga = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlDescarga;
  link.download = `${nombreArchivo}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(urlDescarga);
};