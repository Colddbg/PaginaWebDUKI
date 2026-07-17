document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product').forEach((product) => {
    if (product.closest('quick-add-modal')) return;

    const quantityBlock = product.querySelector('.product-form__quantity');
    const variantSelects = product.querySelector('variant-selects');
    if (quantityBlock && variantSelects && !quantityBlock.closest('.product-options-row')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'product-options-row';
      variantSelects.parentElement.insertBefore(wrapper, variantSelects);
      wrapper.appendChild(variantSelects);
      wrapper.appendChild(quantityBlock);
    }

  });

  document.querySelectorAll('.product-description-images img').forEach((img) => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
});
