"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallPackage = exports.getPackage = exports.cleanup = exports.installPackageInTemp = exports.createTempWorkspace = void 0;
const cross_spawn_1 = require("cross-spawn");
const os_1 = require("os");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const createTempWorkspace = (verbose) => __awaiter(void 0, void 0, void 0, function* () {
    const tempDir = (0, path_1.join)((0, os_1.tmpdir)(), `minifier-${Date.now()}`);
    try {
        yield (0, promises_1.mkdir)(tempDir, { recursive: true });
        yield (0, promises_1.writeFile)((0, path_1.join)(tempDir, 'package.json'), JSON.stringify({
            name: 'temp-minifier',
            version: '1.0.0',
            private: true
        }));
        verbose && console.log(`Temporary workspace ${tempDir} created.`);
    }
    catch (error) {
        throw new Error(`Failed to create temporary workspace: ${error instanceof Error ? error.message : error}`);
    }
    return tempDir;
});
exports.createTempWorkspace = createTempWorkspace;
const installPackageInTemp = (packageName, tempDir, verbose) => __awaiter(void 0, void 0, void 0, function* () {
    yield execNpmCommand('install', [packageName], verbose, { cwd: tempDir });
});
exports.installPackageInTemp = installPackageInTemp;
const cleanup = (tempDir, verbose) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    verbose && console.log(`Temporary workspace ${tempDir} cleaned up.`);
});
exports.cleanup = cleanup;
const resolveFromTemp = (packageName, tempDir) => {
    return require.resolve(packageName, {
        paths: [(0, path_1.join)(tempDir, 'node_modules')]
    });
};
const getPackage = (packageName, tmpDir, verbose) => __awaiter(void 0, void 0, void 0, function* () {
    let packagePath;
    try {
        yield (0, exports.installPackageInTemp)(packageName, tmpDir, verbose);
        packagePath = resolveFromTemp(packageName, tmpDir);
        require(packagePath);
    }
    catch (error) {
        throw new Error(`Failed to get package ${packageName}: ${error instanceof Error ? error.message : error}`);
    }
    return new Promise((resolve, reject) => {
        try {
            const mod = require.cache[packagePath];
            if (mod) {
                resolve(mod);
            }
            else {
                reject(new Error(`Module ${packageName} not found in cache after installation.`));
            }
        }
        catch (error) {
            reject(error);
        }
    });
});
exports.getPackage = getPackage;
const uninstallPackage = (packageName, verbose) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield execNpmCommand("uninstall", [packageName], verbose);
    }
    catch (error) {
        throw new Error(`Failed to uninstall package ${packageName}: ${error instanceof Error ? error.message : error}`);
    }
});
exports.uninstallPackage = uninstallPackage;
const execNpmCommand = (command, args, verbose, spawnOptions) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate arguments
    if (!command || typeof command !== 'string') {
        throw new Error('Invalid command: must be a non-empty string');
    }
    if (!Array.isArray(args)) {
        throw new Error('Invalid args: must be an array');
    }
    for (const arg of args) {
        if (typeof arg !== 'string') {
            throw new Error(`Invalid argument: all args must be strings, got ${typeof arg}`);
        }
    }
    return new Promise((resolve, reject) => {
        const options = spawnOptions !== null && spawnOptions !== void 0 ? spawnOptions : { cwd: process.cwd() };
        const npm = (0, cross_spawn_1.spawn)("npm", [command, ...args], options);
        npm.stdout.on("data", (data) => {
            verbose && console.log(`npm stdout: ${data.toString()}`);
        });
        npm.stderr.on("data", (data) => {
            console.error(`npm stderr: ${data.toString()}`);
        });
        npm.on("error", (err) => {
            reject(new Error(`Failed to spawn npm command: ${err.message}`));
        });
        npm.on("close", (code) => {
            if (code === 0) {
                verbose && console.log(`npm ${command} ${args.join(' ')} executed successfully.`);
                resolve();
            }
            else {
                reject(new Error(`npm process exited with code ${code}`));
            }
        });
    });
});
