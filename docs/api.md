# Public Lecturer API

The public API is used by the React frontend to search for lecturers, display lecturer profiles and retrieve directions.

Public endpoints do not require authentication.

## General rules

- Requests and responses use JSON.
- Field names use `camelCase`.
- Only active lecturers are returned. The `active` field represents whether a lecturer is publicly available.
- Private and administrator-only information is never returned.
- Optional text fields are omitted when unavailable.
- `office` and `route` use `null` when their data is unavailable.

## Search for lecturers

```text
GET /api/lecturers?search=alex
```

The optional `search` parameter filters lecturers by name. Searching is partial and case-insensitive.

If `search` is omitted or empty, all public lecturers are returned.

### Successful response — `200 OK`

```json
{
  "lecturers": [
    {
      "id": "d7ac9ed3-b706-40bf-9572-cdaa1f018791",
      "fullName": "Dr Alex Example",
      "title": "Senior Lecturer",
      "department": "Computer Science",
      "office": {
        "buildingName": "Natural Sciences",
        "floorLevel": 0,
        "roomNumber": "G01"
      }
    }
  ]
}
```

If no lecturers match:

```json
{
  "lecturers": []
}
```

If a lecturer does not have an assigned office, `office` is `null`.

If `search` is provided more than once or is not a single text value, the API returns `400 Bad Request`:

```json
{
  "error": {
    "code": "INVALID_SEARCH",
    "message": "The search parameter must be a single text value."
  }
}
```

## Get a lecturer profile

```text
GET /api/lecturers/:id
```

Returns a lecturer using their permanent ID.

### Successful response — `200 OK`

```json
{
  "id": "d7ac9ed3-b706-40bf-9572-cdaa1f018791",
  "fullName": "Dr Alex Example",
  "title": "Senior Lecturer",
  "department": "Computer Science",
  "email": "alex.example@example.edu",
  "officePhone": "+27 18 000 0001",
  "modules": [
    {
      "code": "CMPG111",
      "name": "Introduction to Computing"
    }
  ],
  "researchArea": "Software Engineering",
  "officeHours": [
    {
      "dayOfWeek": 1,
      "startTime": "10:00",
      "endTime": "12:00"
    }
  ],
  "office": {
    "buildingName": "Natural Sciences",
    "floorLevel": 0,
    "roomNumber": "G01"
  },
  "route": {
    "floorPlan": {
      "buildingName": "Natural Sciences",
      "floorLevel": 0,
      "fileRef": "/data/floorplans/natural-sciences-ground.svg"
    },
    "entrancePoint": "Main Entrance",
    "svgOverlay": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 400\"><!-- complete exported artwork and metadata --></svg>"
  }
}
```

`email`, `officePhone` and `researchArea` are optional and are omitted when
unavailable. Contact fields are returned only by the profile endpoint, not by
lecturer search. `officeHours` is ordered by day and start time, uses
ISO weekday numbers (`1` for Monday through `7` for Sunday), and is an empty
array when no ranges are available. `modules` is an empty array when no modules
are available.

If a lecturer does not have an assigned office, `office` is `null`.

If directions, an entrance point or a floor plan are unavailable, `route` is `null`. Route data is returned with the profile so the frontend does not need to make a second API request when the user chooses to view directions.

### Profile unavailable — `404 Not Found`

Unknown and inactive lecturers use the same response:

```json
{
  "error": {
    "code": "LECTURER_NOT_FOUND",
    "message": "Lecturer profile is unavailable."
  }
}
```

## Server error

