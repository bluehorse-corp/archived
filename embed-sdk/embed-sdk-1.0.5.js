function _define_property(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function _object_spread(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);(r="function"==typeof Object.getOwnPropertySymbols?r.concat(Object.getOwnPropertySymbols(n).filter(function(t){return Object.getOwnPropertyDescriptor(n,t).enumerable})):r).forEach(function(t){_define_property(e,t,n[t])})}return e}function ownKeys(e,t){var n,r=Object.keys(e);return Object.getOwnPropertySymbols&&(n=Object.getOwnPropertySymbols(e),t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)),r}function _object_spread_props(e,n){return n=null!=n?n:{},Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):ownKeys(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}),e}function isUrl(t){try{return new URL(t),!0}catch(t){return!1}}function encodeData(n){var t=Object.keys(n).filter(function(t){t=n[t];return"string"==typeof t&&isUrl(t)}).reduce(function(t,e){return _object_spread_props(_object_spread({},t),_define_property({},e,encodeURIComponent(n[e])))},{});return _object_spread({},n,t)}var $__BASE_URL="https://poomang.com",$__DEV_URL="https://dev.mangdyssey.com",$__LOCAL_URL="http://localhost:3000";function getHost(t){switch(t.toUpperCase()){case"LOCAL":return $__LOCAL_URL;case"DEVELOPMENT":return $__DEV_URL;default:return $__BASE_URL}}function createPoomangEmbed(){var u,d=null;return{container:null,init:function(t,e){var n=e.slug,r=e.resultId,o=e.showShareButton,o=void 0!==o&&o,c=e.data,a=e.environment,a=void 0===a?"production":a,i=e.onMessage,s=e.ignoreDefaultListener;if(!(d=document.getElementById(t)))throw new Error("id가 '".concat(t,"'인 iframe을 찾을 수 없습니다."));e="".concat(getHost(a),"/t/").concat(n).concat(r?"/".concat(r):""),t=new URLSearchParams(location.search);t.set("showShareButton","".concat(o)),t.set("domain",location.origin),t.set("embeded_script","true"),c&&t.set("data",JSON.stringify(encodeData(c))),u="".concat(e,"?").concat(t.toString()),d.setAttribute("src",u),window.addEventListener("message",function(e){try{var t="string"==typeof e.data?JSON.parse(e.data):e.data;null!=i&&i(t),s||("completeGame"===t.event?window.history.pushState(void 0,"","/".concat(n,"/result/").concat(t.data.resultId)):"retry"===t.event&&window.history.pushState(void 0,"","/".concat(n)))}catch(t){console.error("Event.data can not parse",e.data)}})}}}var initScriptName="";!function(){var e=null==(e=document.currentScript)?void 0:e.getAttribute("src");if(e)try{var n=new URL(e);initScriptName=n.searchParams.get("onload")||""}catch(t){initScriptName=null==(e=null==(n=e.split("?").slice(-1)[0])?void 0:n.split("&").filter(function(t){return t.includes("onload=")})[0])?void 0:e.replace("onload=","")}}(),document.addEventListener("DOMContentLoaded",function(){window["poomang.embed"]=createPoomangEmbed();var t=window[initScriptName];null!=t&&t()});