import * as vscode from 'vscode';
import { PdfPreview } from './pdfPreview';

export class PdfCustomProvider implements vscode.CustomEditorProvider<vscode.CustomDocument> {
  // --- ESTA ES LA LÍNEA QUE AÑADIMOS PARA QUE TODO FUNCIONE ---
  public static activePreview?: PdfPreview;

  private readonly _previews = new Set<PdfPreview>();

  constructor(private readonly extensionRoot: vscode.Uri) {}

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewEditor: vscode.WebviewPanel
  ): Promise<void> {
    const preview = new PdfPreview(
      this.extensionRoot,
      document.uri,
      webviewEditor
    );
    this._previews.add(preview);
    this.setActivePreview(preview);

    webviewEditor.onDidDispose(() => {
      preview.dispose();
      this._previews.delete(preview);
    });

    webviewEditor.onDidChangeViewState(() => {
      if (webviewEditor.active) {
        this.setActivePreview(preview);
      } else if (PdfCustomProvider.activePreview === preview && !webviewEditor.active) {
        this.setActivePreview(undefined);
      }
    });
  }

  private setActivePreview(value: PdfPreview | undefined): void {
    // --- ESTA LÍNEA AHORA USA LA PROPIEDAD ESTÁTICA ---
    PdfCustomProvider.activePreview = value;
  }
}