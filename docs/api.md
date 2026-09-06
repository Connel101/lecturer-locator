# Public Lecturer API

The public API is used by the React frontend to search for lecturers, display lecturer profiles and retrieve directions.

Public endpoints do not require authentication.

## General rules

- Requests and responses use JSON.
- Field names use `camelCase`.
- Only active and publicly approved lecturers are returned.
- Private and administrator-only information is never returned.
- Optional fields are omitted when unavailable.

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
  "modules": [
    {
      "code": "CMPG111",
      "name": "Introduction to Computing"
    }
  ],
  "researchArea": "Software Engineering",
  "officeHours": "Monday 10:00-12:00",
  "office": {
    "buildingName": "Natural Sciences",
    "floorLevel": 0,
    "roomNumber": "G01"
  },
  "routeAvailable": true
}
```

`researchArea` and `officeHours` are optional. `modules` is an empty array when no modules are available.

### Profile unavailable — `404 Not Found`

Unknown, inactive and unpublished lecturers use the same response:

```json
{
  "error": {
    "code": "LECTURER_NOT_FOUND",
    "message": "Lecturer profile is unavailable."
  }
}
```

## Get directions

```text
GET /api/lecturers/:id/route
```

Returns the floor plan and predefined route to the lecturer's current office.

### Successful response — `200 OK`

```json
{
  "floorPlan": {
    "buildingName": "Natural Sciences",
    "floorLevel": 0,
    "fileRef": "/data/floorplans/natural-sciences-ground.svg"
  },
  "entrancePoint": "Main Entrance",
  "destinationRoom": "G01",
  "svgPath": "M 40 200 L 120 200 L 120 350"
}
```

### Route unavailable — `404 Not Found`

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Directions are not available for this office."
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