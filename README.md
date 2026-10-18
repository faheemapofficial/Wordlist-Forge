# Wordlist Forge

A browser-based wordlist builder for authorized security assessments, password-policy education, and personal labs. Built by **Muhammed Faheem A.P.**

Configure seed words, choose transformations, inspect candidates in a terminal-style workspace, and export a complete UTF-8 text file. All generation happens on your device.

## Features

- Responsive dark workspace with keyboard navigation and labeled controls.
- Twelve explicit rules: leetspeak, capitalization, reversal, year prefix/suffix, alias/secondary/lab pairs, combinations, separated pairs, and common affixes.
- Background Web Worker keeps generation off the UI thread; cancel an active job.
- Automatic deduplication, character-length filters, and deterministic sorting.
- Searchable preview of up to 200 matching words; copy and download always include the complete list.
- Actual measured engine time and UTF-8 export size, rather than fixed performance claims.
- No account, database, analytics, remote fonts, CDN assets, or runtime dependencies.
- Inputs and results live in tab memory only. Reloading clears them; downloads remain on your device.

## Run locally

Install Python 3, clone the project, and start a static server:

```bash
git clone https://github.com/faheemapofficial/Wordlist-Forge.git
cd Wordlist-Forge
python3 -m http.server 8080 --bind 127.0.0.1
```

On Windows, use `py -m http.server 8080 --bind 127.0.0.1` if `python3` is unavailable.

Open **http://127.0.0.1:8080**. Keep the terminal open. Stop the server with `Ctrl+C`.

Opening `index.html` directly with a `file://` URL is not supported because generation uses a Web Worker. Clipboard copying requires a secure context (HTTPS or localhost) and browser permission; downloading remains available if copying is blocked.

## Use the workspace

1. Click **Load sample** for fictional inputs, or enter your own lab seed words.
2. Select the transformation rules you need. With every rule off, only the seed values are returned.
3. Set minimum and maximum lengths and choose a sort order.
4. Click **Forge wordlist**, or press **Ctrl+Enter** / **⌘+Enter**.
5. Filter the preview, **Copy all**, or **Download .txt**.
6. **Reset** clears the inputs and results and restores the default rule selections.

Changing inputs marks existing results as stale until you generate again. Copying and downloading still use the previous completed output. Cancelling a new job also preserves the previous output.

## Rule behavior and limits

| Setting | Behavior |
| --- | --- |
| Primary / alias / secondary / lab | Up to 64 Unicode characters per field; trimmed at the edges |
| Year / number | 1–8 digits; used as a seed and by enabled year rules |
| Text transformations | Each selected transform is applied at most once in every ordering |
| Pair rules | Join the selected fields in both orders |
| All combinations | Join 2–4 distinct nonempty seed values in every ordering |
| Triple combinations | Join exactly 3 distinct seed values in every ordering |
| Separated pairs | Join ordered pairs with `_`, `-`, and `.` |
| Common affixes | Add the fixed prefix/suffix set documented in `assets/engine.js` |
| Length filter | 1–256 Unicode code points, applied after transformation |
| Result cap | 50,000 unique words; the UI reports if the cap is reached |
| Preview | Up to 200 matching words; full list retained for export |
| Output | UTF-8, one candidate per line, with a final newline |

Spaces inside a seed phrase are preserved. Line breaks and control characters are rejected. Exact-case duplicates are removed. Sorting is case-sensitive Unicode order; shortest-first uses that order to break ties. This release makes separator and affix rules explicit rather than applying them silently.

## GitHub Pages hosting

This is a static app; **GitHub Pages can host all functionality**. No backend or paid hosting service is required.

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main**, folder **/ (root)**, and save.
4. Wait for the Pages deployment, then open the site URL displayed by GitHub.
5. Enable **Enforce HTTPS** if it is available and not already enabled.

Changes pushed to `main` are deployed automatically. `.nojekyll` prevents Jekyll processing. Assets use relative URLs so the app works under a repository path or custom domain.

For a custom domain, add a domain you own in Pages settings and follow GitHub's displayed DNS instructions. No custom domain is required for the default free HTTPS address.

## Development and checks

No install or build step is necessary. Node.js 22 is used in CI:

```bash
node --check assets/app.js
node --check assets/worker.js
node --test tests/*.test.cjs
```

The tests cover transformation independence, permutations, deduplication, Unicode lengths, validation, sorting, and bounded output. GitHub Actions runs these checks on pushes and pull requests.

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible workspace and metadata |
| `assets/style.css` | Responsive visual system |
| `assets/app.js` | Interface, worker lifecycle, preview, copy, and export |
| `assets/engine.js` | Pure, tested generation engine |
| `assets/worker.js` | Background generation bridge |
| `assets/forge.svg` | Lightweight project icon |
| `tests/engine.test.cjs` | Node built-in test suite |
| `.github/workflows/checks.yml` | Automated verification |

## Privacy and scope

The app does not upload or persist your inputs. GitHub Pages still handles ordinary page requests and hosting logs. Browser extensions and exported files are outside the app's control.

Use only in environments you own or have permission to assess. This tool generates candidates; it does not connect to login forms, attempt authentication, or crack passwords. A generated list does not measure password strength or establish a vulnerability.
