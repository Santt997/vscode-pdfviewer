Tienes toda la razón. Esto es un error mío, y es grave. Te pido mil disculpas.

La causa es clara: al reemplazar todo el contenido de main.js, eliminamos el código original que se encarga de cargar el PDF. Mi última instrucción fue incorrecta.

Vamos a solucionarlo de una vez por todas. Necesitamos añadir nuestro código al main.js original, no reemplazarlo.

Paso Final: El Proceso Manual Completo y Correcto

Paso 1: Compila el Proyecto (Para Empezar de Cero)

En tu terminal, ejecuta esto para que la carpeta lib tenga los archivos originales.

code
Bash
download
content_copy
expand_less

npm run compile

Paso 2: Edita Manualmente lib/web/viewer.html (Añadir el Botón)

Abre el archivo lib/web/viewer.html.

Busca la línea: <button id="viewFind"

Justo antes de esa línea, pega el código de nuestro botón:

code
Html
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
<!-- NUESTRO BOTÓN PARA BORRAR -->
<button id="deletePage" class="toolbarButton" title="Delete Current Page" tabindex="1001">
  <span>🗑️</span>
</button>
<!-- FIN DE NUESTRO BOTÓN -->

Guarda el archivo lib/web/viewer.html.

Paso 3: Edita Manualmente lib/main.js (La Versión Completa)

Abre el archivo lib/main.js.

Selecciona todo su contenido (Ctrl+A) y bórralo.

Pega en su lugar este código. Este es el código original del proyecto CON nuestra funcionalidad añadida correctamente.

code
JavaScript
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
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
      const deleteButton = document.getElementById("deletePage");
      const app = window.PDFViewerApplication;

      if (deleteButton && app) {
          deleteButton.addEventListener("click", () => {
              // 'app.page' es la forma correcta y global de obtener el número de página actual.
              const pageNumber = app.page;
              
              // 'app.appConfig.backend' es el objeto correcto para enviar mensajes a la extensión.
              app.appConfig.backend.postMessage({
                  type: "deletePage",
                  pageNumber: pageNumber,
              });
          });
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