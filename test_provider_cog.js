// const { fromFile } = require('geotiff'); // Changed to dynamic import
const path = require('path');

// Minimal mock for Cesium DeveloperError if needed by the constructor or early methods
global.DeveloperError = class extends Error { constructor(message) { super(message); this.name = "DeveloperError"; }};
global.defined = (value) => value !== undefined && value !== null;
global.Event = class { constructor() {} raiseEvent() {} addEventListener() {} removeEventListener() {} };
global.Credit = class { constructor() {} };
global.Rectangle = class { constructor() {} static fromDegrees() { return new global.Rectangle(); } };
global.WebMercatorTilingScheme = class { constructor() { this.rectangle = new global.Rectangle(); } }; // Simplified mock
global.GeographicTilingScheme = class { constructor() { this.rectangle = new global.Rectangle(); } }; // Simplified mock
global.Math = { ...Math, TWO_PI: 2 * Math.PI, toDegrees: (val) => val * 180 / Math.PI, toRadians: (val) => val * Math.PI / 180 }; // Cesium.Math mock
global.Cartesian2 = class { constructor() {} };

async function inspectCog(fromFile) {
  const filePath = path.join('example', 'public', 'cogtif.tif');
  console.log(`--- Inspecting: ${filePath} ---`);
  try {
    const tiff = await fromFile(filePath);
    const image = await tiff.getImage();
    const photoMet = image.fileDirectory.PhotometricInterpretation;
    console.log(`GeoTIFF.js direct inspection - PhotometricInterpretation: ${photoMet}`);

    console.log(`GeoTIFF.js direct inspection - SamplesPerPixel: ${image.fileDirectory.SamplesPerPixel}`);
    console.log(`GeoTIFF.js direct inspection - GDALNoData: ${image.getGDALNoData()}`);

  } catch (err) {
    console.error('Error inspecting COG file:', err);
  }
}

async function inspectViteCog(fromFile) {
  const filePath = path.join('vite-example', 'public', 'cogtif.tif');
  console.log(`--- Inspecting: ${filePath} ---`);
  try {
    const tiff = await fromFile(filePath);
    const image = await tiff.getImage();
    const photoMet = image.fileDirectory.PhotometricInterpretation;
    console.log(`GeoTIFF.js direct inspection - PhotometricInterpretation: ${photoMet}`);

    console.log(`GeoTIFF.js direct inspection - SamplesPerPixel: ${image.fileDirectory.SamplesPerPixel}`);
    console.log(`GeoTIFF.js direct inspection - GDALNoData: ${image.getGDALNoData()}`);

  } catch (err) {
    console.error('Error inspecting Vite COG file:', err);
  }
}

async function main() {
  try {
    const { fromFile } = await import('geotiff');
    await inspectCog(fromFile);
    await inspectViteCog(fromFile);
  } catch (importError) {
    console.error('Failed to import geotiff:', importError);
  }
}

main();
