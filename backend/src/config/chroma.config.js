import { LocalIndex } from 'vectra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Vectra index (local vector database, no server needed)
const indexPath = path.join(__dirname, '../../vectra_index');

let index = null;

/**
 * Get or create the Vectra index
 */
export async function getVectraIndex() {
  if (!index) {
    index = new LocalIndex(indexPath);
    
    // Check if index exists, if not create it
    if (!(await index.isIndexCreated())) {
      console.log('Creating new vector index...');
      await index.createIndex();
    }
  }
  return index;
}

export default getVectraIndex;
