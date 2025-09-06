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

  // --- INICIO DE NUESTRO CÓDIGO ---
  // Esperamos a que el visor esté completamente cargado para asegurarnos de que todo existe.
  document.addEventListener("webviewerloaded", () => {
      console.log("Evento 'webviewerloaded' disparado. Buscando el botón de borrar...");
      
      const deleteButton = document.getElementById("deletePage");
      const app = window.PDFViewerApplication;

      if (deleteButton && app) {
          console.log("¡Botón de borrar encontrado! Añadiendo listener.");
          deleteButton.addEventListener("click", () => {
              const pageNumber = app.page;
              console.log(`Botón pulsado. Enviando solicitud para borrar página: ${pageNumber}`);
              app.appConfig.backend.postMessage({
                  type: "deletePage",
                  pageNumber: pageNumber,
              });
          });
      } else {
          console.error("ERROR: Botón de borrar NO encontrado o la App no está lista.");
          console.log("Valor de deleteButton:", deleteButton);
          console.log("Valor de app:", app);
      }
  });
  // --- FIN DE NUESTRO CÓDIGO ---

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