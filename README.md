# Wildfire AI

A minimal Node.js + TypeScript scaffold to fetch NASA FIRMS active fire hotspots and print coordinates and confidence to the terminal.

## Prerequisites

- Node.js 18+ (uses built-in `fetch`)

## Getting Started

```bash
npm install
```

### Dev (watch mode)

```bash
npm run dev
```

### Build and Run

```bash
npm run build
npm start
```

## Configuration

- `FIRMS_CSV_URL` (optional): Override the default dataset (MODIS Global 24h). Example alternatives:
  - MODIS (24h): https://firms.modaps.eosdis.nasa.gov/data/active_fire/c6.1/csv/MODIS_C6_1_Global_24h.csv
  - VIIRS (24h, NOAA-20 + NPP):
    - https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs/c2/csv/VNP14IMGTDL_NRT_Global_24h.csv
    - https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs-snpp/c2/csv/SUOMI_VIIRS_C2_Global_24h.csv

- `LOG_LEVEL`: one of `debug`, `info`, `warn`, `error` (default `info`).

## Notes

- CSV parsing here is lightweight and assumes no embedded commas inside fields; this is fine for current FIRMS CSVs with numeric and simple text columns. If you encounter malformed rows, consider swapping in a robust CSV parser like `csv-parse`.
- This project uses ESM (`"type": "module"`) and TS config `moduleResolution: NodeNext`.
