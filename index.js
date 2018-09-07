import { stripIndent } from "common-tags";
import { createFilter } from "rollup-pluginutils";

const postcssTreeshakeable = (options = {}) => {
  const filter = createFilter(options.include, options.exclude);

  // checks whether the ast has this shape:
  //   var css = "";
  //   export default {/* some props */};
  //   import styleInject from '...../style-inject/dist/style-inject.es.js';
  //   styleInject(css);
  const isCssModuleAst = ast => {
    const styleInjectImport = "style-inject/dist/style-inject.es.js";

    if (ast.type !== "Program") return false;
    if (ast.body.length !== 4) return false;

    // Check for
    //   var css = "";
    const cssVar = ast.body[0];
    if (cssVar.type !== "VariableDeclaration") return false;
    if (cssVar.declarations.length !== 1) return false;
    if (cssVar.declarations[0].type !== "VariableDeclarator") return false;
    if (!cssVar.declarations[0].id) return false;
    if (cssVar.declarations[0].id.type !== "Identifier") return false;
    if (cssVar.declarations[0].id.name !== "css") return false;
    if (!cssVar.declarations[0].init) return false;
    if (cssVar.declarations[0].init.type !== "Literal") return false;
    if (typeof cssVar.declarations[0].init.value !== "string") return false;

    // Check for
    //   export default {/* some props */};
    const expDefDec = ast.body[1];
    if (expDefDec.type !== "ExportDefaultDeclaration") return false;
    if (expDefDec.declaration.type !== "ObjectExpression") return false;

    // Check for
    //   import styleInject from '...../style-inject/dist/style-inject.es.js';
    const impDec = ast.body[2];
    if (impDec.type !== "ImportDeclaration") return false;
    if (impDec.specifiers.length !== 1) return false;
    if (impDec.specifiers[0].type !== "ImportDefaultSpecifier") return false;
    if (impDec.specifiers[0].local.type !== "Identifier") return false;
    if (impDec.specifiers[0].local.name !== "styleInject") return false;
    if (impDec.source.type !== "Literal") return false;
    if (typeof impDec.source.value !== "string") return false;
    if (!impDec.source.value.endsWith(styleInjectImport)) return false;

    // Check for
    //   styleInject(css);
    const exprSt = ast.body[3];
    if (exprSt.type !== "ExpressionStatement") return false;
    if (exprSt.expression.type !== "CallExpression") return false;
    if (exprSt.expression.callee.type !== "Identifier") return false;
    if (exprSt.expression.callee.name !== "styleInject") return false;

    return true;
  };

  const objectExpressionToObject = objectExpression => {
    let str = "{ ";
    objectExpression.properties.forEach((prop, index) => {
      if (index !== 0) str += ", ";
      str += `${prop.key.raw}: ${prop.value.raw}`;
    });
    str += " }";
    return str;
  };

  return {
    name: "rollup-plugin-postcss-treeshakeable",
    transform: function(code, id) {
      if (!filter(id)) return;

      const ast = this.parse(code);
      if (isCssModuleAst(ast)) {
        const cssVar = ast.body[0];
        const css = cssVar.declarations[0].init.raw;
        const expDefDec = ast.body[1];
        const cssMap = objectExpressionToObject(expDefDec.declaration);
        const impDec = ast.body[2];
        const impSource = impDec.source.raw;
        return {
          code: stripIndent`
            import styleInject from ${impSource};
            var cssMap = ${cssMap}
            var hasRun;
            var styles = function styles() {
              if (!hasRun) {
                hasRun = true;
                styleInject(${css});
              }
              return cssMap;
            }

            export default styles
          `
        };
      }
    }
  };
};

export default postcssTreeshakeable;
