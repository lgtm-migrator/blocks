import { BlockComponent } from '../BlockComponent/BlockComponent.js';
import { EditorToolbar } from './EditorToolbar.js';
import { applyStyles } from '../../symbiote/utils/dom-helpers.js';

EditorToolbar.reg('editor-toolbar');

export class EditableCanvas extends BlockComponent {
  constructor() {
    super();
    applyStyles(this, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    });
    this.initLocalState({
      refMap: null,
    });
  }

  initCallback() {
    /** @type {HTMLCanvasElement} */
    // @ts-ignore
    this.canvas = this.ref.cvs;
    this.canvCtx = this.canvas.getContext('2d');
    this.multiPub('local', {
      refMap: { ...this.ref },
    });
  }

  /** @param {HTMLImageElement} img */
  setImage(img) {
    if (img.height && img.width) {
      this.canvas.height = img.height;
      this.canvas.width = img.width;
      this.canvCtx.drawImage(img, 0, 0, img.width, img.height);
    } else {
      img.onload = () => {
        this.canvas.height = img.height;
        this.canvas.width = img.width;
        this.canvCtx.drawImage(img, 0, 0, img.width, img.height);
      };
    }
  }

  /** @param {File} imgFile */
  setImageFile(imgFile) {
    let img = new Image();
    let url = URL.createObjectURL(imgFile);
    img.src = url;
    this.setImage(img);
  }

  /** @param {String} url */
  setImageUrl(url) {
    let img = new Image();
    img.src = url;
    this.setImage(img);
  }
}

EditableCanvas.template = /*html*/ `
<canvas .img-view ref="cvs"></canvas>
<svg .img-view xmlns="http://www.w3.org/2000/svg" ref="svg">
  <g ref="svg_g">
    <image ref="svg_img" x="0" y="0"></image>
  </g>
</svg>
<uc-editor-toolbar 
  loc="refMap: refMap">
</uc-editor-toolbar>
`;
