const $ = require("jquery");
import { LeftPanel } from "../uv-shared-module/LeftPanel";
import { SearchLeftPanel as SearchLeftPanelConfig } from "../../BaseConfig";
//import { Events } from "../../../../Events";
import { OpenSeadragonExtensionEvents } from "../../extensions/uv-openseadragon-extension/Events";
import { IIIFEvents } from "../../IIIFEvents";
import OpenSeadragonExtension from "../../extensions/uv-openseadragon-extension/Extension";
import { AnnotationRect } from "@iiif/manifold";
//import { Strings } from "@edsilv/utils";
import { AnnotationResults } from "../uv-shared-module/AnnotationResults";
import { SearchHit } from "../uv-shared-module/SearchHit";
import { Keyboard } from "@edsilv/utils";
import * as KeyCodes from "@edsilv/key-codes";

export class SearchLeftPanel extends LeftPanel<SearchLeftPanelConfig> {
  $searchButton: JQuery;
  $searchContainer: JQuery;
  $searchResultContainer: JQuery;
  $searchLabel: JQuery;
  $searchOptions: JQuery;
  $searchTextContainer: JQuery;
  $searchText: JQuery;
  $clearButton: JQuery;
  $searchHitsContainer: JQuery;
  $searchHitsLabel: JQuery;
  $searchPagerContainer: JQuery;
  $searchPagerPrevButton: JQuery;
  $searchPagerLabel: JQuery;
  $searchPagerNextButton: JQuery;
  terms: string;
  currentAnnotationRect: AnnotationRect | undefined;
  currentCanvasTitle: string | null;

  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    this.setConfig("searchLeftPanel");
    super.create();

    this.$main.html('');
    this.setTitle(this.config.content.title);

    this.extensionHost.subscribe(IIIFEvents.ANNOTATIONS_EMPTY, () => {
      this.hideSearchSpinner();
      this.$searchText.focus();
    });

    this.extensionHost.subscribe(IIIFEvents.ANNOTATIONS_LOADED, () => { // This is a new event so we can highlight the current annotation, after they're all loaded.
      this.setCurrentAnnotation(this.currentAnnotationRect?.canvasIndex, this.currentAnnotationRect?.index);
    });

    this.extensionHost.subscribe(
      IIIFEvents.ANNOTATIONS,
      (annotationResults: AnnotationResults) => {
        this.$searchHitsContainer.show();
        this.$searchPagerContainer.show();
        if (annotationResults.annotations.length) {
          this.$searchHitsLabel.append((<OpenSeadragonExtension>this.extension).getTotalAnnotationRects() + ' ' +
            this.content.doSearch + ' "' + this.$searchText.val() + '"');
          this.$clearButton.show();
          this.displaySearchResults(
            annotationResults.searchHits
          );
          this.currentAnnotationRect = (<OpenSeadragonExtension>(this.extension)).annotations[0].rects[0];
          this.extensionHost.publish(IIIFEvents.ANNOTATION_CANVAS_CHANGE, [
            (<OpenSeadragonExtension>(this.extension)).annotations[0].rects[0],
          ]);
        } else {
          this.$searchHitsLabel.append('No hits');
        }
      }
    );

    this.extensionHost.subscribe(IIIFEvents.ANNOTATION_CANVAS_CHANGE, (e) => {
      let currentCanvasIndex = 0;
      let index = 0;
      if (e !== null) {
        this.currentAnnotationRect = e[0];
        currentCanvasIndex = e[0].canvasIndex;
        index = e[0].index;
      }
      this.canvasIndexChanged(currentCanvasIndex, index);
    });

    this.extensionHost.subscribe(IIIFEvents.THUMB_SELECTED, (e) => {
      if ($('div.searchHit[data-index="0"][data-canvas-index="' + e.data.index + '"]')[0] !== undefined) {
        $('div.searchHit[data-index="0"][data-canvas-index="' + e.data.index + '"]')[0].scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
        let canvasIndex = e.data.index;
        this.currentAnnotationRect = (<OpenSeadragonExtension>(this.extension)).annotations.find((e) => { return e["canvasIndex"] == canvasIndex })?.rects[0];
      } else {
        this.currentAnnotationRect = undefined;
      }
      this.canvasIndexChanged(e.data.index, 0);
    });

