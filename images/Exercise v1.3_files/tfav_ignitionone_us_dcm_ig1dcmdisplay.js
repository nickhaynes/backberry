var adloox_getAd;
var adloox_getVisi;

(function(window, document, navigator, screen, undefined){

try {
    if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = [];

        for (var i in obj)
            if (Object.prototype.hasOwnProperty.call(obj, i))
                keys.push(i);

        return keys;
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++)
            if (from in this && this[from] === elt)
                return from;

        return -1;
    };
}

    var noop = function(){};
var NDEBUG = true;
var LOG = function(){
    if (NDEBUG || typeof console == 'undefined')
        return;

    var args = Array.prototype.slice.call(arguments);
    args.unshift('com.adloox.JS:');

    Function.prototype.apply.call(console.log, console, args);
};

// adunit -> geometry -> rect -> ... -> impression
// N.B. we do not dispatch inline as this could mask bugs
// N.B. we dispatch events when possible as newer browsers throttle setTimeout
// N.B. we do not use fireEvent on IE as it has to be attached to the DOM (spoofing!)
var ev = document.createElement('a');
var evcb = function(d){
    try {
        var cb = fire.cb[d.name];
        if (!cb) return;
        var n = cb.length;
        while (n-->0) cb[n](d.detail);
    } catch(_) {
        var js = typeof myelement == 'object' ? myelement.src : '';
        (new Image()).src = 'https://'+servername+'/ads/err.php?client='+escape(cname)+'&js='+escape(js)+'&visite_id='+escape(visite_id)+'&err='+escape('fire ' + d.name + ': ' + _.message);
        LOG(_.message);
    }
};
var unloading = false;
var fire = function(name, detail){
    detail = detail || {};
    if (unloading)						// immediate (ie. IE 8)
        evcb({ name: name, detail: detail });
    else if (typeof window.CustomEvent == 'function')
        ev.dispatchEvent(new CustomEvent('e', { detail: { name: name, detail: detail } }))
    else if (typeof document.createEvent == 'function') {	// old webkit and newer IE
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent('e', false, true, { name: name, detail: detail });
        ev.dispatchEvent(e);
    } else
        window.setTimeout(function(){ evcb({ name: name, detail: detail }) }, 0);
};
fire.cb = {};
if (typeof window.CustomEvent == 'function' || typeof document.createEvent == 'function')
    ev.addEventListener('e', function(e){ evcb(e.detail) });
var subscribe = function(name, cb){
    if (fire.cb[name])
        fire.cb[name].push(cb)
    else
        fire.cb[name] = [ cb ];
};
var unsubscribe = function(name, cb){
    if (!fire.cb[name]) return;
    var pos = fire.cb[name].indexOf(cb);
    if (pos != -1) fire.cb[name].splice(pos, 1);
};

var parseUri = function(u){
    var a = document.createElement('a');
    a.href = u;
    return a;
};

