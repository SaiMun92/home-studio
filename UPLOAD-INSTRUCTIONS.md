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

Open **Saved designs** and choose **Designer inspiration**. The proposal is included with both ZIPs and is available on the new device without importing personal saves. **Load design** keeps the modeled sink/appliance sizes and moves the sink beside the dishwasher for about 500 mm of clear worktop before the stove, applies the proposal's finishes, turns on task lighting, gives all three yard cabinets matching dimensions and Cinnamon Poplar finishes, sets the title, replaces the existing dining set in place with the 150 cm Castlery Vincent, adds the Veronica Sand coffee table and two Chalk Bouclé/White Wash Solange chairs, replaces the living sofa with an L shape whose chaise is at the balcony end, replaces the upper above the dishwasher at the living-room end with three open ivory ledges, opens the shorter end-upper doors beside the fridge, and arranges Bedroom 2 as a two-person office while retaining its built-in wardrobe. Loading opens the robot vacuum in the lower DB cabinet; Styler, office, living seating, dining and yard are fallbacks. The sofa color/ID, TV console, unrelated furniture, room finishes, cabinet depth and worktop height are preserved. Existing L-sofa edits survive reapplication; nearby living chairs, the plant or the coffee table may move to fit the new L. **Save a copy** keeps a snapshot without changing the active design; **Export** downloads its design JSON.

The design pairs Cinnamon Poplar lower cabinets and all three yard cabinets, warm off-white kitchen uppers, Calacatta Potoro Extra countertop and an ivory backsplash. From living toward yard, its six editable bays contain drinks drawers (0.6 m), dishwasher (0.6 m), sink cabinet with waste assignment (0.7 m), prep drawers (0.4 m), hob/oven (0.6 m) and appliance bay (0.6 m). The 0.4 m fitted rear cabinet and 0.1 m floor-edge extension complete the 4.0 m physical run. The original modeled sink/appliance sizes remain, with about 500 mm clear worktop between stove and sink. The 0.4 m prep-drawer bay is part of the latest request to bring the sink closer to the dishwasher. Storage notes describe intended use. The living-end upper above the dishwasher has three open ledges, the final upper beside the fridge has opening doors, and the remaining kitchen fronts stay closed. Site measurements and appliance clearances remain unverified.

The proposal also gives the DB-box cupboard, open appliance cabinet and fridge surround matching **740 mm widths**, **2640 mm heights**, and aligned fronts and tops. The DB cupboard is **360 mm deep** to fit against its wall; the appliance cabinet and fridge surround remain **740 mm deep**. All three use Cinnamon Poplar, including the DB doors, shelves and overhead cupboard doors; kitchen uppers stay ivory. The surround frames the space-grey Panasonic NR-F603GT-SS fridge, and a black LG FV1413H2BA washer/dryer sits beneath two open appliance platforms. An air fryer, multicooker and blender are visible on the shelves; they are schematic, and the platforms are shown retracted. Fridge dimensions are 685 W × 1828 H × 745 D mm; the 13/8 kg washer/dryer is 600 W × 850 H × 615 D mm. Cabinet installation allowances require checking. The shallower DB cupboard keeps its front flush with the other cabinets while its back meets the unchanged wall. Selected appliance positions and the kitchen working layout are retained. Refresh to update an existing matched design; no saved-state migration or proposal reload is needed. Load **Saved designs → Designer inspiration → Load design** to apply the complete proposal to a different layout. Reference/nonmatched cabinetry retains its existing dimensions and position.

**The wall behind the DB cupboard remains in place:** it extends to the DB cabinet edge at an estimated **760 W × 440 D × 2700 H mm**, closing the rear gap and matching the fridge-side projection in depth and height. Both remain full-height in Dollhouse view. The Designer inspiration DB cupboard is shallower so all three cabinet fronts align. Refresh applies this correction to existing matched designs without rewriting saved data.

Use **Kitchen → Fridge & appliance storage → View fridge & appliance cabinet** for the front view and independent carpentry/laundry controls; they also appear under **Yard → Walls**. Inspiration crops are bundled with the website. Removing the surround retains the selected fridge. Yard settings and product choices survive saves, JSON transfer and color reset; color reset clears the shared cabinet texture while retaining its dimensions. Full reset restores the original reference cabinetry and appliances.

After updating the website, choose **Load design** on this bundled proposal again to get the revised arrangement. Existing working designs and personal saved snapshots are not automatically migrated.

