import { Block } from '../../abstract/Block.js';
import { FileItem } from '../FileItem/FileItem.js';
import { UiConfirmation } from '../ConfirmationDialog/ConfirmationDialog.js';
import { UiMessage } from '../MessageBox/MessageBox.js';

/**
 * @typedef {Partial<import('../FileItem/FileItem.js').State> &
 *   Partial<import('../ActivityIcon/ActivityIcon.js').State> &
 *   Partial<import('../ActivityCaption/ActivityCaption.js').State>} ExternalState
 */

/**
 * @typedef {{
 *   doneBtnHidden: Boolean;
 *   doneBtnDisabled: Boolean;
 *   uploadBtnHidden: Boolean;
 *   uploadBtnDisabled: Boolean;
 *   addMoreBtnDisabled: Boolean;
 *   addMoreBtnHidden: Boolean;
 *   hasFiles: Boolean;
 *   onAdd: () => void;
 *   onUpload: () => void;
 *   onDone: () => void;
 *   onCancel: () => void;
 * }} State
 */

/** @extends {Block<State & ExternalState>} */
export class UploadList extends Block {
  activityType = Block.activities.UPLOAD_LIST;

  /** @type {State} */
  init$ = {
    doneBtnHidden: false,
    doneBtnDisabled: false,
    uploadBtnHidden: false,
    uploadBtnDisabled: false,
    addMoreBtnHidden: false,
    addMoreBtnDisabled: false,

    hasFiles: false,
    onAdd: () => {
      this.initFlow(true);
    },
    onUpload: () => {
      this.set$({
        uploadBtnHidden: false,
        doneBtnHidden: true,
        uploadBtnDisabled: true,
        '*uploadTrigger': {},
      });
    },
    onDone: () => {
      this.set$({
        '*currentActivity': this.doneActivity || '',
      });
      this.setForCtxTarget('lr-modal', '*modalActive', false);
      this.output();
    },
    onCancel: () => {
      let cfn = new UiConfirmation();
      cfn.confirmAction = () => {
        this.cancelFlow();
        this.uploadCollection.clearAll();
        this.output();
      };
      cfn.denyAction = () => {
        this.historyBack();
      };
      this.$['*confirmation'] = cfn;
    },
  };

  cssInit$ = {
    '--cfg-show-empty-list': 0,
    '--cfg-multiple': 1,
    '--cfg-multiple-min': 0,
    '--cfg-multiple-max': 0,
    '--cfg-confirm-upload': 1,
    '--cfg-source-list': '',
  };

  /** @private */
  _renderMap = Object.create(null);

  /**
   * @private
   * @returns {{ passed: Boolean; tooFew: Boolean; tooMany: Boolean; exact: Boolean; min: Number; max: Number }}
   */
  _validateFilesCount() {
    let multiple = !!this.getCssData('--cfg-multiple');
    let min = multiple ? this.getCssData('--cfg-multiple-min') ?? 0 : 1;
    let max = multiple ? this.getCssData('--cfg-multiple-max') ?? 0 : 1;
    let count = this.uploadCollection.size;

    let tooFew = min ? count < min : false;
    let tooMany = max ? count > max : false;
    let passed = !tooFew && !tooMany;
    let exact = max === count;

    return {
      passed,
      tooFew,
      tooMany,
      min,
      max,
      exact,
    };
  }

  /** @private */
  _updateCountLimitMessage() {
    let filesCount = this.uploadCollection.size;
    let countValidationResult = this._validateFilesCount();
    if (filesCount && !countValidationResult.passed) {
      let msg = new UiMessage();
      let textKey = countValidationResult.tooFew
        ? 'files-count-limit-error-too-few'
        : 'files-count-limit-error-too-many';
      msg.caption = this.l10n('files-count-limit-error-title');
      msg.text = this.l10n(textKey, {
        min: countValidationResult.min,
        max: countValidationResult.max,
        total: filesCount,
      });
      msg.isError = true;
      this.set$({
        '*message': msg,
      });
    }
  }

  /** @private */
  _handleCollectionUpdate() {
    this._updateButtonsState();
    this._updateCountLimitMessage();
  }

