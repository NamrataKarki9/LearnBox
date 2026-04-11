import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'src/app/pages');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Make sure we only replace if 'const P =' is present
    if (content.includes('const P = {')) {
      content = content.replace(/const P = \{[\s\S]*?\};/m, "import { P } from '../../constants/theme';");
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    }
  }
});
