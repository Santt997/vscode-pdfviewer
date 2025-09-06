import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import { PDFDocument } from 'pdf-lib';
import { PdfCustomProvider } from './pdfProvider';

export function activate(context: vscode.ExtensionContext): void {
  const extensionRoot = vscode.Uri.file(context.extensionPath);
  
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'pdf.preview',
      new PdfCustomProvider(extensionRoot),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('pdfviewer.deletePage', async () => {
      const activePreview = PdfCustomProvider.activePreview;
      if (!activePreview) {
        vscode.window.showErrorMessage('No active PDF preview found. Please open a PDF file.');
        return;
      }
      const targetPath = activePreview.resource.fsPath;

      const pageStr = await vscode.window.showInputBox({
        prompt: 'Enter the page number to delete (starting from 1)',
        validateInput: text => {
          return /^\d+$/.test(text) && parseInt(text, 10) > 0 ? null : 'Please enter a valid positive number.';
        }
      });
      if (!pageStr) { return; }
      const pageNum = parseInt(pageStr, 10);

      try {
        const pdfBytes = await fs.readFile(targetPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        if (pageNum > pdfDoc.getPageCount() || pageNum <= 0) {
          vscode.window.showErrorMessage(`Invalid page number. The PDF has ${pdfDoc.getPageCount()} pages.`);
          return;
        }
        if (pdfDoc.getPageCount() <= 1) {
          vscode.window.showErrorMessage('Cannot delete the last page of a PDF.');
          return;
        }

        pdfDoc.removePage(pageNum - 1);
        const pdfBytesSaved = await pdfDoc.save();
        await fs.writeFile(targetPath, pdfBytesSaved);
        
        vscode.window.showInformationMessage(`Page ${pageNum} deleted successfully.`);
        
        await vscode.commands.executeCommand('workbench.action.files.revert');

      } catch (e) {
        vscode.window.showErrorMessage('Error deleting page: ' + (e as Error).message);
      }
    })
  );
}

export function deactivate(): void {}