  /** @private */
  _updateButtonsState() {
    let itemIds = this.uploadCollection.items();
    let filesCount = itemIds.length;
    let summary = {
      total: filesCount,
      uploaded: 0,
      uploading: 0,
      validationFailed: 0,
    };
    for (let id of itemIds) {
      let item = this.uploadCollection.read(id);
      if (item.getValue('uuid')) {
        summary.uploaded += 1;
      } else if (item.getValue('isUploading')) {
        summary.uploading += 1;
      }
      if (item.getValue('validationErrorMsg')) {
        summary.validationFailed += 1;
      }
    }
    let allUploaded = summary.total === summary.uploaded;
    let { passed: fitCountRestrictions, tooMany, exact } = this._validateFilesCount();
    let fitValidation = summary.validationFailed === 0;

    this.set$({
      doneBtnHidden: !allUploaded,
      doneBtnDisabled: !fitCountRestrictions || !fitValidation,

      uploadBtnHidden: allUploaded,
      uploadBtnDisabled: summary.uploading > 0 || !fitCountRestrictions || !fitValidation,

      addMoreBtnDisabled: tooMany || exact,
      addMoreBtnHidden: exact && !this.getCssData('--cfg-multiple'),
    });

    if (!this.getCssData('--cfg-confirm-upload') && fitCountRestrictions && allUploaded) {
      this.$.onDone();
    }
  }

  initCallback() {
    super.initCallback();

    this.bindCssData('--cfg-show-empty-list');

    this.registerActivity(this.activityType, () => {
      this.set$({
        '*activityCaption': this.l10n('selected'),
        '*activityIcon': 'local',
      });
    });

    this.sub('--cfg-multiple', () => this._handleCollectionUpdate());
    this.sub('--cfg-multiple-min', () => this._handleCollectionUpdate());
    this.sub('--cfg-multiple-max', () => this._handleCollectionUpdate());

    // TODO: could be performance issue on many files
    // there is no need to update buttons state on every progress tick
    this.uploadCollection.observe(() => {
      this._handleCollectionUpdate();
    });

    this.sub('*uploadList', (list) => {
      if (list?.length === 0 && !this.getCssData('--cfg-show-empty-list')) {
        this.cancelFlow();
        this.ref.files.innerHTML = '';
        return;
      }

      this._handleCollectionUpdate();

      this.set$({
        hasFiles: list.length > 0,
      });

      list.forEach((id) => {
        if (!this._renderMap[id]) {
          let item = new FileItem();
          this._renderMap[id] = item;
        }
      });

      for (let id in this._renderMap) {
        if (!list.includes(id)) {
          this._renderMap[id].remove();
          delete this._renderMap[id];
        }
      }

      let fr = document.createDocumentFragment();
      Object.values(this._renderMap).forEach((el) => fr.appendChild(el));
      this.ref.files.replaceChildren(fr);
      Object.keys(this._renderMap).forEach((id) => {
        /** @type {Block} */
        let el = this._renderMap[id];
        // rendering components async improves initial list render time a bit
        setTimeout(() => {
          el['entry-id'] = id;
          if (!el.innerHTML) {
            el.render();
          }
        });
      });
      this.setForCtxTarget('lr-modal', '*modalActive', true);
    });
  }
}

UploadList.template = /*html*/ `
<div class="no-files" set="@hidden: hasFiles">
  <slot name="empty"><span l10n="no-files"></span></slot>
</div>
<div class="files" ref="files"></div>
<div class="toolbar">
  <button
    type="button"
    class="cancel-btn secondary-btn"
    set="onclick: onCancel;"
    l10n="clear"></button>
  <div class="toolbar-spacer"></div>
  <button
    type="button"
    class="add-more-btn secondary-btn"
    set="onclick: onAdd; @disabled: addMoreBtnDisabled; @hidden: addMoreBtnHidden"
    l10n="add-more"></button>
  <button
    type="button"
    class="upload-btn primary-btn"
    set="@hidden: uploadBtnHidden; onclick: onUpload; @disabled: uploadBtnDisabled"
    l10n="upload"></button>
  <button
    type="button"
    class="done-btn primary-btn"
    set="@hidden: doneBtnHidden; onclick: onDone;  @disabled: doneBtnDisabled"
    l10n="done"></button>
</div>
`;
