const deleteProduct = btn => {
	console.log('clicked!');
  const prodId = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  const productElement = btn.closest('article');

	console.log(prodId,csrf,productElement);

	// THE CSURF PACKAGES ALSO LOOKS FOR THE 'csrf-token' KEY IN THE HEADERS
  fetch('/admin/product/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      console.log(data);
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    });
};
