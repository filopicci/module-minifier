import { Module } from "module";
export declare const createTempWorkspace: (verbose?: boolean) => Promise<string>;
export declare const installPackageInTemp: (packageName: string, tempDir: string, verbose?: boolean) => Promise<void>;
export declare const cleanup: (tempDir: string, verbose?: boolean) => Promise<void>;
export declare const getPackage: (packageName: string, tmpDir: string, verbose?: boolean) => Promise<Module | undefined>;
export declare const uninstallPackage: (packageName: string, verbose?: boolean) => Promise<void>;
