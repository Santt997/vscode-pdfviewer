"use strict";

(function () {
  function loadConfig() {
    const elem = document.getElementById('pdf-preview-config');
    if (elem) {
      return JSON.parse(elem.getAttribute('data-config'));
    }
    throw new Error('Could not load configuration.');
  }
  function cursorTools(name) {
    if (name === 'hand') {
      return 1;
    }
    return 0;
  }
  function scrollMode(name) {
    switch (name) {
      case 'vertical':
        return 0;
      case 'horizontal':
        return 1;
      case 'wrapped':
        return 2;
      default:
        return -1;
    }
  }
  function spreadMode(name) {
    switch (name) {
      case 'none':
        return 0;
      case 'odd':
        return 1;
      case 'even':
        return 2;
      default:
        return -1;
    }
  }

  // --- INICIO DE NUESTRO CÓDIGO DE DEPURACIÓN ---
  document.addEventListener('webviewerloaded', function () {
    // Esperamos 500ms para asegurarnos de que el HTML de la barra de herramientas se haya renderizado.
    setTimeout(() => {
      console.log("main.js: Retraso finalizado. Buscando el botón AHORA.");

      const deleteBtn = document.getElementById('deletePageButton');
      const app = window.PDFViewerApplication;
      const vscode = acquireVsCodeApi();

      if (deleteBtn && app && vscode) {
        console.log("main.js: ¡ÉXITO! Botón encontrado. Añadiendo listener.");
        
        deleteBtn.addEventListener('click', function () {
          console.log("main.js: ¡CLIC DETECTADO! Enviando mensaje.");
          const currentPage = app.page;
          vscode.postMessage({
            type: 'deletePage',
            pageNumber: currentPage
          });
        });
      } else {
        console.error("main.js: FALLO DEFINITIVO: El botón sigue sin encontrarse. Revisa el id en pdfPreview.ts.");
        console.log("main.js: Valor de deleteBtn:", deleteBtn);
      }
    }, 500); // 500 milisegundos de retraso
  });
  // --- FIN DE NUESTRO CÓDIGO DE DEPURACIÓN ---

  window.addEventListener('load', async function () {
    const config = loadConfig();
    PDFViewerApplicationOptions.set('cMapUrl', config.cMapUrl);
    PDFViewerApplicationOptions.set('standardFontDataUrl', config.standardFontDataUrl);
    const loadOpts = {
      url:config.path,
      useWorkerFetch: false,
      cMapUrl: config.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: config.standardFontDataUrl
    };
    PDFViewerApplication.initializedPromise.then(() => {
      const defaults = config.defaults;
      const optsOnLoad = () => {
        PDFViewerApplication.pdfCursorTools.switchTool(cursorTools(defaults.cursor));
        PDFViewerApplication.pdfViewer.currentScaleValue = defaults.scale;
        PDFViewerApplication.pdfViewer.scrollMode = scrollMode(defaults.scrollMode);
        PDFViewerApplication.pdfViewer.spreadMode = spreadMode(defaults.spreadMode);
        if (defaults.sidebar) {
          PDFViewerApplication.pdfSidebar.open();
        } else {
          PDFViewerApplication.pdfSidebar.close();
        }
        PDFViewerApplication.eventBus.off('documentloaded', optsOnLoad);
      };
      PDFViewerApplication.eventBus.on('documentloaded', optsOnLoad);
      
      PDFViewerApplication.open(config.path).then(async function () {
        const doc = await pdfjsLib.getDocument(loadOpts).promise;
        doc._pdfInfo.fingerprints = [config.path];
        PDFViewerApplication.load(doc);
      });
    });

    window.addEventListener('message', async function () {
      const oldResetView = PDFViewerApplication.pdfViewer._resetView;
      PDFViewerApplication.pdfViewer._resetView = function () {
        this._firstPageCapability = (0, pdfjsLib.createPromiseCapability)();
        this._onePageRenderedCapability = (0, pdfjsLib.createPromiseCapability)();
        this._pagesCapability = (0, pdfjsLib.createPromiseCapability)();

        this.viewer.textContent = "";
      };

      const doc = await pdfjsLib.getDocument(loadOpts).promise;
      doc._pdfInfo.fingerprints = [config.path];
      PDFViewerApplication.load(doc);

      PDFViewerApplication.pdfViewer._resetView = oldResetView;
    });
  }, { once: true });

  window.onerror = function () {
    const msg = document.createElement('body');
    msg.innerText = 'An error occurred while loading the file. Please open it again.';
    document.body = msg;
  };
}());