The sink and centered tap move 200 mm toward the dishwasher, keeping their original size. The former 1100 mm sink bay is split into a 700 mm sink cabinet and 400 mm prep drawers. Clear stove-to-sink worktop is now 498.5 mm; the dishwasher, stove, oven and hood remain in their previous proposal positions. To apply only this change to an older wide-sink proposal, refresh and choose **Kitchen → More preparation space → Move sink next to dishwasher**. This preserves other edits and can be undone. Existing working designs and saved copies are not automatically migrated.

The tap is now centered on the sink. Refreshing shows this correction in existing designs without changing basin dimensions or saved data.

The upper above the dishwasher at the living-room end has **three open ivory ledges**, inside a **600 W × 340 D × 750 H mm** unit with a matching **18 mm outer side panel**. Each ledge is **582 mm wide**, fitted against that panel. It has no doors or handles; the shelves follow the upper-cabinet finish and retain the wall-side task light. After refreshing, use **Kitchen → Upper cabinet at the living-room end → Three open ledges** to update just this unit in an existing design. Switching it off restores the closed upper. **View upper shelves** opens its detail view without changing saved data. The setting survives saves, JSON and Undo/Redo. Existing designs retain their current setting until explicitly changed; loading Designer inspiration enables the ledges. Refresh adds the outer side panel to designs that already have the ledges enabled without reloading the proposal.

The end upper beside the fridge has two 258 mm doors shown open 90°, aligning their free edges with the short tiled wall. Its 615 mm upper-only division leaves lower modules and appliance positions intact. Use **Kitchen → Upper cabinet beside the fridge → End-cabinet doors** to select original closed, shorter closed or shorter open doors, and **View door clearance** for the detail view. Choices are saved and undoable; viewing alone is transient. Older saved designs retain their original fronts until explicitly changed. The cupboard shelf is visible; other working-cabinet interiors remain storage notes. Wall and hinge dimensions are model estimates.

Upper-cabinet strips sit along the back edge near the kitchen wall; the hood retains its own lamps. This light placement appears on refresh without reloading the proposal. Open **Kitchen → Lighting → Preview lighting**, above **Materials**, for an eye-level kitchen view in a temporary evening environment. Toggle **Warm task lighting** to compare the illumination on the worktop and backsplash. **Return to daylight** exits the preview. Previewing does not change the saved design; the light on/off setting persists with the design and can be undone.

## Colors and saved copies

- Open the **Kitchen** tab, scroll to **Materials**, and choose a **Cabinet laminate** and **Countertop** from the dropdowns. Each selection immediately updates its sample preview, product name, code and reference-photo link. **Apply to kitchen** shows the chosen materials in 3D on your current layout while preserving the backsplash color. The laminate applies to both upper and lower cabinets. **Save a copy** keeps a snapshot in **Saved designs → Your saved copies** using the selected pair and current geometry without changing the active design. Browsing the dropdowns alone leaves your design unchanged. The materials and previews come with the website on every device.
- Kitchen upper-cabinet colors remain independent of the matched yard row. In legacy layouts, they also recolor the fridge overhead doors.
- Use **Reset original colors** at the bottom of the editor to restore the original palette while retaining your layout and carpentry edits.
- In the **Kitchen** editor, use **Backsplash panel** swatches or **Custom backsplash color**. **Restore original copper** resets just the panel; **Reset original colors** also restores its copper finish. The backsplash color is included in saved copies and JSON transfers.
- Select **Yard → Walls → Yard cabinet color** to recolor all three cabinets in the matched Designer inspiration layout. A swatch, custom color or **Restore original orange** removes their wood texture; Undo restores the previous finish. Legacy layouts retain the independent DB-box cabinet picker.
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

The complete Designer inspiration includes this office and opens the robot vacuum in the lower DB cabinet. **View office** changes only the camera. Reapplying the arrangement restores desk/chair positions while retaining their finishes and avoiding duplicate additions; the cabinet stays in place. An earlier preview with a missing cabinet regains the reference wardrobe when explicitly applied. Existing browser designs and personal snapshots are not automatically migrated. Office changes can be undone and transferred in JSON; full original-design reset restores the bed. Product and inspiration links are available in the Furniture editor.

**Designer inspiration** is the renamed bundled Designer Kitchen proposal and includes all requested kitchen, yard, dining, living and office changes. Personal snapshots keep their names. Fixed white window ledges are included in Bedroom 2, the master bedroom and study, all 37.5 cm high and 30 cm deep. Their estimated lengths are 230, 240 and 110 cm respectively. They appear after refresh in existing designs without reloading the proposal; furniture positions and saved copies remain unchanged. Office arrangement keeps desks clear and faces the built-in doors into the room. Compact generic chairs are shown tucked. Refresh the app, then load **Saved designs → Designer inspiration → Load design** for the complete updated arrangement.

