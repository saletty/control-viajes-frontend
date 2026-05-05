import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";
import API_URL from "../api";

export default function RegisterArrival() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 Cargar viaje + fotos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // VIAJE
        const user = JSON.parse(localStorage.getItem("user"));

            const resTrip = await fetch(
            `${API_URL}/api/Trips/driver/${encodeURIComponent(user.name)}`
            );

            const trips = await resTrip.json();

            const selected = trips.find(t => t.id === parseInt(id));

        if (!selected) {
          setError("No se encontró el viaje.");
          return;
        }

        setTrip(selected);

        // FOTOS
        const resPhotos = await fetch(`${API_URL}/api/TripPhotos/${id}`);
        if (resPhotos.ok) {
          const data = await resPhotos.json();

          // 🔥 SOLO LLEGADA
          const llegada = data.filter(p => p.type === "LLEGADA");
          setPhotos(llegada);
        }

      } catch (err) {
        console.error(err);
        setError("Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 🔥 CONFIRMAR LLEGADA
  const handleConfirmArrival = async () => {
    if (photos.length < 3) {
      alert("Debes subir al menos 3 fotos");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/Trips/${id}/finish`, {
        method: "PUT"
      });

      if (res.ok) {
        alert("Llegada registrada correctamente");
        navigate("/driver");
      } else {
        const msg = await res.text();
        alert("Error: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* HEADER */}
      <header className="bg-white px-6 py-5 flex items-center gap-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Registrar Llegada</h1>
      </header>

      <div className="max-w-xl mx-auto p-4 space-y-6">

        {/* INFO */}
        <div className="bg-white rounded-2xl p-6 border">
          <p className="text-sm text-gray-400 mb-2">Tracto</p>
          <p className="text-xl font-bold">{trip.tracto?.placa}</p>

          <p className="text-sm text-gray-400 mt-4 mb-2">Semiremolque</p>
          <p className="text-xl font-bold">{trip.semiremolque?.placa}</p>

          <p className="text-sm text-gray-400 mt-4 mb-2">Ruta</p>
          <p className="font-bold">
            {trip.origin} → {trip.destination}
          </p>
        </div>

        {/* FOTOS */}
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Fotos de Llegada</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              photos.length >= 3 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"
            }`}>
              {photos.length} / 3
            </span>
          </div>

          <button
            onClick={() => navigate(`/camera/${id}/llegada`)}
            disabled={photos.length >= 3}
            className={`w-full border-2 border-dashed rounded-2xl py-10 flex flex-col items-center gap-3 ${
              photos.length >= 3
                ? "bg-green-50 border-green-300"
                : "hover:bg-gray-50"
            }`}
          >
            {photos.length >= 3 ? (
              <CheckCircle2 size={40} className="text-green-600" />
            ) : (
              <Camera size={40} />
            )}

            <span className="font-bold">
              {photos.length === 0 && "Capturar Primera Foto"}
              {photos.length === 1 && "Capturar Segunda Foto"}
              {photos.length === 2 && "Capturar Tercera Foto"}
              {photos.length >= 3 && "Completado"}
            </span>
          </button>
        </div>

        {/* BOTÓN FINAL */}
        <button
          onClick={handleConfirmArrival}
          disabled={photos.length < 3 || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg ${
            photos.length >= 3
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {isSubmitting ? "Guardando..." : "Confirmar Llegada"}
        </button>

      </div>
    </div>
  );
}