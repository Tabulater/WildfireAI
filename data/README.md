# FireGuard AI - Data Directory

This directory contains wildfire datasets used for ML training and prediction.

## Data Files

### Small Files (Included in Git)
- `forestfires.csv` (25KB) - Historical forest fire data with weather indices
- `forestfiresagain.csv` (25KB) - Additional forest fire data

### Large Files (Excluded from Git)
The following large CSV files are excluded from Git due to size constraints:

- `fire_nrt_J1V-C2_565335.csv` (272MB) - Near Real-Time fire data from satellite J1V-C2
- `fire_nrt_M-C61_565334.csv` (60MB) - Near Real-Time fire data from satellite M-C61  
- `fire_nrt_SV-C2_565336.csv` (245MB) - Near Real-Time fire data from satellite SV-C2
- `wildfire.csv` (8.7MB) - Processed wildfire dataset

## Fallback Mechanism

When the large CSV files are not available (e.g., in development environments or when files are too large to commit), the application automatically falls back to generating synthetic data using the `FallbackDataService`.

### How It Works

1. **Data Loading**: The `DataProcessor` attempts to load all CSV files
2. **Graceful Degradation**: If any file fails to load, it logs a warning and continues
3. **Fallback Generation**: If no real data is available, synthetic data is generated
4. **ML Training**: The ML models train on either real or synthetic data seamlessly

### Synthetic Data Characteristics

The fallback service generates realistic wildfire data with:
- **Geographic Coverage**: California region (32°N to 42°N, 125°W to 114°W)
- **Sample Size**: 10,000 data points by default
- **Fire Rate**: 15% fire occurrence rate for realistic distribution
- **Weather Variables**: Temperature, humidity, wind, pressure, rainfall
- **Fire Indices**: FFMC, DMC, DC, ISI (Fire Weather Indices)
- **Temporal Data**: Seasonal patterns and date information

### Benefits

- **Development Friendly**: No need to download large files for development
- **Consistent Performance**: ML models always have data to train on
- **Realistic Patterns**: Synthetic data follows real wildfire patterns
- **Configurable**: Can adjust data parameters as needed

## Adding Large Data Files

If you have access to the large CSV files and want to use real data:

1. Place the files in this directory
2. The application will automatically detect and use them
3. The `.gitignore` will prevent them from being committed

## Data Sources

- **Forest Fires Dataset**: Portuguese forest fire data with weather indices
- **NRT Fire Data**: NASA FIRMS Near Real-Time fire detection data
- **Wildfire Dataset**: Processed wildfire data with environmental variables

## Usage

The data is automatically loaded by the ML training system. No manual intervention is required - the application will use the best available data source automatically.
