import { recursiveMergeIntersection } from "./merge";
import { getTypeOrDeclaredType, resolvedTypeToString } from "./util";

function init(modules: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
    const ts = modules.typescript;
  
    function create(info: ts.server.PluginCreateInfo) {
      // Set up decorator object
      const proxy: ts.LanguageService = Object.create(null);
      for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
        const x = info.languageService[k]!;
        // @ts-expect-error - JS runtime trickery which is tricky to type tersely
        proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
      }

      proxy.getQuickInfoAtPosition = (fileName, position) => {
        const prior = info.languageService.getQuickInfoAtPosition(fileName, position)

        const program = info.project['program'] as ts.Program|undefined

        if(!program) return prior

        const typeChecker = program.getTypeChecker()
        const sourceFile = program.getSourceFile(fileName)

        if(!sourceFile) return prior

        // @ts-expect-error
        const node: ts.Node = ts.getTouchingPropertyName(sourceFile, position);
        if (!node || node === sourceFile) {
            // Avoid giving quickInfo for the sourceFile as a whole.
            return prior
        }
        
        const symbol = typeChecker.getSymbolAtLocation(node)
        if(!symbol) return prior

        const type = getTypeOrDeclaredType(typeChecker, symbol, node)
        const expandedType = recursiveMergeIntersection(typeChecker, type)

        if(!prior?.displayParts) return prior

        prior.displayParts.push({ kind: 'lineBreak', text: "\n\n" })

        prior.displayParts.push({ kind: 'punctuation', text: '(' })
        prior.displayParts.push({ kind: 'text', text: 'type' })
        prior.displayParts.push({ kind: 'punctuation', text: ')' })
        prior.displayParts.push({ kind: 'space', text: ' ' })
        
        const typeString = resolvedTypeToString(typeChecker, sourceFile, expandedType, undefined, ts.TypeFormatFlags.MultilineObjectLiterals)

        typeString.split("\n").forEach(line => {
          prior.displayParts!.push({
            kind: 'punctuation',
            text: line,
          })

          prior.displayParts!.push({
            kind: 'lineBreak',
            text: "\n"
          })
        })

        return prior
      }

      return proxy
    }

    return { create };
}

export = init;