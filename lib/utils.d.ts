import { Module } from "module";
import { MinificationOptions } from ".";
type MinificationPackageOptions = Pick<MinificationOptions, 'version' | 'verbose'>;
export declare const createTempWorkspace: (verbose?: boolean) => Promise<string>;
export declare const installPackageInTemp: (packageName: string, tempDir: string, packageOptions: MinificationPackageOptions) => Promise<void>;
export declare const cleanup: (tempDir: string, verbose?: boolean) => Promise<void>;
export declare const getPackage: (packageName: string, tmpDir: string, packageOptions: MinificationPackageOptions) => Promise<Module | undefined>;
export declare const uninstallPackage: (packageName: string, packageOptions: MinificationPackageOptions) => Promise<void>;
export {};
