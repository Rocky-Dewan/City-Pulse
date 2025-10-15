import React, { useState, useEffect } from "react";
import { timeAgo } from "../utils/time";


export default function ReportCard({
  report,
  onUpvote = async () => { },
  onOpenMap = () => { },
  onStatusChange = async () => { },
  showAdminControls = false,
}) {
  const id = report._id || report.id;
  const [localUpvotes, setLocalUpvotes] = useState(report.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [loadingUpvote, setLoadingUpvote] = useState(false);
  const [status, setStatus] = useState(report.status);

  useEffect(() => {
    const key = `upvoted:${id}`;
    setIsUpvoted(!!localStorage.getItem(key));
  }, [id]);

  const handleUpvote = async () => {
    const key = `upvoted:${id}`;
    if (isUpvoted || loadingUpvote) return;
    try {
      setLoadingUpvote(true);
      setLocalUpvotes((u) => u + 1); // optimistic
      setIsUpvoted(true);
      localStorage.setItem(key, "1");
      await onUpvote(id);
    } catch (err) {
      // rollback on failure
      console.error("Upvote failed", err);
      setLocalUpvotes((u) => Math.max(0, u - 1));
      setIsUpvoted(false);
      localStorage.removeItem(key);
      alert("Failed to upvote");
    } finally {
      setLoadingUpvote(false);
    }
  };

  const handleOpenMap = () => {
    // support both location.coordinates or report.lat/lng
    if (report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      onOpenMap(lat, lng);
    } else if (report.lat && report.lng) {
      onOpenMap(report.lat, report.lng);
    }
  };

  const handleStatusChange = async (e) => {
    const next = e.target.value;
    setStatus(next);
    try {
      await onStatusChange(id, next);
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status");
      setStatus(report.status); // rollback
    }
  };

  // category color map
  const cat = (report.category || "general").toLowerCase();
  const colorMap = {
    road: "bg-red-100 text-red-700",
    waste: "bg-yellow-100 text-yellow-700",
    lighting: "bg-blue-100 text-blue-700",
    water: "bg-teal-100 text-teal-700",
    general: "bg-gray-100 text-gray-700",
  };
  const catClass = colorMap[cat] || colorMap.general;

  return (
    <article className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex gap-3">
        <div className="w-28 h-20 shrink-0 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
          {report.imageUrl || report.image ? (
            <img
              loading="lazy"
              src={report.imageUrl || report.image}
              alt={report.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-gray-400 px-2">No image</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">{report.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${catClass}`}>
              {report.category || "General"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{report.description}</p>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <button
                onClick={handleOpenMap}
                className="flex items-center gap-2 hover:text-gray-800"
                aria-label="Open location"
              >
                📍 <span>{report.location?.coordinates ? "View on map" : "Location"}</span>
              </button>
              <span>•</span>
              <span>{timeAgo(report.createdAt)}</span>
              {report.createdBy?.name && <><span>•</span><span>by {report.createdBy.name}</span></>}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUpvote}
                disabled={isUpvoted}
                className={`text-sm px-2 py-1 rounded ${isUpvoted ? "text-gray-400" : "text-blue-600 hover:text-blue-800"}`}
                aria-pressed={isUpvoted}
                aria-label="Upvote report"
              >
                🔼 {localUpvotes}
              </button>

              {showAdminControls && (
                <select value={status} onChange={handleStatusChange} className="text-sm border rounded px-2 py-1">
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
