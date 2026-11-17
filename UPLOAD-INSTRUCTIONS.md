# Upload the ready-built Home Studio website

Use `home-studio-pages.zip` to publish from another device without installing Node.js or running a build. The ZIP already contains the website and its local Three.js runtime. Nothing is uploaded automatically.

## Extract the website

1. Copy `home-studio-pages.zip` to the other device and extract it.
2. Open the extracted folder containing `index.html`. It also contains `src/`, `vendor/`, `references/`, `.nojekyll`, and `UPLOAD-INSTRUCTIONS.md`.
3. Upload these contents directly to the repository root. Do not upload the ZIP itself or put the enclosing extraction folder inside the repository. `index.html` must be at the repository root. Preserve `.nojekyll`; enable hidden-file display in your file manager if needed.

The archive includes the home model, reference photo previews, floorplan, and extracted video stills. These will be publicly accessible on a public repository and Pages site. Original photos from the workspace root and original MOV videos are excluded.

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
2. Drag the extracted contents, including the `src`, `vendor`, and `references` folders, into the upload area. Preserve their folder structure. Include `index.html` and `.nojekyll` at the root.
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

## Publish later changes

Replace the website files with a newer ready-built version and commit them to `main`. GitHub Pages redeploys the branch. Keep the folder structure and root `index.html` intact. For editing source code and automatic builds, use `home-studio-source.zip` and its README instead.
