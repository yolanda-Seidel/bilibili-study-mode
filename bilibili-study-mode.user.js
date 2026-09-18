from pathlib import Path

code = """// ==UserScript==
// @name         Bilibili Study Mode
// @namespace    https://github.com/yolanda-Seidel/bilibili-study-mode
// @version      1.4.1
// @description  A lightweight Tampermonkey userscript that turns Bilibili Web into a distraction-free study interface.
// @author       yolanda
// @homepageURL  https://github.com/yolanda-Seidel/bilibili-study-mode
// @supportURL   https://github.com/yolanda-Seidel/bilibili-study-mode/issues
// @downloadURL  https://raw.githubusercontent.com/yolanda-Seidel/bilibili-study-mode/main/bilibili-study-mode.user.js
// @updateURL    https://raw.githubusercontent.com/yolanda-Seidel/bilibili-study-mode/main/bilibili-study-mode.user.js
// @license      MIT
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// @noframes
// ==/UserScript==

(() => {
    'use strict';

    const list = s =>
        s.split('|')
            .map(x => x.trim().toLowerCase())
            .filter(Boolean);

    const ALLOW = list(`
        考研|初试|复试|真题|刷题|备考|考纲|考研数学|考研英语|考研政治|
        数学|高数|高等数学|微积分|线代|线性代数|概率论|概率统计|统计学|
        极限|导数|微分|积分|级数|矩阵|特征值|特征向量|傅里叶|拉普拉斯|
        微分方程|泰勒|中值定理|calculus|algebra|statistics|probability|mathematics|
        英语|英语一|英语二|词汇|单词|长难句|阅读理解|英语作文|
        雅思|托福|gre|ielts|toefl|grammar|vocabulary|
        编程|程序设计|算法|数据结构|人工智能|机器学习|深度学习|
        python|javascript|typescript|java|sql|machine learning|deep learning|computer science|
        教程|课程|公开课|网课|课堂|教学|知识点|学习方法|论文|科研|学术|
        lecture|tutorial|course|lesson|research|academic|
        study with me|studywithme|陪伴学习|陪你学习|一起学习|
        自习|自习室|云自习|沉浸式学习|沉浸学习|
        番茄钟|pomodoro|专注学习|学习计时|
        学习白噪音|学习音乐|专注音乐|focus study|study session
    `);

    const DENY = list(`
        直播|游戏|电竞|手游|端游|主机游戏|gameplay|
        游戏开发|游戏设计|游戏策划|关卡设计|关卡策划|战斗策划|数值策划|
        game design|game development|level design|
        ue4|ue5|unity|unreal engine|steam|switch|playstation|ps5|xbox|
        原神|崩坏|星穹铁道|鸣潮|王者荣耀|英雄联盟|league of legends|
        dota|cs2|csgo|valorant|无畏契约|守望先锋|overwatch|apex|
        绝地求生|pubg|我的世界|minecraft|魔兽世界|最终幻想|ff14|ffxiv|
        怪物猎人|黑神话|实况|速通|开荒|抽卡|配队|通关|
        经济学|微观经济学|宏观经济学|博弈论|纳什均衡|
        金融|会计|管理学|战略管理|创新战略|商业分析|可持续发展|
        economics|microeconomics|macroeconomics|game theory|nash equilibrium|
        finance|accounting|management|strategic management|business analytics|sustainability|
        番剧|动漫|新番|搞笑|整活|鬼畜|沙雕|
        amv|mad|cosplay|吃播|探店|旅游vlog|日常vlog|
        reaction|开箱|带货
    `);

    const WHITE_UP = list(`3blue1brown|mit opencourseware`);
    const HIDE = 'bsm-hide';

    const HOME_CARD = [
        '.container.is-version8 > .feed-card',
        '.container.is-version8 > .bili-feed-card'
    ].join(',');

    const SEARCH_CARD = [
        '.video-list-item',
        '.video-item',
        '.bili-video-card'
    ].join(',');

    let enabled = GM_getValue('bsm-enabled', true);
    let queued = false;

    const txt = el =>
        String(el?.innerText || '')
            .toLowerCase()
            .replace(/\\s+/g, ' ')
            .trim();

    const hit = (text, words) =>
        words.some(word => text.includes(word));

    const home = () =>
        location.hostname === 'www.bilibili.com' &&
        /^\\/(?:index\\.html)?$/.test(location.pathname);

    const search = () =>
        location.hostname === 'search.bilibili.com';

    const video = () =>
        location.hostname === 'www.bilibili.com' &&
        location.pathname.startsWith('/video/');

    const query = () => {
        const p = new URLSearchParams(location.search);

        return (
            p.get('keyword') ||
            p.get('search_keyword') ||
            ''
        ).toLowerCase();
    };

    const style = document.createElement('style');

    style.textContent = `
        html.bsm-on .${HIDE} {
            display: none !important;
        }

        html.bsm-on .bili-header__channel,
        html.bsm-on .bili-header-channel,
        html.bsm-on .home-channel,
        html.bsm-on .channel-icons,
        html.bsm-on .channel-floor,
        html.bsm-on .channel-items__left,
        html.bsm-on .channel-items__right,
        html.bsm-on [class*="channel-fixed"],
        html.bsm-on [class*="fixed-channel"],
        html.bsm-on [class*="channel-nav"],
        html.bsm-on [class*="channel-entry"] {
            display: none !important;
        }

        html.bsm-on .bili-header .left-entry,
        html.bsm-on .bili-header__bar .left-entry {
            display: none !important;
        }

        html.bsm-on .recommended-swipe,
        html.bsm-on .floor-single-card,
        html.bsm-on .bili-live-card {
            display: none !important;
        }

        html.bsm-on .recommended-container_floor-aside {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        html.bsm-on
        .recommended-container_floor-aside
        > .container.is-version8 {
            display: grid !important;
            width: auto !important;
            margin: 0 42px !important;
            padding: 0 !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            grid-auto-flow: row dense !important;
            gap: 30px 20px !important;
            align-items: start !important;
        }

        html.bsm-on
        .container.is-version8
        > :not(.feed-card):not(.bili-feed-card) {
            display: none !important;
        }

        html.bsm-on
        .container.is-version8
        > .feed-card,

        html.bsm-on
        .container.is-version8
        > .bili-feed-card {
            display: block;
            grid-column: auto !important;
            grid-row: auto !important;
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        html.bsm-on
        .container.is-version8
        > .${HIDE} {
            display: none !important;
        }

        html.bsm-on .ad-report,
        html.bsm-on .bili-video-card__ad-icon,
        html.bsm-on [class*="commercial-ad"],
        html.bsm-on [class*="creative-ad"],
        html.bsm-on [class*="banner-ad"],

        html.bsm-on
        .feed-card:has(a[href*="cm.bilibili.com"]),

        html.bsm-on
        .bili-feed-card:has(a[href*="cm.bilibili.com"]) {
            display: none !important;
        }

        html.bsm-on #commentapp,
        html.bsm-on #comment,
        html.bsm-on .reply-warp,
        html.bsm-on .reply-box {
            display: none !important;
        }

        html.bsm-on #reco_list,
        html.bsm-on #recom_module,
        html.bsm-on .recommend-list-v1,
        html.bsm-on .rec-list,
        html.bsm-on .video-page-special-card-small,
        html.bsm-on .video-page-game-card,
        html.bsm-on #slide_ad,
        html.bsm-on #bannerAd {
            display: none !important;
        }

        @media (max-width: 1450px) {
            html.bsm-on
            .recommended-container_floor-aside
            > .container.is-version8 {
                grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }
        }

        @media (max-width: 1080px) {
            html.bsm-on
            .recommended-container_floor-aside
            > .container.is-version8 {
                margin: 0 24px !important;
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }
        }
    `;

    document.head.appendChild(style);

    function allowed(card) {
        const t = txt(card);

        if (!t)
            return null;

        if (
            card.querySelector(
                'a[href*="live.bilibili.com"],' +
                'a[href*="cm.bilibili.com"],' +
                '.bili-live-card,' +
                '.bili-video-card__ad-icon,' +
                '.ad-report'
            )
        ) {
            return false;
        }

        if (hit(t, DENY))
            return false;

        if (hit(t, WHITE_UP))
            return true;

        if (hit(t, ALLOW))
            return true;

        if (search()) {
            const q = query();

            if (
                q &&
                hit(q, ALLOW) &&
                !hit(q, DENY)
            ) {
                return true;
            }
        }

        return false;
    }

    function cleanHome() {
        if (!home())
            return;

        document
            .querySelectorAll(HOME_CARD)
            .forEach(card => {
                const result = allowed(card);

                if (result === null)
                    return;

                card.classList.toggle(HIDE, !result);
            });
    }

    function cleanSearch() {
        if (!search())
            return;

        document
            .querySelectorAll(SEARCH_CARD)
            .forEach(card => {
                const result = allowed(card);

                if (result === null)
                    return;

                card.classList.toggle(HIDE, !result);
            });
    }

    function cleanHeader() {
        document
            .querySelectorAll(
                '.right-entry > *,' +
                '.bili-header__bar .right-entry > *'
            )
            .forEach(item => {
                const t = txt(item).replace(/\\s/g, '');

                item.classList.toggle(
                    HIDE,
                    !(t.includes('动态') || t.includes('收藏'))
                );
            });

        document
            .querySelectorAll(
                '.right-entry a,' +
                '.right-entry button'
            )
            .forEach(item => {
                const t = txt(item).replace(/\\s/g, '');

                item.classList.toggle(
                    HIDE,
                    !(t.includes('动态') || t.includes('收藏'))
                );
            });

        document
            .querySelectorAll(
                '.header-avatar-wrap,' +
                '[class*="header-avatar"]'
            )
            .forEach(el => el.classList.add(HIDE));

        document
            .querySelectorAll(
                'body > div, #i_cecream > div'
            )
            .forEach(el => {
                const t = txt(el).replace(/\\s/g, '');

                if (
                    t.includes('番剧') &&
                    t.includes('国创') &&
                    t.includes('综艺') &&
                    t.includes('鬼畜') &&
                    t.includes('科技数码')
                ) {
                    const rect = el.getBoundingClientRect();

                    if (rect.height > 20 && rect.height < 160)
                        el.classList.add(HIDE);
                }
            });
    }

    function cleanVideo() {
        if (!video())
            return;

        document
            .querySelectorAll(
                [
                    '#multi_page',
                    '#eplist_module',
                    '#seasonlist_module',
                    '.base-video-sections',
                    '[class*="ugc-season"]',
                    '[class*="video-sections"]',
                    '[class*="section-list"]'
                ].join(',')
            )
            .forEach(el => el.classList.remove(HIDE));
    }

    function run() {
        if (!enabled)
            return;

        document.documentElement.classList.add('bsm-on');

        cleanHeader();
        cleanHome();
        cleanSearch();
        cleanVideo();
    }

    function schedule() {
        if (queued)
            return;

        queued = true;

        requestAnimationFrame(() => {
            queued = false;
            run();
        });
    }

    new MutationObserver(schedule)
        .observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

    document.addEventListener(
        'keydown',
        e => {
            if (
                !e.altKey ||
                e.code !== 'KeyS' ||
                ['INPUT', 'TEXTAREA']
                    .includes(document.activeElement?.tagName)
            ) {
                return;
            }

            e.preventDefault();

            GM_setValue(
                'bsm-enabled',
                !enabled
            );

            location.reload();
        }
    );

    run();

    setTimeout(run, 300);
    setTimeout(run, 800);
    setTimeout(run, 1600);

    setInterval(run, 1600);
})();
"""

path = Path("/mnt/data/bilibili-study-mode.user.js")
path.write_text(code, encoding="utf-8")

print(f"Created: {path}")
print(f"Lines: {len(code.splitlines())}")
