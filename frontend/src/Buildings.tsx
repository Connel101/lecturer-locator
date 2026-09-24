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

  const [editingFloorPlanId, setEditingFloorPlanId] = useState<number | null>(null);
  const [editBuildingName, setEditBuildingName] = useState("");
  const [editFloorLevel, setEditFloorLevel] = useState("");
  const [editFileRef, setEditFileRef] = useState("");
  const [floorPlanUpdating, setFloorPlanUpdating] = useState(false);
  const [floorPlanEditError, setFloorPlanEditError] = useState("");
  const [deletingFloorPlanId, setDeletingFloorPlanId] = useState<number | null>(null);
  const [floorPlanDeleteError, setFloorPlanDeleteError] = useState("");

  const [buildingName, setBuildingName] = useState("");
  const [floorLevel, setFloorLevel] = useState("");
  const [fileRef, setFileRef] = useState("");
  const [floorPlanSaving, setFloorPlanSaving] = useState(false);
  const [floorPlanError, setFloorPlanError] = useState("");

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

  async function handleCreateFloorPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFloorPlanSaving(true);
    setFloorPlanError("");

    try {
      const response = await fetch("/api/admin/floor-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buildingName,
          floorLevel: Number(floorLevel),
          fileRef,
        }),
      });

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

      const created = (await response.json()) as FloorPlan;

      setFloorPlans((current) => [...current, created]);
      setBuildingName("");
      setFloorLevel("");
      setFileRef("");
    } catch (err) {
      setFloorPlanError(
        err instanceof Error
          ? err.message
          : "Unable to create the floor plan.",
      );
    } finally {
      setFloorPlanSaving(false);
    }
  }

  function handleStartEditFloorPlan(floorPlan: FloorPlan) {
    setEditingFloorPlanId(floorPlan.id);
    setEditBuildingName(floorPlan.buildingName);
    setEditFloorLevel(String(floorPlan.floorLevel));
    setEditFileRef(floorPlan.fileRef);
    setFloorPlanEditError("");
  }

  function handleCancelEditFloorPlan() {
    setEditingFloorPlanId(null);
    setEditBuildingName("");
    setEditFloorLevel("");
    setEditFileRef("");
    setFloorPlanEditError("");
  }

  async function handleUpdateFloorPlan(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (editingFloorPlanId === null) {
      return;
    }

    setFloorPlanUpdating(true);
    setFloorPlanEditError("");

    try {
      const response = await fetch(
        `/api/admin/floor-plans/${editingFloorPlanId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buildingName: editBuildingName,
            floorLevel: Number(editFloorLevel),
            fileRef: editFileRef,
          }),
        },
      );

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

      const updated = (await response.json()) as FloorPlan;

      setFloorPlans((current) =>
        current.map((floorPlan) =>
          floorPlan.id === updated.id ? updated : floorPlan,
        ),
      );

      handleCancelEditFloorPlan();
    } catch (err) {
      setFloorPlanEditError(
        err instanceof Error
          ? err.message
          : "Unable to update the floor plan.",
      );
    } finally {
      setFloorPlanUpdating(false);
    }
  }

  async function handleDeleteFloorPlan(floorPlan: FloorPlan) {
    const confirmed = window.confirm(
      `Delete ${floorPlan.buildingName}, floor ${floorPlan.floorLevel}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingFloorPlanId(floorPlan.id);
    setFloorPlanDeleteError("");

    try {
      const response = await fetch(`/api/admin/floor-plans/${floorPlan.id}`, {
        method: "DELETE",
      });

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

      setFloorPlans((current) =>
        current.filter((item) => item.id !== floorPlan.id),
      );
    } catch (err) {
      setFloorPlanDeleteError(
        err instanceof Error
          ? err.message
          : "Unable to delete the floor plan.",
      );
    } finally {
      setDeletingFloorPlanId(null);
    }
  }

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
            <form className="lecturer-list" onSubmit={handleCreateFloorPlan}>
              <label className="search-field">
                Building name
                <input
                  type="text"
                  value={buildingName}
                  onChange={(event) => setBuildingName(event.target.value)}
                  required
                />
              </label>

              <label className="search-field">
                Floor level
                <input
                  type="number"
                  step="1"
                  value={floorLevel}
                  onChange={(event) => setFloorLevel(event.target.value)}
                  required
                />
              </label>

              <label className="search-field">
                Floor plan file
                <input
                  type="text"
                  value={fileRef}
                  onChange={(event) => setFileRef(event.target.value)}
                  placeholder="/data/floorplans/groundfloor.svg"
                  required
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={floorPlanSaving}
              >
                {floorPlanSaving ? "Adding floor plan..." : "Add floor plan"}
              </button>

              {floorPlanError && (
                <p className="status-message status-message--error">
                  {floorPlanError}
                </p>
              )}
            </form>

            {floorPlans.length === 0 ? (
              <p className="status-message">No floor plans have been added.</p>
            ) : (
              <div className="lecturer-list">
                {floorPlans.map((floorPlan) => (
                  <article className="lecturer-card admin-management-card" key={floorPlan.id}>
                    {editingFloorPlanId === floorPlan.id ? (
                      <form onSubmit={handleUpdateFloorPlan} className="lecturer-list">
                        <label className="search-field">
                          Building name
                          <input
                            type="text"
                            value={editBuildingName}
                            onChange={(event) => setEditBuildingName(event.target.value)}
                            required
                          />
                        </label>

                        <label className="search-field">
                          Floor level
                          <input
                            type="number"
                            step="1"
                            value={editFloorLevel}
                            onChange={(event) => setEditFloorLevel(event.target.value)}
                            required
                          />
                        </label>

                        <label className="search-field">
                          Floor plan file
                          <input
                            type="text"
                            value={editFileRef}
                            onChange={(event) => setEditFileRef(event.target.value)}
                            required
                          />
                        </label>

                        <button
                          className="primary-button"
                          type="submit"
                          disabled={floorPlanUpdating}
                        >
                          {floorPlanUpdating ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEditFloorPlan}
                          disabled={floorPlanUpdating}
                        >
                          Cancel
                        </button>

                        {floorPlanEditError && (
                          <p className="status-message status-message--error">
                            {floorPlanEditError}
                          </p>
                        )}
                      </form>
                    ) : (
                      <>
                        <div className="admin-card-details">
                          <strong>{floorPlan.buildingName}</strong>
                          <span>Floor {floorPlan.floorLevel}</span>
                          <span>{floorPlan.fileRef}</span>
                        </div>

                        <div className="admin-card-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => handleStartEditFloorPlan(floorPlan)}
                            disabled={deletingFloorPlanId === floorPlan.id}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => void handleDeleteFloorPlan(floorPlan)}
                            disabled={deletingFloorPlanId === floorPlan.id}
                          >
                            {deletingFloorPlanId === floorPlan.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}

            {floorPlanDeleteError && (
              <p className="status-message status-message--error">
                {floorPlanDeleteError}
              </p>
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