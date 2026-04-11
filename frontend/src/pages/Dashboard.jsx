import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mock Document Card linked to the specific document ID user provided */}
        <Link to="/documents/6921ca43b4abe752a1af453e" className="block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ultimate HTML Guide</h3>
          <p className="text-sm text-gray-500 mb-4">Last edited 2 mins ago</p>
          <div className="flex items-center text-primary text-sm font-medium">
            Open Document →
          </div>
        </Link>
      </div>
    </div>
  );
}
