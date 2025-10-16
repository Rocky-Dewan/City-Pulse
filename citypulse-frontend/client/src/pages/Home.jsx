// client/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import api from "../api/api";
import ReportCard from "../components/ReportCard";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Home() {
  const [reports, setReports] = useState([]);
  const [viewMap, setViewMap] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [radiusKm, setRadiusKm] = useState(10);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) =>
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      );
    }
  }, []);

  const fetchReports = async (reset = false) => {
    setLoading(true);
    try {
      const params = {
        q: q || undefined,
        category: category === "all" ? undefined : category,
        page,
        perPage,
      };
      const res = await api.get("/reports", { params });
      const rows = res.data.rows ?? res.data;
      setReports((prev) => (reset ? rows : [...prev, ...rows]));
    } catch (err) {
      console.error("fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchReports(true);
  }, [q, category]);

  useEffect(() => {
    if (page > 1) fetchReports();
  }, [page]);

  const visible = reports.filter((r) => {
    if (!userCoords) return true;
    const lat = r.location?.coordinates?.[1] ?? r.lat;
    const lon = r.location?.coordinates?.[0] ?? r.lng;
    if (!lat || !lon) return false;
    return haversine(userCoords.lat, userCoords.lon, lat, lon) <= radiusKm;
  });

  const handleUpvote = async (id) => {
    const key = `upvoted:${id}`;
    if (localStorage.getItem(key)) return alert("Already upvoted");
    setReports((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
      )
    );
    localStorage.setItem(key, "1");
    try {
      await api.put(`/reports/${id}/upvote`);
    } catch (err) {
      setReports((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, upvotes: Math.max((r.upvotes || 1) - 1, 0) }
            : r
        )
      );
      localStorage.removeItem(key);
      alert("Upvote failed");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white bg-gradient-to-b from-gray-900 via-purple-900 to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          City Issues Near You
        </h1>
        <button
          onClick={() => setViewMap((v) => !v)}
          className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-600/40 transition-all"
        >
          {viewMap ? "List View" : "Map View"}
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20">
        <input
          className="col-span-2 p-2 rounded-lg bg-white/10 placeholder-gray-300 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 rounded-lg bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="all">All categories</option>
          <option value="road">Road</option>
          <option value="waste">Waste</option>
          <option value="lighting">Lighting</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm">{radiusKm} km radius</label>
          <input
            type="range"
            min="1"
            max="50"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      {/* Map / List */}
      {viewMap ? (
        <div className="h-96 rounded-xl overflow-hidden mb-4 shadow-lg shadow-cyan-600/30">
          <MapContainer
            center={[userCoords?.lat ?? 23.81, userCoords?.lon ?? 90.41]}
            zoom={12}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {visible.map((r) => {
              const lat = r.location?.coordinates?.[1] ?? r.lat;
              const lng = r.location?.coordinates?.[0] ?? r.lng;
              if (!lat || !lng) return null;
              return (
                <Marker key={r._id} position={[lat, lng]}>
                  <Popup className="text-black">
                    <div>
                      <strong>{r.title}</strong>
                      <p className="text-xs">{r.category} • {r.status}</p>
                      <button
                        onClick={() => handleUpvote(r._id)}
                        className="mt-2 px-2 py-1 rounded-lg text-white bg-gradient-to-r from-green-400 to-cyan-400 hover:from-cyan-400 hover:to-green-400 shadow-md shadow-green-500/40 transition-all"
                      >
                        Upvote ({r.upvotes || 0})
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((r) => (
            <ReportCard
              key={r._id}
              report={r}
              onUpvote={() => handleUpvote(r._id)}
              className="bg-black/40 backdrop-blur-lg border border-white/20 shadow-lg shadow-purple-600/20 hover:scale-105 transition-transform"
            />
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-600/50 transition-all font-semibold"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>
    </div>
  );
}
