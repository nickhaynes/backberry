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
        <h3> Description</h3>
        <p>${phoneObj[x].shortDescription}</p>
        <h3> Features </h3>
        <ul>
            <li>${phoneObj[x].family} family, ${phoneObj[x].series} series</li>
            <li>Carrier and Network: ${phoneObj[x].network}, ${phoneObj[x].carrier}</li>
            <li>${phoneObj[x].screenSize} pixel ${phoneObj[x].color} display</li>
            <li>${phoneObj[x].padBallWheel} cursor</li>
            <li>Touchscreen: ${phoneObj[x].touchscreen}</li>
            <li>Bluetooth: ${phoneObj[x].bluetooth}</li>
            <li>Extra Features: ${phoneObj[x].extraFeatures}</li>
        </ul>
        <section class="buyPhone"
            <p>$${phoneObj[x].price}</p>
            <?php require_once('./config.php'); ?>

            <form action="charge.php" method="post">
                <script src="https://checkout.stripe.com/checkout.js" class="stripe-button"
                    data-key="<?php echo $stripe['publishable_key']; ?>"
                    data-description="${phoneObj[x].title}, ID ${phoneObj[x].uniqueID}"
                    data-amount="${phoneObj[x].price}"
                    data-locale="auto"></script>
                </form>
        </section>
    `;
    mainProduct.innerHTML = productCode;
});