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
  "route": {
    "floorPlan": {
      "buildingName": "Natural Sciences",
      "floorLevel": 0,
      "fileRef": "/data/floorplans/natural-sciences-ground.svg"
    },
    "entrancePoint": "Main Entrance",
    "svgPath": "M 40 200 L 120 200 L 120 350"
  }
}
```

`researchArea` and `officeHours` are optional. `modules` is an empty array when no modules are available.

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
