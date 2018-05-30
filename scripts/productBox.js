$(document).ready(function() {
    let mainProduct = document.querySelector('#main');
    let p = mainProduct.dataset.type;
    let mainPhone;
    console.log(mainProduct);
    console.log(mainPhone);
    if (p = "Curve8330") {
        mainPhone = Curve8330; 
     } else if (p = "Quark6230") {
         mainPhone = Quark6230;
     } else if (p = "Pearl8120") {
        mainPhone = Pearl8120;
    } else if (p = "BoldTouch9900") {
        mainPhone = BoldTouch9900;
    } else if (p = "Curve8310") {
        mainPhone = Curve8310;
    } else if (p = "Bold9000") {
        mainPhone = Bold9000;
    } else if (p = "BlackBerry7230") {
        mainPhone = BlackBerry7230;
    }; 
    productCode = `
        <h2>BlackBerry ${mainPhone.title}</h2>
        <img src="../images/${mainPhone.picture}.png">
    `;
    mainProduct.innerHTML = productCode;
});