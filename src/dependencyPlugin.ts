import { writeFile } from 'fs/promises';
import path from 'path';
import type { Plugin } from 'vite';

/*
 * Edge, Module, and Stats are copied from chromatic types
 * https://github.com/chromaui/chromatic-cli/blob/145a5e295dde21042e96396c7e004f250d842182/bin-src/types.ts#L265-L276
 */
type Edge = string;
type ID = string | number;

interface Module {
  id: ID;
  name: string;
  modules?: Array<Pick<Module, 'name'>>;
  children: Edge[];
  depth: number;
  marked: boolean;
}
interface Stats {
  modules: Module[];
}

type TurbosnapPluginOptions = {
  /** Project root (https://vitejs.dev/config/#root) */
  rootDir: string;
};

/**
 * Strips off query params added by rollup/vite to ids, to make paths compatible for comparison with git.
 */
function stripQueryParams(filePath: string): string {
  return filePath.split('?')[0];
}

/**
 * We only care about user code, not node_modules, vite files, or (most) virtual files.
 */
function isUserCode(moduleName: string) {
  return Boolean(
    moduleName &&
      !moduleName.startsWith('vite/') &&
      !moduleName.startsWith('\x00') &&
      !moduleName.startsWith('\u0000') &&
      moduleName !== 'react/jsx-runtime' &&
      !moduleName.match(/node_modules\//)
  );
}

export default function pluginTurbosnap({ rootDir }: TurbosnapPluginOptions): Plugin {
  function traverse(id: string, depth: number) {
    const stats = statsMap.get(id);
    if (!stats) throw new Error(`Unexpected id ${id}`);
    stats.depth = Math.max(stats.depth, depth);
    // break cycles
    if (stats.marked) return;

    stats.marked = true;
    stats.children.forEach((childId) => {
      traverse(childId, depth + 1);
    });
    stats.marked = false;
  }

  /**
   * Convert an absolute path name to a path relative to the vite root, with a starting `./`
   */
  function normalize(filename: string) {
    // Do not try to resolve virtual files
    if (filename.startsWith('/virtual:')) {
      return filename;
    }
    // Otherwise, we need them in the format `./path/to/file.js`.
    else {
      const relativePath = path.relative(rootDir, stripQueryParams(filename));
      // This seems hacky, got to be a better way to add a `./` to the start of a path.
      return `./${relativePath}`;
    }
  }

  /**
   * Helper to create Edge objects out of a list of string paths
   */
  function createEdges(importers?: readonly string[]): Edge[] {
    return (importers || []).map((i) => normalize(i));
  }

  /**
   * Helper function to build a `Module` given a filename and list of files that import it
   */
  function createStatsMapModule(filename: string, imports?: readonly string[]): Module {
    return {
      id: normalize(filename),
      name: normalize(filename),
      children: createEdges(imports),
      depth: 0,
      marked: false,
    };
  }

  const statsMap = new Map<string, Module>();

  return {
    name: 'rollup-plugin-turbosnap',
    // We want this to run after the vite build plugins (https://vitejs.dev/guide/api-plugin.html#plugin-ordering)
    enforce: 'post',
    moduleParsed: function (mod) {
      if (isUserCode(mod.id)) {
        const imports = mod.importedIds
          .concat(mod.dynamicallyImportedIds)
          .filter((name) => isUserCode(name));

        statsMap.set(normalize(mod.id), createStatsMapModule(mod.id, imports));
      }
    },

    generateBundle: function (this, outOpts) {
      traverse('./root.js', 0);
      const stats: Stats = { modules: Array.from(statsMap.values()) };

      // If we don't know where the output is going, we can't guarantee we'll put the results in the right spot.
      if (!outOpts.dir) {
        throw new Error('Vite option `build.outDir` was not configured.');
      }

      const filename = path.resolve(outOpts.dir, 'deps.json');
      console.log(`rollup-plugin-turbosnap: writing to ${filename}`);
      return writeFile(filename, JSON.stringify(stats, null, 2));
    },
  };
}
