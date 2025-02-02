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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const load_json_file_1 = __importDefault(require("load-json-file"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function dts() {
    const data = {
        cjsModulePath: '',
        esModulePath: '',
        dtsModule: '',
    };
    return {
        name: 'vite:dts',
        apply: 'build',
        async configResolved(config) {
            const { logger } = config;
            const { outDir } = config.build;
            const { entry, formats = ['es'] } = config.build.lib || {};
            if (!entry) {
                return logger.warn(`[vite-dts] Expected "build.lib.entry" to exist in vite config`);
            }
            if (typeof entry !== 'string') {
                return logger.warn(`[vite-dts] Multi-entry libs are currently unsupported`);
            }
            const pkg = await (0, load_json_file_1.default)(path.join(config.root, 'package.json'));
            if (!pkg.main && formats.includes('cjs')) {
                return logger.warn(`[vite-dts] Expected "main" to exist in package.json`);
            }
            if (!pkg.module && formats.includes('es')) {
                return logger.warn(`[vite-dts] Expected "module" to exist in package.json`);
            }
            logger.info(`formats: ${formats}; pkg.module: ${pkg.module}`);
            const entryPath = path.resolve(config.root, entry);
            const entryImportPath = path.relative(path.resolve(config.root, outDir), entryPath.replace(/\.tsx?$/, ''));
            const posixEntryImportPath = entryImportPath.split(path.sep).join(path.posix.sep);
            const entryImpl = fs.readFileSync(entryPath, 'utf8');
            const hasDefaultExport = /^(export default |export \{[^}]+? as default\s*[,}])/m.test(entryImpl);
            data.dtsModule =
                `export * from "${posixEntryImportPath}"` +
                    (hasDefaultExport ? `\nexport {default} from "${posixEntryImportPath}"` : ``);
            data.cjsModulePath = pkg.main ? path.relative(outDir, pkg.main) : '';
            data.esModulePath = pkg.module ? path.relative(outDir, pkg.module) : '';
            console.log(`esModulePath: ${data.esModulePath}`);
        },
        generateBundle(_, bundle) {
            console.log(`bundle keys: ${Object.keys(bundle)}`);
            if (bundle[data.cjsModulePath]) {
                this.emitFile({
                    type: 'asset',
                    fileName: data.cjsModulePath.replace(/\.js$/, '.d.ts'),
                    source: data.dtsModule,
                });
            }
            else if (bundle[data.esModulePath]) {
                console.log("doing emitFile");
                this.emitFile({
                    type: 'asset',
                    fileName: data.esModulePath.replace(/\.mjs$/, '.d.ts'),
                    source: data.dtsModule,
                });
            }
        }
    };
}
exports.default = dts;
//# sourceMappingURL=plugin.js.map