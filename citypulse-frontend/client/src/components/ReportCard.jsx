export default function ReportCard({ report, onUpvote }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow hover:shadow-md">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">{report.title}</h2>
        <span className="text-xs bg-gray-200 rounded-full px-2">{report.category}</span>
      </div>
      <p className="mt-1 text-gray-600 text-sm">{report.description}</p>

      {report.imageUrl && (
        <img src={report.imageUrl} alt="Issue" className="mt-3 rounded-md max-h-60 object-cover w-full" />
      )}

      <div className="flex justify-between items-center mt-3">
        <div>
          <span className="text-sm text-gray-500">Status: </span>
          <span className="text-sm font-medium">{report.status}</span>
        </div>
        <button onClick={onUpvote} className="text-blue-600 hover:underline text-sm">
          🔼 {report.upvotes || 0}
        </button>
      </div>
    </div>
  );
}
