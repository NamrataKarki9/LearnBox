import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, 'src/app/pages');

// Tailwind classes to eliminate
// Replace colors with our CSS variables
const replacements = [
  { p: /\brounded(?:-[a-z0-9]+)?\b/g, r: '' }, // remove all rounded
  { p: /\bshadow(?:-[a-z0-9]+)?\b/g, r: '' }, // remove shadow
  { p: /\bbg-gray-50\b/g, r: 'bg-parchment-light' },
  { p: /\bbg-gray-100\b/g, r: 'bg-parchment-light' },
  { p: /\bbg-gray-200\b/g, r: 'bg-parchment-dark' },
  { p: /\bbg-gray-300\b/g, r: 'bg-sand' },
  { p: /\bborder-gray-100\b/g, r: 'border-sand-light' },
  { p: /\bborder-gray-200\b/g, r: 'border-sand' },
  { p: /\bborder-gray-300\b/g, r: 'border-ink' },
  { p: /\btext-gray-500\b/g, r: 'text-ink-muted' },
  { p: /\btext-gray-600\b/g, r: 'text-ink-secondary' },
  { p: /\btext-gray-700\b/g, r: 'text-ink-secondary' },
  { p: /\bbg-white\b/g, r: 'bg-parchment' },
  { p: /\btext-primary\b/g, r: 'text-ink' },
  { p: /\bbg-primary\b/g, r: 'bg-ink' },
  { p: /\btext-primary-foreground\b/g, r: 'text-parchment' },
  { p: /\bbg-muted\b/g, r: 'bg-parchment-dark' },
  { p: /\btext-muted-foreground\b/g, r: 'text-ink-muted' },
];

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Apply replacements
    for (const { p, r } of replacements) {
      content = content.replace(p, r);
    }
    
    // Cleanup double spaces inside classNames
    content = content.replace(/className=(["`])([^"`]+)\1/g, (match, quote, classes) => {
      let cleaned = classes.replace(/\s+/g, ' ').trim();
      return `className=${quote}${cleaned}${quote}`;
    });

    if (original !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up Tailwind classes in ${file}`);
    }
  }
});
