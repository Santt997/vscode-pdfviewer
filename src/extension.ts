import * as vscode from 'vscode';
import { PdfCustomProvider } from './pdfProvider';
import { deletePdfPage } from './pdfEdit';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext): void {
  const extensionRoot = vscode.Uri.file(context.extensionPath);
  // Register our custom editor provider
  const provider = new PdfCustomProvider(extensionRoot);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'pdf.preview',
      provider,
        { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Comando para borrar página - Versión corregida
  context.subscriptions.push(
    vscode.commands.registerCommand('pdfviewer.deletePage', async (pageFromWebview?: number, filePath?: string) => {
      console.log(' Delete page command executed');
      console.log('File path from webview:', filePath);
      
      // Determinar la ruta del PDF
      let targetPath = filePath;
      
      if (!targetPath) {
        // Buscar entre documentos PDF abiertos
        const pdfDocs = vscode.workspace.textDocuments.filter(doc => 
          doc.fileName.toLowerCase().endsWith('.pdf')
        );
        
        if (pdfDocs.length === 0) {
          vscode.window.showErrorMessage('No hay un PDF activo. Abre un archivo PDF primero.');
          return;
        }
        targetPath = pdfDocs[0].fileName;
      }
      
      console.log('Processing PDF:', targetPath);

      // Obtener número de página
      let pageNum = pageFromWebview;
      if (!pageNum) {
        const pageStr = await vscode.window.showInputBox({
          prompt: '¿Qué página deseas borrar? (número, empezando desde 1)',
        });
        if (!pageStr) return;
        pageNum = parseInt(pageStr, 10);
        if (isNaN(pageNum)) {
          vscode.window.showErrorMessage('Número inválido.');
          return;
        }
      }

      // Procesar la eliminación
      const tempPath = path.join(
        path.dirname(targetPath),
        `.__tmp__${path.basename(targetPath)}`
      );

      try {
        await deletePdfPage(targetPath, pageNum, tempPath);
        fs.copyFileSync(tempPath, targetPath);
        fs.unlinkSync(tempPath);
        vscode.window.showInformationMessage(`Página ${pageNum} borrada correctamente.`);
        await vscode.commands.executeCommand('workbench.action.files.revert');
      } catch (e) {
        vscode.window.showErrorMessage('Error: ' + (e as Error).message);
      }
    })
  );
}

export function deactivate(): void {}

