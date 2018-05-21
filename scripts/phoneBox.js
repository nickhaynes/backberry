const Curve8330 = {
    uniqueID:'x4589',
    title:'Blackberry Curve 8330',
    picture:'8330',
    family:'Curve',
    model:'8330',
    series:'8000',
    color:'Color LCD',
    screenSize:'320 x 240 pixels',
    bluetooth:'no',
    carrier:'T-Mobile',
    touchscreen:'true',
    padOrBall:'ball',
    extraFeatures:'SMS/MMS, Email, Push Email, IM, HTML browser, maps, MP4/WMV/H.264 player, MP3/WAV/eAAC+/WMA player, Organizaer, Voice memo/dial/commands, Predictive text input, removable battery',
    network:'CDMA, Dual-band 800/1900 MHz CDMA2000 1X EV-DO networks',
    shortDescription:'The Blackberry Curve brand continued the re-orientation of Blackberry to the consumer, following the Pearl and 8800 series.  The Curve 8330 was the first Curve launched for CDMA networks.',
    price:29.08
};

const testModel = {
    uniqueID:'y8476',
    title:'tester',
    picture:'tester',
    family:'tester',
    model:'tester',
    series:'8000',
    color:'tester LCD',
    screenSize:'320 x 240 testers',
    bluetooth:'no',
    carrier:'T-Tester',
    touchscreen:'true',
    padOrBall:'ball',
    extraFeatures:'SMS/MMS, Email, Push Email, IM, HTML browser, maps, MP4/WMV/H.264 player, MP3/WAV/eAAC+/WMA player, Organizaer, Voice memo/dial/commands, Predictive text input, removable battery',
    network:'CDMA, Dual-band 800/1900 MHz CDMA2000 1X EV-DO networks',
    shortDescription:'The Blackberry Curve brand continued the re-orientation of Blackberry to the consumer, following the Pearl and 8800 series.  The Curve 8330 was the first Curve launched for CDMA networks.',
    price:29.08
};

let phones = [Curve8330, testModel];

let results = [];

$(document).ready(function() {

    function createPhoneBox(phone) {
        let phoneHTML = 
            `<div class="phoneBox">
                <h3>${phone.title}</h3>
                <img src="images/${phone.picture}.png" alt="${phone.title}">
                <ul class="details">
                    <li><span class="deets">Series: </span>${phone.series}</li>
                    <li><span class="deets">Screen: </span>${phone.color}, ${phone.screenSize}</li>
                    <li><span class="deets">Carrier: </span>${phone.carrier}</li>
                </ul>
                <p class="price">${phone.price}</p>
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
    };

    $( "div.placeholder" ).html(renderPhones(phones)) 
        return $(this);
    });
;