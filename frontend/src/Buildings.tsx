import { useEffect, useState } from "react";

interface FloorPlan {
  id: number;
  buildingName: string;
  floorLevel: number;
  fileRef: string;
}

interface Office {
  id: number;
  roomNumber: string;
  floorPlanId: number;
  buildingName: string;
  floorLevel: number;
}

interface ManagedRoute {
  id: number;
  officeId: number;
  entrancePoint: string;
  svgOverlay: string | null;
  roomNumber: string;
  buildingName: string;
  floorLevel: number;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const data = (await response.json()) as ApiErrorResponse;

      if (data.error?.message) {
        message = data.error.message;
      }
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function Buildings() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [routes, setRoutes] = useState<ManagedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


useEffect(() => {
  let cancelled = false;

  Promise.all([
    getJson<{ floorPlans: FloorPlan[] }>("/api/admin/floor-plans"),
    getJson<{ offices: Office[] }>("/api/admin/offices"),
    getJson<{ routes: ManagedRoute[] }>("/api/admin/routes"),
  ])
    .then(([floorPlanData, officeData, routeData]) => {
      if (cancelled) {
        return;
      }

      setFloorPlans(floorPlanData.floorPlans);
      setOffices(officeData.offices);
      setRoutes(routeData.routes);
    })
    .catch((err: unknown) => {
      if (cancelled) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load location management data.",
      );
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, []);

  return (
    <main className="page-shell">
      <p className="eyebrow">Administration</p>
      <h1>Location management</h1>
      <p className="page-intro">
        Manage campus floor plans, offices and predefined lecturer routes.
      </p>

      {loading && <p className="status-message">Loading location data...</p>}

      {!loading && error && (
        <p className="status-message status-message--error">{error}</p>
      )}

      {!loading && !error && (
        <>
          <section className="search-results">
            <h2>Floor plans</h2>

            {floorPlans.length === 0 ? (
              <p className="status-message">No floor plans have been added.</p>
            ) : (
              <div className="lecturer-list">
                {floorPlans.map((floorPlan) => (
                  <article className="lecturer-card" key={floorPlan.id}>
                    <strong>{floorPlan.buildingName}</strong>
                    <span>Floor {floorPlan.floorLevel}</span>
                    <span>{floorPlan.fileRef}</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="search-results">
            <h2>Offices</h2>

            {offices.length === 0 ? (
              <p className="status-message">No offices have been added.</p>
            ) : (
              <div className="lecturer-list">
                {offices.map((office) => (
                  <article className="lecturer-card" key={office.id}>
                    <strong>{office.roomNumber}</strong>
                    <span>
                      {office.buildingName}, floor {office.floorLevel}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="search-results">
            <h2>Predefined routes</h2>

            {routes.length === 0 ? (
              <p className="status-message">
                No predefined routes have been added.
              </p>
            ) : (
              <div className="lecturer-list">
                {routes.map((route) => (
                  <article className="lecturer-card" key={route.id}>
                    <strong>{route.roomNumber}</strong>
                    <span>
                      {route.buildingName}, floor {route.floorLevel}
                    </span>
                    <span>Entrance: {route.entrancePoint}</span>
                    <span>
                      SVG overlay:{" "}
                      {route.svgOverlay ? "Configured" : "Not configured"}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Buildings;