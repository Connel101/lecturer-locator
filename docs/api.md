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
