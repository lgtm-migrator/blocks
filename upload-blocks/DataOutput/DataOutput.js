import { BlockComponent } from '../BlockComponent/BlockComponent.js';

export class DataOutput extends BlockComponent {
  initCallback() {
    let from = this.getAttribute('from');
    this.sub(from || DataOutput.defaultFrom, (/** @type {any[]} */ data) => {
      if (!data) {
        return;
      }
      if (this.hasAttribute(DataOutput.fireEventAttrName)) {
        this.dispatchEvent(
          new CustomEvent(DataOutput.outputEventName, {
            bubbles: true,
            composed: true,
            detail: {
              timestamp: Date.now(),
              ctxName: this.ctxName,
              data,
            },
          })
        );
      }
      if (this.hasAttribute(DataOutput.templateAttrName)) {
        let tpl = this.getAttribute(DataOutput.templateAttrName);
        let html = '';
        data.forEach((fileItem) => {
          let itemHtml = tpl;
          for (let prop in fileItem) {
            itemHtml = itemHtml.split(`{{${prop}}}`).join(fileItem[prop]);
          }
          html += itemHtml;
        });
        this.innerHTML = html;
      }
      this.value = data;
      if (this.hasAttribute(DataOutput.formValueAttrName)) {
        if (!this._input) {
          this._input = document.createElement('input');
          this._input.type = 'text';
          this.appendChild(this._input);
        }
        this._input.value = JSON.stringify(data);
      }
    });
  }
}

DataOutput.outputEventName = 'data-output';
DataOutput.templateAttrName = 'item-template';
DataOutput.fireEventAttrName = 'fire-event';
DataOutput.formValueAttrName = 'form-value';
DataOutput.defaultFrom = '*outputData';
