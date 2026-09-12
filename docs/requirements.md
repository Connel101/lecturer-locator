# Lecturer Locator MVP Requirements

This document summarises the agreed minimum viable product (MVP) for Lecturer Locator, based on the submitted Final Functional Specification - Lecturer Locator document. The Functional and Technical Specifications remain the authoritative sources for detailed requirements and implementation decisions.

## Purpose

Lecturer Locator is a browser-based indoor wayfinding system for North-West University. It allows students and visitors to find a lecturer's public profile and view a predefined route to the lecturer's office. The system uses permanent lecturer identifiers so that printed QR codes remain valid when lecturer information or office assignments change.

## Initial Pilot Scope

The initial pilot covers the Natural Sciences building and supports 29 lecturer profiles, consisting of 24 permanent and five temporary staff records. Guaranteed routed wayfinding is limited to offices represented on the supplied ground-floor map.

The public interface is designed primarily for typical smartphone screens but also supports the desktop browsers identified in the project's compatibility test plan. Users require an internet connection and may access the system through NWU campus Wi-Fi or mobile data. No native application or additional positioning hardware is required.

## Public User Journey

1. A student or visitor scans a lecturer's QR code using the phone's native camera or QR-scanning functionality. Alternatively, the user opens Lecturer Locator directly and searches for a lecturer by name.
2. The system opens the selected lecturer's public profile without requiring registration or login.
3. The profile displays the lecturer's approved information and current office location. Optional information, such as modules taught, research area, and office hours, is displayed when available.
4. The user selects "View directions".
5. The system displays the relevant floor map with a predefined route from the designated entrance to the lecturer's current office. The entrance, route, destination, and room number are clearly identified.
6. If the lecturer profile is unknown, inactive, or unpublished, the system displays a clear profile-unavailable message. If the profile does exist but no predefined route is available, the system displays a route-unavailable message while continuing to show the lecturer's recorded office details.

## Administrator Journey

1. An authorised administrator logs in using a valid username and password.
2. The administrator creates, views, edits, deactivates, or reactivates lecturer profiles.
3. The administrator creates and updates office records and assigns or reassigns lecturers to offices.
4. The administrator uploads or replaces floor maps and uploads, updates, deactivates, or associates predefined routes with offices.
5. Changes to a lecturer's profile or office assignment are saved without changing the lecturer's permanent identifier or requiring a replacement QR code.
6. The administrator logs out securely when finished.

## MVP Functionality

The MVP includes:

- Permanent QR-linked lecturer identifiers.
- Public lecturer profiles that do not require authentication.
- Search by lecturer name.
- Current building, floor, and room information.
- Optional display of modules taught, research area, and office hours.
- Predefined wayfinding routes associated with office records.
- A PNG floor map with SVG route overlays.
- Clear entrance and destination markers that do not rely on colour alone.
- Unknown, inactive, and unpublished profiles are not displayed publicly. Clear fallback messages are shown for unavailable profiles and offices without predefined routes. 
- Authenticated administration of lecturer profiles, offices, floor maps, and routes.
- Mobile-responsive public and administrative interfaces.
- HTTPS communication and secure handling of administrator passwords and sessions.
- Handling of lecturer information in accordance with POPIA and the approved publication process.

## Development and Test Data

Development and testing will use fictional, anonymised, or placeholder lecturer data until the required authorisation for real lecturer information has been obtained. Real lecturer names or personal information must not be placed in development seed data without approval.

## Deferred Features

The following features do not form part of the guaranteed initial MVP:

- Augmented-reality navigation.
- Guaranteed basement route coverage.
- Buildings and floors outside the initial pilot.
- Offline operation.
- Integration with NWU student-information, timetabling, staff-directory, or institutional-authentication systems.
- Real-time route calculation, GPS positioning, Bluetooth beacons, or other dedicated positioning hardware.

These features may be investigated after the core MVP has been implemented and shown to be stable.

## MVP Completion Summary

The MVP is complete when a public user can scan a lecturer's QR code or find the lecturer through search, view the correct public profile, and request a readable predefined route on a smartphone. An authenticated administrator must also be able to maintain the lecturer, office, floor-map, and route information required for that public journey.