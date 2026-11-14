
<div align="center">

# EarthTrend NASA

### Exploring Earth's Climate Through Data and Interactive Visualization

**An interactive climate exploration platform powered by Earth science data.**

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![NASA](https://img.shields.io/badge/Data-NASA_POWER-0B3D91)](https://power.larc.nasa.gov/)
[![NOAA](https://img.shields.io/badge/Data-NOAA-0077BE)](https://www.noaa.gov/)

**[Live Demo](https://earth-trend-nasa.vercel.app/)** · **[API Documentation](https://earthtrend-nasa-api.onrender.com/docs)** · **[GitHub Repository](https://github.com/Ezequie1Sc/EarthTrend-NASA)**

</div>

---

## Overview

**EarthTrend NASA** is an interactive web application designed to make climate and Earth observation data more accessible through modern visualization technologies.

The platform combines a three-dimensional Earth model, global thermal data visualization, interactive climate charts, and climate trend analysis.

By integrating data from **NASA POWER** and **NOAA**, EarthTrend NASA allows users to explore environmental information through an intuitive web interface.

The project is built with Angular 22, TypeScript, Three.js, Python, and FastAPI, following a modular frontend-backend architecture.

## Application Screenshots

### 01 — Interactive 3D Earth

Explore Earth through an interactive three-dimensional globe with global thermal visualization.

The globe combines geographic visualization with temperature data to help users understand how thermal conditions vary across the planet.

![EarthTrend NASA - Interactive 3D Globe](frontend/public/prueba/global.png)

### 02 — Climate Charts and Trend Analysis

Explore climate information through interactive charts, location-based data, and visual representations of environmental trends.

The dashboard provides a structured interface for understanding climate measurements and exploring changes over time.

![EarthTrend NASA - Climate Charts](frontend/public/prueba/chart.png)

### 03 — Climate Data and Application Overview

Explore climate indicators, environmental information, and the final section of the EarthTrend NASA interface.

![EarthTrend NASA - Climate Data and Footer](frontend/public/prueba/fin.png)

---

## The Problem

Climate data is essential for understanding environmental conditions and long-term changes across our planet.

However, scientific datasets are often presented through technical platforms, complex tables, or formats that can be difficult for non-specialist users to interpret.

This creates barriers for students, developers, and people interested in exploring Earth science information.

## Our Solution

EarthTrend NASA provides a visual approach to exploring climate information.

Instead of relying exclusively on raw datasets, the platform transforms environmental measurements into interactive visualizations.

Users can explore a 3D globe, examine thermal distributions, interact with climate charts, and access information from established scientific data providers.

The goal is to make Earth science data easier to explore, interpret, and understand.

---

## Key Features

### Interactive 3D Globe

- Three-dimensional Earth visualization powered by Three.js.
- Interactive globe controls.
- Global temperature overlays.
- Geographic visualization.
- Date-based thermal data exploration.
- Responsive user interface.

### Global Thermal Visualization

- Integration with NOAA thermal datasets.
- Global temperature grid retrieval.
- Thermal raster processing.
- Temperature-to-color visualization.
- Texture generation for Three.js.
- Web Worker processing to reduce main-thread workload.

### Climate Dashboard

- Interactive climate charts.
- Location selection.
- Climate indicators.
- Climate trend summaries.
- Integration with NASA POWER data.

### Climate Data Analysis

- Climate data retrieval through FastAPI.
- Backend services for trend analysis.
- Structured API responses.
- Separation between data processing and presentation.

### Modern Web Architecture

- Angular standalone architecture.
- Modular components and feature-based organization.
- TypeScript models and services.
- REST API communication.
- Python backend services.
- Independent frontend and backend deployments.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Angular 22, TypeScript |
| Styling | Tailwind CSS |
| 3D Visualization | Three.js |
| Climate Visualization | Interactive charts |
| Background Processing | Web Workers |
| Backend | Python, FastAPI |
| HTTP Communication | Angular HttpClient, HTTPX |
| Data Processing | Python, TypeScript |
| Climate Data Sources | NASA POWER, NOAA |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

---

## System Architecture

EarthTrend NASA uses a modular client-server architecture that separates climate data acquisition, processing, API delivery, and visualization.

```text
                  EARTH SCIENCE DATA
                 ┌─────────────────┐
                 │   NASA POWER    │
                 │      NOAA       │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  FASTAPI API    │
                 │                 │
                 │ Climate Routes  │
                 │ Thermal Routes  │
                 │ Analysis Routes │
                 │ Health Routes   │
                 └────────┬────────┘
                          │
                     REST / JSON
                          │
                          ▼
                 ┌─────────────────┐
                 │  ANGULAR 22     │
                 │                 │
                 │ Core Services   │
                 │ Data Models     │
                 │ Feature Modules │
                 └────────┬────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
     ┌─────────────────┐     ┌─────────────────┐
     │  EARTH EXPLORER │     │    DASHBOARD    │
     │                 │     │                 │
     │ Three.js Globe  │     │ Climate Charts  │
     │ Thermal Layers  │     │ Location Data   │
     │ Web Workers     │     │ Trend Summaries │
     └─────────────────┘     └─────────────────┘
```

### Thermal Visualization Pipeline

The thermal visualization system processes geographic temperature data and transforms it into a texture suitable for rendering on the 3D globe.

```text
NOAA Thermal Data
       |
       v
FastAPI Thermal Endpoint
       |
       v
Temperature Grid (JSON)
       |
       v
Angular TemperatureGridService
       |
       v
Web Worker
       |
       v
Thermal Raster Processing
       |
       v
RGBA Pixel Buffer
       |
       v
Three.js DataTexture
       |
       v
3D Earth Thermal Overlay
```

This architecture separates network communication, data processing, and 3D rendering.

---

## Project Structure

```text
EarthTrend-NASA/
│
├── frontend/
│   ├── public/
│   │   ├── logo/
│   │   └── prueba/
│   │       ├── global.png
│   │       ├── chart.png
│   │       └── fin.png
│   │
│   └── src/
│       └── app/
│           ├── app.config.ts
│           ├── app.routes.ts
│           ├── app.ts
│           │
│           ├── core/
│           │   ├── models/
│           │   │   ├── climate.model.ts
│           │   │   └── thermal.model.ts
│           │   │
│           │   └── services/
│           │       ├── api-url.ts
│           │       ├── climate-api.service.ts
│           │       └── temperature-grid.service.ts
│           │
│           └── features/
│               ├── dashboard/
│               │   ├── components/
│               │   │   ├── climate-chart/
│               │   │   ├── location-selector/
│               │   │   └── trend-summary/
│               │   │
│               │   └── pages/
│               │       └── dashboard/
│               │
│               └── earth-explorer/
│                   ├── components/
│                   │   ├── earth-globe/
│                   │   │   ├── earth-globe.ts
│                   │   │   ├── earth-globe.html
│                   │   │   ├── geography.ts
│                   │   │   ├── temperature-texture.ts
│                   │   │   ├── thermal-raster.ts
│                   │   │   └── thermal.worker.ts
│                   │   │
│                   │   └── thermal-controls/
│                   │
│                   └── pages/
│                       └── earth-explorer/
│
├── backend/
│   └── app/
│       ├── main.py
│       │
│       ├── api/
│       │   └── routes/
│       │       ├── analysis.py
│       │       ├── climate.py
│       │       ├── health.py
│       │       └── thermal.py
│       │
│       ├── core/
│       │   └── config.py
│       │
│       ├── schemas/
│       │   ├── analysis.py
│       │   ├── climate.py
│       │   └── thermal.py
│       │
│       └── services/
│           ├── nasa_power_service.py
│           ├── thermal_processing.py
│           ├── thermal_service.py
│           └── trend_analysis_service.py
│
└── README.md
```

---

## Getting Started

### Prerequisites

Before running the project locally, make sure you have:

- Node.js
- pnpm
- Python
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ezequie1Sc/EarthTrend-NASA.git
cd EarthTrend-NASA
```

### 2. Frontend Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
pnpm install
```

Start the Angular development server:

```bash
pnpm start
```

Open the application at:

http://localhost:4200

### 3. Backend Installation

Open another terminal from the project root.

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

### Local API Configuration

The frontend is currently configured to communicate with the deployed Render API.

The API configuration is located in:

```text
frontend/src/app/core/services/api-url.ts
```

To connect the frontend to a local backend, change the API base URL to:

```typescript
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
```

Restore the production URL before deploying the frontend:

```typescript
const API_BASE_URL =
  'https://earthtrend-nasa-api.onrender.com/api/v1';
```

---

## API Documentation

EarthTrend NASA provides REST endpoints through FastAPI.

The API is divided into four main route groups.

| Route Group | Description |
|---|---|
| Health | API availability and health checks |
| Climate | Climate data retrieval |
| Thermal | Global thermal data and temperature grids |
| Analysis | Climate trend analysis |

### Thermal Sources

```http
GET /api/v1/thermal/sources
```

Returns information about available thermal data sources.

### Global Temperature Grid

```http
GET /api/v1/thermal/grid?date=2024-06-15&provider=noaa
```

Retrieves a global temperature grid for the specified date and provider.

### API Root

```http
GET /
```

Returns basic API information and service status.

### Interactive Documentation

Complete endpoint details, parameters, and response schemas are available through Swagger UI:

https://earthtrend-nasa-api.onrender.com/docs

---

## Scientific Data Sources

### NASA POWER

**NASA Prediction Of Worldwide Energy Resources (POWER)** provides meteorological and solar radiation data for scientific, environmental, and energy-related applications.

EarthTrend NASA uses NASA POWER as a source of climate information for its dashboard and analysis capabilities.

Official website:

https://power.larc.nasa.gov/

### NOAA

The **National Oceanic and Atmospheric Administration (NOAA)** provides weather, oceanic, atmospheric, and climate information.

EarthTrend NASA integrates NOAA-based thermal data into its global temperature visualization functionality.

Official website:

https://www.noaa.gov/

### Data Interpretation

EarthTrend NASA is intended for interactive exploration and educational visualization.

Data availability, temporal coverage, geographic resolution, and measurement characteristics depend on the underlying scientific sources.

Visualizations should not be interpreted as real-time measurements unless the corresponding dataset explicitly supports that interpretation.

---

## Deployment

EarthTrend NASA is deployed using separate hosting platforms for its frontend and backend.

### Frontend — Vercel

The Angular application is deployed on Vercel.

**Production URL:**

https://earth-trend-nasa.vercel.app/

### Backend — Render

The FastAPI application is deployed on Render.

**API URL:**

https://earthtrend-nasa-api.onrender.com/

**API Documentation:**

https://earthtrend-nasa-api.onrender.com/docs

### Frontend-Backend Communication

The Angular application communicates with FastAPI using HTTPS requests.

The backend uses CORS configuration to allow authorized frontend origins, including the production deployment and project-specific Vercel preview environments.

---

## Testing

The frontend includes test files for application and thermal visualization functionality.

Examples include:

```text
frontend/src/app/app.spec.ts
frontend/src/app/features/earth-explorer/components/earth-globe/earth-globe.spec.ts
frontend/src/app/features/earth-explorer/components/earth-globe/thermal-raster.spec.ts
```

These tests support verification of application behavior and thermal processing logic.

---

## Future Improvements

Potential areas for future development include:

- Additional Earth observation datasets.
- More climate indicators.
- Extended historical comparisons.
- Additional geographic exploration tools.
- Improved mobile visualization controls.
- Exportable climate analysis reports.
- Expanded automated testing.

These are potential enhancements and are not presented as completed functionality.

---

## Project Goals

EarthTrend NASA was developed to explore how modern web technologies can make scientific information more approachable.

Its primary goals are to:

1. Make climate data easier to explore.
2. Present environmental information through interactive visualizations.
3. Integrate recognized Earth science data sources.
4. Demonstrate a modular full-stack architecture.
5. Encourage curiosity about Earth observation and climate science.

---

## Developer

**Ezequiel Salazar**

Computer Systems Engineering Student  
Full-Stack Developer

**GitHub:** https://github.com/Ezequie1Sc

---

## Acknowledgments

This project uses technologies and scientific data resources provided by:

- [NASA POWER](https://power.larc.nasa.gov/)
- [NOAA](https://www.noaa.gov/)
- [Angular](https://angular.dev/)
- [Three.js](https://threejs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Vercel](https://vercel.com/)
- [Render](https://render.com/)

EarthTrend NASA is an independent educational software project and is not an official NASA or NOAA application.

---

<div align="center">

### EarthTrend NASA

**Exploring our planet through data.**

[Explore the Application](https://earth-trend-nasa.vercel.app/) · [View API Documentation](https://earthtrend-nasa-api.onrender.com/docs)

</div>
