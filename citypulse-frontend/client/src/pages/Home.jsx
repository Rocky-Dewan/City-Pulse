import { useEffect, useState } from "react";
import api from "../api/api";
import ReportCard from "../components/ReportCard";

// Haversine formula to calculate distance between two coordinates in km
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const [reports, setReports] = useState([]);
  const [userCoords, setUserCoords] = useState(null);

  // Get user geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation permission denied or failed:", err);
      }
    );
  }, []);

  // Fetch reports once geolocation is available
  useEffect(() => {
    if (!userCoords) return;

    const fetchReports = async () => {
      try {
        const res = await api.get("/reports");
        const allReports = res.data;

        const filtered = allReports.filter((r) => {
          if (!r.location || !r.location.coordinates) return false;
          const [lon, lat] = r.location.coordinates;
          const dist = getDistance(userCoords.lat, userCoords.lon, lat, lon);
          return dist <= 10;
        });

        setReports(filtered);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };

    fetchReports();
  }, [userCoords]);

  const handleUpvote = async (id) => {
    try {
      await api.post(`/reports/${id}/upvote`);
      // Re-fetch reports after upvoting
      if (userCoords) {
        const res = await api.get("/reports");
        const allReports = res.data;
        const filtered = allReports.filter((r) => {
          if (!r.location || !r.location.coordinates) return false;
          const [lon, lat] = r.location.coordinates;
          const dist = getDistance(userCoords.lat, userCoords.lon, lat, lon);
          return dist <= 10;
        });
        setReports(filtered);
      }
    } catch (err) {
      alert("Already upvoted or failed.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">City Issues Near You</h1>
      {!userCoords && (
        <p className="text-sm text-gray-500 mb-4">
          Enable location to see nearby reports.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <ReportCard key={r._id} report={r} onUpvote={() => handleUpvote(r._id)} />
        ))}
      </div>
    </div>
  );
}