Unexpected errors return `500 Internal Server Error`:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "The requested information could not be loaded."
  }
}
```


## Complete route overlays

`route.svgOverlay` is the complete exported SVG document, including footprints/arrows,
pin, styling, and editor metadata. There is no separate centreline column or API
field. The centreline remains inside the exported SVG metadata for editor use.
If an overlay is unavailable, the profile returns `route: null`.

The overlay and floor-plan SVG must have matching valid `viewBox` coordinates.
The viewer renders them as images in a shared frame. The floor plan is loaded from
`floorPlan.fileRef`; no separate route endpoint is needed. Missing overlays show
unavailable directions. API request failures and map load failures offer retry.

Apply the database migrations, then run the development seed command to populate
complete overlays from the existing assets. Each run reloads matching route artwork
and entrance names, refreshes sample lecturer fields and office assignments, and
synchronises their module links. It preserves IDs and does not clear tables.
Preserve embedded metadata for future editor import support.

# Administrator Location Management API

The administrator location API manages floor plans, offices and route overlays used by the lecturer directory and directions features.

All endpoints in this section require an authenticated administrator session.

## General rules

- Requests and responses use JSON unless otherwise stated.
- Field names use `camelCase`.
- Administrator endpoints are available under `/api/admin`.
- Unauthenticated requests return `401 Unauthorized`.
- Authenticated users without administrator access return `403 Forbidden`.
- Successful delete requests return `204 No Content`.

## Floor plans

### List floor plans

```text
GET /api/admin/floor-plans
```

Returns all floor-plan records ordered by building name and floor level.

### Successful response - `200 OK`

```json
{
  "floorPlans": [
    {
      "id": 1,
      "buildingName": "G3",
      "floorLevel": 0,
      "fileRef": "/data/floorplans/groundfloor.svg",
      "createdAt": "2026-09-13T13:12:23.647Z",
      "updatedAt": "2026-09-22T08:56:39.947Z"
    }
  ]
}
```

### Create a floor plan

```text
POST /api/admin/floor-plans
```

Example request:

```json
{
  "buildingName": "G3",
  "floorLevel": 0,
  "fileRef": "/data/floorplans/groundfloor.svg"
}
```

`buildingName` and `fileRef` must be non-empty text values. `floorLevel` must be a whole number.

A successful request returns the created floor-plan record with `201 Created`.

### Update a floor plan

```text
PATCH /api/admin/floor-plans/:id
```

Example request:

```json
{
  "buildingName": "G3",
  "fileRef": "/data/floorplans/groundfloor-updated.svg"
}
```

Only supplied fields are updated.

### Delete a floor plan

```text
DELETE /api/admin/floor-plans/:id
```

A floor plan can be deleted only when no offices are assigned to it.

If offices still reference the floor plan, the API returns `409 Conflict`:

```json
{
  "error": {
    "code": "FLOOR_PLAN_IN_USE",
    "message": "The floor plan cannot be deleted while offices are assigned to it."
  }
}
```

A successful deletion returns `204 No Content`.

## Offices

### List offices

```text
GET /api/admin/offices
```

Returns offices together with their floor-plan information.

### Successful response - `200 OK`

```json
{
  "offices": [
    {
      "id": 1,
      "roomNumber": "G03",
      "floorPlanId": 1,
      "buildingName": "G3",
      "floorLevel": 0,
      "createdAt": "2026-09-13T13:12:23.647Z",
      "updatedAt": "2026-09-13T13:12:23.647Z"
    }
  ]
}
```

### Create an office

```text
POST /api/admin/offices
```

Example request:

```json
{
  "floorPlanId": 1,
  "roomNumber": "G03"
}
```

`floorPlanId` must identify an existing floor plan. `roomNumber` must be a non-empty text value.

A successful request returns the created office with `201 Created`.

### Update an office

```text
PATCH /api/admin/offices/:id
```

Example request:

```json
{
  "roomNumber": "B03"
}
```

Only the room number can be updated. An office stays on the floor plan selected when it was created. Supplying `floorPlanId` returns `400 Bad Request` with `FLOOR_PLAN_CHANGE_NOT_ALLOWED`. To move a lecturer, change the lecturer's office assignment instead.

### Delete an office

```text
DELETE /api/admin/offices/:id
```

Deleting an office also removes its associated route. Lecturers assigned to the deleted office are left without an office assignment.

A successful deletion returns `204 No Content`.

## Routes

### List routes

```text
GET /api/admin/routes
```

Returns route records together with their associated office and floor-plan information.

### Successful response - `200 OK`

```json
{
  "routes": [
    {
      "id": 1,
      "officeId": 1,
      "entrancePoint": "Main Entrance",
      "svgOverlay": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
      "roomNumber": "G03",
      "floorPlanId": 1,
      "buildingName": "G3",
      "floorLevel": 0,
      "createdAt": "2026-09-13T13:12:23.647Z",
      "updatedAt": "2026-09-13T13:12:23.647Z"
    }
  ]
}
```

### Create a route

```text
POST /api/admin/routes
```

Example request:

```json
{
  "officeId": 1,
  "entrancePoint": "Main Entrance",
  "svgOverlay": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>"
}
```

`officeId` must identify an existing office. `entrancePoint` must be a non-empty text value.

`svgOverlay` may be omitted or set to `null`. When supplied as text, the complete SVG document is stored unchanged so that editor metadata and route artwork are preserved.

The MVP supports one route per office. Attempting to create a second route for the same office returns `409 Conflict`:

```json
{
  "error": {
    "code": "ROUTE_ALREADY_EXISTS",
    "message": "A route already exists for this office."
  }
}
```

A successful request returns the created route with `201 Created`.

### Update a route

```text
PATCH /api/admin/routes/:id
```

Example request:

```json
{
  "entrancePoint": "South Entrance",
  "svgOverlay": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>"
}
```

The office assignment, entrance point and SVG overlay can be updated independently.

Moving a route to an office that already has a route is rejected with `409 Conflict`.

### Delete a route

```text
DELETE /api/admin/routes/:id
```

Deleting a route does not delete its office or floor plan.

A successful deletion returns `204 No Content`.


### Upload SVG files

The admin UI sends the selected SVG file as the request body to
`POST /api/files/floor-plans` or `POST /api/files/routes`, with
`Content-Type: image/svg+xml`. Uploads are limited to 4 MB. A successful upload
returns `{ "fileRef": "/api/files/<kind>/<id>.svg" }`. Save this reference in
`floorPlan.fileRef` or `route.svgOverlay` through the existing JSON endpoints.
`GET /api/files/<kind>/<id>.svg` serves the SVG to the public route viewer.
Existing seeded `/data/floorplans/` references and inline route SVGs remain valid.

In development, files are saved alongside the existing map assets in
`backend/src/data/floorplans/` with an `uploaded-floor-plan-` or
`uploaded-route-` prefix (ignored by Git). Earlier local uploads under
`backend/data/uploads/` remain readable.
Production uses the Neon Object Storage S3 endpoint and bucket configured through
`STORAGE_S3_ENDPOINT`, `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`,
`STORAGE_S3_ACCESS_KEY_ID`, and `STORAGE_S3_SECRET_ACCESS_KEY`. Production uploads
fail if any of these are missing. 

## Administrator API errors

Invalid numeric IDs return `400 Bad Request`.

Missing floor plans, offices and routes return `404 Not Found`.

Requests that contain no fields that can be updated return `400 Bad Request`.

Unexpected database or server failures return `500 Internal Server Error` using the standard JSON error structure.
