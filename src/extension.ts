import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import { PDFDocument } from 'pdf-lib';
import { PdfCustomProvider } from './pdfProvider';

export function activate(context: vscode.ExtensionContext): void {
  const extensionRoot = vscode.Uri.file(context.extensionPath);
  
  // Registra el visor de PDF personalizado
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'pdf.preview',
      new PdfCustomProvider(extensionRoot),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Registra el comando para borrar la página
  context.subscriptions.push(
    vscode.commands.registerCommand('pdfviewer.deletePage', async () => {
      
      // 1. Obtener el PDF activo desde nuestro Provider estático
      const activePreview = PdfCustomProvider.activePreview;
      if (!activePreview) {
        vscode.window.showErrorMessage('No active PDF preview found. Please open a PDF file.');
        return;
      }
      // La URI del documento está dentro del objeto PdfPreview
      const targetPath = activePreview.resource.fsPath;

      // 2. Pedir al usuario el número de página
      const pageStr = await vscode.window.showInputBox({
        prompt: 'Enter the page number to delete (starting from 1)',
        validateInput: text => {
          // Valida que la entrada sea un número positivo
          return /^\d+$/.test(text) && parseInt(text, 10) > 0 ? null : 'Please enter a valid positive number.';
        }
      });
      if (!pageStr) { 
        return; // El usuario canceló la operación
      }
      const pageNum = parseInt(pageStr, 10);

      // 3. Leer, modificar y guardar el archivo PDF
      try {
        const pdfBytes = await fs.readFile(targetPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        if (pageNum > pdfDoc.getPageCount()) {
          vscode.window.showErrorMessage(`Invalid page number. The PDF only has ${pdfDoc.getPageCount()} pages.`);
          return;
        }
        if (pdfDoc.getPageCount() <= 1) {
          vscode.window.showErrorMessage('Cannot delete the last page of a PDF.');
          return;
        }

        // Borra la página (restando 1 porque los índices empiezan en 0)
        pdfDoc.removePage(pageNum - 1);
        
        const pdfBytesSaved = await pdfDoc.save();
        await fs.writeFile(targetPath, pdfBytesSaved);
        
        vscode.window.showInformationMessage(`Page ${pageNum} deleted successfully.`);
        
        // Recarga el visor para que muestre los cambios
        await vscode.commands.executeCommand('workbench.action.files.revert');

      } catch (e) {
        vscode.window.showErrorMessage('Error deleting page: ' + (e as Error).message);
      }
    })
  );
}

export function deactivate(): void {}