    this.extensionHost.subscribe(IIIFEvents.CLEAR_ANNOTATIONS, (e) => {
      this.$searchResultContainer.html('');
      if (e) {
        this.$searchText.val('');
      }
      this.$searchHitsLabel.text('');
      this.$searchHitsContainer.hide();
      this.$searchPagerContainer.hide();
      this.$clearButton.hide();
      this.$searchText.focus();
    });

    // search input
    this.$searchContainer = $('<div class="search"></div>');
    this.$main.append(this.$searchContainer);

    this.$searchOptions = $('<div class="searchOptions"></div>');
    this.$searchContainer.append(this.$searchOptions);

    this.$searchLabel = $(
      '<label class="label" for="searchWithinInput">' +
      this.content.searchWithin +
      "</label>"
    );
    this.$searchOptions.append(this.$searchLabel);

    this.$searchTextContainer = $('<div class="searchTextContainer"></div>');
    this.$searchOptions.append(this.$searchTextContainer);

    this.$searchText = $(
      '<input class="searchText" id="searchWithinInput" autocomplete="off" type="text" maxlength="100" placeholder="' +
      this.content.enterKeyword +
      '" value="" aria-label="' +
      this.content.searchWithin +
      '"/>'
    );

    this.$searchTextContainer.append(this.$searchText);

    this.$clearButton = $(
      '<button class="clearButton" title="' + this.content.clearSearch + '"></button>'
    );
    this.$clearButton.hide();

    this.$searchButton = $(
      '<button class="searchButton"title="' + this.content.doSearch + '"></button>'
    );

    this.$searchHitsContainer = $('<div class="searchHitsContainer"></div>');
    this.$searchHitsLabel = $('<span class="searchHitsLabel"></span>');
    this.$searchHitsContainer.append(this.$searchHitsLabel);
    this.$searchHitsContainer.hide();

    this.$searchContainer.append(this.$searchHitsContainer);

    this.$searchPagerContainer = $('<div class="searchPagerContainer"></div>');
    this.$searchPagerPrevButton = $('<button><</button>');
    this.$searchPagerLabel = $('<span>0 of 100</span>');
    this.$searchPagerNextButton = $('<button>></button>');
    this.$searchPagerContainer.append(this.$searchPagerPrevButton);
    this.$searchPagerContainer.append(this.$searchPagerLabel);
    this.$searchPagerContainer.append(this.$searchPagerNextButton);
    this.$searchPagerContainer.hide();

    this.$searchContainer.append(this.$searchPagerContainer);

    this.$searchResultContainer = $('<div class="searchResult"></div>');
    this.$main.append(this.$searchResultContainer);

    this.$clearButton.on('click', (e: any) => {
      e.preventDefault();
      this.extensionHost.publish(IIIFEvents.CLEAR_ANNOTATIONS, true);
    });

    this.$searchButton.on('click', (e: any) => {
      e.preventDefault();
      this.search(this.$searchText.val());
    });

    this.$searchText.on('keypress', (e: any) => {
      const originalEvent: KeyboardEvent = <KeyboardEvent>e.originalEvent;
      const charCode: number = Keyboard.getCharCode(originalEvent);
      if (charCode === KeyCodes.KeyDown.Spacebar || charCode === KeyCodes.KeyDown.Enter) {
        e.preventDefault();
        this.$searchButton.click();
      }
    });

