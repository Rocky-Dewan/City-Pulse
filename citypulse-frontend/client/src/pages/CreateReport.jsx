// client/src/components/CreateReport.jsx
import React, { useState, useEffect } from "react";
import api from "../api/api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function MapPicker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function CreateReport() {
  const [form, setForm] = useState({ title: "", description: "", category: "road" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // auto center using device
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => { });
    }
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("Title required");
    if (!coords) return alert("Pick a location on the map or enable geolocation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("latitude", coords.lat);
      fd.append("longitude", coords.lng);
      if (file) fd.append("image", file);
      await api.post("/reports", fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Report submitted");
      setForm({ title: "", description: "", category: "road" });
      setFile(null);
    } catch (err) {
      console.error("submit error", err);
      alert("Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create New Report</h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input" rows={4} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
          <option value="road">Road</option>
          <option value="waste">Waste</option>
          <option value="lighting">Lighting</option>
          <option value="water">Water</option>
          <option value="general">General</option>
        </select>

        <div>
          <label className="text-sm block mb-1">Photo (optional)</label>
          <div className="flex gap-4 items-center">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            {preview && <img src={preview} alt="preview" className="w-24 h-16 object-cover rounded" />}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1">Pick location (click map)</label>
          <div className="h-64 rounded overflow-hidden border">
            <MapContainer center={[coords?.lat ?? 23.81, coords?.lng ?? 90.41]} zoom={13} className="h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPicker position={coords} onChange={(c) => setCoords(c)} />
            </MapContainer>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {coords ? `Selected: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Click on the map to select coordinates.'}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={() => { setForm({ title: "", description: "", category: "road" }); setFile(null); }}>Reset</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
