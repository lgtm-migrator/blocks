import { ShadowWrapper } from '../../../blocks/ShadowWrapper/ShadowWrapper.js';

export class FileUploaderRegular extends ShadowWrapper {}

FileUploaderRegular.template = /*html*/ `
<lr-simple-btn></lr-simple-btn>

<lr-modal strokes block-body-scrolling>
  <lr-activity-icon slot="heading"></lr-activity-icon>
  <lr-activity-caption slot="heading"></lr-activity-caption>
  <lr-start-from>
    <lr-source-list wrap></lr-source-list>
    <lr-drop-area></lr-drop-area>
  </lr-start-from>
  <lr-upload-list></lr-upload-list>
  <lr-camera-source></lr-camera-source>
  <lr-url-source></lr-url-source>
  <lr-external-source></lr-external-source>
  <lr-upload-details></lr-upload-details>
  <lr-confirmation-dialog></lr-confirmation-dialog>
  <lr-cloud-image-editor></lr-cloud-image-editor>
</lr-modal>

<lr-message-box></lr-message-box>
<lr-progress-bar-common></lr-progress-bar-common>
`;
