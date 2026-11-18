# Upload the ready-built Home Studio website

Use `home-studio-pages.zip` to publish from another device without installing Node.js or running a build. The ZIP already contains the website and its local Three.js runtime. Nothing is uploaded automatically.

## Extract the website

1. Copy `home-studio-pages.zip` to the other device and extract it.
2. Open the extracted folder containing `index.html`. It also contains `src/`, `vendor/`, `references/`, `materials/`, `.nojekyll`, and `UPLOAD-INSTRUCTIONS.md`.
3. Upload these contents directly to the repository root. Do not upload the ZIP itself or put the enclosing extraction folder inside the repository. `index.html` must be at the repository root. Preserve `.nojekyll`; enable hidden-file display in your file manager if needed.

The archive includes the home model, reference photo previews, floorplan, extracted video stills, and kitchen material textures and swatches. These will be publicly accessible on a public repository and Pages site. Original photos from the workspace root, MOV videos and material HEIC files are excluded.

If you will continue editing the project with a coding agent on another device, also transfer `docs/CODEX_HANDOFF.md` separately. Neither website ZIP contains that handoff file.

## Create the GitHub repository

At [github.com/new](https://github.com/new), choose owner **SaiMun92**, name **home-studio**, and visibility **Public** for free GitHub Pages. Leave README, `.gitignore`, and license initialization unchecked so the repository starts empty.

Use this ready-built method with an empty repository. Do not copy `.github/workflows/pages.yml` from the source archive into it: that workflow expects the source project and a build step. The ready-built site deploys directly from the branch.

## Upload the extracted files

Choose either method below.

### Git commands

Install Git if needed and open a terminal in the extracted folder containing `index.html`. Run:

```sh
git init -b main
git add .
git commit -m "Publish Home Studio website"
git remote add origin https://github.com/SaiMun92/home-studio.git
git push -u origin main
```

Sign in when Git requests authentication. If Git asks for an author identity, configure your name and email before retrying the commit.

### GitHub website

1. Open the empty repository and select **uploading an existing file**. For a repository with files, use **Add file → Upload files**.
2. Drag the extracted contents, including the `src`, `vendor`, `references`, and `materials` folders, into the upload area. Preserve their folder structure. Include `index.html` and `.nojekyll` at the root.
3. Commit the upload to **main**.

If your file picker hides `.nojekyll`, create it on GitHub afterward using **Add file → Create new file**. Name it `.nojekyll`, leave its contents empty, and commit it to `main`.

## Enable GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Source → Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then click **Save**.
4. Wait for the Pages deployment to finish. You can check its progress in the repository's **Actions** tab.
5. Open **[https://saimun92.github.io/home-studio/](https://saimun92.github.io/home-studio/)**. This URL becomes available after deployment succeeds.

For a different account or repository name, the URL is `https://USERNAME.github.io/REPOSITORY/`. Asset paths are already relative, so no code changes are needed for a different repository name.

## Bring your saved design

On the original device, open the current Home Studio app and click **Export design**. Copy the downloaded JSON file to the other device. Open the hosted site, click **Import design**, and select that JSON file.

Your saved wall colors, kitchen changes, and furniture placements live in browser storage; they are not automatically included in the website ZIP or shared between devices. Import the design separately in each browser where you want to use it.

For multiple designs, open **Saved designs → Export all designs** on the original device. Transfer `home-studio-designs.json` and use **Saved designs → Import saved designs** on the hosted site. The imported snapshots are added to that browser's library. Select **Load design** on a snapshot whenever you want to return to it.

## View and panel controls

The living-room wall behind the TV and the master-bedroom side wall beside the wardrobe are now solid. Refresh shows this correction in existing designs; main windows, window ledges and saved arrangements are retained.

Refresh the updated website to use the larger **Rooms** and **Design editor** panels. Each has its own **Hide** button. Reopen a collapsed panel with the arrow at the edge of the screen, or **Show** in its bar on a smaller screen. Panels keep their selection and edits while hidden and expand again on page reload.

The **Walls**, **Kitchen** and **Furniture** editor sections start closed to reduce scrolling. Click a section heading, or focus it and press **Enter/Space**, to show or hide its controls. Sections open independently and remember their state through edits, Undo/Redo, tab switches and panel hiding. Selecting a cabinet or furniture opens its controls. Refresh resets sections to closed without changing your current design or saved copies.

In **Dollhouse**, use **W/S** to pan forward/back and **A/D** sideways across the floor relative to your current view. WASD panning is now twice as fast; refresh to load the updated controls. Drag to orbit and scroll to zoom. Typing in controls and using dialogs pauses keyboard navigation. These camera and panel controls do not change your design or saved copies, and work without reloading the designer proposal.

## Bundled designer proposal

Open **Saved designs** and choose **Designer inspiration**. The proposal is included with both ZIPs and is available on the new device without importing personal saves. **Load design** keeps the modeled sink/appliance sizes and moves the sink beside the dishwasher for about 500 mm of clear worktop before the stove, applies the proposal's finishes, turns on task lighting, matches the yard cupboard to warm off-white, sets the title, replaces the existing dining set in place with the 150 cm Castlery Vincent, adds the Veronica Sand coffee table and two Chalk Bouclé/White Wash Solange chairs, opens the shorter end-upper doors beside the fridge, and arranges Bedroom 2 as a two-person office while retaining its built-in wardrobe. Loading opens the office view; living, dining and yard are fallbacks if no office desk remains. The sofa, TV console, unrelated furniture, room finishes, cabinet depth and worktop height are preserved. **Save a copy** keeps a snapshot without changing the active design; **Export** downloads its design JSON.

The design pairs Cinnamon Poplar lower cabinets, warm off-white uppers and yard cupboard, Calacatta Potoro Extra countertop and an ivory backsplash. From living toward yard, its six editable bays contain drinks drawers (0.6 m), dishwasher (0.6 m), sink cabinet with waste assignment (0.7 m), prep drawers (0.4 m), hob/oven (0.6 m) and appliance bay (0.6 m). The 0.4 m fitted rear cabinet and 0.1 m floor-edge extension complete the 4.0 m physical run. The original modeled sink/appliance sizes remain, with about 500 mm clear worktop between stove and sink. The 0.4 m prep-drawer bay is part of the latest request to bring the sink closer to the dishwasher. Storage notes describe intended use; working fronts stay closed except for the final upper cupboard beside the fridge. Site measurements and appliance clearances remain unverified.

The proposal also frames the space-grey Panasonic NR-F603GT-SS fridge with wood side panels and an overhead cupboard, and replaces the laundry stack with a black LG FV1413H2BA washer/dryer beneath two open appliance platforms. An air fryer, multicooker and blender are visible on the shelves; they are schematic, and the platforms are shown retracted. Fridge dimensions are 685 W × 1828 H × 745 D mm; the 13/8 kg washer/dryer is 600 W × 850 H × 615 D mm. Cabinet installation allowances require checking. The TV-box cupboard, rear projection and original kitchen working layout stay in place.

Use **Kitchen → Fridge & appliance storage → View fridge & appliance cabinet** for the front view and independent carpentry/laundry controls; they also appear under **Yard → Walls**. Inspiration crops are bundled with the website. Removing the surround retains the selected fridge. Yard settings and product choices survive saves, JSON transfer and color reset; full reset restores the original reference appliances.

After updating the website, choose **Load design** on this bundled proposal again to get the revised arrangement. Existing working designs and personal saved snapshots are not automatically migrated.

The sink and centered tap move 200 mm toward the dishwasher, keeping their original size. The former 1100 mm sink bay is split into a 700 mm sink cabinet and 400 mm prep drawers. Clear stove-to-sink worktop is now 498.5 mm; the dishwasher, stove, oven and hood remain in their previous proposal positions. To apply only this change to an older wide-sink proposal, refresh and choose **Kitchen → More preparation space → Move sink next to dishwasher**. This preserves other edits and can be undone. Existing working designs and saved copies are not automatically migrated.

The tap is now centered on the sink. Refreshing shows this correction in existing designs without changing basin dimensions or saved data.

The end upper beside the fridge has two 258 mm doors shown open 90°, aligning their free edges with the short tiled wall. Its 615 mm upper-only division leaves lower modules and appliance positions intact. Use **Kitchen → Upper cabinet beside the fridge → End-cabinet doors** to select original closed, shorter closed or shorter open doors, and **View door clearance** for the detail view. Choices are saved and undoable; viewing alone is transient. Older saved designs retain their original fronts until explicitly changed. The cupboard shelf is visible; other working-cabinet interiors remain storage notes. Wall and hinge dimensions are model estimates.

Upper-cabinet strips sit along the back edge near the kitchen wall; the hood retains its own lamps. This light placement appears on refresh without reloading the proposal. Open **Kitchen → Lighting → Preview lighting**, above **Materials**, for an eye-level kitchen view in a temporary evening environment. Toggle **Warm task lighting** to compare the illumination on the worktop and backsplash. **Return to daylight** exits the preview. Previewing does not change the saved design; the light on/off setting persists with the design and can be undone.

## Colors and saved copies

- Open the **Kitchen** tab, scroll to **Materials**, and choose a **Cabinet laminate** and **Countertop** from the dropdowns. Each selection immediately updates its sample preview, product name, code and reference-photo link. **Apply to kitchen** shows the chosen materials in 3D on your current layout while preserving the backsplash color. The laminate applies to both upper and lower cabinets. **Save a copy** keeps a snapshot in **Saved designs → Your saved copies** using the selected pair and current geometry without changing the active design. Browsing the dropdowns alone leaves your design unchanged. The materials and previews come with the website on every device.
- Use **Reset original colors** at the bottom of the editor to restore the original palette while retaining your layout and carpentry edits.
- In the **Kitchen** editor, use **Backsplash panel** swatches or **Custom backsplash color**. **Restore original copper** resets just the panel; **Reset original colors** also restores its copper finish. The backsplash color is included in saved copies and JSON transfers.
- Select **Yard → Walls → Yard cabinet** to change the tall cabinet's finish, or choose **Restore original orange**.
- Use **Saved designs** to manage complete saved versions: save the current design, load a copy, export/import copies or delete them. Enter a name and click **Save current design** to keep a new snapshot. Each saved copy includes the backsplash and yard-cabinet finishes. Saved copies remain unchanged as you continue editing the working design.

The selected saved-design name appears above the 3D view and in the desktop header, survives reload, and travels with exported design JSON.

## Publish later changes

Replace the website files with a newer ready-built version and commit them to `main`. GitHub Pages redeploys the branch. Keep the folder structure and root `index.html` intact. For editing source code and automatic builds, use `home-studio-source.zip` and its README instead.

## Selected Vincent dining set

The updated website includes the 150 cm Castlery Vincent walnut table (150 W × 80 D × 76 H cm) with four matching chairs and dark upholstered seats. Load the bundled Designer inspiration to apply it, or use **Furniture → Selected piece → your dining set → Replace with → Vincent dining set · 150 cm** to replace only the table. **View dining set** opens its close view. Existing saved copies are preserved; replacements are undoable and travel in design JSON. The chair dimensions and 1.60 × 1.90 m set footprint are approximate. The inspiration preview is included in the website.

## Selected living seating

The updated website also includes two Castlery Solange chairs (68 W × 77 D × 75 H cm, Chalk Bouclé/White Wash) and a HipVan Veronica Sand coffee table (70 cm diameter × 34 cm high). Load the updated Designer inspiration to apply the full proposal, or use **Living → Furniture → Apply table + two chairs** to change just the living seating. Existing product edits and personal saved copies are preserved; repeated application adds only missing chairs. **View living seating** returns to the arrangement. Each piece remains editable and is included in exported design JSON. Reference previews are bundled.

## Bedroom 2 office

Use **Bedroom 2 → Furniture → Arrange two-person office** to remove the bed and any old desk while keeping the built-in wardrobe in its existing position and finish, with its doors turned into the room. The arrangement adds two **122 × 76 cm Omnidesk Classic Wildwood Small** desks in **Pheasantwood with black frames**, facing opposite side walls. Each has a monitor, keyboard, mouse, cable tray and a separate movable chair. The desks are shown at 74 cm seated height; accessory details and grain are illustrative.

The complete Designer inspiration includes this office and opens its view. **View office** changes only the camera. Reapplying the arrangement restores desk/chair positions while retaining their finishes and avoiding duplicate additions; the cabinet stays in place. An earlier preview with a missing cabinet regains the reference wardrobe when explicitly applied. Existing browser designs and personal snapshots are not automatically migrated. Office changes can be undone and transferred in JSON; full original-design reset restores the bed. Product and inspiration links are available in the Furniture editor.

**Designer inspiration** is the renamed bundled Designer Kitchen proposal and includes all requested kitchen, yard, dining, living and office changes. Personal snapshots keep their names. Fixed white window ledges are included in Bedroom 2, the master bedroom and study, all 37.5 cm high and 30 cm deep. Their estimated lengths are 230, 240 and 110 cm respectively. They appear after refresh in existing designs without reloading the proposal; furniture positions and saved copies remain unchanged. Office arrangement keeps desks clear and faces the built-in doors into the room. Compact generic chairs are shown tucked. Refresh the app, then load **Saved designs → Designer inspiration → Load design** for the complete updated arrangement.
