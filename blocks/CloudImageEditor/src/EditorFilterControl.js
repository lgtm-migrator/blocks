import { createCdnUrl, createCdnUrlModifiers } from '../../../utils/cdn-utils.js';
import { EditorButtonControl } from './EditorButtonControl.js';
import { FAKE_ORIGINAL_FILTER } from './EditorSlider.js';
import { COMMON_OPERATIONS, transformationsToOperations } from './lib/transformationUtils.js';
import { preloadImage } from './lib/preloadImage.js';

export class EditorFilterControl extends EditorButtonControl {
  init$ = {
    ...this.ctxInit,
    active: false,
    title: '',
    icon: '',
    isOriginal: false,
    iconSize: '20',
    'on.click': null,
  };

  _previewSrc() {
    let previewSize = parseInt(window.getComputedStyle(this).getPropertyValue('--l-base-min-width'), 10);
    let dpr = window.devicePixelRatio;
    let size = Math.ceil(dpr * previewSize);
    let quality = dpr >= 2 ? 'lightest' : 'normal';
    let filterValue = 100;

    /** @type {import('./types.js').Transformations} */
    let transformations = { ...this.$['*editorTransformations'] };
    transformations[this._operation] =
      this._filter !== FAKE_ORIGINAL_FILTER
        ? {
            name: this._filter,
            amount: filterValue,
          }
        : undefined;

    return createCdnUrl(
      this._originalUrl,
      createCdnUrlModifiers(
        COMMON_OPERATIONS,
        transformationsToOperations(transformations),
        `quality/${quality}`,
        `scale_crop/${size}x${size}/center`
      )
    );
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   * @param {IntersectionObserver} observer
   */
  _observerCallback(entries, observer) {
    let intersectionEntry = entries[0];
    if (intersectionEntry.isIntersecting) {
      let src = this.proxyUrl(this._previewSrc());
      let previewEl = this.ref['preview-el'];
      let { promise, cancel } = preloadImage(src);
      this._cancelPreload = cancel;
      promise
        .catch((err) => {
          this.$['*networkProblems'] = true;
          console.error('Failed to load image', { error: err });
        })
        .finally(() => {
          previewEl.style.backgroundImage = `url(${src})`;
          setTimeout(() => {
            previewEl.style.opacity = '1';
          });

          observer.unobserve(this);
        });
    } else {
      this._cancelPreload && this._cancelPreload();
    }
  }

  initCallback() {
    super.initCallback();

    this.$['on.click'] = (e) => {
      if (!this.$.active) {
        this.$['*sliderEl'].setOperation(this._operation, this._filter);
        this.$['*sliderEl'].apply();
      } else if (!this.$.isOriginal) {
        this.$['*sliderEl'].setOperation(this._operation, this._filter);
        this.$['*showSlider'] = true;
      }

      this.$['*currentFilter'] = this._filter;
    };

    this.defineAccessor('filter', (filter) => {
      this._operation = 'filter';
      this._filter = filter;
      this.$.isOriginal = filter === FAKE_ORIGINAL_FILTER;
      this.$.icon = this.$.isOriginal ? 'original' : 'slider';
    });

    this._observer = new window.IntersectionObserver(this._observerCallback.bind(this), {
      threshold: [0, 1],
    });

    let originalUrl = this.$['*originalUrl'];
    this._originalUrl = originalUrl;

    if (this.$.isOriginal) {
      this.ref['icon-el'].classList.add('original-icon');
    } else {
      this._observer.observe(this);
    }

    this.sub('*currentFilter', (currentFilter) => {
      this.$.active = currentFilter && currentFilter === this._filter;
    });

    this.sub('isOriginal', (isOriginal) => {
      this.$.iconSize = isOriginal ? 40 : 20;
    });

    this.sub('active', (active) => {
      if (this.$.isOriginal) {
        return;
      }
      let iconEl = this.ref['icon-el'];
      iconEl.style.opacity = active ? '1' : '0';

      let previewEl = this.ref['preview-el'];
      if (active) {
        previewEl.style.opacity = '0';
      } else if (previewEl.style.backgroundImage) {
        previewEl.style.opacity = '1';
      }
    });

    this.sub('*networkProblems', (networkProblems) => {
      if (!networkProblems) {
        let src = this.proxyUrl(this._previewSrc());
        let previewEl = this.ref['preview-el'];
        if (previewEl.style.backgroundImage) {
          previewEl.style.backgroundImage = 'none';
          previewEl.style.backgroundImage = `url(${src})`;
        }
      }
    });
  }

  destroyCallback() {
    super.destroyCallback();
    this._observer?.disconnect();
    this._cancelPreload && this._cancelPreload();
  }
}

EditorFilterControl.template = /* HTML */ `
  <div class="before"></div>
  <div class="preview" ref="preview-el"></div>
  <lr-icon size="40" ref="icon-el" set="@name: icon; @size: iconSize;"></lr-icon>
`;
