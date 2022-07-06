import { Color } from './Color.js';
import { registerBlocks } from '../../abstract/registerBlocks.js';

registerBlocks({ Color });

const colorInput = new Color();
colorInput.classList.add('lr-wgt-common');

window.onload = () => {
  document.querySelector('#viewport')?.appendChild(colorInput);
  colorInput.$['*selectedColor'] = 'blue';
};
