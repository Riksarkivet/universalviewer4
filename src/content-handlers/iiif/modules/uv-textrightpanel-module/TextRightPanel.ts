const $ = require("jquery");
import { RightPanel } from "../uv-shared-module/RightPanel";
import { TextRightPanel as TextRightPanelConfig } from "../../BaseConfig";
import { Events } from "../../../../Events";
import OpenSeadragonExtension from "../../extensions/uv-openseadragon-extension/Extension";
import OpenSeadragon from "openseadragon";
import { IIIFEvents } from "../../IIIFEvents";

export class TextRightPanel extends RightPanel<TextRightPanelConfig> {
  $transcribedText: JQuery;
  $existingAnnotation: JQuery = $();

  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    this.setConfig("textRightPanel");

    super.create();

    this.extensionHost.on(IIIFEvents.CLEAR_ANNOTATIONS, async () => {
      this.$existingAnnotation = $('.lineAnnotation.current');
    });

    this.extensionHost.on(Events.LOAD, async (e) => {
      this.$main.html('');
      this.removeLineAnnotationRects();
      let canvases = this.extension.getCurrentCanvases();
      canvases.sort((a, b) => (a.index as number - b.index as number));
      for (let i = 0; i < canvases.length; i++) {
        const c = canvases[i];
        let seeAlso = c.getProperty('seeAlso');
        let header;
        if (i === 0 && canvases.length > 1) {
          header = this.content.leftPage;
        } else if (i === 1 && canvases.length > 1) {
          header = this.content.rightPage;
        }

        // We need to see if seeAlso contains an ALTO file and maybe allow for other HTR/OCR formats in the future
        // and make sure which version of IIIF Presentation API is used
        if (seeAlso.length === undefined) { // This is IIIF Presentation API < 3
          if (seeAlso.profile.includes('alto')) {
            await this.processAltoFile(seeAlso['@id'], header);
          }
        } else { // This is IIIF Presentation API >= 3
          if (seeAlso[0].profile.includes('alto')) {
            await this.processAltoFile(seeAlso[0]['id'], header);
          }
        }
      };
    });

    this.setTitle(this.config.content.title);
  }

  toggleFinish(): void {
    super.toggleFinish();
  }


  resize(): void {
    super.resize();

    this.$main.height(
      this.$element.height() - this.$top.height() - this.$main.verticalMargins()
    );

    /*     this.$element.css({
          left: Math.floor(
            this.$element.parent().width() - this.$element.outerWidth() - this.options.panelCollapsedWidth
          ),
        }); */
  }

  // Let's load the ALTO file and do some parsing
  processAltoFile = async (altoUrl, header?): Promise<void> => {
    try {
      const response = await fetch(altoUrl);
      const data = await response.text();
      const altoDoc = new DOMParser().parseFromString(data, 'application/xml');
      const textLines = altoDoc.querySelectorAll('TextLine');

      let lines = Array.from(textLines).map((e, i) => {
        const strings = e.querySelectorAll('String');
        let t = Array.from(strings).map((e, i) => {
          return e.getAttribute('CONTENT');
        });
        const x = Number(e.getAttribute('HPOS'));
        const y = Number(e.getAttribute('VPOS'));
        const width = Number(e.getAttribute('WIDTH'));
        const height = Number(e.getAttribute('HEIGHT'));

        let line = $('<p id="line-annotation-' + i + '" class="lineAnnotation" tabindex="0">' + t.join(' ') + '</p>');

        if (!this.extension.isMobile()) {
          let div = $('<div id="line-annotation-' + i + '" class="lineAnnotationRect" data-x="' + x + '" data-y="' + y + '" data-width="' + width + '" data-height="' + height + '" tabindex="0"></div>');
          $(div).on('keydown', (e: any) => {
            if (e.keyCode === 13) {
              $(e.target).trigger('click');
            }
          });
          $(div).on('click', (e: any) => {
            this.clearLineAnnotationRects();
            this.clearLineAnnotations();
            this.setCurrentLineAnnotation(e.target, true);
            this.setCurrentLineAnnotationRect(e.target);
          });
          // Add overlay to OpenSeadragon canvas
          const osRect = new OpenSeadragon.Rect(x, y, width, height);
          (<OpenSeadragonExtension>(this.extension)).centerPanel.viewer.addOverlay(div[0], osRect);

          line.on('keydown', (e: any) => {
            if (e.keyCode === 13) {
              $(e.target).trigger('click');
            }
          });
          // Sync line click with line annotation
          line.on('click', (e: any) => {
            this.clearLineAnnotationRects();
            this.clearLineAnnotations();
            this.setCurrentLineAnnotation(e.target, false);
            this.setCurrentLineAnnotationRect(e.target);
          });
        }
        return line;
      });

      this.$transcribedText = $('<div class="transcribed-text"></div>');
      if (header) {
        this.$transcribedText.append($('<div class="label">' + header + '</div>'));
      }
      if (lines.length > 0) {
        this.$transcribedText.append(lines);
      } else {
        this.$transcribedText.append($('<div>' + this.content.textNotFound + '</div>'));
      }
      this.$main.append(this.$transcribedText);

      // If we already have a selected line annotation, make sure it's selected again after load
      if (this.$existingAnnotation[0] !== undefined) {
        let id = $(this.$existingAnnotation).attr('id');
        this.setCurrentLineAnnotation($(this.$existingAnnotation)[0], true);
        this.setCurrentLineAnnotationRect($('div#' + id)[0]);
        this.$existingAnnotation = $();
      }

    } catch (error) {
      throw new Error('Unable to fetch Alto file: ' + error.message);
    }
  }

  setCurrentLineAnnotationRect(e: any): void {
    $('div.lineAnnotationRect').each((i: Number, lineAnnotationRect: any) => {
      if ($(lineAnnotationRect).hasClass('current')) {
        $(lineAnnotationRect).removeClass('current');
      }
    });
    $('div#' + e.getAttribute('id')).addClass('current');
  }

  setCurrentLineAnnotation(e: any, scrollIntoView: Boolean): void {
    $('.lineAnnotation').each((i: Number, lineAnnotation: any) => {
      if ($(lineAnnotation).hasClass('current')) {
        $(lineAnnotation).removeClass('current');
      }
    });
    $('p#' + e.getAttribute('id')).addClass('current');
    if (scrollIntoView) {
      $('p#' + e.getAttribute('id'))[0].scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }
  }

  clearLineAnnotationRects(): void {
    $('div.lineAnnotationRect').each((i: Number, lineAnnotationRect: any) => {
      if ($(lineAnnotationRect).hasClass('current')) {
        $(lineAnnotationRect).removeClass('current');
      }
    });
  }

  clearLineAnnotations(): void {
    $('.lineAnnotation').each((i: Number, lineAnnotation: any) => {
      if ($(lineAnnotation).hasClass('current')) {
        $(lineAnnotation).removeClass('current');
      }
    });
  }

  removeLineAnnotationRects(): void {
    $('div.lineAnnotationRect').remove();
  }

}
