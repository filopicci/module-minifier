"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minifyModule = void 0;
const path_1 = __importStar(require("path"));
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const webpack_1 = require("webpack");
const path_2 = require("path");
const utils_1 = require("./utils");
const defaultRootDir = path_1.default.resolve(__dirname, '..', '..');
/**
 * Async function that minifies a given module using Webpack and Terser.
 * @param mod The module to be minified.
 * @param options The options for minification, including the output filename and destination.
 */
const minifyModule = (packageName, options) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const tmpDir = yield (0, utils_1.createTempWorkspace)(options.verbose);
            const mod = yield (0, utils_1.getPackage)(packageName, tmpDir, options.verbose);
            if (!mod)
                throw new Error("Invalid module provided for minification.");
            if (!((_a = options === null || options === void 0 ? void 0 : options.minifiedFilename) === null || _a === void 0 ? void 0 : _a.endsWith(".min.js")))
                options.minifiedFilename = (0, path_1.basename)(mod.filename, (0, path_1.extname)(mod.filename)) + ".min.js";
            if (!(options === null || options === void 0 ? void 0 : options.minifiedDestination))
                options.minifiedDestination = path_1.default.resolve(defaultRootDir, 'dist');
            else if (!path_1.default.isAbsolute(options.minifiedDestination))
                options.minifiedDestination = path_1.default.resolve(defaultRootDir, options.minifiedDestination);
            const minifiedPath = (0, path_2.join)(options.minifiedDestination, options.minifiedFilename);
            const compiler = (0, webpack_1.webpack)({
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
                        new terser_webpack_plugin_1.default({
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
                    new webpack_1.ProvidePlugin({
                        process: 'process/browser',
                        Buffer: ['buffer', 'Buffer']
                    })
                ]
            });
            compiler.run((err, stats) => {
                if (err) {
                    throw new Error(`Error during minification: ${err.message}`);
                }
                if (stats === null || stats === void 0 ? void 0 : stats.hasErrors()) {
                    throw new Error(`Minification errors: ${stats.toJson().errors}`);
                }
                console.log(`Module ${packageName} minified successfully to ${minifiedPath}`);
            });
            yield (0, utils_1.uninstallPackage)(packageName, options.verbose);
            yield (0, utils_1.cleanup)(tmpDir, options.verbose);
            resolve();
        }
        catch (error) {
            reject(new Error(`Failed to execute npm command: ${error instanceof Error ? error.message : error}`));
        }
    }));
});
exports.minifyModule = minifyModule;