var fixedEncodeURIComponent = function(s){
    return encodeURIComponent(s).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

var o2qs = function(o){
    var a = [];
    var k = Object.keys(o);
    for (var i = 0; i < k.length; i++)
        a.push(fixedEncodeURIComponent(k[i])+'='+fixedEncodeURIComponent(o[k[i]]));
    return a.join('&');
};

var qs2o = function(qs){
    var o = {};

    if (!qs.length)
      return o;

    var p = qs.split('&');
    for (var i = 0; i < p.length; i++) {
        var m = p[i].split('=', 2);
        o[decodeURIComponent(m[0])] = decodeURIComponent(m[1]);
    }

    return o;
};

var sendData = function(u, o){
    var l = u + '?' + o2qs(o);

    if (navigator.sendBeacon)        // someone can be naughty
        delete navigator.sendBeacon;
    if (typeof navigator.sendBeacon == 'function' && navigator.sendBeacon(l)) {    // Chrome max ~300ms
        LOG('sendData() via sendBeacon()');
        return;
    }

    var oReq = new XMLHttpRequest();
    try {
      oReq.open('GET', l, false);
      oReq.send();
      LOG('sendData() via sync XMLHttpRequest()');
      return;
    } catch(_) {
      LOG('sendData() via sync XMLHttpRequest() failed, using fallback');
    }

    (new Image()).src = l;	// Chrome max ~40ms
    LOG('sendData() via Image()');
};

var getRect = function(el){
    var pi = function(i){
        return parseInt(i,10);
    };

    var rect = el.getBoundingClientRect();
    rect = {
       right: pi(rect.right),
       left: pi(rect.left),
       bottom: pi(rect.bottom),
       top: pi(rect.top),
       width: pi(rect.right - rect.left),
       height: pi(rect.bottom - rect.top),
       margin: {}
    };

    switch (type_crea) {
    case 1:	// include margin (eg. takeover)
        if(el.currentStyle) {
            var cs = el.currentStyle;
            var f = function(T){
                var t = T.toLowerCase()
                var v = pi(cs['margin'+T]);
                rect.margin[t] = isNaN(v) ? 0 : v;
            };

            f('Left'); f('Right'); f('Top'); f('Bottom');
        } else {
            var cs = el.ownerDocument.defaultView.getComputedStyle(el);
            var f = function(t){
                var v = pi(cs.getPropertyValue('margin-'+t));
                rect.margin[t] = isNaN(v) ? 0 : v;
            };

            f('left'); f('right'); f('top'); f('bottom');
        }
        break;
   }

   if (type_crea) {
       if (!rect.width)
           rect.width = rect.margin.right + rect.margin.left;
       if (!rect.height)
           rect.height = rect.margin.top + rect.margin.bottom;
   }

   return rect;
};

var now = function(){
   return (new Date()).valueOf();
};

    // https://youtu.be/bb11Tz3xVKY
var wabbit_hunter = function(el){
  var blacklist = function(el){
    // AdForm delete their placeholders and use new ones
    if ((el.id || '').match(/^\+ADFP/))
      return true;
    return false;
  };

  // cater for vendors who bump up the adunit by a few pixels
  var normalize = function(n){
    return ((n / 10) | 0) * 10;
  };
  var getRectNormalize = function(el){
    var r = getRect(el);
    r.width = normalize(r.width);
    r.height = normalize(r.height);
    return r;
  };

  var iabsize = function(el){
    // N.B. rounded down to nearest 10
    var c = {
      // page take over top video unit
      '390x220': 1,
      // various places
      '320x240': 1,
      '320x250': 1,
      // http://www.iab.com/wp-content/uploads/2015/11/IAB_Display_Mobile_Creative_Guidelines_HTML5_2015.pdf
      '970x250': 1,
      '320x50': 1,
      '120x20': 1,
      '160x20': 1,
      '210x30': 1,
      '300x600': 1,
      '300x1050': 1,
      '970x90': 1,
      '300x250': 1,
      '180x150': 1,
      '160x600': 1,
      '720x90': 1,
      '970x60': 1,
      '120x60': 1,
      '80x30': 1,
      '600x250': 1,
      '600x150': 1,
      '600x600': 1,
      '720x310': 1,
      '550x480': 1
    };

    var r = getRectNormalize(el);
    return !!c[r.width+'x'+r.height];
  };

  var check = function(el){
    switch(el.tagName){
    case 'ARTICLE':	// some native environments use this
      return !blacklist(el) && goodsize(el);
    case 'VIDEO':
      if (typeof el.canPlayType != 'function' && !el.duration)
        return false;
      // fall through
    case 'IMG':
    case 'CANVAS':
    case 'OBJECT':
    case 'EMBED':
    case 'IFRAME':
    case 'DIV':
      if (!blacklist(el) && goodsize(el) && iabsize(el))
        return true;
      break;
    }
  };

  var hunt = function(el){
    var prev = next = el;

    while (1) {
      if (prev) {
        prev = prev.previousSibling;
        if (prev && check(prev))
          return prev;
      }
      if (next) {
        next = next.nextSibling;
        if (next && check(next))
          return next;
      }

      if (!prev && !next) {
        var p = el.parentNode;
        if (p && p.tagName != 'HEAD' && p.tagName != 'BODY') {
          el = p;
          if (check(el))
            return el;
          prev = next = el;
        } else
          break;
      }
    }

    return null;
  };

  var goodsize_ignore_height = function(el, r){	// element might not be filled yet!
    var d = el.ownerDocument.documentElement;
    return r.width >= largeur && r.width <= d.clientWidth && r.height <= d.clientHeight;
  };
  var goodsize = function(el){
    var r = getRectNormalize(el);
    return r.height >= hauteur && goodsize_ignore_height(el, r);
  };

  var fallback = function(el){
    while (el) {
      if (!blacklist(el) && goodsize(el))
        return el;

      var p = el.parentNode;
      if (!p || p.tagName == 'HEAD' || p.tagName == 'BODY')
        break;

      el = p;
    }

    return null;
  };

  var target = function(){
    var s = Array.prototype.slice;
    var b = [ document ];
    try {
      var win = window;
      while (win != window.top && typeof win.parent.document == 'object'){
        win = win.parent;
        b = b.concat([win.document]);
      }
    } catch(_) {};

    var ids = typeof adloox_target == 'string' ? [adloox_target] : targetted_ids;
    for (var i = 0; i < ids.length; i++) {
      var target = ids[i];

      for (var j = 0; j < b.length; j++) {
        var t = [];
        var base = b[j];

        var tt = base.getElementById(target);
        if (tt != null)
          t = t.concat([tt]);

        var tt = base.getElementsByClassName(target);
        t = t.concat(s.call(tt));

        var tt = base.querySelector(target);
        if (tt != null)
          t = t.concat([tt]);

        for (var k = 0; k < t.length; k++) {
          if (goodsize_ignore_height(t[k], getRectNormalize(t[k])))
            return t[k];
        }
      }
    }

    return null;
  };

  var ad = target();
  if (!ad && !el)
    return document.body;
  if (!ad)
    ad = hunt(el);
  if (!ad) {
    try {
      ad = hunt(window.frameElement);
    } catch(_) {}
  }
  if (!ad)
    ad = fallback(el);
  if (!ad) {
    try {
      ad = fallback(window.frameElement);
    } catch(_) {}
  }
  if (!ad) {
    var b = el.ownerDocument.body;
    if (goodsize(b))
      ad = b;
  }

  return ad;
};

    /*
    * == BOT ==
    * */


    /**
 * Detect a potential fake browser
 * Returns a string taking the following values:
 *  - "fake=no" : no fake detected
 *  - "fake=fake_browser" : browser detected does not match the declared user agent
 *  - "fake=fake_screen" : if inside a iframe, the size of the screen is null
 * The last two values can be combined : "fake=fake_browserfake_screen"
 */
var detectFake = function(){
    var isOpera = !! window.opera;
    var isFirefox = typeof InstallTrigger !== "undefined";
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0;
    var isChrome = !! window.chrome && !isOpera;
    var isIE = new Function("return /*@cc_on!@*/!1")() || !!document.documentMode;

    var fakeScreen = false;
    if ( is_iframe != 1) {
        if ( ((screen.height == 0 && screen.width == 0) || window.devicePixelRatio == 0) ) {
            fakeScreen = true;
        }
    }

    return (isOpera ? '1' : '0')
        + (isChrome ? '1' : '0')
        + (isFirefox ? '1' : '0')
        + (isIE ? '1' : '0')
        + (isSafari ? '1' : '0')
        + (fakeScreen ? '1' : '0');
};

        var cmp_id = "ignitionone_us_dcm";
    var cmp_id_date = cmp_id+'_ADLOOX_DATE';
    var ban_id = "ig1dcmdisplay";
    var tab_nom = "ignitionone_us_dcm";
    var cname = "ignitionone_us_dcm";
    var version = "-dirty";
    var date_regen = "2017-04-26 09:29:04";
    var platform = "0";
    var adlooxio = 0;
    var fw_version = "2";
    var has_fw = "1";
    var type_crea = 6;
    var targetted_ids = [];;
    var tx_visi = 0.5;
    var tx_visi2 = (typeof tx_visi2 !== "undefined") ? tx_visi2 : 0.5;
    var sec_visi = 1;
    var sec_visi2 = (typeof sec_visi2 !== "undefined") ? sec_visi2 : 1;
        var visite_id = Math.floor((Math.random() * 100000000000) + 1);
    var has_visi = true;
    var v_ic = "ic.php";
    var methode = "";
    var video = "";
    var transaction_id = "";
    var hash_adnxs  = "";
    var adnxs       = "";
    var saute_title = false;
    var title       = document.title !== undefined ? document.title : "";;
    var url_ref2    = "";
    var js_obj      = {};
    var alerte_desc = "";
    var alerte_finale = "";
    var hash_adnxs    = "";
    var resolution = screen.width + "x" + screen.height;
    var nb_cpu = '';
    try {	// firefox gives 'permission denied'
        nb_cpu = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : "";
    } catch (_) {}
    var nav_lang =navigator.language !== undefined ? navigator.language : "";
    var fwed          = false;
    var loadbalancing = ['datam01.adlooxtracking.com','datam02.adlooxtracking.com','datam03.adlooxtracking.com','datam04.adlooxtracking.com','datam05.adlooxtracking.com','datam06.adlooxtracking.com','datam07.adlooxtracking.com','datam09.adlooxtracking.com','datam10.adlooxtracking.com','datam18.adlooxtracking.com','datam17.adlooxtracking.com','datam11.adlooxtracking.com','datam12.adlooxtracking.com','datam13.adlooxtracking.com','datam14.adlooxtracking.com','datam15.adlooxtracking.com','datam16.adlooxtracking.com','datam19.adlooxtracking.com','datam20.adlooxtracking.com','datam21.adlooxtracking.com','datam22.adlooxtracking.com','datam23.adlooxtracking.com','datam24.adlooxtracking.com','datam25.adlooxtracking.com','datam26.adlooxtracking.com'];
    var loadbalancing_inv = ['data06.adlooxtracking.com','data07.adlooxtracking.com','data05.adlooxtracking.com','data01.adlooxtracking.com','data02.adlooxtracking.com','data03.adlooxtracking.com','data04.adlooxtracking.com','data134.adlooxtracking.com','data12.adlooxtracking.com','data13.adlooxtracking.com','data08.adlooxtracking.com','data09.adlooxtracking.com','data10.adlooxtracking.com','data11.adlooxtracking.com','data14.adlooxtracking.com','data53.adlooxtracking.com','data68.adlooxtracking.com','data55.adlooxtracking.com','data56.adlooxtracking.com','data58.adlooxtracking.com','data57.adlooxtracking.com','data15.adlooxtracking.com','data16.adlooxtracking.com','data17.adlooxtracking.com','data18.adlooxtracking.com','data19.adlooxtracking.com','data20.adlooxtracking.com','data21.adlooxtracking.com','data22.adlooxtracking.com','data23.adlooxtracking.com','data24.adlooxtracking.com','data25.adlooxtracking.com','data26.adlooxtracking.com','data27.adlooxtracking.com','data28.adlooxtracking.com','data29.adlooxtracking.com','data30.adlooxtracking.com','data31.adlooxtracking.com','data39.adlooxtracking.com','data33.adlooxtracking.com','data34.adlooxtracking.com','data35.adlooxtracking.com','data36.adlooxtracking.com','data37.adlooxtracking.com','data38.adlooxtracking.com','data67.adlooxtracking.com','data66.adlooxtracking.com','data62.adlooxtracking.com','data60.adlooxtracking.com','data61.adlooxtracking.com','data63.adlooxtracking.com','data64.adlooxtracking.com','data65.adlooxtracking.com'];
    var appnexus_us = ['magneticmediaonline_adnxs'];
    var hauteur = 0 || 20;
    var largeur = 0 || 20;
    var p_d = window.performance ? now() - performance.timing.navigationStart : -1;

   
    var inFriendlyIframe = function() {
        try {
            if( window.frameElement.id.indexOf('sas_')==0 && type_crea !== 1 )
            {
                //smartadserver : force iframe 1
                return false;
            }
            else
            {
                return ((window.self.document.domain == window.top.document.domain) && (self !== top));
            }
        } catch (e) {
            return false;
        }
    }();

        var tabname = window['tab_adloox_alerte_id_'+tab_nom] || window['tab_adloox_alerte_id_'+cname] || false;
    
    // return our own script element
    var myelement = (function(){
        if (document.currentScript)
            return document.currentScript
                var re = new RegExp('/(?:tmp_)?t[fav]+_'+cmp_id+'_'+ban_id+'\\.js[#?]?');
                var sc = document.scripts;
        var i = sc.length;
        while (i-->0) {	// *reverse* as if multiple Adloox tracked ads on page, *this* script will be the last one
            if (!sc[i] || !sc[i].src)
                continue;
            var res = sc[i].src.match(re);
            if (!res)
                continue;
            return sc[i];
        }

        return null;
    })();

    var geometry = function(){
        LOG("geometry");
        if (geometry.timer || geometry.resizing)
            return;

        geometry.resizing = true;
        geometry.timer = window.setTimeout(function(){
            delete geometry.timer;
            fire('geometry');
        }, 100);
    };

    var adunit = {};
    (function adunithunt(){
        adunit.el = wabbit_hunter(myelement);
        if (!adunit.el) {
            LOG("adunit not found, polling...");
            window.setTimeout(adunithunt, 100);
            return;
        }
        else
        {
        adloox_getAd=adunit.el;
        }

        LOG("adunit: ", adunit.el);

        adunit.win = adunit.el.ownerDocument.defaultView || adunit.el.ownerDocument.parentWindow;

        subscribe('geometry', function(){
            LOG("geometry updating");

            adunit.rect = getRect(adunit.el);
            adunit.rect.custom = {	// FIXME
                x: parseInt((adunit.rect.width - (adunit.rect.width * Math.sqrt(tx_visi2))) / 2, 10),
                y: parseInt((adunit.rect.height - (adunit.rect.height * Math.sqrt(tx_visi2))) / 2, 10)
            };

            if (!adunit.proxy) {
                 // we have a proxy element so then some sensors (eg. visi animation)
                 // have something to attach to; and we make it an iframe for easy messaging
                 adunit.proxy = document.createElement('iframe');
                 adunit.proxy.frameBorder = 0;
                 adunit.proxy.scrolling = 'no';

                 // we try to add ourselves to the element as position:absolute/margin:auto
                 // on Firefox does not work; otherwise we try our best
                 switch (adunit.el.tagName) {
                 case 'BODY':
                 case 'DIV':
                     if (adunit.el.children.length == 0)
                         adunit.el.appendChild(adunit.proxy)
                     else
                         adunit.el.insertBefore(adunit.proxy, adunit.el.children[0]);
                     break;
                 default:
                     adunit.el.parentElement.insertBefore(adunit.proxy, adunit.el);
                 }

                 // FIXME listen for scroll/resize events on everything up to winmax
                 if (window.addEventListener) {
                     adunit.win.addEventListener('scroll', geometry);
                     adunit.proxy.contentWindow.addEventListener('resize', geometry)
                 } else {
                     adunit.win.attachEvent('onscroll', geometry);
                     adunit.proxy.contentWindow.attachEvent('onresize', geometry);
                 }
            }

            var style = '';

            if (adunit.el.contains(adunit.proxy)) {
                style += 'width:100%;height:100%;';	// FIXME when parent is not position:relative
                style += 'max-width:'+adunit.rect.width+'px;max-height:'+adunit.rect.height+'px;';	// HACK GUARD
                var t = [ 'left', 'right', 'top', 'bottom' ];
                var n = t.length;
                while (n-->0)
                    if (adunit.el.style.margin[t[n]])
                        style += t[n] + ':-' + adunit.el.style.margin[t[n]] + 'px;';
            } else {
                var s, d;
                var t = {};
                if (adunit.el.currentStyle) {
                    adunit.proxy.style.cssText = '';
                    s = adunit.el.currentStyle;
                    d = adunit.proxy.currentStyle;
                } else {
                    adunit.proxy.setAttribute('style', '');
                    s = {}, s0 = adunit.win.getComputedStyle(adunit.el);
                    var n = s0.length;
                    while (n-->0) s[s0[n]] = s0.getPropertyValue(s0[n]);
                    d = {}, d0 = adunit.win.getComputedStyle(adunit.proxy);
                    var n = d0.length;
                    while (n-->0) d[d0[n]] = d0.getPropertyValue(d0[n]);
                }
                for (var k in d)
                    t[k] = d[k];
                for (var k in s) {
                    if (t[k] == s[k])
                        delete t[k];
                    else
                        t[k] = s[k];
                }
                delete t.cssText;
                var k = Object.keys(t);
                var n = k.length;
                while(n-->0)
                    style += k[n] + ':' + t[k[n]] + ';';
            }

            style += 'position:absolute;';
            style += 'z-index:' + (parseInt(adunit.el.style.zIndex || '0', 10) + 1) + ';';
            style += 'pointer-events:none;';        // FIXME IE problems
            style += 'border:none;';
            style += 'background-color:transparent;';
            style += 'background-image:none !important;';

            if (adunit.el.currentStyle) {
                style += '-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=1)" !important;';
                adunit.proxy.style.cssText = style;
            } else
                adunit.proxy.setAttribute('style', style);

            window.setTimeout(function(){ delete geometry.resizing }, 0);

            fire('rect');
        });
        subscribe('adunit', function(){
            fire('geometry');		// start things moving
        });

        window.setTimeout(function(){	// yield to let others add their listeners
            fire('adunit');
        },0);
    })();
    // debug channel incase we cannot find the adunit
    subscribe('unload', function(){
        if (!unloading || adunit.el)
            return;

        var msg = 'no wabbit: ';

        var d = myelement ? myelement.ownerDocument : document.body.ownerDocument;
        var t = myelement ? 'myel' : 'body';

        var e = d.documentElement;
        var r = getRect(d.body);

        msg += t + '@' + r.width + 'x' + r.height + ' ('+e.clientWidth+'x'+e.clientHeight+')';
        (new Image()).src = 'https://'+servername+'/ads/err.php?client='+escape(cname)+'&js='+escape(js)+'&visite_id='+escape(visite_id)+'&err='+escape(msg);
    });

    //si le tableaux d'ids a ete defini dans la page, on le recupere sinon on essaye de le parser dans le hash de l'url
    var get_macro_urls = function(){
        if (!myelement)
            return [];
        var a = parseUri(myelement.src);
        return ((a.hash || a.search || '#').split('#')[1] || '').replace(/&amp;/g, '&').split('&');
    };

    var hFlash = (function(){
        var hasFlash = false;
        try {
            var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (fo) {
                hasFlash = true;
            }
        } catch (e) {
            if (navigator.mimeTypes
                    && navigator.mimeTypes['application/x-shockwave-flash'] != undefined
                    && navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                hasFlash = true;
            }
        }
        return hasFlash ;
    })();
    var macro_ids = (tabname) ? tabname : get_macro_urls();
    var tagco_arr = {};
    var params_v3 = [];
    var params_opt = {};
    // extract tagco var from macro_ids
    var extract_tagco = function(_ids){
        m_ids = typeof _ids !== "undefined" ? _ids : macro_ids;
        tmp_macros = [];
        var str_tagco = "";
        for(var i=0; i<m_ids.length ; i++){
            if( (m_ids[i].match(/^tagco_/))|| (m_ids[i].match(/^tc_/)) ){
                _m = m_ids[i].split("=");
                _m_key = _m[0];
                _m.shift();
                str_tagco += "&"+_m_key + "=" + escape(_m.join("="));
                if(m_ids[i].match(/^tc_/))
                {
                tagco_arr[_m_key.substring(3)] = escape(_m.join("="));
                }
                else
                {
                tagco_arr[_m_key.substring(6)] = escape(_m.join("="));
                }
            }else{
                var re = /(plat|plan|sup|adv)=/;
                if( m_ids[i].match(re) ){
                    params_v3.push(m_ids[i]);
                }else{
                    // version fw
                    var re_p = /(_ap_)[a-z]{1,}=/;
                    if( m_ids[i].match(re_p) ){
                        var p_opt = m_ids[i].split('=');
                        var k = p_opt[0].slice(4,p_opt[0].length);
                        var v = p_opt[1];
                        params_opt[k] = v;
                    }else{
                        tmp_macros.push(m_ids[i]);
                    }
                }
            }
        }
        if( typeof _ids === "undefined" ){
            macro_ids = tmp_macros;
        }
        return str_tagco;
    }
    var tagco_var = "";
    if( tabname ) {
        tagco_var = extract_tagco(get_macro_urls());
    }else{
        tagco_var = extract_tagco();
    }
    var get_tagco_transparent = function(){
        var imgs = document.getElementsByTagName("img");
        for(var i=0; i<imgs.length; i++){
            sc = imgs[i];
            var re = /http[s]?\:\/\/j.adlooxtracking\.com\/ads\/transparent.gif[#|\?](.*)/;
            var res = sc.src.match(re);
            if (res) {
                tvar = res[1];
                tvars  = tvar.split("&");
                    for(var j=0; j<tvars.length; j++){
                        _m = tvars[j].split("=");
                        _m_key = _m[0];
                        if(( _m_key.match(/^tagco_/)) || ( _m_key.match(/^tc_/))  ){
                            _m.shift();
                            tagco_arr[_m_key.substring(6)] = escape(_m.join("="));
                        }else{
                            macro_ids.push(_m_key);
                        }
                    }
                return tvar;
            }
        }
        return "";
    }
    if( tagco_var.match(/tagco_pixel/) ){
        tagco_var = get_tagco_transparent();
        extract_tagco(tagco_var);
    }

    var send_to_tagco = function(tagc_arr){
        var create_query = function(data) {
           var ret = [];
           for (var d in data)
              ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
           return ret.join("&");
        }
        var t_dom = tagc_arr["domain"];
        var t_ver = tagc_arr["version"] == 1 ? "" : tagc_arr["version"];
        delete tagc_arr["domain"];
        delete tagc_arr["version"];
        tagc_arr["imp_id"] = visite_id;
        var tc_url = "https://"+t_dom+"/v"+t_ver+"/?"+create_query(tagc_arr);
        var elt = document.createElement("img");
        elt.src = tc_url;
        document.body.appendChild(elt);
    }

    var paramsUrlV3 = params_v3.length > 0 ? "&"+params_v3.join("&") : "";
    var bidprice = "";
    
      //recuperation tableau transaction id
     try{
         transaction_id=tab_adloox_transaction_id_ignitionone_us_dcm[0];
        }
         catch(err){
        }


    var script_src = function(){
        try {
            js_obj = document.currentScript;
            if (js_obj != null && typeof js_obj.src !== "undefined") {
                var adloox_js = js_obj.src;
            }

        } catch (err) {
            var adloox_js = "";
        }
    }();
    //fonction detectant si l'user a flash
    function hazF(){
        if (navigator.plugins != null && navigator.plugins.length > 0){
            return navigator.plugins["Shockwave Flash"] && true;
        }
        if(~navigator.userAgent.toLowerCase().indexOf("webtv")){
            return true;
        }
        if(~navigator.appVersion.indexOf("MSIE") && !~navigator.userAgent.indexOf("Opera")){
            try{
                return new ActiveXObject("ShockwaveFlash.ShockwaveFlash") && true;
            } catch(e){}
        }
        return false;
    }
    var str_alerte_ids = "";
    if( macro_ids instanceof Array ){
        str_alerte_ids = macro_ids.join("_ADLOOX_ID_").replace(/ /gi, "_");
    }
    var servername = loadbalancing[Math.floor(Math.random() * loadbalancing.length)];
    var adloox_deja_scan = adloox_deja_scan || 0;
    var is_iframe = 0;
    //custom function like php strrpos
    var adloox_strrpos = function (haystack, needle, offset) {
        var adloox_i = -1;
        if (offset) {
            adloox_i = (haystack + '').slice(offset).lastIndexOf(needle);
            if (adloox_i !== -1) {
                adloox_i += offset;
            }
        } else {
            adloox_i = (haystack + '').lastIndexOf(needle);
        }
        return adloox_i >= 0 ? adloox_i : false;
    }
    var uri_courant = function(){
        try {
	    methode='1: window.parent.parent.document.location.href';
            return window.parent.parent.document.location.href;
        } catch (adloox_err) {
            try {
		methode='2: window.parent.document.location.href';
                return window.parent.document.location.href;
            } catch (adloox_err) {
                saute_title = true;
                if (adloox_strrpos(adloox_err.message, '<', 0)) {
                    return adloox_err.message.substring(adloox_strrpos(adloox_err.message, '<', 0) + 1, adloox_strrpos(adloox_err.message, '>', 0));
                } else {
		    methode='3:  window.document.location.href';
                    return window.document.location.href;
                }
            }
        }
    }();
    var ancestorOrigins = function(){
        var d = [];
        if (typeof document.location.ancestorOrigins === 'undefined')
            return d;
        if (!(document.location.ancestorOrigins instanceof DOMStringList)) // TODO record faking
            return d;
        var n = document.location.ancestorOrigins.length;
        while (n-->0)
            d.push(document.location.ancestorOrigins.item(n));
        return d;
    }();
    var user_p = (function(){
        var ob = {};
        var low_ua = navigator.userAgent.toLowerCase();
        if( low_ua.indexOf("linux") > 0 ){ ob.os = "Linux" }
        else if( low_ua.indexOf("mac") > 0 ){ ob.os = "Mac" }
        else if( low_ua.indexOf("win") > 0 ){ ob.os = "Windows" }
        else ob.os = "inconnu";
        if ( /Edge\/\d./i.test(navigator.userAgent)) { ob.browser = "edge" }
        else if( low_ua.indexOf("chrome") > 0 ){ ob.browser = "chrome" }
        else if( low_ua.indexOf("firefox") > 0 ){ ob.browser = "firefox" }
        else if( low_ua.indexOf("safari") > 0 ){ ob.browser = "safari" }
        else if( low_ua.indexOf("opera") > 0 ){ ob.browser = "opera" }
        else if( low_ua.indexOf("msie") > 0  || !!window.MSStream ){ ob.browser = "Internet Explorer" }
        else ob.browser = "inconnu";
        return ob;
    })();


    var old_uri_courant = uri_courant;
    if ((top != window)) {
//        try {
//            uri_courant = window.document.referrer;
//            methode = "5: top!=window -> window.document.referrer "+document.referrer;
//            url_ref2 = window.parent.document.referrer;
//            adnxs = uri_courant.substr(10, 5);
//            is_iframe = 1;
//        } catch (err) {
            uri_courant = document.referrer;
            methode = "6: top != window -> document.referrer "+window.location.href;
	
	    if(inFriendlyIframe)
	    {
             uri_courant = window.location.href;
             methode = "7: top != window & friendly -> window.location.href "+document.referrer;
	    }

            if (uri_courant == "about:blank") {
                uri_courant = document.location.href;
            }
            is_iframe = 1;

//        }
    }
    if(uri_courant == ""){
        methode = '4: old_uri_courant';
        uri_courant = old_uri_courant;
    }

    if ((top != window)) {
        try {
            title=window.frameElement.id+'@'+document.location.href;
        } catch (err) {
            title='frame without title';
        }
    }

    var popup = function(){
        if (!window.top.opener) {
            popup.type = 'none';
            return;
        }

        if (!window.name) {	// possible <a target="_blank">
            popup.type = 'unnamed';
            return;
        }

        // FIXME use existing sensor
        var winmax = (function(win){
            try {
                while (win != window.top && typeof win.parent.document == 'object')
                    win = win.parent;
            } catch(_) {};

            return win;
        })(window.self);

        var focus = null;
        if (winmax == window.top)
            focus = window.top.document.hasFocus()
        else if (window.$sf && $sf.ext && typeof $sf.ext.winHasFocus == 'function') // FIXME use existing sensor
            focus = $sf.ext.winHasFocus();

        switch (true) { // lolz
        case (hidden === null && focus === null):
            popup.type = 'present';
            break;
        case (hidden !== null && focus !== null):       // FIXME cross-origin hidden is false when not-minimised
            popup.type = (!hidden && focus) ? 'up' : 'under'
            break;
        case (hidden !== null):                         // FIXME cross-origin hidden is false when not-minimised
            popup.type = !hidden ? 'up' : 'under'
            break;
        case (focus !== null):
            popup.type = focus ? 'up' : 'under';
            break;
        }
    };
    popup.type = null;
    popup();

    // placé ici car utilisé dans firewall et alerte
    var maj = function (entree) {
        var minus = "aàâäbcçdeéèêëfghiîïjklmnoôöpqrstûuüvwxyz- ";
        var majus = "AAAABCCDEEEEEFGHIIIJKLMNOOOPQRSTUUUVWXYZ  ";
        var sortie = "";
        for (var i = 0; i < entree.length; i++) {
            var car = entree.substr(i, 1);
            sortie += (minus.indexOf(car) != -1) ? majus.substr(minus.indexOf(car), 1) : car;
        }
        return sortie;
    }

    //function calculant le hash unique
    var uniq_hash = function(){
        var plugins = function() {
            var found = {};
            var version_reg = /[0-9]+/;
            if (window.ActiveXObject) {
                var plugin_list = {
                    flash: "ShockwaveFlash.ShockwaveFlash.1",
                    pdf: "AcroPDF.PDF",
                    silverlight: "AgControl.AgControl",
                    quicktime: "QuickTime.QuickTime"
                }
                for (var plugin in plugin_list) {
                    var version = msieDetect(plugin_list[plugin]);
                    if (version) {
                        var version_reg_val = version_reg.exec(version);
                        found[plugin] = (version_reg_val && version_reg_val[0]) || "";
                    }
                }
                if (navigator.javaEnabled()) {
                    found["java"] = "";
                }
            } else {
                var plugins = navigator.plugins;
                var reg = /Flash|PDF|Java|Silverlight|QuickTime/;
                for (var i = 0; i < plugins.length; i++) {
                    var reg_val = reg.exec(plugins[i].description);
                    if (reg_val) {
                        var plugin = reg_val[0].toLowerCase();
                        var version = plugins[i].version ||
                        (plugins[i].name + " " + plugins[i].description);
                        var version_reg_val = version_reg.exec(version);
                        if (!found[plugin]) {
                            found[plugin] = (version_reg_val && version_reg_val[0]) || "";
                        }
                    }
                }
            }
            return found;
            function msieDetect(name) {
                try {
                    var active_x_obj = new ActiveXObject(name);
                    try {
                        return active_x_obj.GetVariable("$version");
                    } catch (e) {
                        try {
                            return active_x_obj.GetVersions();
                        } catch (e) {
                            try {
                                var version;
                                for (var i = 1; i < 9; i++) {
                                    if (active_x_obj.isVersionSupported(i + ".0")) {
                                        version = i;
                                    }
                                }
                                return version || true;
                            } catch (e) {
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    return false;
                }
            }
        };
        var Detector = function() {
            var baseFonts = ["monospace", "sans-serif", "serif"];
            var testString = "mmmmmmmmmmlli";
            var testSize = "72px";
            var adloox_h = document.getElementsByTagName("body")[0];
            var adloox_s = document.createElement("span");
            adloox_s.style.fontSize = testSize;
            adloox_s.innerHTML = testString;
            var defaultWidth = {};
            var defaultHeight = {};
            for (var index in baseFonts) {
                adloox_s.style.fontFamily = baseFonts[index];
                adloox_h.appendChild(adloox_s);
                defaultWidth[baseFonts[index]] = adloox_s.offsetWidth;
                defaultHeight[baseFonts[index]] = adloox_s.offsetHeight;
                adloox_h.removeChild(adloox_s);
            }
            function detect(font) {
                var detected = false;
                for (var index in baseFonts) {
                    adloox_s.style.fontFamily = font + "," + baseFonts[index];
                    adloox_h.appendChild(adloox_s);
                    var matched = (adloox_s.offsetWidth != defaultWidth[baseFonts[index]] || adloox_s.offsetHeight != defaultHeight[baseFonts[index]]);
                    adloox_h.removeChild(adloox_s);
                    detected = detected || matched;
                }
                return detected;
            }
            this.detect = detect;
        };
        checksum = function(adloox_s) {
            var adloox_hash = 0,
            adloox_strlen = adloox_s.length,
            adloox_i,
            adloox_c;
            if (adloox_strlen === 0) {
                return adloox_hash;
            }
            for (adloox_i = 0; adloox_i < adloox_strlen; adloox_i++) {
                adloox_c = adloox_s.charCodeAt(adloox_i);
                adloox_hash = ((adloox_hash << 5) - adloox_hash) + adloox_c;
                adloox_hash = adloox_hash & adloox_hash;
            }
            return adloox_hash;
        };
        var objLocalZone = new Date();
        var strLocalZone = "" + objLocalZone;
        var mySplitResult = strLocalZone.split(" ");
        var newLocalZone = mySplitResult[5].slice(0, mySplitResult[5].length - 2) + ":" + mySplitResult[5].slice(mySplitResult[5].length - 2, mySplitResult[5].length);
        var timezone = newLocalZone;
        var pd = this.JSON ? JSON.stringify(new plugins()) : "";
        var sf = "";

        var d = new Detector();
        var _fonts = ["cursive", "monospace", "serif", "sans-serif", "fantasy", "default", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold", "Bookman Old Style", "Bradley Hand ITC", "Century", "Century Gothic", "Comic Sans MS", "Courier", "Courier New", "Georgia", "Gentium", "Impact", "King", "Lucida Console", "Lalit", "Modena", "Monotype Corsiva", "Papyrus", "Tahoma", "TeX", "Times", "Times New Roman", "Trebuchet MS", "Verdana", "Verona"];
        for (i = 0; i < _fonts.length; i++) {
            sf += d.detect(_fonts[i]) ? "t" : "f";
        }
        return checksum(timezone + pd) + sf;
    };


        var search_keywords = function(array_words, in_content, callback, firewall){
        var alert_title = "";
        var alert_url = "";
        var alert_content = "";
        var maj_url = maj(uri_courant);
        var maj_title = maj(title);
        var url_words = [];

        // le split de l'url pour les alertes
        if(!firewall && !in_content){
            var n;

            url_words = url_words.concat(uri_courant.split(/[-_.&=/?+#]/));

            n = ancestorOrigins.length;
            while (n-->0)
                url_words = url_words.concat(ancestorOrigins[n].split(/[-_.]/));

            n = url_words.length;
            while (n-->0) {
                if (url_words[n] == "" || url_words[n].match(/^https?:$/)) {
                    url_words.splice(n, 1);
                    continue;
                }
                url_words[n] = url_words[n].toLowerCase();
            }
        }

        // on commence par chercher hors du contenu
        if( !in_content && !!Array.prototype.indexOf){
            // recherche dans le titre + url
            for ( var i = 0; i < array_words.length; i ++ ) {
                var word = array_words[i];
                var word_splitted = word.split("+");
                if( word_splitted.length > 1 ){

                    //tous les mots du tableau doivent etre dans le texte
                    var nb_occ_title = 0;
                    var nb_occ_url   = 0;
                    for ( var j = 0; j < word_splitted.length; j ++ ) {
                        if(firewall) nb_occ_url += maj_url.match(word_splitted[j]) ? 1 : 0;
                        else nb_occ_url += url_words.indexOf(word_splitted[j].toLowerCase()) >= 0 ? 1 : 0;
                        nb_occ_title += maj_title.indexOf(word_splitted[j]) >= 0 ? 1 : 0;
                    }

                    if(nb_occ_title == word_splitted.length){
                        alert_title = word;
                        if(firewall) callback( alert_title, alert_url, alert_content );
                        else {
                            if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                            else callback( alert_title, alert_url, alert_content, true);
                        }
                        return;
                    }
                    if(nb_occ_url == word_splitted.length){
                        alert_url = word;
                        if(firewall) callback( alert_title, alert_url, alert_content );
                        else {
                            if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                            else callback( alert_title, alert_url, alert_content, true);
                        };
                        return;
                    }

                }
                else{
                    // check url
                    if(firewall){
                        if( maj_url.indexOf( word ) >= 0 ){
                            alert_url = word;
                            callback(alert_title,alert_url,alert_content);
                            return;
                        }
                    }
                    // un mot dans l'url, true alert
                    else{
                        if(url_words.indexOf(word.toLowerCase()) >= 0){
                            alert_url = word;
                            if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                            else callback( alert_title, alert_url, alert_content, true);
                            return;
                        }
                    }

                    // un mot dans le titre, true alert
                    if( maj_title.indexOf( word ) >= 0 ){
                        alert_title = word;
                        if(firewall) callback( alert_title, alert_url, alert_content );
                        else {
                            if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                            else callback( alert_title, alert_url, alert_content, true);
                        };
                        return;
                    }
                }
            }
            // on attend que le contenu soit charge
            window.setTimeout(function(){search_keywords(array_words,true,callback,firewall)},4000);
        }
        else{
            alert_content = "";
            count_content = 0;

            var inner_html_tmp = document.body;
            var content_final = "";

            if (typeof inner_html_tmp.textContent !== "undefined") {
                var content_final = inner_html_tmp.textContent;
            } else {
                var content_final = inner_html_tmp.innerText;
            }

            reg = new RegExp("[ \t]{2,}","g");
            content_final = content_final.replace(reg, " ");

            var body_content = maj(content_final);

            for ( var i = 0; i < array_words.length; i ++ ) {
                var word = array_words[i];
                var word_splitted = word.split("+");
                if( word_splitted.length > 1 ){

                    var nb_occ   = 0;
                    //tous les mots du tableau doivent etre dans le texte
                    for ( var j = 0; j < word_splitted.length; j ++ ) {
                        nb_occ += body_content.indexOf(word_splitted[j]) > 0 ? 1 : 0;
                    }
                    if(nb_occ  == word_splitted.length){

                        alert_content += word+" ";
                        count_content++;

                        // mode balayage alerte
                        if(!firewall){
                            if(count_content >= 1){
                                if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                                else callback( alert_title, alert_url, alert_content, true);
                                return;
                            }
                        }
                        // mode keywords FW
                        else {
                            callback(alert_title,alert_url,alert_content);
                            return;
                        }

                    }

                }else{

                    word = ( typeof body_content !== "object") ? " "+word+" " : word;
                    //mot sans +  ;
                    if( body_content.indexOf( word ) >= 0 ){
                        alert_content += word+" ";
                        count_content++;
                        // mode balayage alerte
                        if(!firewall){
                            if(count_content >= 2){
                                if(is_iframe == "1") callback( alert_title, alert_url, alert_content, false);
                                else callback( alert_title, alert_url, alert_content, true);
                                return;
                            }
                        }
                        // mode keywords FW
                        else {
                            callback(alert_title,alert_url,alert_content);
                            return;
                        }
                    }
                }
            }
        }

    };

    /*
    * == ALERTE ==
    * */
    (function(){
    var strrpos = function (haystack, needle, offset) {
        var i = -1;
        if (offset) {
            i = (haystack + '').slice(offset).lastIndexOf(needle);
            if (i !== -1) {
                adloox_i += offset;
            }
        } else {
            i = (haystack + '').lastIndexOf(needle);
        }
        return i >= 0 ? i : false;
    }
    var alert_sent = false;
    var saute_title = 0;
    var alerte_desc;
    var array_words = ["USENET","VIDEO ADULTE","TVRIP","TUBE ITALIANO","CANAL","TUBEITALIANO","TROIAPORNO","TROIA+PORNO","TRASGREDENDO","TRANSSEXUEL","TRANSGENRE","TRANSEXUEL","TRANSEXUAL","TRANSEX","TRANSESSUALE","TRANNY","TRANNIES","TORRENZ","TORRENTZ","TORRENT","TOPWAREZ","THREESOME","TETTONE","TETTEGROSSE","TETTE GROSSE","TETONES","TETAS","SWINGER","SUCEUSE","STRIPTEASE","STREAMING","STOOORAGE","STARFUCKS","SQUIRTING","SQUIRT","SPERME","SPERM","SODOMY","SODOMIZE","SODOMIES","SODOMIE","SODOM","SHEMALE","SHEMALES","SHARKING","SEXYCULO","SEXYCHAT","SEXY CULO","SEXY CHAT","SEXY","SEXXX","SEXUPLOADER","SEXUELLEN","SEXUEL","SEXUAL","SEXTAPE","SEXORS","SEXKINO","SEXHARDCORE","SEXFILMCHEN","SEXES","SEXE","SEX TAPE","SEX HARDCORE","SESSOESTREMO","SEX","SESSUALE","SESSOGRATIS","SESSOAMATORIALE","SESSO GRATIS","SESSO ESTREMO","SESSO AMATORIALE","SCARICAREGRATIS","SCARICARE GRATIS","SBORRATE","SALOPES","SALOPE","SALES NOIRS","RIMMING","REDTUBE","RAPIDSHARE","RANAPORNO","RAGAZZEUBRIACHE","RAGAZZE UBRIACHE","PUTTANE","PUSSY","PUSSIES","PROGRAMASFULL","PORNSTAR","PORNPICS","PORNOX","PORNOVIZI","PORNOTUBO AMATEURSEX","PORNOTUBO","PORNOITALIANOGRATIS","PORNO X","PORNKOLT","PORNO","PORN VIDEO","PORN STAR","PORN PICS","PORN","POMPINO","POMPINI","PLUMPER","PIRATAGE","PHOTOX","PHOTOADULTE","PHOTO X","PHOTO ADULTE","PELICULASONLINEGRATIS","PELICULAS ONLINE GRATIS","PEDOPHILE","PEDOFILO","PECHOS","PANTYHOSE","ORGY","ORGIE","OLLYSPORN","OLLYS PORN","NUDISTE","NUDISTA","NUDIST","NUDISMO","NUDISME","NUDISM","NINFOMANA","NIGGER","NEWSGROUP","NETECHANGISME","NEGATIONNISME","NAZIS","NAZI","NATURISTE","NATURISTA","NATURIST","NATURISMO","NATURISME","NATURISM","MUYZORRAS","MOVIEX","MONSTERCOCK","MONSTER COCK","MONEYSLAVE","MILF","MICIPORN","MEGAUPLOAD","MEDIAFIRE","MASTURBIEREN","MASTURBATE","MASTURBARSI","MASTURBARSE","MAMANDOPOLLAS","MAMANDO POLLAS","LIVEJASMIN","LESBO","LESBIENNE","LESBICHE","LESBIAN","LADYBOY","LADY BOY","ITALIAWEBSHOP","ISOHUNT","INCULATE","INCESTI","INCESTE","HULKSHARE","HOTVOICE","HORNY","HOOKER","HITLER","HENTAI","HARDCORESEX","HARDCORE SEX","HANDJOB","HAND JOB","HACERGOZAS","HACER GOZAS","GROUPSEX","GROUP SEX","GRANDESVERGAS","GRANDES VERGAS","GORGE PROFONDE","GONZO","GOLDEN SHOWER","GANGBANG","GANG BANG","FULL-RIP","FULLRIP","FREEPORN","FREE PORN","FOTODESEXO","FOTO DE SEXO","FOLLAR","FOLLADAS","FISTING","FISTFUCKING","FILMINIAMATORIALI","FILMINI AMATORIALI","FILMGRATIS","FILMDIVX","FILMDDL","FILM GRATIS","FILM DIVX","FILM DDL","FILEJUNGLE","FETISH","FAMOSASDESNUDAS","FAMOSAS DESNUDAS","EXTREME SEX","ESCUALITA","ERWACHSENEFOTO","EROTISMO","ERWACHSENE FOTO","ENCULER","ENCULE","ENCULADAS","EJACULATE","ECHARUNPOLVO","ECHARUNACACHITA","ECHAR UNA CACHITA","ECHAR UN POLVO","EAT+PUSSY","DVDSCR","DVDRIP","DVD RIP","DOWNLOADZ","DOUJINSHI","DOUBLEPENETRATION","DOMINGAS","DOGGY STYLE","DOGGIE STYLE","DIRTY+WHORE","DIRECTDOWNLOAD","DIRECT DOWNLOAD","DILDO","DICKS","DESCARGAGRATIS","DESCARGA GRATIS","DESCARGA DIRECTA","DEPOSITFILE","DEEPTHROAT","DEEP THROAT","CUNNILINGUS","CUMSHOT","FKK + NUDIST","CORRIDASENLACARA","CORRIDAS EN LA CARA","CHICASFOLLANDO","CHICAS FOLLANDO","CHATCALIENTE","CHAT CALIENTE","CAZZIENORMI","CAZZI ENORMI","BRRIP","BRANLETTE","BRANLER","FKK + NUDE","BOOBS","BONJOURMADAME","BONDAGE","BLOWJOB","BLOW JOB","BITCH","BIGTITS","BIGCOKE","BIG TITS","BIG TIT","BIG COKE","BIATCH","BDSM","BDRIP","BBW","BARELYLEGAL","BARELY+LEGAL","BARELY LEGAL","BAREBACK","BAJAGRATIS","BAJA GRATIS","ATTRICIPORNO","ATTRICI PORNO","ASSHOLE","ANONYMOUS","ANAL+SEX","AMATORIALI","AMATEURSEX","AMATEUR+SEX","4SHARED",".CSO","CLUNGE","VIDEO AMATORIALI","VIDEO X","VIDEOADULTE","VIDEOAMATORIALI","VIDEOX","VOYEUR X","VOYEURX","WAREZ","WEBCAM X","WEBCAMX","XXX BLOG","XXXBLOG","YAOI","YOUNG+PORN","YOUPORN","ZOOPHILE","ZOOPHILIE","ZSHARE","NSFW","FKK + NATURIST","FKK + EROTI","FKK + CLUB","FKK + GIRLS","FKK+NUDE","FKK+NUDIST","FKK+NATURIST","FKK+EROTI","FKK+CLUB","FKK+GIRLS","??","FEMDOM","ESIBIZIONISTI"];

    var true_alert = "";

    var send_alert = function(alert_title,alert_url,alert_content,true_alert){
        var alert_desc = "";
        //on verifie que le image_alerte_contenu n'a pas ete envoye
        if( !alert_sent ){
            alert_desc += alert_url.length>0 ? "url: "+alert_url : "" ;
            alert_desc += alert_title.length>0 ? "titre: "+alert_title : "";
            alert_desc += alert_content.length>0 ? "content: "+alert_content : "";
            if( alert_desc.length > 0 ){
                var img_alert = document.createElement('img');
                var url = "//brandsafe.adlooxtracking.com/ads/image_alerte.php?client="+cname+"&type=regie_quotidienne&banniere=" + ban_id + "&campagne=" + cmp_id + "&methode=" + escape(methode) + "&fai=new1_" + escape(document.title) + "&alerte=0&alerte_desc=" + escape(alert_desc) + "&id_editeur=" + str_alerte_ids + "&url_referrer=" + escape(uri_courant) + "&iframe=" + is_iframe + "&true_alert=" + true_alert;
                img_alert.id = 'ads_alerte_contenu';
                img_alert.src = url;
                img_alert.width = 0;
                img_alert.height = 0;
                img_alert.style.display = 'none';
                document.body.appendChild(img_alert);
                alert_sent = true;
            }
        }
    };

    //lance la recherche des mot cles sur la liste alerte
    search_keywords(array_words,false,send_alert,false);

    // on attend 2s pour lancer la recherche dans le contenu
    //window.setTimeout(search_content, 2000);
})();

    /*
    * == FIREWALL ==
    * */
    (function(){
    //on declenche pas le fw sur ces sites
    if (uri_courant.match(/woo_ban_2_728x90_messag|webmail\.|orange\.fr|ad\.fr\.doubleclick\.net\/N3513\/adi\/woo_ban/i)){
        return;
    }
    var rurl_decode = function(uriComponent){
        try{
            var decodedURIComponent = decodeURIComponent(uriComponent);
            if(decodedURIComponent == uriComponent){
                return decodedURIComponent;
            }
            return rurl_decode(decodedURIComponent);
        }catch(e){
            return uriComponent;
        }
    }(uri_courant);
    var google_fw = 0; //TODO il y a des campagnes ou on a pas le droit de declencher le firewall, mais je ne sais pas trop ou ou set cette variable
    var array_words_blocked = [];
    var fw_version = "2";
    // si on est sur un site en lv, on quitte la partie fw

    var check_fw = function(force_block,alert_desc){
        var url_fw = "//" + servername + "/ads/check/check.php?visi_serv=" + servername + "&visite_id=" + visite_id + "&visi=&iframe=" + is_iframe + "&version=2&client="+cname+"&video=0&banniere=" + ban_id + "&id_editeur=" + str_alerte_ids + "&campagne=" + cmp_id_date + "&methode=" + escape(methode) + "&fai=" + escape(title) + "&adloox_abnxs=" + escape(adnxs) + "&url_referrer=" + escape(uri_courant) + "&url_ref2=" + escape(url_ref2);
        url_fw += force_block ? "&ads_forceblock=1" : "";
        url_fw += typeof alert_desc !== "undefined" ? "&alerte_desc=" + alert_desc : "";
        // dans le cas d'un player video, on arrive trop tard pour write dans le document, donc on append
        if( video || force_block ){
            var els = document.createElement('script');
            els.src = url_fw;
            els.setAttribute('language', 'JavaScript');
            document.body.appendChild(els);
        }else{
            document.write("<script type='text/javascript' src='" + url_fw + "'></script>");
        }
    }

    var force_fw = function(alert_title,alert_url,alert_content){
        var alert_desc = "";
        alert_desc += alert_url.length>0 ? "url: "+alert_url : "" ;
        alert_desc += alert_title.length>0 ? "titre: "+alert_title : "";
        alert_desc += alert_content.length>0 ? "content: "+alert_content : "";
        check_fw(alert_desc,alert_desc);
    }

    //lance la recherche sur la liste de mot cle à bloquer
    search_keywords(array_words_blocked,false,force_fw, true);

})();

    /*
    * == VISI ==
    * */
    var visi_universal = function(){
    // we default to 'null' for the sensors for no results as JSON cannot represent 'undefined'

    // ATF is senstive to the initial race where the ad may be playing
    // but not all the sensors are booted so we use a semaphore
    var booting = 0;

    // FIXME walk over parent iframes
    var classic = function(){
        if (classic.booting) {
            classic.booting--;
            booting--;
        }

        var el = adunit.el.ownerDocument.documentElement;
        var dwidth = Math.max(adunit.win.innerWidth || 0, el.clientWidth || 0);
        var dheight = Math.max(adunit.win.innerHeight || 0, el.clientHeight || 0);

        var w = Math.min(dwidth - adunit.rect.left, adunit.rect.width);	// viewport
        w += Math.min(adunit.rect.left, 0);				// offset
        w = Math.max(w, 0);						// cap

        var h = Math.min(dheight - adunit.rect.top, adunit.rect.height);
        h += Math.min(adunit.rect.top, 0);
        h = Math.max(h, 0);

        var ratio = (w * h) / (adunit.rect.width * adunit.rect.height);
        if (!isNaN(ratio))
            classic.ratio = ratio.toFixed(2);
    };
    classic.ratio = null;
    classic.booting = 1;
    booting++;
    subscribe('rect', classic);

    // cross-origin in IE
    var elementfrompoint = function(){
        var d = adunit.el.ownerDocument;

        // only works after onload
        var boot = function(){
            if (d.readyState != 'complete') {
                var cb = function(){
                    window.setTimeout(elementfrompoint, 0);	// race between complete/onload
                };
                if (adunit.win.addEventListener)
                    adunit.win.addEventListener('load', cb);
                else
                    adunit.win.attachEvent('onload', cb);
                return;
            }

            elementfrompoint.booting--;
            booting--;
        };

        if (elementfrompoint.booting)
            boot();

        var c = !d.elementFromPoint(adunit.rect.width / 2, adunit.rect.height / 2);
        elementfrompoint.hidden = [
            !d.elementFromPoint(0, 0),
            c,
            !d.elementFromPoint(adunit.rect.width, adunit.rect.height)
        ];
        elementfrompoint.hidden2 = [
            !d.elementFromPoint(adunit.rect.custom.x, adunit.rect.custom.y),
            c,
            !d.elementFromPoint(adunit.rect.width - adunit.rect.custom.x, adunit.rect.height - adunit.rect.custom.y)
        ];
    };
    elementfrompoint.hidden = [null, null, null], elementfrompoint.hidden2 = [null, null, null];
    elementfrompoint.booting = 1;
    booting++;
    subscribe('rect', function cb(){	// dispatch in metrics() as no scroll events in an iframe
        unsubscribe('rect', cb);
        elementfrompoint();
    });

    var safeframe = function(){
        // FIXME this needs a semaphore but we can be loaded async
        if (!window.$sf || !$sf.ext) {
            if (safeframe._count++ < 5)
                window.setTimeout(safeframe, 500);
            return;
        }

        var status_update = function(status, data) {
            switch (status) {
            case "geom-update":
                var ratio = parseInt($sf.ext.inViewPercentage(), 10);
                if (!isNaN(ratio))
                    safeframe.ratio = (ratio/100).toFixed(2);
                break;
            case "focus-change":	// version 1.1 only
                if (typeof $sf.ext.winHasFocus == 'function')
                  safeframe.focus = $sf.ext.winHasFocus();
                break;
            default:
                LOG("ignoring SafeFrame event '"+status+"': ", data);
            }
        };

        $sf.ext.register(adunit.el.clientWidth, adunit.el.clientHeight, status_update);
        status_update('geom-update');
        status_update('focus-change');
    };
    safeframe._count = 0;
    safeframe.ratio = null;
    safeframe.focus = null;
    subscribe('adunit', safeframe);

    // main.php:impression() guarentees mraid.getState() != 'loading'
    var MRAID = function(){	// do *not* rename to 'mraid' (namespace collision)
        if (typeof mraid != 'object')
            return;

        // http://www.iab.com/wp-content/uploads/2016/11/MRAID-V3_Draft_for_Public_Comment.pdf
        // N.B. some people do not implement this though V1 requires it... :-/
        var v = typeof mraid.getVersion == 'function' ? parseInt(mraid.getVersion(), 10) : 1;	// ignore decimal!
        switch (v) {	// FALLTHROUGH!
        case 3:
            // FIXME cannot find a method to get initial value
            mraid.addEventListener('exposureChange', function(r){ MRAID.exposure = r/100 });
        case 2:
            var ratio = function(){
                var p = mraid.getCurrentPosition();
                var v = mraid.getScreenSize();

                var w = Math.max(Math.min(v.width - p.y, 0), adunit.rect.width);
                var h = Math.max(Math.min(v.height - p.x, 0), adunit.rect.height);

                var ratio = (w * h) / (adunit.rect.width * adunit.rect.height);
                if (!isNaN(ratio))
                    MRAID.ratio = ratio.toFixed(2);
            }
            subscribe('rect', ratio);

            if (v == 2)	{	// deprecated in V3
                MRAID.state = mraid.isViewable();
                mraid.addEventListener('viewableChange', function(b){ MRAID.state = !b });
            }
        case 1:
        default:	// includes NaN!
            MRAID.hidden = mraid.getState() == 'hidden';
            mraid.addEventListener('stateChange', function(s){ MRAID.hidden = s == 'hidden' });
        }
    };
    MRAID.exposure = null;
    MRAID.ratio = null;
    MRAID.hidden = null;
    MRAID();

    // window.IntersectionObserver
    // Chrome 51+ and Firefox 52+
    var intersection = function(entries){
        if (intersection.timer) {
            window.clearTimeout(intersection.timer);
            delete intersection.timer;
            booting--;
        }

        intersection.hidden = entries[0].intersectionRatio < tx_visi;
        intersection.hidden2 = entries[0].intersectionRatio < tx_visi2;
    };
    intersection.hidden = null, intersection.hidden2 = null;
    try {
        intersection.io = new IntersectionObserver(intersection, { threshold: [ tx_visi, tx_visi2 ] });
    } catch(_){};
    if (intersection.io) {
        booting++;

        subscribe('adunit', function(){
            intersection.io.observe(adunit.el);

            // .takeRecords() seems to not work so this is null until visible
            intersection.timer = window.setTimeout(function(){
                delete intersection.timer;
                booting--;
                intersection([ { intersectionRatio: 0 } ]);
            }, 100);
        });
    }

    // window.requestAnimationFrame
    // - inactive tab
    //  - all browsers drops to 0hz
    // - active tab:
    //  - Firefox 45+ - throttled in any kind of iframe to 1hz when hidden
    //  - Chrome 52+ - zero calls in cross origin iframe only but unthrottled in same origin
    //  - Safari 9+ (inc iOS) in any iframe to 0.1hz
    //  - Android 4.4 in a cross-origin iframe
    // - does not work in IE10+ or Edge 13/14
    // - does not work in Firefox Mobile
    //
    // this implementation creates a cross-origin iframe and runs the sensor in there so
    // it should also work for those situations where where window.self == window.top too
    //
    // N.B. this has been structured to use *zero* CPU cycles when non-viewable!
    //
    // N.B. in the testrig, with SafeFrame this does not work as we are posting from a 'null'
    // domain into another 'null' domain; this is not something we should see in the wild...ever!
    var ANIMATION_PERIOD = 100; // must be greater than framerate period (~1/60 seconds)
    var animation = function(data){
        var timer, hidden, prevtime;
        if (data.c) {
            timer = animation.timer2;
            hidden = animation.hidden2;
            prevtime = animation.prevtime2;
        } else {
            timer = animation.timer;
            hidden = animation.hidden;
            prevtime = animation.prevtime;
        }

        if (!data.w) {	// watchdog
            window.clearTimeout(timer[data.i]);

            timer[data.i] = window.setTimeout(function(){
                animation({ c: data.c, i: data.i, t: data.t + 3 * ANIMATION_PERIOD, w: 1 });
            }, 3 * ANIMATION_PERIOD);
        }

        // handle initial postMessage now() initialisation
        if (!prevtime[data.i]) {
            prevtime[data.i] = data.t;
            return;
        }

        if (animation.booting && hidden[data.i] === null) {
            animation.booting--;

            if (!animation.booting)
                booting--;
        }

        var d = data.t - prevtime[data.i];
        prevtime[data.i] = data.t;

        if (data.w) {
            hidden[data.i] = true;
        } else if (d < 2 * ANIMATION_PERIOD) {
            hidden[data.i] = false;
        }
    };
    animation.init = function(){
        animation.timer = [], animation.timer2 = [];
        animation.prevtime = [], animation.prevtime2 = [];
        animation.sources = [];

        // *not* an authentication token as it appears in the clear
        // on the .srcdoc attribute below
        var sensor = function(i, custom) {
            if (custom && i == 1)	// identical to the non-custom so skip
                return;

            var prevtime = custom ? animation.prevtime2 : animation.prevtime;
            prevtime[i] = 0;

            var f = document.createElement('iframe');

            f.style['pointer-events'] = 'none';
            f.style.position = 'absolute';
            var c = 50 - (Math.min(0.5, tx_visi2) * 100) + '%';	// FIXME
            if (i == 0)
                f.style.top = f.style.left = custom ? c : 0
            else if (i == 1)
                f.style.top = f.style.left = '50%'
            else if (i == 2)
                f.style.bottom = f.style.right = custom ? c : 0;
            f.style.width = f.style.height = '4px';	// must have size
            f.style.margin = f.style.padding = 0;
            f.style.background = 'transparent';
            f.style.border = 'none';
            f.frameBorder = 0;
            f.scrolling = 'no';

            var h = document.createElement('html');
            var hh = document.createElement('head');
            var s = document.createElement('script');
            s.type = 'text/javascript';

            // we should have requestAnimationFrame() requeued in animation()
            // but this makes the code more complicated and only reduces the
            // slight jitter with the coupling of the watchdog which operates
            // by orders of magnitude larger anyway (100ms rather than 1ms)
            //
            // N.B. prevtime primed here as each IFRAME has its own instance
            // of window.performance.now()
            //
            s.text = 'var f = function(n){ parent.postMessage({ c: '+custom+', i: '+i+', t: n }, "*"); setTimeout(function(){ requestAnimationFrame(f) }, '+ANIMATION_PERIOD+') }; parent.postMessage({ c: '+custom+', i: '+i+', t: performance.now() }, "*"); requestAnimationFrame(f)';

            hh.appendChild(s);
            h.appendChild(hh);

            // N.B. we have to use 'sandbox' as chrome crashes same-origin
            //      when using document.domain=document.domain
            // N.B. not supported by IE, neither is this sensor anyway...
            f.sandbox = 'allow-scripts';
            f.srcdoc = h.outerHTML;

            f.onload = function(){
                animation.sources[i + (custom ? 0 : 1) * 3] = f.contentWindow;
            };

            animation.cb.push(function(){
                adunit.proxy.contentWindow.document.body.appendChild(f);
            });
        };

        adunit.proxy.contentWindow.addEventListener('message', function(e){
            if (animation.sources.indexOf(e.source) != -1)
                animation(e.data);
        }, false);

        animation.cb = [];
        for (var i = 0; i < 3; i++)
            sensor(i, false), sensor(i, true);
        var g = function(){
            var n = animation.cb.length;
            while(n-->0) animation.cb[n]();
            delete animation.cb;
        };
        if (adunit.proxy.contentWindow.document.readyState != 'complete')
            adunit.proxy.contentWindow.addEventListener('load', g)
        else
            g();
    };
    animation.hidden = [ null, null, null ], animation.hidden2 = [ null, null, null ];
    // IE/Edge this sensor does not work, normally we would just let it run and
    // not return any results, but then interacts badly with the booting semaphore
    var MSIE = new Function('return /*@cc_on!@*/!1')() || !!document.documentMode;
    var MSEdge = window.navigator.userAgent.match(/Edge\/[1-9]/);
    if (typeof window.requestAnimationFrame == 'function' && !MSIE && !MSEdge) {
        booting++;
        animation.booting = 3 + 2;	// non-custom (3) and custom pixel (2 + borrow 1) sets

        subscribe('rect', function cb(){
            unsubscribe('rect', cb);
            animation.init();
        });
    }

    var metrics = function(){
        // set{Interval,Timeout}() is throttled on inactive tabs
        var nowtime = now();
        var delta = nowtime - metrics._prevtime;
        metrics._prevtime = nowtime;

        metrics.dur += delta;
        metrics.dur_activetab += (!hidden ? delta : 0);

        if (!adunit.el)
            return;

        if (booting) {
            LOG('still booting');
            return;
        }

        if (!roll_state)
            return;

        var results = [], results2 = [];

        // safe to push on uninitialised
        results.push(hidden), results2.push(hidden);

        if (classic.ratio !== null)
            results.push(classic.ratio < tx_visi), results2.push(classic.ratio < tx_visi2);

        elementfrompoint();	// we cannot get scroll events in an iframe :(
        if (elementfrompoint.hidden[0] !== null && elementfrompoint.hidden[1] !== null && elementfrompoint.hidden[3] !== null)
            if (!(elementfrompoint.hidden[0] && !elementfrompoint.hidden[1] && elementfrompoint.hidden[2]))  // test if not clipped
                results.push(elementfrompoint.hidden[1] && (elementfrompoint.hidden[0] || elementfrompoint.hidden[2]));
        if (elementfrompoint.hidden2[0] !== null && elementfrompoint.hidden2[1] !== null && elementfrompoint.hidden2[3] !== null)
            if (!(elementfrompoint.hidden2[0] && !elementfrompoint.hidden2[1] && elementfrompoint.hidden2[2]))  // test if not clipped
                results2.push(elementfrompoint.hidden2[1] && (elementfrompoint.hidden2[0] || elementfrompoint.hidden2[2]));

        if (safeframe.ratio !== null)
            results.push(safeframe.ratio < tx_visi), results2.push(safeframe.ratio < tx_visi2);

        if (MRAID.exposure !== null)
            results.push(MRAID.exposure < tx_visi), results2.push(MRAID.exposure < tx_visi2);
        if (MRAID.ratio !== null)
            results.push(MRAID.ratio < tx_visi), results2.push(MRAID.ratio < tx_visi2);
        if (MRAID.hidden !== null)
            results.push(MRAID.hidden), results2.push(MRAID.hidden);

        if (intersection.hidden !== null)
            results.push(intersection.hidden);
        if (intersection.hidden2 !== null)
            results2.push(intersection.hidden2);

        if (animation.hidden[0] !== null && animation.hidden[1] !== null && animation.hidden[3] !== null)
            if (!(animation.hidden[0] && !animation.hidden[1] && animation.hidden[2]))  // test if not clipped
                results.push(animation.hidden[1] && (animation.hidden[0] || animation.hidden[2]));
	// N.B. we reuse hidden[1] from the IAB measurements as it is the center pixel and *not* a typo!
        if (animation.hidden2[0] !== null && animation.hidden[1] !== null && animation.hidden2[3] !== null)
            if (!(animation.hidden2[0] && !animation.hidden[1] && animation.hidden2[2]))  // test if not clipped
                results2.push(animation.hidden[1] && (animation.hidden2[0] || animation.hidden2[2]));

        var ishidden = false, ishidden2 = false;
        for (var i = 0; i < results.length; i++) {
            if (!results[i])
                continue;

            ishidden = true;
            break;
        }
        for (var i = 0; i < results2.length; i++) {
            if (!results2[i])
                continue;

            ishidden2 = true;
            break;
        }

        metrics.hidden = ishidden;
        metrics.hidden2 = ishidden2;

        if (metrics.atf === null)
            metrics.atf = !ishidden;
        if (metrics.atf2 === null)
            metrics.atf2 = !ishidden2;

        if (ishidden) {
            metrics.run = 0;
        } else {
            metrics.exp += delta;
            metrics.run += delta;

            if (metrics.run > metrics.max)
                metrics.max = metrics.run;
        }
        if (ishidden2) {
            metrics.run2 = 0;
        } else {
            metrics.exp2 += delta;
            metrics.run2 += delta;

            if (metrics.run2 > metrics.max2)
                metrics.max2 = metrics.run2;
        }

        adloox_getVisi=(!metrics.hidden && !metrics.hidden2);
        fire('viewability', {
            delta: delta,
            viewable: [ !metrics.hidden, !metrics.hidden2 ],
            sensors: {
                tabinactive: hidden,
                classic: classic.ratio,
                elementfrompoint: [elementfrompoint.hidden, elementfrompoint.hidden2],
                safeframe: safeframe.ratio,
                'mraid.exposure': MRAID.exposure,
                'mraid.ratio': MRAID.ratio,
                'mraid.hidden': MRAID.hidden,
                intersection: [intersection.hidden, intersection.hidden2],
                animation: [animation.hidden, animation.hidden2]
            },
            metrics: {
                atf: [ metrics.atf, metrics.atf2 ],
                dur: metrics.dur,
                dat: metrics.dur_activetab,
                exp: [ metrics.exp, metrics.exp2 ],
                max: [ metrics.max, metrics.max2 ],
                run: [ metrics.run, metrics.run2 ]
            }
        });


        //unload quick fix
        var visible_unload = (metrics.exp / 1000) >= sec_visi ? 2 : 0;
        if(visible_unload==2 && typeof onAdGetViewableIAB === "function")
        {
                onAdGetViewableIAB()
        }
        var visible2_unload = (metrics.exp2 / 1000) >= sec_visi2 ? 2 : 0;
        if(visible2_unload==2 && typeof onAdGetViewableCustom === "function")
        {
                onAdGetViewableCustom()
        }
        //unload quick fix



    };
    // N.B. times are in milliseconds
    metrics.hidden = null, metrics.hidden2 = null;	// hidden
    metrics.atf = null, metrics.atf2 = null;		// above the fold
    metrics.dur = 0;					// page duration
    metrics.dur_activetab = 0;				// page duration when active tab)
    metrics.exp = 0, metrics.exp2 = 0;			// ad exposure
    metrics.max = 0, metrics.max2 = 0;			// max continueous ad exposure period
    metrics.run = 0, metrics.run2 = 0;			// continuous run (internal, not reported!)
    metrics._prevtime = now();
    metrics._timer = window.setInterval(metrics, 100);

    var logData = function(){
        if (now() - logData.lastsent < 1000)
            return;

        var o = {
            adloox_transaction_id: window.transaction_id || null,
            client: cname,
            banniere: ban_id,
            visite_id: visite_id,
            url: uri_courant,
            campagne: cmp_id_date,
            p_d: metrics.dur / 1000,
            p_d_v: metrics.dur_activetab / 1000,
            browser: user_p.browser,
            editeur_id: str_alerte_ids,
            hash: uniq_hash(),
            hash_adnxs: hash_adnxs,
            visi_debug: 'universal: booting: ' + booting + ' [' + classic.booting + ',' + elementfrompoint.booting + ',' + animation.booting + ']'
        };

        if (adunit.rect)
            o.size = adunit.rect.width+'x'+adunit.rect.height;
        var tagco_varO = qs2o(tagco_var.substr(1));
        for (var k in tagco_varO)
            o[k] = o[k] || tagco_varO[k];

        if (!booting) {
            var visible = (metrics.max / 1000) >= sec_visi ? 2 : 0;
            var visible2 = (metrics.max2 / 1000) >= sec_visi2 ? 2 : 0;

            if (unloading && typeof onUnloadPage == 'function')
                onUnloadPage(visible ? metrics.exp / 1000 : 0, metrics.dur / 1000, visible, visible2 ? metrics.exp2 / 1000 : 0);

            o.visible = visible;
            o.visible2 = visible2;
            o.a_d = metrics.max / 1000;
            o.a_d2 = metrics.max2 / 1000;
            o.wasatf = metrics.atf ? 2 : 0;
            o.wasatf2 = metrics.atf2 ? 2 : 0;
            o.visi_debug = 'universal';
        }

        sendData('https://' + servername + '/ads/iv2.php', o);

        logData.lastsent = now();
    };
    logData.lastsent = 0;
    subscribe('unload', logData);
    subscribe('hidden', logData);
    
    if(user_p.browser=='inconnu' )
    {
        window.setTimeout(function() {
            logData();
        }, 2000);
        window.setTimeout(function() {
            logData();
        }, 6000);
        window.setTimeout(function() {
            logData();
        }, 10000);
        window.setTimeout(function() {
            logData();
        }, 30000);
        window.setTimeout(function() {
            logData();
        }, 60000);
    }


    // Methods

    return {
        hidden: function(){
            return [ metrics.hidden, metrics.hidden2 ];
        },

        getVisi: function(){
            return (metrics.exp / 1000) >= sec_visi;
        }
    };
};

    var hidden = null;	// assume visible (!null == !false)
    var visibilityState = 'visible';
    var visibilityStateEvent;
    var hiddenPairs = [ '', 'moz', 'ms', 'webkit' ];
    for (var i = 0; i < hiddenPairs.length; i++) {
        var h = hiddenPairs[i] + ((!i) ? 'h' : 'H') + 'idden';

        if (document[h] === undefined)
            continue;

        var v = hiddenPairs[i] + ((!i) ? 'v' : 'V') + 'isibilityState';

        hidden = document[h];
        visibilityState = document[v];

        visibilityStateEvent = hiddenPairs[i] + 'visibilitychange';
        document.addEventListener(visibilityStateEvent, function(){
            hidden = document[h];
            visibilityState = document[v];
        }, false);

        break;
    }
    var fnVisiState = function(){ return (!hidden && visibilityState == 'visible') };

    var roll_state = 0;
    var visi = function(){
        var cb = function(){
            unloading = true;
            fire('unload');
        };

        // https://www.igvita.com/2015/11/20/dont-lose-user-and-app-state-use-page-visibility/

        if (visibilityStateEvent) {
            document.addEventListener(visibilityStateEvent, function(){
                if (visibilityState == 'hidden'){
                    fire('hidden');}
            }, false);
        }

        if (window.addEventListener) {
            window.addEventListener('unload', cb);
            window.addEventListener('beforeunload', cb);	// safari reload/url change
            window.addEventListener('pagehide', cb);		// safari navigate
        } else
            window.attachEvent('onunload', cb);
    };
    visi.sensor = new visi_universal();
    subscribe('impression', visi);	// no point sending viewability with no impression

    var send_ic = function(){
        LOG("send impression");

        roll_state = 1;

        var appname = 'unknown';
        if (navigator.appName)
            appname = navigator.appName;

        timezoneOffset = 0;
        try {
            var d = new Date();
            var timezoneOffset = d.getTimezoneOffset();
        } catch(e) {}
        is_iframe =  inFriendlyIframe ? 3 : is_iframe;

        fake = detectFake(); // function provided by the bot module
        var ctitle = (typeof ctitle_atlas == "undefined") ? "" : ctitle_atlas;
        //var methode = hFlash ? "hf" : "nof";

        var o = {
            adloox_transaction_id: transaction_id,
            adloox_io: adlooxio,
            bp: bidprice,
            visite_id: visite_id,
            client: cname,
            ctitle: ctitle,
            id_editeur: str_alerte_ids,
            banniere: ban_id,
            campagne: cmp_id,
            os: '',
            navigateur: '',
            appname: appname,
            timezone: timezoneOffset,
            fai: title,
            alerte: alerte_finale,
            alerte_desc: alerte_desc,
            data: uniq_hash(),
            js: script_src,
            fw: has_fw,
            version: fw_version,
            iframe: is_iframe,
            hadnxs: hash_adnxs,
            plat: platform,
            ua: navigator.userAgent,
            url_referrer: uri_courant,
            resolution: resolution,
            nb_cpu: nb_cpu,
            nav_lang: nav_lang,
            date_regen: date_regen,
	    debug: methode,
            ao: ancestorOrigins[0] || '',
            fake: detectFake(),	// function provided by the bot module
            popup: popup.type,
            p_d: p_d
        };
        var paramsUrlV3O = qs2o(paramsUrlV3.substr(1));
        for (var k in paramsUrlV3O)
            o[k] = o[k] || paramsUrlV3O[k];
        if (params_opt.sizmek)
            o.sizmek = params_opt.sizmek;

        var els = document.createElement('script');
        els.src = 'https://'+servername+'/ads/'+v_ic+'?'+o2qs(o);
        document.body.appendChild(els);

        if( typeof tagco_arr.domain !== "unfined" && typeof tagco_arr.version !== "undefined" ) {
            send_to_tagco(tagco_arr);
        }
    };
    subscribe('impression', send_ic);

    var preconnect = function(){
        preconnect = noop;

        // https://www.igvita.com/2015/08/17/eliminating-roundtrips-with-preconnect/
        var hint = document.createElement('link');
        hint.rel = 'preconnect';
        hint.href = 'https://'+servername;
        document.getElementsByTagName('head')[0].appendChild(hint);
    };
    var impression = function(){
        if (document.readyState == 'loading') {
            if (document.addEventListener) {
                document.addEventListener('readystatechange', function cb(){
                    document.removeEventListener('readystatechange', cb);
                    impression();
                });
            } else {
                document.attachEvent('onreadystatechange', function cb(){
                    if (document.readyState != 'complete')	// IE!!!!!
                        return;
                    document.detachEvent('onreadystatechange', cb);
                    impression();
                });
            }
            return;
        }

        // http://www.iab.com/wp-content/uploads/2015/08/MRAID_Best_Practices_July2014.pdf
        if (typeof mraid == 'object'){		// FIXME racey as we could be loaded async
            LOG("MRAID detected");
            if (mraid.getState() == 'loading') {
                LOG("MRAID still loading");
                mraid.addEventListener('ready', impression);
                preconnect();
                return;
            }

            // MRAID without has no concept of impression but this is as close as we can get
            if (!mraid.isViewable()) {		// N.B. does not mean ad is visible!
                LOG("MRAID not viewable");
                mraid.addEventListener('viewableChange', function cb(viewable){
                    if (!viewable) return;
                    mraid.removeEventListener('viewableChange', cb);
                    impression();
                });
                preconnect();
                return;
            }
        }

        var doImpression = function(){
            impression.state = true;
            fire('impression');
        };

        if (fnVisiState()) {
            doImpression();
            return;
        }

        preconnect();

        document.addEventListener(visibilityStateEvent, function cb(){
            if (!fnVisiState())
                return;
            document.removeEventListener(visibilityStateEvent, cb);
            doImpression();
        });
    };
    impression.state = false;
    // TODO commerically is this safe to delay till 'adunit' fires (count fewer impressions)?
    impression();

    
    var AdlooxAPIv0 = function(){
    var events = {
        'impression':	[],
        'viewability':	[]
    };

    var k = Object.keys(events);
    for (var i in k) {
        var event = k[i];
        subscribe(event, function(e){
            var n = events[event].length;
            while (n-->0) try { events[event][n](e) } catch(_) { LOG(_.message) };
        }.bind(event));
    }

    return {
        config: function(){
            return {
                visite_id: visite_id,
                cname: cname,
                cmp_id: cmp_id,
                ban_id: ban_id,
                version: version,
                date_regen: date_regen
            };
        },
        metrics: function(){
            return "NYI";
        },
        impression: function(){
            return impression.state;
        },
        adunit: function(){
            return adunit;
        },
        viewable: function(){
            return !visi.sensor.hidden()[0];
        },
        viewableCustom: function(){
            return !visi.sensor.hidden()[1];
        },

        subscribe: function(name, callback){
            if (!events[name]) events[name] = [];
            events[name].push(callback);
        },
        unsubscribe: function(name, callback){
            if (!events[name]) return;
            var pos = events[name].indexOf(callback);
            if (pos != -1) events[name].splice(pos, 1);
        }
    };
};

if (myelement) {
    myelement.getAdloox = function(version){
        switch (version) {
        case 0:
            return new AdlooxAPIv0();
            break;
        default:
            return new AdlooxAPIv0();
        }
    };
}

} catch(_) {
    if (typeof servername == 'undefined')
        servername = 'data01.adlooxtracking.com';
    if (typeof cname == 'undefined')
        cname = '';
    var js = typeof myelement == 'object' ? myelement.src : '';
    (new Image()).src = 'https://'+servername+'/ads/err.php?client='+escape(cname)+'&js='+escape(js)+'&visite_id='+escape(visite_id)+'&err='+escape(_.message);
    LOG(_.message);
}

})(window, document, navigator, screen, void 0);
