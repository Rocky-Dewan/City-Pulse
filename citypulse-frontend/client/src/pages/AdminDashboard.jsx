// client/src/components/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons (Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(r => keys.map(k => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [mapOpen, setMapOpen] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) =>
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        q: q || undefined,
        category: category === "all" ? undefined : category,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        perPage
      };
      const res = await api.get("/reports", { params });
      // expected backend: { rows: [...], total }
      const { rows, total: t } = res.data;
      setReports(rows || []);
      setTotal(t ?? (res.data.length || 0));
    } catch (err) {
      console.error("Admin fetch error", err);
      alert("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [q, category, statusFilter, page]);

  const stats = useMemo(() => {
    const s = { Pending: 0, "In Progress": 0, Resolved: 0, total: 0 };
    reports.forEach(r => { s[r.status] = (s[r.status] || 0) + 1; s.total++; });
    return s;
  }, [reports]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/reports/${id}`, { status: newStatus });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error("status update failed", err);
      alert("Update failed");
    }
  };

  const visibleCsvRows = reports.map(r => ({
    id: r._id,
    title: r.title,
    category: r.category,
    status: r.status,
    lat: r.location?.coordinates?.[1] ?? r.lat ?? "",
    lng: r.location?.coordinates?.[0] ?? r.lng ?? "",
    createdBy: r.createdBy?.name ?? r.createdBy?.email ?? ""
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <input
            placeholder="Search title or description..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-full px-3 py-2 border rounded">
            <option value="all">All categories</option>
            <option value="road">Road</option>
            <option value="waste">Waste</option>
            <option value="lighting">Lighting</option>
            <option value="water">Water</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded">
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <button onClick={() => downloadCSV("reports.csv", visibleCsvRows)} className="px-3 py-2 bg-green-600 text-white rounded">Export CSV</button>

          <button onClick={() => setMapOpen(s => !s)} className="px-3 py-2 border rounded">{mapOpen ? "Hide Map" : "Show Map"}</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-4 text-sm text-gray-700">
          <div>Showing <strong>{reports.length}</strong> of <strong>{total}</strong></div>
          <div>Pending: <strong>{stats.Pending}</strong></div>
          <div>In Progress: <strong>{stats["In Progress"]}</strong></div>
          <div>Resolved: <strong>{stats.Resolved}</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2">Location</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center">No reports</td></tr>
              ) : reports.map(r => {
                const lat = r.location?.coordinates?.[1] ?? r.lat;
                const lng = r.location?.coordinates?.[0] ?? r.lng;
                return (
                  <tr key={r._id} className="border-t">
                    <td className="p-2 max-w-xs truncate">{r.title}</td>
                    <td className="p-2 text-xs">{lat ? `Lat: ${lat.toFixed(4)}` : "-"}, {lng ? `Lng: ${lng.toFixed(4)}` : "-"}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">
                      <select value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)} className="px-2 py-1 border rounded">
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <div>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded mr-2">Prev</button>
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
            </div>
            <div className="text-sm text-gray-500">Page {page}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          {mapOpen ? (
            <MapContainer center={[userCoords?.lat ?? 23.81, userCoords?.lng ?? 90.41]} zoom={12} className="h-96 rounded">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {reports.map(r => {
                const lat = r.location?.coordinates?.[1] ?? r.lat;
                const lng = r.location?.coordinates?.[0] ?? r.lng;
                if (!lat || !lng) return null;
                return (
                  <Marker key={r._id} position={[lat, lng]}>
                    <Popup>
                      <div className="max-w-xs">
                        <h3 className="font-semibold">{r.title}</h3>
                        <div className="text-sm text-gray-600">{r.category} • {r.status}</div>
                        {r.image && <img src={r.image} alt="" className="w-full mt-2 rounded" />}
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigator.clipboard.writeText(`${lat},${lng}`)} className="px-2 py-1 border rounded text-xs">Copy coords</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="text-gray-500">Map hidden</div>
          )}
        </div>
      </div>
    </div>
  );
}
