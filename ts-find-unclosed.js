import fs from 'fs';
import ts from 'typescript';

const fileName = 'src/pages/AdminDashboard.tsx';
const content = fs.readFileSync(fileName, 'utf8');

const sourceFile = ts.createSourceFile(
  fileName,
  content,
  ts.ScriptTarget.Latest,
  true
);

const program = ts.createProgram([fileName], {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.Latest,
});

const diagnostics = program.getSyntacticDiagnostics(sourceFile);
console.log(`Found ${diagnostics.length} syntactic diagnostics:`);
diagnostics.forEach(diag => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
  console.log(`Error: ${diag.messageText}`);
  console.log(`Location: ${fileName}:${line + 1}:${character + 1}`);
});
