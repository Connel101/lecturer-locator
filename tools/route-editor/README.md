# Footpath route editor

A standalone HTML/CSS/JavaScript tool. No packages, CDN, build step, server or account required. Open `index.html` directly in a modern browser to use it locally.

## Member workflow

1. Choose an SVG, JPEG, PNG or WebP floorplan. Loading another plan starts a new route.
2. In **Draw route**, click the entrance, then each corridor turn, ending at the office. Footprints point in the order you click. Drag a point to correct it.
3. Select **Place office pin** and click the office. The tip marks the location; drag the body of the pin to adjust it.
4. Choose **Footprints** or **Arrows**, adjust symbol size/colour and enter the office and entrance names.
5. Download the transparent **route SVG**. Optionally download the **route data** for database entry.

Use zoom and the canvas scrollbars for detailed plans. Undo supports the button or Ctrl/Cmd+Z outside text fields. Clear removes both the route and pin and can be undone. Work is held in memory, so export before closing or reloading the page. Floorplan files are decoded locally as images and are never uploaded or inserted as executable SVG markup.

## Deploy on GitHub Pages

1. Commit and push `route-editor/` and `.github/workflows/route-editor-pages.yml` to the repository's default branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Under **Actions**, choose **Deploy route editor to GitHub Pages → Run workflow**.
4. Open the URL shown by the completed deployment. Run the workflow again to publish later changes.

The workflow publishes only the `route-editor` directory at the Pages site's root. It is manual so changes elsewhere in the application do not trigger deployments. A repository has one Pages site, so this workflow should be used where the editor is the intended Pages content.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Overlay and database contract

- SVG exports contain the selected route symbols, office pin, invisible `#route-centerline` path and JSON metadata. They do **not** contain the floorplan, editing handles or guide line.
- SVG floorplans retain their original `viewBox`, including nonzero origins. Raster floorplans use `0 0 naturalWidth naturalHeight`.
- Place the exported SVG over the same floorplan using the same display bounds and aspect ratio. Do not crop or independently stretch either layer. For SVG floorplans, use the editor's viewBox aspect ratio; it normalises the uploaded image's display dimensions to that ratio.
- The JSON export includes `svgPath` (the `M … L …` centerline used by the existing `routes.svgPath` field), `entrancePoint`, `officeLabel`, `officePin`, `floorPlan.fileName`, `floorPlan.viewBox` and styling information (`style.symbol` is `footprints` or `arrows`; `symbolSize` is in floorplan units, with `footprintSize` retained for compatibility). `fileName` identifies the original upload; it is not a server `fileRef`.
- The current database/API stores only the centerline and entrance name. Store the downloaded SVG as a separate asset to retain the exact footprints and pin. Do not put a complete SVG document in `routes.svgPath`. Integrating overlay asset references or pin/style fields into the backend is a separate change.
- An SVG's `#route-centerline` `d` attribute also exposes the existing path value. Metadata retains the office and entrance labels without rendering additional text over the floorplan.
