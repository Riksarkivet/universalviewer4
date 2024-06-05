const $ = require("jquery");
import { LeftPanel } from "../uv-shared-module/LeftPanel";
import { SearchLeftPanel as SearchLeftPanelConfig } from "../../BaseConfig";
import { Events } from "../../../../Events";

export class SearchLeftPanel extends LeftPanel<SearchLeftPanelConfig> {
  $searchButton: JQuery;
  $searchContainer: JQuery;
  $searchLabel: JQuery;
  $searchOptions: JQuery;
  $searchTextContainer: JQuery;
  $searchText: JQuery;
  $clearButton: JQuery;

  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    this.setConfig("searchLeftPanel");
    super.create();

    this.extensionHost.on(Events.LOAD, async () => {
      this.$main.html('');
      this.setTitle(this.config.content.title);

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
      '<input class="searchText" id="searchWithinInput" autocomplete="off" type="text" maxlength="100" value="' +
        this.content.enterKeyword +
        '" aria-label="' +
        this.content.searchWithin +
        '"/>'
    );

    this.$searchText.on("focus", () => {
      // clear initial text.
      if (this.$searchText.val() === this.content.enterKeyword)
        this.$searchText.val("");
    });

    this.$searchTextContainer.append(this.$searchText);

    this.$clearButton = $(
      '<button class="clearButton"></button>'
    );
    this.$clearButton.on("click", () => {
      this.$searchText.val(this.content.enterKeyword);
    });

    this.$searchButton = $(
      '<button class="imageButton searchButton"></button>'
    );
    this.$searchTextContainer.append(this.$searchButton);
    this.$searchTextContainer.append(this.$clearButton);

    // TODO: search results

    });
  }

  resize(): void {
    super.resize();
  }
}
