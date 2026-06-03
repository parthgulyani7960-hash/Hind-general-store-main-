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
if (diagnostics.length > 0) {
  // Let's find the JsxElement representing <AdminDashboardLayout>
  let layoutNode = null;
  function findLayoutNode(node) {
    if (node.kind === ts.SyntaxKind.JsxElement) {
      const opening = node.openingElement;
      if (opening.tagName.getText(sourceFile) === 'AdminDashboardLayout') {
        layoutNode = node;
        return;
      }
    }
    ts.forEachChild(node, findLayoutNode);
  }

  findLayoutNode(sourceFile);

  if (layoutNode) {
    console.log(`Found AdminDashboardLayout. Spans lines ${sourceFile.getLineAndCharacterOfPosition(layoutNode.getStart(sourceFile)).line + 1} to ${sourceFile.getLineAndCharacterOfPosition(layoutNode.getEnd()).line + 1}`);
    console.log('\nChildren of AdminDashboardLayout:');
    
    // Immediate children (inside layoutNode.children)
    layoutNode.children.forEach((child, idx) => {
      const startLoc = sourceFile.getLineAndCharacterOfPosition(child.getStart(sourceFile));
      const endLoc = sourceFile.getLineAndCharacterOfPosition(child.getEnd());
      console.log(`Child ${idx}: [${ts.SyntaxKind[child.kind]}] Lines ${startLoc.line + 1}:${startLoc.character + 1} to ${endLoc.line + 1}:${endLoc.character + 1}`);
      if (child.kind === ts.SyntaxKind.JsxExpression) {
        // Print the start of the expression text
        const text = child.getText(sourceFile);
        console.log(`  Expression Text: ${text.slice(0, 100).replace(/\n/g, ' ')}...`);
      }
    });
  } else {
    console.log('AdminDashboardLayout JsxElement not found!');
  }
} else {
  console.log('No syntactic diagnostics found!');
}
