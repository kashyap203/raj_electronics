import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Brand from '../models/Brand.js';

dotenv.config();

const svgs = {
  samsung: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><ellipse cx="150" cy="50" rx="135" ry="42" fill="#034EA2"/><text x="150" y="61" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">SAMSUNG</text></svg>`,
  lg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><g transform="translate(35, 10)"><circle cx="40" cy="40" r="36" fill="#A50034"/><circle cx="40" cy="40" r="26" fill="none" stroke="#FFFFFF" stroke-width="5"/><path fill="none" stroke="#FFFFFF" stroke-width="5" d="M 40 26 L 40 54 L 54 54"/><circle cx="28" cy="30" r="4" fill="#FFFFFF"/></g><text x="185" y="66" font-family="Arial, sans-serif" font-weight="900" font-size="56" fill="#A50034" letter-spacing="2">LG</text></svg>`,
  sony: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><text x="150" y="68" font-family="Georgia, serif" font-weight="900" font-size="56" fill="#000000" text-anchor="middle" letter-spacing="6">SONY</text></svg>`,
  whirlpool: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><ellipse cx="60" cy="50" rx="36" ry="18" fill="none" stroke="#ED1C24" stroke-width="5" transform="rotate(-20 60 50)"/><text x="175" y="62" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#002F6C" text-anchor="middle">Whirlpool</text></svg>`,
  panasonic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><text x="150" y="63" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="#004098" text-anchor="middle" letter-spacing="2">Panasonic</text></svg>`,
  voltas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><rect x="20" y="20" width="260" height="60" rx="12" fill="#E31E24"/><text x="150" y="62" font-family="Arial, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">VOLTAS</text></svg>`,
  haier: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><text x="150" y="66" font-family="Arial Black, sans-serif" font-weight="900" font-size="44" fill="#005A9C" text-anchor="middle" letter-spacing="3">Haier</text></svg>`,
  preethi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100" rx="16" fill="#FFFFFF"/><g transform="translate(20, 20)"><path fill="#E31B23" d="M30 5 L37 22 L55 22 L40 33 L45 50 L30 39 L15 50 L20 33 L5 22 L23 22 Z"/></g><text x="180" y="64" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="#E31B23" text-anchor="middle">Preethi</text></svg>`
};

const backendUploads = path.join(process.cwd(), 'uploads');
const frontendUploads = path.join(process.cwd(), '../frontend/public/uploads');

if (!fs.existsSync(backendUploads)) fs.mkdirSync(backendUploads, { recursive: true });
if (!fs.existsSync(frontendUploads)) fs.mkdirSync(frontendUploads, { recursive: true });

for (const [key, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(backendUploads, `brand-${key}.svg`), content);
  fs.writeFileSync(path.join(frontendUploads, `brand-${key}.svg`), content);
  console.log(`Created brand-${key}.svg`);
}

async function updateDB() {
  await connectDB();
  const brandMapping = {
    'Samsung': '/uploads/brand-samsung.svg',
    'LG': '/uploads/brand-lg.svg',
    'Sony': '/uploads/brand-sony.svg',
    'Whirlpool': '/uploads/brand-whirlpool.svg',
    'Panasonic': '/uploads/brand-panasonic.svg',
    'Voltas': '/uploads/brand-voltas.svg',
    'Haier': '/uploads/brand-haier.svg',
    'Preethi': '/uploads/brand-preethi.svg',
  };

  for (const [name, logoPath] of Object.entries(brandMapping)) {
    const brand = await Brand.findOne({ name: new RegExp('^' + name + '$', 'i') });
    if (brand) {
      brand.logo = logoPath;
      await brand.save();
      console.log(`Updated DB logo for ${name} -> ${logoPath}`);
    } else {
      await Brand.create({ name, logo: logoPath });
      console.log(`Created brand ${name} -> ${logoPath}`);
    }
  }
  console.log('All brand logos successfully updated!');
  process.exit(0);
}

updateDB().catch(console.error);
