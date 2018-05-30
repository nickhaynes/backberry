$(document).ready(function() {
    let mainProduct = document.querySelector('#main');
    let mainPhone = mainProduct.dataset.type;
    console.log(mainProduct);
    console.log(mainPhone);
    productCode = `
        <h2>BlackBerry ${mainPhone.title}</h2>
        <img src="../images/${mainPhone.picture}.png">
    `;
    mainProduct.innerHTML = productCode;
});