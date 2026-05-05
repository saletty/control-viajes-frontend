import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import API_URL from "../api";


const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);

  // 🎙️ AUDIO STATE
  const [recording, setRecording] = useState(false);
  const [audioBlobs, setAudioBlobs] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  /* =======================
     TRIP
  ======================= */
useEffect(() => {
      const fetchTrip = async () => {
        try {
          const user = JSON.parse(localStorage.getItem("user"));

          const res = await fetch(
            `${API_URL}/api/Trips/driver/${encodeURIComponent(user.name)}`
          );

          if (!res.ok) throw new Error("Error al obtener viaje");

          const data = await res.json();

          const found = data.find(t => t.id === parseInt(id));

          if (!found) {
            setTrip(null);
          } else {
            setTrip(found);
          }

        } catch (err) {
          console.error(err);
          setTrip(null);
        }
      };

      fetchTrip();
    }, [id]);
  /* =======================
     PHOTOS
  ======================= */
  useEffect(() => {
    const fetchPhotos = async () => {
      const res = await fetch(`${API_URL}/api/TripPhotos/${id}`);
      const data = await res.json();
      setPhotos(data);
      setLoading(false);
    };

    fetchPhotos();
  }, [id]);

  /* =======================
     EVENTS
  ======================= */
  const fetchEvents = async () => {
    const res = await fetch(`${API_URL}/api/TripEvents/${id}`);
    const data = await res.json();
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, [id]);

  const salidaPhotos = photos.filter(p => p.type === "SALIDA");
  const llegadaPhotos = photos.filter(p => p.type === "LLEGADA");

  /* =======================
     AUDIO RECORDING
  ======================= */
const startRecording = async () => {
  try {
    // 1. Validar que no se pase del límite sumando los ya subidos + los pendientes
    if (events.length + audioBlobs.length >= 2) {
      alert("Ya tienes el límite de 2 audios (entre subidos y pendientes)");
      return;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // ❌ BORRA O COMENTA ESTA LÍNEA:
    // setAudioBlobs([]);  <-- Esta línea es la que te borra el primer audio

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      // ✅ Esto añade el nuevo audio sin borrar los anteriores
      setAudioBlobs(prev => [...prev, blob]);
      setRecording(false);
      stream.getTracks().forEach(track => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);

  } catch (err) {
    console.error("Error micrófono:", err);
    alert("No se pudo acceder al micrófono");
  }
};

  const stopRecording = () => {
    if (mediaRecorder && recording) {
         mediaRecorder.stop();
    }
  };

   const uploadEvent = async () => {
  if (audioBlobs.length === 0) return;

  try {
    console.log("Iniciando subida de", audioBlobs.length, "audios");

    // Usamos for...of para que el 'await' funcione correctamente de forma secuencial
    for (const [index, blob] of audioBlobs.entries()) {
      const formData = new FormData();
      // Le damos un nombre distinto a cada archivo para evitar colisiones
      formData.append("audio", blob, `audio_evento_${index}.webm`);

      const res = await fetch(`${API_URL}/api/TripEvents/${id}`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error en audio ${index + 1}: ${errorText}`);
      }
      
      console.log(`Audio ${index + 1} subido con éxito`);
    }

    // Solo si todos se subieron bien, limpiamos la lista de espera
    setAudioBlobs([]);
    await fetchEvents(); // Refrescar la lista desde la BD
    alert("✔ Todos los audios se subieron correctamente");

  } catch (err) {
    console.error(err);
    alert(err.message);
    // Refrescamos igual para ver qué alcanzó a subirse
    await fetchEvents();
  }
};

  /* =======================
     LOADING
  ======================= */
  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!trip) return <div className="p-10 text-center">No se encontró el viaje.</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white px-6 py-4 flex items-center gap-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Detalles de Viaje</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">

        {/* INFO */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <p><b>Chofer:</b> {trip.driverName}</p>
          <p><b>Tracto:</b> {trip.tracto?.placa}</p>
          <p><b>Semiremolque:</b> {trip.semiremolque?.placa}</p>
          <p><b>Ruta:</b> {trip.origin} → {trip.destination}</p>
        </div>

        {/* FOTOS SALIDA */}
        <PhotoSection
          title="Fotos de Salida"
          photos={salidaPhotos}
          onClick={(index) => setModal({ photos: salidaPhotos, index })}
        />

        {/* FOTOS LLEGADA */}
        <PhotoSection
          title="Fotos de Llegada"
          photos={llegadaPhotos}
          onClick={(index) => setModal({ photos: llegadaPhotos, index })}
        />

        {/* 🎙️ EVENTOS */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-bold mb-4">Eventos del viaje ({events.length})</h3>

          {events.length === 0 ? (
            <p className="text-gray-400">Sin eventos</p>
          ) : (
            events.map(e => (
              <audio key={e.id} controls className="w-full mb-3">
                <source src={`${API_URL}${e.audioUrl}`} />
              </audio>
            ))
          )}
        </div>

        {/* 🎤 REGISTRAR EVENTO */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="font-bold mb-4">Registrar Eventos (Máx 2)</h3>

          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={events.length + audioBlobs.length >= 2} // Deshabilitar si ya llegó al límite total
            className={`w-full py-4 rounded-xl font-bold text-white ${
              recording ? 'bg-red-500' : 'bg-black'
            } disabled:bg-gray-300`}
          >
            {recording ? 'Detener grabación' : 'Grabar audio'}
          </button>

          {/* Lista de audios grabados pero NO subidos todavía */}
          {audioBlobs.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-bold text-blue-700">Audios por subir:</p>
              {audioBlobs.map((_, idx) => (
                <p key={idx} className="text-xs text-blue-600">📌 Grabación #{idx + 1} lista</p>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-2">
            En base de datos: {events.length} / 2 | Pendientes: {audioBlobs.length}
          </p>

          <button
            onClick={uploadEvent}
            disabled={audioBlobs.length === 0}
            className="w-full mt-3 bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            Subir todo al servidor
          </button>
        </div>

      </div>

      {/* MODAL */}
      {modal && (
        <ImageModal modal={modal} setModal={setModal} />
      )}
    </div>
  );
};

/* =======================
   GALERÍA
======================= */
const PhotoSection = ({ title, photos, onClick }) => (
  <div className="bg-white rounded-2xl p-6 shadow">
    <h3 className="font-bold mb-4">{title} ({photos.length})</h3>

    {photos.length === 0 ? (
      <p className="text-gray-400">Sin fotos</p>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <img
            key={photo.id}
            src={`${API_URL}${photo.url}`}
            onClick={() => onClick(index)}
            className="h-40 w-full object-cover rounded-xl cursor-pointer hover:scale-105 transition"
          />
        ))}
      </div>
    )}
  </div>
);

/* =======================
   MODAL
======================= */
const ImageModal = ({ modal, setModal }) => {
  const { photos, index } = modal;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">

      <button
        onClick={() => setModal(null)}
        className="absolute top-5 right-5 text-white"
      >
        <X size={32} />
      </button>

      <img
        src={`${API_URL}${photos[index].url}`}
        className="max-h-[90%] max-w-[90%] object-contain"
      />
    </div>
  );
};

export default TripDetails;