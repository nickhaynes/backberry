$(document).ready(function() {
    let mainProduct = document.querySelector('#main');
    let pIndex = mainProduct.dataset.type;
    let x;
    let p;
    
    function assignPhone(p) {
        if (p=="Curve8330") {
            x=0;
        } else if (p=="Quark6230") {
            x=1;
        } else if (p=="BoldTouch9900") {
            x=2;
        } else if (p=="Pearl8120") {
            x=3;
        } else if (p=="Curve8310") {
            x=4;
        } else if (p=="Bold9000") {
            x=5;
        } else if (p=="BlackBerry7230") {
            x=6;
        }
        return x;
    };
    
    assignPhone(pIndex);

    console.log(x);
    console.log(phoneObj[x]);
    console.log(phoneObj[x].uniqueID);


    productCode = `
        <h2>BlackBerry ${phoneObj[x].title}</h2>
        <section class="mainImage"><img src="../images/${phoneObj[x].picture}.png"></section>
        <section class="phoneAttributes">
        <ul>
            <li>Family: ${phoneObj[x].family}, ${phoneObj[x].series} series</li>
            <li>Carrier and Network: ${phoneObj[x].network}, ${phoneObj[x].carrier}</li>
            <li>Display: ${phoneObj[x].screenSize} pixels, ${phoneObj[x].color}</li>
            <li>Touchscreen: ${phoneObj[x].touchscreen}</li>
            <li>Bluetooth: ${phoneObj[x].bluetooth}</li>
            <li>Cursor Type: ${phoneObj[x].padBallWheel}</li>
            <li>Extra Features: ${phoneObj[x].extraFeatures}</li>
        </ul>
        <section class="phoneDescription">${phoneObj[x].shortDescription}</section>
        <section class="buyPhone">${phoneObj[x].price}</section>
    `;
    mainProduct.innerHTML = productCode;
});