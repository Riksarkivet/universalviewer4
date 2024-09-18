import { Canvas } from "manifesto.js";

export class Riksarkivet {
    public UpdateUrl(canvas: Canvas) {
        var imageId: string | null = this.GetImageIdFromCanvas(canvas);
        if (imageId !== null) {
            this.SetUrlAfter("/", imageId, parent.document);
        }
    }

    public GetImageIdFromCanvas(canvas: Canvas) {
        var imageId = canvas.id.split('/')[3];
        var datasource = imageId.split('!')[0];
        if (datasource === "arkis") {
            datasource = "";
        }
        else {
            datasource = datasource.substr(0, 1).toUpperCase() + datasource.substr(1) + "_";
        }
        imageId = datasource + imageId.substr(imageId.indexOf("!") + 1);
        return imageId;
    }

    public SetUrlAfter(searchvalue, value, doc) {
        if (!doc) {
            doc = window.document;
        }
        var url = doc.URL;
        var searchIndex = url.lastIndexOf(searchvalue);
        if (searchIndex === -1) {
            return;
        }
        var startUrl = url.substr(0, searchIndex);
        var endUrl = url.substr(searchIndex);
        var indexAfter = endUrl.indexOf("#");
        if (indexAfter === -1) {
            indexAfter = endUrl.indexOf("?");
        }
        if (indexAfter === -1) {
            indexAfter = endUrl.indexOf("&");
        }
        if (indexAfter !== -1) {
            endUrl = endUrl.substr(indexAfter);
        }
        else {
            endUrl = "";
        }
        if (window.top !== null) {
            if (window.top.history.replaceState) {
                window.top.history.replaceState(null, "", startUrl + searchvalue + value + endUrl);
            }
        }
    };
}