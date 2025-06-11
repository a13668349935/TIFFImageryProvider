const { fromFile } = require('geotiff');
const fs = require('fs');

async function testTiff() {
  const filePath = './problematic.tif';
  try {
    console.log('Opening TIFF file with geotiff.js...');
    const tiff = await fromFile(filePath);
    const image = await tiff.getImage();

    const photoMet = image.fileDirectory.PhotometricInterpretation;
    console.log(`PhotometricInterpretation: ${photoMet}`);

    console.log('Attempting image.readRGB()...');
    try {
      const rgbData = await image.readRGB();
      console.log('image.readRGB() succeeded.');
      console.log(`RGB data length: ${rgbData.length}, width: ${image.getWidth()}, height: ${image.getHeight()}`);
    } catch (e) {
      console.error('image.readRGB() failed:');
      console.error(e);

      console.log('\nAttempting image.readRasters()...');
      try {
        const rasterData = await image.readRasters();
        console.log('image.readRasters() succeeded.');
        console.log(`Raster data length: ${rasterData.length}, number of bands: ${rasterData.length}`);
        if (rasterData.length > 0) {
            console.log(`Type of first band: ${rasterData[0].constructor.name}, length: ${rasterData[0].length}`);
        }
      } catch (e2) {
        console.error('image.readRasters() failed:');
        console.error(e2);
      }
    }
  } catch (err) {
    console.error('Error processing TIFF file:');
    console.error(err);
  }
}

testTiff();
