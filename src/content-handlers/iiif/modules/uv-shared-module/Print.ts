export class Print {
    UVContainerIdWithHash: string;
    printSourceTextId: string;
    printSourceTextIdWithHash: string;
    printImageId: string;
    printImageIdWithHash: string;
    printSourceLeftMarginsInPixels: number;
    printSourceTopMarginsInPixels: number;
    printSourceBottomMarginsInPixels: number;
    printSourceTextHeightInPixels: number;
    printSourceText: string;
    imageUri: string | null;
    $image: JQuery;

    constructor() {
        this.UVContainerIdWithHash = "#app";
        this.printSourceTextId = 'printSourceText';
        this.printSourceTextIdWithHash = '#' + this.printSourceTextId;
        this.printImageId = "printImage";
        this.printImageIdWithHash = '#' + this.printImageId;
        this.printSourceLeftMarginsInPixels = 30;
        this.printSourceTopMarginsInPixels = 20;
        this.printSourceBottomMarginsInPixels = 20;
        this.printSourceTextHeightInPixels = 20;
    }

    public printImage(imageUri: string | null, title: string | null, imageId: string | null) {
        var that = this;

        this.printSourceText = title + ' - ' + imageId;
        this.imageUri = imageUri;

        var image: HTMLImageElement = new Image();
        image.id = this.printImageId;
        //The callback function is declared as an ordinary js-function in order to access the image element with "this". The current object is accessed with "that".
        image.onload = function () {
            var $imageElement: HTMLImageElement = <HTMLImageElement>this;
            if (!$imageElement.complete || typeof $imageElement.naturalWidth === "undefined" || $imageElement.naturalWidth === 0) {
                alert('broken image!');
            }
            var imageWidth = $imageElement.width + that.printSourceLeftMarginsInPixels;
            var imageHeight = $imageElement.height + that.printSourceTextHeightInPixels + that.printSourceTopMarginsInPixels + that.printSourceBottomMarginsInPixels;

            var whRatio = imageWidth / imageHeight;
            var widthPercentageLandscape = that.calculateWidthPercentageForLandscape(whRatio);
            var widthPercentagePortrait = that.calculateWidthPercentageForPortrait(whRatio);
            that.printIframe(widthPercentageLandscape, widthPercentagePortrait);
        };

        image.src = <string>imageUri;
        this.$image = $(image);
    };

    private getPrintStyles(widthPercentageLandscape: number, widthPercentagePortrait: number) {
        var fullWidthLandscape = 100;
        var fullWidthPortrait = 100;
        var sourceTextLandscapeStyle = this.printSourceTextIdWithHash + ' { width: ' + fullWidthLandscape + '%; height: ' + this.printSourceTextHeightInPixels + 'px; vertical-align:top; margin-left: ' + this.printSourceLeftMarginsInPixels + 'px; max-width: 90% } ';
        var sourceTextPortraitStyle = this.printSourceTextIdWithHash + ' { width: ' + fullWidthPortrait + '%; height: ' + this.printSourceTextHeightInPixels + 'px; vertical-align:top; margin-left: ' + this.printSourceLeftMarginsInPixels + 'px; max-width: 90% } ';
        var imageLandscapeStyle = this.printImageIdWithHash + ' { width: ' + widthPercentageLandscape + '%; vertical-align: top; margin-top: 20px; margin-left: ' + this.printSourceLeftMarginsInPixels + 'px; }';
        var imagePortraitStyle = this.printImageIdWithHash + ' { width: ' + widthPercentagePortrait + '%; vertical-align: top; margin-top: 20px; margin-left: ' + this.printSourceLeftMarginsInPixels + 'px; }';
        var hideUVContainer = this.UVContainerIdWithHash + ' { display:none; } ';
        var landscapeStyle = sourceTextLandscapeStyle + imageLandscapeStyle + hideUVContainer;
        var portraitStyle = sourceTextPortraitStyle + imagePortraitStyle + hideUVContainer;

        var styleArray = new Array();
        var pageStyle = ' @page { margin: 0mm; } ';
        if (Math.floor(widthPercentageLandscape * 297) >= Math.floor(widthPercentagePortrait) * 210)
            styleArray.push('<style type="text/css">@media print { ' + landscapeStyle + ' } ' + pageStyle + '</style>');
        else
            styleArray.push('<style type="text/css">@media print { ' + portraitStyle + ' } ' + pageStyle + '</style>');

        return styleArray.join("");
    }

    public getHtmlContent() {
        var printContainerId = 'invisibleImageDiv';
        var printContainerIdWithHash = '#' + printContainerId;
        var printContainerClassName = 'invisible-screen';
        var printSourceTextId = 'printSourceText';

        if ($(printContainerIdWithHash).length > 0) {
            $(printContainerIdWithHash).remove();
        }

        var img_div = $('<div id="' + printContainerId + '" class="' + printContainerClassName + '" >');
        img_div.append('<div id="' + printSourceTextId + '"><h5>' + this.printSourceText + '</h5></div>')
        img_div.append(this.$image);

        return img_div;
    };

    private printIframe(widthPercentageLandscape: number, widthPercentagePortrait: number) {
        var iframeId = ("iframeForPrinting");
        var oldFrame = $('#' + iframeId);
        if (oldFrame.length > 0) {
            oldFrame.remove();
        }

        var iframeName = ("printer-" + (new Date()).getTime());
        var iframeElement = this.createIframeElement(iframeId, iframeName);

        var printStyles = this.getPrintStyles(widthPercentageLandscape, widthPercentagePortrait);
        var htmlContent = this.getHtmlContent()[0].outerHTML;
        var iframeContent = this.getIframeContent(document.title, printStyles, htmlContent);

        document.body.appendChild(iframeElement);

        iframeElement.onload = function () {
            iframeElement.contentWindow?.focus();
            iframeElement.contentWindow?.print();
        };

        iframeElement.contentWindow?.document.open();
        iframeElement.contentWindow?.document.write(iframeContent);
        iframeElement.contentWindow?.document.close();
    }

    private createIframeElement(iframeId: string, iframeName: string) {
        var iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.name = iframeName;
        iframe.style.width = "auto";
        iframe.style.height = "auto";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.marginLeft = "20px";
        iframe.style.marginBottom = "0px";
        return iframe;
    }

    private getIframeContent(title: string, printStyles: string, htmlContent: string) {
        var htmlArray = new Array();
        htmlArray.push("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");
        htmlArray.push("<html>");
        htmlArray.push("<head>");
        htmlArray.push("<title>");
        htmlArray.push(title);
        htmlArray.push("</title>");
        htmlArray.push(printStyles);
        htmlArray.push("</head>");
        htmlArray.push("<body>");
        htmlArray.push(htmlContent);
        htmlArray.push("</body>");
        htmlArray.push("</html>");

        return htmlArray.join("");
    }

    private calculateWidthPercentageForLandscape(WHRatio: number): number {
        //The height/width ratio for A4 is 297/210 but it has to be adjusted in landscape mode for some reason.
        //We use 1.5. If you increase this value the page will be shrinked even more.
        var breakpointRatio = 297 / 210;
        var ratioFactor = WHRatio / breakpointRatio;
        var defaultWidthPercentage = 40;
        var fullPercentage = 100;
        var widthPercentage: number;

        //Something wrong with the ratio
        if (WHRatio <= 0) {
            return defaultWidthPercentage;
        }

        if (WHRatio < breakpointRatio) {
            widthPercentage = Math.floor(ratioFactor * fullPercentage) - 8;
        }
        else {
            widthPercentage = fullPercentage - 8;
        }

        return widthPercentage
    }

    private calculateWidthPercentageForPortrait(WHRatio: number): number {
        //If you need to shrink the page even more increase the value of the breakpointRatio.
        var whRatioA4 = 210 / 297;
        var breakpointRatio = whRatioA4;
        var ratioFactor = WHRatio / breakpointRatio;
        var defaultWidthPercentage = 40;
        var fullPercentage = 100;
        var widthPercentage: number;

        //Something wrong with the ratio
        if (WHRatio <= 0) {
            return defaultWidthPercentage;
        }

        if (WHRatio < breakpointRatio) {
            widthPercentage = Math.floor(ratioFactor * fullPercentage) - 8;
        }
        else {
            widthPercentage = fullPercentage - 8;
        }

        return widthPercentage
    }
}