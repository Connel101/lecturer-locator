# Footpath route editor — legacy

This standalone HTML/CSS/JavaScript editor has been superseded by the route editor built into LecturerLocator. Its files are retained for historical reference and are no longer part of the application workflow.

## Use the built-in editor

Sign in to the main app, open **Admin menu → Buildings → Routes**, select an office, and choose **Create route in editor**. Use **Edit** in the Routes list to update an existing route.

The built-in editor loads the office’s floor plan, lets you draw a route and place its destination pin, and saves the SVG overlay directly through the app. You do not need to export files manually or deploy the standalone tool to GitHub Pages.

See the [main README](../../README.md#managing-floor-plans-and-routes) for setup and the full workflow.

The manual workflow at `.github/workflows/route-editor-pages.yml` is retained as a legacy deployment configuration; it is not needed for the main app. The old standalone export format does not describe the current database/API contract; consult the [API reference](../../docs/api.md) instead.
