import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";

export default function RegisterStart() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados para manejar los datos
  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Carga inicial de datos (Viaje y Fotos)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener datos del viaje
        const resTrip = await fetch(`https://localhost:7070/api/Trips/driver`);
        if (!resTrip.ok) throw new Error("Error al obtener viajes");
        const tripsData = await resTrip.json();
        const selectedTrip = tripsData.find(t => t.id === parseInt(id));
        
        if (selectedTrip) {
          setTrip(selectedTrip);
        } else {
          setError("No se encontró el viaje especificado.");
        }

        // 2. Obtener fotos ya subidas para este viaje (tipo SALIDA)
        const resPhotos = await fetch(`https://localhost:7070/api/TripPhotos/${id}`);
        if (resPhotos.ok) {
          const photosData = await resPhotos.json();
          const salidaPhotos = photosData.filter(p => p.type === "SALIDA");
          setPhotos(salidaPhotos);
        }

      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error de conexión con el servidor de Terranera.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // Función para confirmar la salida y cambiar estado a "En ruta"
  const handleConfirmarSalida = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://localhost:7070/api/Trips/${id}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert("Registro exitoso. El viaje ahora está EN RUTA.");
        navigate('/driver'); // Redirigir al dashboard del chofer
      } else {
        const errorMsg = await response.text();
        alert("Error del servidor: " + errorMsg);
      }
    } catch (err) {
      console.error("Error al confirmar:", err);
      alert("Hubo un problema al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
        <p className="text-gray-500 font-medium tracking-wide">Sincronizando con Terranera...</p>
      </div>
    </div>
  );

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header Estilo App */}
      <header className="bg-white px-6 py-5 flex items-center gap-4 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Registrar Salida</h1>
      </header>

      <div className="max-w-xl mx-auto p-4 space-y-6 mt-2">
        
        {/* Card: Información del Vehículo */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-sm">
          <h3 className="text-gray-400 text-[10px] mb-5 uppercase tracking-[0.15em] font-black">Información de Unidad</h3>
          
          <div className="grid grid-cols-2 gap-y-8">
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-bold mb-1 text-opacity-70">Tracto</p>
              <p className="font-extrabold text-xl text-gray-900">{trip?.tracto?.placa || '---'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-bold mb-1 text-opacity-70">Semiremolque</p>
              <p className="font-extrabold text-xl text-gray-900">{trip?.semiremolque?.placa || '---'}</p>
            </div>
            <div className="col-span-2 border-t border-gray-50 pt-5">
              <p className="text-gray-400 text-[11px] uppercase font-bold mb-1 text-opacity-70">Ruta Asignada</p>
              <p className="font-bold text-gray-900 text-lg leading-tight">{trip?.origin} <span className="text-blue-500 mx-1">→</span> {trip?.destination}</p>
            </div>
          </div>
        </div>

        {/* Card: Captura de Evidencia (Fotos) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-7 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Fotos AGESA</h3>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter ${photos.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
              {photos.length} / 3
            </span>
          </div>

          <button 
            onClick={() => navigate(`/camera/${id}/salida`)}
            disabled={photos.length >= 3 || issubmitting}
            className={`w-full border-2 border-dashed rounded-[1.5rem] py-12 flex flex-col items-center justify-center gap-4 transition-all group ${
              photos.length >= 3 ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:bg-gray-50 hover:border-blue-200'
            }`}
          >
            <div className={`p-5 rounded-full shadow-sm transition-transform group-active:scale-90 ${photos.length >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {photos.length >= 3 ? (
                <CheckCircle2 className="text-green-600" size={36} />
              ) : (
                <Camera className="text-gray-400 group-hover:text-blue-600" size={36} />
              )}
            </div>
            <span className={`font-bold text-lg ${photos.length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
              {photos.length === 0 && "Capturar Primera Foto"}
              {photos.length === 1 && "Capturar Segunda Foto"}
              {photos.length === 2 && "Capturar Tercera Foto"}
              {photos.length >= 3 && "Evidencia Completada"}
            </span>
          </button>
        </div>

        {/* Botón Final de Acción */}
        <div className="pt-4">
          <button 
            onClick={handleConfirmarSalida}
            disabled={photos.length < 3 || issubmitting}
            className={`w-full py-5 rounded-[1.2rem] font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
              photos.length >= 3 && !issubmitting
                ? "bg-[#05050a] text-white active:scale-[0.97] shadow-gray-300" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {issubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              "Confirmar Registro de Salida"
            )}
          </button>
          
          <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest leading-relaxed">
            Terranera SRL - Logística y Transporte Internacional
          </p>
        </div>
      </div>
    </div>
  );
}