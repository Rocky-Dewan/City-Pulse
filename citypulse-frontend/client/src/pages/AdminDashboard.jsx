

import { useEffect, useState } from "react";
import api from "../api/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [userCoords, setUserCoords] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await api.get("/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      setReports((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  useEffect(() => {
    fetchReports();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  const isNearby = (report) => {
    if (!userCoords) return true;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(report.lat - userCoords.lat);
    const dLng = toRad(report.lng - userCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userCoords.lat)) *
      Math.cos(toRad(report.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= 10;
  };

  const nearbyReports = reports.filter(isNearby);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Location</th>
                <th className="p-2">Current Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {nearbyReports.map((report) => (
                <tr key={report._id} className="border-t">
                  <td className="p-2">{report.title}</td>
                  <td className="p-2">Lat: {report.lat}, Lng: {report.lng}</td>
                  <td className="p-2">{report.status}</td>
                  <td className="p-2">
                    <select
                      value={report.status}
                      onChange={(e) => updateStatus(report._id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {userCoords && (
            <MapContainer
              center={[userCoords.lat, userCoords.lng]}
              zoom={13}
              scrollWheelZoom={true}
              className="h-96 rounded shadow"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {nearbyReports.map((report) => (
                <Marker key={report._id} position={[report.lat, report.lng]}>
                  <Popup>
                    <div>
                      <h3 className="font-bold">{report.title}</h3>
                      <p>Status: {report.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}

