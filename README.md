# Job Tracker Frontend App

The React client application for the Job Application Tracker CMS. Designed with a premium **Cream & Chocolate editorial/magazine aesthetic** and fully optimized for mobile devices.

---

## 🎨 Theme & Typography
*   **Color Palette**:
    *   **Cream**: Warm, rich beige base background colors for a clean editorial look.
    *   **Chocolate**: High-contrast deep brown accents for premium headers, cards, and borders.
*   **Typography**:
    *   **Playfair Display**: Elegant serif font used for main title headings, summaries, and dashboard stats.
    *   **Inter**: Clean, legible sans-serif font for table rows, navigation items, and body descriptions.

---

## 📱 Mobile UX Optimizations
*   **Thumb-friendly Navigation**: Integrated slide-out navigation drawer toggled by a header hamburger menu on mobile screens.
*   **Pipeline Stage Selector**: Replaced horizontal scroll tabs with a clear, high-contrast dropdown selector showing total applications per stage.
*   **Quick Card Movements**: Added inline "Move Status" dropdown selectors to each Kanban card, allowing mobile users to change stages instantly without struggling with touch drag-and-drop.
*   **Application Details Panel**: Side-panel responsive slide-out to read logs, timeline events, and manage notes.

---

## 🛠️ Tech Stack & Routes
*   **Framework**: React & Vite
*   **Routing**: TanStack Router (type-safe routing structure)
*   **State & Sync**: TanStack Query (real-time query caching and mutations)
*   **Icons**: Lucide React
*   **Styling**: Vanilla CSS (Tailwind CSS utilized for flexible helper layout utilities)

---

## 🚀 Local Installation & Run

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
*The dev server will start (typically on `http://localhost:5173`). By default, it communicates with the API at `http://localhost:5000`.*

---

## 🐳 Docker Containerization
This frontend contains a multi-stage `Dockerfile` and a custom Nginx configuration (`nginx.conf`).
*   **Stage 1**: Compiles Vite static production assets.
*   **Stage 2**: Serves assets using `nginx:alpine` and proxies all `/api` requests to the `backend` container.
*   To test the containerized frontend locally:
    ```bash
    docker build -t job-tracker-frontend .
    docker run -p 80:80 job-tracker-frontend
    ```
