/**
 * Options for minifying a module, including the output filename and destination.
 * - `minifiedFilename`: The name of the minified file (default is the original filename with a .min.js extension).
 * - `minifiedDestination`: The directory where the minified file will be saved (default is a 'dist' folder in the current directory).
 * - `version`: The version of the package to be minified (optional).
 * - `verbose`: If true, logs detailed information about the minification process to the console.
 */
export type MinificationOptions = {
    minifiedFilename?: string;
    minifiedDestination?: string;
    version?: string;
    verbose?: boolean;
};
/**
 * Async function that minifies a given module using Webpack and Terser.
 * @param mod The module to be minified.
 * @param options The options for minification, including the output filename and destination.
 */
export declare const minifyModule: (packageName: string, options: MinificationOptions) => Promise<void>;
