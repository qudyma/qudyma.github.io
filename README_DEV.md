# QUDYMA Website - Development Guide

## 📁 Project Structure

```
qudyma.github.io/
├── src/                          # Source files (edit these!)
│   ├── components/               # Reusable HTML components
│   │   ├── header.html          # Site header  
│   │   ├── menu.html            # Navigation menu
│   │   ├── footer.html          # Site footer
│   │   └── publications-styles.html  # Publications page styles
│   │
│   ├── pages/                    # Page content (without layout)
│   │   ├── index.html
│   │   ├── members.html
│   │   ├── research.html
│   │   ├── software.html
│   │   ├── publications.html
│   │   ├── opportunities.html
│   │   └── contacts.html
│   │
│   ├── js/                       # Modular JavaScript
│   │   ├── publications/         # Publications page modules
│   │   │   ├── state.js         # ✅ Centralized state management
│   │   │   ├── utils.js         # ✅ Utility functions
│   │   │   ├── data-loader.js   # ✅ API calls & data processing
│   │   │   ├── filters.js       # ✅ Filtering & search logic
│   │   │   ├── display.js       # ✅ HTML rendering
│   │   │   ├── export.js        # ✅ JSON/BibTeX downloads
│   │   │   └── main.js          # ✅ Entry point & initialization
│   │   └── utils/
│   │       └── helpers.js       # (Future expansion)
│   │
│   └── template.html             # Base HTML template
│
├── assets/                       # Static assets
│   ├── css/
│   ├── js/
│   │   └── publications-bundle.js  # ✅ Bundled JS (35.5kb, auto-generated)
│   └── images/
│
├── *.html                        # Built pages (DO NOT EDIT!)
├── build.js                      # Build script
└── package.json                  # NPM scripts
```

## 🚀 Quick Start

### Development Workflow

In **Terminal 1** - Run the local server:
```bash
npm run dev
# This builds the site and starts a local server at http://localhost:8000
```

In **Terminal 2** - Watch for changes:
```bash
npm run watch
# This automatically rebuilds when you edit files in src/
```

Now open your browser to `http://localhost:8000` and you'll see live updates!

### Alternative: One-time build
```bash
# Build once without server
npm run build

# Just serve without watching
npm run serve
```

## 📝 Editing Guide

### To Update a Page:
1. Edit `src/pages/[pagename].html`
2. Run `npm run build`
3. Root `[pagename].html` regenerates

### To Update Header/Menu/Footer:
1. Edit `src/components/header.html`, `menu.html`, or `footer.html`
2. Run `npm run build`
3. **All pages** update automatically

## ✅ What's Been Refactored

| Before | After | Benefit |
|--------|-------|---------|
| Header/menu/footer in 7 files | Single source in `src/components/` | Change once, update all pages |
| ~350 lines duplicated | 0 duplication | DRY principle |
| Manual edits to all pages | Edit one component | Faster updates |

## 🔨 Build Process

```
template.html + header.html + menu.html + page.html + footer.html
    ↓
[page].html (in root)
```

The build script does simple placeholder replacement - no complex tooling.

## ✅ JavaScript Architecture (Refactored!)

The publications page has been **completely refactored** from a 1,244-line monolithic file into a modern modular architecture:

### Module Structure
- **`state.js`** (75 lines) - Centralized state management with getter/setter API
- **`utils.js`** (200+ lines) - Reusable utility functions (text processing, formatting, LaTeX conversion)
- **`data-loader.js`** (180+ lines) - API calls with smart caching (6h for authors, 1h for publications)
- **`filters.js`** (290+ lines) - Search, author filters, year range, view switching
- **`display.js`** (280+ lines) - HTML rendering with proper grouping and formatting
- **`export.js`** (230+ lines) - JSON and BibTeX download functionality
- **`main.js`** (65 lines) - Application initialization and event wiring

### Build System
- **esbuild** - Modern JavaScript bundler
- **Bundle size**: 35.5kb
- **Build time**: <10ms
- **Format**: IIFE (browser-compatible, no module loader needed)

### Build Commands
```bash
npm run build:js      # Bundle ES6 modules → publications-bundle.js
npm run build:html    # Generate HTML from templates
npm run build         # Run both (js + html)
npm run dev           # Build + serve + watch for changes
```

### Benefits
✅ **Maintainable**: Clear separation of concerns  
✅ **Testable**: Isolated modules  
✅ **Fast**: Optimized bundling (<10ms)  
✅ **Modern**: ES6 modules + build tooling  
✅ **DRY**: Shared utilities across modules

## 📦 Dependencies

```json
{
  "devDependencies": {
    "esbuild": "^0.25.12",  // JavaScript bundler
    "nodemon": "^3.0.1"     // File watcher for auto-rebuild
  }
}
```

Modern build tooling for a professional development experience!

## 🎯 Benefits

✅ **DRY**: Header/footer defined once  
✅ **Maintainable**: Clear structure  
✅ **Simple**: No complex tooling  
✅ **Git-friendly**: Clean diffs  
✅ **Extensible**: Easy to add pages  

## 🚦 Deployment

1. Edit `src/`
2. `npm run build`
3. Commit & push
4. GitHub Pages auto-deploys

## 📚 Adding a New Page

```bash
# 1. Create content
echo '<section>Content</section>' > src/pages/newpage.html

# 2. Add to build.js
# Add 'newpage' to pages array in build.js

# 3. Build
npm run build
```

Done! `newpage.html` created.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check HTML syntax in `src/` files |
| Page broken | Verify placeholder names: `{{HEADER}}`, `{{MENU}}`, etc. |
| Changes not showing | Run `npm run build` and clear browser cache |

---

**This refactoring maintains all functionality while making the codebase much cleaner and more maintainable.**
