/*************************************************************************/
//Contenu dans le JS de la page aha
/*************************************************************************/

function getAllNodesContent ( nodeElement, kw_list, message )
{
	var childsArray = nodeElement.childNodes;
	var pass = 1;
	var returnValue = "unlocked";

	for(var i = 0; i < childsArray.length; i++){
		if ( childsArray[i].nodeName != "SCRIPT" && childsArray[i].nodeName != "IFRAME" && childsArray[i].nodeName != "IMG" && childsArray[i].nodeName != "A" ) {
			/*if ( childsArray[i].nodeName == "A" )
			{
				pass = 0;
				if ( window.location.host == childsArray[i].host ){
					pass = 1;
				}
			}*/
			if ( pass == 1 ){
				if(childsArray[i].hasChildNodes()){
					returnValue = getAllNodesContent ( childsArray[i], kw_list, message );
					if ( returnValue == "locked" ){
						return "locked";
					}
				}else {
					if ( childsArray[i].nodeName == "#text" ) {
						returnValue = getAllWordsFromText ( childsArray[i].textContent, kw_list, message , "content");
						if ( returnValue == "locked" ){
							return "locked";
						}
					}
				}
			}
		}	
	}
	if ( document.body == nodeElement )
	{
	    var url_words = new Array();
	    if(top!=window)
	    {
		var str= document.referrer;
	    }
	    else
	    {
	        var str = document.location.href;
	    }
            var res1 = str.split("-");
            for(var i= 0; i < res1.length; i++)
            {
                var res2 = res1[i].split("_");
                for(var j= 0; j < res2.length; j++)
                {
                    var res3 = res2[j].split(".");
                    for(var k= 0; k < res3.length; k++)
                    {
                        var res4 = res3[k].split("/");
                        for(var l= 0; l < res4.length; l++)
                        {
                            var res5 = res4[l].split("&");
                            for(var m= 0; m < res5.length; m++)
                            {
                                var res6 = res5[m].split("=");
                                for(var n= 0; n < res6.length; n++)
                                {
                                    if ( typeof(res6[n]) != "undefined" && res6[n] != "" && res6[n] != "\n" ) {
                                        url_words.push(res6[n].replace("%20", " ").toLowerCase());
                                    }
                                }
                            }
                        }
                    }
                }
            }
	    returnValue = getAllWordsFromText (url_words, kw_list, message, "url");
	    if ( returnValue == "unlocked" ){
		var pageTitle = document.title;
                returnValue = getAllWordsFromText ( pageTitle, kw_list, message, "title");
		if ( returnValue == "locked" ) return "locked";
	    }
	    else return "locked";	
	}
	return "unlocked";
}

