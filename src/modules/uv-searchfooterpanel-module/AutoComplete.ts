
class AutoComplete{

	results: any;
	selectedResultIndex: number;
    $element: JQuery;
    autoCompleteUri: string;
    delay: number;
    onSelect: (terms: string) => void;
    parseResults: (results: string[]) => string[];

	$searchResultsList: JQuery;
	$searchResultTemplate: JQuery;
	element: HTMLInputElement;

	constructor(element: JQuery,
                autoCompleteUri: string,
                delay: number,
                parseResults: (results: any) => string[],
                onSelect: (terms: string) => void){

        this.$element = element;
        this.autoCompleteUri = autoCompleteUri;
        this.delay = delay;
        this.parseResults = parseResults;
        this.onSelect = onSelect;

        // create ui.
        this.$searchResultsList = $('<ul class="autocomplete"></ul>');
        this.$element.parent().prepend(this.$searchResultsList);

        this.$searchResultTemplate = $('<li class="result"><a href="#"></a></li>');

        // init ui.

        // callback after set period.
        var typewatch = (function () {
            var timer = 0;
            return function (callback, ms) {
                clearTimeout(timer);
                timer = setTimeout(callback, ms);
            };
        })();

        var that = this;

        // validate

        // prevent invalid characters being entered
        this.$element.on("keydown", function(e) {

            if (!that.isValidKey(e.keyCode)) {
                e.preventDefault();
                return false;
            }

            return true;
        });

        // auto complete
        this.$element.on("keyup", function(e) {

        	//e.preventDefault();

            // don't do anything if not a valid key.
            //if (!that.isValidControlKey(e.keyCode)) {
            //   //e.cancelBubble = true;
            //   //if (e.stopPropagation) e.stopPropagation();
            //   e.preventDefault();
            //   return false;
            //}
            // else if (!that.isValidKey(e.keyCode)) {
            //   e.preventDefault();
            //   return false;
            //}

            // if pressing enter without a list item selected
            if (!that.getSelectedListItem().length && e.keyCode === KeyCode.Enter) { // enter
                that.onSelect(that.getTerms());
                return;
            }

            // If there are search results
            if (that.$searchResultsList.is(':visible') && that.results.length) {
                if (e.keyCode === KeyCode.Enter) {
                    that.searchForItem(that.getSelectedListItem());
                } else if (e.keyCode === KeyCode.DownArrow) {
                    that.setSelectedResultIndex(1);
                    return;
                } else if (e.keyCode === KeyCode.UpArrow) {
                    that.setSelectedResultIndex(-1);
                    return;
                }
            }

            // after a delay, show autocomplete list.
            //typewatch(() => {
            //
            //    //if (!that.isValidControlKey(e.keyCode)) {
            //    //   //e.cancelBubble = true;
            //    //   //if (e.stopPropagation) e.stopPropagation();
            //    //   e.preventDefault();
            //    //   return false;
            //    //} else if (!that.isValidKey(e.keyCode)) {
            //    //   e.preventDefault();
            //    //   return false;
            //    //}
            //
            //    var val = that.getTerms();
            //
            //    // if there are more than 2 chars and no spaces
            //    // update the autocomplete list.
            //    if (val && val.length > 2 && !val.contains(' ')) {
            //        that.search(val);
            //    } else {
            //        // otherwise, hide the autocomplete list.
            //        that.clearResults();
            //        that.hideResults();
            //    }
            //
            //    //return true;
            //
            //}, that.delay);
        });

        // hide results if clicked outside.
        $(document).on('mouseup', (e) => {
            if (this.$searchResultsList.parent().has($(e.target)[0]).length === 0) {
                this.clearResults();
                this.hideResults();
            }
        });

        this.hideResults();
    }

    getTerms(): string {
        return this.$element.val().trim();
    }

    setSelectedResultIndex(direction): void {

        var nextIndex;

        if (direction === 1) {
            nextIndex = this.selectedResultIndex + 1;
        } else {
            nextIndex = this.selectedResultIndex - 1;
        }

        var $items = this.$searchResultsList.find('li');

        if (nextIndex < 0) {
            nextIndex = $items.length - 1;
        } else if (nextIndex > $items.length - 1) {
            nextIndex = 0;
        }

        this.selectedResultIndex = nextIndex;

        $items.removeClass('selected');

        var selectedItem = $items.eq(this.selectedResultIndex);

        selectedItem.addClass('selected');

        //var top = selectedItem.offset().top;
        var top = selectedItem.outerHeight(true) * this.selectedResultIndex;

        this.$searchResultsList.scrollTop(top);
    }

    validControlKeyCodes: number[] = [KeyCode.Backspace, KeyCode.Spacebar, KeyCode.Tab, KeyCode.LeftArrow, KeyCode.RightArrow, KeyCode.Delete];

    isValidControlKey(keyCode: number): boolean {
        return this.validControlKeyCodes.contains(keyCode);
    }

    isValidKey(keyCode: number): boolean {
        // is alphanumeric
        var regExp = /^[a-zA-Z0-9]*$/;
        var key = String.fromCharCode(keyCode);
        return regExp.test(key);
    }

    search(term: string): void {

        this.results = [];

        this.clearResults();
        this.showResults();
        this.$searchResultsList.append('<li class="loading"></li>');

        this.updateListPosition();

        var that = this;

        $.getJSON(String.format(this.autoCompleteUri, term), function (results: string[]) {
            that.listResults(results);
        });
    }

    clearResults(): void {
        this.$searchResultsList.empty();
    }

    hideResults(): void {
        this.$searchResultsList.hide();
    }

    showResults(): void {
        this.selectedResultIndex = -1;
        this.$searchResultsList.show();
    }

    updateListPosition(): void {
        this.$searchResultsList.css({
            'top': this.$searchResultsList.outerHeight(true) * -1
        });
    }

    listResults(results: string[]): void {
        // get an array of strings
        this.results = this.parseResults(results);

        this.clearResults();

        if (!this.results.length) {
            // don't do this, because there still may be results for the PHRASE but not the word.
            // they won't know until they do the search.
            //this.searchResultsList.append('<li>no results</li>');
            this.hideResults();
            return;
        }

        for (var i = 0; i < this.results.length; i++) {
            var result = this.results[i];

            var $resultItem = this.$searchResultTemplate.clone();

            var $a = $resultItem.find('a');

            $a.text(result);

            this.$searchResultsList.append($resultItem);
        }

        this.updateListPosition();

        var that = this;

        this.$searchResultsList.find('li').on('click', function (e) {
            e.preventDefault();

            that.searchForItem($(this));
        });
    }

    searchForItem($item): void {
        var term = $item.find('a').text();

        this.onSelect(term);

        this.clearResults();
        this.hideResults();
    }

    getSelectedListItem() {
        return this.$searchResultsList.find('li.selected');
    }

}

export = AutoComplete;