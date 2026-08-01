import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const sourceRoot = path.resolve("src");
const sourceExtensions = new Set([".js", ".jsx"]);

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolutePath);
    return sourceExtensions.has(path.extname(entry.name)) ? [absolutePath] : [];
  });
}

function parseSource(filePath) {
  const scriptKind = filePath.endsWith(".jsx")
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.JS;
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

function resolveImportedFile(importerPath, modulePath) {
  const basePath = path.resolve(path.dirname(importerPath), modulePath);
  const candidates = [basePath, `${basePath}.js`, `${basePath}.jsx`];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function getPropertyName(property) {
  if (!property.name) return null;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
    return property.name.text;
  }
  return null;
}

function getDefaultServiceMethods(servicePath) {
  const sourceFile = parseSource(servicePath);
  let defaultExportName = null;

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportAssignment(statement) &&
      !statement.isExportEquals &&
      ts.isIdentifier(statement.expression)
    ) {
      defaultExportName = statement.expression.text;
      break;
    }
  }

  if (!defaultExportName) return null;

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === defaultExportName &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        return new Set(
          declaration.initializer.properties
            .map(getPropertyName)
            .filter(Boolean),
        );
      }
    }
  }

  return null;
}

const serviceMethodCache = new Map();
const errors = [];
let checkedReferences = 0;
let checkedFiles = 0;

for (const filePath of collectSourceFiles(sourceRoot)) {
  if (filePath.includes(`${path.sep}services${path.sep}`)) continue;

  const sourceFile = parseSource(filePath);
  const importedServices = new Map();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !statement.importClause?.name ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }

    const modulePath = statement.moduleSpecifier.text;
    if (!/(?:^|\/)services\/\w+Service(?:\.js)?$/.test(modulePath)) continue;

    const servicePath = resolveImportedFile(filePath, modulePath);
    if (!servicePath) {
      errors.push(`${filePath}: không tìm thấy service ${modulePath}`);
      continue;
    }

    if (!serviceMethodCache.has(servicePath)) {
      serviceMethodCache.set(servicePath, getDefaultServiceMethods(servicePath));
    }

    const methods = serviceMethodCache.get(servicePath);
    if (!methods) {
      errors.push(`${servicePath}: default export không phải service object`);
      continue;
    }

    importedServices.set(statement.importClause.name.text, {
      methods,
      serviceName: path.basename(servicePath, path.extname(servicePath)),
    });
  }

  if (!importedServices.size) continue;
  checkedFiles += 1;

  function visit(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      importedServices.has(node.expression.text)
    ) {
      checkedReferences += 1;
      const service = importedServices.get(node.expression.text);
      const method = node.name.text;
      if (!service.methods.has(method)) {
        const location = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        errors.push(
          `${filePath}:${location.line + 1}:${location.character + 1} ` +
            `${service.serviceName}.${method} không tồn tại`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

if (errors.length) {
  console.error("Service contract check failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Service contract check passed: ${checkedReferences} reference(s) across ${checkedFiles} file(s).`,
);