    this.$searchTextContainer.append(this.$clearButton);
    this.$searchTextContainer.append(this.$searchButton);
  }

  search(terms: string): void {
    this.terms = terms;

    if (this.terms === "") {
      this.extensionHost.publish(IIIFEvents.CLEAR_ANNOTATIONS, false);
      this.extension.showMessage(
        this.extension.data.config!.modules.genericDialogue.content.emptyValue,
        function () {
          this.$searchText.focus();
        }
      );
      return;
    }

    this.$searchHitsLabel.text('');
    this.$searchResultContainer.html('');
    this.$searchText.blur();
    this.showSearchSpinner();
    this.extensionHost.publish(OpenSeadragonExtensionEvents.SEARCH, this.terms);
  }

  showSearchSpinner(): void {
    this.$searchText.addClass("searching");
  }

  hideSearchSpinner(): void {
    this.$searchText.removeClass("searching");
  }

  canvasIndexChanged(canvasIndex: number, index: number): void {
    $('div.searchHit').each((i: Number, searchHit: any) => {
      if ($(searchHit).hasClass('current')) {
        $(searchHit).removeClass('current');
        return;
      }
    });
    if ($('div.searchHit[data-index="' + index + '"][data-canvas-index="' + canvasIndex + '"]')[0] !== undefined) {
      this.setCurrentAnnotation(canvasIndex, index);
      $('div.searchHit[data-index="' + index + '"][data-canvas-index="' + canvasIndex + '"]').addClass('current');
    }
  }

  displaySearchResults(searchHits?: SearchHit[]): void {
    if (searchHits !== undefined) {
      searchHits.forEach((searchHit, i) => {
        let div = $('<div id="searchhit-' + searchHit.canvasIndex + '-' + searchHit.index + '" class="searchHit" data-canvas-index="' + searchHit.canvasIndex + '" data-index="' + searchHit.index + '" tabindex="0"></div>');
        let canvasTitle = this.extension.helper.getCanvasByIndex(searchHit.canvasIndex).getLabel().getValue();
        let hitNumberSpan = $('<span class="searchHitNumberSpan"></div>');
        hitNumberSpan.append(i + 1);
        let searchHitSpan = $('<span class="searchHitSpan">' + searchHit.match + '</span>');

        div.append(hitNumberSpan[0].outerHTML + searchHit.before + searchHitSpan[0].outerHTML + searchHit.after);
        $(div).on('keydown', (e: any) => {
          const originalEvent: KeyboardEvent = <KeyboardEvent>e.originalEvent;
          const charCode: number = Keyboard.getCharCode(originalEvent);
          if (charCode === KeyCodes.KeyDown.Spacebar || charCode === KeyCodes.KeyDown.Enter) {
            e.preventDefault();
            $(e.target).trigger('click');
          }
        });

        $(div, searchHitSpan).on('click', (e: any) => {
          let canvasIndex = 0
          let index = 0
          if (e.target.tagName.toLowerCase() === 'span') {
            canvasIndex = $(e.target).closest('div').attr('data-canvas-index');
            index = $(e.target).closest('div').attr('data-index');
          } else {
            canvasIndex = $(e.target).attr('data-canvas-index');
            index = $(e.target).attr('data-index');
          }
          let currentRect = (<OpenSeadragonExtension>(this.extension)).annotations.find((e) => { return e["canvasIndex"] == canvasIndex })?.rects[index];

          if (currentRect !== undefined) {
            if (this.currentAnnotationRect !== undefined && currentRect.canvasIndex == this.currentAnnotationRect.canvasIndex) {
              this.canvasIndexChanged(canvasIndex, index);
              return;
            }
            this.currentAnnotationRect = currentRect;
            this.extensionHost.publish(IIIFEvents.ANNOTATION_CANVAS_CHANGE, [
              currentRect,
            ]);
          }
        });

        if (canvasTitle !== this.currentCanvasTitle) {
          this.$searchResultContainer.append($('<div class="canvasTitle">' + canvasTitle + "</div>"));
        }
        this.currentCanvasTitle = canvasTitle;
        this.$searchResultContainer.append(div);
      });
    }

    this.canvasIndexChanged(this.extension.helper.canvasIndex, 0);
    this.hideSearchSpinner();
    this.resize();
  }

  setCurrentAnnotation(canvasIndex: any, index: any): void {
    $('.annotationRect').each((i: number, annotation: any) => {
      if ($(annotation).hasClass('current')) {
        $(annotation).removeClass('current');
        return;
      }
    });
    $('div#annotation-' + canvasIndex + '-' + index).addClass('current');
  }

  resize(): void {
    super.resize();
  }
}
