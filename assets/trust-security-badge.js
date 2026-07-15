document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.trust-security-badge').forEach((badge) => {
    const productForm = badge.closest('.product')?.querySelector('product-form');
    if (!productForm) return;
    if (productForm.nextElementSibling !== badge) {
      productForm.parentElement.insertBefore(badge, productForm.nextSibling);
    }
  });
});
