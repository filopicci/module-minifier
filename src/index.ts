import path, { basename, extname } from "path";
import TerserPlugin from "terser-webpack-plugin";
import { ProvidePlugin, webpack } from "webpack";
import { join } from 'path';
import { cleanup, createTempWorkspace, getPackage, uninstallPackage } from "./utils";

/**
 * Options for minifying a module, including the output filename and destination.
 * - `minifiedFilename`: The name of the minified file (default is the original filename with a .min.js extension).
 * - `minifiedDestination`: The directory where the minified file will be saved (default is a 'dist' folder in the current directory).
 * - `verbose`: If true, logs detailed information about the minification process to the console.
 */
type MinificationOptions = {
    minifiedFilename?: string;
    minifiedDestination?: string;
    verbose?: boolean;
}

const defaultRootDir = path.resolve(__dirname, '..', '..');

/**
 * Async function that minifies a given module using Webpack and Terser.
 * @param mod The module to be minified.
 * @param options The options for minification, including the output filename and destination.
 */
export const minifyModule = async (packageName: string, options: MinificationOptions) => {

    return new Promise<void>(async (resolve, reject) => {
        try {
            const tmpDir = await createTempWorkspace(options.verbose);
            const mod = await getPackage(packageName, tmpDir, options.verbose);

            if (!mod)
                throw new Error("Invalid module provided for minification.");

            if (!options?.minifiedFilename?.endsWith(".min.js"))
                options.minifiedFilename = basename(mod.filename, extname(mod.filename)) + ".min.js";

            if (!options?.minifiedDestination)
                options.minifiedDestination = path.resolve(defaultRootDir, 'dist');
            else if (!path.isAbsolute(options.minifiedDestination))
                options.minifiedDestination = path.resolve(defaultRootDir, options.minifiedDestination);


            const minifiedPath = join(options.minifiedDestination, options.minifiedFilename);

            const compiler = webpack({
                mode: "production",
                entry: mod.filename,
                output: {
                    filename: options.minifiedFilename,
                    path: options.minifiedDestination,
                    library: mod.id,
                    libraryTarget: 'umd',
                    globalObject: 'this'
                },
                optimization: {
                    minimize: true,
                    minimizer: [
                        new TerserPlugin({
                            terserOptions: {
                                compress: {
                                    drop_console: true,
                                },
                                output: {
                                    comments: false,
                                },
                            },
                            extractComments: false,
                        }),
                    ],
                },
                resolve: {
                    alias: {
                        'process/browser': require.resolve('process/browser')
                    },
                    extensions: ['.js'],
                    fallback: {
                        "process": require.resolve("process/browser"),
                        "buffer": require.resolve("buffer/")
                    }
                },
                plugins: [
                    new ProvidePlugin({
                        process: 'process/browser',
                        Buffer: ['buffer', 'Buffer']
                    })
                ]
            });

            compiler.run((err, stats) => {
                if (err) {
                    throw new Error(`Error during minification: ${err.message}`);
                }

                if (stats?.hasErrors()) {
                    throw new Error(`Minification errors: ${stats.toJson().errors}`);
                }
                console.log(`Module ${packageName} minified successfully to ${minifiedPath}`);
            });

            await uninstallPackage(packageName, options.verbose);
            await cleanup(tmpDir, options.verbose);
            resolve();
        } catch (error) {
            reject(new Error(`Failed to execute npm command: ${error instanceof Error ? error.message : error}`));
        }
    });
}