import { ExpandPanel } from "../../extensions/config/ExpandPanel";
import { IIIFEvents } from "../../IIIFEvents";
import { BaseExpandPanel } from "./BaseExpandPanel";
import { Bools } from "@edsilv/utils";

export class LeftPanel<T extends ExpandPanel> extends BaseExpandPanel<T> {
  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    super.create();

    this.$element.width(this.options.panelCollapsedWidth);
  }

  init(): void {
    super.init();

    const shouldOpenPanel: boolean = Bools.getBool(
      this.extension.getSettings().leftPanelOpen,
      this.options.panelOpen
    );

    if (shouldOpenPanel) {
      this.toggle(true);
    }
  }

  getTargetWidth(): number {
    if (this.isFullyExpanded || !this.isExpanded) {
      return this.options.panelExpandedWidth;
    } else {
      return this.options.panelCollapsedWidth;
    }
  }

  getFullTargetWidth(): number {
    return this.$element.parent().parent().width();
  }

  toggleFinish(): void {
    super.toggleFinish();

    if (this.isExpanded) {
      this.extensionHost.publish(IIIFEvents.OPEN_LEFT_PANEL);
    } else {
      this.extensionHost.publish(IIIFEvents.CLOSE_LEFT_PANEL);
    }
    this.extension.updateSettings({ leftPanelOpen: this.isExpanded });
  }

  resize(): void {
    super.resize();

    if (this.isFullyExpanded) {
      this.$element.width(this.$element.parent().width());
    }
  }
}
