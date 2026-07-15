if (!customElements.get('quick-add-modal')) {
  customElements.define(
    'quick-add-modal',
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');

        this.addEventListener('product-info:loaded', ({ target }) => {
          target.addPreProcessCallback(this.preprocessHTML.bind(this));
        });
      }

      hide(preventFocus = false) {
        const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = '';

        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        opener.setAttribute('aria-disabled', true);
        opener.classList.add('loading');
        opener.querySelector('.loading__spinner').classList.remove('hidden');

        fetch(opener.getAttribute('data-product-url'))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
            const productElement = responseHTML.querySelector('product-info');

            this.preprocessHTML(productElement);
            HTMLUpdateUtility.setInnerHTML(this.modalContent, productElement.outerHTML);

            const safeRun = (fn) => {
              try {
                fn();
              } catch (error) {
                console.error(error);
              }
            };

            safeRun(() => this.addDiscountBadge(opener));
            safeRun(() => this.addUrgencyBanner());
            safeRun(() => this.addPriceHighlight(opener));
            safeRun(() => this.groupOptionsAndQuantity());
            safeRun(() => this.addStockScarcity(opener));
            safeRun(() => this.addButtonsGlowBar());

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            super.show(opener);
          })
          .finally(() => {
            opener.removeAttribute('aria-disabled');
            opener.classList.remove('loading');
            opener.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      addDiscountBadge(opener) {
        const existing = this.modalContent.querySelector('.quick-add-modal__discount-badge');
        if (existing) existing.remove();

        const percent = parseInt(opener.getAttribute('data-discount-percent'), 10);

        const saleBadge = this.modalContent.querySelector('.price__badge-sale');
        if (saleBadge && percent > 0) {
          saleBadge.textContent = `-${percent}%`;
        }

        if (!percent || percent <= 0) return;

        const media = this.modalContent.querySelector('.product__media, .product-media-container');
        if (!media) return;

        const badge = document.createElement('div');
        badge.className = 'quick-add-modal__discount-badge';
        badge.textContent = `-${percent}%`;
        media.appendChild(badge);
      }

      addUrgencyBanner() {
        const parent = this.modalContent.parentElement;
        if (!parent) return;

        const existing = parent.querySelector('.quick-add-modal__urgency-banner');
        if (existing) existing.remove();

        const phrases = [
          '🔥 ¡Oferta por tiempo limitado!',
          '⚡ ¡Se están agotando rápido!',
          '🎉 ¡Envío gratis en este pedido!',
          '💥 ¡Precio especial solo por hoy!',
        ];

        const banner = document.createElement('div');
        banner.className = 'quick-add-modal__urgency-banner';

        const rotator = document.createElement('span');
        rotator.className = 'quick-add-modal__urgency-rotator';
        phrases.forEach((phrase, index) => {
          const span = document.createElement('span');
          span.textContent = phrase;
          span.style.animationDelay = `-${index * 2}s`;
          rotator.appendChild(span);
        });
        banner.appendChild(rotator);

        parent.insertBefore(banner, this.modalContent);
      }

      splitMoneyText(text) {
        const match = (text || '').trim().match(/^([^A-Za-z]+)\s*([A-Za-z]*)$/);
        if (!match) return { amount: (text || '').trim(), code: '' };
        return { amount: match[1].trim(), code: match[2].trim() };
      }

      formatThousands(number) {
        return String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }

      addPriceHighlight(opener) {
        const priceEl = this.modalContent.querySelector('.price');
        if (!priceEl) return;

        const existing = priceEl.previousElementSibling;
        if (existing && existing.classList.contains('quick-add-modal__price-highlight')) existing.remove();

        const percent = parseInt(opener.getAttribute('data-discount-percent'), 10);
        const saleEl = priceEl.querySelector('.price-item--sale');
        const compareEl = priceEl.querySelector('.price__sale s.price-item--regular');
        if (!percent || percent <= 0 || !saleEl || !compareEl) return;

        const sale = this.splitMoneyText(saleEl.textContent);
        const compare = this.splitMoneyText(compareEl.textContent);

        const saleDigits = parseInt(sale.amount.replace(/[^0-9]/g, ''), 10);
        const compareDigits = parseInt(compare.amount.replace(/[^0-9]/g, ''), 10);
        const savings = compareDigits - saleDigits;
        if (!savings || savings <= 0) return;

        const box = document.createElement('div');
        box.className = 'quick-add-modal__price-highlight';
        box.innerHTML = `
          <div class="quick-add-modal__launch-badge">PRECIO DE LANZAMIENTO: ¡APROVECHA!</div>
          <div class="quick-add-modal__trust-row">
            <span>✓ Pago contraentrega</span>
            <span>✓ Envío gratis</span>
            <span>✓ Calidad certificada</span>
          </div>
          <div class="quick-add-modal__price-row">
            <span class="quick-add-modal__price-main">${sale.amount}${sale.code ? `<span class="quick-add-modal__price-code">${sale.code}</span>` : ''}</span>
            <s class="quick-add-modal__price-compare">${compare.amount}</s>
            <span class="quick-add-modal__price-percent">-${percent}%</span>
          </div>
          <div class="quick-add-modal__savings">Estás ahorrando $${this.formatThousands(savings)}</div>
          <p class="quick-add-modal__shipping-note">🚚 Llega en 3 a 6 días hábiles · Pago al recibir</p>
        `;

        priceEl.parentElement.insertBefore(box, priceEl);
        priceEl.style.display = 'none';
      }

      groupOptionsAndQuantity() {
        const quantityBlock = this.modalContent.querySelector('.product-form__quantity');
        const variantSelects = this.modalContent.querySelector('variant-selects');
        if (!quantityBlock || !variantSelects) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'quick-add-modal__options-row';
        variantSelects.parentElement.insertBefore(wrapper, variantSelects);
        wrapper.appendChild(variantSelects);
        wrapper.appendChild(quantityBlock);
      }

      addStockScarcity(opener) {
        const existing = this.modalContent.querySelector('.quick-add-modal__stock-scarcity');
        if (existing) existing.remove();

        const buttons = this.modalContent.querySelector('.product-form__buttons');
        if (!buttons) return;

        const productUrl = opener.getAttribute('data-product-url') || '';
        let seed = 0;
        for (let i = 0; i < productUrl.length; i++) {
          seed = (seed * 31 + productUrl.charCodeAt(i)) % 1000;
        }
        const stockLeft = 3 + (seed % 13);
        const percentLeft = Math.max(20, 100 - stockLeft * 5);

        const wrapper = document.createElement('div');
        wrapper.className = 'quick-add-modal__stock-scarcity';
        wrapper.innerHTML = `
          <p>⚡ Quedan <strong>${stockLeft}</strong> unidades. ¡Rápido!</p>
          <div class="quick-add-modal__stock-bar" style="--fill: ${percentLeft}%;"></div>
        `;
        buttons.parentElement.insertBefore(wrapper, buttons);
      }

      addButtonsGlowBar() {
        const buttons = this.modalContent.querySelector('.product-form__buttons');
        if (!buttons) return;

        const existing = buttons.previousElementSibling;
        if (existing && existing.classList.contains('quick-add-modal__buttons-glow-bar')) existing.remove();

        const bar = document.createElement('div');
        bar.className = 'quick-add-modal__buttons-glow-bar';
        buttons.parentElement.insertBefore(bar, buttons);
      }

      preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
          if (classApplied.startsWith('color-') || classApplied === 'gradient')
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
      }

      preventVariantURLSwitching(productElement) {
        productElement.setAttribute('data-update-url', 'false');
      }

      removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
        Array.from(productElement.attributes).forEach((attribute) => {
          if (attribute.value.includes(oldId)) {
            productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
          }
        });

        productElement.dataset.originalSection = sectionId;
      }

      removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
      }

      updateImageSizes(productElement) {
        const product = productElement.querySelector('.product');
        const desktopColumns = product?.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
          '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
      }
    }
  );
}
