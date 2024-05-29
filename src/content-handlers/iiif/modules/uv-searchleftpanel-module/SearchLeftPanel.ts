import { LeftPanel } from "../uv-shared-module/LeftPanel";
import { SearchLeftPanel as SearchLeftPanelConfig } from "../../BaseConfig";
import { Events } from "../../../../Events";

export class SearchLeftPanel extends LeftPanel<SearchLeftPanelConfig> {
  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    this.setConfig("searchLeftPanel");
    super.create();

    this.extensionHost.on(Events.LOAD, async () => {
      this.$main.html('');
      this.setTitle(this.config.content.title);
      this.$main.append("<p style=\"padding: 15px;\">Placeholder for search functionality (TODO: to be implemented).</p>");
    });
  }

  resize(): void {
    super.resize();
  }
}
