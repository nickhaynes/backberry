
$(document).ready(function() {

    function createPhoneBox(phone) {
        let phoneHTML = 
            `<div class="phoneBox">
                <a href="products/${phone.uniqueID}.html" class="title">${phone.title}</a>
                <a href="products/${phone.uniqueID}.html"><img src="images/${phone.picture}.png" alt="${phone.title}"></a>
                <ul class="details">
                    <li><span class="deets">Series: </span>${phone.series}</li>
                    <li><span class="deets">Screen: </span>${phone.color}, ${phone.screenSize} pixels</li>
                    <li><span class="deets">Carrier: </span>${phone.carrier}</li>
                </ul>
                <p class="price"><a href="products/${phone.uniqueID}.html" class="price">$${phone.price}</a></p>
            </div>`;
        return phoneHTML;
    };
    
    function renderPhones(phones) {
        let currentPhone = '';
        for (let phone of phones) {
            currentPhone=createPhoneBox(phone);
            results.push(currentPhone);
        };
        return results;
        console.log(results);
    };

    $( "div.placeholder" ).html(renderPhones(phones)) 
        return $(this);
    });
;