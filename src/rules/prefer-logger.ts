import { Rule, AST, Scope, SourceCode, RuleTester } from "eslint";
import { Node, Expression } from "estree";
import path from "path"

declare module "eslint" {
    namespace Rule {
        interface RuleContext {
            getCwd(): string
        }

        interface ReportDescriptorOptions {
            suggest?: ReportDescriptor[]
        }
    }
}

function getVariableByName(initScope: Scope.Scope | null, name: string) {
    let scope = initScope

    while (scope) {
        const variable = scope.set.get(name)

        if (variable) {
            return variable
        }
        scope = scope.upper
    }

    return null
}


/**
 * Checks whether the given reference is 'console' or not.
 * @param {eslint-scope.Reference} reference The reference to check.
 * @returns {boolean} `true` if the reference is 'console'.
 */
function isConsole(reference: Scope.Reference) {
    const id = reference.identifier

    return id && id.name === "console"
}


/**
 * Checks whether the given reference is a member access which is not
 * allowed by options or not.
 * @param {eslint-scope.Reference} reference The reference to check.
 * @returns {boolean} `true` if the reference is a member access which
 *      is not allowed by options.
 */
function isMemberAccessExceptAllowed(reference: Scope.Reference) {
    const node = reference.identifier
    const parent = (node as any).parent

    return parent.type === "MemberExpression" && parent.object === node
}


const rule: Rule.RuleModule = {
    meta: {
        messages: {
            "prefer-logger": "Prefer to use logger",
            "import-logger": "Should import logger"
        },
        fixable: "code"
    },

    create(context: Rule.RuleContext): Rule.RuleListener {
        if (context.options[0] == null) {
            throw new Error("options[0] is requred")
        }
        if (context.options[0].logger == null) {
            throw new Error("options[0].logger is requred")
        }
        const options: { logger: string, loggerName: string, base: string } = {
            logger: context.options[0].logger,
            loggerName: context.options?.[0]?.loggerName ? context.options[0].loggerName: "logger",
            base: context.options?.[0]?.base ? context.options[0].base : "",
        }
        options.base = path.join(context.getCwd(), options.base)
        const filename = context.getFilename()
        let useModule: boolean
         // TODO: not supported direct import
         // not supported root import 
        if (options.logger.indexOf("/") < 0) {
            useModule = true
        } else {
            useModule = false
        }
        if (!useModule) {
            options.logger = path.relative(filename, path.join(options.base, options.logger))
        }

        let onetime = true
        /**
         * Reports the given reference as a violation.
         * @param {eslint-scope.Reference} reference The reference to report.
         * @returns {void}
         */
        function report(sourceCode: SourceCode, reference: Scope.Reference, scope: Scope.Scope, program: AST.Program) {
            const node: any = (reference.identifier as any).parent
            const descriptor: Rule.ReportDescriptor = {
                node,
                loc: node.loc,
                messageId: "prefer-logger",
                suggest: [{
                    node,
                    messageId: "prefer-logger",
                    fix(fixer) {
                        const logLevel =
                            node.property.name === "log" ? "info" : node.property.name
                        return fixer.replaceText(
                            node.parent,
                            `${
                            options.loggerName
                            }.${logLevel}(${node.parent.arguments
                                .map((arg: Expression) => sourceCode.getText(arg))
                                .join(", ")})`
                        )
                    }
                }],
            }
            const loggerIsFound = scope.childScopes.some(
                s => getVariableByName(s, options.loggerName) != null
            )
            if(!loggerIsFound && onetime) {
                onetime = false
                descriptor.suggest!.push({
                    node: program,
                    loc: program.loc,
                    messageId: "import-logger",
                    fix: fixer => fixer.insertTextBefore(
                        program,
                        `import ${options.loggerName} from "${options.logger}"\n`
                    )
                })
            }
            context.report(descriptor)
        }

        return {
            "Program:exit"(node: Node) {
                const program = node as AST.Program
                const scope = context.getScope()
                const sourceCode = context.getSourceCode()
                const consoleVar = getVariableByName(scope, "console")
                const shadowed = consoleVar && consoleVar.defs.length > 0

                /*
                 * 'scope.through' includes all references to undefined
                 * variables. If the variable 'console' is not defined, it uses
                 * 'scope.through'.
                 */
                const references = consoleVar
                    ? consoleVar.references
                    : scope.through.filter(isConsole)

                if (!shadowed) {
                    references
                        .filter(isMemberAccessExceptAllowed)
                        .forEach(r => report(sourceCode, r, scope, program))
                }
            }
        }
    }
}

export = rule