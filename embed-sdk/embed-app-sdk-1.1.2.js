/*!
 * 푸망 임베드 SDK 1.1.2
 *
 * 1.1.1 과의 차이는 하나다 — `message` 수신부가 **송신자를 검증한다**(`isFromOurFrame`).
 * 그래서 **고객사 페이지의 다른 스크립트가 보낸 메시지는 `onMessage` 로 전달되지 않는다.**
 * 그 동작에 기대고 있던 고객사가 있으면 1.1.2 로 올리기 전에 확인해야 한다.
 *
 * 1.1.1 파일은 건드리지 않는다. 쓰던 고객사는 그대로 두고, 검증이 필요한 곳만 이 주소로 옮긴다.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.PoomangEmbedSDK = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var BASE_URL = 'https://poomang.com';
    var DEV_URL = 'https://dev.mangdyssey.com';
    var LOCAL_URL = 'http://localhost:3000';

    function getHost(environment) {
        switch (environment.toUpperCase()) {
            case 'LOCAL':
                return LOCAL_URL;
            case 'DEVELOPMENT':
                return DEV_URL;
            default:
                return BASE_URL;
        }
    }

    function isUrl(value) {
        try {
            new URL(value);
            return true;
        } catch (e) {
            return false;
        }
    }

    function encodeData(data) {
        var result = {};
        Object.keys(data).forEach(function (key) {
            var value = data[key];
            if (typeof value === 'string' && isUrl(value)) {
                result[key] = encodeURIComponent(value);
            } else {
                result[key] = value;
            }
        });
        return result;
    }

    function ParseError(message) {
        var instance = new Error(message);
        instance.name = 'ParseError';
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(instance, ParseError.prototype);
        } else {
            instance.__proto__ = ParseError.prototype;
        }
        return instance;
    }
    ParseError.prototype = Object.create(Error.prototype, {
        constructor: { value: ParseError, writable: true, configurable: true }
    });
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(ParseError, Error);
    } else {
        ParseError.__proto__ = Error;
    }

    function parseData(event) {
        try {
            return typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            throw new ParseError();
        }
    }

    // 완주하면 부모 페이지 주소를 결과 주소로 바꾸는 것이 기본 동작인데, 그 주소를
    // 사이트 최상위 경로에 쓴다. 파트너 사이트에 없는 경로가 되므로 그 주소를 공유하면
    // 파트너의 이벤트 페이지가 열리지 않는다. 아래 호스트에서는 주소를 그대로 둔다.
    // 2026-09-08 신라면세점 요청. 다른 파트너의 동작은 그대로다.
    var KEEP_PARENT_URL_HOSTS = ['shilladfs.com', 'shilladutyfree.cn'];

    function keepsParentUrl() {
        var host = (location.hostname || '').toLowerCase();
        for (var i = 0; i < KEEP_PARENT_URL_HOSTS.length; i += 1) {
            var suffix = KEEP_PARENT_URL_HOSTS[i];
            if (host === suffix || host.slice(-(suffix.length + 1)) === '.' + suffix) {
                return true;
            }
        }
        return false;
    }

    /**
     * 이 메시지가 **우리 iframe 이 보낸 것인가.**
     *
     * 이 리스너는 고객사 페이지에 붙는다. `message` 는 그 페이지에 있는 모든 스크립트가
     * 보낼 수 있으므로, 검증 없이 `onMessage` 로 넘기면 누가 보냈는지 모르는 값이 고객사
     * 콜백과 `history.pushState` 에 그대로 들어간다(KISA 점검 지적 · 2026-09-16 LG U+).
     *
     * ── 왜 origin 을 기준으로 삼나 ──────────────────────────────────────────
     * 보내는 쪽은 고객사가 아니라 **우리 iframe** 이고, 그 주소는 SDK 가 직접 만든다
     * (`getHost(environment)`). 그래서 대조 기준이 고객사 도메인일 필요가 없다 —
     * 고객사 도메인을 우리가 몰라도 검증이 선다. 고객사마다 목록을 받아 두는 방식이면
     * 목록에서 빠진 곳이 조용히 멈추는데, 이 방식은 그럴 자리가 없다.
     *
     * ── source 는 있을 때만 본다 ────────────────────────────────────────────
     * `iframe` 은 `init()` 이 부를 때마다 덮어쓰는 한 칸이고 리스너는 한 번만 붙는다.
     * 고객사 화면이 iframe 요소를 다시 만들면서(SPA 재마운트) `init()` 을 다시 부르지
     * 않으면 이 칸은 떨어져 나간 노드를 가리키고 `contentWindow` 가 비어 **메시지가
     * 통째로 버려진다.** 그래서 `contentWindow` 가 살아 있을 때만 대조하고, 없으면
     * origin 대조만으로 통과시킨다. origin 이 이미 우리 도메인으로 고정돼 있어
     * 이 완화가 검사를 무르게 만들지 않는다.
     *
     * **걸린 메시지는 로그를 남기지 않는다.** 이 리스너는 고객사 페이지의 모든 메시지를
     * 받으므로(개발도구·광고 SDK·웹뷰 브릿지) 한 건마다 찍으면 운영 콘솔이 메시지 수만큼
     * 늘어난다. 안드로이드 고객사는 `WebChromeClient.onConsoleMessage` 로 콘솔 출력을
     * 한 줄씩 JSON 으로 파싱한다(`guide/api-sdk.md` 8장) — 그쪽에 넣을 줄이 아니다.
     */
    function isFromOurFrame(event, environment, frame) {
        if (event.origin !== getHost(environment)) return false;
        var win = frame && frame.contentWindow;
        if (win && event.source !== win) return false;
        return true;
    }

    function createPoomangEmbed() {
        var currentSrc;
        var iframe = null;
        var isListenerAttached = false;

        return {
            container: null,
            init: function (id, options) {
                var slug = options.slug;
                var resultId = options.resultId;
                var showShareButton = options.showShareButton !== undefined ? options.showShareButton : false;
                var data = options.data;
                var environment = options.environment !== undefined ? options.environment : 'production';
                var locale = options.locale;
                var onMessage = options.onMessage;
                var ignoreDefaultListener = options.ignoreDefaultListener;

                iframe = document.getElementById(id);
                if (!iframe) {
                    throw new Error("id가 '" + id + "'인 iframe을 찾을 수 없습니다.");
                }

                var localePath = locale ? '/' + locale : '';
                var url = getHost(environment) + localePath + '/t/' + slug + (resultId ? '/result/' + resultId : '');

                var params = new URLSearchParams(location.search);
                params.set('showShareButton', '' + showShareButton);
                params.set('embeded_script', 'true');
                params.set('isApp', 'true');
                params.set('domain', location.origin);
                // 개발 서버는 공개 전 콘텐츠를 안내 화면으로 돌린다. 파트너 페이지가
                // 같은 값을 붙이고 있어 SDK 도 맞춘다 — 운영에서는 붙지 않는다.
                if (environment && environment.toUpperCase() === 'DEVELOPMENT') {
                    params.set('forceVisit', 'aspoomang');
                }
                if (data) {
                    params.set('data', JSON.stringify(encodeData(data)));
                }

                currentSrc = url + '?' + params.toString();
                console.log('currentSrc', currentSrc);
                iframe.setAttribute('src', currentSrc);

                if (!isListenerAttached) {
                    window.addEventListener('message', function (event) {
                        // 리스너는 한 번만 붙으므로 여기서 보는 `environment` 는 **첫 init 의 값**이다.
                        // 한 페이지가 환경을 바꿔 가며 부르는 경우는 없다.
                        if (!isFromOurFrame(event, environment, iframe)) return;
                        try {
                            var parsed = parseData(event);
                            if (onMessage != null) {
                                onMessage(parsed);
                            }
                            if (!ignoreDefaultListener && !keepsParentUrl()) {
                                if (parsed.event === 'completeGame') {
                                    window.history.pushState(undefined, '', '/' + slug + '/result/' + parsed.data.resultId);
                                } else if (parsed.event === 'retry') {
                                    window.history.pushState(undefined, '', '/' + slug);
                                }
                            }
                        } catch (e) {
                            if (e instanceof ParseError) {
                                console.error('Event.data can not parse', event.data);
                            }
                            throw e;
                        }
                    });
                    isListenerAttached = true;
                }
            }
        };
    }

    var initScriptName = '';
    (function () {
        var src = document.currentScript ? document.currentScript.getAttribute('src') : null;
        if (!src) return;
        try {
            var url = new URL(src);
            initScriptName = url.searchParams.get('onload') || '';
        } catch (e) {
            var query = src.split('?').slice(-1)[0];
            var onloadParam =
                query &&
                query.split('&').filter(function (part) {
                    return part.includes('onload=');
                })[0];
            initScriptName = onloadParam ? onloadParam.replace('onload=', '') : '';
        }
    })();

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function () {
            window['poomang.embed'] = createPoomangEmbed();
            var onloadCallback = window[initScriptName];
            if (onloadCallback != null) {
                onloadCallback();
            }
        });
    }

    return {
        createPoomangEmbed: createPoomangEmbed
    };
});