import { ifRef } from '../../utils/ifRef.js';
import { SourceList } from './SourceList.js';
import { SourceBtn } from '../SourceBtn/SourceBtn.js';
import { Icon } from '../Icon/Icon.js';
import { registerBlocks } from '../../abstract/registerBlocks.js';

ifRef(() => {
  registerBlocks({ SourceList, SourceBtn, Icon });
});
