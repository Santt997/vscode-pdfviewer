import * as vscode from 'vscode';
import { PdfCustomProvider } from './pdfProvider';


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
}

export function deactivate(): void {}