## LG Styler beside the master-bedroom wardrobe

The selected [LG Styler S3MFC](https://www.lg.com/sg/laundry/styler/s3mfc/) uses **Essence Mirrored Finish**, at LG's published **445 W × 585 D × 1850 H mm**. It stands beside the wardrobe, facing into the room. The homeowner approved moving the original bed **10 cm toward the window** on 20 November; the wardrobe stays in place. The model shows the closed mirror-style door, faint touch markings, silver surround and dark plinth. Mirror appearance and installation spacing are illustrative.

Refresh and use **Master bedroom → Furniture → LG Styler beside wardrobe → Add Styler beside wardrobe** to apply just this addition to an existing design. The bed adjustment and appliance addition form one undoable change. **View Styler and wardrobe** opens its close view without changing saved data. The appliance also supports normal add/replace, move, rotate, color, remove, saved copies and JSON controls.

The complete **Designer inspiration** proposal includes this placement and opens the robot vacuum in the lower DB cabinet, with Styler/office/living seating/dining/yard fallbacks. An existing Styler keeps its edits; the action does not duplicate it. Old working designs and personal copies remain unchanged until explicitly updated. Color reset retains the appliance and placement; full original-design reset removes it and restores the bed.



## L-shaped sofa with the chaise at the balcony end

The updated website includes a generic upholstered L sofa, estimated **240 × 155 cm overall and 88 cm high**. The confirmed arrangement puts the extended chaise at the balcony end, projecting toward the TV, while keeping the existing sofa color. The homeowner requested a slight reduction from the initial **260 × 170 cm** footprint. Existing L-sofa designs need only a **refresh** to show the smaller model, keeping their position, color and surrounding furniture; no proposal reload is needed. To replace a straight sofa, use **Living → Furniture → L-shaped sofa → Replace sofa with L shape** to apply only this arrangement. Keep **Chaise at the balcony end** selected; the other choice runs the main seating row along the balcony. The button becomes **Arrange L-shaped sofa** after replacement, and **View sofa and balcony** opens the render.

The isolated action preserves all existing pieces and leaves removed chairs absent. Nearby existing Solange chairs, the plant or the coffee table move only if needed to fit; the TV remains in place. A blocked layout leaves the design unchanged. The complete **Designer inspiration** proposal includes this sofa, the Veronica table and two Solange chairs, and opens the sofa view. Existing L-sofa edits are kept when that proposal is reapplied. Arrangement edits support Undo/Redo, saved copies and JSON; saved design data is not rewritten by the smaller model. Color reset retains the L shape; full original-design reset restores the straight sofa.

## Dreame X60 Ultra in the lower DB cabinet — 21 November 2026

The homeowner confirmed **X60 Ultra**, matching the supplied tall-dock photograph. Dreame Singapore's [X60 product page](https://dreame.sg/products/dreame-x60-ultra-master) lists the dock at **390 W × 423 D × 499 H mm**. The robot is **350 × 350 × 79.5 mm** with its sensor retracted, or **102.8 mm high** with the sensor raised. The separate X60 Master on that same page is a different, shorter dock; it is available as an optional editor choice but is not the selected proposal.

**Yard → Walls → Robot vacuum in DB cabinet → Open + Dreame X60 Ultra** removes the two lower doors and opens the lower carcass to floor level, including removal of its base threshold. The upper doors, 18 mm supporting side panels, shelf above the opening, cabinet alignment and backing wall remain. **View robot vacuum** opens the detail view. Choosing **Closed lower cabinet** restores the closed lower section. Changes are undoable and persist through reload, saved copies and JSON. Existing designs are not automatically migrated; the isolated control updates only this choice. The complete Designer inspiration now includes the Ultra and opens its detail view, with the earlier sofa and other product views as fallbacks.

The matched DB cabinet remains **740 W × 360 D × 2640 H mm**. A 423 mm dock cannot fit completely within that depth. With an illustrative 20 mm rear service gap, its published envelope extends **83 mm** beyond the fixed cabinet front; the separately modeled 120 mm entry ramp brings total projection to approximately **203 mm**. Dreame's specification card does not state whether its depth includes the detachable ramp, so this added ramp allowance is explicitly an estimate. Internal dock proportions, connections, maintenance access and installation clearances require site/product checking. The robot and dock are rendered at published size, without moving or cutting the backing wall.