// sample mode Array contient les mots de l'url. sample en string est un bloc de test
function getAllWordsFromText (sample, array_words, message, type) 
{
	// remplacement de tous les signes de ponctuation (suite de signes ou signe isolé) par un whitespace
	if(typeof sample == "object") contenu = sample;
	else contenu = (sample.toLowerCase()).replace(/[\.,-\/#!$%\^&\*;:{}=\-_'`~()]+/g, ' ');
	
	var blocking_keyword = "";
	var blocking_keywords_nb = array_words.length;

	for ( var i = 0; i < blocking_keywords_nb; i ++ ) {

                var word = array_words[i];
                var word_splitted = word.split("+");
		//tous les mots de la combinaison doivent etre dans le texte
                if( word_splitted.length > 1 ){

                    var nb_occ   = 0;
                    for ( var j = 0; j < word_splitted.length; j ++ ) {
			final_word = (typeof sample !== "object") ? " "+word_splitted[j].toLowerCase()+" " : word_splitted[j].toLowerCase();
                        nb_occ += contenu.indexOf(final_word) > 0 ? 1 : 0;
                    }
                    if(nb_occ  == word_splitted.length) blocking_keyword = word;
                }
		//mot simple
		else{
		    final_word = ( typeof sample !== "object") ? " "+word.toLowerCase()+" " : word.toLowerCase();
                    if( contenu.indexOf(final_word) >= 0 ) blocking_keyword = word;
                }

		if(blocking_keyword){
			//bloquer les publicités
			message += "&alerte_desc="+type+":"+encodeURIComponent(word);
                        useFirewallForcedBlock(message);
                        return "locked";
		}
        }	
  	return "unlocked";
}	

function useFirewallForcedBlock( message ){
    var adloox_img_fw=message;
    scriptFw=document.createElement("script");
    scriptFw.src=adloox_img_fw;
    document.body.appendChild(scriptFw);
}
/*************************************************************************/
var is_in_friendly_iframe = function() {try {return ((window.self.document.domain == window.top.document.domain) && (self !== top));} catch (e) {return false;}}();
var win_t = is_in_friendly_iframe ? top.window : window;var firstNode = win_t.document.body;var contentTab_2 = ["act+of+terror","Devin+Patrick+Kelley+gunman","First+Baptist+Church+Sutherland+Springs","gun","gun+shot","gunman+las+vegas","gunshot","gunshot+las+vegas","gunshot+mandalay","gunshot+mandalay+bay","gunshot+vegas","gunshots","homicide","hotel+arson","hotel+attack","hotel+bomb","hotel+dead","hotel+death","hotel+fire","hotel+police","hotel+stabbed","isis-related","jihadism","las+vegas+killed","lone-wolf+attack","lone-wolf+attacks","man+killed","manhattan+truck+attack","mass+casualities","mass+shooting","mass+shooting+las+vegas","men+killed","murder","murdered","new+york+attack","New+york+rampage","new+york+terror","new+york+terrorist","NY+attack","NYC+attack","NYC+terror","NYC+terrorist","Parkland+fatalities","Parkland+shooter","people+died","people+killed","radical+islam","radical+islamic+tactics","rape","rapist","robbery","Sayfullo+Habibullaevic","sayfullo+saipov","shooting","shooting+las+vegas","shooting+mandalay","shooting+mandalay+bay","shooting+vegas","shots+fired","stephen paddock","stephen+paddock","Sutherland+Springs+shooting","terror+attack","Texas+church+shooting","truck+attack","vehicle+as+weapon","vehicles+as+weapons","victim","victims","woman+killed","women+killed"];
var message_2 = "//datam25.adlooxtracking.com/ads/ic.php?ads_forceblock=1&log=1&adloox_transaction_id=&adloox_io=0&bp=&visite_id=5703612917&client=ignitionone_us_dcm&ctitle=&id_editeur=4529201_ADLOOX_ID_20546150_ADLOOX_ID_210870539_ADLOOX_ID_1495450_ADLOOX_ID_100452331&banniere=ig1dcmdisplay&campagne=ignitionone_us_dcm&os=&navigateur=&appname=Netscape&timezone=300&fai=frame%20without%20title&alerte=&alerte_desc=&data=-143538408tttttttttttfttttttftftfftttfttttf&js=undefined&fw=1&version=2&iframe=1&hadnxs=&plat=0&ua=Mozilla%2F5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_13_3%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F66.0.3359.181%20Safari%2F537.36&url_referrer=https%3A%2F%2Fwww.w3schools.com%2Fjquery%2Fexercise.asp%3Ffilename%3Dexercise_css1&resolution=2560x1440&nb_cpu=4&nav_lang=en-US&date_regen=2017-04-26%2009%3A29%3A04&debug=6%3A%20top%20%21%3D%20window%20-%3E%20document.referrer%20https%3A%2F%2Ftpc.googlesyndication.com%2Fsafeframe%2F1-0-27%2Fhtml%2Fcontainer.html&ao=https%3A%2F%2Fwww.w3schools.com&fake=010000&popup=unnamed&p_d=882";getAllNodesContent ( firstNode, contentTab_2, message_2 );
var adloox_impression=1;