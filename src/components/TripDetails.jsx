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
      DATA FETCHING
  ======================= */
  const fetchData = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      
      // Cargar Viaje
      const tripRes = await fetch(`${API_URL}/api/Trips/driver/${encodeURIComponent(user.name)}`);
      const trips = await tripRes.json();
      const found = trips.find(t => t.id === parseInt(id));
      setTrip(found);

      // Cargar Fotos
      const photoRes = await fetch(`${API_URL}/api/TripPhotos/${id}`);
      setPhotos(await photoRes.json());

      // Cargar Eventos
      const eventRes = await fetch(`${API_URL}/api/TripEvents/${id}`);
      setEvents(await eventRes.json());

      setLoading(false);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const salidaPhotos = photos.filter(p => p.type === "SALIDA");
  const llegadaPhotos = photos.filter(p => p.type === "LLEGADA");

  /* =======================
      AUDIO RECORDING
  ======================= */
  const startRecording = async () => {
    try {
      if (events.length + audioBlobs.length >= 2) {
        alert("Límite de 2 audios alcanzado");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        //  Crear URL para preview
        const audioUrl = URL.createObjectURL(blob);
        //  Guardar como objeto (blob + url)
        setAudioBlobs(prev => [
          ...prev,
          { blob, url: audioUrl }
        ]);
        setRecording(false);
        //  Detener micrófono
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono");
    }
  };
  const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
};

  const uploadEvent = async () => {
    if (audioBlobs.length === 0) return;
    try {

      for (const [index, audio] of audioBlobs.entries()) {
        
        const formData = new FormData();
        formData.append("audio", audio.blob, `evento_${Date.now()}_${index}.webm`);

        const res = await fetch(`${API_URL}/api/TripEvents/${id}`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Fallo al subir audio");
      }
      audioBlobs.forEach(a => URL.revokeObjectURL(a.url));
      setAudioBlobs([]);
      fetchData(); // Refrescar lista
      alert("✔ Audios subidos correctamente");
    } catch (err) {
      alert(err.message);
    }
  };

      const removeAudio = (indexToRemove) => {
      setAudioBlobs(prev => {
        const updated = [...prev];

        // 🔥 liberar memoria del preview
        URL.revokeObjectURL(updated[indexToRemove].url);

        // eliminar audio
        updated.splice(indexToRemove, 1);

        return updated;
      });
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
              <source src={e.audioUrl} type="audio/webm" />
              Tu navegador no soporta audio
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
            {audioBlobs.map((audio, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex flex-col gap-2">
                
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Grabación #{idx + 1}</p>

                  <button
                    onClick={() => removeAudio(idx)}
                    className="text-red-500 text-xs font-bold hover:scale-105"
                  >
                    Eliminar
                  </button>
                </div>

                <audio controls className="w-full">
                  <source src={audio.url} type="audio/webm" />
                </audio>

              </div>
            ))}

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
            src={photo.url} 
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
        src={photos[index].url}
        className="max-h-[90%] max-w-[90%] object-contain"
      />
    </div>
  );
};

export default TripDetails;