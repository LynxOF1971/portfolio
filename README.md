# Shahriar Fardin — Portfolio

A responsive, accessible portfolio adapted from Shahriar Fardin’s original Figma design. Built with semantic HTML, CSS, and vanilla JavaScript. No framework, package installation, API keys, or paid hosting required.

**Live website:** https://lynxof1971.github.io/portfolio/

## Run locally

From this directory:

```sh
python3 -m http.server 4173
```

Open http://localhost:4173.

## Update the website

- `index.html`: biography, skills, project cards, project detail templates, experience, milestones, and contact links.
- `styles.css`: design tokens, layout, and desktop / tablet / mobile styles.
- `script.js`: navigation, rotating title, galleries, project dialogs, and email copying.
- `resume.pdf`: latest résumé supplied by Shahriar Fardin.
- `assets/`: locally stored Figma images and icons, plus font files. No temporary Figma asset URLs are used.

Each project card’s `data-project` value matches a `<template>` ID at the bottom of `index.html`. Edit the card and its matching template together. Video URLs are in these templates. Add new artwork to `assets/` and use relative paths so deployment works at either a domain root or a repository subpath.

## GitHub Pages

In repository **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/ (root)**. Save. Commits to main will publish automatically. `.nojekyll` lets GitHub serve these files directly.

## Content notes

The biography, social profiles, résumé URL, project names, artwork, and experience were sourced from the supplied Figma file. Placeholder phone numbers and repeated placeholder dates were removed. Roles with outdated “Present” labels are described without asserting current employment. The unfinished achievements page is completed with project milestones already supported by the portfolio; no awards or rankings were invented.

Email links open the visitor’s email app. There is no server-side contact form. The résumé opens the latest supplied PDF, hosted directly at `resume.pdf`. Social and video destinations may require login to their respective services.

## Design source

https://www.figma.com/design/tRS6LZrC03pJCz2kjqs32X/Shahriar-Fardin-Portfolio?node-id=0-1

Portfolio artwork, photographs, and branding belong to their respective owners. No license to reuse them is implied. Font license texts are in `assets/`.
