import { ShadowWrapper } from '../blocks/ShadowWrapper/ShadowWrapper.js';
import { UPLOADER_BLOCK_CTX } from './CTX.js';

export class SolutionBlock extends ShadowWrapper {
  ctxInit = UPLOADER_BLOCK_CTX;
  ctxOwner = true;
}