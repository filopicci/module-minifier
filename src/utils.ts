import { Module } from "module";
import { spawn } from "cross-spawn";
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdir, rm, writeFile } from "fs/promises";
import { MinificationOptions } from ".";

type MinificationPackageOptions = Pick<MinificationOptions, 'version' | 'verbose'>;

export const createTempWorkspace = async (verbose?: boolean): Promise<string> => {
    const tempDir = join(tmpdir(), `minifier-${Date.now()}`);
    try {
        await mkdir(tempDir, { recursive: true });
        await writeFile(join(tempDir, 'package.json'), JSON.stringify({
            name: 'temp-minifier',
            version: '1.0.0',
            private: true
        }));

        verbose && console.log(`Temporary workspace ${tempDir} created.`);
        
    } catch (error) {
        throw new Error(`Failed to create temporary workspace: ${error instanceof Error ? error.message : error}`);
    }

    return tempDir;
};

export const installPackageInTemp = async (packageName: string, tempDir: string, packageOptions: MinificationPackageOptions) => {
    await execNpmCommand('install', [packageName], packageOptions, { cwd: tempDir });
};

export const cleanup = async (tempDir: string, verbose?: boolean) => {
    await rm(tempDir, { recursive: true, force: true });
    verbose && console.log(`Temporary workspace ${tempDir} cleaned up.`);
};

const resolveFromTemp = (packageName: string, tempDir: string): string => {
    return require.resolve(packageName, {
        paths: [join(tempDir, 'node_modules')]
    });
};

export const getPackage = async (packageName: string, tmpDir: string, packageOptions: MinificationPackageOptions): Promise<Module | undefined> => {
    let packagePath: string;
    try {
        await installPackageInTemp(packageName, tmpDir, packageOptions);

        packagePath = resolveFromTemp(packageName, tmpDir);
        require(packagePath);
    } catch (error) {
        throw new Error(`Failed to get package ${packageName}: ${error instanceof Error ? error.message : error}`);
    }

    return new Promise((resolve, reject) => {
        try {
            const mod = require.cache[packagePath];
            if (mod) {
                resolve(mod);
            } else {
                reject(new Error(`Module ${packageName} not found in cache after installation.`));
            }
        } catch (error) {
            reject(error);
        }
    });

}

export const uninstallPackage = async (packageName: string, packageOptions: MinificationPackageOptions): Promise<void> => {

    try {
        return await execNpmCommand("uninstall", [packageName], packageOptions);
    } catch (error) {
        throw new Error(`Failed to uninstall package ${packageName}: ${error instanceof Error ? error.message : error}`);
    }

}

const execNpmCommand = async (command: string, args: string[], packageOptions: MinificationPackageOptions, spawnOptions?: { cwd?: string }): Promise<void> => {

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

    let commandToExecute = command;

    if(packageOptions?.version)
        commandToExecute += `@${packageOptions.version}`;

    return new Promise((resolve, reject) => {

        const options = spawnOptions ?? { cwd: process.cwd() };

        const npm = spawn("npm", [command, ...args], options);

        npm.stdout.on("data", (data) => {
            packageOptions.verbose && console.log(`npm stdout: ${data.toString()}`);
        });

        npm.stderr.on("data", (data) => {
            console.error(`npm stderr: ${data.toString()}`);
        });

        npm.on("error", (err) => {
            reject(new Error(`Failed to spawn npm command: ${err.message}`));
        });

        npm.on("close", (code) => {
            if (code === 0) {
                packageOptions.verbose && console.log(`npm ${command} ${args.join(' ')} ${packageOptions.version || 'latest'} executed successfully.`);
                resolve();
            } else {
                reject(new Error(`npm process exited with code ${code}`));
            }
        });
    });
}