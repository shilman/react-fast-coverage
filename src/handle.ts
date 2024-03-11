import { readFile } from 'fs/promises';
import { parse } from './parse';

export interface HandleOptions {}
export interface HandleResults {
  filename: string;
  componentExports: (string | undefined)[];
}

const logger = console;

export const handle = async (
  filename: string,
  options: HandleOptions
): Promise<HandleResults | undefined> => {
  try {
    const src = await readFile(filename, 'utf8');
    const componentExports = await parse(src);
    if (!componentExports?.length) return undefined;
    return { filename, componentExports };
  } catch (err) {
    logger.error('❌', filename, `=> ${err}`);
  }
};
