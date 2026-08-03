const { Jimp } = require('jimp');

async function doCrop() {
  const image = await Jimp.read('./src/assets/logo.png');
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  let minX = w, maxX = 0, minY = h, maxY = 0;
  
  // Find overall bounds
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (w * y + x) << 2; // RGBA
      const alpha = image.bitmap.data[idx + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Find the gap (a vertical column with very low alpha)
  let gapX = minX;
  for (let x = minX + 50; x < maxX; x++) {
    let colAlphaSum = 0;
    for (let y = minY; y <= maxY; y++) {
      const idx = (w * y + x) << 2;
      colAlphaSum += image.bitmap.data[idx + 3];
    }
    // If the column is mostly transparent (average alpha < 5)
    if (colAlphaSum / (maxY - minY + 1) < 5) {
      gapX = x;
      break; // Found the gap!
    }
  }
  
  const logoHeight = maxY - minY + 1;
  const logoWidth = gapX - minX;
  
  console.log(`Bounds: minX=${minX}, gapX=${gapX}, minY=${minY}, maxY=${maxY}`);
  
  image.crop({ x: minX, y: minY, w: logoWidth, h: logoHeight });
  await image.write('./public/favicon.png');
  console.log('Successfully cropped the true square favicon using gap detection!');
}

doCrop();
