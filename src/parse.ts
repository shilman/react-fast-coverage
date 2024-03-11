/**
 * Parse a component file and return the component export
 * or the empty string if it's a default export. Error if there
 * is no component.
 */
export const parse = async (src: string) => {
  const reactDocgen = await import('react-docgen');
  try {
    const info = reactDocgen.parse(src, {
      resolver: new reactDocgen.builtinResolvers.FindExportedDefinitionsResolver(),
    });
    console.log({ info });
    return info.map((i) => i.displayName);
  } catch (err: any) {
    if (err.message !== 'No suitable component definition found.') {
      throw err;
    }
  }
};
