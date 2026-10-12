import { useState } from 'react';
import { routeService } from '@/services/routeService';
import { EmergencyMap } from '@/components/EmergencyMap';
import type { RouteResult } from '@/types';

const DEFAULT_SOURCE = { lat: 9.9252, lon: 78.1198 };
const DEFAULT_DEST = { lat: 9.9452, lon: 78.1398 };

export default function AdminRoutesPage() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [dest, setDest] = useState(DEFAULT_DEST);
  const [dijkstraResult, setDijkstraResult] = useState<RouteResult | null>(null);
  const [astarResult, setAstarResult] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dijkstra, astar] = await Promise.all([
        routeService.dijkstra(source.lat, source.lon, dest.lat, dest.lon),
        routeService.astar(source.lat, source.lon, dest.lat, dest.lon),
      ]);
      setDijkstraResult(dijkstra);
      setAstarResult(astar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-navy-950">Route algorithm comparison</h1>
        <p className="mt-1 text-sm text-navy-600">
          Runs Dijkstra and A* over the same synthetic road-network graph so their distance, ETA, and nodes
          explored can be compared directly.
        </p>
      </div>

      <div className="rounded-lg border border-navy-900/10 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Source</p>
            <div className="mt-2 flex gap-2">
              <input type="number" step="0.0001" value={source.lat}
                onChange={(e) => setSource((s) => ({ ...s, lat: parseFloat(e.target.value) }))}
                className="w-28 rounded-md border border-navy-900/20 px-2 py-1.5 text-sm" />
              <input type="number" step="0.0001" value={source.lon}
                onChange={(e) => setSource((s) => ({ ...s, lon: parseFloat(e.target.value) }))}
                className="w-28 rounded-md border border-navy-900/20 px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Destination</p>
            <div className="mt-2 flex gap-2">
              <input type="number" step="0.0001" value={dest.lat}
                onChange={(e) => setDest((s) => ({ ...s, lat: parseFloat(e.target.value) }))}
                className="w-28 rounded-md border border-navy-900/20 px-2 py-1.5 text-sm" />
              <input type="number" step="0.0001" value={dest.lon}
                onChange={(e) => setDest((s) => ({ ...s, lon: parseFloat(e.target.value) }))}
                className="w-28 rounded-md border border-navy-900/20 px-2 py-1.5 text-sm" />
            </div>
          </div>
        </div>
        <button onClick={runComparison} disabled={loading}
          className="mt-4 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
          {loading ? 'Calculating…' : 'Compare Dijkstra vs A*'}
        </button>
        {error && <p className="mt-2 text-sm text-status-critical">{error}</p>}
      </div>

      {(dijkstraResult || astarResult) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[{ label: 'Dijkstra', result: dijkstraResult }, { label: 'A*', result: astarResult }].map(({ label, result }) => (
            <div key={label} className="rounded-lg border border-navy-900/10 bg-white p-5">
              <h2 className="font-display text-lg text-navy-950">{label}</h2>
              {result ? (
                <>
                  <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-navy-500">Distance</dt>
                      <dd className="font-medium">{result.distanceKm.toFixed(2)} km</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-navy-500">Est. time</dt>
                      <dd className="font-medium">{result.estimatedTimeMinutes.toFixed(1)} min</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-navy-500">Nodes explored</dt>
                      <dd className="font-medium">{result.nodesExplored}</dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <EmergencyMap
                      center={[source.lat, source.lon]}
                      routePoints={result.routePoints}
                      height="260px"
                    />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-navy-500">No result yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
