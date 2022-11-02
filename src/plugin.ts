import type { Plugin } from 'vite'
import loadJSON from 'load-json-file'
import * as path from 'path'
import * as fs from 'fs'

export default function dts(): Plugin {
  const data = {
    cjsModulePath: '',
    esModulePath: '',
    dtsModule: '',
  }
  return {
    name: 'vite:dts',
    apply: 'build',
    async configResolved(config) {
      const { logger } = config
      const { outDir } = config.build

      const { entry, formats = ['es'] } = config.build.lib || {}
      if (!entry) {
        return logger.warn(
          `[vite-dts] Expected "build.lib.entry" to exist in vite config`
        )
      }
      if (typeof entry !== 'string') {
        return logger.warn(
          `[vite-dts] Multi-entry libs are currently unsupported`
        )
      }

      const pkg = await loadJSON<any>(path.join(config.root, 'package.json'))

      if (!pkg.main && formats.includes('cjs')) {
        return logger.warn(
          `[vite-dts] Expected "main" to exist in package.json`
        )
      }
      if (!pkg.module && formats.includes('es')) {
        return logger.warn(
          `[vite-dts] Expected "module" to exist in package.json`
        )
      }
      logger.info(`formats: ${formats}; pkg.module: ${pkg.module}`)

      const entryPath = path.resolve(config.root, entry)
      const entryImportPath = path.relative(
        path.resolve(config.root, outDir),
        entryPath.replace(/\.tsx?$/, '')
      )

      const posixEntryImportPath = entryImportPath.split(path.sep).join(path.posix.sep)

      const entryImpl = fs.readFileSync(entryPath, 'utf8')
      const hasDefaultExport =
        /^(export default |export \{[^}]+? as default\s*[,}])/m.test(entryImpl)

      data.dtsModule =
        `export * from "${posixEntryImportPath}"` +
        (hasDefaultExport ? `\nexport {default} from "${posixEntryImportPath}"` : ``)

      data.cjsModulePath = pkg.main ? path.relative(outDir, pkg.main) : ''
      data.esModulePath = pkg.module ? path.relative(outDir, pkg.module) : ''
      console.log(`esModulePath: ${data.esModulePath}`)
    },

    generateBundle (_, bundle) {
      console.log(`bundle keys: ${Object.keys(bundle)}`)
      if (bundle[data.cjsModulePath]) {
        this.emitFile({
          type: 'asset',
          fileName: data.cjsModulePath.replace(/\.js$/, '.d.ts'),
          source: data.dtsModule,
        })
      } else if (bundle[data.esModulePath]) {
        console.log("doing emitFile")
        this.emitFile({
          type: 'asset',
          fileName: data.esModulePath.replace(/\.mjs$/, '.d.ts'),
          source: data.dtsModule,
        })
      }
    }
  }
}
