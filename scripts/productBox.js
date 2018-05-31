$(document).ready(function() {
    let mainProduct = document.querySelector('#main');
    let pIndex = mainProduct.dataset.type;
    let x;
    let p;
    let phone;
    
    function assignPhone(p) {
        if (p="0") {
            x=0;
        } else if (p="1") {
            x=1;
        }
        let phone = x;
        return phone;
    };
    
    assignPhone(pIndex);

    console.log(pIndex);
    console.log(x);
    console.log(mainProduct);
    console.log(phone);


    productCode = `
        <h2>BlackBerry ${p.title}</h2>
        <img src="../images/${p.picture}.png">
    `;
    mainProduct.innerHTML = productCode;
});