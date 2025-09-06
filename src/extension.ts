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
      PdfCustomProvider.viewType,
      provider,
      {
        webviewOptions: {
          enableFindWidget: false, // default
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // Comando para borrar página
  context.subscriptions.push(
    vscode.commands.registerCommand('pdfviewer.deletePage', async (pageFromWebview?: number) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (
        !activeEditor ||
        !activeEditor.document.fileName.toLowerCase().endsWith('.pdf')
      ) {
        vscode.window.showErrorMessage('No hay un PDF activo.');
        return;
      }
  
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
  
      const originalPath = activeEditor.document.fileName;
      const tempPath = path.join(
        path.dirname(originalPath),
        `.__tmp__${path.basename(originalPath)}`
      );
  
      try {
        await deletePdfPage(originalPath, pageNum, tempPath);
        // Reemplaza el archivo original
        fs.copyFileSync(tempPath, originalPath);
        fs.unlinkSync(tempPath);
        vscode.window.showInformationMessage(`Página ${pageNum} borrada correctamente.`);
        // Recarga el documento
        await activeEditor.document.save();
        await vscode.commands.executeCommand('workbench.action.files.revert');
      } catch (e: any) {
        vscode.window.showErrorMessage('Error: ' + e.message);
      }
    })
  );

export function deactivate(): void {}
