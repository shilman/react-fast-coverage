import { writeFile } from 'fs/promises';
import { HandleResults } from './handle';

let uniqueId = 0;

const uniqueify = (importId: string) => `${importId}${uniqueId++}`;

const generateImport = (result: HandleResults) => {
  const namedImports = result.componentExports.filter(Boolean) as string[];
  const namedPart =
    namedImports.length > 0
      ? `{ ${namedImports.map((i) => `${i} as ${uniqueify(i)}`).join(', ')} }`
      : '';
  const defaultPart =
    result.componentExports.length > namedImports.length ? uniqueify('Default') : '';
  return `import ${defaultPart}${namedPart && defaultPart ? ', ' : ''}${namedPart} from './${
    result.filename
  }';\n`;
};

export const generateRoot = async (results: HandleResults[]) => {
  let output = '';
  results.forEach((r) => {
    output += generateImport(r);
  });

  await writeFile('root.js', output);
};
