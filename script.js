    // ===== Bootstrap language template before UI init =====
    (function () {
      const storageKey = "stvnworld-language";
      const saved = localStorage.getItem(storageKey);
      const target = saved === "zh-CN" ? "zh-CN" : "en";
      const appRoot = document.getElementById("appRoot");
      const zhTemplate = document.getElementById("zhAppTemplate");

      if (!appRoot) return;

      if (target === "zh-CN" && zhTemplate) {
        appRoot.innerHTML = zhTemplate.innerHTML.trim();
        appRoot.setAttribute("data-lang", "zh");
        document.documentElement.setAttribute("lang", "zh-Hans");
      } else {
        appRoot.setAttribute("data-lang", "en");
        document.documentElement.setAttribute("lang", "en");
      }
    })();

    const IS_ZH = (document.documentElement.getAttribute("lang") || "").toLowerCase().startsWith("zh");

    // Remove accidental duplicate English resources block in Chinese mode
    (function () {
      if (!IS_ZH) return;
      const appRoot = document.getElementById("appRoot");
      if (!appRoot) return;
      const resourceSections = Array.from(document.querySelectorAll('.content#resources'));
      if (resourceSections.length > 1) {
        const zhFirst = resourceSections.find((el) => /扩展资源/.test(el.querySelector("h2")?.textContent || ""));
        if (zhFirst) {
          resourceSections.forEach((el) => { if (el !== zhFirst) el.remove(); });
        } else {
          resourceSections.slice(1).forEach((el) => el.remove());
        }
      }
      document.querySelectorAll(".content h2").forEach((h2) => {
        if (/^\s*Extra Resources\s*$/i.test(h2.textContent || "")) {
          const wrap = h2.closest(".content");
          if (wrap) wrap.remove();
        }
      });
    })();

    // ===== Allow mobile table wrapping at "/" only =====
    (function () {
      const cells = document.querySelectorAll(".mobile-fit-table th, .mobile-fit-table td");
      if (!cells.length) return;

      cells.forEach((cell) => {
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach((node) => {
          const value = node.nodeValue || "";
          if (!value.includes("/")) return;
          node.nodeValue = value.replace(/\/(?!\u200B)/g, "/\u200B");
        });
      });
    })();

    // ===== Style chooser =====
    (function () {
      const select = document.getElementById("themeSelect");
      if (!select) return;

      const storageKey = "stvnworld-theme";
      const saved = localStorage.getItem(storageKey);
      const initial = saved || "default";

      function applyTheme(theme) {
        if (theme === "default") {
          document.body.removeAttribute("data-theme");
        } else {
          document.body.setAttribute("data-theme", theme);
        }
        localStorage.setItem(storageKey, theme);
      }

      applyTheme(initial);
      select.value = initial;

      select.addEventListener("change", () => {
        applyTheme(select.value);
      });
    })();

    // ===== Language selector =====
    (function () {
      const select = document.getElementById("languageSelect");
      if (!select) return;

      const storageKey = "stvnworld-language";
      const appRoot = document.getElementById("appRoot");
      const currentIsZh = appRoot?.getAttribute("data-lang") === "zh";

      function normalizeLanguage(lang) {
        return lang === "zh-CN" ? "zh-CN" : "en";
      }

      const initialLanguage = normalizeLanguage(currentIsZh ? "zh-CN" : "en");
      select.value = initialLanguage;
      localStorage.setItem(storageKey, initialLanguage);

      select.addEventListener("change", () => {
        const target = normalizeLanguage(select.value);
        const needsSwitch = (target === "zh-CN" && !currentIsZh) || (target === "en" && currentIsZh);
        localStorage.setItem(storageKey, target);
        if (needsSwitch) {
          window.location.reload();
        }
      });
    })();

    // ===== Nav dropdowns =====
    (function () {
      const nav = document.querySelector("nav");
      const navToggle = document.querySelector(".nav-toggle");
      const navItemsWrap = document.getElementById("mainNav");
      const navItems = document.querySelectorAll(".nav-item");
      const dropButtons = document.querySelectorAll(".nav-drop");
      const INACTIVE_HIDE_MS = 2200;
      let hideTimer = null;
      let scrollStopTimer = null;
      let lastActivityAt = Date.now();
      let userIsScrolling = false;

      if (!navItems.length) return;

      function closeNav() {
        if (!nav || !navToggle || !navItemsWrap) return;
        nav.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }

      function closeAll(except) {
        navItems.forEach((item) => {
          if (item !== except) item.classList.remove("open");
        });
        dropButtons.forEach((btn) => {
          if (!except || btn.closest(".nav-item") !== except) {
            btn.setAttribute("aria-expanded", "false");
          }
        });
      }

      function showNav() {
        if (!nav) return;
        nav.classList.remove("nav-hidden");
      }

      function markActivity() {
        lastActivityAt = Date.now();
      }

      function scheduleNavHide() {
        if (!nav) return;
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          const inactiveMs = Date.now() - lastActivityAt;
          if (window.scrollY <= 80) return;
          if (nav.classList.contains("nav-open")) return;
          if (userIsScrolling) return;
          if (inactiveMs < INACTIVE_HIDE_MS) {
            scheduleNavHide();
            return;
          }
          nav.classList.add("nav-hidden");
        }, INACTIVE_HIDE_MS);
      }

      function onScrollActivity() {
        showNav();
        markActivity();
        userIsScrolling = true;
        if (hideTimer) clearTimeout(hideTimer);
        if (scrollStopTimer) clearTimeout(scrollStopTimer);
        scrollStopTimer = setTimeout(() => {
          userIsScrolling = false;
          scheduleNavHide();
        }, 220);
      }

      if (navToggle && nav && navItemsWrap) {
        navToggle.addEventListener("click", () => {
          showNav();
          markActivity();
          const willOpen = !nav.classList.contains("nav-open");
          nav.classList.toggle("nav-open", willOpen);
          navToggle.setAttribute("aria-expanded", String(willOpen));
          if (!willOpen) closeAll();
          if (willOpen && hideTimer) clearTimeout(hideTimer);
          if (!willOpen) scheduleNavHide();
        });
      }

      dropButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const item = btn.closest(".nav-item");
          const isOpen = item.classList.contains("open");
          closeAll(item);
          item.classList.toggle("open", !isOpen);
          btn.setAttribute("aria-expanded", String(!isOpen));
        });
      });

      document.querySelectorAll(".nav-menu a, .nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          showNav();
          markActivity();
          closeAll();
          closeNav();
          scheduleNavHide();
        });
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest(".nav-item") && !e.target.closest(".nav-toggle")) {
          closeAll();
          closeNav();
        }
      });

      window.addEventListener("scroll", onScrollActivity, { passive: true });
      window.addEventListener("touchmove", onScrollActivity, { passive: true });
      window.addEventListener("wheel", onScrollActivity, { passive: true });
      window.addEventListener("keydown", () => {
        showNav();
        markActivity();
        scheduleNavHide();
      });

      nav?.addEventListener("mouseenter", () => {
        showNav();
        markActivity();
        if (hideTimer) clearTimeout(hideTimer);
      });
      nav?.addEventListener("mouseleave", () => {
        scheduleNavHide();
      });

      scheduleNavHide();
    })();

    // ===== Secret code effects =====
    (function () {
      const form = document.getElementById("secretCodeForm");
      const input = document.getElementById("secretCodeInput");
      const status = document.getElementById("secretCodeStatus");

      if (!form || !input || !status) return;

      const THEME_PALETTES = {
        default: ["#76d5ff", "#9e8cff", "#ffe182"],
        fantasy: ["#7bd389", "#f3d36f", "#ff8fa8"],
        dreamy: ["#9fd6ff", "#ffd2ef", "#fff2a8"],
        futuristic: ["#5df2ff", "#6fa8ff", "#aaf0d1"],
        simple: ["#5c8f7f", "#d6a45b", "#e8d8b9"],
        sunlit: ["#ffb347", "#ffdf6b", "#ff8f70"],
        linen: ["#c7895a", "#f1d7b5", "#b86b4b"],
        handwritten: ["#b86b4b", "#d7a85c", "#8bb174"],
        adventure: ["#88c057", "#d9822b", "#5da3c6"],
        star: ["#7fd8ff", "#9b87f5", "#f5d76e"],
        pinky: ["#ff8fc7", "#ffc2dd", "#ffd98e"],
        icy: ["#95ecff", "#b9cfff", "#e5fbff"],
        classic: ["#b79b6c", "#d4c2a3", "#8ca3c7"],
      };
      const validCodes = new Map([
        ["0902", { type: "midnight", label: IS_ZH ? "深蓝星旋" : "midnight star spiral" }],
        ["0909", { type: "violet", label: IS_ZH ? "紫星旋涡" : "violet star spiral" }],
        ["1220", { type: "laser", label: IS_ZH ? "红色激光阵" : "red laser array" }],
        ["0628", { type: "thunder", label: IS_ZH ? "金色雷暴" : "gold thunderstorm" }],
        ["0806", { type: "hearts", label: IS_ZH ? "粉心绽放" : "pink heart burst" }],
        ["0315", { type: "elements", label: IS_ZH ? "水火对冲" : "fire and water clash" }],
        ["1104", { type: "iceworld", label: IS_ZH ? "冰晶世界" : "icy diamond world" }],
        ["fiu", { type: "fiu", label: "FIU" }],
        ["fiush", { type: "fiush", label: "fiush" }],
        ["mama", { type: "mama", label: IS_ZH ? "母亲节" : "mother's day" }],
        ["music game", { type: "musicgame", label: IS_ZH ? "音乐游戏" : "music game" }],
        ["polar bear", { type: "polarbear", label: "polar bear" }],
        ["spiretz", { type: "spiretz", label: "spiretz" }],
        ["888888888", { type: "rain", label: IS_ZH ? "数字雨" : "numeric rain" }],
        ["ffzfzzfdzfmzfvzfkzfrzftzf", { type: "halo", label: IS_ZH ? "秘环" : "secret halo" }]
      ]);
      const glyphs = ["✦", "✧", "✺", "◌", "☼", "⟡", "⟢", "⟣"];
      const overlay = document.createElement("div");
      overlay.className = "secret-code-overlay";
      document.body.appendChild(overlay);
      const musicGameLayer = document.createElement("div");
      musicGameLayer.className = "music-game-layer";
      document.body.appendChild(musicGameLayer);

      let cleanupTimer = null;
      let musicGameState = null;

      function setStatus(message, type) {
        status.textContent = message;
        status.classList.toggle("is-error", type === "error");
        status.classList.toggle("is-success", type === "success");
      }

      function clearEffect() {
        overlay.classList.remove("effect-burst", "effect-rain", "effect-halo", "effect-violet", "effect-laser", "effect-thunder", "effect-elements", "effect-iceworld", "effect-midnight", "effect-fiu", "effect-spiretz", "effect-fiush", "effect-hearts", "effect-polarbear", "effect-mama");
        overlay.classList.remove("active");
        overlay.replaceChildren();
      }

      function getThemePalette() {
        const theme = document.body.getAttribute("data-theme") || "default";
        return THEME_PALETTES[theme] || THEME_PALETTES.default;
      }

      function applyPalette(palette) {
        overlay.style.setProperty("--secret-a", palette[0]);
        overlay.style.setProperty("--secret-b", palette[1]);
        overlay.style.setProperty("--secret-c", palette[2]);
        musicGameLayer.style.setProperty("--music-a", palette[0]);
        musicGameLayer.style.setProperty("--music-b", palette[1]);
        musicGameLayer.style.setProperty("--music-c", palette[2]);
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      function mapPitchToMidi(step, alter, octave) {
        const pitchMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        return (Number(octave) + 1) * 12 + (pitchMap[step] ?? 0) + Number(alter || 0);
      }

      function createSeededPosition(seed, xBias = 0, yBias = 0) {
        const x = 0.18 + ((Math.sin(seed * 12.9898 + xBias) + 1) * 0.5) * 0.64;
        const y = 0.18 + ((Math.sin(seed * 7.233 + yBias) + 1) * 0.5) * 0.58;
        return { x: clamp(x, 0.14, 0.86), y: clamp(y, 0.16, 0.84) };
      }

      const MUSIC_SONGS = {
        fiu: {
          label: "fiu",
          bpm: 87,
          audioSrc: "assets/open-sky-fiu.mp3",
          chartSrc: "assets/open-sky-fiu.musicxml",
        },
        palace: {
          label: "Palace",
          bpm: 192,
          audioSrc: "assets/palace.mp3",
          chartSrc: "assets/palace.mxl",
        },
        lafantasia: {
          label: "La Fantasia",
          bpm: 70,
          audioSrc: "assets/la-fantasia.mp3",
          chartSrc: "assets/la-fantasia.mxl",
        },
        recordplayer: {
          label: "Record Player",
          bpm: 190,
          audioSrc: "assets/record-player.mp3",
          chartSrc: "assets/record-player.mxl",
        },
        stallion: {
          label: "Stallion",
          bpm: 130,
          audioSrc: "assets/stallion.mp3",
          chartSrc: "assets/stallion.mxl",
        },
      };

      const BUILTIN_MUSIC_CHARTS = {"fiu":{"bpm":87,"durationMs":101035,"chart":[{"id":"tap-0","type":"tap","timeMs":7931,"x":0.8197,"y":0.2112},{"id":"tap-1","type":"tap","timeMs":8103,"x":0.1806,"y":0.4036},{"id":"tap-2","type":"tap","timeMs":8276,"x":0.1881,"y":0.6275},{"id":"tap-3","type":"tap","timeMs":8621,"x":0.2735,"y":0.2243},{"id":"drag-4","type":"drag","timeMs":8793,"endTimeMs":9310,"x":0.3185,"y":0.1801,"endX":0.3292,"endY":0.16,"accent":"green"},{"id":"drag-5","type":"drag","timeMs":9310,"endTimeMs":9827,"x":0.7699,"y":0.7162,"endX":0.8581,"endY":0.84,"accent":"purple"},{"id":"drag-6","type":"drag","timeMs":9828,"endTimeMs":10345,"x":0.4596,"y":0.1982,"endX":0.5844,"endY":0.3286,"accent":"green"},{"id":"tap-7","type":"tap","timeMs":10345,"x":0.8168,"y":0.1801},{"id":"drag-8","type":"drag","timeMs":10690,"endTimeMs":11207,"x":0.3529,"y":0.7111,"endX":0.5613,"endY":0.7619,"accent":"green"},{"id":"tap-9","type":"tap","timeMs":11207,"x":0.7716,"y":0.76},{"id":"drag-10","type":"drag","timeMs":11379,"endTimeMs":12069,"x":0.2996,"y":0.3003,"endX":0.1595,"endY":0.4224,"accent":"green"},{"id":"tap-11","type":"tap","timeMs":12069,"x":0.4182,"y":0.3045},{"id":"tap-12","type":"tap","timeMs":12414,"x":0.7434,"y":0.5573},{"id":"tap-13","type":"tap","timeMs":12759,"x":0.1897,"y":0.5447},{"id":"tap-14","type":"tap","timeMs":12931,"x":0.1956,"y":0.7565},{"id":"tap-15","type":"tap","timeMs":13103,"x":0.1836,"y":0.7009},{"id":"tap-16","type":"tap","timeMs":13276,"x":0.18,"y":0.5035},{"id":"tap-17","type":"tap","timeMs":13448,"x":0.1805,"y":0.76},{"id":"tap-18","type":"tap","timeMs":13793,"x":0.3781,"y":0.69},{"id":"tap-19","type":"tap","timeMs":13966,"x":0.6839,"y":0.6486},{"id":"tap-20","type":"tap","timeMs":14138,"x":0.3503,"y":0.5279},{"id":"tap-21","type":"tap","timeMs":14310,"x":0.4043,"y":0.6659},{"id":"tap-22","type":"tap","timeMs":14483,"x":0.5928,"y":0.1835},{"id":"tap-23","type":"tap","timeMs":14655,"x":0.3754,"y":0.4935},{"id":"tap-24","type":"tap","timeMs":14828,"x":0.329,"y":0.6946},{"id":"tap-25","type":"tap","timeMs":15000,"x":0.7508,"y":0.1892},{"id":"tap-26","type":"tap","timeMs":15172,"x":0.7798,"y":0.3277},{"id":"tap-27","type":"tap","timeMs":15345,"x":0.1846,"y":0.3505},{"id":"drag-28","type":"drag","timeMs":15517,"endTimeMs":16551,"x":0.189,"y":0.7202,"endX":0.3115,"endY":0.5887,"accent":"green"},{"id":"tap-29","type":"tap","timeMs":24828,"x":0.1828,"y":0.3825},{"id":"tap-30","type":"tap","timeMs":25000,"x":0.1939,"y":0.21},{"id":"tap-31","type":"tap","timeMs":25172,"x":0.7781,"y":0.2404},{"id":"tap-32","type":"tap","timeMs":25345,"x":0.7486,"y":0.1832},{"id":"tap-33","type":"tap","timeMs":25517,"x":0.7616,"y":0.3974},{"id":"tap-34","type":"tap","timeMs":25690,"x":0.2174,"y":0.5303},{"id":"tap-35","type":"tap","timeMs":25862,"x":0.2079,"y":0.7584},{"id":"tap-36","type":"tap","timeMs":26034,"x":0.2331,"y":0.6916},{"id":"tap-37","type":"tap","timeMs":26207,"x":0.7216,"y":0.7241},{"id":"tap-38","type":"tap","timeMs":26379,"x":0.681,"y":0.5453},{"id":"tap-39","type":"tap","timeMs":26552,"x":0.6984,"y":0.7564},{"id":"tap-40","type":"tap","timeMs":26724,"x":0.2718,"y":0.706},{"id":"tap-41","type":"tap","timeMs":26897,"x":0.2572,"y":0.3272},{"id":"tap-42","type":"tap","timeMs":27069,"x":0.2944,"y":0.553},{"id":"tap-43","type":"tap","timeMs":27241,"x":0.6467,"y":0.4967},{"id":"tap-44","type":"tap","timeMs":27414,"x":0.5985,"y":0.6967},{"id":"tap-45","type":"tap","timeMs":27586,"x":0.6188,"y":0.314},{"id":"tap-46","type":"tap","timeMs":27759,"x":0.3451,"y":0.2213},{"id":"tap-47","type":"tap","timeMs":27931,"x":0.3265,"y":0.2956},{"id":"tap-48","type":"tap","timeMs":28103,"x":0.3727,"y":0.1821},{"id":"tap-49","type":"tap","timeMs":28276,"x":0.5598,"y":0.1946},{"id":"tap-50","type":"tap","timeMs":28448,"x":0.5078,"y":0.2137},{"id":"tap-51","type":"tap","timeMs":28621,"x":0.5293,"y":0.3082},{"id":"tap-52","type":"tap","timeMs":28793,"x":0.4311,"y":0.4326},{"id":"tap-53","type":"tap","timeMs":28966,"x":0.4102,"y":0.7521},{"id":"tap-54","type":"tap","timeMs":29138,"x":0.4614,"y":0.6169},{"id":"tap-55","type":"tap","timeMs":29310,"x":0.4679,"y":0.6632},{"id":"tap-56","type":"tap","timeMs":29483,"x":0.4164,"y":0.448},{"id":"tap-57","type":"tap","timeMs":29655,"x":0.4374,"y":0.7552},{"id":"tap-58","type":"tap","timeMs":29828,"x":0.5229,"y":0.7486},{"id":"tap-59","type":"tap","timeMs":30000,"x":0.5013,"y":0.4192},{"id":"tap-60","type":"tap","timeMs":30172,"x":0.5534,"y":0.6406},{"id":"tap-61","type":"tap","timeMs":30345,"x":0.3786,"y":0.5912},{"id":"tap-62","type":"tap","timeMs":30517,"x":0.332,"y":0.7439},{"id":"tap-63","type":"tap","timeMs":30690,"x":0.3507,"y":0.404},{"id":"tap-64","type":"tap","timeMs":30862,"x":0.6127,"y":0.285},{"id":"tap-65","type":"tap","timeMs":31034,"x":0.5923,"y":0.2285},{"id":"tap-66","type":"tap","timeMs":31207,"x":0.641,"y":0.1869},{"id":"tap-67","type":"tap","timeMs":31379,"x":0.2994,"y":0.1801},{"id":"tap-68","type":"tap","timeMs":31552,"x":0.2615,"y":0.2733},{"id":"tap-69","type":"tap","timeMs":31724,"x":0.2764,"y":0.2374},{"id":"tap-70","type":"tap","timeMs":31897,"x":0.6933,"y":0.3392},{"id":"tap-71","type":"tap","timeMs":32069,"x":0.6756,"y":0.7136},{"id":"tap-72","type":"tap","timeMs":32241,"x":0.7169,"y":0.5254},{"id":"tap-73","type":"tap","timeMs":32414,"x":0.2368,"y":0.5803},{"id":"tap-74","type":"tap","timeMs":32586,"x":0.2106,"y":0.3531},{"id":"tap-75","type":"tap","timeMs":32759,"x":0.2205,"y":0.7217},{"id":"tap-76","type":"tap","timeMs":32931,"x":0.7578,"y":0.7595},{"id":"tap-77","type":"tap","timeMs":41379,"x":0.7254,"y":0.2944},{"id":"tap-78","type":"tap","timeMs":41552,"x":0.6854,"y":0.5147},{"id":"tap-79","type":"tap","timeMs":41724,"x":0.3764,"y":0.4575},{"id":"tap-80","type":"tap","timeMs":41897,"x":0.4261,"y":0.6702},{"id":"tap-81","type":"tap","timeMs":42069,"x":0.4053,"y":0.2824},{"id":"tap-82","type":"tap","timeMs":42241,"x":0.6321,"y":0.2034},{"id":"tap-83","type":"tap","timeMs":42414,"x":0.6515,"y":0.3285},{"id":"tap-84","type":"tap","timeMs":42586,"x":0.6035,"y":0.1894},{"id":"tap-85","type":"tap","timeMs":42759,"x":0.4655,"y":0.2094},{"id":"tap-86","type":"tap","timeMs":42931,"x":0.5178,"y":0.1977},{"id":"tap-87","type":"tap","timeMs":43103,"x":0.4962,"y":0.3422},{"id":"tap-88","type":"tap","timeMs":43276,"x":0.5437,"y":0.4718},{"id":"tap-89","type":"tap","timeMs":43448,"x":0.565,"y":0.7586},{"id":"tap-90","type":"tap","timeMs":43621,"x":0.5131,"y":0.6493},{"id":"tap-91","type":"tap","timeMs":43793,"x":0.5574,"y":0.6906},{"id":"tap-92","type":"tap","timeMs":43966,"x":0.6079,"y":0.4872},{"id":"tap-93","type":"tap","timeMs":44138,"x":0.5874,"y":0.7597},{"id":"tap-94","type":"tap","timeMs":44310,"x":0.4517,"y":0.7352},{"id":"tap-95","type":"tap","timeMs":44483,"x":0.4732,"y":0.3811},{"id":"tap-96","type":"tap","timeMs":44655,"x":0.4216,"y":0.6074},{"id":"tap-97","type":"tap","timeMs":44828,"x":0.6446,"y":0.5545},{"id":"tap-98","type":"tap","timeMs":45000,"x":0.6892,"y":0.7286},{"id":"tap-99","type":"tap","timeMs":45172,"x":0.6714,"y":0.3665},{"id":"tap-100","type":"tap","timeMs":45345,"x":0.3637,"y":0.2565},{"id":"tap-101","type":"tap","timeMs":61379,"x":0.4893,"y":0.6401},{"id":"tap-102","type":"tap","timeMs":61552,"x":0.5807,"y":0.683},{"id":"tap-103","type":"tap","timeMs":61724,"x":0.63,"y":0.4757},{"id":"tap-104","type":"tap","timeMs":61897,"x":0.6759,"y":0.2649},{"id":"tap-105","type":"tap","timeMs":62069,"x":0.6575,"y":0.6524},{"id":"tap-106","type":"tap","timeMs":62414,"x":0.4524,"y":0.4761},{"id":"tap-107","type":"tap","timeMs":62586,"x":0.5046,"y":0.6833},{"id":"tap-108","type":"tap","timeMs":62759,"x":0.483,"y":0.297},{"id":"tap-109","type":"tap","timeMs":63103,"x":0.2401,"y":0.703},{"id":"tap-110","type":"tap","timeMs":63448,"x":0.1839,"y":0.6088},{"id":"tap-111","type":"tap","timeMs":63793,"x":0.7314,"y":0.4132},{"id":"drag-112","type":"drag","timeMs":64138,"endTimeMs":64655,"x":0.4723,"y":0.7443,"endX":0.6189,"endY":0.84,"accent":"green"},{"id":"tap-113","type":"tap","timeMs":64655,"x":0.8148,"y":0.6984},{"id":"tap-114","type":"tap","timeMs":64828,"x":0.8102,"y":0.6717},{"id":"drag-115","type":"drag","timeMs":65172,"endTimeMs":65689,"x":0.319,"y":0.2904,"endX":0.14,"endY":0.3392,"accent":"purple"},{"id":"tap-116","type":"tap","timeMs":65690,"x":0.8023,"y":0.3747},{"id":"tap-117","type":"tap","timeMs":65862,"x":0.8087,"y":0.1876},{"id":"tap-118","type":"tap","timeMs":66207,"x":0.2126,"y":0.4978},{"id":"tap-119","type":"tap","timeMs":66379,"x":0.2227,"y":0.76},{"id":"tap-120","type":"tap","timeMs":66552,"x":0.7757,"y":0.2449},{"id":"tap-121","type":"tap","timeMs":76552,"x":0.7802,"y":0.4956},{"id":"tap-122","type":"tap","timeMs":76897,"x":0.5179,"y":0.569},{"id":"drag-123","type":"drag","timeMs":77069,"endTimeMs":77586,"x":0.4594,"y":0.6951,"endX":0.5712,"endY":0.8316,"accent":"purple"},{"id":"drag-124","type":"drag","timeMs":77586,"endTimeMs":78103,"x":0.1842,"y":0.3702,"endX":0.3588,"endY":0.4666,"accent":"green"},{"id":"drag-125","type":"drag","timeMs":78103,"endTimeMs":78620,"x":0.3184,"y":0.6221,"endX":0.4949,"endY":0.7165,"accent":"purple"},{"id":"tap-126","type":"tap","timeMs":78621,"x":0.2939,"y":0.6944},{"id":"drag-127","type":"drag","timeMs":78966,"endTimeMs":79483,"x":0.42,"y":0.3791,"endX":0.597,"endY":0.4732,"accent":"purple"},{"id":"tap-128","type":"tap","timeMs":79483,"x":0.1848,"y":0.2399},{"id":"drag-129","type":"drag","timeMs":79655,"endTimeMs":80345,"x":0.8157,"y":0.7485,"endX":0.86,"endY":0.84,"accent":"purple"},{"id":"tap-130","type":"tap","timeMs":80345,"x":0.7673,"y":0.454},{"id":"tap-131","type":"tap","timeMs":80690,"x":0.1801,"y":0.5713},{"id":"tap-132","type":"tap","timeMs":81034,"x":0.6791,"y":0.2387},{"id":"tap-133","type":"tap","timeMs":81207,"x":0.6608,"y":0.2718},{"id":"tap-134","type":"tap","timeMs":81379,"x":0.7038,"y":0.18},{"id":"tap-135","type":"tap","timeMs":81552,"x":0.7412,"y":0.2663},{"id":"tap-136","type":"tap","timeMs":81724,"x":0.7265,"y":0.2433},{"id":"tap-137","type":"tap","timeMs":82069,"x":0.3934,"y":0.4127},{"id":"tap-138","type":"tap","timeMs":82241,"x":0.5377,"y":0.4698},{"id":"tap-139","type":"tap","timeMs":82414,"x":0.4229,"y":0.5992},{"id":"tap-140","type":"tap","timeMs":82586,"x":0.3676,"y":0.4472},{"id":"tap-141","type":"tap","timeMs":82759,"x":0.6352,"y":0.668},{"id":"tap-142","type":"tap","timeMs":82931,"x":0.3962,"y":0.6293},{"id":"tap-143","type":"tap","timeMs":83103,"x":0.4469,"y":0.4057},{"id":"tap-144","type":"tap","timeMs":83276,"x":0.4458,"y":0.736},{"id":"tap-145","type":"tap","timeMs":83448,"x":0.3951,"y":0.7376},{"id":"tap-146","type":"tap","timeMs":83621,"x":0.6989,"y":0.4016},{"id":"drag-147","type":"drag","timeMs":83793,"endTimeMs":84827,"x":0.6816,"y":0.1826,"endX":0.726,"endY":0.3377,"accent":"purple"},{"id":"tap-148","type":"tap","timeMs":84828,"x":0.755,"y":0.7398},{"id":"tap-149","type":"tap","timeMs":85000,"x":0.7454,"y":0.2493},{"id":"tap-150","type":"tap","timeMs":85862,"x":0.7577,"y":0.2459},{"id":"tap-151","type":"tap","timeMs":86034,"x":0.7483,"y":0.7417},{"id":"tap-152","type":"tap","timeMs":86897,"x":0.816,"y":0.1976},{"id":"tap-153","type":"tap","timeMs":87069,"x":0.8132,"y":0.7599},{"id":"tap-154","type":"tap","timeMs":87414,"x":0.787,"y":0.2523},{"id":"tap-155","type":"tap","timeMs":87931,"x":0.3483,"y":0.7551},{"id":"tap-156","type":"tap","timeMs":88103,"x":0.362,"y":0.1831},{"id":"tap-157","type":"tap","timeMs":88966,"x":0.236,"y":0.7566},{"id":"tap-158","type":"tap","timeMs":89138,"x":0.2449,"y":0.2132},{"id":"tap-159","type":"tap","timeMs":90000,"x":0.1999,"y":0.4095},{"id":"tap-160","type":"tap","timeMs":90172,"x":0.2056,"y":0.4352},{"id":"tap-161","type":"tap","timeMs":91034,"x":0.8155,"y":0.2064},{"id":"drag-162","type":"drag","timeMs":91207,"endTimeMs":91724,"x":0.8126,"y":0.6802,"endX":0.86,"endY":0.6072,"accent":"green"},{"id":"tap-163","type":"tap","timeMs":92759,"x":0.1897,"y":0.3356},{"id":"tap-164","type":"tap","timeMs":92931,"x":0.7981,"y":0.2351},{"id":"tap-165","type":"tap","timeMs":93103,"x":0.7896,"y":0.2763},{"id":"tap-166","type":"tap","timeMs":93448,"x":0.6762,"y":0.3127},{"id":"tap-167","type":"tap","timeMs":93793,"x":0.5441,"y":0.2076},{"id":"tap-168","type":"tap","timeMs":93966,"x":0.5654,"y":0.5652},{"id":"tap-169","type":"tap","timeMs":94138,"x":0.396,"y":0.6774},{"id":"tap-170","type":"tap","timeMs":94483,"x":0.2316,"y":0.4424},{"id":"tap-171","type":"tap","timeMs":94828,"x":0.8166,"y":0.1802},{"id":"tap-172","type":"tap","timeMs":95000,"x":0.8128,"y":0.4286},{"id":"tap-173","type":"tap","timeMs":95172,"x":0.8196,"y":0.2344},{"id":"tap-174","type":"tap","timeMs":95517,"x":0.2705,"y":0.6061},{"id":"tap-175","type":"tap","timeMs":95862,"x":0.4512,"y":0.2178},{"id":"drag-176","type":"drag","timeMs":96207,"endTimeMs":96897,"x":0.786,"y":0.7596,"endX":0.745,"endY":0.604,"accent":"green"},{"id":"tap-177","type":"tap","timeMs":96897,"x":0.6732,"y":0.273},{"id":"tap-178","type":"tap","timeMs":97069,"x":0.2946,"y":0.3887},{"id":"tap-179","type":"tap","timeMs":97241,"x":0.2785,"y":0.7383},{"id":"tap-180","type":"tap","timeMs":97586,"x":0.1906,"y":0.2933},{"id":"tap-181","type":"tap","timeMs":97931,"x":0.7862,"y":0.6743},{"id":"tap-182","type":"tap","timeMs":98103,"x":0.7759,"y":0.6961},{"id":"tap-183","type":"tap","timeMs":98276,"x":0.2465,"y":0.5913},{"id":"tap-184","type":"tap","timeMs":98621,"x":0.4207,"y":0.2073},{"id":"tap-185","type":"tap","timeMs":98966,"x":0.3548,"y":0.5568},{"id":"tap-186","type":"tap","timeMs":99138,"x":0.3359,"y":0.7543},{"id":"tap-187","type":"tap","timeMs":99310,"x":0.3828,"y":0.7083},{"id":"tap-188","type":"tap","timeMs":99655,"x":0.7847,"y":0.6656},{"id":"tap-189","type":"tap","timeMs":100000,"x":0.8052,"y":0.5574},{"id":"tap-190","type":"tap","timeMs":100172,"x":0.1957,"y":0.2293},{"id":"drag-191","type":"drag","timeMs":100345,"endTimeMs":101035,"x":0.8186,"y":0.2658,"endX":0.86,"endY":0.16,"accent":"purple"}]}};
      const BUILTIN_MUSIC_TIMINGS = {
        fiu: {
          bpm: 87,
          durationMs: 101035,
          melody: [[172,0],[1207,0],[2241,0],[2586,0],[3276,0],[4310,0],[5345,0],[6379,0],[7241,0],[7586,0],[7931,0],[8276,0],[8793,517],[9310,517],[9828,517],[10345,0],[10690,517],[11207,0],[12069,0],[12414,0],[12759,0],[13103,0],[13448,0],[13793,0],[14310,0],[14655,0],[15000,0],[15517,1034],[15862,690],[16552,0],[16897,0],[17414,0],[17759,0],[18103,0],[18448,0],[18793,0],[19138,0],[19483,0],[19828,0],[20172,0],[20517,0],[20862,0],[21207,0],[21552,0],[21897,0],[22241,0],[22586,0],[22931,0],[23276,0],[23621,0],[23966,0],[24310,0],[24655,0],[25000,0],[25345,0],[25862,1034],[26207,0],[26897,1034],[27241,0],[27931,0],[28276,0],[28621,0],[28966,0],[29310,0],[30000,1034],[30345,0],[31034,1034],[31379,0],[32069,0],[32414,0],[32759,0],[33103,0],[33448,0],[33966,0],[34310,0],[34655,0],[35000,0],[35345,0],[35690,0],[36034,0],[36379,0],[36724,0],[37069,0],[37414,0],[37759,0],[38103,0],[38448,0],[38793,0],[39138,0],[39483,0],[39828,0],[40172,0],[40517,0],[40862,0],[41207,0],[41552,0],[41897,0],[42414,1034],[42759,0],[43448,1034],[43793,0],[44483,0],[44828,0],[45172,0],[45517,1034],[46552,1034],[47586,1379],[48966,0],[49310,0],[49655,1379],[51724,0],[52069,0],[52414,0],[52759,0],[53103,0],[53448,0],[53793,0],[54138,0],[54483,0],[54828,690],[55517,0],[55862,690],[56552,0],[56897,0],[57241,517],[57931,517],[58448,0],[58793,0],[60000,0],[60345,0],[60690,0],[61034,1034],[61379,0],[61724,0],[62069,0],[62414,690],[62759,0],[63103,0],[63448,0],[63793,0],[64138,690],[64828,0],[65172,1034],[65862,0],[66207,0],[66552,0],[67241,0],[67586,0],[67931,0],[68276,0],[68621,0],[68966,0],[69310,0],[69655,517],[70172,0],[70690,0],[71034,0],[71379,517],[72069,0],[72414,0],[72759,0],[73103,0],[73448,0],[73793,0],[74138,0],[74483,0],[74828,0],[75172,0],[75517,0],[75862,0],[76207,0],[76552,0],[77069,517],[77586,517],[78103,517],[78621,0],[78966,517],[79483,0],[80345,0],[80690,0],[81034,0],[81379,0],[81724,0],[82069,0],[82586,0],[82931,0],[83276,0],[83793,1034],[84138,690],[85000,0],[86034,0],[87069,0],[87414,0],[88103,0],[89138,0],[90172,0],[91207,517],[92069,0],[92414,0],[93103,0],[93448,0],[93793,0],[94138,0],[94483,0],[94828,0],[95172,0],[95517,0],[95862,0],[96207,690],[97241,0],[97586,0],[97931,0],[98276,0],[98621,0],[98966,0],[99310,0],[99655,0],[100000,0],[100345,690]]
        },
      };
      const BUILTIN_LANE_MODE_CHARTS = {"fiu":{"bpm":87,"durationMs":101035,"chart":[{"id":"lane-tap-0","type":"tap","timeMs":0,"lane":2},{"id":"lane-tap-1","type":"tap","timeMs":345,"lane":1},{"id":"lane-tap-2","type":"tap","timeMs":690,"lane":2},{"id":"lane-tap-3","type":"tap","timeMs":1034,"lane":1},{"id":"lane-tap-4","type":"tap","timeMs":1379,"lane":2},{"id":"lane-tap-5","type":"tap","timeMs":2069,"lane":1},{"id":"lane-flick-6","type":"flick","timeMs":2414,"lane":2},{"id":"lane-tap-7","type":"tap","timeMs":2586,"lane":0},{"id":"lane-tap-8","type":"tap","timeMs":2759,"lane":2},{"id":"lane-tap-9","type":"tap","timeMs":3103,"lane":1},{"id":"lane-tap-10","type":"tap","timeMs":3793,"lane":2},{"id":"lane-tap-11","type":"tap","timeMs":7931,"lane":1},{"id":"lane-tap-12","type":"tap","timeMs":8103,"lane":3},{"id":"lane-tap-13","type":"tap","timeMs":8276,"lane":1},{"id":"lane-tap-15","type":"tap","timeMs":8621,"lane":0},{"id":"lane-tap-14","type":"tap","timeMs":8793,"lane":2},{"id":"lane-tap-16","type":"tap","timeMs":9310,"lane":2},{"id":"lane-flick-17","type":"flick","timeMs":9828,"lane":1},{"id":"lane-tap-18","type":"tap","timeMs":10345,"lane":2},{"id":"lane-tap-19","type":"tap","timeMs":10690,"lane":1},{"id":"lane-hold-20","type":"hold","timeMs":11379,"lane":2,"endTimeMs":12079},{"id":"lane-tap-21","type":"tap","timeMs":12069,"lane":1},{"id":"lane-flick-22","type":"flick","timeMs":12414,"lane":2},{"id":"lane-tap-23","type":"tap","timeMs":12759,"lane":1},{"id":"lane-tap-24","type":"tap","timeMs":12931,"lane":3},{"id":"lane-tap-25","type":"tap","timeMs":13103,"lane":1},{"id":"lane-tap-26","type":"tap","timeMs":13448,"lane":2},{"id":"lane-tap-27","type":"tap","timeMs":13793,"lane":1},{"id":"lane-flick-28","type":"flick","timeMs":14138,"lane":2},{"id":"lane-tap-29","type":"tap","timeMs":14310,"lane":0},{"id":"lane-tap-30","type":"tap","timeMs":14483,"lane":2},{"id":"lane-tap-31","type":"tap","timeMs":14828,"lane":1},{"id":"lane-tap-32","type":"tap","timeMs":15000,"lane":3},{"id":"lane-tap-33","type":"tap","timeMs":15172,"lane":1},{"id":"lane-hold-34","type":"hold","timeMs":15517,"lane":2,"endTimeMs":16551},{"id":"lane-flick-35","type":"flick","timeMs":16552,"lane":1},{"id":"lane-tap-36","type":"tap","timeMs":16897,"lane":2},{"id":"lane-tap-37","type":"tap","timeMs":17069,"lane":0},{"id":"lane-tap-38","type":"tap","timeMs":17241,"lane":2},{"id":"lane-flick-39","type":"flick","timeMs":17586,"lane":1},{"id":"lane-tap-40","type":"tap","timeMs":17759,"lane":3},{"id":"lane-tap-41","type":"tap","timeMs":17931,"lane":1},{"id":"lane-tap-42","type":"tap","timeMs":18276,"lane":2},{"id":"lane-tap-43","type":"tap","timeMs":18448,"lane":0},{"id":"lane-tap-44","type":"tap","timeMs":18621,"lane":2},{"id":"lane-tap-45","type":"tap","timeMs":18966,"lane":1},{"id":"lane-tap-46","type":"tap","timeMs":19138,"lane":3},{"id":"lane-tap-47","type":"tap","timeMs":19310,"lane":1},{"id":"lane-flick-48","type":"flick","timeMs":19655,"lane":2},{"id":"lane-tap-49","type":"tap","timeMs":19828,"lane":0},{"id":"lane-flick-50","type":"flick","timeMs":20000,"lane":2},{"id":"lane-tap-51","type":"tap","timeMs":20345,"lane":1},{"id":"lane-tap-52","type":"tap","timeMs":20517,"lane":3},{"id":"lane-tap-53","type":"tap","timeMs":20690,"lane":1},{"id":"lane-tap-54","type":"tap","timeMs":21034,"lane":2},{"id":"lane-tap-55","type":"tap","timeMs":21207,"lane":0},{"id":"lane-tap-56","type":"tap","timeMs":21379,"lane":2},{"id":"lane-tap-57","type":"tap","timeMs":21724,"lane":1},{"id":"lane-tap-58","type":"tap","timeMs":21897,"lane":3},{"id":"lane-tap-59","type":"tap","timeMs":22069,"lane":1},{"id":"lane-tap-60","type":"tap","timeMs":22414,"lane":2},{"id":"lane-flick-61","type":"flick","timeMs":22586,"lane":0},{"id":"lane-tap-62","type":"tap","timeMs":22759,"lane":2},{"id":"lane-tap-63","type":"tap","timeMs":23103,"lane":1},{"id":"lane-tap-64","type":"tap","timeMs":23276,"lane":3},{"id":"lane-tap-65","type":"tap","timeMs":23448,"lane":1},{"id":"lane-tap-66","type":"tap","timeMs":23793,"lane":2},{"id":"lane-tap-67","type":"tap","timeMs":23966,"lane":0},{"id":"lane-tap-68","type":"tap","timeMs":24138,"lane":2},{"id":"lane-tap-69","type":"tap","timeMs":24483,"lane":1},{"id":"lane-tap-70","type":"tap","timeMs":24655,"lane":3},{"id":"lane-hold-71","type":"hold","timeMs":24828,"lane":1,"endTimeMs":25862},{"id":"lane-hold-72","type":"hold","timeMs":25862,"lane":2,"endTimeMs":26896},{"id":"lane-drag-73","type":"drag","timeMs":26897,"lane":1,"endLane":3,"endTimeMs":27931},{"id":"lane-flick-74","type":"flick","timeMs":27931,"lane":0},{"id":"lane-tap-75","type":"tap","timeMs":28276,"lane":2},{"id":"lane-tap-76","type":"tap","timeMs":28621,"lane":1},{"id":"lane-drag-77","type":"drag","timeMs":28966,"lane":2,"endLane":0,"endTimeMs":30000},{"id":"lane-hold-78","type":"hold","timeMs":30000,"lane":3,"endTimeMs":31034},{"id":"lane-hold-79","type":"hold","timeMs":31034,"lane":1,"endTimeMs":32068},{"id":"lane-tap-80","type":"tap","timeMs":32069,"lane":2},{"id":"lane-tap-81","type":"tap","timeMs":32414,"lane":1},{"id":"lane-tap-82","type":"tap","timeMs":32759,"lane":2},{"id":"lane-flick-83","type":"flick","timeMs":33103,"lane":1},{"id":"lane-tap-84","type":"tap","timeMs":33448,"lane":2},{"id":"lane-tap-85","type":"tap","timeMs":33621,"lane":0},{"id":"lane-tap-86","type":"tap","timeMs":33793,"lane":2},{"id":"lane-flick-87","type":"flick","timeMs":34138,"lane":1},{"id":"lane-tap-88","type":"tap","timeMs":34310,"lane":3},{"id":"lane-tap-89","type":"tap","timeMs":34483,"lane":1},{"id":"lane-tap-90","type":"tap","timeMs":34828,"lane":2},{"id":"lane-tap-91","type":"tap","timeMs":35000,"lane":0},{"id":"lane-tap-92","type":"tap","timeMs":35172,"lane":2},{"id":"lane-tap-93","type":"tap","timeMs":35517,"lane":1},{"id":"lane-flick-94","type":"flick","timeMs":35690,"lane":3},{"id":"lane-tap-95","type":"tap","timeMs":35862,"lane":1},{"id":"lane-tap-96","type":"tap","timeMs":36207,"lane":2},{"id":"lane-tap-97","type":"tap","timeMs":36379,"lane":0},{"id":"lane-tap-98","type":"tap","timeMs":36552,"lane":2},{"id":"lane-tap-99","type":"tap","timeMs":36897,"lane":1},{"id":"lane-flick-100","type":"flick","timeMs":37069,"lane":3},{"id":"lane-tap-101","type":"tap","timeMs":37241,"lane":1},{"id":"lane-tap-102","type":"tap","timeMs":37586,"lane":2},{"id":"lane-tap-103","type":"tap","timeMs":37759,"lane":0},{"id":"lane-tap-104","type":"tap","timeMs":37931,"lane":2},{"id":"lane-flick-105","type":"flick","timeMs":38276,"lane":1},{"id":"lane-tap-106","type":"tap","timeMs":38448,"lane":3},{"id":"lane-tap-107","type":"tap","timeMs":38621,"lane":1},{"id":"lane-tap-108","type":"tap","timeMs":38966,"lane":2},{"id":"lane-tap-109","type":"tap","timeMs":39138,"lane":0},{"id":"lane-tap-110","type":"tap","timeMs":39310,"lane":2},{"id":"lane-tap-111","type":"tap","timeMs":39655,"lane":1},{"id":"lane-tap-112","type":"tap","timeMs":39828,"lane":3},{"id":"lane-flick-113","type":"flick","timeMs":40000,"lane":1},{"id":"lane-tap-114","type":"tap","timeMs":40345,"lane":2},{"id":"lane-tap-115","type":"tap","timeMs":40517,"lane":0},{"id":"lane-flick-116","type":"flick","timeMs":40690,"lane":2},{"id":"lane-tap-117","type":"tap","timeMs":41034,"lane":1},{"id":"lane-tap-118","type":"tap","timeMs":41207,"lane":3},{"id":"lane-hold-119","type":"hold","timeMs":41379,"lane":1,"endTimeMs":42413},{"id":"lane-hold-120","type":"hold","timeMs":42414,"lane":2,"endTimeMs":43448},{"id":"lane-drag-121","type":"drag","timeMs":43448,"lane":1,"endLane":3,"endTimeMs":44482},{"id":"lane-tap-122","type":"tap","timeMs":44483,"lane":0},{"id":"lane-tap-123","type":"tap","timeMs":44828,"lane":2},{"id":"lane-tap-124","type":"tap","timeMs":45172,"lane":1},{"id":"lane-drag-125","type":"drag","timeMs":45517,"lane":2,"endLane":0,"endTimeMs":46551},{"id":"lane-hold-126","type":"hold","timeMs":46552,"lane":3,"endTimeMs":47586},{"id":"lane-hold-127","type":"hold","timeMs":47586,"lane":1,"endTimeMs":48965},{"id":"lane-tap-128","type":"tap","timeMs":48966,"lane":2},{"id":"lane-tap-129","type":"tap","timeMs":49310,"lane":1},{"id":"lane-hold-130","type":"hold","timeMs":49655,"lane":2,"endTimeMs":51034},{"id":"lane-tap-131","type":"tap","timeMs":51724,"lane":1},{"id":"lane-tap-132","type":"tap","timeMs":52069,"lane":2},{"id":"lane-tap-133","type":"tap","timeMs":52241,"lane":0},{"id":"lane-tap-134","type":"tap","timeMs":52414,"lane":2},{"id":"lane-tap-135","type":"tap","timeMs":52759,"lane":1},{"id":"lane-tap-136","type":"tap","timeMs":53103,"lane":2},{"id":"lane-tap-137","type":"tap","timeMs":53448,"lane":1},{"id":"lane-flick-138","type":"flick","timeMs":53621,"lane":3},{"id":"lane-flick-139","type":"flick","timeMs":53793,"lane":1},{"id":"lane-tap-140","type":"tap","timeMs":54138,"lane":2},{"id":"lane-tap-141","type":"tap","timeMs":54310,"lane":0},{"id":"lane-tap-142","type":"tap","timeMs":54483,"lane":2},{"id":"lane-hold-143","type":"hold","timeMs":54828,"lane":1,"endTimeMs":55528},{"id":"lane-tap-144","type":"tap","timeMs":55517,"lane":2},{"id":"lane-hold-145","type":"hold","timeMs":55862,"lane":1,"endTimeMs":56562},{"id":"lane-tap-146","type":"tap","timeMs":56552,"lane":2},{"id":"lane-tap-147","type":"tap","timeMs":56897,"lane":1},{"id":"lane-tap-148","type":"tap","timeMs":57241,"lane":2},{"id":"lane-tap-150","type":"tap","timeMs":57759,"lane":3},{"id":"lane-flick-149","type":"flick","timeMs":57931,"lane":1},{"id":"lane-tap-151","type":"tap","timeMs":58448,"lane":1},{"id":"lane-tap-153","type":"tap","timeMs":58793,"lane":0},{"id":"lane-hold-152","type":"hold","timeMs":58966,"lane":2,"endTimeMs":60000},{"id":"lane-tap-154","type":"tap","timeMs":60000,"lane":1},{"id":"lane-tap-155","type":"tap","timeMs":60345,"lane":2},{"id":"lane-tap-156","type":"tap","timeMs":60517,"lane":0},{"id":"lane-tap-157","type":"tap","timeMs":60690,"lane":2},{"id":"lane-hold-158","type":"hold","timeMs":61034,"lane":1,"endTimeMs":62068},{"id":"lane-tap-159","type":"tap","timeMs":62069,"lane":2},{"id":"lane-hold-160","type":"hold","timeMs":62414,"lane":1,"endTimeMs":63114},{"id":"lane-hold-161","type":"hold","timeMs":63103,"lane":2,"endTimeMs":63803},{"id":"lane-tap-162","type":"tap","timeMs":63793,"lane":1},{"id":"lane-hold-163","type":"hold","timeMs":64138,"lane":2,"endTimeMs":64838},{"id":"lane-tap-164","type":"tap","timeMs":64828,"lane":1},{"id":"lane-drag-165","type":"drag","timeMs":65172,"lane":2,"endLane":0,"endTimeMs":66206},{"id":"lane-tap-166","type":"tap","timeMs":66207,"lane":3},{"id":"lane-tap-167","type":"tap","timeMs":66552,"lane":1},{"id":"lane-tap-168","type":"tap","timeMs":66897,"lane":2},{"id":"lane-tap-169","type":"tap","timeMs":67069,"lane":0},{"id":"lane-tap-170","type":"tap","timeMs":67241,"lane":2},{"id":"lane-flick-171","type":"flick","timeMs":67586,"lane":1},{"id":"lane-tap-172","type":"tap","timeMs":67931,"lane":2},{"id":"lane-tap-173","type":"tap","timeMs":68276,"lane":1},{"id":"lane-tap-174","type":"tap","timeMs":68621,"lane":2},{"id":"lane-tap-175","type":"tap","timeMs":68966,"lane":1},{"id":"lane-tap-176","type":"tap","timeMs":69310,"lane":2},{"id":"lane-tap-177","type":"tap","timeMs":69655,"lane":1},{"id":"lane-flick-178","type":"flick","timeMs":70345,"lane":2},{"id":"lane-tap-179","type":"tap","timeMs":70690,"lane":1},{"id":"lane-tap-180","type":"tap","timeMs":70862,"lane":3},{"id":"lane-tap-181","type":"tap","timeMs":71034,"lane":1},{"id":"lane-flick-182","type":"flick","timeMs":71379,"lane":2},{"id":"lane-tap-183","type":"tap","timeMs":72069,"lane":1},{"id":"lane-tap-184","type":"tap","timeMs":72414,"lane":2},{"id":"lane-tap-185","type":"tap","timeMs":72759,"lane":1},{"id":"lane-tap-186","type":"tap","timeMs":73103,"lane":2},{"id":"lane-tap-187","type":"tap","timeMs":73448,"lane":1},{"id":"lane-tap-188","type":"tap","timeMs":73793,"lane":2},{"id":"lane-tap-189","type":"tap","timeMs":73966,"lane":0},{"id":"lane-tap-190","type":"tap","timeMs":74138,"lane":2},{"id":"lane-flick-191","type":"flick","timeMs":74483,"lane":1},{"id":"lane-tap-192","type":"tap","timeMs":74828,"lane":2},{"id":"lane-flick-193","type":"flick","timeMs":75172,"lane":1},{"id":"lane-tap-194","type":"tap","timeMs":75345,"lane":3},{"id":"lane-tap-195","type":"tap","timeMs":75517,"lane":1},{"id":"lane-tap-196","type":"tap","timeMs":75862,"lane":2},{"id":"lane-tap-197","type":"tap","timeMs":76034,"lane":0},{"id":"lane-tap-198","type":"tap","timeMs":76207,"lane":2},{"id":"lane-tap-199","type":"tap","timeMs":76552,"lane":1},{"id":"lane-tap-200","type":"tap","timeMs":77069,"lane":2},{"id":"lane-tap-201","type":"tap","timeMs":77586,"lane":1},{"id":"lane-tap-202","type":"tap","timeMs":78103,"lane":2},{"id":"lane-tap-203","type":"tap","timeMs":78621,"lane":1},{"id":"lane-flick-204","type":"flick","timeMs":78966,"lane":2},{"id":"lane-tap-206","type":"tap","timeMs":79483,"lane":3},{"id":"lane-hold-205","type":"hold","timeMs":79655,"lane":1,"endTimeMs":80355},{"id":"lane-tap-207","type":"tap","timeMs":80345,"lane":2},{"id":"lane-tap-208","type":"tap","timeMs":80690,"lane":1},{"id":"lane-tap-209","type":"tap","timeMs":81034,"lane":2},{"id":"lane-tap-210","type":"tap","timeMs":81379,"lane":1},{"id":"lane-tap-211","type":"tap","timeMs":81552,"lane":3},{"id":"lane-tap-212","type":"tap","timeMs":81724,"lane":1},{"id":"lane-tap-213","type":"tap","timeMs":82069,"lane":2},{"id":"lane-tap-214","type":"tap","timeMs":82241,"lane":0},{"id":"lane-flick-215","type":"flick","timeMs":82414,"lane":2},{"id":"lane-tap-216","type":"tap","timeMs":82759,"lane":1},{"id":"lane-flick-217","type":"flick","timeMs":82931,"lane":3},{"id":"lane-tap-218","type":"tap","timeMs":83103,"lane":1},{"id":"lane-tap-219","type":"tap","timeMs":83448,"lane":2},{"id":"lane-tap-220","type":"tap","timeMs":83621,"lane":0},{"id":"lane-drag-221","type":"drag","timeMs":83793,"lane":2,"endLane":0,"endTimeMs":84827},{"id":"lane-tap-223","type":"tap","timeMs":84828,"lane":3},{"id":"lane-tap-222","type":"tap","timeMs":85000,"lane":1},{"id":"lane-tap-224","type":"tap","timeMs":86034,"lane":1},{"id":"lane-flick-226","type":"flick","timeMs":86897,"lane":0},{"id":"lane-tap-225","type":"tap","timeMs":87069,"lane":2},{"id":"lane-tap-227","type":"tap","timeMs":87414,"lane":2},{"id":"lane-tap-229","type":"tap","timeMs":87931,"lane":3},{"id":"lane-tap-228","type":"tap","timeMs":88103,"lane":1},{"id":"lane-flick-230","type":"flick","timeMs":89138,"lane":1},{"id":"lane-tap-232","type":"tap","timeMs":90000,"lane":0},{"id":"lane-tap-231","type":"tap","timeMs":90172,"lane":2},{"id":"lane-tap-233","type":"tap","timeMs":91207,"lane":2},{"id":"lane-tap-234","type":"tap","timeMs":92759,"lane":1},{"id":"lane-tap-235","type":"tap","timeMs":92931,"lane":3},{"id":"lane-tap-236","type":"tap","timeMs":93103,"lane":1},{"id":"lane-flick-237","type":"flick","timeMs":93448,"lane":2},{"id":"lane-tap-238","type":"tap","timeMs":93793,"lane":1},{"id":"lane-tap-239","type":"tap","timeMs":94138,"lane":2},{"id":"lane-tap-240","type":"tap","timeMs":94483,"lane":1},{"id":"lane-tap-241","type":"tap","timeMs":94828,"lane":2},{"id":"lane-tap-242","type":"tap","timeMs":95000,"lane":0},{"id":"lane-flick-243","type":"flick","timeMs":95172,"lane":2},{"id":"lane-tap-244","type":"tap","timeMs":95517,"lane":1},{"id":"lane-tap-245","type":"tap","timeMs":95862,"lane":2},{"id":"lane-hold-246","type":"hold","timeMs":96207,"lane":1,"endTimeMs":96907},{"id":"lane-tap-247","type":"tap","timeMs":96897,"lane":2},{"id":"lane-flick-248","type":"flick","timeMs":97241,"lane":1},{"id":"lane-tap-249","type":"tap","timeMs":97586,"lane":2},{"id":"lane-tap-250","type":"tap","timeMs":97931,"lane":1},{"id":"lane-tap-251","type":"tap","timeMs":98103,"lane":3},{"id":"lane-tap-252","type":"tap","timeMs":98276,"lane":1},{"id":"lane-tap-253","type":"tap","timeMs":98621,"lane":2},{"id":"lane-tap-254","type":"tap","timeMs":98966,"lane":1},{"id":"lane-tap-255","type":"tap","timeMs":99310,"lane":2},{"id":"lane-flick-256","type":"flick","timeMs":99655,"lane":1},{"id":"lane-tap-257","type":"tap","timeMs":100000,"lane":2},{"id":"lane-tap-258","type":"tap","timeMs":100172,"lane":0},{"id":"lane-hold-259","type":"hold","timeMs":100345,"lane":2,"endTimeMs":101045}],"laneCount":4,"mode":"lanes"}};

      (function patchBuiltinLaneModeCharts() {
        const fiu = BUILTIN_LANE_MODE_CHARTS.fiu;
        if (!fiu) return;
        const earlyFill = [
          { type: "tap", timeMs: 4310, lane: 1 },
          { type: "tap", timeMs: 5345, lane: 2 },
          { type: "tap", timeMs: 6379, lane: 1 },
          { type: "tap", timeMs: 7241, lane: 3 },
          { type: "tap", timeMs: 7586, lane: 1 },
        ];
        fiu.chart = fiu.chart
          .concat(earlyFill.map((note) => ({ ...note })))
          .sort((a, b) => a.timeMs - b.timeMs || a.lane - b.lane)
          .map((note, index) => ({
            ...note,
            id: note.id || `lane-${note.type}-${index}`,
          }));
        fiu.chart = fiu.chart.map((note) => {
          if (note.id === "lane-drag-73" || note.id === "lane-drag-121") {
            return {
              ...note,
              lane: 3,
              endLane: 2,
            };
          }
          return note;
        });
        let tapCounter = 0;
        fiu.chart = fiu.chart.map((note) => {
          if (note.type !== "tap") return note;
          tapCounter += 1;
          return tapCounter % 15 === 0 ? { ...note, bonus: true } : note;
        });
      })();

      Object.assign(BUILTIN_MUSIC_TIMINGS, {
        palace: {
          bpm: 192,
          durationMs: 155312,
          melody: [[781,156],[938,156],[1094,156],[1250,156],[1406,156],[1562,156],[1719,156],[1875,156],[2031,156],[2188,156],[2344,156],[2500,104],[2604,104],[2708,104],[2812,156],[2969,156],[3125,312],[3438,312],[3750,156],[3906,156],[4062,156],[4219,156],[4375,156],[4531,156],[4688,156],[4844,156],[5000,156],[5156,156],[5312,156],[5469,156],[5625,312],[5938,312],[6250,312],[6562,156],[6719,156],[6875,156],[7031,156],[7188,156],[7344,156],[7500,156],[7656,156],[7812,156],[7969,156],[8125,156],[8281,156],[8438,156],[8594,156],[8750,156],[8906,156],[9062,156],[9219,156],[9375,312],[9688,312],[10000,156],[10156,156],[10312,312],[10625,156],[10781,156],[10938,156],[11094,156],[11250,938],[12188,156],[12344,156],[12500,156],[12656,156],[12812,156],[12969,156],[13125,156],[13281,156],[13438,156],[13594,156],[13750,156],[13906,156],[14062,938],[15000,625],[15625,104],[15729,104],[15833,104],[15938,156],[16094,156],[16250,156],[16406,156],[16562,156],[16719,156],[16875,156],[17031,156],[17188,156],[17344,156],[17500,156],[17656,156],[17812,938],[18750,938],[19688,104],[19792,104],[19896,104],[20000,104],[20104,104],[20208,104],[20312,104],[20417,104],[20521,104],[20625,104],[20729,104],[20833,104],[20938,104],[21042,104],[21146,104],[21250,104],[21354,104],[21458,104],[21562,104],[21667,104],[21771,104],[21875,104],[21979,104],[22083,104],[22188,104],[22292,104],[22396,104],[22500,104],[22604,104],[22708,104],[22812,104],[22917,104],[23021,104],[23125,104],[23229,104],[23333,104],[23438,104],[23542,104],[23646,104],[23750,104],[23854,104],[23958,104],[24062,104],[24167,104],[24271,104],[24375,104],[24479,104],[24583,104],[24688,104],[24792,104],[24896,104],[25000,104],[25104,104],[25208,104],[25312,104],[25417,104],[25521,104],[25625,104],[25729,104],[25833,104],[25938,104],[26042,104],[26146,104],[26250,104],[26354,104],[26458,104],[26562,104],[26667,104],[26771,104],[26875,312],[27188,312],[27500,312],[27812,312],[28125,625],[28750,312],[29062,312],[29375,312],[29688,156],[29844,156],[30000,625],[30625,312],[30938,312],[31250,312],[31562,312],[31875,625],[32500,312],[32812,312],[33125,312],[33438,104],[33542,104],[33646,104],[33750,104],[33854,104],[33958,104],[34062,104],[34167,208],[34375,312],[34531,156],[34688,312],[34844,469],[35000,312],[35312,469],[35469,156],[35625,312],[35781,156],[35938,156],[36094,156],[36250,104],[36354,104],[36406,312],[36458,104],[36562,469],[36719,156],[36875,156],[37031,156],[37188,938],[37500,312],[37812,312],[38125,312],[38281,156],[38438,312],[38594,312],[38750,312],[38906,156],[39062,469],[39375,625],[39531,156],[39688,156],[39844,156],[40000,938],[40156,156],[40312,312],[40625,312],[40938,312],[41094,156],[41250,312],[41562,312],[41875,312],[42031,156],[42188,312],[42344,469],[42500,312],[42812,469],[43125,625],[43281,156],[43438,156],[43594,156],[43750,104],[43854,104],[43958,104],[44062,312],[44375,156],[44531,156],[44688,312],[45000,156],[45156,156],[45312,156],[45469,156],[45625,469],[45938,625],[46094,156],[46250,312],[46562,312],[46875,469],[47344,156],[47500,312],[47812,156],[47969,156],[48125,156],[48281,156],[48438,312],[48750,156],[48906,156],[49062,156],[49219,156],[49375,469],[49688,625],[49844,156],[50000,312],[50312,156],[50469,156],[50625,156],[50781,156],[50938,156],[51094,156],[51250,469],[51562,625],[51719,156],[51875,156],[52031,156],[52188,156],[52344,156],[52500,156],[52656,156],[52812,156],[52969,156],[53125,469],[53438,625],[53594,156],[53750,312],[54062,156],[54219,156],[54375,312],[54688,104],[54792,104],[54896,104],[55000,469],[55312,469],[55469,156],[55625,156],[55781,156],[55938,938],[56875,625],[57031,156],[57188,156],[57344,156],[57500,312],[57656,156],[57812,156],[57969,156],[58125,156],[58281,156],[58438,156],[58594,156],[58750,156],[58906,156],[59062,156],[59219,156],[59375,156],[59531,156],[59688,469],[59844,156],[60000,625],[60156,156],[60312,156],[60469,156],[60625,469],[60938,156],[61094,156],[61250,312],[61406,156],[61562,469],[61875,156],[62031,156],[62188,312],[62344,156],[62500,312],[62812,104],[62917,104],[63021,104],[63125,312],[63438,104],[63542,104],[63646,104],[63750,312],[64062,312],[64375,312],[64688,104],[64792,104],[64896,104],[65000,104],[65104,104],[65208,104],[65312,104],[65417,104],[65521,104],[65625,104],[65729,104],[65833,104],[65938,104],[66042,104],[66146,104],[66250,156],[66406,156],[66562,156],[66719,312],[66875,156],[67031,156],[67188,469],[67500,312],[67656,156],[67812,156],[67969,156],[68125,104],[68229,104],[68333,104],[68438,312],[68750,312],[69062,469],[69375,312],[69531,156],[69688,156],[69844,156],[70000,104],[70104,104],[70208,104],[70312,312],[70625,312],[70938,312],[71250,312],[71562,312],[71875,312],[72031,156],[72188,156],[72344,156],[72500,156],[72656,156],[72812,312],[72969,156],[73125,156],[73281,156],[73438,156],[73594,156],[73750,156],[73906,156],[74062,469],[74375,312],[74531,156],[74688,469],[75000,312],[75156,156],[75312,156],[75469,156],[75625,156],[75781,156],[75938,156],[76094,312],[76250,312],[76406,156],[76562,312],[76875,312],[76979,104],[77083,104],[77188,104],[77292,104],[77396,104],[77500,104],[77604,104],[77708,104],[77812,156],[77969,156],[78125,312],[78438,312],[78750,312],[79062,156],[79219,156],[79375,938],[79531,156],[79688,312],[80000,156],[80156,156],[80312,312],[80469,156],[80625,156],[80781,156],[80938,156],[81094,156],[81250,156],[81406,156],[81562,156],[81719,156],[81875,156],[82031,156],[82188,156],[82344,156],[82500,156],[82656,156],[82812,156],[82969,156],[83125,156],[83281,156],[83438,156],[83594,156],[83750,156],[83906,156],[84062,156],[84219,156],[84375,156],[84531,156],[84688,312],[85000,156],[85156,156],[85312,156],[85469,156],[85625,312],[85938,156],[86094,156],[86250,625],[86562,312],[86875,312],[87188,625],[87812,156],[87969,156],[88125,156],[88281,156],[88438,156],[88594,156],[88750,156],[88906,156],[89062,156],[89219,156],[89375,156],[89531,156],[89688,312],[90000,156],[90156,156],[90312,156],[90469,156],[90625,156],[90781,156],[90938,156],[91094,156],[91250,156],[91406,156],[91562,156],[91719,156],[91875,156],[92031,156],[92188,156],[92344,156],[92500,156],[92656,156],[92812,156],[92969,156],[93125,156],[93281,156],[93438,312],[93750,156],[93906,156],[94062,156],[94219,156],[94375,156],[94531,156],[94688,156],[94844,156],[95000,156],[95156,156],[95312,156],[95469,156],[95625,156],[95781,156],[95938,156],[96094,156],[96250,156],[96406,156],[96562,156],[96719,156],[96875,156],[97031,156],[97188,156],[97344,156],[97500,156],[97656,156],[97812,156],[97969,156],[98125,156],[98281,156],[98438,156],[98594,156],[98750,156],[98906,156],[99062,156],[99219,156],[99375,156],[99531,156],[99688,156],[99844,156],[100000,156],[100156,156],[100312,156],[100469,156],[100625,156],[100781,156],[100938,312],[101094,156],[101250,312],[101406,156],[101562,312],[101719,156],[101875,156],[102031,156],[102188,156],[102344,156],[102500,156],[102656,156],[102812,156],[102969,156],[103125,156],[103281,156],[103438,156],[103594,156],[103750,156],[103906,156],[104062,156],[104219,156],[104375,156],[104531,156],[104688,938],[105625,938],[106562,312],[106719,156],[106875,312],[107031,469],[107188,312],[107500,469],[107656,156],[107812,312],[107969,156],[108125,156],[108281,156],[108438,104],[108542,104],[108594,312],[108646,104],[108750,469],[108906,156],[109062,156],[109219,156],[109375,938],[109688,312],[110000,312],[110312,312],[110469,156],[110625,312],[110781,312],[110938,312],[111094,156],[111250,469],[111562,625],[111719,156],[111875,156],[112031,156],[112188,938],[112344,156],[112500,312],[112812,312],[113125,312],[113281,156],[113438,312],[113750,312],[114062,312],[114219,156],[114375,312],[114531,469],[114688,312],[115000,469],[115312,625],[115469,156],[115625,156],[115781,156],[115938,104],[116042,104],[116146,104],[116250,312],[116562,156],[116719,156],[116875,312],[117188,156],[117344,156],[117500,156],[117656,156],[117812,469],[118125,625],[118281,156],[118438,312],[118750,312],[119062,469],[119531,156],[119688,312],[120000,156],[120156,156],[120312,156],[120469,156],[120625,312],[120938,156],[121094,156],[121250,156],[121406,156],[121562,469],[121875,625],[122031,156],[122188,312],[122500,156],[122656,156],[122812,156],[122969,156],[123125,156],[123281,156],[123438,469],[123750,625],[123906,156],[124062,156],[124219,156],[124375,156],[124531,156],[124688,156],[124844,156],[125000,156],[125156,156],[125312,469],[125625,625],[125781,156],[125938,312],[126250,156],[126406,156],[126562,312],[126875,104],[126979,104],[127083,104],[127188,469],[127500,469],[127656,156],[127812,156],[127969,156],[128125,938],[129062,625],[129219,156],[129375,156],[129531,156],[129688,312],[129844,156],[130000,156],[130156,156],[130312,156],[130469,156],[130625,156],[130781,156],[130938,156],[131094,156],[131250,156],[131406,156],[131562,156],[131719,156],[131875,469],[132031,156],[132188,625],[132344,156],[132500,156],[132656,156],[132812,469],[133125,156],[133281,156],[133438,312],[133594,156],[133750,469],[134062,156],[134219,156],[134375,312],[134531,156],[134688,312],[135000,104],[135104,104],[135208,104],[135312,312],[135625,104],[135729,104],[135833,104],[135938,312],[136250,312],[136562,312],[136875,104],[136979,104],[137083,104],[137188,104],[137292,104],[137396,104],[137500,104],[137604,104],[137708,104],[137812,104],[137917,104],[138021,104],[138125,104],[138229,104],[138333,104],[138438,156],[138594,156],[138750,156],[138906,312],[139062,156],[139219,156],[139375,469],[139688,312],[139844,156],[140000,156],[140156,156],[140312,104],[140417,104],[140521,104],[140625,312],[140938,312],[141250,469],[141562,312],[141719,156],[141875,156],[142031,156],[142188,104],[142292,104],[142396,104],[142500,312],[142812,312],[143125,312],[143438,312],[143750,312],[144062,312],[144219,156],[144375,156],[144531,156],[144688,156],[144844,156],[145000,312],[145156,156],[145312,156],[145469,156],[145625,156],[145781,156],[145938,156],[146094,156],[146250,469],[146562,312],[146719,156],[146875,469],[147188,312],[147344,156],[147500,156],[147656,156],[147812,156],[147969,156],[148125,156],[148281,312],[148438,312],[148594,156],[148750,312],[149062,312],[149167,104],[149271,104],[149375,104],[149479,104],[149583,104],[149688,104],[149792,104],[149896,104],[150000,156],[150156,156],[150312,312],[150625,312],[150938,469],[151406,156],[151562,312],[151875,156],[152031,156],[152188,312],[153125,156],[153281,156],[153438,469],[153906,156],[154062,312],[154375,312],[154688,156],[154844,156],[155000,312]]
        },
        lafantasia: {
          bpm: 70,
          durationMs: 144000,
          melody: [[0,214],[214,214],[429,214],[643,214],[857,214],[1071,214],[1286,214],[1500,214],[1714,214],[1929,214],[2143,214],[2357,214],[2571,214],[2786,214],[3000,214],[3214,214],[3429,214],[3643,214],[3857,214],[4071,214],[4286,214],[4500,214],[4714,214],[4929,214],[5143,214],[5357,214],[5571,214],[5786,107],[6000,214],[6214,214],[6429,214],[6643,214],[6857,214],[7071,214],[7286,214],[7500,214],[7714,214],[7929,214],[8143,214],[8357,214],[8571,214],[8786,214],[9000,214],[9214,214],[9429,214],[9643,214],[9857,429],[10286,214],[10500,214],[10714,214],[10929,214],[11143,214],[11357,214],[11571,214],[12643,214],[12857,429],[13286,429],[13714,2571],[14786,214],[15000,214],[15214,214],[16286,429],[16714,429],[17143,429],[17571,429],[18000,429],[18429,429],[18857,857],[19714,214],[19929,214],[20143,214],[20357,214],[20571,2571],[21643,214],[21857,214],[22071,214],[23143,429],[23571,429],[24000,429],[24429,214],[24643,643],[25286,429],[25714,857],[26571,429],[27000,429],[27429,857],[28286,857],[29143,857],[30000,429],[30429,429],[30857,643],[31500,643],[32143,429],[32571,1286],[33857,214],[34071,214],[34286,643],[34929,643],[35571,429],[36000,857],[36857,857],[37714,2571],[38786,214],[39000,214],[39214,214],[39429,214],[39643,214],[40714,214],[40929,214],[41143,1286],[42429,214],[42643,214],[42857,429],[43286,429],[43714,214],[43929,214],[44143,214],[44357,214],[44571,214],[44786,214],[45000,857],[45857,214],[46071,214],[46286,429],[46714,429],[47143,214],[47357,214],[47571,214],[47786,214],[48000,429],[48429,429],[48857,429],[49286,429],[49714,429],[50143,429],[50571,429],[51000,429],[51429,429],[51857,429],[52286,429],[52714,429],[53143,429],[53571,429],[54000,429],[54429,429],[54857,2571],[55929,214],[56143,214],[56357,214],[57429,214],[57643,429],[58071,214],[58286,429],[58714,214],[58929,214],[59143,214],[59357,214],[59571,214],[59786,214],[60000,214],[60214,214],[60429,214],[60643,214],[60857,429],[61286,214],[61500,214],[61714,429],[62143,214],[62357,214],[62571,214],[62786,214],[63000,214],[63214,214],[63429,214],[63643,214],[63857,214],[64071,214],[64286,429],[64714,214],[64929,214],[65143,429],[65571,214],[65786,214],[66000,214],[66214,214],[66429,214],[66643,214],[66857,214],[67071,214],[67286,214],[67500,214],[67714,429],[68143,214],[68357,214],[68571,214],[68786,214],[69000,429],[69429,214],[69643,214],[69857,214],[70071,214],[70286,214],[70500,214],[70714,214],[70929,214],[71143,429],[71571,429],[72000,2571],[73071,214],[73286,214],[73500,214],[74571,429],[75000,429],[75429,429],[75857,429],[76286,429],[76714,429],[77143,857],[78000,214],[78214,214],[78429,214],[78643,214],[78857,2571],[79929,214],[80143,214],[80357,214],[81429,429],[81857,429],[82286,429],[82714,214],[82929,643],[83571,429],[84000,857],[84857,429],[85286,429],[85714,857],[86571,857],[87429,857],[88286,429],[88714,429],[89143,643],[89786,643],[90429,429],[90857,1286],[92143,214],[92357,214],[92571,643],[93214,643],[93857,429],[94286,857],[95143,857],[96000,2571],[97071,214],[97286,214],[97500,214],[97714,214],[97929,214],[99000,214],[99214,214],[99429,1286],[100714,214],[100929,214],[101143,429],[101571,429],[102000,214],[102214,214],[102429,214],[102643,214],[102857,214],[103071,214],[103286,857],[104143,214],[104357,214],[104571,429],[105000,429],[105429,214],[105643,214],[105857,214],[106071,214],[106286,429],[106714,429],[107143,429],[107571,429],[108000,429],[108429,429],[108857,429],[109286,429],[109714,429],[110143,429],[110571,429],[111000,429],[111429,429],[111857,429],[112286,429],[112714,429],[113143,1286],[114429,857],[115286,429],[115714,429],[116143,429],[116571,1714],[118286,429],[118714,429],[119143,429],[119571,429],[120000,1714],[121714,429],[122143,429],[122571,429],[123000,429],[123429,1286],[124714,214],[124929,214],[125143,429],[125571,214],[125786,429],[126214,643],[126857,3429],[127821,107],[128036,107],[128250,107],[128464,107],[128679,107],[128893,107],[129107,107],[129321,107],[130286,429],[130714,107],[130929,107],[131143,429],[131571,214],[131786,214],[132000,429],[132429,857],[133286,214],[133500,214],[133714,429],[134143,107],[134357,107],[134571,429],[135000,214],[135214,214],[135429,214],[135643,214],[135857,214],[136071,214],[136286,429],[136714,429],[137143,429],[137571,107],[137786,107],[138000,429],[138429,214],[138643,214],[138857,429],[139286,429],[139714,429],[140143,214],[140357,214],[140571,429],[141000,429],[141429,429],[141857,214],[142071,214],[142286,429],[142714,429],[143143,857]]
        },
      });

      Object.assign(BUILTIN_MUSIC_TIMINGS, {
        recordplayer: {"bpm":190,"durationMs":92211,"melody":[[474,158],[632,158],[789,158],[947,316],[1263,158],[1421,158],[1579,158],[1737,158],[1895,316],[2211,158],[2368,158],[2526,158],[2684,158],[2842,158],[3000,158],[3158,158],[3316,158],[3474,158],[3632,158],[3789,158],[3947,316],[4263,158],[4421,158],[4579,158],[4737,158],[4895,158],[5053,158],[5211,158],[5368,158],[5526,158],[5684,158],[5842,158],[6000,158],[6158,158],[6316,158],[6474,158],[6632,158],[6789,316],[6947,158],[7105,316],[7263,158],[7421,158],[7579,158],[7737,158],[7895,158],[8053,158],[8211,158],[8368,158],[8526,158],[8684,158],[8842,158],[9000,158],[9158,158],[9316,158],[9474,158],[9632,158],[9789,158],[9947,158],[10105,158],[10263,158],[10421,158],[10579,316],[10737,158],[10895,316],[11053,158],[11211,158],[11368,158],[11526,158],[11684,158],[11842,158],[12000,158],[12158,158],[12316,158],[12474,158],[12632,158],[12789,158],[12947,158],[13105,158],[13263,158],[13421,158],[13579,158],[13737,158],[13895,158],[14053,158],[14211,158],[14368,316],[14526,158],[14684,316],[14842,158],[15000,158],[15316,158],[15474,158],[15632,158],[15789,158],[15947,158],[16105,158],[16263,158],[16421,158],[16579,158],[16737,158],[16895,158],[17053,158],[17211,158],[17368,158],[17526,158],[17684,158],[17842,158],[18000,158],[18158,158],[18316,158],[18474,158],[18632,158],[18789,158],[18947,158],[19105,158],[19263,158],[19421,158],[19579,158],[19737,158],[19895,158],[20053,158],[20211,158],[20368,158],[20526,158],[20684,158],[20842,158],[21000,158],[21158,158],[21316,158],[21474,158],[21632,158],[21789,158],[21947,158],[22105,158],[22263,158],[22421,158],[22579,158],[22737,158],[22895,474],[23053,158],[23211,158],[23368,158],[23526,158],[23684,158],[23842,316],[24158,158],[24474,158],[24789,158],[25105,158],[25421,158],[25737,158],[25895,158],[26053,158],[26211,158],[26368,158],[26526,158],[26684,158],[26842,158],[27000,158],[27158,158],[27316,158],[27474,158],[27632,316],[27789,158],[27947,158],[28105,158],[28263,158],[28421,158],[28579,158],[28737,158],[28895,158],[29053,158],[29211,158],[29368,158],[29526,158],[29684,158],[29842,158],[30000,158],[30158,158],[30316,158],[30474,158],[30632,158],[30789,158],[30947,158],[31105,158],[31263,158],[31421,316],[31579,158],[31737,158],[31895,158],[32053,158],[32211,158],[32368,158],[32526,158],[32684,158],[32842,158],[33000,158],[33158,158],[33316,158],[33474,158],[33632,158],[33789,158],[33947,158],[34105,158],[34263,158],[34421,158],[34579,158],[34737,158],[34895,158],[35053,158],[35211,316],[35368,158],[35526,316],[35684,158],[35842,158],[36000,158],[36158,158],[36316,158],[36474,158],[36632,158],[36789,158],[36947,158],[37105,158],[37263,158],[37421,158],[37579,158],[37737,158],[37895,158],[38053,158],[38211,158],[38368,158],[38526,158],[38684,158],[38842,158],[39000,158],[39158,158],[39316,158],[39474,158],[39632,158],[39789,158],[39947,158],[40105,158],[40263,158],[40421,158],[40579,158],[40737,158],[40895,158],[41053,158],[41211,158],[41368,158],[41526,158],[41684,158],[41842,158],[42000,158],[42158,158],[42316,158],[42474,158],[42632,158],[42789,158],[42947,158],[43105,158],[43263,158],[43421,158],[43579,158],[43737,158],[44053,158],[44368,158],[44684,316],[45474,474],[45632,158],[45789,158],[45947,158],[46105,158],[46263,158],[46421,474],[46579,158],[46737,158],[46895,158],[47053,158],[47211,158],[47368,158],[47526,158],[47684,158],[47842,158],[48000,158],[48158,158],[48316,316],[48474,158],[48632,316],[48789,158],[48947,316],[49105,158],[49263,474],[49421,158],[49579,158],[49737,158],[49895,158],[50053,158],[50211,316],[50368,158],[50526,158],[50684,79],[50763,79],[50842,316],[51000,158],[51158,474],[51316,158],[51474,158],[51632,158],[51789,158],[51947,158],[52105,316],[52263,158],[52421,158],[52579,79],[52658,79],[52737,316],[52895,158],[53053,474],[53211,158],[53368,158],[53526,158],[53684,158],[53842,158],[54000,474],[54158,158],[54316,158],[54474,158],[54632,158],[54789,158],[54947,158],[55105,158],[55263,158],[55421,158],[55579,158],[55737,158],[55895,316],[56053,158],[56211,316],[56368,158],[56526,316],[56684,158],[56842,474],[57000,158],[57158,158],[57316,158],[57474,158],[57632,158],[57789,316],[57947,158],[58105,158],[58263,79],[58342,79],[58421,316],[58579,158],[58737,158],[58895,158],[59053,158],[59211,158],[59368,158],[59526,158],[59684,158],[59842,158],[60000,158],[60158,158],[60316,158],[60474,158],[60632,158],[60789,158],[60947,158],[61105,158],[61263,158],[61421,158],[61579,158],[61737,158],[61895,158],[62053,158],[62211,158],[62368,158],[62526,158],[62684,158],[62842,158],[63000,158],[63158,158],[63316,158],[63474,316],[63789,316],[64105,316],[64421,316],[64737,316],[65053,316],[65368,316],[65684,316],[66000,316],[66316,158],[66474,158],[66632,158],[66789,158],[66947,158],[67105,158],[67263,158],[67421,158],[67579,158],[67737,158],[67895,158],[68053,158],[68211,158],[68368,158],[68526,158],[68684,158],[68842,158],[69000,158],[69158,158],[69316,158],[69474,158],[69632,158],[69789,158],[69947,158],[70105,316],[70263,158],[70421,158],[70579,158],[70737,158],[70895,158],[71053,316],[71211,158],[71368,158],[71526,158],[71684,158],[71842,158],[72000,158],[72158,158],[72316,158],[72474,158],[72632,158],[72789,158],[72947,316],[73105,158],[73263,316],[73421,158],[73579,316],[73737,158],[73895,316],[74053,158],[74211,158],[74368,158],[74526,158],[74684,158],[74842,316],[75000,158],[75158,158],[75316,158],[75474,158],[75632,158],[75789,158],[75947,158],[76105,158],[76263,158],[76421,158],[76579,158],[76737,316],[76895,158],[77053,316],[77211,158],[77368,316],[77684,316],[77842,158],[78000,158],[78158,158],[78316,158],[78474,158],[78632,316],[78789,158],[78947,158],[79105,158],[79263,158],[79421,158],[79579,158],[79737,158],[79895,158],[80053,158],[80211,158],[80368,158],[80526,316],[80684,158],[80842,316],[81000,158],[81158,316],[81316,158],[81474,158],[81632,158],[81789,158],[81947,158],[82105,158],[82263,158],[82421,158],[82579,158],[82737,158],[82895,158],[83053,158],[83211,158],[83368,158],[83526,158],[83684,158],[83842,158],[84000,158],[84158,158],[84316,158],[84474,158],[84632,158],[84789,158],[84947,158],[85105,158],[85263,158],[85421,158],[85579,158],[85737,158],[85895,158],[86053,158],[86211,158],[86368,158],[86526,158],[86684,158],[86842,158],[87000,158],[87158,158],[87316,158],[87474,158],[87632,158],[87789,158],[87947,158],[88105,158],[88263,158],[88421,158],[88579,158],[88737,158],[88895,158],[89053,947],[89211,158],[89368,158],[89526,158],[89684,158],[89842,158],[90000,316],[90316,316],[90632,316],[90947,316],[91263,316],[91579,316],[91895,316]]},
        stallion: {"bpm":130,"durationMs":125539,"melody":[[0,462],[231,231],[462,231],[692,231],[923,231],[1154,231],[1385,462],[1846,231],[2077,231],[2308,231],[2538,462],[3000,462],[3231,462],[3462,231],[3692,462],[3923,231],[4154,231],[4385,231],[4615,231],[4846,231],[5077,462],[5538,231],[5769,231],[6000,231],[6231,231],[6462,923],[6923,462],[7385,462],[7615,231],[7846,231],[8077,231],[8308,231],[8538,231],[8769,462],[9231,231],[9462,231],[9692,231],[9923,462],[10385,462],[10615,462],[10846,231],[11077,462],[11308,231],[11538,231],[11769,231],[12000,231],[12231,231],[12462,462],[12923,231],[13154,231],[13385,231],[13615,231],[13846,462],[14308,462],[14769,462],[15000,231],[15231,462],[15462,231],[15692,231],[15923,462],[16385,231],[16615,231],[16846,462],[17308,231],[17538,231],[17769,231],[18000,231],[18231,231],[18462,462],[18692,231],[18923,462],[19154,231],[19385,231],[19615,462],[20077,231],[20308,231],[20538,462],[21000,231],[21231,231],[21462,231],[21692,231],[21923,231],[22154,462],[22385,231],[22615,462],[22846,231],[23077,231],[23308,462],[23769,231],[24000,231],[24231,462],[24692,231],[24923,231],[25154,231],[25385,231],[25615,231],[25846,462],[26077,231],[26308,462],[26538,231],[26769,231],[27000,462],[27462,231],[27692,231],[27923,462],[28385,231],[28615,231],[28846,231],[29077,231],[29308,231],[29538,115],[29654,115],[29769,231],[30000,231],[30231,115],[30346,115],[30462,115],[30577,115],[30692,231],[30923,231],[31154,115],[31269,115],[31385,115],[31500,115],[31615,115],[31846,231],[32077,115],[32192,115],[32308,115],[32423,115],[32538,115],[32769,231],[33000,231],[33231,462],[33462,231],[33692,231],[33923,115],[34038,115],[34154,115],[34269,115],[34385,231],[34615,231],[34846,115],[34962,115],[35077,115],[35192,115],[35308,115],[35538,231],[35769,115],[35885,115],[36000,115],[36115,115],[36231,115],[36462,462],[36692,231],[36923,462],[37154,231],[37385,231],[37615,231],[37846,231],[38077,231],[38308,231],[38538,231],[38769,231],[39000,231],[39231,231],[39462,231],[39692,462],[39923,231],[40154,462],[40385,231],[40615,462],[40846,231],[41077,231],[41308,231],[41538,231],[41769,231],[42000,231],[42231,231],[42462,231],[42692,231],[42923,231],[43154,231],[43385,231],[43615,231],[43846,231],[44077,231],[44308,462],[44538,231],[44769,231],[45000,231],[45231,231],[45462,231],[45692,231],[45923,231],[46154,231],[46385,231],[46615,231],[46846,231],[47077,462],[47308,231],[47538,462],[47769,231],[48000,462],[48231,231],[48462,231],[48692,231],[48923,231],[49154,231],[49385,231],[49615,231],[49846,231],[50077,231],[50308,231],[50538,231],[50769,462],[51000,231],[51231,462],[51462,231],[51692,692],[51923,231],[52154,231],[52385,923],[52615,231],[52846,231],[53077,231],[53308,231],[53538,692],[53769,231],[54000,231],[54231,231],[54462,462],[54692,231],[54923,231],[55154,231],[55385,692],[55615,231],[55846,231],[56077,923],[56308,231],[56538,231],[56769,231],[57000,231],[57231,692],[57462,231],[57692,231],[57923,231],[58154,231],[58385,231],[58615,231],[58846,231],[59077,692],[59308,231],[59538,231],[59769,923],[60000,231],[60231,231],[60462,231],[60692,231],[60923,692],[61154,231],[61385,231],[61615,231],[61846,462],[62077,231],[62308,231],[62538,231],[62769,692],[63000,231],[63231,231],[63462,923],[63692,231],[63923,231],[64154,231],[64385,231],[64615,692],[64846,231],[65077,231],[65308,231],[65538,231],[65769,231],[66000,231],[66231,231],[66462,231],[66692,231],[66923,231],[67154,231],[67385,231],[67615,231],[67846,462],[68077,231],[68308,231],[68538,231],[68769,231],[69000,462],[69462,462],[69692,462],[69923,231],[70154,231],[70385,231],[70615,231],[70846,231],[71077,231],[71308,231],[71538,462],[71769,231],[72000,231],[72231,231],[72462,231],[72692,231],[72923,462],[73385,462],[73615,231],[73846,231],[74077,231],[74308,231],[74538,231],[74769,231],[75000,231],[75231,462],[75462,231],[75692,231],[75923,231],[76154,231],[76385,462],[76846,692],[77077,462],[77538,231],[77769,231],[78000,231],[78231,231],[78462,231],[78692,231],[78923,462],[79154,231],[79385,231],[79615,231],[79846,231],[80077,462],[80538,462],[80769,462],[81000,231],[81231,231],[81462,231],[81692,231],[81923,231],[82154,231],[82385,231],[82615,462],[83077,231],[83308,231],[83538,231],[83769,462],[84231,462],[84462,462],[84692,231],[84923,231],[85154,231],[85385,231],[85615,231],[85846,231],[86077,231],[86308,462],[86769,231],[87000,231],[87231,231],[87462,231],[87692,462],[88154,462],[88385,231],[88615,231],[88846,231],[89077,231],[89308,231],[89538,231],[89769,231],[90000,462],[90231,231],[90462,231],[90692,231],[90923,231],[91154,462],[91385,231],[91615,692],[91846,231],[92077,231],[92308,231],[92538,231],[92769,231],[93000,231],[93231,231],[93462,231],[93692,462],[93923,231],[94154,231],[94385,231],[94615,231],[94846,462],[95077,231],[95308,462],[95538,231],[95769,231],[96000,462],[96231,231],[96462,462],[96692,231],[96923,231],[97154,462],[97385,231],[97615,231],[97846,231],[98077,462],[98308,231],[98538,231],[98769,231],[99000,231],[99231,231],[99462,231],[99692,462],[99923,231],[100154,462],[100385,231],[100615,231],[100846,462],[101077,231],[101308,231],[101538,231],[101769,462],[102000,231],[102231,231],[102462,231],[102692,231],[102923,231],[103154,231],[103385,462],[103615,231],[103846,462],[104077,231],[104308,231],[104538,462],[104769,231],[105000,231],[105231,231],[105462,462],[105692,231],[105923,231],[106154,231],[106385,231],[106615,231],[106846,231],[107077,462],[107308,231],[107538,462],[107769,231],[108000,231],[108231,462],[108462,231],[108692,231],[108923,231],[109154,462],[109385,231],[109615,231],[109846,231],[110077,231],[110308,231],[110538,231],[110769,115],[110885,115],[111000,231],[111231,231],[111462,115],[111577,115],[111692,115],[111808,115],[111923,231],[112154,231],[112385,115],[112500,115],[112615,115],[112731,115],[112846,115],[113077,231],[113308,115],[113423,115],[113538,115],[113654,115],[113769,115],[114000,231],[114231,231],[114462,462],[114692,231],[114923,231],[115154,115],[115269,115],[115385,115],[115500,115],[115615,115],[115846,231],[116077,115],[116192,115],[116308,115],[116423,115],[116538,115],[116769,231],[117000,115],[117115,115],[117231,115],[117346,115],[117462,115],[117692,462],[117923,231],[118154,115],[118269,115],[118385,231],[118615,231],[118846,115],[118962,115],[119077,115],[119192,115],[119308,115],[119538,231],[119769,115],[119885,115],[120000,115],[120115,115],[120231,115],[120462,231],[120692,115],[120808,115],[120923,115],[121038,115],[121154,115],[121385,231],[121615,231],[121846,462],[122077,231],[122308,231],[122538,115],[122654,115],[122769,115],[122885,115],[123000,115],[123231,231],[123462,115],[123577,115],[123692,115],[123808,115],[123923,115],[124154,231],[124385,115],[124500,115],[124615,115],[124731,115],[124846,115],[125077,462],[125308,231]]},
      });

      BUILTIN_MUSIC_TIMINGS.fiu = {
        ...BUILTIN_MUSIC_TIMINGS.fiu,
        melody: [[0,345],[345,345],[690,345],[1034,345],[1379,517],[1897,172],[2069,345],[2414,172],[2586,172],[2759,345],[3103,517],[3621,172],[3793,345],[4138,345],[4483,345],[4828,345],[5172,345],[5517,172],[5690,172],[5862,172],[6034,172],[6207,345],[6552,172],[6724,172],[6897,172],[7069,172],[7241,345],[7586,172],[7759,172],[7931,172],[8103,172],[8276,345],[8621,172],[8793,517],[9310,517],[9828,517],[10345,345],[10690,517],[11207,172],[11379,690],[12069,345],[12414,345],[12759,172],[12931,172],[13103,172],[13276,172],[13448,345],[13793,172],[13966,172],[14138,172],[14310,172],[14483,172],[14655,172],[14828,172],[15000,172],[15172,172],[15345,172],[15517,1034],[16552,172],[16724,172],[16897,172],[17069,172],[17241,172],[17414,172],[17586,172],[17759,172],[17931,172],[18103,172],[18276,172],[18448,172],[18621,172],[18793,172],[18966,172],[19138,172],[19310,172],[19483,172],[19655,172],[19828,172],[20000,172],[20172,172],[20345,172],[20517,172],[20690,172],[20862,172],[21034,172],[21207,172],[21379,172],[21552,172],[21724,172],[21897,172],[22069,172],[22241,172],[22414,172],[22586,172],[22759,172],[22931,172],[23103,172],[23276,172],[23448,172],[23621,172],[23793,172],[23966,172],[24138,172],[24310,172],[24483,172],[24655,172],[24828,1034],[25862,1034],[26897,1034],[27931,345],[28276,345],[28621,345],[28966,1034],[30000,1034],[31034,1034],[32069,345],[32414,345],[32759,345],[33103,172],[33276,172],[33448,172],[33621,172],[33793,172],[33966,172],[34138,172],[34310,172],[34483,172],[34655,172],[34828,172],[35000,172],[35172,172],[35345,172],[35517,172],[35690,172],[35862,172],[36034,172],[36207,172],[36379,172],[36552,172],[36724,172],[36897,172],[37069,172],[37241,172],[37414,172],[37586,172],[37759,172],[37931,172],[38103,172],[38276,172],[38448,172],[38621,172],[38793,172],[38966,172],[39138,172],[39310,172],[39483,172],[39655,172],[39828,172],[40000,172],[40172,172],[40345,172],[40517,172],[40690,172],[40862,172],[41034,172],[41207,172],[41379,1034],[42414,1034],[43448,1034],[44483,345],[44828,345],[45172,345],[45517,1034],[46552,1034],[47586,1379],[48966,345],[49310,345],[49655,1379],[51724,345],[52069,172],[52241,172],[52414,345],[52759,345],[53103,172],[53276,172],[53448,172],[53621,172],[53793,345],[54138,172],[54310,172],[54483,345],[54828,690],[55517,345],[55862,690],[56552,345],[56897,345],[57241,517],[57759,172],[57931,517],[58448,172],[58621,172],[58793,172],[58966,1034],[61379,172],[61552,172],[61724,172],[61897,172],[62069,345],[62414,172],[62586,172],[62759,345],[63103,345],[63448,345],[63793,345],[64138,517],[64655,172],[64828,345],[65172,517],[65690,172],[65862,345],[66207,172],[66379,172],[66552,345],[68276,345],[68621,345],[68966,345],[69310,345],[69655,517],[70172,172],[70345,345],[70690,172],[70862,172],[71034,345],[71379,517],[71897,172],[72069,345],[72414,345],[72759,345],[73103,345],[73448,345],[73793,172],[73966,172],[74138,172],[74310,172],[74483,345],[74828,172],[75000,172],[75172,172],[75345,172],[75517,345],[75862,172],[76034,172],[76207,172],[76379,172],[76552,345],[76897,172],[77069,517],[77586,517],[78103,517],[78621,345],[78966,517],[79483,172],[79655,690],[80345,345],[80690,345],[81034,172],[81207,172],[81379,172],[81552,172],[81724,345],[82069,172],[82241,172],[82414,172],[82586,172],[82759,172],[82931,172],[83103,172],[83276,172],[83448,172],[83621,172],[83793,1034],[84828,345],[85172,345],[85517,172],[85690,172],[85862,345],[86207,345],[86552,172],[86724,172],[86897,345],[87241,345],[87586,345],[87931,690],[88276,345],[88621,172],[88793,172],[88966,345],[89310,345],[89655,172],[89828,172],[90000,345],[90345,345],[90690,172],[90862,172],[91034,345],[91379,345],[91724,172],[91897,172],[92069,1034],[93103,345],[93448,345],[93793,172],[93966,172],[94138,345],[94483,345],[94828,172],[95000,172],[95172,345],[95517,345],[95862,345],[96207,690],[96897,172],[97069,172],[97241,345],[97586,345],[97931,172],[98103,172],[98276,345],[98621,345],[98966,172],[99138,172],[99310,345],[99655,345],[100000,172],[100172,172],[100345,690]],
      };

      const musicChartCache = new Map();
      const musicAudioCache = new Map();
      const preparedSongDataCache = new Map();
      const builtinHardLaneChartCache = new Map();
      const MUSIC_GAME_LANES = [
        [0.14, 0.24], [0.26, 0.38], [0.38, 0.54], [0.5, 0.7], [0.62, 0.38], [0.74, 0.56], [0.86, 0.24],
        [0.2, 0.7], [0.32, 0.24], [0.44, 0.38], [0.56, 0.54], [0.68, 0.7], [0.8, 0.38]
      ];
      const LANE_MODE_LANES = 4;

      function compressMelodyTimeline(melody) {
        const windowMs = 650;
        const compressed = [];
        let index = 0;

        while (index < melody.length) {
          const startTime = melody[index][0];
          const bucket = [];
          while (index < melody.length && melody[index][0] < startTime + windowMs) {
            bucket.push(melody[index]);
            index += 1;
          }
          const targetTime = startTime + windowMs * 0.34;
          const picked = bucket.reduce((best, note) => {
            const bestScore = (best[1] > 0 ? 1200 : 0) + best[1] - Math.abs(best[0] - targetTime) * 0.24;
            const noteScore = (note[1] > 0 ? 1200 : 0) + note[1] - Math.abs(note[0] - targetTime) * 0.24;
            return noteScore >= bestScore ? note : best;
          }, bucket[0]);
          compressed.push(picked);
        }

        const filled = [];
        compressed.forEach((note, noteIndex) => {
          filled.push(note);
          const next = compressed[noteIndex + 1];
          if (!next) return;
          if (next[0] - note[0] <= 1500) return;

          const between = melody.filter((candidate) => candidate[0] > note[0] + 260 && candidate[0] < next[0] - 260);
          if (!between.length) return;
          const bridge = between.reduce((best, candidate) => {
            const midpoint = note[0] + (next[0] - note[0]) * 0.5;
            const bestScore = (best[1] > 0 ? 900 : 0) + best[1] - Math.abs(best[0] - midpoint) * 0.18;
            const candidateScore = (candidate[1] > 0 ? 900 : 0) + candidate[1] - Math.abs(candidate[0] - midpoint) * 0.18;
            return candidateScore >= bestScore ? candidate : best;
          }, between[0]);
          filled.push(bridge);
        });

        return filled.sort((a, b) => a[0] - b[0]);
      }

      function compressMelodyTimelineHard(melody) {
        const compressed = [];
        let lastTime = -Infinity;
        melody.forEach((note, index) => {
          const minGap = note[1] >= 700 ? 130 : note[1] >= 360 ? 110 : 150;
          if (note[0] - lastTime < minGap && index % 3 !== 0) return;
          compressed.push(note);
          lastTime = note[0];
        });
        return compressed;
      }

      function buildMusicChartLayout(melody) {
        const activeWindowMs = 2600;
        const placed = [];

        function distance(a, b) {
          return Math.hypot(a.x - b.x, a.y - b.y);
        }

        function choosePoint(note, recent, exclude = []) {
          let best = null;
          let bestScore = -Infinity;
          MUSIC_GAME_LANES.forEach(([x, y], idx) => {
            const candidate = { x, y };
            if (exclude.some((point) => distance(candidate, point) < 0.2)) return;
            const minRecent = recent.length ? Math.min(...recent.map((recentNote) => distance(candidate, recentNote))) : 0.48;
            const last = placed[placed.length - 1];
            const lastDistance = last ? distance(candidate, last) : 0.42;
            const centerBias = 0.2 - Math.abs(x - 0.5) * 0.22;
            const score = minRecent * 2.4 + lastDistance * 0.9 + centerBias + ((idx + note.timeMs) % 7) * 0.0001;
            if (score > bestScore) {
              best = candidate;
              bestScore = score;
            }
          });
          return best || { x: 0.5, y: 0.5 };
        }

        return melody.map(([timeMs, holdMs], index) => {
          const recent = placed.filter((entry) => timeMs - entry.timeMs < activeWindowMs);
          const startPoint = choosePoint({ timeMs }, recent);
          const note = holdMs > 0
            ? {
                id: `drag-${index}`,
                type: "drag",
                timeMs,
                endTimeMs: timeMs + holdMs,
                x: startPoint.x,
                y: startPoint.y,
                accent: index % 2 === 0 ? "green" : "purple",
              }
            : {
                id: `tap-${index}`,
                type: "tap",
                timeMs,
                x: startPoint.x,
                y: startPoint.y,
              };

          if (note.type === "drag") {
            const recentEnds = recent.map((entry) => ({
              x: entry.endX ?? entry.x,
              y: entry.endY ?? entry.y,
            }));
            const endPoint = choosePoint(note, recentEnds, [startPoint]);
            note.endX = endPoint.x;
            note.endY = endPoint.y;
          }

          placed.push(note);
          return note;
        });
      }

      function materializeBuiltinMusicChart(songKey, difficulty = "normal") {
        const builtin = BUILTIN_MUSIC_TIMINGS[songKey];
        if (!builtin) return null;
        const compressedMelody = difficulty === "hard"
          ? compressMelodyTimelineHard(builtin.melody)
          : compressMelodyTimeline(builtin.melody);
        return {
          bpm: builtin.bpm,
          durationMs: builtin.durationMs,
          chart: buildMusicChartLayout(compressedMelody),
        };
      }

      function buildLaneModeChart(songKey, timingOverride = null) {
        const builtin = timingOverride || BUILTIN_MUSIC_TIMINGS[songKey];
        if (!builtin) return null;
        const melody = builtin.melody;
        const laneFreeUntil = new Array(LANE_MODE_LANES).fill(-Infinity);
        const notes = [];
        let lastLane = 1;
        let emittedIndex = 0;

        const grouped = [];
        melody.forEach((entry) => {
          const group = grouped[grouped.length - 1];
          if (!group || entry[0] - group.anchor > 210) {
            grouped.push({ anchor: entry[0], entries: [entry] });
          } else {
            group.entries.push(entry);
          }
        });

        function reserveLane(lane, untilMs) {
          laneFreeUntil[lane] = Math.max(laneFreeUntil[lane], untilMs);
        }

        function activeCountAt(timeMs) {
          return notes.filter((note) => (note.endTimeMs || note.timeMs + 150) > timeMs && note.timeMs < timeMs + 90).length;
        }

        function availableLanesAt(timeMs) {
          return laneFreeUntil
            .map((freeUntil, lane) => ({ lane, freeUntil }))
            .filter(({ freeUntil }) => freeUntil <= timeMs - 70)
            .map(({ lane }) => lane);
        }

        function chooseLane(available, preferred, avoid = []) {
          const filtered = available.filter((lane) => !avoid.includes(lane));
          if (!filtered.length) return null;
          return filtered
            .slice()
            .sort((a, b) => (Math.abs(a - preferred) - Math.abs(b - preferred)) || (Math.abs(a - lastLane) - Math.abs(b - lastLane)))[0];
        }

        function noteTypeFor(timeMs, holdMs) {
          if (holdMs >= 900) return emittedIndex % 4 === 1 ? "drag" : "hold";
          if (holdMs >= 520) return emittedIndex % 5 === 2 ? "drag" : "hold";
          if (emittedIndex % 11 === 6) return "flick";
          if (emittedIndex % 13 === 9 && timeMs > 12000) return "flick";
          return "tap";
        }

        function pushLaneNote(timeMs, holdMs, lane, paired = false) {
          const type = noteTypeFor(timeMs, holdMs);

          if (type === "drag") {
            const endCandidates = availableLanesAt(timeMs + 320).filter((candidate) => candidate !== lane);
            const ordered = endCandidates
              .slice()
              .sort((a, b) => (Math.abs(Math.abs(a - lane) - 2) - Math.abs(Math.abs(b - lane) - 2)) || (Math.abs(a - lastLane) - Math.abs(b - lastLane)));
            const endLane = ordered[0] ?? (lane < LANE_MODE_LANES - 1 ? lane + 1 : lane - 1);
            const endTimeMs = timeMs + Math.max(760, holdMs);
            notes.push({
              id: `lane-drag-${notes.length}`,
              type: "drag",
              timeMs,
              lane,
              endLane,
              endTimeMs,
            });
            const start = Math.min(lane, endLane);
            const end = Math.max(lane, endLane);
            for (let currentLane = start; currentLane <= end; currentLane += 1) reserveLane(currentLane, endTimeMs);
          } else if (type === "hold") {
            const endTimeMs = timeMs + Math.max(700, holdMs);
            notes.push({
              id: `lane-hold-${notes.length}`,
              type: "hold",
              timeMs,
              lane,
              endTimeMs,
            });
            reserveLane(lane, endTimeMs);
          } else {
            notes.push({
              id: `lane-${type}-${notes.length}`,
              type,
              timeMs,
              lane,
            });
            reserveLane(lane, timeMs + (paired ? 220 : 170));
          }

          lastLane = lane;
          emittedIndex += 1;
        }

        grouped.forEach((group, groupIndex) => {
          const ranked = group.entries
            .slice()
            .sort((a, b) => ((b[1] > 0) - (a[1] > 0)) || (b[1] - a[1]) || (a[0] - b[0]));
          const shouldDouble = ranked.length >= 2 && groupIndex % 2 === 0;
          const targetCount = shouldDouble ? 2 : 1;
          const chosenEntries = ranked.slice(0, targetCount);
          const simultaneousTime = chosenEntries[0]?.[0];
          if (simultaneousTime == null) return;
          if (activeCountAt(simultaneousTime) >= 2) return;

          const available = availableLanesAt(simultaneousTime);
          if (!available.length) return;

          const primaryPreferred = lastLane <= 1 ? 2 : lastLane >= LANE_MODE_LANES - 2 ? 1 : lastLane + (groupIndex % 2 === 0 ? 1 : -1);
          const firstLane = chooseLane(available, primaryPreferred);
          if (firstLane == null) return;
          pushLaneNote(chosenEntries[0][0], chosenEntries[0][1], firstLane, chosenEntries.length > 1);

          if (chosenEntries.length < 2 || activeCountAt(simultaneousTime) >= 2) return;
          const secondAvailable = availableLanesAt(simultaneousTime).filter((lane) => lane !== firstLane);
          if (!secondAvailable.length) return;
          const oppositePreferred = firstLane < LANE_MODE_LANES / 2 ? LANE_MODE_LANES - 1 : 0;
          const secondLane = chooseLane(secondAvailable, oppositePreferred, [firstLane]);
          if (secondLane == null) return;
          pushLaneNote(chosenEntries[1][0], Math.min(chosenEntries[1][1], 820), secondLane, true);
        });

        grouped.slice(1).forEach((group, index) => {
          const prevGroup = grouped[index];
          const previousTime = prevGroup.entries[0][0];
          const currentTime = group.entries[0][0];
          if (currentTime - previousTime < 1100) return;
          const bridge = melody.find((entry) => entry[0] > previousTime + 320 && entry[0] < currentTime - 320 && entry[1] <= 700);
          if (!bridge) return;
          if (activeCountAt(bridge[0]) >= 2) return;
          const available = availableLanesAt(bridge[0]);
          const bridgeLane = chooseLane(available, (lastLane + 2) % LANE_MODE_LANES);
          if (bridgeLane == null) return;
          pushLaneNote(bridge[0], bridge[1], bridgeLane);
        });

        notes.sort((a, b) => a.timeMs - b.timeMs || a.lane - b.lane);

        return {
          bpm: builtin.bpm,
          durationMs: builtin.durationMs,
          chart: notes,
          laneCount: LANE_MODE_LANES,
          mode: "lanes",
        };
      }

      function buildHardLaneModeChart(songKey) {
        const builtin = BUILTIN_MUSIC_TIMINGS[songKey];
        if (!builtin) return null;
        const grouped = [];
        builtin.melody.forEach((entry) => {
          const group = grouped[grouped.length - 1];
          if (!group || entry[0] - group.anchor > 165) {
            grouped.push({ anchor: entry[0], entries: [entry] });
          } else {
            group.entries.push(entry);
          }
        });

        const laneFreeUntil = new Array(LANE_MODE_LANES).fill(-Infinity);
        const notes = [];
        let primaryLane = 1;
        let emitted = 0;

        function activeCountAt(timeMs) {
          return notes.filter((note) => (note.endTimeMs || note.timeMs + 180) > timeMs && note.timeMs < timeMs + 120).length;
        }

        function hasActiveLongNoteAt(timeMs) {
          return notes.some((note) => note.endTimeMs && note.endTimeMs > timeMs && note.timeMs < timeMs + 120);
        }

        function isTimeCrowded(timeMs) {
          return notes.some((note) => Math.abs(note.timeMs - timeMs) < 185);
        }

        function availableLanesAt(timeMs) {
          return laneFreeUntil
            .map((freeUntil, lane) => ({ freeUntil, lane }))
            .filter(({ freeUntil }) => freeUntil <= timeMs - 65)
            .map(({ lane }) => lane);
        }

        function reserveSpan(note) {
          const releaseAt = note.endTimeMs || note.timeMs + 185;
          const path = [note.lane, note.endLane ?? note.lane];
          const low = Math.min(...path);
          const high = Math.max(...path);
          for (let lane = low; lane <= high; lane += 1) {
            laneFreeUntil[lane] = Math.max(laneFreeUntil[lane], releaseAt);
          }
        }

        function pickLane(timeMs, preferred, avoid = []) {
          const available = availableLanesAt(timeMs).filter((lane) => !avoid.includes(lane));
          if (!available.length) return null;
          return available
            .slice()
            .sort((a, b) => (Math.abs(a - preferred) - Math.abs(b - preferred)) || (laneFreeUntil[a] - laneFreeUntil[b]))[0];
        }

        function pushNote(timeMs, holdMs, lane, paired = false) {
          const longHold = holdMs >= 520;
          const wantsDrag = longHold && (emitted % 3 !== 1 || holdMs >= 900);
          const wantsFlick = !longHold && emitted % 9 === 4;
          const wantsHold = longHold && !wantsDrag;

          if (wantsDrag) {
            const targetPool = [0, 1, 2, 3].filter((candidate) => candidate !== lane);
            const endLane = targetPool
              .slice()
              .sort((a, b) => (Math.abs(Math.abs(a - lane) - 2) - Math.abs(Math.abs(b - lane) - 2)) || (Math.abs(a - primaryLane) - Math.abs(b - primaryLane)))[0];
            const duration = Math.max(860, holdMs + (paired ? 180 : 320));
            const note = {
              id: `lane-hard-drag-${notes.length}`,
              type: "drag",
              timeMs,
              lane,
              endLane,
              endTimeMs: timeMs + duration,
            };
            notes.push(note);
            reserveSpan(note);
            primaryLane = endLane;
            emitted += 1;
            return;
          }

          if (wantsHold) {
            const note = {
              id: `lane-hard-hold-${notes.length}`,
              type: "hold",
              timeMs,
              lane,
              endTimeMs: timeMs + Math.max(760, holdMs + (paired ? 120 : 240)),
            };
            notes.push(note);
            reserveSpan(note);
            primaryLane = lane;
            emitted += 1;
            return;
          }

          const note = {
            id: `lane-hard-${wantsFlick ? "flick" : "tap"}-${notes.length}`,
            type: wantsFlick ? "flick" : "tap",
            timeMs,
            lane,
          };
          notes.push(note);
          reserveSpan(note);
          primaryLane = lane;
          emitted += 1;
        }

        grouped.forEach((group, groupIndex) => {
          const baseTime = group.entries[0][0];
          if (isTimeCrowded(baseTime)) return;
          if (hasActiveLongNoteAt(baseTime)) return;
          if (activeCountAt(baseTime) >= 2) return;
          const sorted = group.entries
            .slice()
            .sort((a, b) => ((b[1] > 0) - (a[1] > 0)) || (b[1] - a[1]) || (a[0] - b[0]));
          const longLead = (sorted[0]?.[1] || 0) >= 520;
          const secondLong = (sorted[1]?.[1] || 0) >= 520;
          const targetCount = (longLead || secondLong) ? 1 : ((sorted.length > 1 || groupIndex % 4 === 0) ? 2 : 1);
          const preferred = [1, 2, 0, 3, 2, 1, 3, 0][groupIndex % 8];
          const firstLane = pickLane(baseTime, preferred);
          if (firstLane == null) return;
          pushNote(sorted[0][0], sorted[0][1], firstLane, targetCount > 1);

          if (targetCount < 2 || activeCountAt(baseTime) >= 2) return;
          if (hasActiveLongNoteAt(baseTime)) return;
          const opposite = firstLane <= 1 ? 3 : 0;
          const secondLane = pickLane(baseTime, opposite, [firstLane]);
          if (secondLane == null) return;
          const secondEntry = sorted[1] || [baseTime, 0];
          pushNote(secondEntry[0], secondEntry[1], secondLane, true);
        });

        notes.sort((a, b) => a.timeMs - b.timeMs || a.lane - b.lane);
        let tapCounter = 0;
        const chart = notes.map((note) => {
          if (note.type !== "tap") return note;
          tapCounter += 1;
          return tapCounter % 12 === 0 ? { ...note, bonus: true } : note;
        });

        return {
          bpm: builtin.bpm,
          durationMs: builtin.durationMs,
          chart,
          laneCount: LANE_MODE_LANES,
          mode: "lanes",
          difficulty: "hard",
        };
      }

      function getBuiltinLaneChart(songKey, difficulty = "normal") {
        if (difficulty === "hard") {
          if (!builtinHardLaneChartCache.has(songKey)) {
            const chart = buildHardLaneModeChart(songKey);
            if (chart) builtinHardLaneChartCache.set(songKey, chart);
          }
          return builtinHardLaneChartCache.get(songKey) || null;
        }
        return buildLaneModeChart(songKey) || BUILTIN_LANE_MODE_CHARTS[songKey] || null;
      }

      function parseMusicXmlParts(xmlText, song) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("MusicXML parse failed");

        const tempo = Number(doc.querySelector("sound[tempo]")?.getAttribute("tempo") || song.bpm || 87);
        const scoreParts = new Map(
          Array.from(doc.querySelectorAll("part-list score-part")).map((scorePart) => [
            scorePart.getAttribute("id"),
            scorePart.querySelector("part-name")?.textContent?.trim() || scorePart.getAttribute("id") || "",
          ])
        );

        const parts = Array.from(doc.querySelectorAll("part")).map((part) => {
          let divisions = 4;
          let cursor = 0;
          let lastNonChordStart = 0;
          let maxMeasure = 0;
          const onsetMap = new Map();

          Array.from(part.querySelectorAll(":scope > measure")).forEach((measure) => {
            const measureNumber = Number(measure.getAttribute("number") || 0);
            maxMeasure = Math.max(maxMeasure, measureNumber);

            Array.from(measure.children).forEach((child) => {
              if (child.tagName === "attributes") {
                const divisionsNode = child.querySelector("divisions");
                if (divisionsNode) divisions = Number(divisionsNode.textContent) || divisions;
                return;
              }
              if (child.tagName === "backup") {
                cursor -= Number(child.querySelector("duration")?.textContent || 0);
                return;
              }
              if (child.tagName === "forward") {
                cursor += Number(child.querySelector("duration")?.textContent || 0);
                return;
              }
              if (child.tagName !== "note") return;

              const duration = Number(child.querySelector("duration")?.textContent || 0);
              const isChord = Array.from(child.children).some((node) => node.tagName === "chord");
              const isRest = Array.from(child.children).some((node) => node.tagName === "rest");
              const pitch = child.querySelector("pitch");
              const start = isChord ? lastNonChordStart : cursor;
              const key = `${measureNumber}:${start}`;

              if (!isRest && pitch) {
                const step = pitch.querySelector("step")?.textContent;
                const octave = pitch.querySelector("octave")?.textContent;
                const alter = pitch.querySelector("alter")?.textContent || "0";
                if (step && octave) {
                  const midi = mapPitchToMidi(step, alter, octave);
                  if (!onsetMap.has(key)) {
                    onsetMap.set(key, {
                      measure: measureNumber,
                      startDiv: start,
                      durationDiv: duration,
                      midi,
                      chordSize: 1,
                    });
                  } else {
                    const entry = onsetMap.get(key);
                    entry.chordSize += 1;
                    if (midi >= entry.midi) {
                      entry.midi = midi;
                      entry.durationDiv = Math.max(entry.durationDiv, duration);
                    }
                  }
                }
              }

              if (!isChord) {
                lastNonChordStart = start;
                cursor += duration;
              }
            });
          });

          return {
            id: part.getAttribute("id") || "",
            name: scoreParts.get(part.getAttribute("id")) || part.getAttribute("id") || "",
            divisions,
            onsets: Array.from(onsetMap.values()).sort((a, b) => a.startDiv - b.startDiv),
            maxMeasure,
          };
        });

        const maxMeasure = Math.max(0, ...parts.map((part) => part.maxMeasure));
        return { tempo, parts, maxMeasure };
      }

      function extractLeadMelodyFromMusicXml(xmlText, song) {
        const parsed = parseMusicXmlParts(xmlText, song);
        const msPerDivision = (60000 / parsed.tempo) / Math.max(1, parsed.parts[0]?.divisions || 4);
        const leadByMeasure = new Map();
        let previousLeadId = "";

        for (let measure = 1; measure <= parsed.maxMeasure; measure += 1) {
          const active = parsed.parts
            .map((part) => {
              const events = part.onsets.filter((note) => note.measure === measure);
              if (!events.length) return null;
              const avgMidi = events.reduce((sum, note) => sum + note.midi, 0) / events.length;
              const maxMidi = Math.max(...events.map((note) => note.midi));
              const totalDur = events.reduce((sum, note) => sum + note.durationDiv, 0);
              const avgChord = events.reduce((sum, note) => sum + note.chordSize, 0) / events.length;
              const densityPenalty = Math.max(0, events.length - 14) * 0.9;
              const pianoPenalty = part.name.includes("钢琴") || /piano/i.test(part.name);
              let score = avgMidi * 1.25 + maxMidi * 0.45 + totalDur * 0.08 - avgChord * 6 - densityPenalty;
              if (pianoPenalty) score -= 14;
              else score += 4;
              return { part, events, score };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

          if (!active.length) continue;
          let lead = active[0];
          const previous = active.find((candidate) => candidate.part.id === previousLeadId);
          if (previous && previous.score >= lead.score - 6) lead = previous;
          leadByMeasure.set(measure, lead.part.id);
          previousLeadId = lead.part.id;
        }

        const melody = [];
        const seenStarts = new Set();
        parsed.parts.forEach((part) => {
          part.onsets.forEach((note) => {
            if (leadByMeasure.get(note.measure) !== part.id) return;
            const key = `${note.startDiv}`;
            if (seenStarts.has(key)) return;
            seenStarts.add(key);
            melody.push([
              Math.round(note.startDiv * msPerDivision),
              Math.max(0, Math.round(note.durationDiv * msPerDivision)),
            ]);
          });
        });

        melody.sort((a, b) => a[0] - b[0]);
        const durationMs = melody.length ? melody[melody.length - 1][0] + Math.max(0, melody[melody.length - 1][1]) : 0;
        return {
          bpm: parsed.tempo,
          durationMs,
          melody,
        };
      }

      function getTrackTime(state) {
        if (state.preRollStartPerf) {
          return performance.now() - state.preRollStartPerf - state.preRollMs;
        }
        return state.audio ? state.audio.currentTime * 1000 : 0;
      }

      function pickResponsivePoint(state, rect, exclude = [], note = null) {
        const activePoints = state.chart
          .filter((entry) => entry.element && !entry.hit && !entry.missed)
          .flatMap((entry) => {
            const points = [{ x: entry.x, y: entry.y }];
            if (entry.type === "drag") points.push({ x: entry.endX, y: entry.endY });
            return points;
          });
        const recentPointIndexes = state.freeformRecentPointIndexes || [];
        const minDistancePx = Math.max(72, Math.min(rect.width, rect.height) * 0.15);
        let best = null;
        let bestScore = -Infinity;

        MUSIC_GAME_LANES.forEach(([x, y], idx) => {
          const candidate = { x, y };
          if (state.running && candidate.x > 0.68 && candidate.y < 0.34) return;
          if (exclude.some((point) => Math.hypot((candidate.x - point.x) * rect.width, (candidate.y - point.y) * rect.height) < minDistancePx)) return;
          const minActive = activePoints.length
            ? Math.min(...activePoints.map((point) => Math.hypot((candidate.x - point.x) * rect.width, (candidate.y - point.y) * rect.height)))
            : minDistancePx * 1.4;
          const centerBias = 16 - Math.abs(candidate.x - 0.5) * rect.width * 0.08;
          const recentPenalty = recentPointIndexes.includes(idx) ? 160 - recentPointIndexes.indexOf(idx) * 18 : 0;
          const wave = Math.sin((Number(note?.timeMs || idx) * 0.017) + idx * 1.91) * 22;
          const score = minActive + centerBias + wave - recentPenalty;
          if (score > bestScore) {
            best = { ...candidate, _index: idx };
            bestScore = score;
          }
        });

        return best || { x: 0.5, y: 0.5, _index: -1 };
      }

      function createParticle(content, palette, options = {}) {
        const particle = document.createElement("span");
        const size = options.size ?? 18 + Math.random() * 38;
        particle.className = "secret-code-particle";
        particle.textContent = content;
        particle.style.setProperty("--x", options.x ?? `${18 + Math.random() * 64}%`);
        particle.style.setProperty("--y", options.y ?? `${18 + Math.random() * 58}%`);
        particle.style.setProperty("--size", `${size}px`);
        particle.style.setProperty("--dx", options.dx ?? "0px");
        particle.style.setProperty("--dy", options.dy ?? "0px");
        particle.style.setProperty("--rot", options.rot ?? `${-180 + Math.random() * 360}deg`);
        particle.style.setProperty("--dur", options.dur ?? `${1600 + Math.random() * 1100}ms`);
        particle.style.setProperty("--delay", options.delay ?? "0ms");
        particle.style.setProperty("--particle-core", options.core ?? `${palette[Math.floor(Math.random() * palette.length)]}cc`);
        if (options.opacity) particle.style.setProperty("--opacity-peak", options.opacity);
        if (options.className) particle.classList.add(...String(options.className).split(/\s+/).filter(Boolean));
        overlay.appendChild(particle);
      }

      function launchMidnight() {
        const palette = ["#173a9b", "#214fc2", "#8f6cff"];
        applyPalette(palette);
        overlay.classList.add("effect-midnight");

        const burstCenters = [
          [18, 24], [78, 22], [32, 56], [70, 60], [48, 34], [54, 72]
        ];
        burstCenters.forEach(([cx, cy], centerIndex) => {
          for (let i = 0; i < 8; i += 1) {
            const angle = (Math.PI * 2 * i) / 8 + centerIndex * 0.22;
            const distance = 48 + (i % 3) * 22;
            createParticle(glyphs[(i + centerIndex) % glyphs.length], palette, {
              className: "phase-burst",
              x: `${cx}%`,
              y: `${cy}%`,
              size: 16 + (i % 4) * 5,
              dx: `${Math.cos(angle) * distance}px`,
              dy: `${Math.sin(angle) * distance}px`,
              dur: "1700ms",
              delay: `${centerIndex * 180 + i * 34}ms`,
              rot: `${i * 28}deg`,
              core: `${palette[(i + centerIndex) % palette.length]}dd`,
              opacity: "0.96",
            });
          }
        });

        const spiralCount = 34;
        for (let i = 0; i < spiralCount; i += 1) {
          const progress = i / spiralCount;
          const angle = progress * Math.PI * 2 * 3.6;
          const radius = 10 + progress * 26;
          createParticle(glyphs[i % glyphs.length], palette, {
            className: "phase-spiral",
            x: `${50 + Math.cos(angle) * radius}%`,
            y: `${46 + Math.sin(angle) * (radius * 0.72)}%`,
            size: 15 + (i % 4) * 4,
            dx: `${Math.cos(angle + Math.PI / 4) * 22}px`,
            dy: `${Math.sin(angle + Math.PI / 4) * 22}px`,
            dur: "2600ms",
            delay: `${1800 + i * 48}ms`,
            rot: `${angle * 42}deg`,
            core: `${palette[(i + 1) % palette.length]}cc`,
            opacity: "0.95",
          });
        }

        const heartPalette = ["#ff7bc5", "#8f6cff", "#5fb8ff"];
        const heartCount = 34;
        for (let i = 0; i < heartCount; i += 1) {
          const t = (Math.PI * 2 * i) / heartCount;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          createParticle("✦", heartPalette, {
            className: "phase-heart",
            x: `${50 + hx * 1.15}%`,
            y: `${49 - hy * 1.08}%`,
            size: 14 + (i % 3) * 4,
            dx: `${hx * 2.6}px`,
            dy: `${-hy * 1.6}px`,
            dur: "2300ms",
            delay: `${4000 + i * 42}ms`,
            rot: `${i * 18}deg`,
            core: `${heartPalette[i % heartPalette.length]}ee`,
            opacity: "1",
          });
        }
      }

      function launchFiu() {
        const palette = ["#ffffff", "#ffe182", "#9fd6ff"];
        applyPalette(palette);
        overlay.classList.add("effect-fiu");

        for (let i = 0; i < 54; i += 1) {
          createParticle("FIU", palette, {
            className: "phase-fiu",
            x: `${4 + Math.random() * 92}%`,
            y: `${6 + Math.random() * 84}%`,
            size: 18 + Math.random() * 24,
            dx: `${-28 + Math.random() * 56}px`,
            dy: `${-24 + Math.random() * 48}px`,
            dur: `${1800 + Math.random() * 1400}ms`,
            delay: `${Math.random() * 700}ms`,
            rot: `${-18 + Math.random() * 36}deg`,
            core: `${palette[i % palette.length]}cc`,
            opacity: "1",
          });
        }
      }

      function launchSpiretz() {
        const palette = ["#56d6ff", "#a36bff", "#ffd67a"];
        applyPalette(palette);
        overlay.classList.add("effect-spiretz");

        const spiralCount = 42;
        for (let i = 0; i < spiralCount; i += 1) {
          const progress = i / spiralCount;
          const angle = progress * Math.PI * 2 * 4.1;
          const radius = 8 + progress * 32;
          createParticle(glyphs[i % glyphs.length], palette, {
            className: "phase-spiretz-spiral",
            x: `${50 + Math.cos(angle) * radius}%`,
            y: `${48 + Math.sin(angle) * (radius * 0.78)}%`,
            size: 15 + (i % 4) * 4,
            dx: `${Math.cos(angle + Math.PI / 3) * 30}px`,
            dy: `${Math.sin(angle + Math.PI / 3) * 30}px`,
            dur: "2800ms",
            delay: `${i * 42}ms`,
            rot: `${angle * 36}deg`,
            core: `${palette[i % palette.length]}dd`,
            opacity: "0.96",
          });
        }

        const burstCount = 22;
        for (let i = 0; i < burstCount; i += 1) {
          const angle = (Math.PI * 2 * i) / burstCount;
          const distance = 84 + (i % 4) * 18;
          createParticle(glyphs[(i + 2) % glyphs.length], palette, {
            className: "phase-spiretz-burst",
            x: "50%",
            y: "50%",
            size: 18 + (i % 3) * 6,
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            dur: "1700ms",
            delay: `${2200 + i * 36}ms`,
            rot: `${i * 22}deg`,
            core: `${palette[(i + 1) % palette.length]}ee`,
            opacity: "1",
          });
        }

        const word = document.createElement("div");
        word.className = "secret-spiretz-word";
        word.textContent = "spiretz";
        overlay.appendChild(word);
      }

      function launchFiush() {
        const palette = ["#7de8ff", "#9ad0ff", "#ffffff"];
        applyPalette(palette);
        overlay.classList.add("effect-fiush");

        const words = ["fiu", "fiush", "fiu", "fiush", "fiu"];
        for (let i = 0; i < 22; i += 1) {
          const word = words[i % words.length];
          createParticle(word, palette, {
            className: "phase-fiush",
            x: `${-10 + Math.random() * 20}%`,
            y: `${10 + Math.random() * 78}%`,
            size: 18 + Math.random() * 18,
            dx: `${94 + Math.random() * 28}vw`,
            dy: `${-18 + Math.random() * 36}px`,
            dur: `${4200 + Math.random() * 1800}ms`,
            delay: `${i * 180}ms`,
            rot: `${-8 + Math.random() * 16}deg`,
            core: `${palette[i % palette.length]}bb`,
            opacity: "1",
          });
        }
      }

      function launchHearts() {
        const palette = ["#ff7bc5", "#ff9fd6", "#ffd1ea"];
        applyPalette(palette);
        overlay.classList.add("effect-hearts");

        for (let i = 0; i < 34; i += 1) {
          createParticle("❤", palette, {
            className: "phase-heartfield",
            x: `${6 + Math.random() * 88}%`,
            y: `${8 + Math.random() * 82}%`,
            size: 18 + Math.random() * 26,
            dx: `${-18 + Math.random() * 36}px`,
            dy: `${-16 + Math.random() * 32}px`,
            dur: `${1800 + Math.random() * 1400}ms`,
            delay: `${Math.random() * 700}ms`,
            rot: `${-18 + Math.random() * 36}deg`,
            core: `${palette[i % palette.length]}cc`,
            opacity: "1",
          });
        }

        const centerCount = 18;
        for (let i = 0; i < centerCount; i += 1) {
          const angle = (Math.PI * 2 * i) / centerCount;
          const distance = 56 + (i % 3) * 18;
          createParticle("❤", palette, {
            className: "phase-heartburst",
            x: "50%",
            y: "52%",
            size: 22 + (i % 3) * 7,
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            dur: "1700ms",
            delay: `${950 + i * 28}ms`,
            rot: `${i * 20}deg`,
            core: `${palette[(i + 1) % palette.length]}ee`,
            opacity: "1",
          });
        }
      }

      function launchPolarbear() {
        const palette = ["#dff7ff", "#9fe9ff", "#bcd7ff"];
        applyPalette(palette);
        overlay.classList.add("effect-polarbear");

        for (let i = 0; i < 28; i += 1) {
          createParticle("polar bear", palette, {
            className: "phase-polarbear-word",
            x: `${4 + Math.random() * 92}%`,
            y: `${8 + Math.random() * 82}%`,
            size: 16 + Math.random() * 18,
            dx: `${-18 + Math.random() * 36}px`,
            dy: `${-16 + Math.random() * 32}px`,
            dur: `${2200 + Math.random() * 1600}ms`,
            delay: `${Math.random() * 900}ms`,
            rot: `${-10 + Math.random() * 20}deg`,
            core: `${palette[i % palette.length]}bb`,
            opacity: "1",
          });
        }

        const flakes = ["❄", "✦", "❅", "✧"];
        for (let i = 0; i < 42; i += 1) {
          createParticle(flakes[i % flakes.length], palette, {
            className: "phase-polarbear-snow",
            x: `${4 + Math.random() * 92}%`,
            y: `${-8 - Math.random() * 18}%`,
            size: 14 + Math.random() * 18,
            dx: `${-18 + Math.random() * 36}px`,
            dy: `${96 + Math.random() * 24}vh`,
            dur: `${2800 + Math.random() * 1800}ms`,
            delay: `${Math.random() * 1200}ms`,
            rot: `${Math.random() * 360}deg`,
            core: `${palette[(i + 1) % palette.length]}cc`,
            opacity: "1",
          });
        }
      }

      function launchMama() {
        const palette = getThemePalette();
        applyPalette(palette);
        overlay.classList.add("effect-mama");

        const greeting = document.createElement("div");
        greeting.className = "secret-mama-message greeting";
        greeting.textContent = "happy mother's day";
        overlay.appendChild(greeting);

        const closing = document.createElement("div");
        closing.className = "secret-mama-message closing";
        closing.textContent = "love you mom";
        overlay.appendChild(closing);

        const heartPalette = [palette[0], palette[1], palette[2]];
        for (let i = 0; i < 18; i += 1) {
          const angle = (Math.PI * 2 * i) / 18;
          const distance = 58 + (i % 3) * 14;
          createParticle("❤", heartPalette, {
            className: "phase-mama-heart",
            x: "50%",
            y: "52%",
            size: 18 + (i % 3) * 6,
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            dur: "2200ms",
            delay: `${500 + i * 34}ms`,
            rot: `${i * 16}deg`,
            core: `${heartPalette[i % heartPalette.length]}dd`,
            opacity: "1",
          });
        }
      }

      function launchBurst(palette) {
        overlay.classList.add("effect-burst");
        const particleCount = 34;
        for (let i = 0; i < particleCount; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 90 + Math.random() * 320;
          createParticle(glyphs[Math.floor(Math.random() * glyphs.length)], palette, {
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            core: `${palette[i % palette.length]}cc`,
          });
        }
      }

      function launchRain(palette) {
        overlay.classList.add("effect-rain");
        for (let i = 0; i < 40; i += 1) {
          createParticle("8", palette, {
            x: `${4 + Math.random() * 92}%`,
            y: `${-8 - Math.random() * 20}%`,
            size: 20 + Math.random() * 28,
            dx: `${-10 + Math.random() * 20}px`,
            dy: `${110 + Math.random() * 25}vh`,
            dur: `${1700 + Math.random() * 1200}ms`,
            delay: `${Math.random() * 240}ms`,
            rot: "0deg",
            core: `${palette[i % palette.length]}99`,
            opacity: "0.9",
          });
        }

        const fiuBursts = ["F", "I", "U", "FIU"];
        fiuBursts.forEach((text, index) => {
          const angle = -Math.PI / 3 + index * (Math.PI / 4);
          const distance = text === "FIU" ? 0 : 90 + index * 24;
          createParticle(text, palette, {
            x: "50%",
            y: "54%",
            size: text === "FIU" ? 72 : 40,
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance - (text === "FIU" ? 40 : 0)}px`,
            dur: text === "FIU" ? "1500ms" : "1650ms",
            delay: `${900 + index * 90}ms`,
            rot: `${-12 + index * 8}deg`,
            core: `${palette[(index + 1) % palette.length]}dd`,
            opacity: "1",
          });
        });
      }

      function launchHalo(palette) {
        overlay.classList.add("effect-halo");
        const centerX = 50;
        const centerY = 46;
        const rings = [16, 24, 32];
        rings.forEach((radius, ringIndex) => {
          for (let i = 0; i < 12; i += 1) {
            const angle = (Math.PI * 2 * i) / 12;
            createParticle(glyphs[(i + ringIndex) % glyphs.length], palette, {
              x: `${centerX + Math.cos(angle) * radius}%`,
              y: `${centerY + Math.sin(angle) * (radius * 0.8)}%`,
              size: 18 + ringIndex * 8,
              dx: `${Math.cos(angle) * 26}px`,
              dy: `${Math.sin(angle) * 26}px`,
              dur: `${2200 + ringIndex * 260}ms`,
              delay: `${i * 45}ms`,
              core: `${palette[(i + ringIndex) % palette.length]}bb`,
            });
          }
        });
      }

      function launchViolet() {
        const palette = ["#8f5bff", "#c57cff", "#f2b8ff"];
        applyPalette(palette);
        overlay.classList.add("effect-violet");

        const centerX = 50;
        const centerY = 50;
        const spiralTurns = 4.5;
        const particleCount = 54;

        for (let i = 0; i < particleCount; i += 1) {
          const progress = i / particleCount;
          const angle = progress * Math.PI * 2 * spiralTurns;
          const radius = 6 + progress * 34;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * (radius * 0.72);
          const drift = 28 + progress * 72;
          createParticle(glyphs[i % glyphs.length], palette, {
            x: `${x}%`,
            y: `${y}%`,
            size: 18 + (i % 5) * 6,
            dx: `${Math.cos(angle + Math.PI / 6) * drift}px`,
            dy: `${Math.sin(angle + Math.PI / 6) * drift}px`,
            dur: `${4200 + progress * 1800}ms`,
            delay: `${i * 55}ms`,
            rot: `${angle * 36}deg`,
            core: `${palette[i % palette.length]}cc`,
            opacity: "0.95",
          });
        }

        const star = document.createElement("div");
        star.className = "secret-star-draw";
        star.innerHTML = `
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <path d="M60 13 L99 82 L21 82 Z"></path>
            <path d="M60 107 L21 38 L99 38 Z"></path>
          </svg>
        `;
        overlay.appendChild(star);
      }

      function createLaserBeam(options = {}) {
        const beam = document.createElement("span");
        beam.className = options.final ? "secret-laser-beam final" : "secret-laser-beam";
        beam.style.setProperty("--x", options.x ?? "50%");
        beam.style.setProperty("--y", options.y ?? "50%");
        beam.style.setProperty("--length", options.length ?? "42vw");
        beam.style.setProperty("--thickness", options.thickness ?? "8px");
        beam.style.setProperty("--angle", options.angle ?? "0deg");
        beam.style.setProperty("--delay", options.delay ?? "0ms");
        beam.style.setProperty("--dur", options.dur ?? "1200ms");
        beam.style.setProperty("--beam-color", options.color ?? "#ff4b4b");
        beam.style.setProperty("--beam-glow", options.glow ?? "rgba(255, 82, 82, 0.8)");
        beam.style.setProperty("--mid-scale", options.midScale ?? "1");
        beam.style.setProperty("--end-scale", options.endScale ?? "1");
        beam.style.setProperty("--drift-x", options.driftX ?? "0px");
        beam.style.setProperty("--drift-y", options.driftY ?? "0px");
        overlay.appendChild(beam);
      }

      function launchLaser() {
        const palette = ["#ff3a3a", "#ff6b6b", "#ffd0d0"];
        applyPalette(palette);
        overlay.classList.add("effect-laser");

        const sweeps = [
          { x: "16%", y: "20%", length: "52vw", thickness: "7px", angle: "18deg", delay: "0ms", dur: "1500ms", midScale: "1.2", endScale: "0.9", driftX: "24px", driftY: "-8px" },
          { x: "82%", y: "26%", length: "58vw", thickness: "10px", angle: "142deg", delay: "520ms", dur: "1600ms", midScale: "1.05", endScale: "1.1", driftX: "-26px", driftY: "18px" },
          { x: "24%", y: "76%", length: "48vw", thickness: "14px", angle: "-22deg", delay: "1160ms", dur: "1450ms", midScale: "0.72", endScale: "1.18", driftX: "18px", driftY: "-22px" },
          { x: "76%", y: "68%", length: "62vw", thickness: "6px", angle: "-132deg", delay: "1680ms", dur: "1700ms", midScale: "1.28", endScale: "0.76", driftX: "-16px", driftY: "-20px" },
          { x: "50%", y: "46%", length: "66vw", thickness: "18px", angle: "90deg", delay: "2380ms", dur: "1550ms", midScale: "0.54", endScale: "1.12", driftX: "0px", driftY: "14px" },
        ];

        sweeps.forEach((sweep) => createLaserBeam(sweep));

        const finalCount = 10;
        for (let i = 0; i < finalCount; i += 1) {
          createLaserBeam({
            final: true,
            x: "50%",
            y: "50%",
            length: "36vw",
            thickness: i % 2 === 0 ? "8px" : "5px",
            angle: `${(360 / finalCount) * i}deg`,
            delay: `${3900 + i * 55}ms`,
            dur: "2200ms",
            midScale: "0.15",
            endScale: "1.1",
            driftX: "0px",
            driftY: "0px",
            color: i % 2 === 0 ? "#ff3a3a" : "#ff8f8f",
            glow: i % 2 === 0 ? "rgba(255, 58, 58, 0.9)" : "rgba(255, 143, 143, 0.85)",
          });
        }
      }

      function createThunderStrike(options = {}) {
        const strike = document.createElement("span");
        strike.className = "secret-thunder-strike";
        strike.style.setProperty("--x", options.x ?? "50%");
        strike.style.setProperty("--y", options.y ?? "14%");
        strike.style.setProperty("--height", options.height ?? "54vh");
        strike.style.setProperty("--angle", options.angle ?? "0deg");
        strike.style.setProperty("--delay", options.delay ?? "0ms");
        strike.style.setProperty("--dur", options.dur ?? "1200ms");
        strike.style.setProperty("--dx", options.dx ?? "0px");
        strike.style.setProperty("--dy", options.dy ?? "0px");
        overlay.appendChild(strike);
      }

      function launchThunder() {
        const palette = ["#f6c44e", "#ffe38a", "#fff4bf"];
        applyPalette(palette);
        overlay.classList.add("effect-thunder");

        [
          { x: "18%", y: "10%", height: "44vh", angle: "-12deg", delay: "260ms", dur: "1500ms", dx: "-10px", dy: "18px" },
          { x: "78%", y: "8%", height: "52vh", angle: "10deg", delay: "980ms", dur: "1600ms", dx: "14px", dy: "12px" },
          { x: "34%", y: "16%", height: "48vh", angle: "-4deg", delay: "1780ms", dur: "1500ms", dx: "8px", dy: "20px" },
          { x: "66%", y: "14%", height: "42vh", angle: "7deg", delay: "2500ms", dur: "1450ms", dx: "-12px", dy: "16px" },
        ].forEach(createThunderStrike);

        const bolt = document.createElement("div");
        bolt.className = "secret-thunder-bolt";
        bolt.innerHTML = `
          <svg viewBox="0 0 140 190" aria-hidden="true">
            <path pathLength="100" d="M86 10 L42 92 H72 L56 180 L108 86 H78 L94 10 Z"></path>
          </svg>
        `;
        overlay.appendChild(bolt);

        const spark = document.createElement("span");
        spark.className = "secret-thunder-spark";
        overlay.appendChild(spark);

        const burstAngles = 14;
        for (let i = 0; i < burstAngles; i += 1) {
          const angle = (Math.PI * 2 * i) / burstAngles;
          const distance = 56 + (i % 3) * 16;
          createParticle("✦", palette, {
            x: "50%",
            y: "56%",
            size: 18 + (i % 4) * 5,
            dx: `${Math.cos(angle) * distance}px`,
            dy: `${Math.sin(angle) * distance}px`,
            dur: "1450ms",
            delay: `${6100 + i * 30}ms`,
            rot: `${i * 22}deg`,
            core: `${palette[i % palette.length]}ee`,
            opacity: "1",
          });
        }
      }

      function launchElements() {
        const palette = ["#ff9d2e", "#7f5cff", "#4cb8ff"];
        applyPalette(palette);
        overlay.classList.add("effect-elements");

        const fire = document.createElement("div");
        fire.className = "secret-element-stream fire";
        overlay.appendChild(fire);

        const water = document.createElement("div");
        water.className = "secret-element-stream water";
        overlay.appendChild(water);

        const burst = document.createElement("div");
        burst.className = "secret-element-core";
        overlay.appendChild(burst);

        const tide = document.createElement("div");
        tide.className = "secret-element-tide";
        overlay.appendChild(tide);

        const blasts = [
          { cls: "purple", dx: -130, dy: -92, delay: 2000 },
          { cls: "blue", dx: 140, dy: -68, delay: 2140 },
          { cls: "pink", dx: 0, dy: -148, delay: 2280 },
        ];

        blasts.forEach(({ cls, dx, dy, delay }) => {
          const blast = document.createElement("span");
          blast.className = `secret-element-burst ${cls}`;
          blast.style.setProperty("--dx", `${dx}px`);
          blast.style.setProperty("--dy", `${dy}px`);
          blast.style.setProperty("--delay", `${delay}ms`);
          overlay.appendChild(blast);
        });

        const orangeWaveCount = 16;
        for (let i = 0; i < orangeWaveCount; i += 1) {
          const angle = (Math.PI * 2 * i) / orangeWaveCount;
          createParticle("◌", ["#ffb347", "#ff944d", "#ffd38a"], {
            x: "50%",
            y: "56%",
            size: 18 + (i % 4) * 6,
            dx: `${Math.cos(angle) * (74 + (i % 3) * 22)}px`,
            dy: `${Math.sin(angle) * (42 + (i % 2) * 16)}px`,
            dur: "1700ms",
            delay: `${1880 + i * 34}ms`,
            rot: `${i * 18}deg`,
            core: "rgba(255, 170, 64, 0.92)",
            opacity: "0.95",
          });
        }
      }

      function launchIceworld() {
        const palette = ["#9fe9ff", "#bcd7ff", "#f1fbff"];
        applyPalette(palette);
        overlay.classList.add("effect-iceworld");

        const world = document.createElement("div");
        world.className = "secret-iceworld-field";
        overlay.appendChild(world);

        const diamondCount = 18;
        for (let i = 0; i < diamondCount; i += 1) {
          const diamond = document.createElement("span");
          diamond.className = "secret-ice-diamond";
          diamond.style.setProperty("--x", `${8 + Math.random() * 84}%`);
          diamond.style.setProperty("--y", `${10 + Math.random() * 58}%`);
          diamond.style.setProperty("--delay", `${220 + i * 110}ms`);
          diamond.style.setProperty("--dur", `${1200 + Math.random() * 800}ms`);
          diamond.style.setProperty("--size", `${16 + Math.random() * 26}px`);
          overlay.appendChild(diamond);
        }

        const flash = document.createElement("div");
        flash.className = "secret-ice-flash";
        overlay.appendChild(flash);

        const tree = document.createElement("div");
        tree.className = "secret-ice-tree";
        tree.innerHTML = `
          <svg viewBox="0 0 180 260" aria-hidden="true">
            <path pathLength="100" d="M92 18 L122 72 L106 72 L140 124 L118 124 L154 180 L98 180 L98 232 L82 232 L82 180 L28 180 L64 124 L42 124 L76 72 L58 72 Z"></path>
            <path pathLength="100" d="M86 180 L94 180 L94 246 L86 246 Z"></path>
          </svg>
        `;
        overlay.appendChild(tree);

        const drawDiamond = document.createElement("div");
        drawDiamond.className = "secret-diamond-draw";
        drawDiamond.innerHTML = `
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <path pathLength="100" d="M70 12 L122 70 L70 128 L18 70 Z"></path>
          </svg>
        `;
        overlay.appendChild(drawDiamond);

        const littleCount = 12;
        for (let i = 0; i < littleCount; i += 1) {
          const angle = (Math.PI * 2 * i) / littleCount;
          const little = document.createElement("span");
          little.className = "secret-little-diamond";
          little.style.setProperty("--dx", `${Math.cos(angle) * (44 + (i % 3) * 18)}px`);
          little.style.setProperty("--dy", `${Math.sin(angle) * (44 + (i % 2) * 22)}px`);
          little.style.setProperty("--delay", `${7000 + i * 40}ms`);
          little.style.setProperty("--size", `${10 + (i % 3) * 4}px`);
          overlay.appendChild(little);
        }
      }

      function parseMusicXmlChart(xmlText, song) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("MusicXML parse failed");

        const part = doc.querySelector('part[id="P1"]') || doc.querySelector("part");
        if (!part) throw new Error("No playable part found");

        const tempo = Number(doc.querySelector("sound[tempo]")?.getAttribute("tempo") || song.bpm || 87);
        let divisions = 4;
        let cursor = 0;
        let lastNonChordStart = 0;
        const noteEvents = [];

        Array.from(part.querySelectorAll(":scope > measure")).forEach((measure) => {
          Array.from(measure.children).forEach((child) => {
            if (child.tagName === "attributes") {
              const divisionsNode = child.querySelector("divisions");
              if (divisionsNode) divisions = Number(divisionsNode.textContent) || divisions;
              return;
            }
            if (child.tagName === "backup") {
              cursor -= Number(child.querySelector("duration")?.textContent || 0);
              return;
            }
            if (child.tagName === "forward") {
              cursor += Number(child.querySelector("duration")?.textContent || 0);
              return;
            }
            if (child.tagName !== "note") return;

            const duration = Number(child.querySelector("duration")?.textContent || 0);
            const isChord = Array.from(child.children).some((node) => node.tagName === "chord");
            const isRest = Array.from(child.children).some((node) => node.tagName === "rest");
            const pitch = child.querySelector("pitch");
            const start = isChord ? lastNonChordStart : cursor;

            if (!isRest && pitch) {
              const step = pitch.querySelector("step")?.textContent;
              const octave = pitch.querySelector("octave")?.textContent;
              const alter = pitch.querySelector("alter")?.textContent || "0";
              if (step && octave) {
                noteEvents.push({
                  startDiv: start,
                  durationDiv: duration,
                  midi: mapPitchToMidi(step, alter, octave),
                });
              }
            }

            if (!isChord) {
              lastNonChordStart = start;
              cursor += duration;
            }
          });
        });

        const msPerDivision = (60000 / tempo) / divisions;
        const grouped = new Map();
        noteEvents.forEach((note) => {
          const key = String(note.startDiv);
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push(note);
        });

        const chart = [];
        Array.from(grouped.entries())
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .forEach(([startDivKey, notesAtTime], groupIndex) => {
            const lead = notesAtTime.reduce((best, note) => (note.midi > best.midi ? note : best), notesAtTime[0]);
            const startDiv = Number(startDivKey);
            const startMs = startDiv * msPerDivision;
            const durationMs = Math.max(240, lead.durationDiv * msPerDivision);
            const isDrag = lead.durationDiv >= Math.max(3, Math.round(divisions * 0.75));
            const seed = lead.midi * 0.73 + startDiv * 0.31 + groupIndex * 0.17;
            const startPos = createSeededPosition(seed, 0.6, 1.4);

            if (!isDrag) {
              chart.push({
                id: `tap-${groupIndex}`,
                type: "tap",
                timeMs: startMs,
                x: startPos.x,
                y: startPos.y,
              });
              return;
            }

            const angle = Math.sin(seed * 1.33) * Math.PI * 1.8;
            const radius = clamp(0.16 + (lead.durationDiv / (divisions * 3.2)), 0.14, 0.22);
            const endPos = {
              x: clamp(startPos.x + Math.cos(angle) * radius, 0.14, 0.86),
              y: clamp(startPos.y + Math.sin(angle) * radius * 0.72, 0.16, 0.84),
            };

            chart.push({
              id: `drag-${groupIndex}`,
              type: "drag",
              timeMs: startMs,
              endTimeMs: startMs + durationMs,
              x: startPos.x,
              y: startPos.y,
              endX: endPos.x,
              endY: endPos.y,
              accent: groupIndex % 2 === 0 ? "green" : "purple",
            });
          });

        const durationMs = chart.length ? Math.max(...chart.map((note) => note.endTimeMs || note.timeMs)) : 0;
        return { bpm: tempo, chart, durationMs };
      }

      async function loadSongChart(songKey, mode = "freeform", difficulty = "normal") {
        const cacheKey = `${songKey}:${mode}:${difficulty}`;
        if (musicChartCache.has(cacheKey)) return musicChartCache.get(cacheKey);
        const song = MUSIC_SONGS[songKey];
        if (!song) throw new Error("Unknown song");
        const builtin = mode === "lanes"
          ? getBuiltinLaneChart(songKey, difficulty)
          : (materializeBuiltinMusicChart(songKey, difficulty) || BUILTIN_MUSIC_CHARTS[songKey]);
        if (builtin) {
          musicChartCache.set(cacheKey, builtin);
          return builtin;
        }
        if (window.location.protocol === "file:") {
          throw new Error("MusicXML fetch is blocked from file://. Open the site through a local server.");
        }
        const xmlText = await fetch(song.chartSrc).then((response) => {
          if (!response.ok) throw new Error("Unable to load chart");
          return response.text();
        });
        const parsed = parseMusicXmlChart(xmlText, song);
        musicChartCache.set(cacheKey, parsed);
        return parsed;
      }

      function prepareSongData(songKey, mode, difficulty, loaded) {
        const preparedKey = `${songKey}:${mode}:${difficulty}`;
        const chart = loaded.chart.map((note) => ({ ...note }));
        const prepared = {
          ...loaded,
          chart,
          maxPossibleScore: chart.reduce((sum, note) => sum + getPerfectScoreForNote(note, mode), 0),
        };
        preparedSongDataCache.set(preparedKey, prepared);
        return prepared;
      }

      function preloadSongAudio(songKey) {
        if (musicAudioCache.has(songKey)) return musicAudioCache.get(songKey).promise;
        const song = MUSIC_SONGS[songKey];
        if (!song) return Promise.reject(new Error("Unknown song"));
        const audio = new Audio();
        const promise = new Promise((resolve, reject) => {
          let settled = false;
          function cleanup() {
            audio.removeEventListener("canplaythrough", onReady);
            audio.removeEventListener("loadeddata", onReady);
            audio.removeEventListener("error", onError);
          }
          function onReady() {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(song.audioSrc);
          }
          function onError() {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error("Unable to preload audio"));
          }
          audio.preload = "auto";
          audio.src = song.audioSrc;
          audio.addEventListener("canplaythrough", onReady, { once: true });
          audio.addEventListener("loadeddata", onReady, { once: true });
          audio.addEventListener("error", onError, { once: true });
          audio.load();
        });
        musicAudioCache.set(songKey, { promise, audio });
        return promise;
      }

      async function preloadMusicGameData(state) {
        if (state.downloadPromise) return state.downloadPromise;
        state.statusLabel.textContent = IS_ZH ? "下载数据中…" : "Downloading data...";
        const tasks = [
          loadSongChart("fiu", "freeform", "normal").then((loaded) => prepareSongData("fiu", "freeform", "normal", loaded)),
          loadSongChart("fiu", "freeform", "hard").then((loaded) => prepareSongData("fiu", "freeform", "hard", loaded)),
          loadSongChart("fiu", "lanes", "normal").then((loaded) => prepareSongData("fiu", "lanes", "normal", loaded)),
          loadSongChart("fiu", "lanes", "hard").then((loaded) => prepareSongData("fiu", "lanes", "hard", loaded)),
          loadSongChart("palace", "freeform", "normal").then((loaded) => prepareSongData("palace", "freeform", "normal", loaded)),
          loadSongChart("palace", "freeform", "hard").then((loaded) => prepareSongData("palace", "freeform", "hard", loaded)),
          loadSongChart("palace", "lanes", "normal").then((loaded) => prepareSongData("palace", "lanes", "normal", loaded)),
          loadSongChart("palace", "lanes", "hard").then((loaded) => prepareSongData("palace", "lanes", "hard", loaded)),
          loadSongChart("lafantasia", "freeform", "normal").then((loaded) => prepareSongData("lafantasia", "freeform", "normal", loaded)),
          loadSongChart("lafantasia", "freeform", "hard").then((loaded) => prepareSongData("lafantasia", "freeform", "hard", loaded)),
          loadSongChart("lafantasia", "lanes", "normal").then((loaded) => prepareSongData("lafantasia", "lanes", "normal", loaded)),
          loadSongChart("lafantasia", "lanes", "hard").then((loaded) => prepareSongData("lafantasia", "lanes", "hard", loaded)),
          loadSongChart("recordplayer", "freeform", "normal").then((loaded) => prepareSongData("recordplayer", "freeform", "normal", loaded)),
          loadSongChart("recordplayer", "freeform", "hard").then((loaded) => prepareSongData("recordplayer", "freeform", "hard", loaded)),
          loadSongChart("recordplayer", "lanes", "normal").then((loaded) => prepareSongData("recordplayer", "lanes", "normal", loaded)),
          loadSongChart("recordplayer", "lanes", "hard").then((loaded) => prepareSongData("recordplayer", "lanes", "hard", loaded)),
          loadSongChart("stallion", "freeform", "normal").then((loaded) => prepareSongData("stallion", "freeform", "normal", loaded)),
          loadSongChart("stallion", "freeform", "hard").then((loaded) => prepareSongData("stallion", "freeform", "hard", loaded)),
          loadSongChart("stallion", "lanes", "normal").then((loaded) => prepareSongData("stallion", "lanes", "normal", loaded)),
          loadSongChart("stallion", "lanes", "hard").then((loaded) => prepareSongData("stallion", "lanes", "hard", loaded)),
          preloadSongAudio("fiu"),
          preloadSongAudio("palace"),
          preloadSongAudio("lafantasia"),
          preloadSongAudio("recordplayer"),
          preloadSongAudio("stallion"),
        ];
        state.downloadPromise = Promise.allSettled(tasks)
          .then((results) => {
            const failed = results.filter((result) => result.status === "rejected");
            state.assetsDownloaded = true;
            state.statusLabel.textContent = failed.length
              ? (IS_ZH ? "数据已准备，个别文件将稍后载入" : "Data ready. Some files will finish loading later.")
              : (IS_ZH ? "数据已下载" : "Data downloaded");
          })
          .finally(() => {
            state.downloadPromise = null;
          });
        return state.downloadPromise;
      }

      function showMusicGameCountdown(state) {
        return new Promise((resolve) => {
          const countdown = document.createElement("div");
          countdown.className = "music-game-countdown";
          const label = document.createElement("span");
          label.className = "music-game-countdown-value";
          countdown.appendChild(label);
          state.playfield.appendChild(countdown);

          const steps = ["3", "2", "1", IS_ZH ? "开始" : "GO"];
          function runStep(index) {
            if (index >= steps.length) {
              countdown.remove();
              resolve();
              return;
            }
            label.textContent = steps[index];
            countdown.classList.remove("is-pulse");
            void countdown.offsetWidth;
            countdown.classList.add("is-pulse");
            const timeoutId = setTimeout(() => runStep(index + 1), index === steps.length - 1 ? 420 : 560);
            state.timeouts.push(timeoutId);
          }
          runStep(0);
        });
      }

      function clonePreloadedAudio(songKey) {
        const cached = musicAudioCache.get(songKey);
        const audio = cached?.audio ? cached.audio.cloneNode(true) : new Audio(MUSIC_SONGS[songKey]?.audioSrc || "");
        audio.preload = "auto";
        audio.volume = 1;
        return audio;
      }

      function teardownMusicGame() {
        if (!musicGameState) return;
        musicGameState.running = false;
        if (musicGameState.rafId) cancelAnimationFrame(musicGameState.rafId);
        musicGameState.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        musicGameState.audio?.pause();
        if (musicGameState.audio) {
          musicGameState.audio.currentTime = 0;
          musicGameState.audio.src = "";
        }
        musicGameLayer.replaceChildren();
        musicGameLayer.classList.remove("active", "is-playing", "is-song-list-open", "is-paused");
        musicGameState = null;
      }

      function pauseMusicGame(state) {
        if (!state || state.paused || !state.audio || state.preRollStartPerf) return;
        state.paused = true;
        state.running = false;
        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.rafId = 0;
        state.audio.pause();
        state.statusLabel.textContent = IS_ZH ? "已暂停" : "Paused";
        state.pauseOverlay?.classList.add("active");
        musicGameLayer.classList.add("is-paused");
      }

      async function resumeMusicGame(state) {
        if (!state || !state.paused || !state.audio) return;
        state.paused = false;
        state.pauseOverlay?.classList.remove("active");
        musicGameLayer.classList.remove("is-paused");
        await state.audio.play();
        state.statusLabel.textContent = IS_ZH ? "继续" : "Resume";
        state.running = true;
        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.rafId = requestAnimationFrame(() => updateMusicGame(state));
      }

      function createTapImpact(state, x, y, tone = "tap") {
        const burst = document.createElement("span");
        burst.className = `music-game-hit-burst ${tone === "drag" ? "drag-tone" : "tap-tone"}`;
        burst.style.left = `${x}px`;
        burst.style.top = `${y}px`;
        state.playfield.appendChild(burst);
        const timeoutId = setTimeout(() => burst.remove(), 520);
        state.timeouts.push(timeoutId);
      }

      function triggerComboEffect(state) {
        if (!state.comboChip) return;
        state.comboChip.classList.remove("is-combo-pulse");
        void state.comboChip.offsetWidth;
        state.comboChip.classList.add("is-combo-pulse");

        const streak = document.createElement("span");
        streak.className = "music-game-combo-streak";
        streak.textContent = `${state.combo} COMBO`;
        state.playfield.appendChild(streak);
        const timeoutId = setTimeout(() => streak.remove(), 900);
        state.timeouts.push(timeoutId);
      }

      function triggerFullComboEffect(state) {
        const badge = document.createElement("span");
        badge.className = "music-game-full-combo";
        badge.textContent = "FULL COMBO";
        state.playfield.appendChild(badge);
        const timeoutId = setTimeout(() => badge.remove(), 1600);
        state.timeouts.push(timeoutId);
      }

      function ensureHitAudio(state) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!state.hitAudioContext) state.hitAudioContext = new AudioCtx();
        if (state.hitAudioContext.state === "suspended") state.hitAudioContext.resume().catch(() => {});
        return state.hitAudioContext;
      }

      function playHitSound(state, note = null, judgment = "great") {
        if (state.autoPlay) return;
        const ctx = ensureHitAudio(state);
        if (!ctx) return;
        const now = ctx.currentTime;
        if (state.lastHitSoundAt && now - state.lastHitSoundAt < 0.02) return;
        state.lastHitSoundAt = now;
        const isBonus = !!note?.bonus;
        const kind = note?.type || "tap";

        function pulse(type, frequency, duration, gainStart, sweepTo, startAt = now) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(frequency, startAt);
          if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, sweepTo), startAt + duration);
          gain.gain.setValueAtTime(gainStart, startAt);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
          osc.connect(gain).connect(ctx.destination);
          osc.start(startAt);
          osc.stop(startAt + duration);
        }

        if (isBonus) {
          pulse("sine", judgment === "perfect" ? 740 : 680, 0.08, 0.085, 660);
          pulse("sine", judgment === "perfect" ? 988 : 932, 0.11, 0.07, 820, now + 0.028);
          return;
        }

        if (kind === "drag" || kind === "hold") {
          pulse("triangle", 220, 0.11, 0.18, 104);
          return;
        }

        if (kind === "flick") {
          pulse("triangle", 520, 0.05, 0.07, 860);
          pulse("sine", 980, 0.045, 0.05, 620);
          return;
        }

        pulse("sine", judgment === "perfect" ? 148 : 132, 0.12, 0.2, 58);
      }

      function getPerfectScoreForNote(note, mode = "freeform") {
        const multiplier = note.bonus ? 2 : 1;
        if (mode === "lanes") {
          if (note.type === "drag") return 190 * multiplier;
          if (note.type === "hold") return 170 * multiplier;
          if (note.type === "flick") return 140 * multiplier;
          return 120 * multiplier;
        }
        return (note.type === "drag" ? 180 : 120) * multiplier;
      }

      function removeResultsPanel(state) {
        if (!state.resultsPanel) return;
        state.resultsPanel.remove();
        state.resultsPanel = null;
      }

      function renderResultsPanel(state) {
        removeResultsPanel(state);
        const panel = document.createElement("div");
        panel.className = "music-game-results";
        const maxScore = Math.max(1, state.maxPossibleScore);
        const accuracy = ((state.score / maxScore) * 100).toFixed(2);
        panel.innerHTML = `
          <div class="music-game-results-title">${IS_ZH ? "本次成绩" : "Results"}</div>
          <div class="music-game-results-grid">
            <div><span>${IS_ZH ? "分数" : "Score"}</span><strong>${state.score} / ${maxScore}</strong></div>
            <div><span>${IS_ZH ? "准确率" : "Accuracy"}</span><strong>${accuracy}%</strong></div>
            <div><span>${IS_ZH ? "完美" : "Perfect"}</span><strong>${state.perfectCount}</strong></div>
            <div><span>${IS_ZH ? "良好" : "Great"}</span><strong>${state.greatCount}</strong></div>
            <div><span>${IS_ZH ? "失误" : "Miss"}</span><strong>${state.missCount}</strong></div>
            <div><span>${IS_ZH ? "最高连击" : "Max Combo"}</span><strong>${state.maxCombo}</strong></div>
          </div>
        `;
        state.playfield.appendChild(panel);
        state.resultsPanel = panel;
      }

      function addScore(state, amount, x, y, label, judgment = "great", note = null) {
        state.score += amount;
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        if (judgment === "perfect") state.perfectCount += 1;
        else state.greatCount += 1;
        state.scoreValue.textContent = String(state.score);
        state.comboValue.textContent = String(state.combo);
        state.statusLabel.textContent = label;
        createTapImpact(state, x, y, label.toLowerCase().includes("drag") ? "drag" : "tap");
        playHitSound(state, note, judgment);
        if (state.combo > 0 && state.combo % 10 === 0) triggerComboEffect(state);

        const flash = document.createElement("span");
        flash.className = "music-game-float-score";
        flash.textContent = `+${amount}`;
        flash.style.left = `${x}px`;
        flash.style.top = `${y}px`;
        state.playfield.appendChild(flash);
        const timeoutId = setTimeout(() => flash.remove(), 900);
        state.timeouts.push(timeoutId);
      }

      function resolveScoredAmount(note, amount) {
        return note?.bonus ? amount * 2 : amount;
      }

      function resolveScoreLabel(note, label) {
        return note?.bonus ? `${label} x2` : label;
      }

      function registerMiss(state, label = IS_ZH ? "未击中" : "Miss") {
        state.combo = 0;
        state.missCount += 1;
        state.comboValue.textContent = "0";
        state.statusLabel.textContent = label;
        state.comboChip?.classList.remove("is-combo-pulse");
      }

      function getLaneLayout(state) {
        const rect = state.playfield.getBoundingClientRect();
        const marginX = Math.max(24, rect.width * 0.08);
        const laneWidth = (rect.width - marginX * 2) / Math.max(1, state.laneCount || LANE_MODE_LANES);
        const hitY = rect.height * 0.84;
        const spawnY = -92;
        return {
          rect,
          marginX,
          laneWidth,
          hitY,
          spawnY,
          travel: hitY - spawnY,
        };
      }

      function getLaneCenterX(state, lane, layout = getLaneLayout(state)) {
        return layout.marginX + layout.laneWidth * (lane + 0.5);
      }

      function getLaneValueX(state, laneValue, layout = getLaneLayout(state)) {
        return layout.marginX + layout.laneWidth * (laneValue + 0.5);
      }

      function getDragPathState(note, progress = 0) {
        const path = note.pathLanes?.length ? note.pathLanes : [note.lane, note.endLane ?? note.lane];
        if (path.length <= 1) {
          const lane = path[0] ?? note.lane;
          return { lane, guideLane: lane, finalLane: lane };
        }
        const clamped = clamp(progress, 0, 0.999999);
        const span = path.length - 1;
        const scaled = clamped * span;
        const segmentIndex = Math.min(span - 1, Math.floor(scaled));
        const localProgress = scaled - segmentIndex;
        const fromLane = path[segmentIndex];
        const toLane = path[segmentIndex + 1];
        return {
          lane: fromLane + (toLane - fromLane) * localProgress,
          guideLane: toLane,
          finalLane: path[path.length - 1],
        };
      }

      function getLaneForClientX(state, clientX) {
        const layout = getLaneLayout(state);
        const relative = clamp(clientX - layout.rect.left - layout.marginX, 0, layout.laneWidth * (state.laneCount - 0.001));
        return clamp(Math.floor(relative / layout.laneWidth), 0, state.laneCount - 1);
      }

      function getLaneInputZone(state, clientX, clientY, requireJudgeBand = false) {
        const layout = getLaneLayout(state);
        const relativeX = clientX - layout.rect.left - layout.marginX;
        if (relativeX < 0 || relativeX > layout.laneWidth * state.laneCount) return null;
        if (requireJudgeBand) {
          const bandHeight = Math.max(68, layout.rect.height * 0.09);
          if (Math.abs((clientY - layout.rect.top) - layout.hitY) > bandHeight) return null;
        }
        const laneFloat = relativeX / layout.laneWidth;
        const lane = clamp(Math.floor(laneFloat), 0, state.laneCount - 1);
        const localX = relativeX - lane * layout.laneWidth;
        const deadZone = Math.max(10, layout.laneWidth * 0.12);
        if (localX < deadZone || localX > layout.laneWidth - deadZone) return null;
        return lane;
      }

      function getLaneScreenPoint(state, lane) {
        const layout = getLaneLayout(state);
        return { x: getLaneCenterX(state, lane, layout), y: layout.hitY };
      }

      function flashLane(state, lane) {
        const column = state.laneColumns?.[lane];
        if (!column) return;
        column.classList.remove("is-active");
        void column.offsetWidth;
        column.classList.add("is-active");
      }

      function getLaneNoteSpan(note) {
        if (note.type === "drag") {
          const path = note.pathLanes?.length ? note.pathLanes : [note.lane, note.endLane ?? note.lane];
          return {
            min: Math.min(...path),
            max: Math.max(...path),
          };
        }
        const lane = note.lane ?? note.endLane ?? 0;
        return { min: lane, max: lane };
      }

      function getLaneDragHand(note, chart = []) {
        if (note.type !== "drag") return "";
        const path = note.pathLanes?.length ? note.pathLanes : [note.lane, note.endLane ?? note.lane];
        const averageLane = path.reduce((sum, lane) => sum + lane, 0) / Math.max(1, path.length);
        const defaultHand = averageLane < 2 ? "left" : "right";
        const span = getLaneNoteSpan(note);
        const influenceEndMs = (note.endTimeMs ?? note.timeMs) + 160;
        let hasLeftConflict = false;
        let hasRightConflict = false;

        chart.forEach((other) => {
          if (other === note) return;
          const otherTime = other.timeMs ?? 0;
          if (otherTime <= (note.timeMs ?? 0)) return;
          if (otherTime > influenceEndMs) return;
          const otherSpan = getLaneNoteSpan(other);
          if (otherSpan.max < span.min) hasLeftConflict = true;
          if (otherSpan.min > span.max) hasRightConflict = true;
        });

        if (hasRightConflict && !hasLeftConflict) return "left";
        if (hasLeftConflict && !hasRightConflict) return "right";
        return defaultHand;
      }

      function buildLaneModeScaffold(state) {
        const grid = document.createElement("div");
        grid.className = "music-game-lane-grid";
        grid.style.setProperty("--lane-count", String(state.laneCount));

        state.laneColumns = [];
        for (let lane = 0; lane < state.laneCount; lane += 1) {
          const column = document.createElement("span");
          column.className = "music-game-lane-column";
          grid.appendChild(column);
          state.laneColumns.push(column);
        }

        const line = document.createElement("div");
        line.className = "music-game-judge-line";
        state.playfield.append(grid, line);
      }

      function laneYForTime(state, targetTime, trackTime, layout) {
        return layout.hitY - ((targetTime - trackTime) / state.approachMs) * layout.travel;
      }

      function laneLabel(base, perfect) {
        if (IS_ZH) return perfect ? `${base} 完美` : `${base} 成功`;
        return perfect ? `${base} Perfect` : `${base} Clear`;
      }

      function completeLaneNote(state, note, amount, label, judgment = "great") {
        if (note.hit || note.missed) return;
        note.hit = true;
        note.completed = true;
        note.element?.classList.add("is-hit");
        const finalLane = note.type === "drag" ? getDragPathState(note, 1).finalLane : note.lane;
        const point = getLaneScreenPoint(state, finalLane);
        addScore(state, resolveScoredAmount(note, amount), point.x, point.y, resolveScoreLabel(note, label), judgment, note);
        if (note.pointerId != null) state.activeLanePointers.delete(note.pointerId);
        note.pointerId = null;
        const timeoutId = setTimeout(() => note.element?.remove(), 160);
        state.timeouts.push(timeoutId);
      }

      function autoPlayFreeformNote(state, note) {
        if (note.hit || note.missed || !note.element) return;
        const rect = state.playfield.getBoundingClientRect();
        if (note.type === "tap") {
          note.hit = true;
          note.element.classList.add("is-hit");
          addScore(
            state,
            resolveScoredAmount(note, 120),
            note.x * rect.width,
            note.y * rect.height,
            resolveScoreLabel(note, "Perfect"),
            "perfect",
            note
          );
          const timeoutId = setTimeout(() => note.element?.remove(), 180);
          state.timeouts.push(timeoutId);
          return;
        }

        note.hit = true;
        note.element.classList.add("is-hit");
        addScore(
          state,
          resolveScoredAmount(note, 180),
          note.endX * rect.width,
          note.endY * rect.height,
          resolveScoreLabel(note, "Drag Perfect"),
          "perfect",
          note
        );
        if (state.activeDrag?.note === note) {
          state.activeDrag.trace.remove();
          state.activeDrag = null;
        }
        const timeoutId = setTimeout(() => note.element?.remove(), 220);
        state.timeouts.push(timeoutId);
      }

      function runAutoPlay(state, trackTime) {
        if (!state.autoPlay) return;
        if (state.mode === "lanes") {
          state.chart.forEach((note) => {
            if (!note.element || note.hit || note.missed) return;
            if (!note.started && trackTime >= note.timeMs - 8) {
              if (note.type === "tap") {
                completeLaneNote(state, note, getPerfectScoreForNote(note, "lanes"), resolveScoreLabel(note, "Perfect"), "perfect");
                return;
              }
              if (note.type === "flick") {
                completeLaneNote(state, note, getPerfectScoreForNote(note, "lanes"), resolveScoreLabel(note, IS_ZH ? "轻扫完成" : "Flick"), "perfect");
                return;
              }
              note.started = true;
              note.pointerId = note.pointerId || `auto-${note.id}`;
              note.element?.classList.add("is-held");
              flashLane(state, note.lane);
            }
            if (note.started && (note.type === "hold" || note.type === "drag")) {
              const progress = clamp((trackTime - note.timeMs) / Math.max(1, note.endTimeMs - note.timeMs), 0, 1);
              const lane = note.type === "drag"
                ? getDragPathState(note, progress).lane
                : note.lane;
              state.activeLanePointers.set(note.pointerId, { lane });
            }
            if (note.started && (note.type === "hold" || note.type === "drag") && trackTime >= note.endTimeMs - 8) {
              completeLaneNote(
                state,
                note,
                getPerfectScoreForNote(note, "lanes"),
                resolveScoreLabel(note, laneLabel(note.type === "drag" ? (IS_ZH ? "拖拽" : "Drag") : (IS_ZH ? "长按" : "Hold"), true)),
                "perfect"
              );
            }
          });
          return;
        }

        state.chart.forEach((note) => {
          if (!note.element || note.hit || note.missed) return;
          if (note.type === "tap" && trackTime >= note.timeMs - 8) {
            autoPlayFreeformNote(state, note);
          } else if (note.type === "drag" && trackTime >= note.endTimeMs - 8) {
            autoPlayFreeformNote(state, note);
          }
        });
      }

      function missLaneNote(state, note, label = IS_ZH ? "未击中" : "Miss") {
        if (note.hit || note.missed) return;
        note.missed = true;
        if (note.pointerId != null) state.activeLanePointers.delete(note.pointerId);
        note.pointerId = null;
        note.element?.classList.add("is-missed");
        registerMiss(state, label);
        const timeoutId = setTimeout(() => note.element?.remove(), 220);
        state.timeouts.push(timeoutId);
      }

      function createLaneNoteElement(state, note) {
        const root = document.createElement("div");
        const dragHand = getLaneDragHand(note, state.chart);
        root.className = `music-game-lane-note type-${note.type}${note.bonus ? " is-bonus" : ""}${dragHand ? ` hand-${dragHand}` : ""}`;
        root.innerHTML = `
          <span class="music-game-lane-note-body"></span>
          <span class="music-game-lane-note-head">
            ${note.type === "flick" ? '<span class="music-game-lane-flick-arrow"></span>' : ""}
            <span class="music-game-lane-note-core"></span>
            ${note.type === "flick" ? '<span class="music-game-lane-flick-mark"></span>' : ""}
          </span>
          ${(note.type === "hold" || note.type === "drag")
            ? '<span class="music-game-lane-note-tail"></span>'
            : ""}
        `;
        state.playfield.appendChild(root);
        note.element = root;
      }

      function updateLaneNoteVisual(state, note, trackTime) {
        const layout = getLaneLayout(state);
        const startX = getLaneCenterX(state, note.lane, layout);
        const headYRaw = laneYForTime(state, note.timeMs, trackTime, layout);
        const tailYRaw = note.endTimeMs ? laneYForTime(state, note.endTimeMs, trackTime, layout) : headYRaw;
        const headY = note.started && (note.type === "hold" || note.type === "drag") ? layout.hitY : headYRaw;
        const holdProgress = note.endTimeMs ? clamp((trackTime - note.timeMs) / Math.max(1, note.endTimeMs - note.timeMs), 0, 1) : 0;
        const dragPathState = note.type === "drag" ? getDragPathState(note, holdProgress) : null;
        const headX = note.type === "drag" && note.started
          ? getLaneValueX(state, dragPathState.lane, layout)
          : startX;
        const tailX = note.type === "drag"
          ? getLaneValueX(state, (note.started ? dragPathState.guideLane : getDragPathState(note, 1).finalLane), layout)
          : startX;
        const body = note.element?.querySelector(".music-game-lane-note-body");
        const head = note.element?.querySelector(".music-game-lane-note-head");
        const tail = note.element?.querySelector(".music-game-lane-note-tail");

        if (head) {
          head.style.left = `${headX}px`;
          head.style.top = `${headY}px`;
        }

        if (body) {
          if (note.type === "hold" || note.type === "drag") {
            const dx = tailX - headX;
            const dy = tailYRaw - headY;
            body.style.opacity = "1";
            body.style.left = `${headX}px`;
            body.style.top = `${headY}px`;
            body.style.width = `${Math.max(10, Math.hypot(dx, dy))}px`;
            body.style.transform = `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`;
          } else {
            body.style.opacity = "0";
          }
        }

        if (tail) {
          tail.style.left = `${tailX}px`;
          tail.style.top = `${tailYRaw}px`;
        }
      }

      function spawnLaneNoteElement(state, note) {
        createLaneNoteElement(state, note);
        updateLaneNoteVisual(state, note, getTrackTime(state));
      }

      function findLaneStartCandidate(state, lane, trackTime) {
        return state.chart
          .filter((note) => note.element && !note.hit && !note.missed && !note.started && note.lane === lane)
          .filter((note) => Math.abs(trackTime - note.timeMs) <= state.hitWindowMs)
          .sort((a, b) => Math.abs(trackTime - a.timeMs) - Math.abs(trackTime - b.timeMs))[0] || null;
      }

      function tryStartLaneNote(state, note, pointerId, lane, clientX, clientY, trackTime) {
        const delta = Math.abs(trackTime - note.timeMs);
        const point = getLaneScreenPoint(state, note.lane);
        flashLane(state, note.lane);

        if (note.type === "tap") {
          completeLaneNote(state, note, delta <= 70 ? 120 : 90, delta <= 70 ? "Perfect" : "Great", delta <= 70 ? "perfect" : "great");
          return true;
        }

        note.started = true;
        note.pointerId = pointerId;
        note.element?.classList.add("is-held");

        state.activeLanePointers.set(pointerId, {
          note,
          lane,
          startX: clientX,
          startY: clientY,
          startTime: trackTime,
        });

        if (note.type === "flick") {
          note.element?.classList.add("is-awaiting-flick");
          state.statusLabel.textContent = IS_ZH ? "轻扫" : "Flick";
          return true;
        }

        createTapImpact(state, point.x, point.y, note.type === "drag" ? "drag" : "tap");
        state.statusLabel.textContent = note.type === "drag" ? (IS_ZH ? "拖拽中" : "Drag") : (IS_ZH ? "按住" : "Hold");
        return true;
      }

      function handleLanePointerDown(state, event) {
        if (!state.running || state.mode !== "lanes") return;
        const lane = getLaneInputZone(state, event.clientX, event.clientY, true);
        if (lane == null) return;
        const trackTime = getTrackTime(state);
        const note = findLaneStartCandidate(state, lane, trackTime);
        event.preventDefault();
        if (!note) return;
        state.playfield.setPointerCapture?.(event.pointerId);
        tryStartLaneNote(state, note, event.pointerId, lane, event.clientX, event.clientY, trackTime);
      }

      function handleLanePointerMove(state, event) {
        if (!state.running || state.mode !== "lanes") return;
        const pointer = state.activeLanePointers.get(event.pointerId);
        if (!pointer) return;
        pointer.lane = getLaneForClientX(state, event.clientX);
        const note = pointer.note;
        const trackTime = getTrackTime(state);

        if (note.type !== "flick") {
          flashLane(state, pointer.lane);
        }

        if (note.type === "flick") {
          const travel = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY);
          if (travel >= 34 && trackTime <= note.timeMs + state.hitWindowMs + 180) {
            completeLaneNote(state, note, 140, IS_ZH ? "轻扫完成" : "Flick", "perfect");
          }
        }
      }

      function handleLanePointerEnd(state, event, canceled = false) {
        if (!state.mode || state.mode !== "lanes") return;
        const pointer = state.activeLanePointers.get(event.pointerId);
        if (!pointer) return;
        const { note } = pointer;
        const trackTime = getTrackTime(state);
        state.activeLanePointers.delete(event.pointerId);
        note.pointerId = null;

        if (note.hit || note.missed) return;
        if (note.type === "flick") {
          missLaneNote(state, note, canceled ? (IS_ZH ? "轻扫取消" : "Flick canceled") : (IS_ZH ? "轻扫失败" : "Flick missed"));
          return;
        }
        if (trackTime >= note.endTimeMs - 180) {
          const delta = Math.abs(trackTime - note.endTimeMs);
          const amount = note.type === "drag" ? (delta <= 90 ? 190 : 150) : (delta <= 90 ? 170 : 130);
          completeLaneNote(
            state,
            note,
            amount,
            laneLabel(note.type === "drag" ? (IS_ZH ? "拖拽" : "Drag") : (IS_ZH ? "长按" : "Hold"), delta <= 90),
            delta <= 90 ? "perfect" : "great"
          );
          return;
        }
        missLaneNote(state, note, canceled ? (IS_ZH ? "长按取消" : "Hold canceled") : (IS_ZH ? "提前松开" : "Released early"));
      }

      function createTapNoteElement(state, note, rect) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = `music-game-note music-game-note-tap${note.bonus ? " is-bonus" : ""}`;
        el.style.left = `${note.x * rect.width}px`;
        el.style.top = `${note.y * rect.height}px`;
        el.style.setProperty("--approach", `${state.approachMs}ms`);
        el.innerHTML = `
          <span class="music-game-note-ring"></span>
          <span class="music-game-note-core"></span>
        `;
        el.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          if (note.hit || note.missed) return;
          const trackTime = getTrackTime(state);
          const delta = Math.abs(trackTime - note.timeMs);
          if (delta > state.hitWindowMs) return;
          note.hit = true;
          el.classList.add("is-hit");
          addScore(
            state,
            resolveScoredAmount(note, delta < 70 ? 120 : 80),
            note.x * rect.width,
            note.y * rect.height,
            resolveScoreLabel(note, delta < 70 ? "Perfect" : "Great"),
            delta < 70 ? "perfect" : "great",
            note
          );
          const timeoutId = setTimeout(() => el.remove(), 180);
          state.timeouts.push(timeoutId);
        });
        return el;
      }

      function maybeCompleteActiveDrag(state, event) {
        const dragState = state.activeDrag;
        if (!dragState || dragState.note.hit || dragState.note.missed) return;
        const rect = state.playfield.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const dx = pointerX - dragState.startX;
        const dy = pointerY - dragState.startY;
        dragState.trace.style.setProperty("--to-x", `${pointerX}px`);
        dragState.trace.style.setProperty("--to-y", `${pointerY}px`);
        dragState.trace.style.setProperty("--trace-length", `${Math.hypot(dx, dy)}px`);
        dragState.trace.style.setProperty("--trace-angle", `${Math.atan2(dy, dx)}rad`);

        const targetX = dragState.note.endX * rect.width;
        const targetY = dragState.note.endY * rect.height;
        const trackTime = getTrackTime(state);
        const timeDelta = Math.abs(trackTime - dragState.note.endTimeMs);
        const distance = Math.hypot(pointerX - targetX, pointerY - targetY);

        if (timeDelta <= state.hitWindowMs + 60 && distance <= 46) {
          dragState.note.hit = true;
          dragState.root.classList.add("is-hit");
          addScore(
            state,
            resolveScoredAmount(dragState.note, timeDelta < 80 ? 180 : 120),
            targetX,
            targetY,
            resolveScoreLabel(dragState.note, timeDelta < 80 ? "Drag Perfect" : "Drag Clear"),
            timeDelta < 80 ? "perfect" : "great",
            dragState.note
          );
          dragState.trace.remove();
          state.activeDrag = null;
          const timeoutId = setTimeout(() => dragState.root.remove(), 220);
          state.timeouts.push(timeoutId);
        }
      }

      function createDragNoteElement(state, note, rect) {
        const root = document.createElement("div");
        root.className = `music-game-note music-game-note-drag ${note.accent === "purple" ? "accent-purple" : "accent-green"}`;
        const startX = note.x * rect.width;
        const startY = note.y * rect.height;
        const endX = note.endX * rect.width;
        const endY = note.endY * rect.height;
        const length = Math.hypot(endX - startX, endY - startY);
        const angle = Math.atan2(endY - startY, endX - startX);
        const holdMs = Math.max(260, note.endTimeMs - note.timeMs);

        root.style.setProperty("--start-x", `${startX}px`);
        root.style.setProperty("--start-y", `${startY}px`);
        root.style.setProperty("--end-x", `${endX}px`);
        root.style.setProperty("--end-y", `${endY}px`);
        root.style.setProperty("--drag-length", `${length}px`);
        root.style.setProperty("--drag-angle", `${angle}rad`);
        root.style.setProperty("--approach", `${state.approachMs}ms`);
        root.style.setProperty("--hold", `${holdMs}ms`);
        root.innerHTML = `
          <span class="music-game-drag-line"></span>
          <button type="button" class="music-game-drag-node start">
            <span class="music-game-note-ring"></span>
            <span class="music-game-note-core"></span>
          </button>
          <button type="button" class="music-game-drag-node end">
            <span class="music-game-note-ring music-game-note-ring-end"></span>
            <span class="music-game-note-core"></span>
          </button>
        `;

        const startButton = root.querySelector(".music-game-drag-node.start");
        startButton.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          if (note.hit || note.missed || state.activeDrag) return;
          const trackTime = getTrackTime(state);
          const earliestStart = note.timeMs - Math.max(220, state.hitWindowMs * 1.4);
          const latestStart = note.endTimeMs - 130;
          if (trackTime < earliestStart || trackTime > latestStart) return;

          root.classList.add("is-tracking");
          const trace = document.createElement("span");
          trace.className = "music-game-drag-trace";
          trace.style.setProperty("--from-x", `${startX}px`);
          trace.style.setProperty("--from-y", `${startY}px`);
          trace.style.setProperty("--to-x", `${startX}px`);
          trace.style.setProperty("--to-y", `${startY}px`);
          state.playfield.appendChild(trace);
          state.activeDrag = {
            note,
            root,
            trace,
            pointerId: event.pointerId,
            startX,
            startY,
          };
        });

        return root;
      }

      function spawnNoteElement(state, note) {
        if (state.mode === "lanes") {
          spawnLaneNoteElement(state, note);
          return;
        }
        const rect = state.playfield.getBoundingClientRect();
        const startPoint = pickResponsivePoint(state, rect, [], note);
        note.x = startPoint.x;
        note.y = startPoint.y;
        if (startPoint._index >= 0) {
          state.freeformRecentPointIndexes = [startPoint._index, ...(state.freeformRecentPointIndexes || [])].slice(0, 6);
        }
        if (note.type === "drag") {
          const endPoint = pickResponsivePoint(state, rect, [startPoint], note);
          note.endX = endPoint.x;
          note.endY = endPoint.y;
          if (endPoint._index >= 0) {
            state.freeformRecentPointIndexes = [endPoint._index, ...(state.freeformRecentPointIndexes || [])].slice(0, 6);
          }
        }
        const element = note.type === "drag" ? createDragNoteElement(state, note, rect) : createTapNoteElement(state, note, rect);
        note.element = element;
        state.playfield.appendChild(element);
      }

      function updateMusicGame(state) {
        if (!state.running) return;
        const trackTime = getTrackTime(state);

        while (state.nextSpawnIndex < state.chart.length && trackTime + state.approachMs >= state.chart[state.nextSpawnIndex].timeMs) {
          spawnNoteElement(state, state.chart[state.nextSpawnIndex]);
          state.nextSpawnIndex += 1;
        }

        runAutoPlay(state, trackTime);

        if (state.mode === "lanes") {
          state.chart.forEach((note) => {
            if (!note.element || note.hit || note.missed) return;
            updateLaneNoteVisual(state, note, trackTime);

            if (!note.started) {
              if (trackTime > note.timeMs + state.hitWindowMs) {
                missLaneNote(state, note);
              }
              return;
            }

            if (note.type === "flick") {
              if (trackTime > note.timeMs + state.hitWindowMs + 180) {
                missLaneNote(state, note, IS_ZH ? "轻扫过晚" : "Flick late");
              }
              return;
            }

            const pointer = note.pointerId != null ? state.activeLanePointers.get(note.pointerId) : null;
            if (!pointer) {
              if (trackTime >= note.endTimeMs - 150) {
                const delta = Math.abs(trackTime - note.endTimeMs);
                const amount = note.type === "drag" ? (delta <= 90 ? 190 : 150) : (delta <= 90 ? 170 : 130);
                completeLaneNote(
                  state,
                  note,
                  amount,
                  laneLabel(note.type === "drag" ? (IS_ZH ? "拖拽" : "Drag") : (IS_ZH ? "长按" : "Hold"), delta <= 90),
                  delta <= 90 ? "perfect" : "great"
                );
              } else {
                missLaneNote(state, note, IS_ZH ? "按住断开" : "Hold lost");
              }
              return;
            }

            if (note.type === "hold") {
              if (Math.abs(pointer.lane - note.lane) > 0.55) {
                missLaneNote(state, note, IS_ZH ? "偏离轨道" : "Left lane");
                return;
              }
              if (trackTime >= note.endTimeMs - 110) {
                const delta = Math.abs(trackTime - note.endTimeMs);
                completeLaneNote(state, note, delta <= 90 ? 170 : 130, laneLabel(IS_ZH ? "长按" : "Hold", delta <= 90), delta <= 90 ? "perfect" : "great");
              }
              return;
            }

            if (note.type === "drag") {
              const expectedLane = getDragPathState(note, clamp((trackTime - note.timeMs) / Math.max(1, note.endTimeMs - note.timeMs), 0, 1)).lane;
              if (Math.abs(pointer.lane - expectedLane) > 1.2) {
                missLaneNote(state, note, IS_ZH ? "拖拽偏移" : "Drag lost");
                return;
              }
              if (trackTime >= note.endTimeMs - 120) {
                const delta = Math.abs(trackTime - note.endTimeMs);
                completeLaneNote(state, note, delta <= 90 ? 190 : 150, laneLabel(IS_ZH ? "拖拽" : "Drag", delta <= 90), delta <= 90 ? "perfect" : "great");
              }
            }
          });
        } else {

          state.chart.forEach((note) => {
            if (!note.element || note.hit || note.missed) return;
            const missTime = note.type === "drag" ? note.endTimeMs + state.hitWindowMs + 120 : note.timeMs + state.hitWindowMs;
            if (trackTime > missTime) {
              note.missed = true;
              note.element.classList.add("is-missed");
              if (state.activeDrag?.note === note) {
                state.activeDrag.trace.remove();
                state.activeDrag = null;
              }
              registerMiss(state);
              const timeoutId = setTimeout(() => note.element?.remove(), 220);
              state.timeouts.push(timeoutId);
            }
          });
        }

        if (state.audio.ended || (trackTime > state.durationMs + state.approachMs + 1200 && state.nextSpawnIndex >= state.chart.length)) {
          if (state.missCount === 0) {
            state.statusLabel.textContent = IS_ZH ? "全连" : "Full combo";
            triggerFullComboEffect(state);
          } else {
            state.statusLabel.textContent = IS_ZH ? "歌曲结束" : "Song finished";
          }
          renderResultsPanel(state);
          state.running = false;
          state.paused = false;
          state.pauseOverlay?.classList.remove("active");
          musicGameLayer.classList.remove("is-playing");
          musicGameLayer.classList.remove("is-paused");
          return;
        }

        state.rafId = requestAnimationFrame(() => updateMusicGame(state));
      }

      async function startMusicSong(songKey, mode = "freeform", difficulty = "normal") {
        if (!musicGameState) return;
        const state = musicGameState;
        const song = MUSIC_SONGS[songKey];
        if (!song) return;
        if (!state.assetsDownloaded) {
          state.statusLabel.textContent = IS_ZH ? "请先下载数据" : "Download data first";
          return;
        }
        const sessionId = (state.sessionId || 0) + 1;
        state.sessionId = sessionId;

        state.running = false;
        if (state.rafId) cancelAnimationFrame(state.rafId);
        if (state.audio) {
          state.audio.pause();
          state.audio.currentTime = 0;
        }
        state.preRollStartPerf = 0;
        state.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        state.timeouts = [];
        state.playfield.replaceChildren();
        if (state.activeDrag?.trace) state.activeDrag.trace.remove();
        state.activeDrag = null;
        state.nextSpawnIndex = 0;
        state.score = 0;
        state.combo = 0;
        state.maxCombo = 0;
        state.missCount = 0;
        state.perfectCount = 0;
        state.greatCount = 0;
        state.mode = mode;
        state.selectedMode = mode;
        state.selectedSong = songKey;
        state.selectedLevel = difficulty;
        state.approachMs = mode === "lanes" ? 920 : 1050;
        state.hitWindowMs = mode === "lanes" ? 150 : 185;
        state.laneCount = mode === "lanes" ? LANE_MODE_LANES : 0;
        state.activeLanePointers = new Map();
        state.laneColumns = [];
        state.freeformRecentPointIndexes = [];
        state.paused = false;
        state.pauseOverlay?.classList.remove("active");
        musicGameLayer.classList.remove("is-paused");
        removeResultsPanel(state);
        musicGameLayer.classList.remove("is-setup-open");
        state.scoreValue.textContent = "0";
        state.comboValue.textContent = "0";
        state.statusLabel.textContent = IS_ZH ? "读取谱面…" : "Loading chart...";
        state.songLabel.textContent = song.label;
        if (state.modeLabel) {
          state.modeLabel.textContent = mode === "lanes" ? (IS_ZH ? "下落模式" : "Lane mode") : (IS_ZH ? "自由模式" : "Freeform");
        }
        if (state.levelLabel) {
          state.levelLabel.textContent = difficulty === "hard" ? (IS_ZH ? "困难" : "Hard") : (IS_ZH ? "普通" : "Normal");
        }
        state.playfield.classList.toggle("lane-mode", mode === "lanes");
        if (mode === "lanes") buildLaneModeScaffold(state);

        try {
          state.audio = clonePreloadedAudio(songKey);
          const preparedKey = `${songKey}:${mode}:${difficulty}`;
          const loaded = preparedSongDataCache.get(preparedKey) || prepareSongData(songKey, mode, difficulty, await loadSongChart(songKey, mode, difficulty));
          if (!musicGameState || musicGameState !== state || state.sessionId !== sessionId) return;
          state.chart = loaded.chart.map((note) => ({ ...note }));
          state.durationMs = loaded.durationMs;
          state.laneCount = loaded.laneCount || state.laneCount || LANE_MODE_LANES;
          state.maxPossibleScore = loaded.maxPossibleScore;
          if (mode === "lanes") {
            state.playfield.replaceChildren();
            buildLaneModeScaffold(state);
          }
          musicGameLayer.classList.add("is-playing");
          state.statusLabel.textContent = IS_ZH ? "准备中…" : "Get ready...";
          state.preRollMs = Math.max(state.approachMs + 120, 2200);
          state.preRollStartPerf = performance.now();
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.running = true;
          state.rafId = requestAnimationFrame(() => updateMusicGame(state));
          await showMusicGameCountdown(state);
          if (!musicGameState || musicGameState !== state || state.sessionId !== sessionId) {
            state.audio.pause();
            state.audio.currentTime = 0;
            return;
          }
          state.running = false;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.rafId = 0;
          state.preRollStartPerf = 0;
          state.audio.currentTime = 0;
          await state.audio.play();
          state.songStartPerf = performance.now();
          state.statusLabel.textContent = IS_ZH ? "开始" : "Start";
          state.running = true;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          state.rafId = requestAnimationFrame(() => updateMusicGame(state));
        } catch (error) {
          const message = error && typeof error.message === "string" ? error.message : String(error || "Unknown error");
          state.statusLabel.textContent = IS_ZH ? `无法开始：${message}` : `Unable to start: ${message}`;
        }
      }

      function buildMusicGameUi() {
        musicGameLayer.replaceChildren();
        const shell = document.createElement("div");
        shell.className = "music-game-shell";
        shell.innerHTML = `
          <div class="music-game-header">
            <div class="music-game-actions">
              <button type="button" class="music-game-button music-game-stop">${IS_ZH ? "暂停" : "Stop"}</button>
              <button type="button" class="music-game-button music-game-exit">${IS_ZH ? "退出" : "Exit"}</button>
            </div>
          </div>
          <div class="music-game-hud">
            <div class="music-game-chip"><span>${IS_ZH ? "歌曲" : "Song"}</span><strong class="music-game-song-label">-</strong></div>
            <div class="music-game-chip"><span>${IS_ZH ? "模式" : "Mode"}</span><strong class="music-game-mode-label">${IS_ZH ? "未选择" : "Not selected"}</strong></div>
            <div class="music-game-chip"><span>${IS_ZH ? "等级" : "Level"}</span><strong class="music-game-level-label">-</strong></div>
            <div class="music-game-chip"><span>${IS_ZH ? "分数" : "Score"}</span><strong class="music-game-score-value">0</strong></div>
            <div class="music-game-chip"><span>${IS_ZH ? "连击" : "Combo"}</span><strong class="music-game-combo-value">0</strong></div>
            <div class="music-game-chip"><span>${IS_ZH ? "状态" : "Status"}</span><strong class="music-game-status-label">${IS_ZH ? "先选模式再选歌曲" : "Select mode, then select song"}</strong></div>
          </div>
          <div class="music-game-rotate-notice">${IS_ZH ? "手机请横屏游玩" : "Rotate your phone horizontally to play."}</div>
          <div class="music-game-setup">
            <div class="music-game-step is-active" data-step="download">
              <button type="button" class="music-game-button music-game-download">${IS_ZH ? "下载数据" : "Download data"}</button>
            </div>
            <div class="music-game-step" data-step="mode">
              <div class="music-game-mode-list">
                <button type="button" class="music-game-button music-game-mode-button" data-mode="freeform">${IS_ZH ? "自由模式" : "Freeform"}</button>
                <button type="button" class="music-game-button music-game-mode-button" data-mode="lanes">${IS_ZH ? "下落模式" : "Lane mode"}</button>
              </div>
            </div>
            <div class="music-game-step" data-step="song">
              <div class="music-game-song-list">
                <button type="button" class="music-game-song-button" data-song="fiu">fiu</button>
                <button type="button" class="music-game-song-button" data-song="palace">Palace</button>
                <button type="button" class="music-game-song-button" data-song="lafantasia">La Fantasia</button>
                <button type="button" class="music-game-song-button" data-song="recordplayer">Record Player</button>
                <button type="button" class="music-game-song-button" data-song="stallion">Stallion</button>
              </div>
            </div>
            <div class="music-game-step" data-step="options">
              <div class="music-game-level-list is-visible">
                <button type="button" class="music-game-button music-game-level-button" data-level="normal">${IS_ZH ? "普通" : "Normal"}</button>
                <button type="button" class="music-game-button music-game-level-button" data-level="hard">${IS_ZH ? "困难" : "Hard"}</button>
              </div>
              <div class="music-game-option-actions">
                <button type="button" class="music-game-button music-game-autoplay">${IS_ZH ? "自动播放" : "Auto play"}</button>
                <button type="button" class="music-game-button music-game-start">${IS_ZH ? "开始游戏" : "Start game"}</button>
              </div>
            </div>
          </div>
          <div class="music-game-playfield"></div>
          <div class="music-game-pause-overlay">
            <div class="music-game-pause-card">
              <strong>${IS_ZH ? "游戏已暂停" : "Game paused"}</strong>
              <div class="music-game-pause-actions">
                <button type="button" class="music-game-button music-game-resume">${IS_ZH ? "继续" : "Resume"}</button>
                <button type="button" class="music-game-button music-game-quit">${IS_ZH ? "退出" : "Quit"}</button>
              </div>
            </div>
          </div>
        `;
        musicGameLayer.appendChild(shell);

        const downloadButton = shell.querySelector(".music-game-download");
        const autoPlayButton = shell.querySelector(".music-game-autoplay");
        const startButton = shell.querySelector(".music-game-start");
        const stopButton = shell.querySelector(".music-game-stop");
        const exitButton = shell.querySelector(".music-game-exit");
        const setup = shell.querySelector(".music-game-setup");
        const modeList = shell.querySelector('.music-game-step[data-step="mode"] .music-game-mode-list');
        const levelList = shell.querySelector('.music-game-step[data-step="options"] .music-game-level-list');
        const songList = shell.querySelector('.music-game-step[data-step="song"] .music-game-song-list');
        const playfield = shell.querySelector(".music-game-playfield");
        const pauseOverlay = shell.querySelector(".music-game-pause-overlay");
        const resumeButton = shell.querySelector(".music-game-resume");
        const quitButton = shell.querySelector(".music-game-quit");
        const scoreValue = shell.querySelector(".music-game-score-value");
        const comboValue = shell.querySelector(".music-game-combo-value");
        const statusLabel = shell.querySelector(".music-game-status-label");
        const songLabel = shell.querySelector(".music-game-song-label");
        const modeLabel = shell.querySelector(".music-game-mode-label");
        const levelLabel = shell.querySelector(".music-game-level-label");
        const comboChip = comboValue.closest(".music-game-chip");

        musicGameState = {
          running: false,
          rafId: 0,
          audio: null,
          chart: [],
          selectedSong: "",
          durationMs: 0,
          nextSpawnIndex: 0,
          approachMs: 1050,
          hitWindowMs: 185,
          mode: "freeform",
          selectedMode: "",
          selectedLevel: "normal",
          laneCount: 0,
          score: 0,
          combo: 0,
          maxCombo: 0,
          missCount: 0,
          perfectCount: 0,
          greatCount: 0,
          maxPossibleScore: 0,
          timeouts: [],
          playfield,
          scoreValue,
          comboValue,
          comboChip,
          statusLabel,
          songLabel,
          modeLabel,
          levelLabel,
          activeDrag: null,
          activeLanePointers: new Map(),
          laneColumns: [],
          songStartPerf: 0,
          assetsDownloaded: false,
          downloadPromise: null,
          resultsPanel: null,
          autoPlay: false,
          autoPlayButton,
          startButton,
          hitAudioContext: null,
          pauseOverlay,
          paused: false,
          setup,
        };

        function isRotateBlocked() {
          return window.innerWidth < 900 && window.innerHeight > window.innerWidth;
        }

        function getSetupStep() {
          if (isRotateBlocked()) return "rotate";
          if (!musicGameState.assetsDownloaded) return "download";
          if (!musicGameState.selectedMode) return "mode";
          if (!musicGameState.selectedSong) return "song";
          return "options";
        }

        function syncSongUi() {
          if (!musicGameState) return;
          songList.querySelectorAll("[data-song]").forEach((button) => {
            button.classList.toggle("is-active", button.getAttribute("data-song") === musicGameState.selectedSong);
          });
        }

        function syncAutoPlayButton() {
          if (!musicGameState?.autoPlayButton) return;
          musicGameState.autoPlayButton.classList.toggle("is-active", musicGameState.autoPlay);
          musicGameState.autoPlayButton.textContent = musicGameState.autoPlay
            ? (IS_ZH ? "自动播放中" : "Auto play on")
            : (IS_ZH ? "自动播放" : "Auto play");
        }

        function syncModeUi() {
          if (!musicGameState) return;
          const selectedMode = musicGameState.selectedMode || "";
          modeList.querySelectorAll("[data-mode]").forEach((button) => {
            button.classList.toggle("is-active", button.getAttribute("data-mode") === selectedMode);
          });
          modeLabel.textContent = selectedMode
            ? (selectedMode === "lanes" ? (IS_ZH ? "下落模式" : "Lane mode") : (IS_ZH ? "自由模式" : "Freeform"))
            : (IS_ZH ? "未选择" : "Not selected");
          if (!selectedMode) levelLabel.textContent = "-";
        }

        function syncLevelUi() {
          if (!musicGameState) return;
          if (!musicGameState.selectedMode) {
            levelLabel.textContent = "-";
            levelList.querySelectorAll("[data-level]").forEach((button) => {
              button.classList.toggle("is-active", false);
            });
            return;
          }
          const selectedLevel = musicGameState.selectedLevel || "normal";
          levelList.querySelectorAll("[data-level]").forEach((button) => {
            button.classList.toggle("is-active", button.getAttribute("data-level") === selectedLevel);
          });
          levelLabel.textContent = selectedLevel === "hard" ? (IS_ZH ? "困难" : "Hard") : (IS_ZH ? "普通" : "Normal");
        }

        function syncSetupFlow() {
          if (!musicGameState) return;
          const step = getSetupStep();
          musicGameLayer.classList.toggle("is-rotate-blocked", step === "rotate");
          musicGameLayer.classList.toggle("is-setup-open", !musicGameState.running && !musicGameState.paused && step !== "rotate");
          setup.querySelectorAll(".music-game-step").forEach((panel) => {
            panel.classList.toggle("is-active", panel.getAttribute("data-step") === step);
          });
          if (step === "song") {
            songList.scrollTo({ top: 0, behavior: "smooth" });
          }
        }

        syncAutoPlayButton();
        syncModeUi();
        syncLevelUi();
        syncSongUi();
        syncSetupFlow();

        downloadButton.addEventListener("click", () => {
          preloadMusicGameData(musicGameState).then(() => {
            syncSetupFlow();
          }).catch(() => {});
        });

        autoPlayButton.addEventListener("click", () => {
          if (!musicGameState) return;
          musicGameState.autoPlay = !musicGameState.autoPlay;
          syncAutoPlayButton();
        });

        startButton.addEventListener("click", () => {
          if (!musicGameState?.selectedSong || !musicGameState.selectedMode) return;
          startMusicSong(
            musicGameState.selectedSong,
            musicGameState.selectedMode,
            musicGameState.selectedLevel || "normal"
          );
        });

        stopButton.addEventListener("click", () => {
          pauseMusicGame(musicGameState);
        });

        modeList.addEventListener("click", (event) => {
          const target = event.target.closest("[data-mode]");
          if (!target || !musicGameState) return;
          musicGameState.selectedMode = target.getAttribute("data-mode") || "";
          musicGameState.selectedSong = "";
          musicGameState.selectedLevel = "normal";
          musicGameState.statusLabel.textContent = IS_ZH ? "已选模式，请选歌曲" : "Mode selected. Choose a song.";
          syncModeUi();
          syncLevelUi();
          syncSongUi();
          syncSetupFlow();
        });

        levelList.addEventListener("click", (event) => {
          const target = event.target.closest("[data-level]");
          if (!target || !musicGameState) return;
          musicGameState.selectedLevel = target.getAttribute("data-level") || "normal";
          musicGameState.statusLabel.textContent = IS_ZH ? "已选等级，可以开始" : "Level selected. Ready to start.";
          syncLevelUi();
        });

        exitButton.addEventListener("click", () => {
          teardownMusicGame();
        });

        resumeButton.addEventListener("click", () => {
          resumeMusicGame(musicGameState).catch(() => {});
        });

        quitButton.addEventListener("click", () => {
          teardownMusicGame();
        });

        songList.addEventListener("click", (event) => {
          const target = event.target.closest("[data-song]");
          if (!target) return;
          if (!musicGameState?.selectedMode) {
            musicGameState.statusLabel.textContent = IS_ZH ? "请先选择模式" : "Select a mode first";
            return;
          }
          musicGameState.selectedSong = target.getAttribute("data-song") || "";
          musicGameState.statusLabel.textContent = IS_ZH ? "已选歌曲，请选择等级和自动播放" : "Song selected. Choose level and autoplay.";
          syncSongUi();
          syncSetupFlow();
        });

        window.addEventListener("resize", () => {
          syncSetupFlow();
        });

        playfield.addEventListener("pointermove", (event) => {
          handleLanePointerMove(musicGameState, event);
          maybeCompleteActiveDrag(musicGameState, event);
        });

        playfield.addEventListener("pointerdown", (event) => {
          handleLanePointerDown(musicGameState, event);
        });

        playfield.addEventListener("pointerup", (event) => {
          handleLanePointerEnd(musicGameState, event);
          maybeCompleteActiveDrag(musicGameState, event);
          if (musicGameState?.activeDrag && musicGameState.activeDrag.pointerId === event.pointerId) {
            musicGameState.activeDrag.trace.remove();
            musicGameState.activeDrag.root.classList.remove("is-tracking");
            musicGameState.activeDrag = null;
            registerMiss(musicGameState, IS_ZH ? "拖拽断开" : "Drag lost");
          }
        });

        playfield.addEventListener("pointercancel", (event) => {
          handleLanePointerEnd(musicGameState, event, true);
          if (!musicGameState?.activeDrag) return;
          musicGameState.activeDrag.trace.remove();
          musicGameState.activeDrag.root.classList.remove("is-tracking");
          musicGameState.activeDrag = null;
          registerMiss(musicGameState, IS_ZH ? "拖拽取消" : "Drag canceled");
        });
      }

      function launchMusicGame() {
        if (cleanupTimer) clearTimeout(cleanupTimer);
        clearEffect();
        teardownMusicGame();
        applyPalette(getThemePalette());
        buildMusicGameUi();
        requestAnimationFrame(() => {
          musicGameLayer.classList.add("active");
        });
      }

      function launchEffect(type) {
        if (cleanupTimer) clearTimeout(cleanupTimer);
        clearEffect();
        const palette = getThemePalette();
        if (type === "musicgame") {
          launchMusicGame();
          return;
        }
        if (type === "violet") launchViolet();
        else if (type === "midnight") launchMidnight();
        else if (type === "fiu") launchFiu();
        else if (type === "fiush") launchFiush();
        else if (type === "hearts") launchHearts();
        else if (type === "mama") launchMama();
        else if (type === "polarbear") launchPolarbear();
        else if (type === "spiretz") launchSpiretz();
        else if (type === "laser") launchLaser();
        else if (type === "thunder") launchThunder();
        else if (type === "elements") launchElements();
        else if (type === "iceworld") launchIceworld();
        else {
          applyPalette(palette);
          if (type === "rain") launchRain(palette);
          else if (type === "halo") launchHalo(palette);
          else launchBurst(palette);
        }

        requestAnimationFrame(() => {
          overlay.classList.add("active");
        });

        cleanupTimer = setTimeout(clearEffect, type === "mama" ? 6200 : type === "polarbear" ? 6200 : type === "hearts" ? 4200 : type === "fiush" ? 7200 : type === "spiretz" ? 6200 : type === "fiu" ? 4200 : type === "midnight" ? 7600 : type === "iceworld" ? 9200 : type === "elements" ? 6200 : type === "thunder" ? 7800 : type === "laser" ? 7200 : type === "violet" ? 7600 : type === "halo" ? 3800 : 3200);
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const code = input.value.trim();
        const effect = validCodes.get(code);

        if (!effect) {
          setStatus(IS_ZH ? "代码无效。请重试。" : "Invalid code. Try again.", "error");
          return;
        }

        if (effect.type === "musicgame") launchMusicGame();
        else launchEffect(effect.type);
        setStatus("", "success");
        input.value = "";
      });
    })();

    // ===== Back To Top =====
    (function () {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "back-to-top";
      btn.setAttribute("aria-label", IS_ZH ? "返回顶部" : "Back to top");
      btn.textContent = IS_ZH ? "返回顶部" : "Back to top";
      document.body.appendChild(btn);

      function toggleBtn() {
        if (window.scrollY > 420) btn.classList.add("visible");
        else btn.classList.remove("visible");
      }

      btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      window.addEventListener("scroll", toggleBtn, { passive: true });
      toggleBtn();
    })();

    // ===== Quiz =====
    (function () {
      const quizCount = document.getElementById("quizCount");
      const quizGenerate = document.getElementById("quizGenerate");
      const quizSubmit = document.getElementById("quizSubmit");
      const quizArea = document.getElementById("quizArea");
      const quizScore = document.getElementById("quizScore");

      if (!quizCount || !quizGenerate || !quizSubmit || !quizArea || !quizScore) return;

      function zhPrompt(text) {
        if (!IS_ZH) return text;
        return zhQuizText(text);
      }

      const VERBS = [
        ["ampi","believe"],
        ["ampiria","hope"],
        ["eya","be"],
        ["aye","have"],
        ["beya","need, want"],
        ["dara","dance"],
        ["daresu","understand"],
        ["daro","suppose; assume"],
        ["davi","lose"],
        ["daze","close"],
        ["dezu","explain"],
        ["doye","cause; make"],
        ["dravo","arrive"],
        ["fane","end; finish"],
        ["fireno","request"],
        ["folo","forget"],
        ["fure","rest"],
        ["fureyi","continue"],
        ["gavu","eat"],
        ["golu","drink"],
        ["heta","speak; say"],
        ["heti","listen"],
        ["hodape","open"],
        ["kamio","know"],
        ["lion","like"],
        ["kame","consider"],
        ["kampi","keep"],
        ["kamu","think"],
        ["korati","challenge"],
        ["krei","do; make"],
        ["krichei","decide"],
        ["lanko","belong to"],
        ["lavi","love"],
        ["laza","play"],
        ["liguria","shine; illuminate"],
        ["lika","read"],
        ["lume","research; study"],
        ["lure","talk; converse"],
        ["meli","remember"],
        ["melu","miss"],
        ["mezu","write"],
        ["mie","meet"],
        ["miori","participate"],
        ["mire","describe"],
        ["mura","marry"],
        ["namu","be called; be named"],
        ["nata","put; place"],
        ["navine","walk"],
        ["nelu","search; look for"],
        ["novi","follow"],
        ["oio","regard as; treat as"],
        ["parale","leave"],
        ["petra","rise"],
        ["poso","occupy"],
        ["pozo","prove"],
        ["praisa","aim at"],
        ["praise","guide"],
        ["trine","ask"],
        ["kuma","choose"],
        ["amperio","protect; guard"],
        ["petrio","raise; lift up"],
        ["pozir", "truth", "[p'oziɹ]", "po.zir"],
        ["rake","get; obtain"],
        ["raku","prepare"],
        ["reni","answer"],
        ["revo","run"],
        ["revu","return"],
        ["sela","tell"],
        ["sire","paint"],
        ["sola","sleep"],
        ["megolvia","sing"],
        ["soraye","study; learn"],
        ["sorae","teach"],
        ["fizro","count"],
        ["su","live; exist"],
        ["suri","live"],
        ["tamu","work"],
        ["tira","come"],
        ["tiru","bring"],
        ["tori","carry"],
        ["trake","begin; start"],
        ["tra","stand"],
        ["trepsa","oppose"],
        ["trive","share"],
        ["vayi","want"],
        ["veli","wait"],
        ["veska","travel"],
        ["veskari","please"],
        ["vese","see"],
        ["vire","receive"],
        ["vona","watch"],
        ["zanu","appreciate; admire"],
        ["zeyo","go"],
        ["zeyu","should"],
        ["zima","buy"],
      ];
      const VERB_VALENCY = {
        ampi: "T",
        ampiria: "I",
        eya: "I",
        aye: "T",
        beya: "T",
        dara: "I",
        daresu: "T",
        daro: "T",
        davi: "T",
        daze: "T",
        dezu: "T",
        doye: "T",
        dravo: "I",
        fane: "T",
        fireno: "T",
        folo: "T",
        fure: "I",
        fureyi: "I",
        gavu: "T",
        golu: "T",
        heta: "T",
        heti: "T",
        hodape: "T",
        kamio: "T",
        lion: "T",
        kame: "T",
        kampi: "T",
        kamu: "I",
        korati: "T",
        krei: "T",
        krichei: "T",
        lanko: "I",
        lavi: "T",
        laza: "I",
        liguria: "I",
        lika: "T",
        lume: "T",
        lure: "I",
        meli: "T",
        melu: "T",
        mezu: "T",
        mie: "T",
        miori: "I",
        mire: "T",
        mura: "I",
        namu: "I",
        nata: "T",
        navine: "I",
        nelu: "T",
        novi: "T",
        oio: "T",
        parale: "I",
        petra: "I",
        poso: "T",
        pozo: "T",
        praisa: "I",
        praise: "T",
        trine: "T",
        kuma: "T",
        amperio: "T",
        petrio: "T",
        rake: "T",
        raku: "T",
        reni: "T",
        revo: "I",
        revu: "I",
        sela: "T",
        sire: "T",
        sola: "I",
        megolvia: "I",
        soraye: "T",
        sorae: "T",
        fizro: "T",
        su: "I",
        suri: "I",
        tamu: "I",
        tira: "I",
        tiru: "T",
        tori: "T",
        trake: "I",
        tra: "I",
        trepsa: "T",
        trive: "T",
        vayi: "T",
        veli: "I",
        veska: "I",
        veskari: "I",
        vese: "T",
        vire: "T",
        vona: "T",
        zanu: "T",
        zeyo: "I",
        zeyu: "I",
        zima: "T",
      };
      const VERB_LEXICON_OVERRIDES = {
        lion: { pronunciation: "[lˈion]", syllables: "li.on" },
        kuma: { pronunciation: "[kˈumɑ]", syllables: "ku.ma" },
      };
      const NOUNS = [
        ["amperial", "wish", "[ampeɹ'ial]", "am.pe.ri.al"],
        ["amperiom", "guard; protection", "[ampeɹ'iom]", "am.pe.ri.om"],
        ["chind", "window", "[ʧ'ind]", "chind"],
        ["coranir", "nationality", "[koɹ'anir]", "co.ra.nir"],
        ["koratim", "challenge", "[koɹ'atim]", "ko.ra.tim"],
        ["corutal", "country", "[koɹ'utal]", "co.ru.tal"],
        ["kricheik", "decision", "[kɹiʧ'ek]", "kri.cheik"],
        ["diaspartas", "heart", "[diasp'artas]", "di.as.par.tas"],
        ["domat", "hand", "[d'omat]", "do.mat"],
        ["enatur", "nature", "[ɛn'atuɹ]", "e.na.tur"],
        ["firek", "driver", "[f'iɹek]", "fi.rek"],
        ["varionrat", "dictionary", "[vaɹion'ɹat]", "va.ri.on.rat"],
        ["fizros", "number", "[f'izɹos]", "fi.zros"],
        ["gayuras", "language", "[gaj'uras]", "ga.yu.ras"],
        ["kam", "mind", "[k'am]", "kam"],
        ["kamis", "knowledge", "[k'amis]", "ka.mis"],
        ["kamiren", "intelligence", "[kam'iɹen]", "ka.mi.ren"],
        ["kaminan", "wisdom", "[kam'inan]", "ka.mi.nan"],
        ["ligur", "light, flash", "[l'iguɹ]", "li.gur"],
        ["lovek", "pencil", "[l'ovek]", "lo.vek"],
        ["lumisar", "photo", "[lum'isaɹ]", "lu.mi.sar"],
        ["lumivis", "video", "[lum'ivis]", "lu.mi.vis"],
        ["medagel", "door", "[med'agel]", "me.da.gel"],
        ["megos", "song", "[m'egos]", "me.gos"],
        ["meitur", "dialogue", "[m'etuɹ]", "mei.tur"],
        ["mekaris", "suitcase", "[mek'aɹis]", "me.ka.ris"],
        ["mirakop", "plan", "[miɹ'akop]", "mi.ra.kop"],
        ["miravet", "diary", "[miɹ'avet]", "mi.ra.vet"],
        ["nizorik", "young person", "[niz'oɹik]", "ni.zo.rik"],
        ["paral", "leave", "[p'aɹal]", "pa.ral"],
        ["petraz", "rise", "[p'etɹaz]", "pe.traz"],
        ["posont", "power", "[p'osont]", "po.sont"],
        ["posontal", "right", "[pos'ontal]", "po.son.tal"],
        ["posot", "occupy", "[p'osot]", "po.sot"],
        ["poz", "prove", "[p'oz]", "poz"],
        ["prais", "guide", "[pɹ'ais]", "prais"],
        ["praisal", "goal", "[pɹ'aisal]", "prai.sal"],
        ["ramis", "map", "[ɹ'amis]", "ra.mis"],
        ["ramisal", "place", "[ɹam'isal]", "ra.mi.sal"],
        ["rine", "possibly", "[ɹ'ine]", "ri.ne"],
        ["sihof", "bird", "[s'ihof]", "si.hof"],
        ["sihofal", "flower", "[sih'ofal]", "si.ho.fal"],
        ["sont", "world", "[s'ont]", "sont"],
        ["sor", "system", "[s'oɹ]", "sor"],
        ["soralit", "student", "[soɹ'alit]", "so.ra.lit"],
        ["soramir", "teacher", "[soɹ'amiɹ]", "so.ra.mir"],
        ["sorasis", "school", "[soɹ'asis]", "so.ra.sis"],
        ["sohyenir", "civilian", "[sohɛːn'iɹ]", "so.hye.nir"],
        ["sohyes", "society", "[s'ohɛːs]", "so.hyes"],
        ["spiretz", "peace", "[spiɹ'ɛtsiː]", "s.pi.re.tsyi"],
        ["tores", "horse", "[t'oɹes]", "to.res"],
        ["travos", "course", "[tɹ'avos]", "tra.vos"],
        ["traz", "stand", "[tɹ'az]", "traz"],
        ["trep", "oppose", "[tɹ'eps]", "trep"],
        ["trepsal", "war", "[tɹ'epsal]", "tre.psal"],
        ["trineis", "question", "[tɹ'ines]", "tri.neis"],
        ["varion", "word", "[vaɹ'ion]", "va.ri.on"],
        ["veip", "movement", "[v'ep]", "veip"],
        ["veilanir", "traveler", "[vel'aniɹ]", "vei.la.nir"],
        ["veinier", "passenger", "[ven'ieɹ]", "vei.ni.er"],
        ["veinor", "bus", "[v'enoɹ]", "vei.nor"],
        ["wis", "positive", "[w'is]", "wis"],
        ["wisek", "win", "[w'isek]", "wi.sek"],
        ["wisop", "luck", "[w'isop]", "wi.sop"],
        ["surim", "life", "[s'uɹim]", "su.rim"],
        ["wisur", "victory", "[w'isuɹ]", "wi.sur"],
        ["xisox", "star", "[ks'isoks]", "xi.sox"],
        ["xitar", "galaxy", "[ks'itaɹ]", "xi.tar"],
        ["yiravom", "computer", "[iːɹ'avom]", "yi.ra.vom"],
        ["yural", "courage", "[j'uɹal]", "yu.ral"],
        ["zafatal", "flag", "[zaf'atal]", "za.fa.tal"],
        ["zevat", "item", "[z'evat]", "ze.vat"],
        ["taris", "month", "[t'aɹis]", "ta.ris"],
        ["davir", "day; today", "[d'aviɹ]", "da.vir"],
        ["dazu", "hour", "[d'azu]", "da.zu"],
        ["zalu", "year", "[z'alu]", "za.lu"],
        ["zimi", "minute", "[z'imi]", "zi.mi"],
        ["zaluet", "last year", "[zal'uet]", "za.lu.et"],
        ["i-zalu", "next year", "[iz'alu]", "i.za.lu"],
        ["tariset", "last month", "[taɹ'isɛt]", "ta.ri.set"],
        ["i-taris", "next month", "[it'aɹis]", "i.ta.ris"],
        ["daviret", "yesterday", "[dav'iɹɛt]", "da.vi.ret"],
        ["idavir / aminaro", "tomorrow", "[id'aviɹ] / [amin'aɹo]", "i.da.vir / a.mi.na.ro"],
        ["tarul", "January", "[t'aɹul]", "ta.rul"],
        ["resur", "February", "[ɹ'esuɹ]", "re.sur"],
        ["kilup", "March", "[k'ilup]", "ki.lup"],
        ["votir", "April", "[v'otiɹ]", "vo.tir"],
        ["meka", "May", "[m'eka]", "me.ka"],
        ["xisata", "June", "[ks'isata]", "xi.sa.ta"],
        ["xisere", "July", "[ks'iseɹe]", "xi.se.re"],
        ["xisiki", "August", "[ks'isiki]", "xi.si.ki"],
        ["dalur", "September", "[d'aluɹ]", "da.lur"],
        ["zaivim", "October", "[z'aivim]", "zai.vim"],
        ["fiurua", "November", "[fiuɹ'ua]", "fiu.ru.a"],
        ["xisovo", "December", "[ks'isovo]", "xi.so.vo"],
        ["baba", "father", "[b'aba]", "ba.ba"],
        ["mama", "mother", "[m'ama]", "ma.ma"],
        ["ogababa", "paternal grandfather", "[ogab'aba]", "o.ga.ba.ba"],
        ["ogabafa", "maternal grandfather", "[ogab'afa]", "o.ga.ba.fa"],
        ["ogamama", "paternal grandmother", "[ogam'ama]", "o.ga.ma.ma"],
        ["ogamata", "maternal grandmother", "[ogam'ata]", "o.ga.ma.ta"],
        ["loza", "elder brother", "[l'oza]", "lo.za"],
        ["lozi", "younger brother", "[l'ozi]", "lo.zi"],
        ["leri", "younger sister", "[l'eɹi]", "le.ri"],
        ["lera", "elder sister", "[l'eɹa]", "le.ra"],
        ["asir", "gray", "[as'iɹ]", "a.sir"],
        ["baudr", "dark; deep", "[b'audɹ]", "baudr"],
        ["sinkar", "transparent", "[sink'aɹ]", "sin.kar"],
        ["dalanek", "sky blue", "[dalan'ek]", "da.la.nek"],
        ["duaber", "white", "[d'wabɹ]", "duabr"],
        ["fiurigar", "purple", "[fiuɹig'aɹ]", "fiu.ri.gar"],
        ["kilor", "yellow", "[kil'oɹ]", "ki.lor"],
        ["ligurik", "shining color", "[liguɹ'ik]", "li.gu.rik"],
        ["metin", "cyan", "[met'in]", "me.tin"],
        ["nizor", "bright color", "[niz'oɹ]", "ni.zor"],
        ["nom", "black", "[n'om]", "nom"],
        ["parin", "light colors; pastel colors", "[paɹ'in]", "pa.rin"],
        ["rel", "orange", "[ɹ'el]", "rel"],
        ["takar", "red", "[tak'aɹ]", "ta.kar"],
        ["voli", "green", "[vol'i]", "vo.li"],
        ["yiron", "purple-pink", "[iɹ'on]", "yi.ron"],
        ["yuras", "dark blue", "[juɹ'as]", "yu.ras"],
        ["zair", "ocean blue", "[z'aiɹ]", "zair"],
        ["zimk", "pink", "[z'imk]", "zimk"],
      ];
      const ZH_MEANING = {
        "believe": "相信", "hope": "希望", "be": "是", "have": "拥有", "need, want": "需要、想要",
        "dance": "跳舞", "understand": "理解", "suppose; assume": "假设、认为", "lose": "失去",
        "close": "关闭", "explain": "解释", "cause; make": "导致、使", "arrive": "到达",
        "end; finish": "结束、完成", "request": "请求", "forget": "忘记", "rest": "休息",
        "continue": "继续", "eat": "吃", "drink": "喝", "speak; say": "说、讲话",
        "listen": "听", "open": "打开", "like": "喜欢", "consider": "考虑", "keep": "保持",
        "think": "思考", "challenge": "挑战", "do; make": "做、制造", "decide": "决定", "decision": "决定",
        "belong to": "属于", "love": "爱", "play": "玩、演奏", "shine; illuminate": "发光、照亮",
        "read": "阅读", "research; study": "研究、学习", "talk; converse": "交谈", "remember": "记得",
        "miss": "想念、错过", "write": "写", "meet": "会见", "participate": "参与",
        "describe": "描述", "marry": "结婚", "be called; be named": "被称作、命名为",
        "put; place": "放置", "walk": "行走", "search; look for": "寻找", "follow": "跟随",
        "regard as; treat as": "视作、对待为", "leave": "离开", "rise": "上升", "occupy": "占据",
        "prove": "证明", "aim at": "瞄准、针对", "guide": "引导", "ask": "询问", "choose": "选择",
        "get; obtain": "获得", "prepare": "准备", "answer": "回答", "run": "跑", "return": "返回",
        "tell": "告诉", "paint": "绘画", "sleep": "睡觉", "sing": "唱歌", "study; learn": "学习",
        "teach": "教授", "count": "计数", "live; exist": "生存、存在", "live": "生活",
        "work": "工作", "come": "来", "bring": "带来", "carry": "携带", "begin; start": "开始",
        "stand": "站立", "oppose": "反对", "share": "分享", "want": "想要", "wait": "等待",
        "travel": "旅行", "please": "使满意", "see": "看见", "receive": "接收", "watch": "观看",
        "appreciate; admire": "欣赏、钦佩", "go": "去", "should": "应该", "buy": "购买",
        "month": "月", "day": "天", "day; today": "天、今天", "hour": "小时", "year": "年", "minute": "分钟",
        "last year": "去年", "next year": "明年", "last month": "上个月", "next month": "下个月",
        "yesterday": "昨天", "today": "今天", "tomorrow": "明天",
        "January": "一月", "February": "二月", "March": "三月", "April": "四月",
        "May": "五月", "June": "六月", "July": "七月", "August": "八月",
        "September": "九月", "October": "十月", "November": "十一月", "December": "十二月",
        "father": "父亲", "mother": "母亲",
        "paternal grandfather": "爷爷", "maternal grandfather": "外公",
        "paternal grandmother": "奶奶", "maternal grandmother": "外婆",
        "elder brother": "哥哥", "younger brother": "弟弟",
        "younger sister": "妹妹", "elder sister": "姐姐",
        "gray": "灰色", "dark; deep": "深色、深的", "transparent": "透明",
        "sky blue": "天蓝色", "white": "白色", "purple": "紫色", "yellow": "黄色",
        "shining color": "发亮的颜色", "cyan": "青色", "bright color": "亮色",
        "black": "黑色", "light colors; pastel colors": "浅色、粉彩色",
        "orange": "橙色", "red": "红色", "green": "绿色",
        "purple-pink": "紫粉色", "dark blue": "深蓝色", "ocean blue": "海蓝色", "pink": "粉色",
        "all": "所有、全部", "same": "相同", "new": "新的", "bad": "坏的",
        "clear, clever": "清楚的、聪明的", "good": "好的", "healthy": "健康的",
        "shining": "发亮的", "shining; shining color": "发亮的、发亮颜色的", "impossible": "不可能的", "eternal": "永恒的",
        "possibly": "可能地", "late": "晚的", "brave": "勇敢的", "early": "早的",
        "impossible; light colors; pastel colors": "不可能的、浅色的、粉彩色的",
        "happy; cheerful": "快乐的、开朗的", "angry": "生气的",
        "bright; hopeful": "明亮的、充满希望的", "lovely; kind": "可爱的、善良的",
        "calm": "平静的", "sad; distressed": "悲伤的、苦恼的",
        "fearful; terrified": "害怕的、惊恐的", "anxious; uneasy": "焦虑的、不安的",
        "lonely": "孤独的", "excited": "兴奋的",
        "clearly": "清楚地", "impossibly": "不可能地", "possibly": "可能地",
        "completely": "完全地", "equally": "同样地", "newly": "新近地", "badly": "糟糕地",
        "well": "好地", "healthily": "健康地", "eternally": "永远地",
        "bravely": "勇敢地", "early": "早早地", "happily; cheerfully": "快乐地、开朗地",
        "angrily": "愤怒地", "brightly; hopefully": "明亮地、充满希望地",
        "lovely; kindly": "可爱地、善良地", "calmly": "平静地",
        "sadly; distressedly": "悲伤地、苦恼地", "fearfully; terrifiedly": "害怕地、惊恐地",
        "anxiously; uneasily": "焦虑地、不安地", "lonelily": "孤独地", "excitedly": "兴奋地",
        "darkly; deeply": "深沉地", "transparently": "透明地", "in sky blue": "以天蓝色",
        "in white": "以白色", "in purple": "以紫色", "in yellow": "以黄色",
        "with a shining color": "带发亮颜色地", "in cyan": "以青色", "with a bright color": "带亮色地",
        "in black": "以黑色", "in pastel colors": "以浅色、粉彩色", "in orange": "以橙色",
        "in red": "以红色", "in green": "以绿色", "in purple-pink": "以紫粉色",
        "in dark blue": "以深蓝色", "in ocean blue": "以海蓝色", "in pink": "以粉色",
        "according to": "根据", "because of / due to": "因为、由于", "in": "在……里面",
        "away from": "远离", "between": "在……之间", "depending on": "取决于",
        "over": "在……上方", "behind": "在……后面", "until": "直到", "under": "在……下面",
        "beside": "在……旁边", "without": "没有", "toward": "朝向", "or": "或者",
        "on": "在……上", "about": "关于", "through": "穿过", "in front of": "在……前面",
        "near": "靠近", "for": "为了", "below": "在……下方", "during": "在……期间",
        "from ... to ...": "从……到……",
        "and": "和", "but": "但是", "then / and then": "然后", "because": "因为", "if": "如果",
        "why": "为什么", "how long": "多久", "which": "哪个", "how": "怎样",
        "who": "谁", "when": "什么时候", "which kind": "哪一种",
        "Is this possible?": "这可能吗？", "how many / how much (amount)": "多少",
        "what": "什么", "is it": "是……吗", "where": "哪里",
        "wish": "愿望", "guard; protection": "守卫、保护", "something bad": "坏事", "window": "窗户",
        "nationality": "国籍", "country": "国家", "heart": "心", "hand": "手", "something good": "好事",
        "nature": "自然", "driver": "司机", "dictionary": "词典", "number": "数字", "language": "语言",
        "mind": "思想", "knowledge": "知识", "intelligence": "智力", "wisdom": "智慧", "light, flash": "光、闪光", "pencil": "铅笔",
        "photo": "照片", "video": "视频", "door": "门", "song": "歌曲", "dialogue": "对话",
        "suitcase": "手提箱", "plan": "计划", "diary": "日记", "young person": "年轻人", "power": "力量",
        "right": "权利", "map": "地图", "place": "地点", "possibly": "可能", "bird": "鸟", "flower": "花",
        "world": "世界", "system": "系统", "student": "学生", "teacher": "老师", "school": "学校",
        "society": "社会", "civilian": "平民", "peace": "和平", "horse": "马", "course": "课程", "war": "战争",
        "win": "胜利", "life": "生命",
        "question": "问题", "word": "词", "movement": "运动", "traveler": "旅行者", "passenger": "乘客",
        "bus": "公交车", "positive": "积极", "luck": "运气", "victory": "胜利", "star": "星星",
        "galaxy": "星系", "computer": "电脑", "courage": "勇气", "flag": "旗帜", "item": "物品"
      };
      window.SPIRETZ_ZH_MEANING = ZH_MEANING;

      const VERB_MEANING = Object.fromEntries(VERBS);

      const QUIZ_ZH = {
        "Yes": "是",
        "No": "否",
        "Only in the south": "只在南部",
        "Only for verbs": "只用于动词",
        "a vowel": "元音",
        "a consonant": "辅音",
        "either": "都可以",
        "a glide only": "仅滑音",
        "i- (prefix)": "i-（前缀）",
        "-et (suffix)": "-et（后缀）",
        "unmarked (no suffix)": "不标记（无后缀）",
        "mi (particle)": "mi（助词）",
        "zekuk / ze at the beginning": "句首加 zekuk / ze",
        "before verbs or nouns": "置于动词或名词前",
        "demonstratives (this/that)": "用指示词（this/that）",
        "(Topic) + (Article) + (Number) + Noun + Adjective": "（话题）+（冠词）+（数词）+ 名词 + 形容词",
        "Noun + Article + Number + Adjective": "名词 + 冠词 + 数词 + 形容词",
        "Article + Noun + Adjective + Number": "冠词 + 名词 + 形容词 + 数词",
        "Noun + Number + Article + Adjective": "名词 + 数词 + 冠词 + 形容词",
        "an explicit subordinator": "显式从属连词",
        "| ... |": "| ... |",
        "SVO": "SVO",
        "SOV": "SOV",
        "VSO": "VSO",
        "OSV": "OSV",
        "1st person singular": "第一人称单数",
        "1st person plural": "第一人称复数",
        "2nd person singular": "第二人称单数",
        "2nd person plural": "第二人称复数",
        "3rd person singular": "第三人称单数",
        "3rd person plural": "第三人称复数",
        "Nominative": "主格",
        "Accusative": "宾格",
        "Genitive": "属格",
        "Dative": "与格",
        "Ablative": "离格",
        "Subject": "主语",
        "Direct Object": "直接宾语",
        "Possessive": "所属/所有",
        "Indirect Object / Recipient": "间接宾语/受事者",
        "Source / from where": "来源/来自何处",
        "indefinite reference": "不定指",
        "definite reference": "定指",
        "Declarative/Indicative": "陈述/直陈",
        "Optative/Subjunctive": "愿望/虚拟",
        "Imperative": "祈使",
        "Negative": "否定",
        "subject agreement": "主语一致",
        "the verb root": "动词词根",
        "the question marker": "问句标记",
        "the noun class": "名词类别",
        "first": "在前",
        "after the possessed noun": "在被拥有名词之后",
        "after the adjective": "在形容词之后",
        "only at the end of the clause": "只在句末",
        "recipient first, source second": "先接收者，后来源",
        "source first after the verb": "来源短语先出现在动词后",
        "a separate phrase": "独立短语",
        "after the noun": "在名词之后",
        "the possessed noun": "被拥有名词",
        "the possessor": "所有者",
        "Static": "静态",
        "Dynamic": "动态",
        "No, they are silent in writing only": "不，它们只是书写中的静默标记",
        "Yes, always": "是，总是发音",
        "Only in poetry": "只在诗歌中发音",
        "Only in questions": "只在问句中发音",
        "and": "和",
        "or (exclusive)": "或（排他）",
        "but": "但是",
        "then / and then": "然后",
        "because": "因为",
        "if": "如果",
        "part of the vowel": "元音的一部分",
        "the glide [j]": "滑音 [j]",
        "a click": "点击音",
        "a nasal": "鼻音",
        "January": "一月",
        "February": "二月",
        "March": "三月",
        "April": "四月",
        "May": "五月",
        "June": "六月",
        "July": "七月",
        "August": "八月",
        "September": "九月",
        "October": "十月",
        "November": "十一月",
        "December": "十二月",
      };
      const QUIZ_PROMPT_ZH = {
        "In Spiretz, <c> before <i> is pronounced:": "在 Spiretz 中，<c> 位于 <i> 前时读作：",
        "Type the diphthong spelling for IPA [wɑ].": "请输入 IPA [wɑ] 对应的双元音拼写。",
        "Which spelling is a contrastive length vowel?": "哪个拼写是对立长音元音？",
        "What marks present tense?": "现在时如何标记？",
        "What is the future tense marker?": "将来时标记是什么？",
        "What is the past tense marker?": "过去时标记是什么？",
        "What marks imperfect aspect?": "未完成体如何标记？",
        "Perfect/Completed aspect marker is:": "完成体标记是：",
        "Habitual aspect marker is:": "习惯体标记是：",
        "Iterative/Repetitive aspect marker is:": "反复体标记是：",
        "Optative/Subjunctive mood suffix is:": "愿望/虚拟语气后缀是：",
        "Declarative/Indicative mood is:": "陈述/直陈语气如何标记？",
        "Negation word is:": "否定词是：",
        "Topic marker is:": "话题标记是：",
        "Dynamic marker (final suffix) is:": "动态标记（末尾后缀）是：",
        "Direct object marker on the verb is:": "动词上的直接宾语标记是：",
        "Genitive (possessive) suffix is:": "属格（所有）后缀是：",
        "Plural noun suffix is:": "名词复数后缀是：",
        "Adjectives must end in:": "形容词必须以什么结尾：",
        "Nouns must end in:": "名词必须以什么结尾：",
        "Verbs (with no conjugation) must end in:": "动词（不含变位）必须以什么结尾：",
        "Type the dative (recipient) marker.": "请输入与格（受事者）标记。",
        "Reflexive direct object marker is:": "反身直接宾语标记是：",
        "Human direct object suffix (after -ta) is:": "人类直接宾语后缀（在 -ta 后）是：",
        "Royal direct object suffix (after -ta) is:": "皇室直接宾语后缀（在 -ta 后）是：",
        "Yes–no questions are formed by placing:": "是非问句通过以下方式构成：",
        "Negation particle mi is placed:": "否定助词 mi 的位置是：",
        "Indefinite article is:": "不定冠词是：",
        "Definite reference is expressed using:": "定指通过以下方式表达：",
        "Default noun phrase order is:": "默认名词短语顺序是：",
        "Default declarative word order is:": "默认陈述句语序是：",
        "Imperative word order is:": "祈使句语序是：",
        "In formal writing, subclauses are enclosed with:": "正式书写中，从句用以下符号包围：",
        "Subclauses are introduced by:": "从句由以下方式引入：",
        "The star-month prefix is:": "星月前缀是：",
        "When \"y\" appears in yi/ye, it functions as:": "当“y”出现在 yi/ye 中时，它的作用是：",
        "Outside yi/ye, \"y\" represents:": "在 yi/ye 之外，“y”表示：",
        "Which noun means \"(.+)\"?": "",
        "What does the noun \"(.+)\" mean?": "",
        "Which pronunciation matches the noun \"(.+)\"?": "",
        "Which syllable split matches the noun \"(.+)\"?": "",
        "Which pronoun class is used for animate referents?": "哪一个代词类别用于有生指称？",
        "Which pronoun class is used for inanimate referents?": "哪一个代词类别用于无生指称？",
        "Do noun classes affect verb conjugation?": "名词类别会影响动词变位吗？",
        "Direct/witnessed information uses which mood?": "直接/目击信息使用哪种语气？",
        "Hearsay/inferred information uses which mood?": "传闻/推断信息使用哪种语气？",
        "Which conjunction is exclusive by default?": "哪个连词默认表示排他性“或”？",
        "To express inclusive \"or\", Spiretz adds:": "要表达包含性的“或”，Spiretz 会加上：",
        "Does clause-internal word order change inside subclauses?": "从句内部语序会改变吗？",
        "When the subject is unknown in a question, what may be omitted?": "当问句中的主语未知时，可以省略什么？",
        "In a possessive phrase, the possessor takes which suffix?": "在所属结构中，所有者带哪个后缀？",
        "In a possessive phrase, the possessor appears:": "在所属结构中，所有者的位置是：",
        "Which linker marks that an adjective modifies the possessor?": "哪个连接符标记形容词修饰所有者？",
        "Is the possessor linker \"n\" pronounced?": "所有者连接符“n”发音吗？",
        "Can \"ng\" appear in onset position?": "“ng”可以出现在声母位置吗？",
        "The article \"tas\" marks:": "冠词“tas”标记什么？",
        "If both dative and source are present, the order is:": "如果与格和来源同时出现，顺序是：",
        "If there is no dative, the source phrase appears:": "如果没有与格，来源短语出现在哪里？",
        "Ablative/source is expressed as:": "离格/来源如何表达？",
        "Adjectives normally appear:": "形容词通常出现在哪里？",
        "After the possessed noun, the adjective normally describes:": "放在被拥有名词之后的形容词通常修饰：",
        "Static vs. dynamic: which one is unmarked by default?": "静态和动态中，哪一个默认不标记？",
        "Are the subclause boundary markers | ... | pronounced?": "从句边界符 | ... | 会发音吗？",
      };
      const zhTerm = (s) => {
        const t = String(s || "");
        if (QUIZ_ZH[t]) return QUIZ_ZH[t];
        if (ZH_MEANING[t]) return ZH_MEANING[t];
        return t;
      };
      function zhQuizText(text) {
        if (!IS_ZH) return text;
        const t = String(text || "");
        if (QUIZ_PROMPT_ZH[t]) return QUIZ_PROMPT_ZH[t];
        let m;
        if ((m = t.match(/^Which spelling corresponds to IPA (.+)\?$/))) return `哪个拼写对应 IPA ${m[1]}？`;
        if ((m = t.match(/^Which IPA corresponds to spelling "(.+)"\?$/))) return `拼写“${m[1]}”对应的 IPA 是哪个？`;
        if ((m = t.match(/^Type the IPA for spelling "(.+)"\.$/))) return `请输入拼写“${m[1]}”的 IPA。`;
        if ((m = t.match(/^Which subject suffix marks (.+)\?$/))) return `哪个主语后缀标记${zhTerm(m[1])}？`;
        if ((m = t.match(/^The subject suffix "(.+)" marks:$/))) return `主语后缀“${m[1]}”标记：`;
        if ((m = t.match(/^What does "(.+)" mean\?$/))) return `“${m[1]}”是什么意思？`;
        if ((m = t.match(/^Which verb means "(.+)"\?$/))) return `哪个动词表示“${zhTerm(m[1])}”？`;
        if ((m = t.match(/^What does the noun "(.+)" mean\?$/))) return `名词“${m[1]}”是什么意思？`;
        if ((m = t.match(/^Which noun means "(.+)"\?$/))) return `哪个名词表示“${zhTerm(m[1])}”？`;
        if ((m = t.match(/^Which pronunciation matches the noun "(.+)"\?$/))) return `哪个发音对应名词“${m[1]}”？`;
        if ((m = t.match(/^Which syllable split matches the noun "(.+)"\?$/))) return `哪个音节切分对应名词“${m[1]}”？`;
        if ((m = t.match(/^Which case uses marker "(.+)"\?$/))) return `哪个格使用标记“${m[1]}”？`;
        if ((m = t.match(/^The (.+) case primarily marks:$/))) return `${zhTerm(m[1])}主要标记：`;
        if ((m = t.match(/^Which pronoun is (.+) person (.+)\?$/))) return `哪个代词是${zhTerm(`${m[1]} person ${m[2]}`)}？`;
        if ((m = t.match(/^Digit word for (\d+) \(base-10\) is:$/))) return `十进制数字 ${m[1]} 的 Spiretz 数词是：`;
        if ((m = t.match(/^Type the Spiretz digit word for (\d+)\.$/))) return `请输入数字 ${m[1]} 的 Spiretz 数词。`;
        if ((m = t.match(/^Which conjunction means "(.+)"\?$/))) return `哪个连词表示“${zhTerm(m[1])}”？`;
        if ((m = t.match(/^Which month is "(.+)"\?$/))) return `“${m[1]}”是哪个月份？`;
        if ((m = t.match(/^What is the Spiretz name for (.+)\?$/))) return `${zhTerm(m[1])} 的 Spiretz 名称是什么？`;
        if ((m = t.match(/^Is "(.+)" an allowed syllable pattern in words \(including names\)\?$/))) return `“${m[1]}”是允许的音节结构吗（包括姓名）？`;
        if ((m = t.match(/^Choose the correct Spiretz verb form for: "(.+)"$/))) return `请选择正确的 Spiretz 动词形式：\n“${m[1]}”`;
        if ((m = t.match(/^Choose the correct gloss for: "(.+)"$/))) return `请选择正确释义：\n“${m[1]}”`;
        return zhTerm(t);
      }

      const SUBJECT_SUFFIX = {
        "omit": "",
        "1sg": "t",
        "1pl": "wen",
        "2sg": "ya",
        "2pl": "yen",
        "3sg": "se",
        "3pl": "ten",
      };

      const SUBJECT_EN = {
        "omit": "(someone)",
        "1sg": "I",
        "1pl": "we",
        "2sg": "you",
        "2pl": "you (pl)",
        "3sg": "spirete/tatie (sg)",
        "3pl": "spireten/tatien (pl)",
      };

      const ASPECT_SUFFIX = {
        "none": "",
        "im": "im",
        "ul": "ul",
        "en": "en",
      };

      const MOOD_SUFFIX = {
        "none": "",
        "el": "el",
      };

      const VOWELS = [
        { spelling: "i", ipa: "i" },
        { spelling: "ei", ipa: "e" },
        { spelling: "e", ipa: "ɛ" },
        { spelling: "ae", ipa: "æ" },
        { spelling: "u", ipa: "u" },
        { spelling: "oe", ipa: "ʊ" },
        { spelling: "o", ipa: "o" },
        { spelling: "a", ipa: "ɑ" },
        { spelling: "ai", ipa: "ɑi" },
        { spelling: "iu", ipa: "ju" },
        { spelling: "au", ipa: "ɑu" },
        { spelling: "ua", ipa: "wɑ" },
        { spelling: "yi", ipa: "iː" },
        { spelling: "ye", ipa: "ɛː" },
      ];

      const CONSONANTS = [
        { spelling: "p", ipa: "p" },
        { spelling: "b", ipa: "b" },
        { spelling: "t", ipa: "t" },
        { spelling: "d", ipa: "d" },
        { spelling: "k", ipa: "k" },
        { spelling: "g", ipa: "g" },
        { spelling: "f", ipa: "f" },
        { spelling: "v", ipa: "v" },
        { spelling: "s", ipa: "s" },
        { spelling: "z", ipa: "z" },
        { spelling: "sh", ipa: "ʃ" },
        { spelling: "h", ipa: "h" },
        { spelling: "ch", ipa: "ʧ" },
        { spelling: "m", ipa: "m" },
        { spelling: "n", ipa: "n" },
        { spelling: "ng", ipa: "ŋ" },
        { spelling: "r", ipa: "ɹ" },
        { spelling: "l", ipa: "l" },
        { spelling: "w", ipa: "w" },
        { spelling: "y", ipa: "j" },
        { spelling: "x", ipa: "ks" },
      ];

      const PRONOUNS = [
        { person: "1st", number: "singular", form: "wio" },
        { person: "1st", number: "plural", form: "wol" },
        { person: "2nd", number: "singular", form: "nye" },
        { person: "2nd", number: "plural", form: "nyeya" },
        { person: "3rd", number: "singular", form: "spirete / tatie" },
        { person: "3rd", number: "plural", form: "spireten / tatien" },
      ];

      const CASES = [
        { name: "Nominative", marker: "∅", function: "Subject" },
        { name: "Accusative", marker: "-ta", function: "Direct Object" },
        { name: "Genitive", marker: "-e", function: "Possessive" },
        { name: "Dative", marker: "k-", function: "Indirect Object / Recipient" },
        { name: "Ablative", marker: "separate phrase", function: "Source / from where" },
      ];

      const DIGITS = [
        { value: "0", word: "zu" },
        { value: "1", word: "ta" },
        { value: "2", word: "re" },
        { value: "3", word: "ki" },
        { value: "4", word: "vo" },
        { value: "5", word: "me" },
        { value: "6", word: "dal" },
        { value: "7", word: "zai" },
        { value: "8", word: "fiu" },
        { value: "9", word: "no" },
      ];

      const CONJUNCTIONS = [
        { form: "pa", meaning: "and" },
        { form: "utrez", meaning: "or (exclusive)" },
        { form: "zai", meaning: "but" },
        { form: "lunte", meaning: "then / and then" },
        { form: "bey", meaning: "because" },
        { form: "eki", meaning: "if" },
      ];

      const MONTHS = [
        { en: "January", sp: "tarul" },
        { en: "February", sp: "resur" },
        { en: "March", sp: "kilup" },
        { en: "April", sp: "votir" },
        { en: "May", sp: "meka" },
        { en: "June", sp: "xisata" },
        { en: "July", sp: "xisere" },
        { en: "August", sp: "xisiki" },
        { en: "September", sp: "dalur" },
        { en: "October", sp: "zaivim" },
        { en: "November", sp: "fiurua" },
        { en: "December", sp: "xisovo" },
      ];

      const SYLLABLE_PATTERNS = ["V", "CV", "VC", "CCV", "CCCV", "CVC", "VCC", "VCCC", "CVCC", "CVCCC", "CCVC", "CCCVC", "CCVCC"];

      const TEMPLATE_POOL = [];

      function addTemplate(fn) {
        TEMPLATE_POOL.push(fn);
      }

      function pickOptions(list, correct, count) {
        const pool = list.filter((v) => v !== correct);
        const shuffled = shuffle(pool);
        const opts = [correct, ...shuffled.slice(0, Math.max(0, count - 1))];
        return shuffle(opts);
      }

      function makeMcq(prompt, correct, options, signature, concept) {
        return { id: signature, type: "mcq", prompt, options, answer: correct, signature, concept: concept || signature };
      }

      function makeTyped(prompt, answers, signature, concept) {
        return { id: signature, type: "text", prompt, answers, signature, concept: concept || signature };
      }

      VOWELS.forEach((v) => {
        const concept = `vowel_${v.spelling}`;
        addTemplate(() => makeMcq(
          `Which spelling corresponds to IPA [${v.ipa}]?`,
          v.spelling,
          pickOptions(VOWELS.map(x => x.spelling), v.spelling, 4),
          `vowel_spell_${v.spelling}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `Which IPA corresponds to spelling "${v.spelling}"?`,
          `[${v.ipa}]`,
          pickOptions(VOWELS.map(x => `[${x.ipa}]`), `[${v.ipa}]`, 4),
          `vowel_ipa_${v.spelling}`,
          concept
        ));
        addTemplate(() => makeTyped(
          `Type the IPA for spelling "${v.spelling}".`,
          [`[${v.ipa}]`, v.ipa],
          `vowel_typed_${v.spelling}`,
          concept
        ));
      });

      CONSONANTS.forEach((c) => {
        const concept = `consonant_${c.spelling}`;
        addTemplate(() => makeMcq(
          `Which IPA corresponds to spelling "${c.spelling}"?`,
          `[${c.ipa}]`,
          pickOptions(CONSONANTS.map(x => `[${x.ipa}]`), `[${c.ipa}]`, 4),
          `cons_ipa_${c.spelling}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "In Spiretz, <c> before <i> is pronounced:",
        "[s]",
        ["[s]", "[k]", "[ʧ]", "[ʃ]"],
        "rule_c_before_i",
        "rule_c_before_i"
      ));

      addTemplate(() => makeTyped(
        "Type the diphthong spelling for IPA [wɑ].",
        ["ua"],
        "diphthong_ua",
        "diphthong_ua"
      ));

      addTemplate(() => makeMcq(
        "Which spelling is a contrastive length vowel?",
        "yi",
        ["yi", "ai", "au", "ua"],
        "length_vowel_yi",
        "length_vowel_yi"
      ));

      addTemplate(() => makeMcq(
        "What marks present tense?",
        "unmarked (no suffix)",
        ["unmarked (no suffix)", "i- (prefix)", "-et (suffix)", "-el (suffix)"],
        "tense_present",
        "tense_present"
      ));
      addTemplate(() => makeMcq(
        "What is the future tense marker?",
        "i- (prefix)",
        ["i- (prefix)", "-et (suffix)", "unmarked (no suffix)", "mi (particle)"],
        "tense_future",
        "tense_future"
      ));
      addTemplate(() => makeMcq(
        "What is the past tense marker?",
        "-et (suffix)",
        ["-et (suffix)", "i- (prefix)", "unmarked (no suffix)", "k- (prefix)"],
        "tense_past",
        "tense_past"
      ));
      addTemplate(() => makeMcq(
        "What marks imperfect aspect?",
        "unmarked (no suffix)",
        ["unmarked (no suffix)", "-im", "-ul", "-en"],
        "aspect_imperfect",
        "aspect_imperfect"
      ));
      addTemplate(() => makeMcq(
        "Perfect/Completed aspect marker is:",
        "-im",
        ["-im", "unmarked (no suffix)", "-ul", "-en"],
        "aspect_perfect",
        "aspect_perfect"
      ));
      addTemplate(() => makeMcq(
        "Habitual aspect marker is:",
        "-ul",
        ["-ul", "unmarked (no suffix)", "-im", "-en"],
        "aspect_habitual",
        "aspect_habitual"
      ));
      addTemplate(() => makeMcq(
        "Iterative/Repetitive aspect marker is:",
        "-en",
        ["-en", "unmarked (no suffix)", "-im", "-ul"],
        "aspect_iterative",
        "aspect_iterative"
      ));
      addTemplate(() => makeMcq(
        "Optative/Subjunctive mood suffix is:",
        "-el",
        ["-el", "unmarked (no suffix)", "-im", "-et"],
        "mood_optative",
        "mood_optative"
      ));
      addTemplate(() => makeMcq(
        "Declarative/Indicative mood is:",
        "unmarked (no suffix)",
        ["unmarked (no suffix)", "-el", "-im", "-et"],
        "mood_declarative",
        "mood_declarative"
      ));
      addTemplate(() => makeMcq(
        "Negation word is:",
        "mi",
        ["mi", "zo", "pa", "k-"],
        "negation_word",
        "negation_word"
      ));
      addTemplate(() => makeMcq(
        "Topic marker is:",
        "zo",
        ["zo", "mi", "pa", "k-"],
        "topic_marker",
        "topic_marker"
      ));
      addTemplate(() => makeMcq(
        "Dynamic marker (final suffix) is:",
        "-og",
        ["-og", "-im", "-el", "-ul"],
        "dynamic_marker",
        "dynamic_marker"
      ));
      addTemplate(() => makeMcq(
        "Direct object marker on the verb is:",
        "-ta",
        ["-ta", "-e", "k-", "zo"],
        "direct_object",
        "direct_object"
      ));
      addTemplate(() => makeMcq(
        "Ablative/source is expressed as:",
        "a separate phrase",
        ["a separate phrase", "a suffix -se", "a prefix a-", "a topic marker"],
        "ablative_expression",
        "ablative_expression"
      ));
      addTemplate(() => makeMcq(
        "Genitive (possessive) suffix is:",
        "-e",
        ["-e", "-ta", "-og", "-en"],
        "genitive_marker",
        "genitive_marker"
      ));
      addTemplate(() => makeMcq(
        "Plural noun suffix is:",
        "-an",
        ["-an", "-et", "-sa", "-el"],
        "plural_marker",
        "plural_marker"
      ));
      addTemplate(() => makeMcq(
        "Adjectives must end in:",
        "a vowel",
        ["a vowel", "a consonant", "either", "a glide only"],
        "adj_endings",
        "adj_endings"
      ));
      addTemplate(() => makeMcq(
        "Nouns must end in:",
        "a consonant",
        ["a consonant", "a vowel", "either", "a glide only"],
        "noun_endings",
        "noun_endings"
      ));
      addTemplate(() => makeMcq(
        "Verbs (with no conjugation) must end in:",
        "a vowel",
        ["a vowel", "a consonant", "either", "a glide only"],
        "verb_endings",
        "verb_endings"
      ));
      addTemplate(() => makeTyped(
        "Type the dative (recipient) marker.",
        ["k-", "k"],
        "dative_typed",
        "dative_marker"
      ));

      const SUBJECT_LABELS = {
        "1sg": "1st person singular",
        "1pl": "1st person plural",
        "2sg": "2nd person singular",
        "2pl": "2nd person plural",
        "3sg": "3rd person singular",
        "3pl": "3rd person plural",
      };

      Object.keys(SUBJECT_SUFFIX).forEach((key) => {
        if (key === "omit") return;
        const suffix = SUBJECT_SUFFIX[key];
        const label = SUBJECT_LABELS[key] || key;
        const concept = `subj_${key}`;
        addTemplate(() => makeMcq(
          `Which subject suffix marks ${label}?`,
          suffix,
          pickOptions(Object.values(SUBJECT_SUFFIX).filter(v => v), suffix, 4),
          `subj_suffix_${key}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `The subject suffix "${suffix}" marks:`,
          label,
          pickOptions(Object.values(SUBJECT_LABELS), label, 4),
          `subj_label_${key}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "Reflexive direct object marker is:",
        "te",
        ["te", "ta", "k-", "mi"],
        "reflexive_marker",
        "reflexive_marker"
      ));
      addTemplate(() => makeMcq(
        "Human direct object suffix (after -ta) is:",
        "sa",
        ["sa", "x", "ta", "e"],
        "human_object_suffix",
        "human_object_suffix"
      ));
      addTemplate(() => makeMcq(
        "Royal direct object suffix (after -ta) is:",
        "x",
        ["x", "sa", "ta", "e"],
        "royal_object_suffix",
        "royal_object_suffix"
      ));
      addTemplate(() => makeMcq(
        "Yes–no questions are formed by placing:",
        "zekuk / ze at the beginning",
        ["zekuk / ze at the beginning", "mi after the verb", "ta before the verb", "zo at the end"],
        "yesno_marker",
        "yesno_marker"
      ));
      addTemplate(() => makeMcq(
        "Negation particle mi is placed:",
        "before verbs or nouns",
        ["before verbs or nouns", "after the verb only", "as a suffix on adjectives", "before the subject"],
        "negation_placement",
        "negation_placement"
      ));

      VERBS.forEach(([verb, meaning]) => {
        const concept = `verb_def_${verb}`;
        addTemplate(() => makeMcq(
          `What does "${verb}" mean?`,
          meaning,
          pickOptions(VERBS.map(x => x[1]), meaning, 4),
          `verb_meaning_${verb}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `Which verb means "${meaning}"?`,
          verb,
          pickOptions(VERBS.map(x => x[0]), verb, 4),
          `verb_form_${verb}`,
          concept
        ));
      });

      NOUNS.forEach(([noun, meaning, pronunciation, syllables]) => {
        const concept = `noun_${noun}`;
        addTemplate(() => makeMcq(
          `What does the noun "${noun}" mean?`,
          meaning,
          pickOptions(NOUNS.map(x => x[1]), meaning, 4),
          `noun_meaning_${noun}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `Which noun means "${meaning}"?`,
          noun,
          pickOptions(NOUNS.map(x => x[0]), noun, 4),
          `noun_form_${noun}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `Which pronunciation matches the noun "${noun}"?`,
          pronunciation,
          pickOptions(NOUNS.map(x => x[2]), pronunciation, 4),
          `noun_pron_${noun}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `Which syllable split matches the noun "${noun}"?`,
          syllables,
          pickOptions(NOUNS.map(x => x[3]), syllables, 4),
          `noun_syll_${noun}`,
          concept
        ));
      });

      CASES.forEach((c) => {
        const concept = `case_${c.name}`;
        addTemplate(() => makeMcq(
          `Which case uses marker "${c.marker}"?`,
          c.name,
          pickOptions(CASES.map(x => x.name), c.name, 4),
          `case_marker_${c.name}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `The ${c.name} case primarily marks:`,
          c.function,
          pickOptions(CASES.map(x => x.function), c.function, 4),
          `case_function_${c.name}`,
          concept
        ));
      });

      PRONOUNS.forEach((p) => {
        const concept = `pronoun_${p.person}_${p.number}`;
        addTemplate(() => makeMcq(
          `Which pronoun is ${p.person} person ${p.number}?`,
          p.form,
          pickOptions(PRONOUNS.map(x => x.form), p.form, 4),
          `pronoun_${p.person}_${p.number}`,
          concept
        ));
      });

      DIGITS.forEach((d) => {
        const concept = `digit_${d.value}`;
        addTemplate(() => makeMcq(
          `Digit word for ${d.value} (base-10) is:`,
          d.word,
          pickOptions(DIGITS.map(x => x.word), d.word, 4),
          `digit_word_${d.value}`,
          concept
        ));
        addTemplate(() => makeTyped(
          `Type the Spiretz digit word for ${d.value}.`,
          [d.word],
          `digit_typed_${d.value}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "Indefinite article is:",
        "tas",
        ["tas", "zo", "mi", "pa"],
        "article_indef",
        "article_indef"
      ));
      addTemplate(() => makeMcq(
        "Definite reference is expressed using:",
        "demonstratives (this/that)",
        ["demonstratives (this/that)", "a suffix -e", "a prefix k-", "a particle mi"],
        "article_def",
        "article_def"
      ));
      addTemplate(() => makeMcq(
        "The article \"tas\" marks:",
        "indefinite reference",
        ["indefinite reference", "definite reference", "topic", "negation"],
        "article_tas_function",
        "article_tas_function"
      ));
      addTemplate(() => makeMcq(
        "Default noun phrase order is:",
        "(Topic) + (Article) + (Number) + Noun + Adjective",
        [
          "(Topic) + (Article) + (Number) + Noun + Adjective",
          "Noun + Article + Number + Adjective",
          "Article + Noun + Adjective + Number",
          "Noun + Number + Article + Adjective"
        ],
        "noun_phrase_order",
        "noun_phrase_order"
      ));
      addTemplate(() => makeMcq(
        "Adjectives normally appear:",
        "after the noun",
        ["after the noun", "before the noun", "before the article", "only clause-finally"],
        "adjective_position",
        "adjective_position"
      ));

      addTemplate(() => makeMcq(
        "Default declarative word order is:",
        "SVO",
        ["SVO", "SOV", "VSO", "OSV"],
        "word_order_decl",
        "word_order_decl"
      ));
      addTemplate(() => makeMcq(
        "Imperative word order is:",
        "SOV",
        ["SOV", "SVO", "VSO", "OSV"],
        "word_order_imp",
        "word_order_imp"
      ));

      CONJUNCTIONS.forEach((c) => {
        const concept = `conj_${c.form}`;
        addTemplate(() => makeMcq(
          `Which conjunction means "${c.meaning}"?`,
          c.form,
          pickOptions(CONJUNCTIONS.map(x => x.form), c.form, 4),
          `conj_${c.form}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "In formal writing, subclauses are enclosed with:",
        "| ... |",
        ["| ... |", "( ... )", "{ ... }", "[ ... ]"],
        "subclause_markers",
        "subclause_markers"
      ));
      addTemplate(() => makeMcq(
        "Subclauses are introduced by:",
        "an explicit subordinator",
        ["an explicit subordinator", "a case suffix", "a verb prefix", "a topic marker"],
        "subclause_intro",
        "subclause_intro"
      ));
      addTemplate(() => makeMcq(
        "Does clause-internal word order change inside subclauses?",
        "No",
        ["No", "Yes, it becomes SOV", "Yes, it becomes VSO", "Yes, it becomes OSV"],
        "subclause_order_same",
        "subclause_order_same"
      ));
      addTemplate(() => makeMcq(
        "Are the subclause boundary markers | ... | pronounced?",
        "No, they are silent in writing only",
        ["No, they are silent in writing only", "Yes, always", "Only in poetry", "Only in questions"],
        "subclause_bars_silent",
        "subclause_bars_silent"
      ));
      addTemplate(() => makeMcq(
        "Direct/witnessed information uses which mood?",
        "Declarative/Indicative",
        ["Declarative/Indicative", "Optative/Subjunctive", "Imperative", "Negative"],
        "evidential_direct",
        "evidential_direct"
      ));
      addTemplate(() => makeMcq(
        "Hearsay/inferred information uses which mood?",
        "Optative/Subjunctive",
        ["Optative/Subjunctive", "Declarative/Indicative", "Imperative", "Negative"],
        "evidential_hearsay",
        "evidential_hearsay"
      ));
      addTemplate(() => makeMcq(
        "Which pronoun class is used for animate referents?",
        "spirete",
        ["spirete", "tatie", "wio", "nye"],
        "noun_class_animate",
        "noun_class_animate"
      ));
      addTemplate(() => makeMcq(
        "Which pronoun class is used for inanimate referents?",
        "tatie",
        ["tatie", "spirete", "wol", "nyeya"],
        "noun_class_inanimate",
        "noun_class_inanimate"
      ));
      addTemplate(() => makeMcq(
        "Do noun classes affect verb conjugation?",
        "No",
        ["No", "Yes", "Only in writing", "Only in the past tense"],
        "noun_class_verbs",
        "noun_class_verbs"
      ));
      addTemplate(() => makeMcq(
        "When the subject is unknown in a question, what may be omitted?",
        "subject agreement",
        ["subject agreement", "the verb root", "the question marker", "the noun class"],
        "question_deletion_subject",
        "question_deletion_subject"
      ));
      addTemplate(() => makeMcq(
        "Which conjunction is exclusive by default?",
        "utrez",
        ["utrez", "pa", "zai", "lunte"],
        "conj_exclusive_or",
        "conj_exclusive_or"
      ));
      addTemplate(() => makeMcq(
        "To express inclusive \"or\", Spiretz adds:",
        "ve",
        ["ve", "zo", "mi", "tas"],
        "conj_inclusive_or",
        "conj_inclusive_or"
      ));
      addTemplate(() => makeMcq(
        "In a possessive phrase, the possessor takes which suffix?",
        "-e",
        ["-e", "-ta", "-an", "-el"],
        "possessor_suffix",
        "possessor_suffix"
      ));
      addTemplate(() => makeMcq(
        "In a possessive phrase, the possessor appears:",
        "first",
        ["first", "after the possessed noun", "after the adjective", "only at the end of the clause"],
        "possessor_order",
        "possessor_order"
      ));
      addTemplate(() => makeMcq(
        "After the possessed noun, the adjective normally describes:",
        "the possessed noun",
        ["the possessed noun", "the possessor", "both equally", "only the article"],
        "possessed_adj_scope",
        "possessed_adj_scope"
      ));
      addTemplate(() => makeMcq(
        "Which linker marks that an adjective modifies the possessor?",
        "n",
        ["n", "m", "zo", "ve"],
        "possessor_linker",
        "possessor_linker"
      ));
      addTemplate(() => makeMcq(
        "Is the possessor linker \"n\" pronounced?",
        "No",
        ["No", "Yes", "Only before vowels", "Only in formal speech"],
        "possessor_linker_pronounced",
        "possessor_linker_pronounced"
      ));
      addTemplate(() => makeMcq(
        "If both dative and source are present, the order is:",
        "recipient first, source second",
        ["recipient first, source second", "source first, recipient second", "free order", "source only"],
        "dative_source_order",
        "dative_source_order"
      ));
      addTemplate(() => makeMcq(
        "If there is no dative, the source phrase appears:",
        "source first after the verb",
        ["source first after the verb", "before the subject", "at the very end only", "inside the noun phrase"],
        "source_no_dative_order",
        "source_no_dative_order"
      ));
      addTemplate(() => makeMcq(
        "Static vs. dynamic: which one is unmarked by default?",
        "Static",
        ["Static", "Dynamic", "Both", "Neither"],
        "static_dynamic_default",
        "static_dynamic_default"
      ));

      MONTHS.forEach((m) => {
        const concept = `month_${m.en}`;
        addTemplate(() => makeMcq(
          `Which month is "${m.sp}"?`,
          m.en,
          pickOptions(MONTHS.map(x => x.en), m.en, 4),
          `month_sp_${m.sp}`,
          concept
        ));
        addTemplate(() => makeMcq(
          `What is the Spiretz name for ${m.en}?`,
          m.sp,
          pickOptions(MONTHS.map(x => x.sp), m.sp, 4),
          `month_en_${m.en}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "The star-month prefix is:",
        "xi",
        ["xi", "zo", "mi", "ta"],
        "month_prefix_xi",
        "month_prefix_xi"
      ));

      SYLLABLE_PATTERNS.forEach((p) => {
        const concept = `syllable_${p}`;
        addTemplate(() => makeMcq(
          `Is "${p}" an allowed syllable pattern in words (including names)?`,
          "Yes",
          ["Yes", "No", "Only in the south", "Only for verbs"],
          `syllable_allowed_${p}`,
          concept
        ));
      });

      addTemplate(() => makeMcq(
        "When \"y\" appears in yi/ye, it functions as:",
        "part of the vowel",
        ["part of the vowel", "a glide [j]", "a consonant stop", "a nasal"],
        "y_vowel_rule",
        "y_vowel_rule"
      ));

      addTemplate(() => makeMcq(
        "Outside yi/ye, \"y\" represents:",
        "the glide [j]",
        ["the glide [j]", "a vowel", "a click", "a nasal"],
        "y_glide_rule",
        "y_glide_rule"
      ));
      addTemplate(() => makeMcq(
        "Can \"ng\" appear in onset position?",
        "No",
        ["No", "Yes", "Only in names", "Only after prefixes"],
        "ng_onset_rule",
        "ng_onset_rule"
      ));

      const GRAMMAR_TEMPLATE_POOL = TEMPLATE_POOL.filter((fn) => {
        const src = String(fn);
        return /tense|aspect|mood|negation|topic marker|direct object|Genitive|Plural noun|Adjectives must|Adjectives normally appear|Nouns must|Verbs \(with no conjugation\)|dative|ablative|subject suffix|Reflexive|Human direct object|Royal direct object|Yes–no|article|noun phrase|word order|Imperative|conjunction|subclause|prefix|pronoun|class|possessor|linker|animate|inanimate|witnessed|hearsay|ng|Static vs\. dynamic|source phrase|recipient first/.test(src);
      });

      let currentQuestions = [];

      function shuffle(arr) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      }

      function normalizeAnswer(text) {
        return String(text || "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
      }

      function randPick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      function buildVerbForm(config) {
        const verb = config.verb;
        const subj = SUBJECT_SUFFIX[config.subj] || "";
        const obj = config.obj;
        let human = config.human;
        const tense = config.tense;
        const asp = ASPECT_SUFFIX[config.aspect] || "";
        const mood = MOOD_SUFFIX[config.mood] || "";
        const dyn = config.dynamic ? "og" : "";

        if (obj === "none" || obj === "te") human = "none";

        let base = verb;
        if (tense === "future") base = `i-${verb}`;

        let out = base;
        if (subj) out += subj;
        if (obj !== "none") out += obj;
        if (human !== "none") out += human;
        if (tense === "past") out += "et";
        if (asp) out += asp;
        if (mood) out += mood;
        if (dyn) out += dyn;

        return out;
      }

      function glossFromConfig(config) {
        const rawMeaning = VERB_MEANING[config.verb] || "—";
        const meaning = IS_ZH ? (ZH_MEANING[rawMeaning] || rawMeaning) : rawMeaning;
        const subjEn = IS_ZH
          ? (
            config.subj === "1sg" ? "我" :
            config.subj === "1pl" ? "我们" :
            config.subj === "2sg" ? "你" :
            config.subj === "2pl" ? "你们" :
            config.subj === "3sg" ? "spirete/tatie（单数）" :
            config.subj === "3pl" ? "spireten/tatien（复数）" :
            "（某人）"
          )
          : (SUBJECT_EN[config.subj] || "(someone)");

        let aux = "";
        if (config.mood === "el") aux += IS_ZH ? "可能" : "might ";
        if (config.tense === "future") aux += IS_ZH ? "将" : "will ";
        if (config.tense === "past") aux += IS_ZH ? "曾" : "did ";

        let objPhrase = "";
        if (config.obj === "ta") {
          if (config.human === "sa") objPhrase = IS_ZH ? " 某人" : " someone";
          else if (config.human === "x") objPhrase = IS_ZH ? "（皇室成员）" : " (a royal person)";
          else objPhrase = IS_ZH ? " 某物" : " something";
        } else if (config.obj === "te") {
          objPhrase = IS_ZH ? "（自己）" : " (oneself)";
        }

        let aspectNote = "";
        if (config.aspect === "none") aspectNote = IS_ZH ? "（未完成体）" : " (imperfect)";
        if (config.aspect === "im") aspectNote = IS_ZH ? "（已完成）" : " (completed)";
        if (config.aspect === "ul") aspectNote = IS_ZH ? "（习惯性）" : " (habitually)";
        if (config.aspect === "en") aspectNote = IS_ZH ? "（重复性）" : " (repeatedly)";

        const dyn = config.dynamic ? (IS_ZH ? "（动态）" : " (dynamic)") : "";

        return `${subjEn} ${aux}${meaning}${objPhrase}${aspectNote}${dyn}`.replace(/\s+/g, " ").trim();
      }

      function randomVerbConfig() {
        const verb = randPick(VERBS)[0];
        const subj = randPick(["omit","1sg","1pl","2sg","2pl","3sg","3pl"]);
        const obj = randPick(["none", "ta", "te"]);
        const human = randPick(["none", "sa", "x"]);
        const tense = randPick(["none", "future", "past"]);
        const aspect = randPick(["none", "im", "ul", "en"]);
        const mood = randPick(["none", "el"]);
        const dynamic = Math.random() < 0.4;

        return { verb, subj, obj, human, tense, aspect, mood, dynamic };
      }

      function makeConjugationQuestion() {
        const config = randomVerbConfig();
        const form = buildVerbForm(config);
        const gloss = glossFromConfig(config);

        const mode = randPick(["form_from_gloss", "gloss_from_form"]);
        if (mode === "form_from_gloss") {
          const prompt = `Choose the correct Spiretz verb form for: "${gloss}"`;
          const correct = form;
          const options = new Set([correct]);
          while (options.size < 4) {
            const altConfig = { ...config };
            const tweak = randPick(["tense","aspect","mood","obj","subj","dynamic"]);
            if (tweak === "tense") altConfig.tense = randPick(["none","future","past"]);
            if (tweak === "aspect") altConfig.aspect = randPick(["none","im","ul","en"]);
            if (tweak === "mood") altConfig.mood = randPick(["none","el"]);
            if (tweak === "obj") altConfig.obj = randPick(["none","ta","te"]);
            if (tweak === "subj") altConfig.subj = randPick(["omit","1sg","1pl","2sg","2pl","3sg","3pl"]);
            if (tweak === "dynamic") altConfig.dynamic = !altConfig.dynamic;
            const altForm = buildVerbForm(altConfig);
            if (altForm !== correct) options.add(altForm);
          }
        return {
          id: `conj_form_${form}_${config.verb}`,
          type: "mcq",
          prompt,
          options: shuffle(Array.from(options)),
          answer: correct,
          signature: `form|${form}|${gloss}`,
          concept: `conj_form|${form}|${gloss}`,
        };
        }

        const prompt = `Choose the correct gloss for: "${form}"`;
        const correct = gloss;
        const options = new Set([correct]);
        while (options.size < 4) {
          const altConfig = { ...config };
          const tweak = randPick(["tense","aspect","mood","obj","subj","dynamic"]);
          if (tweak === "tense") altConfig.tense = randPick(["none","future","past"]);
          if (tweak === "aspect") altConfig.aspect = randPick(["none","im","ul","en"]);
          if (tweak === "mood") altConfig.mood = randPick(["none","el"]);
          if (tweak === "obj") altConfig.obj = randPick(["none","ta","te"]);
          if (tweak === "subj") altConfig.subj = randPick(["omit","1sg","1pl","2sg","2pl","3sg","3pl"]);
          if (tweak === "dynamic") altConfig.dynamic = !altConfig.dynamic;
          const altGloss = glossFromConfig(altConfig);
          if (altGloss !== correct) options.add(altGloss);
        }
        return {
          id: `conj_gloss_${form}_${config.verb}`,
          type: "mcq",
          prompt,
          options: shuffle(Array.from(options)),
          answer: correct,
          signature: `gloss|${form}|${gloss}`,
          concept: `conj_gloss|${form}|${gloss}`,
        };
      }

      function renderQuiz(count) {
        quizArea.innerHTML = "";
        quizScore.style.display = "none";
        quizScore.textContent = "";

        const n = Math.max(1, Math.min(10, count));
        currentQuestions = [];
        const used = new Set();
        const grammarSources = GRAMMAR_TEMPLATE_POOL.concat([
          makeConjugationQuestion,
          makeConjugationQuestion,
          makeConjugationQuestion,
          makeConjugationQuestion,
        ]);
        const nonGrammarSources = TEMPLATE_POOL.filter((fn) => !GRAMMAR_TEMPLATE_POOL.includes(fn));
        const maxNonGrammar = Math.max(1, Math.floor(n * 0.2));
        const grammarTarget = Math.max(1, n - maxNonGrammar);

        let attempts = 0;
        while (currentQuestions.length < grammarTarget && attempts < 200) {
          attempts++;
          const source = randPick(grammarSources);
          const q = typeof source === "function" ? source() : source;
          const key = q.concept || q.signature || q.id;
          if (used.has(key)) continue;
          used.add(key);
          currentQuestions.push(q);
        }

        attempts = 0;
        while (currentQuestions.length < n && attempts < 200) {
          attempts++;
          const source = randPick(nonGrammarSources.length ? nonGrammarSources : grammarSources);
          const q = typeof source === "function" ? source() : source;
          const key = q.concept || q.signature || q.id;
          if (used.has(key)) continue;
          used.add(key);
          currentQuestions.push(q);
        }

        currentQuestions.forEach((q, idx) => {
          const card = document.createElement("div");
          card.className = "quiz-card";
          card.dataset.qid = q.id;

          const title = document.createElement("h4");
          title.textContent = IS_ZH ? `第${idx + 1}题。${zhPrompt(q.prompt)}` : `Q${idx + 1}. ${q.prompt}`;
          card.appendChild(title);

          if (q.type === "mcq") {
            const opts = document.createElement("div");
            opts.className = "quiz-options";
            q.options.forEach((opt, optIdx) => {
              const label = document.createElement("label");
              label.className = "quiz-option";

              const input = document.createElement("input");
              input.type = "radio";
              input.name = `q_${idx}`;
              input.value = opt;
              input.id = `q_${idx}_${optIdx}`;

              const span = document.createElement("span");
              span.textContent = IS_ZH ? zhQuizText(opt) : opt;

              label.appendChild(input);
              label.appendChild(span);
              opts.appendChild(label);
            });
            card.appendChild(opts);
          } else {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "quiz-input";
            input.placeholder = IS_ZH ? "请输入答案…" : "Type your answer...";
            input.name = `q_${idx}`;
            card.appendChild(input);
          }

          const result = document.createElement("div");
          result.className = "quiz-result";
          result.style.display = "none";
          card.appendChild(result);

          const answer = document.createElement("div");
          answer.className = "quiz-answer";
          answer.style.display = "none";
          card.appendChild(answer);

          quizArea.appendChild(card);
        });
      }

      function gradeQuiz() {
        let correct = 0;
        const cards = quizArea.querySelectorAll(".quiz-card");

        cards.forEach((card, idx) => {
          const q = currentQuestions[idx];
          const result = card.querySelector(".quiz-result");
          const answer = card.querySelector(".quiz-answer");

          let userAnswer = "";
          if (q.type === "mcq") {
            const checked = card.querySelector(`input[name="q_${idx}"]:checked`);
            userAnswer = checked ? checked.value : "";
          } else {
            const input = card.querySelector(`input[name="q_${idx}"]`);
            userAnswer = input ? input.value : "";
          }

          let isCorrect = false;
          if (q.type === "mcq") {
            isCorrect = userAnswer === q.answer;
          } else {
            const normalized = normalizeAnswer(userAnswer);
            isCorrect = q.answers.some((a) => normalizeAnswer(a) === normalized);
          }

          if (isCorrect) correct += 1;

          result.style.display = "";
          result.textContent = isCorrect
            ? (IS_ZH ? "正确 ✅" : "Correct ✅")
            : (IS_ZH ? "错误 ✗" : "Incorrect ✗");

          answer.style.display = "";
          if (q.type === "mcq") {
            answer.textContent = IS_ZH ? `答案：${zhQuizText(q.answer)}` : `Answer: ${q.answer}`;
          } else {
            answer.textContent = IS_ZH ? `答案：${q.answers[0]}` : `Answer: ${q.answers[0]}`;
          }
        });

        quizScore.style.display = "";
        quizScore.textContent = IS_ZH
          ? `得分：${correct} / ${currentQuestions.length}`
          : `Score: ${correct} / ${currentQuestions.length}`;
      }

      quizGenerate.addEventListener("click", () => {
        const count = parseInt(quizCount.value, 10) || 5;
        renderQuiz(count);
      });

      quizSubmit.addEventListener("click", () => {
        if (!currentQuestions.length) {
          renderQuiz(parseInt(quizCount.value, 10) || 5);
        }
        gradeQuiz();
      });

      renderQuiz(parseInt(quizCount.value, 10) || 5);
    })();

    // ===== SPIRETZ Personality Test (96 Types) =====
    (function () {
      const questionsWrap = document.getElementById("personalityQuestions");
      const submitBtn = document.getElementById("personalitySubmit");
      const resetBtn = document.getElementById("personalityReset");
      const resultsBox = document.getElementById("personalityResults");
      const shareInput = document.getElementById("personalityShareCode");
      const shareApplyBtn = document.getElementById("personalityShareApply");
      const shareClearBtn = document.getElementById("personalityShareClear");
      const shareStatus = document.getElementById("personalityShareStatus");
      const portraitMode = document.getElementById("personalityPortraitMode");
      const shareCode = document.getElementById("shareCode");
      const shareApply = document.getElementById("shareApply");
      const characterShareStatus = document.getElementById("shareStatus");
      const fullNameOut = document.getElementById("fullNameOut");
      const portraitCanvas = document.getElementById("portraitCanvas");
      const illustratedPortrait = document.getElementById("illustratedPortrait");
      const drawBackHair = document.getElementById("drawBackHair");
      const drawBody = document.getElementById("drawBody");
      const drawNose = document.getElementById("drawNose");
      const drawEyes = document.getElementById("drawEyes");
      const drawEyeTint = document.getElementById("drawEyeTint");
      const drawWink = document.getElementById("drawWink");
      const drawClosed = document.getElementById("drawClosed");
      const drawPupil = document.getElementById("drawPupil");
      const drawBrows = document.getElementById("drawBrows");
      const drawMouth = document.getElementById("drawMouth");
      const drawFrontHair = document.getElementById("drawFrontHair");
      const drawTemples = document.getElementById("drawTemples");
      const drawBraids = document.getElementById("drawBraids");
      const drawOutfit = document.getElementById("drawOutfit");
      const drawAccessory = document.getElementById("drawAccessory");

      if (!questionsWrap || !submitBtn || !resetBtn || !resultsBox) return;

      const QUESTIONS = [
        { text: "A stranger drops a wallet in front of you. You expect them to come back for it.", weights: { D: 1, B: -1 } },
        { text: "You’re offered a deal that sounds too good to be true. You assume there’s a catch.", weights: { B: 1, D: -1 } },
        { text: "You ask for help in a new town; you believe most people will point you the right way.", weights: { D: 1, B: -1 } },
        { text: "When someone apologizes, you assume it’s partly about saving face.", weights: { B: 1, D: -1 } },
        { text: "At a group project, you expect people to pull their weight without being chased.", weights: { D: 1, B: -1 } },
        { text: "If you hear gossip, you assume there’s more manipulation than truth.", weights: { B: 1, D: -1 } },
        { text: "You lend things easily because you expect them to be returned.", weights: { D: 1, B: -1 } },
        { text: "When two people clash, you assume someone is trying to control the other.", weights: { B: 1, D: -1 } },
        { text: "A friend makes a mistake; you bounce back to trust quickly.", weights: { D: 1, B: -1 } },
        { text: "You keep a safety buffer because people can be unpredictable.", weights: { B: 1, D: -1 } },

        { text: "You have free time on a weekend; your first instinct is to check on family.", weights: { O: 1, W: -1 } },
        { text: "You’d skip a family event to show up for a close friend in need.", weights: { L: 1, O: -1 } },
        { text: "If your partner needs you, you rearrange everything.", weights: { N: 1, L: -1 } },
        { text: "You protect your personal goals even when others want more of you.", weights: { W: 1, O: -1 } },
        { text: "You feel responsible for keeping your family grounded.", weights: { O: 1, N: -1 } },
        { text: "You feel most loyal to the people you chose, not the ones you were born with.", weights: { L: 1, W: -1 } },
        { text: "You want a life that revolves around your partner’s well-being too.", weights: { N: 1, W: -1 } },
        { text: "You prefer to be self-reliant even if it means less closeness.", weights: { W: 1, L: -1 } },
        { text: "If a move benefits family, you’d take the risk.", weights: { O: 1, W: -1 } },
        { text: "Your closest friendships are the center of your life.", weights: { L: 1, O: -1 } },
        { text: "You see your romantic relationship as your main home base.", weights: { N: 1, L: -1 } },
        { text: "You want space that is fully yours, no matter who you love.", weights: { W: 1, N: -1 } },
        { text: "When you share good news, your partner is the first person you call.", weights: { N: 1, O: -1 } },
        { text: "Your friends shape your identity more than family does.", weights: { L: 1, N: -1 } },
        { text: "You keep boundaries even when people ask for more closeness.", weights: { W: 1, O: -1 } },
        { text: "Traditions and family rituals feel like a foundation.", weights: { O: 1, L: -1 } },

        { text: "You’d take a lower-paying role if it aligned with your purpose.", weights: { K: 1, Z: -1 } },
        { text: "You track success by the results you can point to.", weights: { Z: 1, K: -1 } },
        { text: "If a project is meaningful, you can tolerate slower progress.", weights: { K: 1, Z: -1 } },
        { text: "You judge plans by what they deliver, not by their symbolism.", weights: { Z: 1, K: -1 } },
        { text: "You feel most successful when you’re at peace inside.", weights: { K: 1, Z: -1 } },
        { text: "Clear metrics motivate you more than abstract ideals.", weights: { Z: 1, K: -1 } },
        { text: "You would rather live meaningfully than comfortably.", weights: { K: 1, Z: -1 } },
        { text: "If something doesn’t work, you change it—meaning or not.", weights: { Z: 1, K: -1 } },

        { text: "When solving a problem, you pick one direction and go deep.", weights: { P: 1, A: -1 } },
        { text: "When stuck, you map out every possibility you can think of.", weights: { A: 1, P: -1 } },
        { text: "You prefer a clear plan over a big brainstorm.", weights: { P: 1, A: -1 } },
        { text: "You keep several options open until the last responsible moment.", weights: { A: 1, P: -1 } },
        { text: "You’d rather refine one good idea than chase many.", weights: { P: 1, A: -1 } },
        { text: "Your best ideas come from wild exploration first.", weights: { A: 1, P: -1 } },
        { text: "You trust steady progress more than creative detours.", weights: { P: 1, A: -1 } },
        { text: "You think in webs, not straight lines.", weights: { A: 1, P: -1 } },

        { text: "When choices are tough, you prioritize excellence and output.", weights: { S: 1, I: -1 } },
        { text: "You slow down decisions to protect people’s feelings.", weights: { I: 1, S: -1 } },
        { text: "How the process feels to you matters as much as the outcome.", weights: { E: 1, S: -1 } },
        { text: "You’d rather be effective than widely liked.", weights: { S: 1, I: -1 } },
        { text: "You’d rather be considerate than fast.", weights: { I: 1, S: -1 } },
        { text: "You pick projects that feel meaningful and immersive.", weights: { E: 1, S: -1 } },
        { text: "High standards come before comfort.", weights: { S: 1, I: -1 } },
        { text: "You adjust to people first and plans second.", weights: { I: 1, E: -1 } },
        { text: "You choose experiences that feel personal and vivid.", weights: { E: 1, I: -1 } },
        { text: "If it’s worth doing, it must be done well.", weights: { S: 1, E: -1 } },
        { text: "Harmony is a better success signal than speed.", weights: { I: 1, S: -1 } },
        { text: "You notice the atmosphere before the checklist.", weights: { E: 1, S: -1 } },

        { text: "You trust people, but you still verify the facts.", weights: { D: 1, Z: 1 } },
        { text: "You favor big visions even if they take time to land.", weights: { A: 1, K: 1 } },
        { text: "You stay loyal to family but won’t erase your own path.", weights: { O: 1, W: 1 } },
        { text: "You care about people and still want strong results.", weights: { I: 1, S: 1 } },
        { text: "You lean on your partner for balance and perspective.", weights: { N: 1, D: 1 } },
        { text: "Your closest friends are your main support system.", weights: { L: 1, D: 1 } },
      ];
      const PERSONALITY_QUESTIONS_ZH = [
        "一个陌生人在你面前掉了钱包。你会觉得对方会回来找。",
        "有人给你一个好得不真实的交易。你会觉得其中有陷阱。",
        "你在新城镇求助时，会相信大多数人会给你正确指路。",
        "当有人道歉时，你会觉得这部分是在挽回面子。",
        "在团队项目中，你会预期大家不用催也会尽责。",
        "听到八卦时，你会觉得操控成分多于真实。",
        "你很容易把东西借出去，因为你相信会被归还。",
        "当两人冲突时，你会觉得有人在试图控制对方。",
        "朋友犯错后，你能很快恢复信任。",
        "你会保留安全边界，因为人常常不可预测。",
        "周末有空时，你第一反应是先关照家人。",
        "你会为了有困难的挚友而缺席家庭活动。",
        "如果伴侣需要你，你会重新安排一切。",
        "即使他人想从你这里获得更多，你也会保护个人目标。",
        "你会觉得自己有责任让家庭保持稳定。",
        "你最忠于你自己选择的人，而非天生关系。",
        "你希望生活也围绕伴侣的幸福运转。",
        "你更想自给自足，即便亲密感会减少。",
        "如果一次迁移对家庭有利，你愿意承担风险。",
        "你最亲密的友谊是你生活的中心。",
        "你把亲密关系看作自己最主要的归属。",
        "无论爱谁，你都希望保有完全属于自己的空间。",
        "分享好消息时，你第一个想打电话给伴侣。",
        "朋友对你身份的塑造比家庭更深。",
        "即便别人要求更亲近，你也会守住边界。",
        "传统与家庭仪式让你有根基感。",
        "即使薪资更低，只要符合人生意义你也愿意接受。",
        "你用可量化结果来衡量成功。",
        "只要项目有意义，你可以接受进展较慢。",
        "你评估计划时更看交付，而不是象征意义。",
        "当内心平和时，你最有成功感。",
        "明确指标比抽象理想更能激励你。",
        "你宁愿活得有意义，也不愿只求舒适。",
        "如果某件事行不通，你会直接调整，不管是否有意义。",
        "解决问题时，你会选定一个方向深挖。",
        "卡住时，你会先把能想到的可能性全部铺开。",
        "你偏好清晰计划而不是大规模头脑风暴。",
        "你会把多个选项留到最后负责时刻再收敛。",
        "你更愿意打磨一个好点子，而非追很多点子。",
        "你最好的想法通常来自先进行大范围探索。",
        "你更信任稳步推进，而不是创意绕路。",
        "你的思考像网状，而不是直线。",
        "面对艰难选择时，你会优先追求卓越与产出。",
        "你会放慢决策以保护他人感受。",
        "过程给你的感受与结果同样重要。",
        "你宁愿高效，也不追求被所有人喜欢。",
        "你宁愿体贴，也不追求速度。",
        "你会选择有意义且沉浸感强的项目。",
        "高标准优先于舒适。",
        "你会先适应人，再调整计划。",
        "你会选择更个性化、更有画面感的体验。",
        "如果值得做，就必须做好。",
        "和谐比速度更像成功信号。",
        "你会先感知氛围，再看清单。",
        "你信任他人，但仍会核实事实。",
        "你偏好宏大愿景，即使需要更长时间落地。",
        "你忠于家庭，但不会抹去自己的道路。",
        "你关心他人，同时也追求强结果。",
        "你会依靠伴侣来获得平衡与视角。",
        "你最亲密的朋友是你主要的支持系统。"
      ];

      const LIKERT_LABELS = [
        "Strongly Disagree",
        "Disagree",
        "Slightly Disagree",
        "Neutral",
        "Slightly Agree",
        "Agree",
        "Strongly Agree",
      ];
      const LIKERT_LABELS_ZH = ["非常不同意", "不同意", "略不同意", "中立", "略同意", "同意", "非常同意"];

      const LABELS = {
        D: "People are kind",
        B: "People are evil",
        O: "Family focus",
        L: "Friends focus",
        N: "Lover focus",
        W: "Self focus",
        K: "Spiritual success",
        Z: "Practical success",
        P: "One-direction solver",
        A: "Big brainstorm solver",
        S: "Get it done",
        I: "Consider everyone",
        E: "Experience first",
      };

      const DESC = {
        D: "Trusting and optimistic about people.",
        B: "Cautious and realistic about human motives.",
        O: "Family-centered and protective of kinship bonds.",
        L: "Friend-centered and loyal to chosen community.",
        N: "Romance-centered and invested in partnership.",
        W: "Self-centered in a healthy way, valuing independence.",
        K: "Driven by meaning, purpose, and inner growth.",
        Z: "Driven by results, structure, and tangible progress.",
        P: "Linear problem-solver who commits early.",
        A: "Expansive problem-solver who explores options.",
        S: "Execution-first with high standards.",
        I: "People-first with strong empathy.",
        E: "Experience-first with strong sense of feel.",
      };

      const STRENGTH = {
        D: "builds trust quickly",
        B: "spots risks early",
        O: "anchors family stability",
        L: "nurtures community",
        N: "invests deeply in partnership",
        W: "maintains strong self-direction",
        K: "keeps purpose in view",
        Z: "drives tangible outcomes",
        P: "executes with focus",
        A: "generates creative options",
        S: "delivers reliably",
        I: "protects group harmony",
        E: "keeps experiences meaningful",
      };

      const WATCH = {
        D: "may overlook red flags",
        B: "can become guarded",
        O: "may neglect wider circles",
        L: "may under-prioritize family duties",
        N: "may overinvest in romance",
        W: "may isolate when stressed",
        K: "may drift from practical needs",
        Z: "may downplay meaning",
        P: "may miss alternatives",
        A: "may overcomplicate",
        S: "may seem blunt",
        I: "may slow decisions",
        E: "may chase novelty",
      };
      if (IS_ZH) {
        Object.assign(LABELS, {
          D: "人性本善", B: "人性偏恶", O: "家庭取向", L: "朋友取向", N: "伴侣取向", W: "自我取向",
          K: "精神型成功", Z: "现实型成功", P: "单线问题解决者", A: "发散问题解决者", S: "重执行",
          I: "重体恤", E: "重体验"
        });
        Object.assign(DESC, {
          D: "对人保持信任与乐观。", B: "对人性动机更谨慎现实。", O: "以家庭为核心，重视亲缘连接。", L: "以朋友为中心，忠于自选社群。",
          N: "以伴侣关系为重，投入亲密连接。", W: "健康地重视自我独立。", K: "由意义、使命与内在成长驱动。", Z: "由结果、结构与可见进展驱动。",
          P: "线性解决问题，较早定向。", A: "发散解决问题，先探索选项。", S: "执行优先且标准较高。", I: "以人为先且共情强。",
          E: "以体验感受为先。"
        });
        Object.assign(STRENGTH, {
          D: "能快速建立信任", B: "能及早识别风险", O: "能稳住家庭基础", L: "能滋养社群关系", N: "深度经营伴侣关系",
          W: "保持明确自我方向", K: "始终不忘意义导向", Z: "推动可见成果落地", P: "专注推进执行", A: "产生更多创意方案",
          S: "稳定交付结果", I: "维护团队和谐", E: "让体验更有意义"
        });
        Object.assign(WATCH, {
          D: "可能忽略危险信号", B: "可能过度防备", O: "可能忽视更广的人际圈", L: "可能低估家庭责任", N: "可能对亲密关系过度投入",
          W: "压力下可能自我隔离", K: "可能偏离现实需求", Z: "可能淡化意义感", P: "可能错过替代方案", A: "可能过度复杂化",
          S: "可能显得直接生硬", I: "可能拖慢决策", E: "可能追逐新鲜感"
        });
      }

      function buildTypeMap() {
        const map = {};
        const dAxis = ["D", "B"];
        const focus = ["O", "L", "N", "W"];
        const success = ["K", "Z"];
        const solve = ["P", "A"];
        const care = ["S", "I", "E"];

        dAxis.forEach((d) => {
          focus.forEach((f) => {
            success.forEach((s) => {
              solve.forEach((p) => {
                care.forEach((c) => {
                  const type = `${d}${f}${s}${p}${c}`;
                  const summary = `${DESC[d]} ${DESC[f]} ${DESC[s]} ${DESC[p]} ${DESC[c]}`;
                  const strengths = [STRENGTH[d], STRENGTH[f], STRENGTH[s], STRENGTH[p], STRENGTH[c]];
                  const watchouts = [WATCH[d], WATCH[f], WATCH[s], WATCH[p], WATCH[c]];
                  map[type] = { summary, strengths, watchouts };
                });
              });
            });
          });
        });
        return map;
      }

      const TYPE_MAP = buildTypeMap();
      let lastCardCanvas = null;
      let cachedName = "";
      let cachedPortrait = null;

      function buildIllustratedCanvas() {
        const canvas = document.createElement("canvas");
        const size = illustratedPortrait ? illustratedPortrait.clientWidth || 512 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const layers = [
          drawBackHair, drawBody, drawNose, drawEyes, drawEyeTint, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory
        ].filter(Boolean);
        layers.forEach((layer) => {
          if (layer instanceof HTMLCanvasElement) {
            ctx.drawImage(layer, 0, 0, size, size);
          } else if (layer.complete && layer.naturalWidth) {
            ctx.drawImage(layer, 0, 0, size, size);
          }
        });
        try {
          canvas.toDataURL("image/png");
          return canvas;
        } catch {
          return portraitCanvas || null;
        }
      }

      function updateCachedPortrait() {
        const mode = portraitMode ? portraitMode.value : "traditional";
        if (mode === "illustrated") {
          cachedPortrait = buildIllustratedCanvas() || portraitCanvas || null;
        } else {
          cachedPortrait = portraitCanvas || null;
        }
      }

      function renderQuestions() {
        questionsWrap.innerHTML = "";
        QUESTIONS.forEach((q, idx) => {
          const card = document.createElement("div");
          card.className = "personality-card";

          const title = document.createElement("h4");
          const qText = IS_ZH ? (PERSONALITY_QUESTIONS_ZH[idx] || q.text) : q.text;
          title.textContent = IS_ZH ? `第${idx + 1}题。${qText}` : `Q${idx + 1}. ${qText}`;
          card.appendChild(title);

          const row = document.createElement("div");
          row.className = "likert-row";

          (IS_ZH ? LIKERT_LABELS_ZH : LIKERT_LABELS).forEach((label, i) => {
            const val = i + 1;
            const wrap = document.createElement("label");
            wrap.className = "likert-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = `pt_q_${idx}`;
            input.value = String(val);

            const text = document.createElement("span");
            text.textContent = label;

            wrap.appendChild(input);
            wrap.appendChild(text);
            row.appendChild(wrap);
          });

          card.appendChild(row);
          questionsWrap.appendChild(card);
        });
      }

      function normalizeGroup(scores, maxByLetter, letters) {
        const raw = letters.map((l) => {
          const max = maxByLetter[l] || 0;
          if (max <= 0) return 0.5;
          const z = (scores[l] || 0) / max; // -1..1
          return Math.max(0, Math.min(1, (z + 1) / 2));
        });
        let total = raw.reduce((a, b) => a + b, 0);
        if (total === 0) {
          total = raw.length;
          for (let i = 0; i < raw.length; i++) raw[i] = 1;
        }
        const scaled = raw.map((v) => (v / total) * 100);
        const rounded = scaled.map((v) => Math.round(v));
        const diff = 100 - rounded.reduce((a, b) => a + b, 0);
        if (diff !== 0) {
          let maxIdx = 0;
          for (let i = 1; i < scaled.length; i++) {
            if (scaled[i] > scaled[maxIdx]) maxIdx = i;
          }
          rounded[maxIdx] += diff;
        }
        const out = {};
        letters.forEach((l, i) => { out[l] = rounded[i]; });
        return out;
      }

      function pickMax(scores, letters) {
        let best = letters[0];
        letters.forEach((l) => {
          if ((scores[l] || 0) > (scores[best] || 0)) best = l;
        });
        return best;
      }

      function barPairHtml(left, right, perc) {
        return `
          <div class="result-block">
            <div class="result-row">
              <div class="result-row-header">
                <span>${left} — ${LABELS[left]}</span>
                <span>${perc[left]}% / ${perc[right]}%</span>
              </div>
              <div class="result-bar"><span style="left:0; width:${perc[left]}%;"></span></div>
              <div class="result-row-header">
                <span>${left}</span>
                <span>${right}</span>
              </div>
            </div>
          </div>
        `;
      }

      function barMultiHtml(title, perc, letters) {
        const rows = letters.map((l) => `
          <div class="result-row">
            <div class="result-row-header">
              <span>${l} — ${LABELS[l]}</span>
              <span>${perc[l]}%</span>
            </div>
            <div class="result-bar"><span style="left:0; width:${perc[l]}%;"></span></div>
          </div>
        `).join("");
        return `
          <div class="result-block">
            <div class="result-row-header"><span>${title}</span><span></span></div>
            ${rows}
          </div>
        `;
      }

      function topLetters(perc, letters, n) {
        return letters
          .map((l) => ({ l, v: perc[l] }))
          .sort((a, b) => b.v - a.v)
          .slice(0, n);
      }

      function getThemeVar(name, fallback) {
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        return val || fallback;
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const byWord = /\s/.test(text);
        const words = byWord ? text.split(" ") : Array.from(text);
        let line = "";
        let yy = y;
        for (let i = 0; i < words.length; i++) {
          const next = byWord ? words[i] + " " : words[i];
          const testLine = line + next;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, yy);
            line = next;
            yy += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, yy);
        return yy + lineHeight;
      }

      function drawBar(ctx, x, y, w, h, perc, colorBg, colorFill) {
        ctx.fillStyle = colorBg;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = colorFill;
        ctx.fillRect(x, y, Math.max(0, Math.min(1, perc / 100)) * w, h);
      }

      function buildCardCanvas(data) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 560;
        const ctx = canvas.getContext("2d");

        const bg = getThemeVar("--bg-2", "#15182a");
        const surface = getThemeVar("--surface", "rgba(255,255,255,0.06)");
        const text = getThemeVar("--text", "#e8e8e8");
        const heading = getThemeVar("--heading", "#ffffff");
        const accent = getThemeVar("--accent", "#c6a664");
        const accent2 = getThemeVar("--accent-2", "#9bc1ff");
        const barBg = getThemeVar("--surface-dark", "rgba(0,0,0,0.25)");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = surface;
        ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = heading;
        ctx.font = "700 28px serif";
        ctx.fillText(IS_ZH ? "SPIRETZ 人格卡片" : "SPIRETZ Personality Card", 48, 70);

        ctx.fillStyle = accent2;
        ctx.font = "700 46px serif";
        ctx.fillText(data.type, 48, 125);

        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        let yy = wrapText(ctx, data.summary, 48, 160, 520, 22);

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "核心倾向" : "Top focus", 48, yy + 10);
        ctx.fillStyle = text;
        ctx.font = "14px sans-serif";
        const focusText = data.focusTop.map((t) => `${t.l} (${t.v}%)`).join(" · ");
        ctx.fillText(focusText, 48, yy + 32);

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "关怀风格" : "Care style", 48, yy + 60);
        ctx.fillStyle = text;
        ctx.font = "14px sans-serif";
        const careText = data.careTop.map((t) => `${t.l} (${t.v}%)`).join(" · ");
        ctx.fillText(careText, 48, yy + 82);
        if (cachedName) {
          ctx.fillStyle = accent;
          ctx.font = "600 14px sans-serif";
          ctx.fillText(IS_ZH ? "姓名" : "Name", 48, yy + 110);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          ctx.fillText(cachedName, 48, yy + 134);
        }

        const startX = 560;
        let barY = 120;
        const barW = 280;
        const barH = 12;

        ctx.fillStyle = heading;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(`D (${data.pairDB.D}%) vs B (${data.pairDB.B}%)`, startX, barY - 10);
        drawBar(ctx, startX, barY, barW, barH, data.pairDB.D, barBg, accent2);
        barY += 50;

        ctx.fillStyle = heading;
        ctx.fillText(`K (${data.pairKZ.K}%) vs Z (${data.pairKZ.Z}%)`, startX, barY - 10);
        drawBar(ctx, startX, barY, barW, barH, data.pairKZ.K, barBg, accent);
        barY += 50;

        ctx.fillStyle = heading;
        ctx.fillText(`P (${data.pairPA.P}%) vs A (${data.pairPA.A}%)`, startX, barY - 10);
        drawBar(ctx, startX, barY, barW, barH, data.pairPA.P, barBg, accent2);
        barY += 50;

        ctx.fillStyle = heading;
        ctx.fillText(IS_ZH ? "关注群组" : "Focus group", startX, barY - 10);
        const focusKeys = ["O", "L", "N", "W"];
        focusKeys.forEach((k, i) => {
          const y = barY + i * 26;
          ctx.fillStyle = text;
          ctx.fillText(`${k} ${data.groupFocus[k]}%`, startX, y + 10);
          drawBar(ctx, startX + 60, y + 2, barW - 60, 8, data.groupFocus[k], barBg, accent2);
        });
        barY += 120;

        ctx.fillStyle = heading;
        ctx.fillText(IS_ZH ? "关怀风格" : "Care style", startX, barY - 10);
        const careKeys = ["S", "I", "E"];
        careKeys.forEach((k, i) => {
          const y = barY + i * 26;
          ctx.fillStyle = text;
          ctx.fillText(`${k} ${data.groupSIE[k]}%`, startX, y + 10);
          drawBar(ctx, startX + 60, y + 2, barW - 60, 8, data.groupSIE[k], barBg, accent);
        });

        if (cachedPortrait && cachedPortrait.width) {
          const px = 48;
          const py = cachedName ? (yy + 150) : (yy + 110);
          const size = 120;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px - 6, py - 6, size + 12, size + 12);
          ctx.drawImage(cachedPortrait, px, py, size, size);
        }

        return canvas;
      }

      function concatBytes(chunks) {
        let total = 0;
        chunks.forEach((c) => { total += c.length; });
        const out = new Uint8Array(total);
        let offset = 0;
        chunks.forEach((c) => {
          out.set(c, offset);
          offset += c.length;
        });
        return out;
      }

      function buildPdfFromJpeg(jpegBytes, width, height) {
        const enc = new TextEncoder();
        const chunks = [];
        let offset = 0;
        const xref = [];

        function pushStr(s) {
          const b = enc.encode(s);
          chunks.push(b);
          offset += b.length;
        }
        function pushBytes(b) {
          chunks.push(b);
          offset += b.length;
        }

        pushStr("%PDF-1.3\n");
        xref.push(offset); pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        xref.push(offset); pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        xref.push(offset); pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
        xref.push(offset); pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
        pushBytes(jpegBytes);
        pushStr("\nendstream\nendobj\n");
        const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
        const contentBytes = enc.encode(content);
        xref.push(offset); pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr("\nendstream\nendobj\n");

        const xrefStart = offset;
        pushStr("xref\n0 6\n0000000000 65535 f \n");
        xref.forEach((pos) => {
          const line = String(pos).padStart(10, "0") + " 00000 n \n";
          pushStr(line);
        });
        pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
        return concatBytes(chunks);
      }

      function downloadPng() {
        if (!lastCardCanvas) return;
        const link = document.createElement("a");
        link.download = "spiretz-personality-card.png";
        link.href = lastCardCanvas.toDataURL("image/png");
        link.click();
      }

      function downloadPdf() {
        if (!lastCardCanvas) return;
        const dataUrl = lastCardCanvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdfBytes = buildPdfFromJpeg(bytes, lastCardCanvas.width, lastCardCanvas.height);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "spiretz-personality-card.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }

      function calculate() {
        const scores = {
          D: 0, B: 0, O: 0, L: 0, N: 0, W: 0, K: 0, Z: 0, P: 0, A: 0, S: 0, I: 0, E: 0
        };
        const maxByLetter = {
          D: 0, B: 0, O: 0, L: 0, N: 0, W: 0, K: 0, Z: 0, P: 0, A: 0, S: 0, I: 0, E: 0
        };

        let answered = 0;
        const unanswered = [];

        QUESTIONS.forEach((q, idx) => {
          const checked = document.querySelector(`input[name="pt_q_${idx}"]:checked`);
          if (!checked) {
            unanswered.push(idx);
            return;
          }
          answered += 1;
          const val = parseInt(checked.value, 10) - 4; // -3..3
          Object.entries(q.weights).forEach(([letter, weight]) => {
            scores[letter] += val * weight;
            maxByLetter[letter] += Math.abs(weight) * 3;
          });
        });

        if (unanswered.length) {
          resultsBox.style.display = "";
          const list = unanswered.map((i) => i + 1).slice(0, 8).join(", ");
          const more = unanswered.length > 8 ? ` (+${unanswered.length - 8} more)` : "";
          resultsBox.innerHTML = `
            <div class="personality-card">
              <h3 style="margin:0;">${IS_ZH ? "请完成所有题目" : "Complete all questions"}</h3>
              <p class="mini-note" style="margin-top:8px;">
                ${IS_ZH ? `请先回答全部题目后再查看结果。未作答：${list}${more}` : `Please answer every question to see results. Unanswered: ${list}${more}`}
              </p>
            </div>
          `;
          resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
          const firstMissing = document.querySelector(`input[name="pt_q_${unanswered[0]}"]`);
          if (firstMissing) {
            firstMissing.closest(".personality-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
            firstMissing.focus({ preventScroll: true });
          }
          return;
        }

        const pairDB = normalizeGroup(scores, maxByLetter, ["D", "B"]);
        const groupFocus = normalizeGroup(scores, maxByLetter, ["O", "L", "N", "W"]);
        const pairKZ = normalizeGroup(scores, maxByLetter, ["K", "Z"]);
        const pairPA = normalizeGroup(scores, maxByLetter, ["P", "A"]);
        const groupSIE = normalizeGroup(scores, maxByLetter, ["S", "I", "E"]);

        const type =
          pickMax(scores, ["D", "B"]) +
          pickMax(scores, ["O", "L", "N", "W"]) +
          pickMax(scores, ["K", "Z"]) +
          pickMax(scores, ["P", "A"]) +
          pickMax(scores, ["S", "I", "E"]);

        const info = TYPE_MAP[type];
        const missing = QUESTIONS.length - answered;

        resultsBox.style.display = "";
        resultsBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "你的类型" : "Your type"}: ${type}</h3>
            <p class="mini-note" style="margin-top:8px;">${info.summary}</p>
            ${missing > 0 ? `<p class="mini-note" style="margin-top:6px;">${IS_ZH ? `说明：已跳过 ${missing} 道未作答题目。` : `Note: ${missing} unanswered question(s) were skipped.`}</p>` : ""}
            <div class="result-pills" style="margin-top:10px;">
              ${info.strengths.map((s) => `<span class="result-pill">${IS_ZH ? "优势" : "Strength"}: ${s}</span>`).join("")}
              ${info.watchouts.map((s) => `<span class="result-pill">${IS_ZH ? "留意" : "Watch-out"}: ${s}</span>`).join("")}
            </div>
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "下载你的卡片" : "Download your card"}</h4>
            <p class="mini-note" style="margin-top:8px;">
              ${IS_ZH ? "可将结果卡片保存为 PNG 或 PDF。" : "Save a small result card as a PNG or PDF."}
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button id="personalityDownloadPng" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PNG" : "Download PNG"}</span>
                <span class="acc-icon">⬇</span>
              </button>
              <button id="personalityDownloadPdf" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PDF" : "Download PDF"}</span>
                <span class="acc-icon">⬇</span>
              </button>
            </div>
          </div>
          ${barPairHtml("D", "B", pairDB)}
          ${barMultiHtml(IS_ZH ? "关注群组" : "Focus group", groupFocus, ["O", "L", "N", "W"])}
          ${barPairHtml("K", "Z", pairKZ)}
          ${barPairHtml("P", "A", pairPA)}
          ${barMultiHtml(IS_ZH ? "关怀风格" : "Care style", groupSIE, ["S", "I", "E"])}
        `;
        const focusTop = topLetters(groupFocus, ["O", "L", "N", "W"], 2);
        const careTop = topLetters(groupSIE, ["S", "I", "E"], 2);
        lastCardCanvas = buildCardCanvas({
          type,
          summary: info.summary,
          pairDB,
          pairKZ,
          pairPA,
          groupFocus,
          groupSIE,
          focusTop,
          careTop,
        });
        resultsBox.querySelector("#personalityDownloadPng")?.addEventListener("click", downloadPng);
        resultsBox.querySelector("#personalityDownloadPdf")?.addEventListener("click", downloadPdf);
        resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function resetAll() {
        document.querySelectorAll('#personalityQuestions input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        resultsBox.style.display = "none";
        resultsBox.innerHTML = "";
      }

      if (shareApplyBtn) {
        shareApplyBtn.addEventListener("click", () => {
          const code = shareInput ? shareInput.value.trim() : "";
          if (!code) {
            shareStatus.textContent = IS_ZH ? "请先粘贴分享码。" : "Please paste a share code first.";
            return;
          }
          if (!code.startsWith("SPIRETZ1:")) {
            shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
            cachedName = "";
            cachedPortrait = null;
            return;
          }
          if (shareCode && shareApply) {
            shareCode.value = code;
            shareApply.click();
            if (characterShareStatus && characterShareStatus.textContent.startsWith("Error")) {
              shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
              cachedName = "";
              cachedPortrait = null;
              return;
            }
            cachedName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—") ? fullNameOut.textContent : "";
            updateCachedPortrait();
            shareStatus.textContent = cachedName ? (IS_ZH ? "代码已加载 ✅" : "Code loaded ✅") : (IS_ZH ? "代码已加载（未找到姓名）。" : "Code loaded (name not found).");
          } else {
            shareStatus.textContent = IS_ZH ? "分享系统不可用。" : "Share system not available.";
          }
        });
      }

      if (shareClearBtn) {
        shareClearBtn.addEventListener("click", () => {
          if (shareInput) shareInput.value = "";
          cachedName = "";
          cachedPortrait = null;
          shareStatus.textContent = IS_ZH ? "未加载代码。" : "No code loaded.";
        });
      }

      if (portraitMode) {
        portraitMode.addEventListener("change", () => {
          if (!cachedName && !cachedPortrait) return;
          updateCachedPortrait();
        });
      }

      [drawBackHair, drawBody, drawNose, drawEyes, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory]
        .filter(Boolean)
        .forEach((img) => {
          img.addEventListener("load", () => {
            if (portraitMode && portraitMode.value === "illustrated" && cachedName) {
              updateCachedPortrait();
            }
          });
        });

      submitBtn.addEventListener("click", calculate);
      resetBtn.addEventListener("click", resetAll);

      renderQuestions();
    })();

    // ===== Animal Match Quiz =====
    (function () {
      const questionsWrap = document.getElementById("animalQuizQuestions");
      const submitBtn = document.getElementById("animalQuizSubmit");
      const resetBtn = document.getElementById("animalQuizReset");
      const resultsBox = document.getElementById("animalQuizResults");
      const guideToggle = document.getElementById("animalGuideToggle");
      const guideBox = document.getElementById("animalGuide");
      const shareInput = document.getElementById("animalShareCode");
      const shareApplyBtn = document.getElementById("animalShareApply");
      const shareClearBtn = document.getElementById("animalShareClear");
      const shareStatus = document.getElementById("animalShareStatus");
      const portraitMode = document.getElementById("animalPortraitMode");
      const shareCode = document.getElementById("shareCode");
      const shareApply = document.getElementById("shareApply");
      const characterShareStatus = document.getElementById("shareStatus");
      const fullNameOut = document.getElementById("fullNameOut");
      const portraitCanvas = document.getElementById("portraitCanvas");
      const illustratedPortrait = document.getElementById("illustratedPortrait");
      const drawBackHair = document.getElementById("drawBackHair");
      const drawBody = document.getElementById("drawBody");
      const drawNose = document.getElementById("drawNose");
      const drawEyes = document.getElementById("drawEyes");
      const drawEyeTint = document.getElementById("drawEyeTint");
      const drawWink = document.getElementById("drawWink");
      const drawClosed = document.getElementById("drawClosed");
      const drawPupil = document.getElementById("drawPupil");
      const drawBrows = document.getElementById("drawBrows");
      const drawMouth = document.getElementById("drawMouth");
      const drawFrontHair = document.getElementById("drawFrontHair");
      const drawTemples = document.getElementById("drawTemples");
      const drawBraids = document.getElementById("drawBraids");
      const drawOutfit = document.getElementById("drawOutfit");
      const drawAccessory = document.getElementById("drawAccessory");
      const skinSelect = document.getElementById("skinColor");
      const hairSelect = document.getElementById("hairColor");
      const eyeSelect = document.getElementById("leftEyeColor");
      const outfitSelect = document.getElementById("outfitColor");
      const genderSelect = document.getElementById("genderStyle");

      if (!questionsWrap || !submitBtn || !resetBtn || !resultsBox) return;

      const TRAITS = {
        BOLD: "Bold",
        GENTLE: "Gentle",
        SOCIAL: "Social",
        IND: "Independent",
        CUR: "Curious",
        DISC: "Disciplined",
        MYST: "Mystic",
        PLAY: "Playful",
      };

      const QUESTIONS = [
        { text: "You see an unknown trail and want to explore it right away.", weights: { CUR: 1, BOLD: 1 } },
        { text: "You’d rather observe first before acting.", weights: { DISC: 1, BOLD: -1 } },
        { text: "At a gathering, you naturally move between groups and talk.", weights: { SOCIAL: 1 } },
        { text: "You recharge best when you’re on your own.", weights: { IND: 1, SOCIAL: -1 } },
        { text: "You notice subtle moods and hidden meanings quickly.", weights: { MYST: 1, CUR: 1 } },
        { text: "You keep playful energy even in serious moments.", weights: { PLAY: 1 } },
        { text: "You prefer steady routines to big surprises.", weights: { DISC: 1, CUR: -1 } },
        { text: "You defend what matters even if it’s risky.", weights: { BOLD: 1 } },
        { text: "You are gentle in the way you handle fragile things.", weights: { GENTLE: 1 } },
        { text: "You like small circles over large crowds.", weights: { IND: 1, SOCIAL: -1 } },

        { text: "You feel more alive when learning something new.", weights: { CUR: 1 } },
        { text: "You keep your emotions soft and calm around others.", weights: { GENTLE: 1 } },
        { text: "You move fast when a goal matters to you.", weights: { BOLD: 1, DISC: 1 } },
        { text: "You like to be the spark that makes people laugh.", weights: { PLAY: 1, SOCIAL: 1 } },
        { text: "You trust your instincts more than external rules.", weights: { IND: 1, DISC: -1 } },
        { text: "You’re drawn to myths, legends, or the unknown.", weights: { MYST: 1 } },
        { text: "You protect your energy and don’t overcommit.", weights: { IND: 1 } },
        { text: "You prefer harmony and kindness in most situations.", weights: { GENTLE: 1, SOCIAL: 1 } },
        { text: "You like to master a craft with patience.", weights: { DISC: 1 } },
        { text: "You are happiest when you can roam freely.", weights: { IND: 1, CUR: 1 } },

        { text: "You prefer to lead from the front.", weights: { BOLD: 1 } },
        { text: "You are energized by teamwork.", weights: { SOCIAL: 1 } },
        { text: "You tend to playfully challenge your friends.", weights: { PLAY: 1, BOLD: 1 } },
        { text: "You feel most comfortable in quiet, safe spaces.", weights: { GENTLE: 1, IND: 1 } },
        { text: "You like deep conversations more than small talk.", weights: { MYST: 1, SOCIAL: -1 } },
        { text: "You push through obstacles with steady discipline.", weights: { DISC: 1 } },
        { text: "You enjoy being admired for your style or grace.", weights: { GENTLE: 1, SOCIAL: 1 } },
        { text: "You test boundaries to see what is possible.", weights: { BOLD: 1, CUR: 1 } },
        { text: "You adapt quickly to new environments.", weights: { CUR: 1, SOCIAL: 1 } },
        { text: "You prefer a clean, ordered plan.", weights: { DISC: 1 } },

        { text: "You can be mysterious even to people close to you.", weights: { MYST: 1, IND: 1 } },
        { text: "You feel protective of the people you care about.", weights: { BOLD: 1, GENTLE: 1 } },
        { text: "You turn stressful moments into something playful.", weights: { PLAY: 1 } },
        { text: "You prefer deep loyalty to wide popularity.", weights: { IND: 1, SOCIAL: -1 } },
      ];

      const ANIMAL_QUESTIONS_ZH = [
        "你看到一条陌生小路，会立刻想去探索。",
        "你更喜欢先观察再行动。",
        "在聚会中，你会自然地在不同人群间交流。",
        "你最好的充电方式是独处。",
        "你能很快察觉细微情绪和隐藏含义。",
        "即使在严肃场合，你也能保持玩心。",
        "相比惊喜，你更偏好稳定日常。",
        "即使有风险，你也会守护重要之物。",
        "你对待脆弱事物的方式很温柔。",
        "你更喜欢小圈子而非大人群。",
        "学习新事物会让你更有活力。",
        "你在他人面前常保持柔和与平静。",
        "当目标重要时，你会迅速行动。",
        "你喜欢成为让大家开心的火花。",
        "你更相信直觉而非外部规则。",
        "你会被神话、传说和未知吸引。",
        "你会保护自己的精力，不会过度承诺。",
        "大多数时候你偏好和谐与善意。",
        "你喜欢耐心打磨一门技艺。",
        "能自由漫游时你最快乐。",
        "你更倾向于走在最前面带队。",
        "团队协作会让你更有能量。",
        "你常用玩笑式方式挑战朋友。",
        "你在安静安全的空间里最自在。",
        "你更喜欢深度交流，而非寒暄。",
        "你会用稳定纪律穿越障碍。",
        "你喜欢因风格或优雅被欣赏。",
        "你会测试边界，看看可能性在哪里。",
        "你能快速适应新环境。",
        "你更偏好清晰有序的计划。",
        "即使对亲近的人，你也常保留神秘感。",
        "你会保护自己在乎的人。",
        "你能把压力时刻转化为一点玩乐。",
        "相比广泛受欢迎，你更重视深度忠诚。"
      ];

      const ANIMALS = [
        { name: "Cat", traits: { IND: 1, CUR: 0.8, GENTLE: 0.4, MYST: 0.3 } ,
          desc: "Quietly confident, agile, and selective with trust. You move on your own rhythm and spot details others miss." },
        { name: "Tiger", traits: { BOLD: 1, IND: 0.7, DISC: 0.4, MYST: 0.2 },
          desc: "Focused and powerful, with a solitary strength. You prefer precision, presence, and impact." },
        { name: "Owl", traits: { MYST: 0.9, DISC: 0.6, IND: 0.4, CUR: 0.5 },
          desc: "Observant, calm, and quietly wise. You notice patterns and choose your words carefully." },
        { name: "Red Panda", traits: { PLAY: 0.8, GENTLE: 0.7, IND: 0.4, CUR: 0.4 },
          desc: "Warm, quirky, and affectionate in bursts. You bring softness and charm wherever you go." },
        { name: "Dragon", traits: { BOLD: 1, MYST: 0.9, IND: 0.6, DISC: 0.4 },
          desc: "Mythic, commanding, and visionary. You carry big energy and protect what you value." },
        { name: "Dog", traits: { SOCIAL: 1, GENTLE: 0.7, PLAY: 0.6, BOLD: 0.3 },
          desc: "Loyal, warm, and grounding. You thrive in connection and make others feel safe." },
        { name: "Rabbit", traits: { GENTLE: 0.9, PLAY: 0.5, IND: 0.4, CUR: 0.3 },
          desc: "Soft-spoken, cautious, and kind. You’re sensitive to atmosphere and protect peace." },
        { name: "Jaguar", traits: { BOLD: 0.9, IND: 0.7, MYST: 0.5, DISC: 0.3 },
          desc: "Stealthy and intense. You combine power with patience and strike when it counts." },
        { name: "Leopard", traits: { CUR: 0.6, BOLD: 0.7, IND: 0.6, PLAY: 0.3 },
          desc: "Adaptable and stylish, with a quiet edge. You move fast and think on your feet." },
        { name: "Cheetah", traits: { BOLD: 0.8, CUR: 0.6, DISC: 0.4, PLAY: 0.3 },
          desc: "Fast and driven. You aim straight at what you want and thrive on momentum." },
        { name: "Phoenix", traits: { MYST: 0.9, BOLD: 0.7, GENTLE: 0.4, DISC: 0.4 },
          desc: "Resilient and radiant. You reinvent yourself and bring hope after hard seasons." },
        { name: "Eagle", traits: { BOLD: 0.8, DISC: 0.6, IND: 0.6, CUR: 0.4 },
          desc: "Clear-sighted and determined. You see the big picture and act with purpose." },
        { name: "Penguin", traits: { SOCIAL: 0.8, DISC: 0.6, GENTLE: 0.4, PLAY: 0.3 },
          desc: "Loyal and steady. You value community and show care in practical ways." },
        { name: "Panda", traits: { GENTLE: 0.9, PLAY: 0.6, SOCIAL: 0.3, IND: 0.2 },
          desc: "Calm, sweet, and grounded. You keep the vibe gentle and cozy." },
        { name: "Snake", traits: { MYST: 0.8, IND: 0.8, CUR: 0.3, DISC: 0.4 },
          desc: "Quiet and strategic. You move with precision and keep your energy protected." },
        { name: "Monkey", traits: { PLAY: 0.9, CUR: 0.8, SOCIAL: 0.6, BOLD: 0.3 },
          desc: "Energetic and clever. You learn fast and keep things lively." },
        { name: "Fox", traits: { CUR: 0.7, MYST: 0.5, IND: 0.6, PLAY: 0.4 },
          desc: "Clever and adaptable. You solve problems in creative ways and keep a playful edge." },
        { name: "Pigeon", traits: { SOCIAL: 0.7, DISC: 0.5, GENTLE: 0.3 },
          desc: "Reliable and familiar. You find your way back and keep bonds steady." },
        { name: "Parrot", traits: { SOCIAL: 0.9, PLAY: 0.7, CUR: 0.5 },
          desc: "Bright and expressive. You connect through voice, style, and curiosity." },
        { name: "Peacock", traits: { BOLD: 0.6, SOCIAL: 0.7, MYST: 0.3, PLAY: 0.3 },
          desc: "Vibrant and expressive. You bring presence and beauty to any space." },
        { name: "Duck", traits: { GENTLE: 0.6, SOCIAL: 0.5, PLAY: 0.4, DISC: 0.3 },
          desc: "Easygoing and friendly. You keep things light while moving steadily forward." },
        { name: "Swan", traits: { GENTLE: 0.7, MYST: 0.4, IND: 0.4, DISC: 0.3 },
          desc: "Graceful and composed. You move with quiet elegance and calm confidence." },
      ];
      ANIMALS.sort((a, b) => a.name.localeCompare(b.name));
      const ANIMAL_ZH = {
        Cat: { name: "猫", desc: "安静自信、敏捷且慎于信任。你按自己的节奏前进，也能发现他人忽略的细节。" },
        Tiger: { name: "老虎", desc: "专注而有力量，带着独行者的强度。你偏好精准、存在感与实质影响。" },
        Owl: { name: "猫头鹰", desc: "观察细致、冷静而有智慧。你擅长识别模式，并谨慎选择表达方式。" },
        "Red Panda": { name: "小熊猫", desc: "温暖、有趣，偶尔外放亲近。你常把柔和与魅力带到周围环境。" },
        Dragon: { name: "龙", desc: "具神话感、掌控力强、富有远见。你能量感很强，也会守护自己重视之物。" },
        Dog: { name: "狗", desc: "忠诚、温暖、让人安心。你在连接中成长，也让他人感到安全。" },
        Rabbit: { name: "兔子", desc: "温和谨慎、善良细腻。你对氛围非常敏感，倾向于维护和平。" },
        Jaguar: { name: "美洲豹", desc: "隐秘而强烈。你把力量与耐心结合，在关键时刻精准出手。" },
        Leopard: { name: "豹", desc: "适应力强、风格鲜明，带有安静锋芒。你行动迅速，临场反应好。" },
        Cheetah: { name: "猎豹", desc: "快速而有冲劲。你会直指目标，依靠节奏与动能前进。" },
        Phoenix: { name: "凤凰", desc: "韧性强且有光感。你能在困难后重建自己，并带来希望。" },
        Eagle: { name: "鹰", desc: "视野清晰、意志坚定。你能把握大局并按目标推进。" },
        Penguin: { name: "企鹅", desc: "稳重且忠诚。你重视群体与协作，并通过实际行动表达关心。" },
        Panda: { name: "熊猫", desc: "平和、可亲、踏实。你让环境更温柔、更有安全感。" },
        Snake: { name: "蛇", desc: "安静且有策略。你行动精确，也很会保护自己的精力边界。" },
        Monkey: { name: "猴子", desc: "精力足、机灵、学习快。你让场面保持活力，也擅长灵活应对。" },
        Fox: { name: "狐狸", desc: "聪明且适应快。你常用创造性的方式解决问题，并保持一点玩心。" },
        Pigeon: { name: "鸽子", desc: "可靠而熟悉。你重视稳定关系，也能持续维系联结。" },
        Parrot: { name: "鹦鹉", desc: "明亮外向、表达力强。你通过声音、风格与好奇心与人连接。" },
        Peacock: { name: "孔雀", desc: "张力十足、善于表达。你能把存在感与美感带入任何场合。" },
        Duck: { name: "鸭子", desc: "随和友善。你让气氛轻松，同时保持稳步前进。" },
        Swan: { name: "天鹅", desc: "优雅而沉着。你以平静的自信与克制推进自己。" },
      };
      const animalName = (a) => (IS_ZH ? (ANIMAL_ZH[a.name]?.name || a.name) : a.name);
      const animalDesc = (a) => (IS_ZH ? (ANIMAL_ZH[a.name]?.desc || a.desc) : a.desc);

      const LIKERT_LABELS = [
        "Strongly Disagree",
        "Disagree",
        "Slightly Disagree",
        "Neutral",
        "Slightly Agree",
        "Agree",
        "Strongly Agree",
      ];
      const LIKERT_LABELS_ZH = ["非常不同意", "不同意", "略不同意", "中立", "略同意", "同意", "非常同意"];

      let cachedName = "";
      let cachedPortrait = null;

      function buildIllustratedCanvas() {
        const canvas = document.createElement("canvas");
        const size = illustratedPortrait ? illustratedPortrait.clientWidth || 512 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const layers = [
          drawBackHair, drawBody, drawNose, drawEyes, drawEyeTint, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory
        ].filter(Boolean);
        layers.forEach((layer) => {
          if (layer instanceof HTMLCanvasElement) {
            ctx.drawImage(layer, 0, 0, size, size);
          } else if (layer.complete && layer.naturalWidth) {
            ctx.drawImage(layer, 0, 0, size, size);
          }
        });
        try {
          canvas.toDataURL("image/png");
          return canvas;
        } catch {
          return portraitCanvas || null;
        }
      }

      function updateCachedPortrait() {
        const mode = portraitMode ? portraitMode.value : "traditional";
        if (mode === "illustrated") {
          cachedPortrait = buildIllustratedCanvas() || portraitCanvas || null;
        } else {
          cachedPortrait = portraitCanvas || null;
        }
      }

      function renderQuestions() {
        questionsWrap.innerHTML = "";
        QUESTIONS.forEach((q, idx) => {
          const card = document.createElement("div");
          card.className = "personality-card";

          const title = document.createElement("h4");
          const qText = IS_ZH ? (ANIMAL_QUESTIONS_ZH[idx] || q.text) : q.text;
          title.textContent = IS_ZH ? `第${idx + 1}题。${qText}` : `Q${idx + 1}. ${qText}`;
          card.appendChild(title);

          const row = document.createElement("div");
          row.className = "likert-row";

          const labels = IS_ZH ? LIKERT_LABELS_ZH : LIKERT_LABELS;
          labels.forEach((label, i) => {
            const val = i + 1;
            const wrap = document.createElement("label");
            wrap.className = "likert-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = `aq_${idx}`;
            input.value = String(val);

            const text = document.createElement("span");
            text.textContent = label;

            wrap.appendChild(input);
            wrap.appendChild(text);
            row.appendChild(wrap);
          });

          card.appendChild(row);
          questionsWrap.appendChild(card);
        });
      }

      function renderGuidebook() {
        if (!guideBox) return;
        guideBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "动物图鉴" : "Animal Guidebook"}</h3>
            <p class="mini-note" style="margin-top:8px;">${IS_ZH ? "所有可能的动物身份及其特质。" : "All possible animal identities and their traits."}</p>
          </div>
          ${ANIMALS.map((a) => `
            <div class="personality-card">
              <h4 style="margin:0;">${animalName(a)}</h4>
              <p class="mini-note" style="margin-top:8px;">${animalDesc(a)}</p>
            </div>
          `).join("")}
        `;
      }

      function normalizeTraits(scores, maxByTrait) {
        const out = {};
        Object.keys(TRAITS).forEach((k) => {
          const max = maxByTrait[k] || 0;
          if (max <= 0) out[k] = 0;
          else out[k] = Math.max(-1, Math.min(1, (scores[k] || 0) / max));
        });
        return out;
      }

      function similarity(user, animal) {
        const keys = Object.keys(TRAITS);
        let sum = 0;
        keys.forEach((k) => {
          const a = animal[k] || 0;
          const u = user[k] || 0;
          sum += u * a;
        });
        return sum / keys.length;
      }

      function topMatches(user, animal, n) {
        const keys = Object.keys(TRAITS);
        const ranked = keys.map((k) => {
          const a = animal[k] || 0;
          const u = user[k] || 0;
          const match = 1 - Math.abs(u - a) / 2;
          return { key: k, match };
        }).sort((a, b) => b.match - a.match);
        return ranked.slice(0, n);
      }

      function getThemeVar(name, fallback) {
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        return val || fallback;
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(" ");
        let line = "";
        let yy = y;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, yy);
            line = words[i] + " ";
            yy += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, yy);
        return yy + lineHeight;
      }

      function concatBytes(chunks) {
        let total = 0;
        chunks.forEach((c) => { total += c.length; });
        const out = new Uint8Array(total);
        let offset = 0;
        chunks.forEach((c) => {
          out.set(c, offset);
          offset += c.length;
        });
        return out;
      }

      function buildPdfFromJpeg(jpegBytes, width, height) {
        const enc = new TextEncoder();
        const chunks = [];
        let offset = 0;
        const xref = [];

        function pushStr(s) {
          const b = enc.encode(s);
          chunks.push(b);
          offset += b.length;
        }
        function pushBytes(b) {
          chunks.push(b);
          offset += b.length;
        }

        pushStr("%PDF-1.3\n");
        xref.push(offset); pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        xref.push(offset); pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        xref.push(offset); pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
        xref.push(offset); pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
        pushBytes(jpegBytes);
        pushStr("\nendstream\nendobj\n");
        const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
        const contentBytes = enc.encode(content);
        xref.push(offset); pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr("\nendstream\nendobj\n");

        const xrefStart = offset;
        pushStr("xref\n0 6\n0000000000 65535 f \n");
        xref.forEach((pos) => {
          const line = String(pos).padStart(10, "0") + " 00000 n \n";
          pushStr(line);
        });
        pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
        return concatBytes(chunks);
      }

      function buildCardCanvas(result, userTraits) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 560;
        const ctx = canvas.getContext("2d");

        const bg = getThemeVar("--bg-2", "#15182a");
        const surface = getThemeVar("--surface", "rgba(255,255,255,0.06)");
        const text = getThemeVar("--text", "#e8e8e8");
        const heading = getThemeVar("--heading", "#ffffff");
        const accent = getThemeVar("--accent", "#c6a664");
        const accent2 = getThemeVar("--accent-2", "#9bc1ff");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = surface;
        ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = heading;
        ctx.font = "700 26px serif";
        ctx.fillText(IS_ZH ? "SPIRETZ 动物匹配" : "SPIRETZ Animal Match", 48, 70);

        ctx.fillStyle = accent2;
        ctx.font = "700 40px serif";
        ctx.fillText(result.name, 48, 122);

        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        let yy = wrapText(ctx, result.desc, 48, 160, 500, 22);

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? `匹配度：${result.percent}%` : `Match: ${result.percent}%`, 48, yy + 10);

        const matchText = result.topTraits.map((t) => `${TRAITS[t.key]} ${Math.round(t.match * 100)}%`).join(" · ");
        ctx.fillStyle = text;
        ctx.font = "14px sans-serif";
        ctx.fillText(matchText, 48, yy + 34);

        if (cachedName) {
          ctx.fillStyle = accent;
          ctx.font = "600 14px sans-serif";
          ctx.fillText(IS_ZH ? "姓名" : "Name", 48, yy + 64);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          ctx.fillText(cachedName, 48, yy + 88);
        }

        if (cachedPortrait && cachedPortrait.width) {
          const px = 620;
          const py = 80;
          const size = 200;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px - 6, py - 6, size + 12, size + 12);
          ctx.drawImage(cachedPortrait, px, py, size, size);
        }

        ctx.fillStyle = accent2;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "你的特质组合" : "Your trait blend", 48, 430);
        ctx.fillStyle = text;
        ctx.font = "13px sans-serif";
        const blend = Object.keys(TRAITS)
          .map((k) => `${TRAITS[k]} ${(Math.round((userTraits[k] + 1) * 50))}%`)
          .join(" · ");
        wrapText(ctx, blend, 48, 452, 800, 18);

        return canvas;
      }

      function downloadPng(canvas) {
        const link = document.createElement("a");
        link.download = "spiretz-animal-card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      function downloadPdf(canvas) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdfBytes = buildPdfFromJpeg(bytes, canvas.width, canvas.height);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "spiretz-animal-card.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }

      function calculate() {
        const scores = {};
        const maxByTrait = {};
        Object.keys(TRAITS).forEach((k) => { scores[k] = 0; maxByTrait[k] = 0; });

        const unanswered = [];

        QUESTIONS.forEach((q, idx) => {
          const checked = document.querySelector(`input[name="aq_${idx}"]:checked`);
          if (!checked) {
            unanswered.push(idx);
            return;
          }
          const val = parseInt(checked.value, 10) - 4;
          Object.entries(q.weights).forEach(([trait, weight]) => {
            scores[trait] += val * weight;
            maxByTrait[trait] += Math.abs(weight) * 3;
          });
        });

        if (unanswered.length) {
          resultsBox.style.display = "";
          const list = unanswered.map((i) => i + 1).slice(0, 8).join(", ");
          const more = unanswered.length > 8 ? ` (+${unanswered.length - 8} more)` : "";
          resultsBox.innerHTML = `
            <div class="personality-card">
              <h3 style="margin:0;">${IS_ZH ? "请完成所有题目" : "Complete all questions"}</h3>
              <p class="mini-note" style="margin-top:8px;">
                ${IS_ZH ? `请先回答全部题目后再查看结果。未作答：${list}${more}` : `Please answer every question to see results. Unanswered: ${list}${more}`}
              </p>
            </div>
          `;
          resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
          const firstMissing = document.querySelector(`input[name="aq_${unanswered[0]}"]`);
          if (firstMissing) {
            firstMissing.closest(".personality-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
            firstMissing.focus({ preventScroll: true });
          }
          return;
        }

        const userTraits = normalizeTraits(scores, maxByTrait);

        const ranked = ANIMALS.map((a) => {
          const sim = similarity(userTraits, a.traits || {});
          return { ...a, sim };
        }).sort((a, b) => b.sim - a.sim);

        const best = ranked[0];
        const percent = Math.round((best.sim + 1) * 50);
        const topTraits = topMatches(userTraits, best.traits || {}, 3);

        resultsBox.style.display = "";
        const bestName = animalName(best);
        const bestDesc = animalDesc(best);
        resultsBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "你的动物匹配" : "Your animal match"}: ${bestName}</h3>
            <p class="mini-note" style="margin-top:8px;">${bestDesc}</p>
            <div class="result-pills" style="margin-top:10px;">
              <span class="result-pill">${IS_ZH ? "匹配度" : "Match"}: ${percent}%</span>
              ${topTraits.map((t) => `<span class="result-pill">${TRAITS[t.key]} ${Math.round(t.match * 100)}%</span>`).join("")}
            </div>
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "下载你的卡片" : "Download your card"}</h4>
            <p class="mini-note" style="margin-top:8px;">
              ${IS_ZH ? "可将结果卡片保存为 PNG 或 PDF。" : "Save a small result card as a PNG or PDF."}
            </p>
            <div class="animal-actions">
              <button id="animalDownloadPng" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PNG" : "Download PNG"}</span>
                <span class="acc-icon">⬇</span>
              </button>
              <button id="animalDownloadPdf" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PDF" : "Download PDF"}</span>
                <span class="acc-icon">⬇</span>
              </button>
            </div>
          </div>
        `;

        const cardCanvas = buildCardCanvas({ ...best, name: bestName, desc: bestDesc, percent, topTraits }, userTraits);
        resultsBox.querySelector("#animalDownloadPng")?.addEventListener("click", () => downloadPng(cardCanvas));
        resultsBox.querySelector("#animalDownloadPdf")?.addEventListener("click", () => downloadPdf(cardCanvas));
        resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function resetAll() {
        document.querySelectorAll('#animalQuizQuestions input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        resultsBox.style.display = "none";
        resultsBox.innerHTML = "";
      }

      if (shareApplyBtn) {
        shareApplyBtn.addEventListener("click", () => {
          const code = shareInput ? shareInput.value.trim() : "";
          if (!code) {
            shareStatus.textContent = IS_ZH ? "请先粘贴分享码。" : "Please paste a share code first.";
            return;
          }
          if (!code.startsWith("SPIRETZ1:")) {
            shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
            cachedName = "";
            cachedPortrait = null;
            return;
          }
          if (shareCode && shareApply) {
            shareCode.value = code;
            shareApply.click();
            if (characterShareStatus && characterShareStatus.textContent.startsWith("Error")) {
              shareStatus.textContent = "Invalid code. Please paste a character share code.";
              cachedName = "";
              cachedPortrait = null;
              return;
            }
            cachedName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—") ? fullNameOut.textContent : "";
            updateCachedPortrait();
            shareStatus.textContent = cachedName ? (IS_ZH ? "代码已加载 ✅" : "Code loaded ✅") : (IS_ZH ? "代码已加载（未找到姓名）。" : "Code loaded (name not found).");
          } else {
            shareStatus.textContent = IS_ZH ? "分享系统不可用。" : "Share system not available.";
          }
        });
      }

      if (shareClearBtn) {
        shareClearBtn.addEventListener("click", () => {
          if (shareInput) shareInput.value = "";
          cachedName = "";
          cachedPortrait = null;
          shareStatus.textContent = IS_ZH ? "未加载代码。" : "No code loaded.";
        });
      }

      if (portraitMode) {
        portraitMode.addEventListener("change", () => {
          if (!cachedName && !cachedPortrait) return;
          updateCachedPortrait();
        });
      }

      [drawBackHair, drawBody, drawNose, drawEyes, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory]
        .filter(Boolean)
        .forEach((img) => {
          img.addEventListener("load", () => {
            if (portraitMode && portraitMode.value === "illustrated" && cachedName) {
              updateCachedPortrait();
            }
          });
        });

      submitBtn.addEventListener("click", calculate);
      resetBtn.addEventListener("click", resetAll);

      if (guideToggle && guideBox) {
        renderGuidebook();
        guideToggle.addEventListener("click", () => {
          const open = guideBox.style.display !== "none";
          guideBox.style.display = open ? "none" : "";
          guideToggle.querySelector(".acc-icon").textContent = open ? "▾" : "▴";
        });
      }

      renderQuestions();
    })();

    // ===== Superpower Day Quiz =====
    (function () {
      const questionsWrap = document.getElementById("superpowerQuestions");
      const submitBtn = document.getElementById("superpowerSubmit");
      const resetBtn = document.getElementById("superpowerReset");
      const resultsBox = document.getElementById("superpowerResults");
      const shareInput = document.getElementById("superShareCode");
      const shareApplyBtn = document.getElementById("superShareApply");
      const shareClearBtn = document.getElementById("superShareClear");
      const shareStatus = document.getElementById("superShareStatus");
      const portraitMode = document.getElementById("superPortraitMode");
      const shareCode = document.getElementById("shareCode");
      const shareApply = document.getElementById("shareApply");
      const characterShareStatus = document.getElementById("shareStatus");
      const fullNameOut = document.getElementById("fullNameOut");
      const portraitCanvas = document.getElementById("portraitCanvas");
      const illustratedPortrait = document.getElementById("illustratedPortrait");
      const drawBackHair = document.getElementById("drawBackHair");
      const drawBody = document.getElementById("drawBody");
      const drawNose = document.getElementById("drawNose");
      const drawEyes = document.getElementById("drawEyes");
      const drawEyeTint = document.getElementById("drawEyeTint");
      const drawWink = document.getElementById("drawWink");
      const drawClosed = document.getElementById("drawClosed");
      const drawPupil = document.getElementById("drawPupil");
      const drawBrows = document.getElementById("drawBrows");
      const drawMouth = document.getElementById("drawMouth");
      const drawFrontHair = document.getElementById("drawFrontHair");
      const drawTemples = document.getElementById("drawTemples");
      const drawBraids = document.getElementById("drawBraids");
      const drawOutfit = document.getElementById("drawOutfit");
      const drawAccessory = document.getElementById("drawAccessory");

      if (!questionsWrap || !submitBtn || !resetBtn || !resultsBox) return;

      const PROPS = [
        "Fire", "Water", "Earth", "Electricity", "Wind", "Sand", "Ice",
        "Fate", "Shadow", "Dark", "Night", "Nature", "Light",
        "Stars-Creation", "Stars-Destruction",
        "Thought", "Bright", "Heart", "Gravity", "Thunder", "Flame", "Blaze", "Sky", "Chill",
        "Sound", "Jade", "Life", "Brilliance", "Color", "Vine",
        "Origin", "Forest", "Dream", "Wave", "Metal"
      ];

      const RANKS = [
        "Common", "Fine", "Excellent", "Epic", "Legendary", "Mythical", "Temporal", "Eternal"
      ];

      const TRAITS = ["power", "focus", "harmony", "adapt", "myst", "resolve"];

      const PROP_PROFILES = [
        { name: "Fire", traits: { power: 0.9, resolve: 0.6, focus: 0.2 } },
        { name: "Water", traits: { harmony: 0.8, adapt: 0.6, focus: 0.3 } },
        { name: "Earth", traits: { focus: 0.8, resolve: 0.6, harmony: 0.3 } },
        { name: "Electricity", traits: { power: 0.8, adapt: 0.7, focus: 0.2 } },
        { name: "Wind", traits: { adapt: 0.8, power: 0.5, myst: 0.2 } },
        { name: "Sand", traits: { resolve: 0.8, focus: 0.5, harmony: 0.2 } },
        { name: "Ice", traits: { focus: 0.9, myst: 0.4, resolve: 0.3 } },
        { name: "Fate", traits: { myst: 0.9, focus: 0.4, harmony: 0.3 } },
        { name: "Shadow", traits: { myst: 0.8, focus: 0.6, adapt: 0.2 } },
        { name: "Dark", traits: { myst: 0.7, resolve: 0.6, focus: 0.3 } },
        { name: "Night", traits: { myst: 0.6, harmony: 0.4, focus: 0.4 } },
        { name: "Nature", traits: { harmony: 0.9, focus: 0.3, adapt: 0.3 } },
        { name: "Light", traits: { harmony: 0.7, power: 0.5, focus: 0.2 } },
        { name: "Stars-Creation", traits: { harmony: 0.8, myst: 0.6, resolve: 0.3 } },
        { name: "Stars-Destruction", traits: { power: 0.9, resolve: 0.6, myst: 0.3 } },
        { name: "Thought", traits: { focus: 0.8, myst: 0.4, resolve: 0.3 } },
        { name: "Bright", traits: { harmony: 0.7, adapt: 0.4, power: 0.3 } },
        { name: "Heart", traits: { harmony: 0.9, resolve: 0.3, myst: 0.2 } },
        { name: "Gravity", traits: { focus: 0.7, resolve: 0.7, power: 0.2 } },
        { name: "Thunder", traits: { power: 0.9, adapt: 0.4, resolve: 0.3 } },
        { name: "Flame", traits: { power: 0.7, focus: 0.4, resolve: 0.5 } },
        { name: "Blaze", traits: { power: 0.9, adapt: 0.3, resolve: 0.4 } },
        { name: "Sky", traits: { adapt: 0.7, harmony: 0.5, myst: 0.2 } },
        { name: "Chill", traits: { focus: 0.7, harmony: 0.4, myst: 0.3 } },
        { name: "Sound", traits: { focus: 0.6, adapt: 0.5, harmony: 0.3 } },
        { name: "Jade", traits: { resolve: 0.7, harmony: 0.5, focus: 0.3 } },
        { name: "Life", traits: { harmony: 0.9, focus: 0.2, myst: 0.3 } },
        { name: "Brilliance", traits: { power: 0.6, myst: 0.5, harmony: 0.4 } },
        { name: "Color", traits: { harmony: 0.6, adapt: 0.5, myst: 0.3 } },
        { name: "Vine", traits: { harmony: 0.7, resolve: 0.5, focus: 0.3 } },
        { name: "Origin", traits: { myst: 0.7, focus: 0.5, resolve: 0.3 } },
        { name: "Forest", traits: { harmony: 0.8, focus: 0.4, adapt: 0.3 } },
        { name: "Dream", traits: { myst: 0.9, harmony: 0.3, adapt: 0.3 } },
        { name: "Wave", traits: { adapt: 0.7, harmony: 0.5, power: 0.2 } },
        { name: "Metal", traits: { resolve: 0.8, focus: 0.5, power: 0.2 } }
      ];

      const QUESTION_TEMPLATES = [
        "You stay composed when plans shift suddenly.",
        "You prefer to act quickly rather than wait.",
        "You listen for details others miss.",
        "You keep your focus even when distracted.",
        "You thrive when you can improvise.",
        "You feel strongest when you lead.",
        "You feel strongest when you support others.",
        "You favor steady progress over fast wins.",
        "You recover quickly after setbacks.",
        "You trust your instincts more than advice.",
        "You are energized by high-stakes moments.",
        "You are energized by quiet, steady work.",
        "You choose clarity over complexity.",
        "You keep secrets with care.",
        "You notice patterns in small events.",
        "You protect what matters, even at a cost.",
        "You prefer calm spaces to loud ones.",
        "You feel most alive when learning something new.",
        "You feel most alive when creating structure.",
        "You stay grounded when others panic.",
        "You push forward even when unsure.",
        "You prefer patient strategy to bold risk.",
        "You naturally inspire others.",
        "You take pride in precision.",
        "You read a room quickly.",
        "You can wait for the right moment.",
        "You notice hidden meaning in simple things.",
        "You adapt to change without stress.",
        "You prefer balance over extremes.",
        "You follow through on long projects.",
        "You keep your energy protected from noise.",
        "You trust quiet progress over loud success.",
        "You value loyalty over popularity.",
        "You seek depth more than speed.",
        "You remain calm under pressure.",
        "You act decisively when needed.",
        "You care about impact, not applause.",
        "You keep your path even when it's hard.",
        "You aim to be fair in conflict.",
        "You hold onto hope during setbacks."
      ];
      const QUESTION_TEMPLATES_ZH = [
        "当计划突然变化时，你仍能保持冷静。",
        "你更倾向于快速行动，而不是等待。",
        "你会注意到别人忽略的细节。",
        "即使被干扰，你也能保持专注。",
        "当你可以随机应变时，你会表现更好。",
        "当你担任领头角色时，你会更强。",
        "当你支持他人时，你会更强。",
        "相比快速取胜，你更偏好稳步推进。",
        "经历挫折后，你恢复得很快。",
        "相比建议，你更相信自己的直觉。",
        "高压力场景会让你更有活力。",
        "安静稳定的工作会让你更有活力。",
        "你偏好清晰而非复杂。",
        "你会谨慎地守住秘密。",
        "你能从小事件里看见模式。",
        "即使要付出代价，你也会守护重要之物。",
        "你偏好安静空间而不是喧闹环境。",
        "学习新事物会让你最有生命感。",
        "建立秩序会让你最有生命感。",
        "当别人慌乱时，你依然稳得住。",
        "即使不确定，你也会向前推进。",
        "你更偏好耐心策略而非大胆冒险。",
        "你天生就能激励别人。",
        "你为精准而自豪。",
        "你能很快读懂现场氛围。",
        "你可以等待最合适的时机。",
        "你能在简单事物中看见隐藏意义。",
        "你能无压力适应变化。",
        "你偏好平衡而非极端。",
        "你能坚持推进长期项目。",
        "你会保护自己的精力，不被噪音消耗。",
        "相比高调成功，你更信任静默进步。",
        "你看重忠诚胜过人气。",
        "相比速度，你更追求深度。",
        "压力之下你依然冷静。",
        "该果断时你会果断行动。",
        "你在乎的是影响力，而不是掌声。",
        "即使困难，你也会坚持自己的道路。",
        "在冲突中你会努力保持公正。",
        "在挫折中你依然保有希望。"
      ];

      function buildQuestions() {
        const templates = IS_ZH ? QUESTION_TEMPLATES_ZH : QUESTION_TEMPLATES;
        const traitCycle = ["focus", "power", "harmony", "adapt", "myst", "resolve"];
        return templates.map((text, idx) => {
          const t1 = traitCycle[idx % traitCycle.length];
          const t2 = traitCycle[(idx + 2) % traitCycle.length];
          return {
            text,
            traits: { [t1]: 1, [t2]: 1 }
          };
        });
      }

      const QUESTIONS = buildQuestions();

      const LIKERT_LABELS = [
        "Strongly Disagree",
        "Disagree",
        "Slightly Disagree",
        "Neutral",
        "Slightly Agree",
        "Agree",
        "Strongly Agree",
      ];
      const LIKERT_LABELS_ZH = ["非常不同意", "不同意", "略不同意", "中立", "略同意", "同意", "非常同意"];
      let cachedName = "";
      let cachedPortrait = null;

      function buildIllustratedCanvas() {
        const canvas = document.createElement("canvas");
        const size = illustratedPortrait ? illustratedPortrait.clientWidth || 512 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const layers = [
          drawBackHair, drawBody, drawNose, drawEyes, drawEyeTint, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory
        ].filter(Boolean);
        layers.forEach((layer) => {
          if (layer instanceof HTMLCanvasElement) {
            ctx.drawImage(layer, 0, 0, size, size);
          } else if (layer.complete && layer.naturalWidth) {
            ctx.drawImage(layer, 0, 0, size, size);
          }
        });
        try {
          canvas.toDataURL("image/png");
          return canvas;
        } catch {
          return portraitCanvas || null;
        }
      }

      function updateCachedPortrait() {
        const mode = portraitMode ? portraitMode.value : "traditional";
        if (mode === "illustrated") {
          cachedPortrait = buildIllustratedCanvas() || portraitCanvas || null;
        } else {
          cachedPortrait = portraitCanvas || null;
        }
      }

      function renderQuestions() {
        questionsWrap.innerHTML = "";
        QUESTIONS.forEach((q, idx) => {
          const card = document.createElement("div");
          card.className = "personality-card";

          const title = document.createElement("h4");
          title.textContent = IS_ZH ? `第${idx + 1}题。${q.text}` : `Q${idx + 1}. ${q.text}`;
          card.appendChild(title);

          const row = document.createElement("div");
          row.className = "likert-row";

          const labels = IS_ZH ? LIKERT_LABELS_ZH : LIKERT_LABELS;
          labels.forEach((label, i) => {
            const val = i + 1;
            const wrap = document.createElement("label");
            wrap.className = "likert-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = `spq_${idx}`;
            input.value = String(val);

            const text = document.createElement("span");
            text.textContent = label;

            wrap.appendChild(input);
            wrap.appendChild(text);
            row.appendChild(wrap);
          });

          card.appendChild(row);
          questionsWrap.appendChild(card);
        });
      }

      function getThemeVar(name, fallback) {
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        return val || fallback;
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(" ");
        let line = "";
        let yy = y;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, yy);
            line = words[i] + " ";
            yy += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, yy);
        return yy + lineHeight;
      }

      function concatBytes(chunks) {
        let total = 0;
        chunks.forEach((c) => { total += c.length; });
        const out = new Uint8Array(total);
        let offset = 0;
        chunks.forEach((c) => {
          out.set(c, offset);
          offset += c.length;
        });
        return out;
      }

      function buildPdfFromJpeg(jpegBytes, width, height) {
        const enc = new TextEncoder();
        const chunks = [];
        let offset = 0;
        const xref = [];

        function pushStr(s) {
          const b = enc.encode(s);
          chunks.push(b);
          offset += b.length;
        }
        function pushBytes(b) {
          chunks.push(b);
          offset += b.length;
        }

        pushStr("%PDF-1.3\n");
        xref.push(offset); pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        xref.push(offset); pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        xref.push(offset); pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
        xref.push(offset); pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
        pushBytes(jpegBytes);
        pushStr("\nendstream\nendobj\n");
        const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
        const contentBytes = enc.encode(content);
        xref.push(offset); pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr("\nendstream\nendobj\n");

        const xrefStart = offset;
        pushStr("xref\n0 6\n0000000000 65535 f \n");
        xref.forEach((pos) => {
          const line = String(pos).padStart(10, "0") + " 00000 n \n";
          pushStr(line);
        });
        pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
        return concatBytes(chunks);
      }

      function downloadPng(canvas) {
        const link = document.createElement("a");
        link.download = "spiretz-superpower-card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      function downloadPdf(canvas) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdfBytes = buildPdfFromJpeg(bytes, canvas.width, canvas.height);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "spiretz-superpower-card.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }

      function pickRings(propScores, traitScores) {
        const entries = Object.entries(propScores).sort((a, b) => b[1] - a[1]);
        const topScore = entries[0]?.[1] || 0;
        const secondScore = entries[1]?.[1] || 0;
        const thirdScore = entries[2]?.[1] || 0;
        const power = traitScores.power || 0;
        const focus = traitScores.focus || 0;
        const harmony = traitScores.harmony || 0;
        let ringCount = 1;
        if (topScore >= 12 && power + focus + harmony >= 7) ringCount = 3;
        else if (topScore >= 7 || power + focus + harmony >= 5) ringCount = 2;

        const chosen = [];
        for (let i = 0; i < ringCount; i++) {
          if (i === 1 && topScore >= secondScore + 3) {
            chosen.push(entries[0]);
          } else if (i === 2 && topScore >= thirdScore + 5) {
            chosen.push(entries[0]);
          } else {
            chosen.push(entries[i] || entries[0]);
          }
        }
        const hasCreation = chosen.some((c) => c[0] === "Stars-Creation");
        const hasDestruction = chosen.some((c) => c[0] === "Stars-Destruction");
        if (hasCreation && hasDestruction) {
          const creationScore = chosen.find((c) => c[0] === "Stars-Creation")?.[1] ?? -Infinity;
          const destructionScore = chosen.find((c) => c[0] === "Stars-Destruction")?.[1] ?? -Infinity;
          const removeName = creationScore <= destructionScore ? "Stars-Creation" : "Stars-Destruction";
          for (let i = 0; i < chosen.length; i++) {
            if (chosen[i][0] === removeName) {
              const replacement = entries.find((e) => e[0] !== "Stars-Creation" && e[0] !== "Stars-Destruction");
              if (replacement) chosen[i] = replacement;
              break;
            }
          }
        }
        const hasDestructionFinal = chosen.some((c) => c[0] === "Stars-Destruction");
        const hasCreationFinal = chosen.some((c) => c[0] === "Stars-Creation");

        const maxIndex = ringCount === 3 ? 7 : 6;
        const strength = Math.max(0, topScore + power + focus + harmony);
        let baseRank = 1;
        if (strength >= 8) baseRank = 2;
        if (strength >= 11) baseRank = 3;
        if (strength >= 14) baseRank = 4;
        if (strength >= 17) baseRank = 5;
        if (strength >= 20) baseRank = 6;
        if (ringCount === 3 && strength >= 24) baseRank = 7;
        baseRank = Math.min(maxIndex, Math.max(1, baseRank));

        return chosen.map((entry, idx) => {
          const ringIdx = idx + 1;
          const rankOffset = ringIdx - 2;
          let rankIndex = baseRank + rankOffset;
          rankIndex = Math.max(0, Math.min(maxIndex, rankIndex));
          if (ringCount < 3 && rankIndex > 6) rankIndex = 6;
          const primaryScore = entry[1];
          const primary = entry[0];
          const candidates = primary === "Stars-Destruction"
            ? []
            : entries
                .filter((e) => e[0] !== primary)
                .filter((e) => e[0] !== "Stars-Destruction")
                .filter((e) => !hasDestructionFinal || e[0] !== "Stars-Creation")
                .filter((e) => !hasCreationFinal || e[0] !== "Stars-Destruction");
          const extras = candidates
            .filter((e) => e[1] >= primaryScore - 0.6)
            .slice(0, 1)
            .map((e) => e[0]);
          if (extras.length === 1) {
            const third = candidates.find((e) => e[1] >= primaryScore - 0.2 && e[0] !== extras[0]);
            if (third) extras.push(third[0]);
          }
          const properties = [primary].concat(extras);
          return {
            property: properties.join(" / "),
            properties,
            score: entry[1],
            rank: RANKS[rankIndex]
          };
        });
      }

      function buildCardCanvas(rings) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 560;
        const ctx = canvas.getContext("2d");

        const bg = getThemeVar("--bg-2", "#15182a");
        const surface = getThemeVar("--surface", "rgba(255,255,255,0.06)");
        const text = getThemeVar("--text", "#e8e8e8");
        const heading = getThemeVar("--heading", "#ffffff");
        const accent = getThemeVar("--accent", "#c6a664");
        const accent2 = getThemeVar("--accent-2", "#9bc1ff");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = surface;
        ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = heading;
        ctx.font = "700 26px serif";
        ctx.fillText(IS_ZH ? "超能力日魔法环" : "Superpower Day Rings", 48, 70);

        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        wrapText(ctx, IS_ZH ? "Pesimura · 12月26日 · 成年时觉醒魔法环。" : "Pesimura · December 26 · Rings awaken when you reach adulthood.", 48, 98, 800, 22);

        ctx.fillStyle = accent;
        ctx.font = "700 18px serif";
        ctx.fillText(IS_ZH ? `魔法环数：${rings.length}` : `Rings: ${rings.length}`, 48, 140);
        if (cachedName) {
          ctx.fillStyle = accent2;
          ctx.font = "600 14px sans-serif";
          ctx.fillText(IS_ZH ? "姓名" : "Name", 48, 164);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          ctx.fillText(cachedName, 48, 186);
        }

        const startY = 180;
        const cardW = 250;
        rings.forEach((ring, idx) => {
          const x = 48 + idx * (cardW + 16);
          const y = startY;
          const innerX = x + 16;
          const innerW = cardW - 32;
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(x, y, cardW, 220);
          ctx.fillStyle = accent2;
          ctx.font = "700 18px serif";
          ctx.fillText(IS_ZH ? `魔法环 ${idx + 1}` : `Ring ${idx + 1}`, innerX, y + 36);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          let yy = wrapText(ctx, IS_ZH ? `属性：${ring.property}` : `Property: ${ring.property}`, innerX, y + 70, innerW, 20);
          const rankStyles = {
            Common: { fill: "#b8b8b8" },
            Fine: { fill: "#9bc1ff" },
            Excellent: { fill: "#7ad6c5" },
            Epic: { fill: "#b58cff" },
            Legendary: { fill: "#f0b55a" },
            Mythical: { fill: "#ff7fb0" },
            Temporal: { fill: "#9ef2ff" },
            Eternal: { fill: "#ffd166" },
          };
          const rank = rankStyles[ring.rank] || rankStyles.Common;
          ctx.fillStyle = rank.fill;
          ctx.fillRect(innerX, yy + 6, Math.min(150, innerW), 26);
          ctx.fillStyle = "#1d1a16";
          ctx.font = "700 14px sans-serif";
          ctx.fillText(ring.rankLabel || ring.rank, innerX + 10, yy + 24);
        });

        if (cachedPortrait && cachedPortrait.width) {
          const px = 708;
          const py = 80;
          const size = 140;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px - 6, py - 6, size + 12, size + 12);
          ctx.drawImage(cachedPortrait, px, py, size, size);
        }

        return canvas;
      }

      function calculate() {
        const traitScores = {};
        TRAITS.forEach((t) => { traitScores[t] = 0; });

        const unanswered = [];

        QUESTIONS.forEach((q, idx) => {
          const checked = document.querySelector(`input[name="spq_${idx}"]:checked`);
          if (!checked) {
            unanswered.push(idx);
            return;
          }
          const val = parseInt(checked.value, 10) - 4;
          Object.entries(q.traits || {}).forEach(([t, w]) => {
            traitScores[t] += val * w;
          });
        });

        if (unanswered.length) {
          resultsBox.style.display = "";
          const list = unanswered.map((i) => i + 1).slice(0, 8).join(", ");
          const more = unanswered.length > 8 ? ` (+${unanswered.length - 8} more)` : "";
          resultsBox.innerHTML = `
            <div class="personality-card">
              <h3 style="margin:0;">${IS_ZH ? "请完成所有题目" : "Complete all questions"}</h3>
              <p class="mini-note" style="margin-top:8px;">
                ${IS_ZH ? `请先回答全部题目后再查看结果。未作答：${list}${more}` : `Please answer every question to see results. Unanswered: ${list}${more}`}
              </p>
            </div>
          `;
          resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
          const firstMissing = document.querySelector(`input[name="spq_${unanswered[0]}"]`);
          if (firstMissing) {
            firstMissing.closest(".personality-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
            firstMissing.focus({ preventScroll: true });
          }
          return;
        }

        const propScores = {};
        PROP_PROFILES.forEach((p) => {
          let score = 0;
          TRAITS.forEach((t) => {
            score += (traitScores[t] || 0) * (p.traits[t] || 0);
          });
          propScores[p.name] = score;
        });

        const rings = pickRings(propScores, traitScores);
        const fancyByRank = {
          Common: "color:#f5efe6; background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.35);",
          Fine: "color:#f5efe6; background:rgba(155,193,255,0.22); border:1px solid rgba(155,193,255,0.55);",
          Excellent: "color:#f5efe6; background:rgba(122,214,197,0.22); border:1px solid rgba(122,214,197,0.55);",
          Epic: "color:#f5efe6; background:rgba(181,140,255,0.24); border:1px solid rgba(181,140,255,0.6);",
          Legendary: "color:#f5efe6; background:rgba(240,181,90,0.26); border:1px solid rgba(240,181,90,0.65);",
          Mythical: "color:#f5efe6; background:rgba(255,127,176,0.28); border:1px solid rgba(255,127,176,0.7);",
          Temporal: "color:#f5efe6; background:rgba(158,242,255,0.28); border:1px solid rgba(158,242,255,0.75); box-shadow:0 0 12px rgba(158,242,255,0.25);",
          Eternal: "color:#f5efe6; background:rgba(255,209,102,0.32); border:1px solid rgba(255,209,102,0.8); box-shadow:0 0 16px rgba(255,209,102,0.45);"
        };
        const propertyPalette = {
          "Fire": "#4d0f16",
          "Water": "#0b2a4d",
          "Earth": "#2c1f1a",
          "Electricity": "#2a1347",
          "Wind": "#113034",
          "Sand": "#3a2613",
          "Ice": "#0b2f3a",
          "Fate": "#2b183f",
          "Shadow": "#120f1f",
          "Dark": "#0b0a12",
          "Night": "#101534",
          "Nature": "#12301e",
          "Light": "#3b2c0f",
          "Stars-Creation": "#1f1a33",
          "Stars-Destruction": "#2d0b0b",
          "Thought": "#1a1f35",
          "Bright": "#2f2b16",
          "Heart": "#3a1420",
          "Gravity": "#1b1a24",
          "Thunder": "#1a0f2d",
          "Flame": "#3b120c",
          "Blaze": "#4a1408",
          "Sky": "#12253b",
          "Chill": "#0f2a33",
          "Sound": "#1a2133",
          "Jade": "#123327",
          "Life": "#1c2f1a",
          "Brilliance": "#2f1f12",
          "Color": "#2b1530",
          "Vine": "#1a2b1a",
          "Origin": "#1f1a2a",
          "Forest": "#14301b",
          "Dream": "#1a1230",
          "Wave": "#0d2440",
          "Metal": "#2a2a2f"
        };
        function hashColor(name) {
          let hash = 0;
          for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
          const hue = Math.abs(hash) % 360;
          return `hsl(${hue}, 35%, 20%)`;
        }
        function propColor(name) {
          return propertyPalette[name] || hashColor(name);
        }
        function ringGradient(props) {
          const list = (props && props.length ? props : []).map(propColor);
          const colors = list.length ? list.slice(0, 3) : ["#1a1520", "#211b2a", "#151019"];
          return `linear-gradient(135deg, ${colors.join(", ")})`;
        }

        const PROP_ZH = {
          Fire: "火", Water: "水", Earth: "土", Electricity: "电", Wind: "风", Sand: "沙", Ice: "冰",
          Fate: "命运", Shadow: "暗影", Dark: "黑暗", Night: "夜", Nature: "自然", Light: "光",
          "Stars-Creation": "星辰-创造", "Stars-Destruction": "星辰-毁灭", Thought: "思维", Bright: "明辉",
          Heart: "心", Gravity: "重力", Thunder: "雷", Flame: "炎", Blaze: "焰", Sky: "天空",
          Chill: "寒霜", Sound: "音", Jade: "玉", Life: "生命", Brilliance: "辉耀", Color: "色彩",
          Vine: "藤", Origin: "本源", Forest: "森林", Dream: "梦", Wave: "波", Metal: "金属"
        };
        const RANK_ZH = {
          Common: "普通", Fine: "精良", Excellent: "优秀", Epic: "史诗",
          Legendary: "传奇", Mythical: "神话", Temporal: "时序", Eternal: "永恒"
        };
        const ringPropertyLabel = (s) => {
          if (!IS_ZH) return s;
          return s.split(" / ").map((x) => PROP_ZH[x] || x).join(" / ");
        };
        const ringRankLabel = (s) => IS_ZH ? (RANK_ZH[s] || s) : s;
        const ringsView = rings.map((r) => ({
          ...r,
          property: ringPropertyLabel(r.property),
          rankLabel: ringRankLabel(r.rank)
        }));

        resultsBox.style.display = "";
        resultsBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "你的魔法环" : "Your Rings"}</h3>
            <p class="mini-note" style="margin-top:8px;">
              ${IS_ZH ? "在 Pesimura，成年当年的 12 月 26 日会觉醒魔法环。" : "Rings awaken in Pesimura on December 26, the year you become an adult."}
            </p>
            <div class="result-pills" style="margin-top:10px;">
              <span class="result-pill">${IS_ZH ? "魔法环数" : "Rings"}: ${ringsView.length}</span>
            </div>
          </div>
          <div class="personality-card">
            ${ringsView.map((r, idx) => `
              <div class="rule-note" style="margin-top:10px; border-color: rgba(255,255,255,0.18); background:${ringGradient(r.properties || [r.property])}; color:#f5efe6; box-shadow:0 12px 26px rgba(0,0,0,0.18);">
                <p style="margin:0; color:#f5efe6;"><b>${IS_ZH ? "魔法环" : "Ring"} ${idx + 1}</b> · ${IS_ZH ? "属性" : "Property"}: ${r.property}</p>
                <span style="display:inline-flex; margin-top:8px; padding:6px 12px; border-radius:999px; font-weight:700; letter-spacing:0.3px; text-shadow:0 1px 2px rgba(0,0,0,0.4); ${fancyByRank[r.rank] || ""}">${r.rankLabel || r.rank}</span>
              </div>
            `).join("")}
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "下载你的卡片" : "Download your card"}</h4>
            <p class="mini-note" style="margin-top:8px;">
              ${IS_ZH ? "可将结果卡片保存为 PNG 或 PDF。" : "Save a small result card as a PNG or PDF."}
            </p>
            <div class="animal-actions">
              <button id="superpowerDownloadPng" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PNG" : "Download PNG"}</span>
                <span class="acc-icon">⬇</span>
              </button>
              <button id="superpowerDownloadPdf" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PDF" : "Download PDF"}</span>
                <span class="acc-icon">⬇</span>
              </button>
            </div>
          </div>
        `;

        const cardCanvas = buildCardCanvas(ringsView);
        resultsBox.querySelector("#superpowerDownloadPng")?.addEventListener("click", () => downloadPng(cardCanvas));
        resultsBox.querySelector("#superpowerDownloadPdf")?.addEventListener("click", () => downloadPdf(cardCanvas));
        resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function resetAll() {
        document.querySelectorAll('#superpowerQuestions input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        resultsBox.style.display = "none";
        resultsBox.innerHTML = "";
      }

      if (shareApplyBtn) {
        shareApplyBtn.addEventListener("click", () => {
          const code = shareInput ? shareInput.value.trim() : "";
          if (!code) {
            shareStatus.textContent = IS_ZH ? "请先粘贴分享码。" : "Please paste a share code first.";
            return;
          }
          if (!code.startsWith("SPIRETZ1:")) {
            shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
            cachedName = "";
            cachedPortrait = null;
            return;
          }
          if (shareCode && shareApply) {
            shareCode.value = code;
            shareApply.click();
            if (characterShareStatus && characterShareStatus.textContent.startsWith("Error")) {
              shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
              cachedName = "";
              cachedPortrait = null;
              return;
            }
            cachedName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—") ? fullNameOut.textContent : "";
            updateCachedPortrait();
            shareStatus.textContent = cachedName ? (IS_ZH ? "代码已加载 ✅" : "Code loaded ✅") : (IS_ZH ? "代码已加载（未找到姓名）。" : "Code loaded (name not found).");
          } else {
            shareStatus.textContent = IS_ZH ? "分享系统不可用。" : "Share system not available.";
          }
        });
      }

      if (shareClearBtn) {
        shareClearBtn.addEventListener("click", () => {
          if (shareInput) shareInput.value = "";
          cachedName = "";
          cachedPortrait = null;
          shareStatus.textContent = IS_ZH ? "未加载代码。" : "No code loaded.";
        });
      }

      if (portraitMode) {
        portraitMode.addEventListener("change", () => {
          if (!cachedName && !cachedPortrait) return;
          updateCachedPortrait();
        });
      }

      [drawBackHair, drawBody, drawNose, drawEyes, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory]
        .filter(Boolean)
        .forEach((img) => {
          img.addEventListener("load", () => {
            if (portraitMode && portraitMode.value === "illustrated" && cachedName) {
              updateCachedPortrait();
            }
          });
        });

      submitBtn.addEventListener("click", calculate);
      resetBtn.addEventListener("click", resetAll);

      renderQuestions();
    })();

    // ===== SPIRETZ Cook =====
    (function () {
      const ingWrap = document.getElementById("cookIngredients");
      const seaWrap = document.getElementById("cookSeasonings");
      const metWrap = document.getElementById("cookMethods");
      const makeBtn = document.getElementById("cookMake");
      const resetBtn = document.getElementById("cookReset");
      const statusOut = document.getElementById("cookStatus");
      const bookWrap = document.getElementById("cookBook");
      const saveCode = document.getElementById("cookSaveCode");
      const saveBtn = document.getElementById("cookSave");
      const loadBtn = document.getElementById("cookLoad");
      const coinOut = document.getElementById("cookCoins");
      const repOut = document.getElementById("cookRep");
      const advOut = document.getElementById("cookAdvancedCount");
      const unlockIngBtn = document.getElementById("cookUnlockIng");
      const unlockSeaBtn = document.getElementById("cookUnlockSea");
      const unlockMetBtn = document.getElementById("cookUnlockMet");
      const hintBtn = document.getElementById("cookHintBuy");
      const hintWrap = document.getElementById("cookHints");
      const guideWrap = document.getElementById("cookCustomerGuide");
      const customerOut = document.getElementById("cookCustomer");
      const serveBtn = document.getElementById("cookServe");
      const skipBtn = document.getElementById("cookSkip");
      const lastDishOut = document.getElementById("cookLastDish");

      if (!ingWrap || !seaWrap || !metWrap || !makeBtn || !resetBtn || !bookWrap) return;

      const INGREDIENTS = [
        "moon rice", "sunroot", "river beans", "cloud tofu", "ember fish", "forest mushroom",
        "crystal onion", "sky kale", "dawn berry", "iron pumpkin", "golden corn", "wind garlic",
        "silver noodles", "mist shrimp", "lava pepperleaf", "root carrot", "amber apple",
        "cobalt algae", "stone lentils", "honey yam", "star potato",
        "glacier kelp", "ember tomato", "midnight squash", "sunflower grain", "cloudberry",
        "storm barley", "jade celery", "sky trout", "starfruit", "onion bloom"
      ];
      const SEASONINGS = [
        "salt glass", "sweet mist", "smoke pepper", "herb spiral", "citrus ash",
        "night sugar", "sea umami", "star honey", "vine leaf", "black spice",
        "ginger glow", "mint dust", "chili flake", "saffron spark", "soy ripple",
        "umbral vinegar", "crystal salt", "ember oil", "sky basil", "lunar lime"
      ];
      const METHODS = [
        "simmer", "grill", "steam", "bake", "stir-fry", "roast",
        "braise", "poach", "smoke", "sear", "ferment", "char"
      ];

      const ADVANCED_RECIPES = [
        {
          name: "starlit harvest bowl",
          method: "simmer",
          ingredients: ["moon rice", "golden corn", "sunroot", "sky kale"],
          seasonings: ["star honey", "herb spiral", "salt glass", "vine leaf"],
          coins: 6
        },
        {
          name: "ember festival feast",
          method: "grill",
          ingredients: ["ember fish", "crystal onion", "iron pumpkin", "wind garlic"],
          seasonings: ["smoke pepper", "black spice", "salt glass", "sea umami"],
          coins: 7
        },
        {
          name: "moonmist tofu tapestry",
          method: "steam",
          ingredients: ["cloud tofu", "sky kale", "forest mushroom", "sunroot"],
          seasonings: ["sweet mist", "vine leaf", "salt glass", "citrus ash"],
          coins: 6
        },
        {
          name: "dawn orchard bake",
          method: "bake",
          ingredients: ["dawn berry", "golden corn", "moon rice", "sunroot"],
          seasonings: ["night sugar", "star honey", "salt glass", "herb spiral"],
          coins: 7
        },
        {
          name: "river garden stew",
          method: "simmer",
          ingredients: ["river beans", "sky kale", "forest mushroom", "crystal onion"],
          seasonings: ["herb spiral", "vine leaf", "salt glass", "citrus ash"],
          coins: 6
        },
        {
          name: "silver noodle blaze",
          method: "stir-fry",
          ingredients: ["silver noodles", "ember fish", "wind garlic", "crystal onion"],
          seasonings: ["chili flake", "soy ripple", "smoke pepper", "salt glass"],
          coins: 8
        },
        {
          name: "honey yam roast",
          method: "roast",
          ingredients: ["honey yam", "root carrot", "iron pumpkin", "sunroot"],
          seasonings: ["star honey", "ginger glow", "salt glass", "herb spiral"],
          coins: 7
        },
        {
          name: "glacier kelp tableau",
          method: "poach",
          ingredients: ["glacier kelp", "mist shrimp", "sky kale", "moon rice"],
          seasonings: ["sea umami", "crystal salt", "lunar lime", "vine leaf"],
          coins: 8
        },
        {
          name: "ember tomato char",
          method: "char",
          ingredients: ["ember tomato", "crystal onion", "wind garlic", "jade celery"],
          seasonings: ["ember oil", "black spice", "salt glass", "smoke pepper"],
          coins: 8
        },
        {
          name: "midnight squash braise",
          method: "braise",
          ingredients: ["midnight squash", "root carrot", "stone lentils", "sunroot"],
          seasonings: ["umbral vinegar", "ginger glow", "herb spiral", "salt glass"],
          coins: 9
        },
        {
          name: "sky trout sear",
          method: "sear",
          ingredients: ["sky trout", "crystal onion", "jade celery", "moon rice"],
          seasonings: ["lunar lime", "sea umami", "salt glass", "mint dust"],
          coins: 8
        },
        {
          name: "starfruit ferment",
          method: "ferment",
          ingredients: ["starfruit", "amber apple", "cloudberry", "sunflower grain"],
          seasonings: ["night sugar", "lunar lime", "crystal salt", "vine leaf"],
          coins: 9
        },
        {
          name: "storm barley smoke",
          method: "smoke",
          ingredients: ["storm barley", "silver noodles", "ember fish", "onion bloom"],
          seasonings: ["smoke pepper", "black spice", "soy ripple", "salt glass"],
          coins: 9
        }
      ];

      const CUSTOMER_TYPES = [
        { id: "fish", label: "Fish-only customer", check: (dish) => dish.tags.fish },
        { id: "tofu", label: "Tofu lover", check: (dish) => dish.tags.tofu },
        { id: "veg", label: "Vegetarian", check: (dish) => dish.tags.veg },
        { id: "child", label: "Child", check: (dish) => dish.tags.child },
        { id: "elder", label: "Elderly", check: (dish) => dish.tags.elder },
        { id: "spicy", label: "Spice seeker", check: (dish) => dish.tags.spicy },
        { id: "sweet", label: "Sweet tooth", check: (dish) => dish.tags.sweet },
        { id: "herbal", label: "Herbal purist", check: (dish) => dish.tags.herbal },
        { id: "sea", label: "Sea-lover", check: (dish) => dish.tags.sea },
        { id: "light", label: "Light eater", check: (dish) => dish.tags.light },
        { id: "chef", label: "Master chef", check: (dish) => dish.tags.herbal || dish.tags.sea },
        { id: "traveler", label: "World traveler", check: (dish) => dish.tags.spicy || dish.tags.sweet },
        { id: "ritual", label: "Ritual diner", check: (dish) => dish.method === "simmer" || dish.method === "steam" },
        { id: "rich", label: "Rich patron", check: (dish) => dish.isAdvanced }
      ];
      if (IS_ZH) {
        const zhCustomer = {
          "Fish-only customer": "只吃鱼顾客",
          "Tofu lover": "豆腐爱好者",
          "Vegetarian": "素食者",
          "Child": "小孩",
          "Elderly": "长者",
          "Spice seeker": "嗜辣者",
          "Sweet tooth": "嗜甜者",
          "Herbal purist": "草本偏好者",
          "Sea-lover": "海味偏好者",
          "Light eater": "清淡饮食者",
          "Master chef": "大师主厨",
          "World traveler": "世界旅行者",
          "Ritual diner": "仪式型食客",
          "Rich patron": "富豪食客"
        };
        CUSTOMER_TYPES.forEach((c) => { c.label = zhCustomer[c.label] || c.label; });
      }
      const COOK_ZH = {
        "Locked": "未解锁",
        "None": "无",
        "No dishes yet.": "暂无菜品。",
        "No hints yet.": "暂无提示。",
        "Price": "价格",
        "coin": "金币",
        "coins": "金币",
        "Method": "做法",
        "Ingredients": "食材",
        "Seasonings": "调味",
      };
      const COOK_ITEM_ZH = {
        "moon rice": "月米", "sunroot": "日根", "river beans": "河豆", "cloud tofu": "云豆腐", "ember fish": "余烬鱼",
        "forest mushroom": "林菇", "crystal onion": "水晶洋葱", "sky kale": "天空羽衣甘蓝", "dawn berry": "晨曦莓", "iron pumpkin": "铁南瓜",
        "golden corn": "金玉米", "wind garlic": "风蒜", "silver noodles": "银丝面", "mist shrimp": "雾虾", "lava pepperleaf": "熔岩椒叶",
        "root carrot": "根胡萝卜", "amber apple": "琥珀苹果", "cobalt algae": "钴藻", "stone lentils": "石扁豆", "honey yam": "蜜薯",
        "star potato": "星土豆", "glacier kelp": "冰川海带", "ember tomato": "余烬番茄", "midnight squash": "午夜南瓜", "sunflower grain": "向日葵谷粒",
        "cloudberry": "云莓", "storm barley": "风暴大麦", "jade celery": "玉芹", "sky trout": "天鳟", "starfruit": "杨桃", "onion bloom": "洋葱花",
        "salt glass": "晶盐", "sweet mist": "甜雾", "smoke pepper": "烟椒", "herb spiral": "草本卷", "citrus ash": "柑灰",
        "night sugar": "夜糖", "sea umami": "海鲜鲜味", "star honey": "星蜜", "vine leaf": "藤叶", "black spice": "黑香料",
        "ginger glow": "姜辉", "mint dust": "薄荷尘", "chili flake": "辣椒碎", "saffron spark": "藏红花火花", "soy ripple": "酱油涟漪",
        "umbral vinegar": "暗影醋", "crystal salt": "水晶盐", "ember oil": "余烬油", "sky basil": "天空罗勒", "lunar lime": "月青柠",
        "simmer": "炖煮", "grill": "烤制", "steam": "蒸制", "bake": "烘烤", "stir-fry": "快炒", "roast": "焙烤",
        "braise": "焖煮", "poach": "汆煮", "smoke": "烟熏", "sear": "煎封", "ferment": "发酵", "char": "焦烤",
        "starlit harvest bowl": "星辉丰收碗", "ember festival feast": "余烬节庆盛宴", "moonmist tofu tapestry": "月雾豆腐锦",
        "dawn orchard bake": "晨园烘烤", "river garden stew": "河园炖", "silver noodle blaze": "银面烈焰", "honey yam roast": "蜜薯烤拼",
        "glacier kelp tableau": "冰川海带拼盘", "ember tomato char": "余烬番茄焦烤", "midnight squash braise": "午夜南瓜焖",
        "sky trout sear": "天鳟煎封", "starfruit ferment": "杨桃发酵", "storm barley smoke": "风暴大麦烟熏",
        "plain": "清淡", "mix": "拼配"
      };
      const cookLabel = (s) => IS_ZH ? (COOK_ZH[s] || s) : s;
      const cookText = (s) => IS_ZH ? (COOK_ITEM_ZH[s] || s) : s;
      const cookList = (arr) => arr.map(cookText).join(", ");

      const STATE = {
        unlockedIng: 2,
        unlockedSea: 2,
        unlockedMet: 2,
        dishes: [],
        coins: 0,
        lastDish: null,
        hints: [],
        reputation: 50,
        customer: null,
        richProgress: []
      };

      function renderList(wrap, list, unlocked, namePrefix) {
        wrap.innerHTML = "";
        list.forEach((item, i) => {
          const label = document.createElement("label");
          label.className = "cook-item";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = `${namePrefix}_${i}`;
          input.value = item;
          input.disabled = i >= unlocked;
          const span = document.createElement("span");
          span.textContent = i < unlocked ? cookText(item) : cookLabel("Locked");
          label.appendChild(input);
          label.appendChild(span);
          wrap.appendChild(label);
        });
      }

      function renderMethods() {
        metWrap.innerHTML = "";
        METHODS.forEach((m, i) => {
          const label = document.createElement("label");
          label.className = "cook-item";
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "cook_method";
          input.value = m;
          input.disabled = i >= STATE.unlockedMet;
          const span = document.createElement("span");
          span.textContent = i < STATE.unlockedMet ? cookText(m) : cookLabel("Locked");
          label.appendChild(input);
          label.appendChild(span);
          metWrap.appendChild(label);
        });
      }

      function renderAll() {
        renderList(ingWrap, INGREDIENTS, STATE.unlockedIng, "ing");
        renderList(seaWrap, SEASONINGS, STATE.unlockedSea, "sea");
        renderMethods();
        renderBook();
        renderHints();
        renderGuidebook();
        if (coinOut) coinOut.textContent = String(STATE.coins);
        if (repOut) repOut.textContent = String(STATE.reputation);
        if (advOut) {
          const advCount = STATE.dishes.filter((d) => d.isAdvanced).length;
          advOut.textContent = `${advCount}/${ADVANCED_RECIPES.length}`;
        }
        if (lastDishOut) lastDishOut.textContent = STATE.lastDish ? cookText(STATE.lastDish.name) : cookLabel("None");
        if (customerOut) customerOut.textContent = STATE.customer ? STATE.customer.label : cookLabel("None");
      }

      function selectedValues(prefix) {
        return Array.from(document.querySelectorAll(`input[name^="${prefix}_"]:checked`)).map((i) => i.value);
      }

      function selectedMethod() {
        const sel = document.querySelector(`input[name="cook_method"]:checked`);
        return sel ? sel.value : "";
      }

      function dishName(ings, seas, method) {
        if (IS_ZH) {
          const adjZh = seas[0] ? cookText(seas[0]) : cookText("plain");
          const baseZh = cookText(ings[0] || "mix");
          const extraZh = ings[1] ? `、${cookText(ings[1])}` : "";
          const endZh = seas[1] ? `，配${cookText(seas[1])}` : "";
          return `${cookText(method)} ${adjZh}${baseZh}${extraZh}${endZh}`.replace(/\s+/g, " ");
        }
        const adj = seas[0] ? seas[0].split(" ")[0] : "plain";
        const base = ings[0] || "mix";
        const extra = ings[1] ? ` & ${ings[1]}` : "";
        const end = seas[1] ? ` with ${seas[1]}` : "";
        return `${method} ${adj} ${base}${extra}${end}`.replace(/\s+/g, " ");
      }

      function makeKey(ings, seas, method) {
        const m = METHODS.indexOf(method);
        const ingIdx = ings.map((i) => INGREDIENTS.indexOf(i)).filter((i) => i >= 0).sort((a, b) => a - b);
        const seaIdx = seas.map((s) => SEASONINGS.indexOf(s)).filter((i) => i >= 0).sort((a, b) => a - b);
        const toBase36 = (n) => n.toString(36);
        return `${toBase36(m)}:${ingIdx.map(toBase36).join(".")}-${seaIdx.map(toBase36).join(".")}`;
      }

      function decodeKey(key) {
        const [mPart, rest] = key.split(":");
        const [ingPart, seaPart] = (rest || "").split("-");
        const fromBase36 = (s) => (s ? parseInt(s, 36) : -1);
        const mIdx = fromBase36(mPart);
        const method = METHODS[mIdx] || "";
        const ings = (ingPart ? ingPart.split(".") : []).filter(Boolean).map(fromBase36).map((i) => INGREDIENTS[i]).filter(Boolean);
        const seas = (seaPart ? seaPart.split(".") : []).filter(Boolean).map(fromBase36).map((i) => SEASONINGS[i]).filter(Boolean);
        return { method, ings, seas };
      }

      function matchAdvanced(ings, seas, method) {
        const is = new Set(ings);
        const ss = new Set(seas);
        return ADVANCED_RECIPES.find((r) => {
          if (r.method !== method) return false;
          if (r.ingredients.some((i) => !is.has(i))) return false;
          if (r.seasonings.some((s) => !ss.has(s))) return false;
          if (ings.length < 4 || seas.length < 4) return false;
          return true;
        }) || null;
      }

      function dishTags(ings, seas, method) {
        const set = new Set(ings);
        const seasoningSet = new Set(seas);
        const fish = set.has("ember fish");
        const tofu = set.has("cloud tofu");
        const veg = !fish;
        const child = (seasoningSet.has("sweet mist") || seasoningSet.has("star honey")) && !seasoningSet.has("smoke pepper");
        const elder = (method === "simmer" || method === "steam") && !seasoningSet.has("smoke pepper");
        const spicy = seasoningSet.has("smoke pepper") || seasoningSet.has("chili flake");
        const sweet = seasoningSet.has("sweet mist") || seasoningSet.has("star honey") || seasoningSet.has("night sugar");
        const herbal = seasoningSet.has("herb spiral") || seasoningSet.has("vine leaf") || seasoningSet.has("mint dust");
        const sea = seasoningSet.has("sea umami") || set.has("mist shrimp") || set.has("cobalt algae");
        const light = (method === "steam" || method === "simmer") && ings.length <= 2;
        return { fish, tofu, veg, child, elder, spicy, sweet, herbal, sea, light };
      }

      function priceClass(price) {
        if (price >= 8) return "cook-price-5";
        if (price >= 6) return "cook-price-4";
        if (price >= 5) return "cook-price-3";
        if (price >= 4) return "cook-price-2";
        return "cook-price-1";
      }

      function renderBook() {
        if (!STATE.dishes.length) {
          bookWrap.innerHTML = `<p class="mini-note" style="margin:0;">${cookLabel("No dishes yet.")}</p>`;
          return;
        }
        bookWrap.innerHTML = STATE.dishes.map((d, i) => {
          const price = Number.isFinite(d.price) ? d.price : 1;
          const fancy = d.isAdvanced ? "cook-advanced" : "";
          const priceCls = priceClass(price);
          return `<div class="cook-book-entry ${priceCls} ${fancy}">
            <b>${i + 1}. ${cookText(d.name)}</b>
            <span class="cook-price-tag">${cookLabel("Price")}: ${price} ${price === 1 ? cookLabel("coin") : cookLabel("coins")}</span><br>
            <span>${cookText(d.method)}</span><br>
            <span>${cookLabel("Ingredients")}: ${cookList(d.ingredients)}</span><br>
            <span>${cookLabel("Seasonings")}: ${cookList(d.seasonings)}</span>
          </div>`;
        }).join("");
      }

      function renderHints() {
        if (!hintWrap) return;
        if (!STATE.hints.length) {
          hintWrap.innerHTML = `<p class="mini-note" style="margin:0;">${cookLabel("No hints yet.")}</p>`;
          return;
        }
        hintWrap.innerHTML = STATE.hints.map((idx, i) => {
          const r = ADVANCED_RECIPES[idx];
          if (!r) return "";
          return `<div class="cook-hint-item">
            <b>${i + 1}. ${cookText(r.name)}</b><br>
            <span>${cookLabel("Method")}: ${cookText(r.method)}</span><br>
            <span>${cookLabel("Ingredients")}: ${cookList(r.ingredients)}</span><br>
            <span>${cookLabel("Seasonings")}: ${cookList(r.seasonings)}</span>
          </div>`;
        }).join("");
      }

      function renderGuidebook() {
        if (!guideWrap) return;
        guideWrap.innerHTML = CUSTOMER_TYPES.map((c) => {
          const likes = IS_ZH ? {
            fish: "必须包含余烬鱼。",
            tofu: "必须包含云豆腐。",
            veg: "不含鱼；纯植物向。",
            child: "偏甜且不含烟椒。",
            elder: "偏温和做法（炖煮/蒸制），且不含烟椒。",
            spicy: "需要烟椒或辣椒碎。",
            sweet: "需要甜雾、星蜜或夜糖。",
            herbal: "需要草本卷、藤叶或薄荷尘。",
            sea: "需要海鲜鲜味、雾虾或钴藻。",
            light: "蒸制/炖煮且食材不超过 2 种。",
            chef: "偏好草本或海味主导菜。",
            traveler: "偏好辛辣或甜味风格。",
            ritual: "偏好炖煮或蒸制菜。",
            rich: "仅接受高级菜。需两道不同高级菜才能满意。"
          } : {
            fish: "Must include ember fish.",
            tofu: "Must include cloud tofu.",
            veg: "No fish; plant-based only.",
            child: "Sweet and non-smoky seasonings.",
            elder: "Gentle methods (simmer/steam) and no smoke pepper.",
            spicy: "Needs smoke pepper or chili flake.",
            sweet: "Needs sweet mist, star honey, or night sugar.",
            herbal: "Needs herb spiral, vine leaf, or mint dust.",
            sea: "Needs sea umami, mist shrimp, or cobalt algae.",
            light: "Steam/simmer with 2 or fewer ingredients.",
            chef: "Prefers herbal or sea-forward dishes.",
            traveler: "Likes spicy or sweet profiles.",
            ritual: "Prefers simmered or steamed dishes.",
            rich: "Only accepts advanced dishes. Needs two different advanced dishes to be satisfied."
          };
          return `<div class="cook-hint-item">
            <b>${c.label}</b><br>
            <span>${likes[c.id] || (IS_ZH ? "无特殊偏好。" : "No special preference.")}</span>
          </div>`;
        }).join("");
      }

      function adjustReputation(delta) {
        STATE.reputation = Math.max(0, Math.min(100, STATE.reputation + delta));
        if (STATE.reputation > 0 && STATE.reputation <= 15) {
          statusOut.textContent = IS_ZH ? "警告：声望过低。再一次差评服务可能导致餐厅关闭。" : "Warning: Reputation is very low. One more bad service could close the restaurant.";
        }
        if (STATE.reputation <= 0) {
          statusOut.textContent = IS_ZH ? "声望崩溃。餐厅已关闭 ❌" : "Reputation collapsed. Restaurant closed ❌";
          makeBtn.disabled = true;
          if (serveBtn) serveBtn.disabled = true;
          if (skipBtn) skipBtn.disabled = true;
        }
      }

      function unlockMore() {
        const made = STATE.dishes.length;
        STATE.unlockedIng = Math.min(INGREDIENTS.length, 2 + Math.floor(made / 3));
        STATE.unlockedSea = Math.min(SEASONINGS.length, 2 + Math.floor(made / 3));
        STATE.unlockedMet = Math.min(METHODS.length, 2 + Math.floor(made / 5));
      }

      function clearSelections() {
        document.querySelectorAll('#create-cook input[type="checkbox"], #create-cook input[type="radio"]').forEach((i) => {
          i.checked = false;
        });
      }

      function invalidCombo(ings, seas, method) {
        const s = new Set(ings);
        const t = new Set(seas);
        const has = (x) => s.has(x);
        const hasS = (x) => t.has(x);

        if (method === "steam" && (has("iron pumpkin") || has("ember fish"))) return IS_ZH ? "蒸制与铁南瓜或余烬鱼不兼容。" : "Steam fails with iron pumpkin or ember fish.";
        if (method === "grill" && has("cloud tofu") && hasS("sweet mist")) return IS_ZH ? "云豆腐与甜雾烤制会塌陷。" : "Grilled cloud tofu with sweet mist collapses.";
        if (method === "bake" && has("river beans") && hasS("sea umami")) return IS_ZH ? "河豆与海鲜鲜味烘烤会发苦。" : "Baked river beans with sea umami turn bitter.";
        if (has("dawn berry") && hasS("smoke pepper")) return IS_ZH ? "晨曦莓与烟椒冲突。" : "Dawn berry and smoke pepper clash.";
        if (has("forest mushroom") && hasS("citrus ash")) return IS_ZH ? "林菇与柑灰会相互抵消风味。" : "Forest mushroom and citrus ash cancel flavor.";
        if (has("ember fish") && hasS("night sugar") && method !== "simmer") return IS_ZH ? "余烬鱼配夜糖仅适用于炖煮。" : "Ember fish with night sugar only works simmered.";
        return "";
      }

      function makeDish() {
        const ings = selectedValues("ing");
        const seas = selectedValues("sea");
        const method = selectedMethod();
        if (!ings.length || !seas.length || !method) {
          statusOut.textContent = IS_ZH ? "请至少选择 1 个食材、1 个调味和 1 种做法。" : "Pick at least 1 ingredient, 1 seasoning, and a method.";
          return;
        }
        const advanced = matchAdvanced(ings, seas, method);
        if (!advanced && (ings.length > 2 || seas.length > 2)) {
          statusOut.textContent = IS_ZH ? "基础碗最多 2 食材 + 2 调味。高级菜需 4+ 且匹配有效配方。" : "Basic bowl limit is 2 ingredients and 2 seasonings. Advanced recipes need 4+ and a valid recipe.";
          return;
        }
        const invalid = advanced ? "" : invalidCombo(ings, seas, method);
        if (invalid) {
          statusOut.textContent = IS_ZH ? `无法出菜：${invalid}` : `No dish: ${invalid}`;
          return;
        }
        const key = makeKey(ings, seas, method);
        if (STATE.dishes.some((d) => d.key === key)) {
          statusOut.textContent = IS_ZH ? "这道菜你已经做过了。" : "You already made that dish.";
          return;
        }
        const name = advanced ? advanced.name : dishName(ings, seas, method);
        const tags = dishTags(ings, seas, method);
        const basePrice = 1 + Math.floor((ings.length + seas.length) / 2);
        const methodBonus = (method === "roast" || method === "grill") ? 1 : 0;
        const price = advanced ? advanced.coins : (basePrice + methodBonus);
        const coins = advanced ? advanced.coins : 0;
        const isAdvanced = Boolean(advanced);
        STATE.dishes.push({ key, name, ingredients: ings, seasonings: seas, method, tags, coins, price, isAdvanced });
        STATE.lastDish = { key, name, tags, coins, price, isAdvanced };
        if (coins) STATE.coins += coins;
        if (isAdvanced) adjustReputation(6);
        unlockMore();
        renderAll();
        clearSelections();
        if (STATE.dishes.filter((d) => d.isAdvanced).length >= ADVANCED_RECIPES.length) {
          statusOut.textContent = IS_ZH ? "胜利！已发现全部高级配方。🎉" : "Victory! All advanced recipes discovered. 🎉";
        } else {
          statusOut.textContent = coins
            ? (IS_ZH ? `已制作：${cookText(name)}（+${coins} 金币）` : `Created: ${name} (+${coins} coins)`)
            : (IS_ZH ? `已制作：${cookText(name)}（价格 ${price}）` : `Created: ${name} (price ${price})`);
        }
      }

      function encode(obj) {
        const json = JSON.stringify(obj);
        const b64 = btoa(unescape(encodeURIComponent(json)));
        return "COOK1:" + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      }

      function decode(str) {
        if (!str.startsWith("COOK1:")) throw new Error("Invalid code (missing prefix).");
        let b64 = str.slice(6).replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const json = decodeURIComponent(escape(atob(b64)));
        return JSON.parse(json);
      }

      makeBtn.addEventListener("click", makeDish);
      resetBtn.addEventListener("click", () => {
        clearSelections();
        statusOut.textContent = IS_ZH ? "已清空碗。" : "Bowl cleared.";
      });

      function spend(cost) {
        if (STATE.coins < cost) {
          statusOut.textContent = IS_ZH ? "金币不足。" : "Not enough coins.";
          return false;
        }
        STATE.coins -= cost;
        return true;
      }

      if (unlockIngBtn) {
        unlockIngBtn.addEventListener("click", () => {
          if (STATE.unlockedIng >= INGREDIENTS.length) {
            statusOut.textContent = IS_ZH ? "所有食材已解锁。" : "All ingredients unlocked.";
            return;
          }
          if (spend(3)) {
            STATE.unlockedIng += 1;
            renderAll();
            statusOut.textContent = IS_ZH ? "食材已解锁 ✅" : "Ingredient unlocked ✅";
          }
        });
      }

      if (unlockSeaBtn) {
        unlockSeaBtn.addEventListener("click", () => {
          if (STATE.unlockedSea >= SEASONINGS.length) {
            statusOut.textContent = IS_ZH ? "所有调味已解锁。" : "All seasonings unlocked.";
            return;
          }
          if (spend(3)) {
            STATE.unlockedSea += 1;
            renderAll();
            statusOut.textContent = IS_ZH ? "调味已解锁 ✅" : "Seasoning unlocked ✅";
          }
        });
      }

      if (unlockMetBtn) {
        unlockMetBtn.addEventListener("click", () => {
          if (STATE.unlockedMet >= METHODS.length) {
            statusOut.textContent = IS_ZH ? "所有做法已解锁。" : "All methods unlocked.";
            return;
          }
          if (spend(5)) {
            STATE.unlockedMet += 1;
            renderAll();
            statusOut.textContent = IS_ZH ? "做法已解锁 ✅" : "Method unlocked ✅";
          }
        });
      }

      if (hintBtn) {
        hintBtn.addEventListener("click", () => {
          const cost = 4;
          const available = ADVANCED_RECIPES.map((_, i) => i).filter((i) => !STATE.hints.includes(i));
          if (!available.length) {
            statusOut.textContent = IS_ZH ? "所有高级配方提示都已揭示。" : "All advanced recipes already revealed.";
            return;
          }
          if (!spend(cost)) return;
          const pick = available[Math.floor(Math.random() * available.length)];
          STATE.hints.push(pick);
          renderAll();
          statusOut.textContent = IS_ZH ? "提示已揭示 ✨" : "Hint revealed ✨";
        });
      }

      function newCustomer() {
        const canRich = STATE.dishes.filter((d) => d.isAdvanced).length >= 2;
        const pool = canRich ? CUSTOMER_TYPES : CUSTOMER_TYPES.filter((c) => c.id !== "rich");
        STATE.customer = pool[Math.floor(Math.random() * pool.length)];
        if (STATE.customer && STATE.customer.id !== "rich") STATE.richProgress = [];
        renderAll();
      }

      if (serveBtn) {
        serveBtn.addEventListener("click", () => {
          if (!STATE.customer) {
            statusOut.textContent = IS_ZH ? "当前没有顾客。" : "No customer right now.";
            return;
          }
          if (!STATE.lastDish) {
            statusOut.textContent = IS_ZH ? "请先做一道菜。" : "Make a dish first.";
            return;
          }
          if (STATE.customer.id === "rich") {
            if (!STATE.lastDish.isAdvanced) {
              adjustReputation(-6);
              statusOut.textContent = IS_ZH ? "富豪食客拒绝了这道菜。仅接受高级菜。" : "Rich patron rejected it. Advanced dishes only.";
            } else {
              const key = STATE.lastDish.key;
              if (!STATE.richProgress.includes(key)) STATE.richProgress.push(key);
              if (STATE.richProgress.length >= 2) {
                const pay = 20;
                STATE.coins += pay;
                adjustReputation(5);
                statusOut.textContent = IS_ZH ? `富豪食客满意（+${pay} 金币）✨` : `Rich patron satisfied (+${pay} coins) ✨`;
                STATE.richProgress = [];
                newCustomer();
                return;
              } else {
                adjustReputation(1);
                statusOut.textContent = IS_ZH ? "富豪食客印象很好。请再上一道不同的高级菜。" : "Rich patron impressed. Serve a second different advanced dish.";
                return;
              }
            }
          } else if (STATE.customer.check(STATE.lastDish)) {
            const pay = Math.max(1, STATE.lastDish.price || 1);
            STATE.coins += pay;
            adjustReputation(2);
            statusOut.textContent = IS_ZH ? `顾客满意（+${pay} 金币）✅` : `Customer satisfied (+${pay} coins) ✅`;
          } else {
            adjustReputation(-4);
            statusOut.textContent = IS_ZH ? "顾客不喜欢这道菜。无金币奖励。" : "Customer disliked it. No coins.";
          }
          newCustomer();
        });
      }

      if (skipBtn) {
        skipBtn.addEventListener("click", () => {
          statusOut.textContent = IS_ZH ? "顾客离开了。" : "Customer left.";
          adjustReputation(-3);
          newCustomer();
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener("click", () => {
          const dishKeys = STATE.dishes.map((d) => d.key).join(";");
          const payload = {
            dishKeys,
            unlockedIng: STATE.unlockedIng,
            unlockedSea: STATE.unlockedSea,
            unlockedMet: STATE.unlockedMet,
            coins: STATE.coins,
            hints: STATE.hints,
            reputation: STATE.reputation,
            richProgress: STATE.richProgress
          };
          if (saveCode) saveCode.value = encode(payload);
          statusOut.textContent = IS_ZH ? "存档码已生成 ✅" : "Save code generated ✅";
        });
      }

      if (loadBtn) {
        loadBtn.addEventListener("click", () => {
          try {
            const data = decode(saveCode.value.trim());
            const keys = typeof data.dishKeys === "string" && data.dishKeys.length
              ? data.dishKeys.split(";")
              : [];
            STATE.dishes = keys.map((key) => {
              const { method, ings, seas } = decodeKey(key);
              const advanced = matchAdvanced(ings, seas, method);
              const name = advanced ? advanced.name : dishName(ings, seas, method);
              const tags = dishTags(ings, seas, method);
              const basePrice = 1 + Math.floor((ings.length + seas.length) / 2);
              const methodBonus = (method === "roast" || method === "grill") ? 1 : 0;
              const price = advanced ? advanced.coins : (basePrice + methodBonus);
              const coins = advanced ? advanced.coins : 0;
              return { key, name, ingredients: ings, seasonings: seas, method, tags, coins, price, isAdvanced: Boolean(advanced) };
            });
            STATE.unlockedIng = Math.min(INGREDIENTS.length, data.unlockedIng || 2);
            STATE.unlockedSea = Math.min(SEASONINGS.length, data.unlockedSea || 2);
            STATE.unlockedMet = Math.min(METHODS.length, data.unlockedMet || 2);
            STATE.coins = Number.isFinite(data.coins) ? data.coins : 0;
            STATE.hints = Array.isArray(data.hints)
              ? data.hints.filter((i) => Number.isInteger(i) && i >= 0 && i < ADVANCED_RECIPES.length)
              : [];
            STATE.reputation = Number.isFinite(data.reputation) ? data.reputation : 50;
            STATE.richProgress = Array.isArray(data.richProgress) ? data.richProgress : [];
            STATE.lastDish = STATE.dishes.length ? STATE.dishes[STATE.dishes.length - 1] : null;
            renderAll();
            statusOut.textContent = IS_ZH ? "存档已加载 ✅" : "Save loaded ✅";
          } catch (e) {
            statusOut.textContent = IS_ZH ? `错误：${e.message}` : `Error: ${e.message}`;
          }
        });
      }

      newCustomer();
      renderAll();
    })();

    // ===== Create: Car Innovation =====
    (function () {
      const optionsWrap = document.getElementById("carInnovationOptions");
      const generateBtn = document.getElementById("carGenerate");
      const resetBtn = document.getElementById("carReset");
      const resultsBox = document.getElementById("carResults");
      const shareInput = document.getElementById("carShareCode");
      const shareApplyBtn = document.getElementById("carShareApply");
      const shareClearBtn = document.getElementById("carShareClear");
      const shareStatus = document.getElementById("carShareStatus");
      const shareCode = document.getElementById("shareCode");
      const shareApply = document.getElementById("shareApply");
      const characterShareStatus = document.getElementById("shareStatus");
      const fullNameOut = document.getElementById("fullNameOut");

      if (!optionsWrap || !generateBtn || !resetBtn || !resultsBox) return;

      const USES = [
        { id: "city", label: "City Commuter", desc: "Efficient, quiet, and easy to park. Perfect for daily urban driving." },
        { id: "adventure", label: "Adventure Explorer", desc: "Stable on rough terrain with endurance for long journeys." },
        { id: "racing", label: "Performance Sprint", desc: "Lightweight, high power, and sharp response for speed." },
        { id: "family", label: "Family Comfort", desc: "Safe, spacious, and smooth for group travel." },
        { id: "cargo", label: "Cargo Carrier", desc: "Built to haul and carry with steady reliability." },
        { id: "luxury", label: "Luxury Lounge", desc: "Premium comfort and elegance with smart tech." },
        { id: "eco", label: "Eco Pioneer", desc: "Low footprint with maximum efficiency." }
      ];

      const CATEGORIES = [
        {
          title: "Power & Energy",
          options: [
            { label: "Twin-motor electric", scores: { eco: 3, city: 2, luxury: 1 } },
            { label: "Hybrid core", scores: { eco: 2, family: 2, city: 1 } },
            { label: "Turbo performance", scores: { racing: 3, adventure: 1 } },
            { label: "Diesel endurance", scores: { cargo: 2, adventure: 2 } },
            { label: "Hydrogen cell", scores: { eco: 3, adventure: 1, luxury: 1 } },
            { label: "Biofuel drive", scores: { eco: 2, cargo: 1, city: 1 } },
            { label: "Solar range extender", scores: { eco: 3, city: 1 } },
            { label: "Quiet luxury motor", scores: { luxury: 3, city: 1 } },
            { label: "High-torque crawler", scores: { adventure: 3, cargo: 1 } },
            { label: "Urban eco cell", scores: { city: 3, eco: 3 } },
            { label: "Industrial haul core", scores: { cargo: 3, adventure: 2 } },
            { label: "Family silent drive", scores: { family: 3, luxury: 2 } }
          ]
        },
        {
          title: "Body & Frame",
          options: [
            { label: "Lightweight carbon shell", scores: { racing: 3, city: 1 } },
            { label: "Reinforced steel frame", scores: { cargo: 2, adventure: 2 } },
            { label: "Compact city frame", scores: { city: 3, eco: 1 } },
            { label: "Extended cabin body", scores: { family: 3, cargo: 1 } },
            { label: "Elevated off-road chassis", scores: { adventure: 3, cargo: 1 } },
            { label: "Aero coupe shell", scores: { racing: 2, luxury: 1, city: 1 } },
            { label: "Impact-safe shell", scores: { family: 2, city: 2 } },
            { label: "Long-range touring body", scores: { luxury: 2, adventure: 1 } },
            { label: "Luxury aero frame", scores: { luxury: 3, racing: 2 } },
            { label: "Cargo lattice frame", scores: { cargo: 3, family: 1 } },
            { label: "Eco feather shell", scores: { eco: 2, city: 2 } }
          ]
        },
        {
          title: "Drive & Control",
          options: [
            { label: "All-wheel traction", scores: { adventure: 3, family: 1 } },
            { label: "Precision sport steering", scores: { racing: 2, city: 1 } },
            { label: "Comfort cruise assist", scores: { family: 2, luxury: 2 } },
            { label: "Smart eco drive", scores: { eco: 2, city: 1 } },
            { label: "Adaptive dampers", scores: { luxury: 2, adventure: 1 } },
            { label: "Launch control", scores: { racing: 3 } },
            { label: "Ultra-stable braking", scores: { family: 2, city: 1 } },
            { label: "Auto terrain scan", scores: { adventure: 2, eco: 1 } },
            { label: "City glide control", scores: { city: 3, eco: 1 } },
            { label: "Cargo torque vectoring", scores: { cargo: 2, adventure: 1 } },
            { label: "Family comfort lock", scores: { family: 3, luxury: 1 } },
            { label: "Eco pulse drive", scores: { eco: 3, city: 1 } },
            { label: "Luxury serenity drive", scores: { luxury: 3, city: 1 } }
          ]
        },
        {
          title: "Cabin & Tech",
          options: [
            { label: "Panoramic luxury cabin", scores: { luxury: 3, family: 1 } },
            { label: "Minimalist eco cabin", scores: { eco: 2, city: 1 } },
            { label: "Modular cargo interior", scores: { cargo: 3, family: 1 } },
            { label: "Track-ready cockpit", scores: { racing: 2, luxury: 1 } },
            { label: "Family safety suite", scores: { family: 3, city: 1 } },
            { label: "Adventure navigation rig", scores: { adventure: 2, luxury: 1 } },
            { label: "Executive lounge seats", scores: { luxury: 3 } },
            { label: "Cargo command console", scores: { cargo: 2, adventure: 1 } },
            { label: "City smart dash", scores: { city: 3, eco: 1 } },
            { label: "Eco airy cabin", scores: { eco: 3, city: 1 } },
            { label: "Sprint HUD rig", scores: { racing: 3 } }
          ]
        },
        {
          title: "Utility & Extras",
          options: [
            { label: "Roof storage system", scores: { cargo: 2, adventure: 1 } },
            { label: "Terrain adaptive kit", scores: { adventure: 3 } },
            { label: "Urban safety package", scores: { city: 2, family: 1 } },
            { label: "Premium audio suite", scores: { luxury: 2, family: 1 } },
            { label: "Fold-flat cargo deck", scores: { cargo: 3, family: 1 } },
            { label: "Eco regeneration kit", scores: { eco: 2, city: 1 } },
            { label: "Rapid charging port", scores: { city: 2, eco: 1 } },
            { label: "All-weather canopy", scores: { adventure: 2, family: 1 } },
            { label: "Sprint aero kit", scores: { racing: 2, city: 1 } },
            { label: "Family comfort pack", scores: { family: 2, luxury: 1 } },
            { label: "Eco solar roof", scores: { eco: 3, city: 1 } },
            { label: "City micro-park system", scores: { city: 2 } }
          ]
        }
      ];
      if (IS_ZH) {
        const carMap = {
          "City Commuter": "城市通勤型",
          "Adventure Explorer": "冒险探索型",
          "Performance Sprint": "性能疾驰型",
          "Family Comfort": "家庭舒适型",
          "Cargo Carrier": "载货运输型",
          "Luxury Lounge": "豪华舒享型",
          "Eco Pioneer": "环保先锋型",
          "Efficient, quiet, and easy to park. Perfect for daily urban driving.": "高效、安静、易停放，适合日常城市驾驶。",
          "Stable on rough terrain with endurance for long journeys.": "粗糙路况下稳定可靠，适合长途耐力行驶。",
          "Lightweight, high power, and sharp response for speed.": "轻量高功率、响应敏捷，强调速度表现。",
          "Safe, spacious, and smooth for group travel.": "安全、宽敞、平顺，适合多人出行。",
          "Built to haul and carry with steady reliability.": "为装载与运输打造，稳定可靠。",
          "Premium comfort and elegance with smart tech.": "高端舒适与优雅并重，搭配智能科技。",
          "Low footprint with maximum efficiency.": "低环境负担与高效率并重。",
          "Power & Energy": "动力与能源",
          "Body & Frame": "车身与结构",
          "Drive & Control": "驱动与操控",
          "Cabin & Tech": "座舱与科技",
          "Utility & Extras": "功能与扩展"
        };
        const optionMap = {
          "Twin-motor electric": "双电机电驱",
          "Hybrid core": "混合动力核心",
          "Turbo performance": "涡轮性能核心",
          "Diesel endurance": "柴油耐久核心",
          "Hydrogen cell": "氢燃料电池",
          "Biofuel drive": "生物燃料驱动",
          "Solar range extender": "太阳能增程模块",
          "Quiet luxury motor": "静谧豪华电机",
          "High-torque crawler": "高扭越野驱动",
          "Urban eco cell": "城市环保电池组",
          "Industrial haul core": "工业载重动力核",
          "Family silent drive": "家庭静音驱动",
          "Lightweight carbon shell": "轻量碳纤维外壳",
          "Reinforced steel frame": "强化钢架",
          "Compact city frame": "紧凑城市车架",
          "Extended cabin body": "加长座舱车身",
          "Elevated off-road chassis": "高离地越野底盘",
          "Aero coupe shell": "空气动力轿跑壳体",
          "Impact-safe shell": "抗冲击安全壳",
          "Long-range touring body": "长续航旅行车身",
          "Luxury aero frame": "豪华空气动力车架",
          "Cargo lattice frame": "货运格栅车架",
          "Eco feather shell": "轻羽环保壳体",
          "All-wheel traction": "全轮牵引",
          "Precision sport steering": "精准运动转向",
          "Comfort cruise assist": "舒适巡航辅助",
          "Smart eco drive": "智能节能驱动",
          "Adaptive dampers": "自适应减振",
          "Launch control": "弹射控制",
          "Ultra-stable braking": "超稳制动",
          "Auto terrain scan": "自动地形扫描",
          "City glide control": "城市滑行控制",
          "Cargo torque vectoring": "载重扭矩分配",
          "Family comfort lock": "家庭舒适锁定",
          "Eco pulse drive": "节能脉冲驱动",
          "Luxury serenity drive": "豪华静逸驱动",
          "Panoramic luxury cabin": "全景豪华座舱",
          "Minimalist eco cabin": "极简环保座舱",
          "Modular cargo interior": "模块化货运内舱",
          "Track-ready cockpit": "赛道取向驾驶舱",
          "Family safety suite": "家庭安全套件",
          "Adventure navigation rig": "冒险导航系统",
          "Executive lounge seats": "行政休闲座椅",
          "Cargo command console": "货运指挥中控",
          "City smart dash": "城市智能仪表",
          "Eco airy cabin": "通透环保座舱",
          "Sprint HUD rig": "疾速 HUD 组件",
          "Roof storage system": "车顶储物系统",
          "Terrain adaptive kit": "地形自适应套件",
          "Urban safety package": "城市安全包",
          "Premium audio suite": "高端音响套装",
          "Fold-flat cargo deck": "折叠平整货台",
          "Eco regeneration kit": "能量回收套件",
          "Rapid charging port": "快速充电接口",
          "All-weather canopy": "全天候顶棚",
          "Sprint aero kit": "疾速空气动力套件",
          "Family comfort pack": "家庭舒适包",
          "Eco solar roof": "环保太阳能车顶",
          "City micro-park system": "城市微泊车系统"
        };
        USES.forEach((u) => {
          u.label = carMap[u.label] || u.label;
          u.desc = carMap[u.desc] || u.desc;
        });
        CATEGORIES.forEach((c) => {
          c.title = carMap[c.title] || c.title;
          c.options.forEach((o) => {
            o.label = optionMap[o.label] || o.label;
          });
        });
      }

      let cachedName = "";
      let lastCarCanvas = null;

      function decodeShareCodeName(rawCode) {
        if (!rawCode || !rawCode.startsWith("SPIRETZ1:")) return "";
        try {
          let b64 = rawCode.slice("SPIRETZ1:".length).replace(/-/g, "+").replace(/_/g, "/");
          while (b64.length % 4) b64 += "=";
          const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
          const n = data && data.name ? data.name : {};
          const generated = typeof n.generatedFullName === "string" ? n.generatedFullName.trim() : "";
          if (generated) return generated;
          const first = (n.firstMode === "custom" ? (n.customFirst || "").trim() : "");
          const middle = (n.middleMode === "custom" ? (n.customMiddle || "").trim() : "");
          const last = (n.lastMode === "custom" ? (n.customLast || "").trim() : "");
          if (first && last) {
            return middle ? `${first} ${middle} ${last}` : `${first} ${last}`;
          }
        } catch {
          return "";
        }
        return "";
      }

      function renderOptions() {
        optionsWrap.innerHTML = "";
        CATEGORIES.forEach((cat, cIdx) => {
          const card = document.createElement("div");
          card.className = "info-card";
          const title = document.createElement("h4");
          title.style.margin = "0";
          title.textContent = cat.title;
          card.appendChild(title);

          const list = document.createElement("div");
          list.className = "car-list";

          cat.options.forEach((opt, oIdx) => {
            const label = document.createElement("label");
            label.className = "car-item";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = `car_opt_${cIdx}_${oIdx}`;
            input.dataset.cat = String(cIdx);
            input.dataset.opt = String(oIdx);
            const span = document.createElement("span");
            span.textContent = opt.label;
            label.appendChild(input);
            label.appendChild(span);
            list.appendChild(label);
          });

          card.appendChild(list);
          optionsWrap.appendChild(card);
        });
      }

      function selectedOptions() {
        const inputs = Array.from(optionsWrap.querySelectorAll("input[type=\"checkbox\"]:checked"));
        return inputs.map((input) => {
          const cIdx = parseInt(input.dataset.cat, 10);
          const oIdx = parseInt(input.dataset.opt, 10);
          return CATEGORIES[cIdx].options[oIdx];
        });
      }

      function scoreUses(opts) {
        const scores = {};
        USES.forEach((u) => { scores[u.id] = 0; });
        opts.forEach((opt) => {
          Object.entries(opt.scores).forEach(([use, val]) => {
            scores[use] += val;
          });
        });
        return scores;
      }

      function maxUsePossible() {
        const maxByUse = {};
        USES.forEach((u) => { maxByUse[u.id] = 0; });
        CATEGORIES.forEach((cat) => {
          USES.forEach((u) => {
            let best = 0;
            cat.options.forEach((opt) => {
              const val = opt.scores[u.id] || 0;
              if (val > best) best = val;
            });
            maxByUse[u.id] += best;
          });
        });
        return maxByUse;
      }

      function bestUse(scores) {
        return USES.reduce((best, cur) => {
          if (!best) return cur;
          return scores[cur.id] > scores[best.id] ? cur : best;
        }, null);
      }

      function getThemeVar(name, fallback) {
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        return val || fallback;
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(" ");
        let line = "";
        let yy = y;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, yy);
            line = words[i] + " ";
            yy += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, yy);
        return yy + lineHeight;
      }

      function concatBytes(chunks) {
        let total = 0;
        chunks.forEach((c) => { total += c.length; });
        const out = new Uint8Array(total);
        let offset = 0;
        chunks.forEach((c) => {
          out.set(c, offset);
          offset += c.length;
        });
        return out;
      }

      function buildPdfFromJpeg(jpegBytes, width, height) {
        const enc = new TextEncoder();
        const chunks = [];
        let offset = 0;
        const xref = [];

        function pushStr(s) {
          const b = enc.encode(s);
          chunks.push(b);
          offset += b.length;
        }
        function pushBytes(b) {
          chunks.push(b);
          offset += b.length;
        }

        pushStr("%PDF-1.3\n");
        xref.push(offset); pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        xref.push(offset); pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        xref.push(offset); pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
        xref.push(offset); pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
        pushBytes(jpegBytes);
        pushStr("\nendstream\nendobj\n");
        const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
        const contentBytes = enc.encode(content);
        xref.push(offset); pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr("\nendstream\nendobj\n");

        const xrefStart = offset;
        pushStr("xref\n0 6\n0000000000 65535 f \n");
        xref.forEach((pos) => {
          const line = String(pos).padStart(10, "0") + " 00000 n \n";
          pushStr(line);
        });
        pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
        return concatBytes(chunks);
      }

      function buildCarCard(best, scores, selections, overallScore) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 560;
        const ctx = canvas.getContext("2d");

        const bg = getThemeVar("--bg-2", "#15182a");
        const surface = getThemeVar("--surface", "rgba(255,255,255,0.06)");
        const text = getThemeVar("--text", "#e8e8e8");
        const heading = getThemeVar("--heading", "#ffffff");
        const accent = getThemeVar("--accent", "#c6a664");
        const accent2 = getThemeVar("--accent-2", "#9bc1ff");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = surface;
        ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = heading;
        ctx.font = "700 26px serif";
        ctx.fillText(IS_ZH ? "SPIRETZ 车辆创新" : "SPIRETZ Car Innovation", 48, 70);

        ctx.fillStyle = accent2;
        ctx.font = "700 36px serif";
        ctx.fillText(best.label, 48, 120);

        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        let yy = wrapText(ctx, best.desc, 48, 152, 520, 22);

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "综合评分" : "Overall score", 48, yy + 12);
        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        ctx.fillText(`${overallScore}/1000`, 48, yy + 36);
        yy += 40;

        if (cachedName) {
          ctx.fillStyle = accent;
          ctx.font = "600 14px sans-serif";
          ctx.fillText(IS_ZH ? "名称" : "Name", 48, yy + 14);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          ctx.fillText(cachedName, 48, yy + 38);
          yy += 40;
        }

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "已选特性" : "Selected features", 48, yy + 12);
        ctx.fillStyle = text;
        ctx.font = "13px sans-serif";
        const featureText = selections.slice(0, 12).join(" · ");
        wrapText(ctx, featureText || "—", 48, yy + 32, 800, 18);

        const startX = 580;
        let barY = 120;
        const barW = 260;
        const barH = 12;
        const maxScore = Math.max(...USES.map((u) => scores[u.id]));

        ctx.fillStyle = heading;
        ctx.font = "600 13px sans-serif";
        USES.forEach((u) => {
          const val = scores[u.id];
          const pct = maxScore > 0 ? val / maxScore : 0;
          ctx.fillText(`${u.label}: ${val}`, startX, barY - 6);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(startX, barY, barW, barH);
          ctx.fillStyle = accent2;
          ctx.fillRect(startX, barY, barW * pct, barH);
          barY += 30;
          ctx.fillStyle = heading;
        });

        return canvas;
      }

      function downloadPng(canvas) {
        const link = document.createElement("a");
        link.download = "spiretz-car-certificate.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      function downloadPdf(canvas) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdfBytes = buildPdfFromJpeg(bytes, canvas.width, canvas.height);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "spiretz-car-certificate.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }

      function generateResults() {
        const opts = selectedOptions();
        if (!opts.length) {
          resultsBox.innerHTML = `
            <div class="personality-card">
              <h3 style="margin:0;">${IS_ZH ? "请至少选择一项特性" : "Select at least one feature"}</h3>
              <p class="mini-note" style="margin-top:8px;">${IS_ZH ? "请选择若干选项以计算车辆最佳用途。" : "Choose some options to calculate your car’s best use."}</p>
            </div>
          `;
          return;
        }

        const scores = scoreUses(opts);
        const selections = opts.map((o) => o.label);
        const maxPossibleByUse = maxUsePossible();
        const globalMax = Math.max(...Object.values(maxPossibleByUse));
        const scaledScores = {};
        USES.forEach((u) => {
          const maxVal = maxPossibleByUse[u.id] || 1;
          const factor = maxVal > 0 ? globalMax / maxVal : 1;
          scaledScores[u.id] = Math.round((scores[u.id] || 0) * factor);
        });
        const best = bestUse(scaledScores);
        const rawMax = globalMax || 1;
        const baseScore = (scaledScores[best.id] / rawMax) * 1000;
        const totalCategories = CATEGORIES.length;
        const extraChoices = Math.max(0, selections.length - totalCategories);
        const clutterPenalty = 1 - Math.min(0.6, (extraChoices / (totalCategories * 2)) * 0.6);
        const overallScore = Math.max(0, Math.min(1000, Math.round(baseScore * clutterPenalty)));

        resultsBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "最佳用途" : "Best use"}: ${best.label}</h3>
            <p class="mini-note" style="margin-top:8px;">${best.desc}</p>
            <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
              <span class="car-tag">${IS_ZH ? "特性数" : "Features"}: ${selections.length}</span>
              <span class="car-tag">${IS_ZH ? "综合分" : "Overall"}: ${overallScore}/1000</span>
              ${cachedName ? `<span class="car-tag">${IS_ZH ? "名称" : "Name"}: ${cachedName}</span>` : ""}
            </div>
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "评分明细" : "Scores"}</h4>
            <div class="car-score" style="margin-top:8px;">
              ${USES.map((u) => {
                const val = scaledScores[u.id];
                const maxVal = globalMax || 1;
                const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
                return `
                  <div class="car-score-row">
                    <div>
                      <b>${u.label}</b> <span class="mini-note">(${val}/${maxVal})</span>
                      <div class="car-bar"><span style="width:${pct}%;"></span></div>
                    </div>
                    <span class="mini-note">${pct}%</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "下载你的证书" : "Download your certificate"}</h4>
            <p class="mini-note" style="margin-top:8px;">${IS_ZH ? "可将车辆设计证书保存为 PNG 或 PDF。" : "Save a PNG or PDF certificate for your car design."}</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button id="carDownloadPng" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PNG" : "Download PNG"}</span>
                <span class="acc-icon">⬇</span>
              </button>
              <button id="carDownloadPdf" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PDF" : "Download PDF"}</span>
                <span class="acc-icon">⬇</span>
              </button>
            </div>
          </div>
        `;

        lastCarCanvas = buildCarCard(best, scores, selections, overallScore);
        resultsBox.querySelector("#carDownloadPng")?.addEventListener("click", () => downloadPng(lastCarCanvas));
        resultsBox.querySelector("#carDownloadPdf")?.addEventListener("click", () => downloadPdf(lastCarCanvas));
        resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function resetAll() {
        optionsWrap.querySelectorAll("input[type=\"checkbox\"]").forEach((input) => {
          input.checked = false;
        });
        resultsBox.innerHTML = "";
      }

      if (shareApplyBtn) {
        shareApplyBtn.addEventListener("click", () => {
          const code = shareInput ? shareInput.value.trim() : "";
          if (!code) {
            shareStatus.textContent = IS_ZH ? "请先粘贴分享码。" : "Please paste a share code first.";
            return;
          }
          if (!code.startsWith("SPIRETZ1:")) {
            shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
            cachedName = "";
            return;
          }
          if (shareCode && shareApply) {
            shareCode.value = code;
            shareApply.click();
            const statusText = (characterShareStatus && characterShareStatus.textContent) ? characterShareStatus.textContent : "";
            if (statusText.startsWith("Error") || statusText.startsWith("错误")) {
              shareStatus.textContent = IS_ZH ? "无效代码。请粘贴角色分享码。" : "Invalid code. Please paste a character share code.";
              cachedName = "";
              return;
            }
            cachedName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—") ? fullNameOut.textContent : "";
            if (!cachedName) cachedName = decodeShareCodeName(code);
            shareStatus.textContent = cachedName ? (IS_ZH ? "代码已加载 ✅" : "Code loaded ✅") : (IS_ZH ? "代码已加载（未找到姓名）。" : "Code loaded (name not found).");
          } else {
            shareStatus.textContent = IS_ZH ? "分享系统不可用。" : "Share system not available.";
          }
        });
      }

      if (shareClearBtn) {
        shareClearBtn.addEventListener("click", () => {
          if (shareInput) shareInput.value = "";
          cachedName = "";
          shareStatus.textContent = IS_ZH ? "未加载代码。" : "No code loaded.";
        });
      }

      generateBtn.addEventListener("click", generateResults);
      resetBtn.addEventListener("click", resetAll);

      renderOptions();
    })();

    // ===== Create: Kopahor Quest =====
    (function () {
      const chapterOut = document.getElementById("questChapter");
      const sceneOut = document.getElementById("questSceneText");
      const choicesWrap = document.getElementById("questChoices");
      const outcomeBox = document.getElementById("questOutcome");
      const continueBtn = document.getElementById("questContinue");
      const metersWrap = document.getElementById("questMeters");
      const resultsBox = document.getElementById("questResults");
      const guideWrap = document.getElementById("questGuideList");
      const shareInput = document.getElementById("questShareCode");
      const shareApplyBtn = document.getElementById("questShareApply");
      const shareClearBtn = document.getElementById("questShareClear");
      const shareStatus = document.getElementById("questShareStatus");
      const shareCode = document.getElementById("shareCode");
      const shareApply = document.getElementById("shareApply");
      const fullNameOut = document.getElementById("fullNameOut");

      if (!chapterOut || !sceneOut || !choicesWrap || !metersWrap || !resultsBox) return;

      const TRAITS = [
        { id: "bold", label: IS_ZH ? "果断" : "Bold" },
        { id: "cautious", label: IS_ZH ? "谨慎" : "Cautious" },
        { id: "diplomatic", label: IS_ZH ? "外交" : "Diplomatic" },
        { id: "strategic", label: IS_ZH ? "战略" : "Strategic" },
        { id: "compassionate", label: IS_ZH ? "仁慈" : "Compassionate" },
        { id: "innovative", label: IS_ZH ? "创新" : "Innovative" }
      ];

      const STATS = [
        { id: "supplies", label: IS_ZH ? "补给" : "Supplies" },
        { id: "health", label: IS_ZH ? "健康" : "Health" },
        { id: "morale", label: IS_ZH ? "士气" : "Morale" },
        { id: "diplomacy", label: IS_ZH ? "外交" : "Diplomacy" },
        { id: "force", label: IS_ZH ? "武力" : "Force" },
        { id: "tech", label: IS_ZH ? "科技" : "Tech" },
        { id: "economy", label: IS_ZH ? "经济" : "Economy" }
      ];

      const SCENES = [
        { chapter: "Phase 0 — League Summit", text: "Kopahor, Whereland, Onia, and Pesimura meet as one Spiretz League. Onia is the economic center. You must negotiate what Onia is willing to fund.", choices: [
          { label: "Present a full budget and accept strict audits.", effects: { coins: 120, diplomacy: 3, economy: 2, morale: -2, time: 2 }, traits: { strategic: 1 }, outcome: "You lay out the full budget in public session, letting Onia’s auditors trace every line. The economic council approves a large grant, but their clerks now monitor your decisions. Your own ministers feel the pressure of scrutiny and speak more cautiously." },
          { label: "Offer shared risk and partial repayment.", effects: { coins: 90, diplomacy: 2, economy: 1, morale: -1, time: 1 }, traits: { diplomatic: 1 }, outcome: "You propose a shared-risk plan that splits the burden across the league. Onia agrees to steady funding, expecting repayment after the crystal is secured. The compromise keeps the room calm, though no one leaves fully satisfied." },
          { label: "Reject strings and seek a small, independent grant.", effects: { coins: 55, morale: 1, diplomacy: -2, economy: -1 }, traits: { bold: 1 }, outcome: "You refuse conditions and ask only for a modest, clean grant. The smaller sum is approved quickly, and Kopahor keeps full control. Some partners read the move as stubborn, while your core supporters feel relieved." }
        ]},
        { chapter: "Phase 0 — League Summit", text: "Transportation must be chosen for the southern journey. Advanced tech is available.", choices: [
          { label: "Armored caravan cars with spare parts.", effects: { coins: -35, supplies: 3, health: 2, time: 3 }, traits: { strategic: 1 }, outcome: "You choose armored caravan cars and load extra parts. The convoy becomes durable and disciplined, but the fuel and maintenance strain your treasury. The team feels safer, though the convoy’s weight limits quick detours." },
          { label: "Ice-cap ship through dangerous waters.", effects: { coins: -20, supplies: 2, time: 7, morale: -2, health: -1 }, traits: { cautious: 1 }, outcome: "You commission an ice-cap ship and route the expedition along the southern waters. The sea is slower but reliable for cargo, and the crew adjusts to harsh winds. The long crossing wears on morale, yet the supplies arrive intact." },
          { label: "Sky-rail convoy with Whereland engines.", effects: { coins: -50, tech: 4, time: 1, morale: 1, economy: -2 }, traits: { innovative: 1 }, outcome: "You commit to the sky-rail with Whereland engines, buying speed and altitude. The convoy lifts above hazards, and engineers document valuable performance data. The cost is immense, and every mechanical failure now feels like a crisis." }
        ]},
        { chapter: "Phase 0 — League Summit", text: "How many people do you bring on the quest?", choices: [
          { label: "Small elite team for speed.", effects: { force: 2, supplies: -2, coins: -5, people: -40, morale: -1 }, traits: { strategic: 1 }, outcome: "You assemble a lean expedition of specialists and veterans. The small team moves fast and takes decisive action without delay. Families at home worry about the lack of backup, but the leaders value precision." },
          { label: "Balanced expedition force.", effects: { force: 2, morale: 2, supplies: -4, coins: -10, people: 0, time: 1 }, traits: { diplomatic: 1 }, outcome: "You select a balanced force that can endure long travel and hold ground. The mix of soldiers, engineers, and medics reassures the league. The expedition feels steady rather than bold, and expectations rise." },
          { label: "Large public expedition to inspire citizens.", effects: { morale: 4, force: 1, supplies: -6, coins: -20, people: 60, time: 2 }, traits: { compassionate: 1 }, outcome: "You call for a large public expedition and invite volunteers. The crowds cheer and the nation feels united behind the quest. The caravan grows heavy, and feeding so many mouths becomes a daily strain." }
        ]},
        { chapter: "Phase 0 — League Summit", text: "Clothing for harsh climates must be purchased.", choices: [
          { label: "Standard winter gear.", effects: { health: 2, coins: -8, economy: -1 }, traits: { cautious: 1 }, outcome: "You buy standard winter gear in bulk and distribute it evenly. The supply is reliable, if not exceptional, and the march stabilizes. The treasury loses some flexibility, but the team stays warm." },
          { label: "Whereland thermal tech suits.", effects: { health: 4, tech: 2, coins: -18, morale: -1 }, traits: { innovative: 1 }, outcome: "You invest in Whereland thermal suits that adapt to climate shifts. The crew becomes noticeably more resilient in cold zones, and the tech logs prove valuable. The expense is steep, and skeptics call it indulgent." },
          { label: "Minimal gear to save coins.", effects: { coins: 5, health: -6, morale: -2 }, traits: { bold: 1 }, outcome: "You cut gear orders to conserve coins and reduce load. The caravan moves lighter, but cold nights cut deeper. Grumbles spread through the ranks as the weather turns against you." }
        ]},
        { chapter: "Phase 0 — League Summit", text: "How much food supplies do you bring?", choices: [
          { label: "Heavy rations for long safety.", effects: { supplies: 12, coins: -15, time: 2, morale: 1 }, traits: { cautious: 1 }, outcome: "You fill the cargo modules with heavy rations to secure the march. The camp feels safe, and planning becomes easier. The extra weight slows departures and makes the convoy harder to maneuver." },
          { label: "Balanced rations with periodic resupply.", effects: { supplies: 7, coins: -8, time: 1 }, traits: { strategic: 1 }, outcome: "You choose balanced rations and plan for resupply points. The caravan keeps momentum and still has reserves. The gamble rests on reliable trade routes and timely markets." },
          { label: "Light rations for speed.", effects: { supplies: 3, coins: -2, health: -2, morale: -1 }, traits: { bold: 1 }, outcome: "You take light rations to keep the convoy fast. The march accelerates, but hunger becomes a real threat during delays. The decision feels daring, and not everyone agrees." }
        ]},
        { chapter: "Phase 0 — League Summit", text: "Whereland (tech center) offers a field kit for survival analytics.", choices: [
          { label: "Purchase the full kit.", effects: { tech: 4, coins: -12, economy: -1 }, traits: { innovative: 1 }, outcome: "You purchase the full analytics kit and assign an expert team to it. The sensors begin mapping risk, weather, and terrain in real time. The kit becomes a strategic advantage, though its cost is felt everywhere." },
          { label: "Buy a lighter version.", effects: { tech: 2, coins: -6, time: 1 }, traits: { strategic: 1 }, outcome: "You buy the compact kit and focus it on high-risk zones. The data helps, but gaps remain in coverage. The team appreciates the balance between cost and utility." },
          { label: "Decline to keep budget flexible.", effects: { economy: 2, coins: 4, tech: -2 }, traits: { cautious: 1 }, outcome: "You decline the kit to preserve liquidity. The budget stays flexible, and local scouts gain more responsibility. Some engineers worry you are walking blind into the south." }
        ]},
        { chapter: "Phase I — The Southern March", text: "Your coalition departs into harsh climates; delays mean harsher seasons. Citizens watch closely. How do you start the march?", choices: [
          { label: "Hold a public sendoff to raise morale.", effects: { morale: 4, coins: -6, time: 2 }, traits: { compassionate: 1 }, outcome: "You stage a public sendoff in the capital square. Cheers and songs echo behind the convoy, lifting spirits. The ceremony costs time and coin, but the nation watches with pride." },
          { label: "Leave quietly to save time.", effects: { time: 1, diplomacy: 1, morale: -1 }, traits: { strategic: 1 }, outcome: "You depart before dawn to conserve time and avoid ceremony. The convoy moves quickly, and officials fall into a steady rhythm. Some citizens feel left behind by the sudden silence." },
          { label: "Launch with a show of force to deter attacks.", effects: { force: 2, morale: 1, coins: -4 }, traits: { bold: 1 }, outcome: "You lead a forceful departure with banners and armored guards. Predators and raiders keep their distance as the march begins. The display costs coin and raises expectations of strength." }
        ]},
        { chapter: "Phase I — The Southern March", text: "A mountain storm forms at the pass.", choices: [
          { label: "Push through to keep schedule.", effects: { health: -6, morale: 3, supplies: -3 }, traits: { bold: 1 } },
          { label: "Camp and ration carefully.", effects: { supplies: -2, health: 2 }, traits: { cautious: 1 } },
          { label: "Use heat sigils and experimental tech.", effects: { tech: 4, supplies: -4 }, traits: { innovative: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A herd of wild beasts circles your convoy.", choices: [
          { label: "Scare them off with fireworks.", effects: { supplies: -2, morale: 4 }, traits: { bold: 1 } },
          { label: "Offer food to avoid conflict.", effects: { supplies: -4, health: 2 }, traits: { compassionate: 1 } },
          { label: "Set a silent detour through ravines.", effects: { health: -2, supplies: -1, diplomacy: 1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Early Phase I, a riverside settlement offers fish and clean water (shop available).", choices: [
          { label: "Buy fresh supplies for the camp.", effects: { supplies: 7, health: 1, coins: -10 }, traits: { compassionate: 1 } },
          { label: "Buy a small ration boost.", effects: { supplies: 3, coins: -4 }, traits: { strategic: 1 } },
          { label: "Skip the stop to keep moving.", effects: { morale: -1, economy: 1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Your scouts spot hostile beasts on the ice lake.", choices: [
          { label: "Cross fast and light, leaving heavy carts.", effects: { supplies: -6, health: 4 }, traits: { bold: 1 } },
          { label: "Build a temporary bridge and move safely.", effects: { tech: 3, supplies: -3 }, traits: { strategic: 1 } },
          { label: "Wait for the beasts to move on.", effects: { morale: -2, health: 2 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A sudden sickness spreads in the camp.", choices: [
          { label: "Quarantine and slow down.", effects: { health: 6, morale: -2 }, traits: { compassionate: 1 } },
          { label: "Continue marching and trust resilience.", effects: { health: -6, morale: 3 }, traits: { bold: 1 } },
          { label: "Use experimental remedies from the archives.", effects: { tech: 3, health: 2, morale: -1 }, traits: { innovative: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A convoy leader asks for better weather gear.", choices: [
          { label: "Redistribute supplies evenly.", effects: { supplies: -2, morale: 4 }, traits: { compassionate: 1 } },
          { label: "Keep elite units prioritized.", effects: { morale: -3, force: 3 }, traits: { strategic: 1 } },
          { label: "Purchase gear from traveling artisans.", effects: { economy: -3, morale: 2 }, traits: { diplomatic: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A river floods the supply trail.", choices: [
          { label: "Risk the crossing to save time.", effects: { supplies: -4, health: -2, morale: 3 }, traits: { bold: 1 } },
          { label: "Construct a ferry system.", effects: { tech: 2, supplies: -2 }, traits: { strategic: 1 } },
          { label: "Reroute through the forest.", effects: { supplies: -2, morale: -1, diplomacy: 1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Your guards suggest training local hunters for protection.", choices: [
          { label: "Accept and pay them well.", effects: { force: 3, economy: -2, diplomacy: 2 }, traits: { diplomatic: 1 } },
          { label: "Use only royal troops.", effects: { force: 2, morale: -2 }, traits: { bold: 1 } },
          { label: "Train a mixed squad with new tactics.", effects: { tech: 2, force: 2, supplies: -1 }, traits: { innovative: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A rockslide blocks the main pass.", choices: [
          { label: "Dig through to avoid delay.", effects: { health: -3, supplies: -2, morale: 2 }, traits: { bold: 1 } },
          { label: "Set up a base camp until safe.", effects: { morale: -2, health: 2 }, traits: { cautious: 1 } },
          { label: "Search for an alternate tunnel route.", effects: { tech: 2, supplies: -2 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A convoy transport unit breaks down.", choices: [
          { label: "Salvage parts to reinforce other carts.", effects: { supplies: -2, tech: 2 }, traits: { strategic: 1 } },
          { label: "Send a rescue party to the nearest town.", effects: { diplomacy: 2, economy: -2 }, traits: { diplomatic: 1 } },
          { label: "Leave the unit behind to keep moving.", effects: { supplies: -3, morale: -1, force: 1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Night predators stalk the camp.", choices: [
          { label: "Set loud deterrents and perimeter lights.", effects: { supplies: -2, morale: 2 }, traits: { innovative: 1 } },
          { label: "Quietly relocate to higher ground.", effects: { health: 2, morale: -1 }, traits: { cautious: 1 } },
          { label: "Lead a counter-hunt.", effects: { force: 2, health: -2, morale: 2 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Mid Phase I, a desert caravan offers supplies at a crossroads (shop available).", choices: [
          { label: "Trade for sun-dried provisions.", effects: { supplies: 8, coins: -11 }, traits: { diplomatic: 1 } },
          { label: "Purchase a smaller reserve and move on.", effects: { supplies: 4, coins: -5 }, traits: { cautious: 1 } },
          { label: "Decline the trade and keep speed.", effects: { morale: -1, economy: 1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "A storm ruins a portion of food stores.", choices: [
          { label: "Ration tightly and continue.", effects: { supplies: -4, morale: -2, economy: 1 }, traits: { cautious: 1 } },
          { label: "Organize a foraging sweep.", effects: { supplies: 2, health: -2 }, traits: { bold: 1 } },
          { label: "Trade with nomads for replacement.", effects: { economy: -2, diplomacy: 3 }, traits: { diplomatic: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Early in the march, a trading outpost offers rare rations at a high cost (shop available).", choices: [
          { label: "Buy enough for weeks of travel.", effects: { supplies: 10, coins: -18, economy: -4 }, traits: { cautious: 1 } },
          { label: "Negotiate for a fairer price.", effects: { diplomacy: 4, supplies: 6, coins: -10 }, traits: { diplomatic: 1 } },
          { label: "Decline and press on with existing stock.", effects: { morale: -2, economy: 2 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Your scientist proposes mapping energy vents for heat.", choices: [
          { label: "Approve the survey immediately.", effects: { tech: 4, supplies: -2 }, traits: { innovative: 1 } },
          { label: "Delay until the camp stabilizes.", effects: { health: 2, tech: -1 }, traits: { cautious: 1 } },
          { label: "Assign a small team to test the idea.", effects: { tech: 2, supplies: -1 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Midway through Phase I, a roadside market appears (shop available).", choices: [
          { label: "Buy compact rations for quick travel.", effects: { supplies: 6, coins: -9 }, traits: { strategic: 1 } },
          { label: "Buy only a small emergency stash.", effects: { supplies: 3, coins: -4 }, traits: { cautious: 1 } },
          { label: "Skip the market to save coins.", effects: { economy: 1, morale: -1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "Late Phase I, a mountain pass trading post opens a brief supply window (shop available).", choices: [
          { label: "Buy heated rations and blankets.", effects: { supplies: 7, health: 2, coins: -12 }, traits: { cautious: 1 } },
          { label: "Buy only fuel and water.", effects: { supplies: 4, coins: -6 }, traits: { strategic: 1 } },
          { label: "Skip to avoid the inflated prices.", effects: { economy: 1, morale: -1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase I — The Southern March", text: "The southern council refuses the crystal; they want it for their own wealth. The Spiretz League stays united. Your response?", choices: [
          { label: "Offer a treaty of shared energy research.", effects: { diplomacy: 6, economy: -2, coins: -4 }, traits: { diplomatic: 1 } },
          { label: "Demand the crystal on behalf of the league.", effects: { force: 2, diplomacy: -4, morale: 2 }, traits: { bold: 1 } },
          { label: "Withdraw to regroup and plan with allies.", effects: { morale: -1, diplomacy: 1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "You call the league centers: Pesimura (army), Whereland (tech), and Onia (economy). How do you frame the alliance plan?", choices: [
          { label: "Promise logistics routes to Pesimura in exchange for troop training.", effects: { diplomacy: 3, force: 1, economy: -1 }, traits: { diplomatic: 1 } },
          { label: "Offer a joint research pact to Whereland.", effects: { tech: 3, diplomacy: 1, coins: -4 }, traits: { innovative: 1 } },
          { label: "Ask Onia for emergency markets and strict discipline.", effects: { economy: 2, force: 2, morale: -1 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "You must train the army quickly.", choices: [
          { label: "Focus on rapid drills and morale chants.", effects: { force: 2, morale: 2, tech: -1 }, traits: { bold: 1 } },
          { label: "Train elite units with new tactics.", effects: { force: 3, tech: 1, morale: -1 }, traits: { strategic: 1 } },
          { label: "Keep training safe and inclusive.", effects: { morale: 3, force: -1 }, traits: { compassionate: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Whereland offers prototype shield tech.", choices: [
          { label: "Deploy immediately despite risks.", effects: { tech: 4, morale: -2 }, traits: { bold: 1 } },
          { label: "Test in controlled drills first.", effects: { tech: 2, force: 1, morale: -1 }, traits: { cautious: 1 } },
          { label: "Integrate only with elite squads.", effects: { tech: 2, force: 1, morale: -2 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "The economy strains under war prep.", choices: [
          { label: "Increase taxes temporarily.", effects: { economy: 3, morale: -2 }, traits: { strategic: 1 } },
          { label: "Rally donations with public ceremonies.", effects: { economy: 2, diplomacy: 1, force: -1 }, traits: { diplomatic: 1 } },
          { label: "Reduce non-military spending.", effects: { economy: 2, morale: -1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Pesimura asks for a cultural exchange as payment.", choices: [
          { label: "Agree and host a grand summit.", effects: { diplomacy: 4, economy: -1 }, traits: { diplomatic: 1 } },
          { label: "Decline to keep focus on the war.", effects: { force: 2, diplomacy: -2 }, traits: { bold: 1 } },
          { label: "Offer limited exchange with strict terms.", effects: { diplomacy: 2, economy: 1, morale: -1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "A new technology could reduce casualties.", choices: [
          { label: "Invest heavily in it.", effects: { tech: 4, economy: -3 }, traits: { innovative: 1 } },
          { label: "Use it only for defense.", effects: { tech: 2, force: 1, diplomacy: -1 }, traits: { cautious: 1 } },
          { label: "Reject and focus on training.", effects: { force: 2, tech: -1 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Onia proposes a decisive strike.", choices: [
          { label: "Approve and lead from the front.", effects: { force: 3, morale: 2, economy: -1 }, traits: { bold: 1 } },
          { label: "Negotiate a ceasefire instead.", effects: { diplomacy: 4, morale: 1, force: -2 }, traits: { diplomatic: 1 } },
          { label: "Delay until supplies are stable.", effects: { force: 1, economy: 1, morale: -1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Supply lines are threatened by southern scouts.", choices: [
          { label: "Fortify routes with patrols.", effects: { force: 2, economy: -1, morale: -1 }, traits: { strategic: 1 } },
          { label: "Move supplies at night with stealth.", effects: { supplies: 2, morale: -1 }, traits: { cautious: 1 } },
          { label: "Deploy decoy convoys to mislead.", effects: { tech: 2, diplomacy: -1, economy: -1 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "A southern envoy offers compromise: shared crystal control.", choices: [
          { label: "Accept shared control to avoid war.", effects: { diplomacy: 5, force: -1 }, traits: { compassionate: 1 } },
          { label: "Reject and push for full control.", effects: { force: 2, diplomacy: -3 }, traits: { bold: 1 } },
          { label: "Request a staged trial period.", effects: { diplomacy: 3, economy: -1, morale: -1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Tech researchers need rare minerals for upgrades.", choices: [
          { label: "Open the royal reserves.", effects: { tech: 3, economy: -2 }, traits: { innovative: 1 } },
          { label: "Trade with Pesimura.", effects: { diplomacy: 2, economy: -1 }, traits: { diplomatic: 1 } },
          { label: "Delay upgrades until after conflict.", effects: { tech: -1, economy: 1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Morale drops after a skirmish.", choices: [
          { label: "Hold a victory ceremony for the fallen.", effects: { morale: 3, diplomacy: 1, economy: -1 }, traits: { compassionate: 1 } },
          { label: "Offer bonus pay to soldiers.", effects: { economy: -2, morale: 3 }, traits: { strategic: 1 } },
          { label: "Push for a decisive battle to end it.", effects: { force: 2, morale: 1, health: -2 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Your engineers propose a crystal containment device.", choices: [
          { label: "Fund full prototype development.", effects: { tech: 4, economy: -3 }, traits: { innovative: 1 } },
          { label: "Partner with Whereland for safer rollout.", effects: { tech: 2, diplomacy: 2, economy: -1 }, traits: { diplomatic: 1 } },
          { label: "Reject and focus on classic tactics.", effects: { force: 2, tech: -1 }, traits: { cautious: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "The southern council invites you to a last negotiation.", choices: [
          { label: "Attend with an open hand and gifts.", effects: { diplomacy: 5, economy: -2 }, traits: { compassionate: 1 } },
          { label: "Attend with a display of force.", effects: { force: 2, diplomacy: -2 }, traits: { bold: 1 } },
          { label: "Send a trusted envoy to negotiate.", effects: { diplomacy: 3, force: -1, morale: -1 }, traits: { strategic: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Your advisors argue about final action.", choices: [
          { label: "Choose a diplomatic resolution.", effects: { diplomacy: 4, morale: 1, force: -2 }, traits: { diplomatic: 1 } },
          { label: "Choose a precision strike on supply depots.", effects: { force: 3, tech: 1, diplomacy: -2 }, traits: { strategic: 1 } },
          { label: "Choose a full assault to end the conflict.", effects: { force: 4, health: -3 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "The army requests relief rotations.", choices: [
          { label: "Grant rotations and medical rest.", effects: { morale: 2, force: -1, economy: -1 }, traits: { compassionate: 1 } },
          { label: "Grant only to elite units.", effects: { force: 1, morale: -1 }, traits: { strategic: 1 } },
          { label: "Deny to keep pressure.", effects: { force: 2, morale: -3 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "Economic advisors warn of inflation.", choices: [
          { label: "Stabilize currency with reserves.", effects: { economy: 3, morale: -1 }, traits: { cautious: 1 } },
          { label: "Encourage local production.", effects: { economy: 2, tech: 1, morale: -1 }, traits: { innovative: 1 } },
          { label: "Ignore and focus on victory.", effects: { force: 2, economy: -2 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "A final clash seems unavoidable.", choices: [
          { label: "Offer a shared crystal treaty one last time.", effects: { diplomacy: 4, force: -1 }, traits: { diplomatic: 1 } },
          { label: "Deploy elite units with tech advantage.", effects: { force: 3, tech: 2, health: -2 }, traits: { strategic: 1 } },
          { label: "Lead a bold charge to end it quickly.", effects: { force: 4, health: -4, morale: 2 }, traits: { bold: 1 } }
        ]},
        { chapter: "Phase II — The Crystal Conflict", text: "You stand before the crystal vault. How do you proceed?", choices: [
          { label: "Negotiate the final handoff with respect.", effects: { diplomacy: 4, morale: 1, force: -2 }, traits: { compassionate: 1 } },
          { label: "Activate containment tech to secure it safely.", effects: { tech: 4, supplies: -2 }, traits: { innovative: 1 } },
          { label: "Seize it with overwhelming force.", effects: { force: 4, diplomacy: -3, health: -2 }, traits: { bold: 1 } }
        ]}
      ];

      const QUEST_ZH_CHAPTER = {
        "Phase 0 — League Summit": "阶段 0 — 联盟峰会",
        "Phase I — The Southern March": "阶段 I — 南方远征",
        "Phase II — The Crystal Conflict": "阶段 II — 晶体冲突"
      };

      const QUEST_ZH_SCENE_TEXT = {
        "Kopahor, Whereland, Onia, and Pesimura meet as one Spiretz League. Onia is the economic center. You must negotiate what Onia is willing to fund.": "Kopahor、Whereland、Onia 与 Pesimura 以 Spiretz 联盟名义会盟。Onia 是经济核心。你必须谈判 Onia 愿意资助的范围。",
        "Transportation must be chosen for the southern journey. Advanced tech is available.": "南下旅程必须先确定交通方式。可使用先进技术。",
        "How many people do you bring on the quest?": "你要带多少人参与这次远征？",
        "Clothing for harsh climates must be purchased.": "必须采购适应严酷气候的衣物。",
        "How much food supplies do you bring?": "你要携带多少食物补给？",
        "Whereland (tech center) offers a field kit for survival analytics.": "Whereland（科技中心）提供一套野外生存分析工具。",
        "Your coalition departs into harsh climates; delays mean harsher seasons. Citizens watch closely. How do you start the march?": "联军即将进入恶劣气候区；拖延会导致季节更严酷。民众密切关注。你如何开启行军？",
        "A mountain storm forms at the pass.": "山口处形成暴风雪。",
        "A herd of wild beasts circles your convoy.": "一群野兽围住了你的车队。",
        "Early Phase I, a riverside settlement offers fish and clean water (shop available).": "阶段 I 初期，河边聚落提供鱼和净水（可补给）。",
        "Your scouts spot hostile beasts on the ice lake.": "侦察兵在冰湖发现敌对猛兽。",
        "A sudden sickness spreads in the camp.": "营地突然爆发疾病。",
        "A convoy leader asks for better weather gear.": "车队指挥官请求更好的防寒装备。",
        "A river floods the supply trail.": "河水暴涨，淹没补给路线。",
        "Your guards suggest training local hunters for protection.": "护卫建议训练当地猎人参与防护。",
        "A rockslide blocks the main pass.": "落石堵住了主通道。",
        "A convoy transport unit breaks down.": "一辆运输车发生故障。",
        "Night predators stalk the camp.": "夜间掠食者在营地周围徘徊。",
        "Mid Phase I, a desert caravan offers supplies at a crossroads (shop available).": "阶段 I 中期，沙漠商队在十字路口出售补给（可补给）。",
        "A storm ruins a portion of food stores.": "风暴毁坏了部分粮食储备。",
        "Early in the march, a trading outpost offers rare rations at a high cost (shop available).": "行军早期，贸易前哨以高价出售稀有口粮（可补给）。",
        "Your scientist proposes mapping energy vents for heat.": "科学家提议绘制地热喷口分布图用于取暖。",
        "Midway through Phase I, a roadside market appears (shop available).": "阶段 I 途中出现路边集市（可补给）。",
        "Late Phase I, a mountain pass trading post opens a brief supply window (shop available).": "阶段 I 后期，山口驿站短时开放补给窗口（可补给）。",
        "The southern council refuses the crystal; they want it for their own wealth. The Spiretz League stays united. Your response?": "南方议会拒绝交出晶体，想将其据为己有。Spiretz 联盟保持团结。你的回应是？",
        "You call the league centers: Pesimura (army), Whereland (tech), and Onia (economy). How do you frame the alliance plan?": "你召集联盟三大中心：Pesimura（军队）、Whereland（科技）、Onia（经济）。你将如何制定联盟方案？",
        "You must train the army quickly.": "你必须迅速完成军队训练。",
        "Whereland offers prototype shield tech.": "Whereland 提供原型护盾技术。",
        "The economy strains under war prep.": "备战压力使经济承压。",
        "Pesimura asks for a cultural exchange as payment.": "Pesimura 要求以文化交流作为回报。",
        "A new technology could reduce casualties.": "一项新技术可能减少伤亡。",
        "Onia proposes a decisive strike.": "Onia 提议发动决定性打击。",
        "Supply lines are threatened by southern scouts.": "补给线受到南方侦察队威胁。",
        "A southern envoy offers compromise: shared crystal control.": "南方使者提出妥协：共同控制晶体。",
        "Tech researchers need rare minerals for upgrades.": "科技研究团队需要稀有矿物进行升级。",
        "Morale drops after a skirmish.": "小规模交战后士气下降。",
        "Your engineers propose a crystal containment device.": "工程师提出晶体收容装置方案。",
        "The southern council invites you to a last negotiation.": "南方议会邀请你参加最后谈判。",
        "Your advisors argue about final action.": "顾问们就最终行动发生分歧。",
        "The army requests relief rotations.": "军队请求轮换休整。",
        "Economic advisors warn of inflation.": "经济顾问警告通胀风险。",
        "A final clash seems unavoidable.": "最终冲突似乎不可避免。",
        "You stand before the crystal vault. How do you proceed?": "你站在晶体金库前。接下来怎么做？"
      };

      const QUEST_ZH_LABEL = {
        "Present a full budget and accept strict audits.": "提交完整预算并接受严格审计。",
        "Offer shared risk and partial repayment.": "提出风险共担与部分偿还方案。",
        "Reject strings and seek a small, independent grant.": "拒绝附加条件，争取小额独立资助。",
        "Armored caravan cars with spare parts.": "选择装甲车队并携带备件。",
        "Ice-cap ship through dangerous waters.": "乘破冰船穿越危险水域。",
        "Sky-rail convoy with Whereland engines.": "采用 Whereland 引擎的空轨车队。",
        "Small elite team for speed.": "组建小型精英队追求速度。",
        "Balanced expedition force.": "组建均衡远征队。",
        "Large public expedition to inspire citizens.": "组织大型公开远征以鼓舞民众。",
        "Standard winter gear.": "采购标准冬季装备。",
        "Whereland thermal tech suits.": "采购 Whereland 恒温科技服。",
        "Minimal gear to save coins.": "精简装备以节省资金。",
        "Heavy rations for long safety.": "携带高额口粮保障长期安全。",
        "Balanced rations with periodic resupply.": "口粮均衡并定期补给。",
        "Light rations for speed.": "轻量口粮以提高速度。",
        "Purchase the full kit.": "购买完整套件。",
        "Buy a lighter version.": "购买轻量版套件。",
        "Decline to keep budget flexible.": "拒绝购买以保持预算弹性。",
        "Hold a public sendoff to raise morale.": "举行公开送行以提升士气。",
        "Leave quietly to save time.": "低调出发以节省时间。",
        "Launch with a show of force to deter attacks.": "高调展示武力以震慑袭击。",
        "Push through to keep schedule.": "强行推进以保进度。",
        "Camp and ration carefully.": "扎营并谨慎配给口粮。",
        "Use heat sigils and experimental tech.": "使用热符文与实验技术。",
        "Scare them off with fireworks.": "用烟火驱赶野兽。",
        "Offer food to avoid conflict.": "投喂食物避免冲突。",
        "Set a silent detour through ravines.": "经峡谷进行静默绕行。",
        "Buy fresh supplies for the camp.": "为营地购买新鲜补给。",
        "Buy a small ration boost.": "小额补充口粮。",
        "Skip the stop to keep moving.": "不停留，继续前进。",
        "Cross fast and light, leaving heavy carts.": "轻装快速过湖，放弃重型车。",
        "Build a temporary bridge and move safely.": "搭建临时桥，安全通过。",
        "Wait for the beasts to move on.": "等待野兽离开。",
        "Quarantine and slow down.": "隔离患者并减速前进。",
        "Continue marching and trust resilience.": "继续行军，依靠队伍韧性。",
        "Use experimental remedies from the archives.": "使用档案中的实验疗法。",
        "Redistribute supplies evenly.": "平均重新分配补给。",
        "Keep elite units prioritized.": "优先保障精英部队。",
        "Purchase gear from traveling artisans.": "向流动工匠采购装备。",
        "Risk the crossing to save time.": "冒险强渡以节省时间。",
        "Construct a ferry system.": "建立渡运系统。",
        "Reroute through the forest.": "改道穿越森林。",
        "Accept and pay them well.": "接受建议并给予高额报酬。",
        "Use only royal troops.": "仅使用王室部队。",
        "Train a mixed squad with new tactics.": "训练混编小队并采用新战术。",
        "Dig through to avoid delay.": "挖通障碍以避免延误。",
        "Set up a base camp until safe.": "建立临时基地等待安全。",
        "Search for an alternate tunnel route.": "寻找替代隧道路线。",
        "Salvage parts to reinforce other carts.": "拆解故障车补强其他车辆。",
        "Send a rescue party to the nearest town.": "派救援队前往最近城镇。",
        "Leave the unit behind to keep moving.": "丢下故障单元继续前进。",
        "Set loud deterrents and perimeter lights.": "布设高噪威慑与周界照明。",
        "Quietly relocate to higher ground.": "悄然转移到高地。",
        "Lead a counter-hunt.": "率队反向猎杀。",
        "Trade for sun-dried provisions.": "交易换取晒干口粮。",
        "Purchase a smaller reserve and move on.": "少量采购后继续前进。",
        "Decline the trade and keep speed.": "拒绝交易，保持速度。",
        "Ration tightly and continue.": "严格限粮并继续行进。",
        "Organize a foraging sweep.": "组织搜集采食行动。",
        "Trade with nomads for replacement.": "与游牧民交易补充物资。",
        "Buy enough for weeks of travel.": "购买可支撑数周的口粮。",
        "Negotiate for a fairer price.": "谈判争取更合理价格。",
        "Decline and press on with existing stock.": "拒绝购买，依靠现有库存前进。",
        "Approve the survey immediately.": "立即批准勘测方案。",
        "Delay until the camp stabilizes.": "待营地稳定后再执行。",
        "Assign a small team to test the idea.": "派小队先行测试方案。",
        "Buy compact rations for quick travel.": "购买紧凑口粮用于快速行军。",
        "Buy only a small emergency stash.": "只买少量应急储备。",
        "Skip the market to save coins.": "跳过市场以节省资金。",
        "Buy heated rations and blankets.": "购买加热口粮与毛毯。",
        "Buy only fuel and water.": "仅购买燃料和水。",
        "Skip to avoid the inflated prices.": "跳过购买以避开高价。",
        "Offer a treaty of shared energy research.": "提出共享能源研究条约。",
        "Demand the crystal on behalf of the league.": "代表联盟要求交出晶体。",
        "Withdraw to regroup and plan with allies.": "暂退整编并与盟友重拟计划。",
        "Promise logistics routes to Pesimura in exchange for troop training.": "承诺向 Pesimura 提供后勤线路以换取练兵支持。",
        "Offer a joint research pact to Whereland.": "向 Whereland 提出联合科研协定。",
        "Ask Onia for emergency markets and strict discipline.": "请求 Onia 提供紧急市场并执行严格纪律。",
        "Focus on rapid drills and morale chants.": "专注快速操练与士气口号。",
        "Train elite units with new tactics.": "以新战术训练精英部队。",
        "Keep training safe and inclusive.": "保持训练安全且覆盖全员。",
        "Deploy immediately despite risks.": "无视风险立即部署。",
        "Test in controlled drills first.": "先在可控演练中测试。",
        "Integrate only with elite squads.": "仅在精英小队中整合应用。",
        "Increase taxes temporarily.": "临时提高税收。",
        "Rally donations with public ceremonies.": "通过公开仪式募集捐款。",
        "Reduce non-military spending.": "削减非军事开支。",
        "Agree and host a grand summit.": "同意并主持大型峰会。",
        "Decline to keep focus on the war.": "拒绝以保持战争重心。",
        "Offer limited exchange with strict terms.": "在严格条件下提供有限交流。",
        "Invest heavily in it.": "大规模投入该技术。",
        "Use it only for defense.": "仅用于防御。",
        "Reject and focus on training.": "拒绝采用并专注训练。",
        "Approve and lead from the front.": "批准并亲自前线指挥。",
        "Negotiate a ceasefire instead.": "改为谈判停火。",
        "Delay until supplies are stable.": "待补给稳定后再行动。",
        "Fortify routes with patrols.": "通过巡逻强化路线防护。",
        "Move supplies at night with stealth.": "夜间隐蔽转运补给。",
        "Deploy decoy convoys to mislead.": "部署诱饵车队误导敌方。",
        "Accept shared control to avoid war.": "接受共同控制以避免战争。",
        "Reject and push for full control.": "拒绝妥协并争取完全控制。",
        "Request a staged trial period.": "请求分阶段试行期。",
        "Open the royal reserves.": "启用王室储备。",
        "Trade with Pesimura.": "与 Pesimura 开展贸易。",
        "Delay upgrades until after conflict.": "将升级延后至冲突结束后。",
        "Hold a victory ceremony for the fallen.": "为阵亡者举行胜利纪念仪式。",
        "Offer bonus pay to soldiers.": "向士兵发放奖金。",
        "Push for a decisive battle to end it.": "推动决战以终结冲突。",
        "Fund full prototype development.": "全额资助原型研发。",
        "Partner with Whereland for safer rollout.": "与 Whereland 合作以更安全部署。",
        "Reject and focus on classic tactics.": "拒绝方案并回归传统战术。",
        "Attend with an open hand and gifts.": "携善意与礼物参加谈判。",
        "Attend with a display of force.": "以武力展示姿态参加谈判。",
        "Send a trusted envoy to negotiate.": "派可信使者代为谈判。",
        "Choose a diplomatic resolution.": "选择外交解决方案。",
        "Choose a precision strike on supply depots.": "选择对补给仓实施精确打击。",
        "Choose a full assault to end the conflict.": "选择全面强攻结束冲突。",
        "Grant rotations and medical rest.": "批准轮换与医疗休整。",
        "Grant only to elite units.": "仅向精英部队提供轮换。",
        "Deny to keep pressure.": "拒绝轮换以维持压力。",
        "Stabilize currency with reserves.": "用储备稳定货币。",
        "Encourage local production.": "鼓励本地生产。",
        "Ignore and focus on victory.": "忽略警告，专注取胜。",
        "Offer a shared crystal treaty one last time.": "最后一次提出共享晶体条约。",
        "Deploy elite units with tech advantage.": "以科技优势部署精英部队。",
        "Lead a bold charge to end it quickly.": "亲自率领突击，速战速决。",
        "Negotiate the final handoff with respect.": "以尊重方式谈判最终交接。",
        "Activate containment tech to secure it safely.": "启用收容技术以安全控制晶体。",
        "Seize it with overwhelming force.": "以压倒性武力强行夺取。"
      };

      function qChapter(text) {
        if (!IS_ZH) return text;
        return QUEST_ZH_CHAPTER[text] || text;
      }

      function qScene(text) {
        if (!IS_ZH) return text;
        return QUEST_ZH_SCENE_TEXT[text] || text;
      }

      function qChoice(text) {
        if (!IS_ZH) return text;
        return QUEST_ZH_LABEL[text] || text;
      }

      const DEFAULT_TIME = 2;
      let cachedName = "";
      let index = 0;
      let lastCanvas = null;
      let guideFollowed = true;
      const state = {
        supplies: 80,
        health: 100,
        morale: 60,
        diplomacy: 40,
        force: 45,
        tech: 35,
        economy: 50,
        coins: 90,
        timeDays: 0,
        people: 120,
        casualties: 15,
        startedMarch: false,
        phase: 0,
        lockResources: false
      };
      const traitScore = {
        bold: 0,
        cautious: 0,
        diplomatic: 0,
        strategic: 0,
        compassionate: 0,
        innovative: 0
      };

      function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
      }

      function applyEffects(effects) {
        Object.entries(effects).forEach(([key, val]) => {
          if (key === "coins") {
            if (state.lockResources) return;
            state.coins += val;
            return;
          }
          if (key === "time") {
            state.timeDays = Math.max(0, state.timeDays + val);
            return;
          }
          if (key === "people") {
            if (state.lockResources) return;
            state.people = Math.max(20, state.people + val);
            return;
          }
          if (key === "health" && !state.startedMarch) return;
          if (state.lockResources && (key === "supplies" || key === "health")) return;
          if (key === "supplies" && !state.lockResources && val > 0) {
            state[key] = clamp(state[key] + val + 5, 0, 100);
            return;
          }
          if (key in state) state[key] = clamp(state[key] + val, 0, 100);
        });
        state.morale = clamp(state.morale + 1, 0, 100);
        if (state.startedMarch) {
          const dailyFood = Math.max(1, Math.round(state.people / 110));
          const dayCost = Math.max(1, effects.time || DEFAULT_TIME);
          const foodUsed = dailyFood * dayCost;
          if (!state.lockResources) {
            state.supplies = clamp(state.supplies - foodUsed, 0, 100);
          }
          if (state.supplies === 0) {
            state.health = clamp(state.health - 6, 0, 100);
            state.morale = clamp(state.morale - 4, 0, 100);
          }
        }
        if (state.startedMarch && !state.lockResources) {
          const season = seasonFromTime(state.timeDays);
          if (season === "Winter") {
            state.health = clamp(state.health - 3, 0, 100);
            state.supplies = clamp(state.supplies - 2, 0, 100);
            state.morale = clamp(state.morale - 2, 0, 100);
          } else if (season === "Autumn") {
            state.health = clamp(state.health - 1, 0, 100);
            state.supplies = clamp(state.supplies - 1, 0, 100);
          } else if (season === "Summer") {
            state.health = clamp(state.health - 1, 0, 100);
          }
          const randomRisk = clamp((60 - state.health) / 120 + (20 - state.supplies) / 120 + (season === "Winter" ? 0.06 : 0), 0, 0.18);
          if (Math.random() < randomRisk) {
            const loss = Math.max(1, Math.round(state.people / 45));
            state.people = Math.max(20, state.people - loss);
            state.morale = clamp(state.morale - 2, 0, 100);
            state.casualties = clamp(state.casualties + 2, 0, 100);
            if (IS_ZH) {
              const seasonZh = season === "Winter" ? "冬季" : season === "Autumn" ? "秋季" : season === "Summer" ? "夏季" : "春季";
              state.lastEvent = `${seasonZh}发生突发事故，造成 ${loss} 人死亡。`;
            } else {
              state.lastEvent = `A sudden accident in the ${season.toLowerCase()} claimed ${loss} lives.`;
            }
          } else {
            state.lastEvent = "";
          }
        } else {
          state.lastEvent = "";
        }
        const risk = Math.max(0, 3 - (state.tech + state.diplomacy) / 60);
        state.casualties = clamp(state.casualties + Math.round(risk), 0, 100);
      }

      function applyTraits(traits) {
        Object.entries(traits).forEach(([key, val]) => {
          if (traitScore[key] !== undefined) traitScore[key] += val;
        });
      }

      function seasonFromTime() {
        return "Spring";
      }

      function citizenMood() {
        if (state.phase === 2 && state.lockResources) {
          const timeStrain = Math.min(25, Math.round(state.timeDays / 10));
          const pressure = (100 - state.morale) + (60 - state.economy) + timeStrain;
          if (IS_ZH) {
            if (pressure > 95) return "战争传闻扩散，民众再次陷入焦虑。";
            if (pressure > 70) return "民众不安，但仍希望联盟获胜。";
            return "阶段 I 后民众相对平稳，仍在密切关注局势。";
          }
          if (pressure > 95) return "Citizens are worried again as war rumors spread.";
          if (pressure > 70) return "Citizens are uneasy but hoping the league prevails.";
          return "Citizens are calm after Phase I, watching carefully.";
        }
        if (state.phase >= 2) return IS_ZH ? "阶段 I 后民众相对平稳，仍在密切关注局势。" : "Citizens are calm after Phase I, watching carefully.";
        const minPhaseDays = Math.min(30, SCENES.filter(s => s.chapter.startsWith("Phase I")).length);
        if (state.timeDays <= minPhaseDays) return IS_ZH ? "民众情绪稳定；行程速度基本符合预期。" : "Citizens are calm; the journey is moving as fast as hoped.";
        const timeStrain = Math.min(25, Math.round(state.timeDays / 8));
        const pressure = (100 - state.morale) + (60 - state.economy) + timeStrain;
        if (IS_ZH) {
          if (pressure > 100) return "漫长等待使民众恐惧且疲惫。";
          if (pressure > 78) return "随着时间拖延，民众愈发担忧。";
          if (pressure > 58) return "民众虽不安，但仍保持信心。";
          return "民众状态稳定并抱有希望。";
        }
        if (pressure > 100) return "Citizens are fearful and exhausted by the long wait.";
        if (pressure > 78) return "Citizens are worried as the days drag on.";
        if (pressure > 58) return "Citizens are uneasy but still holding faith.";
        return "Citizens are steady and hopeful.";
      }

      function renderMeters() {
        const statsHtml = STATS.map((s) => {
          const value = state[s.id];
          return `
            <div class="quest-meter-row">
              <div>
                <b>${s.label}</b>
                <div class="quest-bar"><span style="width:${value}%;"></span></div>
              </div>
              <span class="mini-note">${value}%</span>
            </div>
          `;
        }).join("");
        const coinBar = Math.max(0, Math.min(100, Math.round((state.coins / 200) * 100)));
        const timeBar = Math.max(0, Math.min(100, Math.round((state.timeDays / 120) * 100)));
        metersWrap.innerHTML = `
          ${statsHtml}
          <div class="quest-meter-row">
            <div>
              <b>${IS_ZH ? "人数" : "People"}</b>
              <div class="quest-bar"><span style="width:${Math.min(100, Math.round((state.people / 300) * 100))}%;"></span></div>
            </div>
            <span class="mini-note">${state.people}</span>
          </div>
          <div class="quest-meter-row">
            <div>
              <b>${IS_ZH ? "资金" : "Coins"}</b>
              <div class="quest-bar"><span style="width:${coinBar}%;"></span></div>
            </div>
            <span class="mini-note">${state.coins}</span>
          </div>
          <div class="quest-meter-row">
            <div>
              <b>${IS_ZH ? "时间" : "Time"}</b>
              <div class="quest-bar"><span style="width:${timeBar}%;"></span></div>
            </div>
            <span class="mini-note">${IS_ZH ? "第" + state.timeDays + "天" : "Day " + state.timeDays}</span>
          </div>
          <div class="rule-note" style="margin-top:8px;">
            <p style="margin:0;"><b>${IS_ZH ? "民意" : "Citizens"}:</b> ${citizenMood()}</p>
          </div>
        `;
      }

      const GUIDE_PATH = [
        "Present a full budget and accept strict audits.",
        "Sky-rail convoy with Whereland engines.",
        "Balanced expedition force.",
        "Whereland thermal tech suits.",
        "Heavy rations for long safety.",
        "Purchase the full kit.",
        "Hold a public sendoff to raise morale.",
        "Camp and ration carefully.",
        "Scare them off with fireworks.",
        "Buy fresh supplies for the camp.",
        "Build a temporary bridge and move safely.",
        "Quarantine and slow down.",
        "Redistribute supplies evenly.",
        "Construct a ferry system.",
        "Train a mixed squad with new tactics.",
        "Set up a base camp until safe.",
        "Send a rescue party to the nearest town.",
        "Set loud deterrents and perimeter lights.",
        "Trade for sun-dried provisions.",
        "Trade with nomads for replacement.",
        "Negotiate for a fairer price.",
        "Approve the survey immediately.",
        "Buy compact rations for quick travel.",
        "Buy heated rations and blankets.",
        "Offer a treaty of shared energy research.",
        "Offer a joint research pact to Whereland.",
        "Train elite units with new tactics.",
        "Test in controlled drills first.",
        "Rally donations with public ceremonies.",
        "Offer limited exchange with strict terms.",
        "Invest heavily in it.",
        "Negotiate a ceasefire instead.",
        "Fortify routes with patrols.",
        "Accept shared control to avoid war.",
        "Open the royal reserves.",
        "Hold a victory ceremony for the fallen.",
        "Partner with Whereland for safer rollout.",
        "Attend with an open hand and gifts.",
        "Choose a diplomatic resolution.",
        "Grant rotations and medical rest.",
        "Encourage local production.",
        "Offer a shared crystal treaty one last time.",
        "Negotiate the final handoff with respect."
      ];

      function renderGuide() {
        if (!guideWrap) return;
        const rows = SCENES.map((scene, idx) => {
          const guideLabel = GUIDE_PATH[idx] || scene.choices[0]?.label;
          const best = scene.choices.find((c) => c.label === guideLabel) || scene.choices[0];
          return `
            <div class="rule-note" style="margin:8px 0;">
              <p style="margin:0;"><b>${IS_ZH ? "章节" : "Chapter"} ${idx + 1}:</b> ${qScene(scene.text)}</p>
              <p style="margin:6px 0 0 0;"><b>${IS_ZH ? "推荐选择" : "Recommended"}:</b> ${qChoice(best.label)}</p>
            </div>
          `;
        }).join("");
        guideWrap.innerHTML = rows;
      }

      function inferTime(label) {
        const text = (label || "").toLowerCase();
        if (text.includes("ship") || text.includes("sea") || text.includes("ice-cap")) return 7;
        if (text.includes("reroute") || text.includes("detour") || text.includes("tunnel")) return 6;
        if (text.includes("build") || text.includes("construct") || text.includes("bridge") || text.includes("ferry")) return 5;
        if (text.includes("train") || text.includes("drills")) return 5;
        if (text.includes("wait") || text.includes("delay") || text.includes("camp")) return 4;
        if (text.includes("negotiate") || text.includes("summit") || text.includes("treaty")) return 3;
        if (text.includes("push") || text.includes("fast") || text.includes("quick") || text.includes("rush")) return 1;
        return DEFAULT_TIME;
      }

      function resolveEffects(choice) {
        const eff = { ...(choice.effects || {}) };
        if (!("time" in eff)) eff.time = inferTime(choice.label || "");
        if (eff.time < 0) eff.time = Math.abs(eff.time);
        return eff;
      }

      function effectsText(effects) {
        const parts = [];
        const order = ["time", "coins", "supplies", "health", "morale", "diplomacy", "force", "tech", "economy", "people"];
        order.forEach((key) => {
          const val = effects[key];
          if (!val) return;
          const sign = val > 0 ? "+" : "";
          if (key === "time") parts.push(IS_ZH ? `${sign}${val} 天` : `${sign}${val} days`);
          else if (key === "coins") parts.push(IS_ZH ? `${sign}${val} 资金` : `${sign}${val} coins`);
          else if (IS_ZH) {
            const zhKey = {
              supplies: "补给",
              health: "健康",
              morale: "士气",
              diplomacy: "外交",
              force: "武力",
              tech: "科技",
              economy: "经济",
              people: "人数"
            }[key] || key;
            parts.push(`${sign}${val} ${zhKey}`);
          } else {
            parts.push(`${sign}${val} ${key}`);
          }
        });
        return parts.join(", ");
      }

      const OUTCOME_BY_LABEL = {
        "Present a full budget and accept strict audits.": "You deliver a detailed budget and invite Onia’s auditors into the room. Their approval is swift, but the oversight feels heavy. The league senses your discipline and watches your next move closely.",
        "Offer shared risk and partial repayment.": "You outline a shared-risk plan that spreads responsibility across the league. Onia agrees to fund you, but only with clear repayment terms. The council leaves cautious yet cooperative.",
        "Reject strings and seek a small, independent grant.": "You refuse conditions and request only a clean, smaller grant. Onia relents, but several allies question the choice. Your inner circle feels relieved to keep full control.",
        "Armored caravan cars with spare parts.": "You order armored caravan cars and stock them with spare parts. The convoy feels secure and disciplined. The weight and maintenance slow your flexibility on the road.",
        "Ice-cap ship through dangerous waters.": "You send the expedition by ice-cap ship along the southern waters. The voyage protects cargo but stretches the timeline. Sailors and soldiers brace against harsh winds and long nights.",
        "Sky-rail convoy with Whereland engines.": "You commit to Whereland’s sky-rail engines to leap over hazards. The convoy glides above danger and morale spikes briefly. The price is steep and the tech must not fail.",
        "Small elite team for speed.": "You select a lean elite team built for speed and precision. The march becomes sharper and quieter. Families at home worry about the risk of such a small force.",
        "Balanced expedition force.": "You assemble a balanced expedition with soldiers, medics, and engineers. The group can handle most threats without excess burden. The pace is steady, and expectations grow.",
        "Large public expedition to inspire citizens.": "You invite a large public expedition to unify the nation. Cheers follow the caravan and morale rises. Feeding and protecting the larger group becomes a daily strain.",
        "Standard winter gear.": "You buy standard winter gear for the full caravan. The team stays warm and the order feels fair. The supplies are reliable but unremarkable.",
        "Whereland thermal tech suits.": "You purchase Whereland thermal suits for the expedition. The tech keeps the cold at bay and boosts confidence. The cost draws critical eyes from Onia’s accountants.",
        "Minimal gear to save coins.": "You cut the clothing budget to preserve coins. The caravan moves lighter, but the cold bites harder. Complaints rise quietly around the fires.",
        "Heavy rations for long safety.": "You load heavy rations to secure the journey. The caravan feels protected against long delays. The extra weight drags on speed and flexibility.",
        "Balanced rations with periodic resupply.": "You choose balanced rations and plan for resupply points. The caravan keeps a steady pace without overloading. The risk now depends on reliable markets.",
        "Light rations for speed.": "You carry light rations to push speed. The convoy accelerates and feels nimble. Hunger shadows the march whenever delays appear.",
        "Purchase the full kit.": "You buy Whereland’s full survival analytics kit. Sensors begin mapping hazards and improving decisions. The purchase is powerful but costly.",
        "Buy a lighter version.": "You buy a lighter analytics kit and prioritize key routes. The data is helpful but incomplete. The team accepts the tradeoff as practical.",
        "Decline to keep budget flexible.": "You decline the kit to keep money flexible. Scouts take on more responsibility without technological support. Engineers whisper about avoidable risks.",
        "Hold a public sendoff to raise morale.": "You stage a public sendoff and lift spirits with speeches. The nation sends you forward with pride. The ceremony takes time and coin.",
        "Leave quietly to save time.": "You depart quietly before dawn to save time. The convoy keeps a sharp pace and avoids attention. Some citizens feel uneasy about the silence.",
        "Launch with a show of force to deter attacks.": "You leave with a show of force and banners raised. Predators and raiders keep their distance. The display reinforces strength but costs resources.",
        "Push through to keep schedule.": "You force the convoy through harsh conditions to keep the schedule. The decision buys speed, but it drains health. The camp grows tense as the cold bites.",
        "Camp and ration carefully.": "You order a careful camp and strict rations. The caravan rests and stabilizes, even if spirits dip. The delay feels safer but costly in time.",
        "Use heat sigils and experimental tech.": "You deploy experimental heat sigils against the cold. The tech works, but the camp watches for failures. Confidence rises, yet supplies thin out.",
        "Scare them off with fireworks.": "You launch fireworks to scatter the beasts. The camp cheers and a panic turns to relief. Supplies take a small hit for the spectacle.",
        "Offer food to avoid conflict.": "You offer rations to avoid a fight. The beasts drift away and injuries are avoided. The loss of food weighs on everyone afterward.",
        "Set a silent detour through ravines.": "You choose a silent detour through ravines. The convoy avoids conflict but the route is punishing. The terrain slows the march and strains morale.",
        "Buy enough for weeks of travel.": "You purchase weeks of rations at the outpost. The caravan breathes easier and plans become steadier. The price is high and the treasury tightens.",
        "Negotiate for a fairer price.": "You negotiate patiently for better prices. The merchant yields, though time is lost in bargaining. The camp respects the careful stewardship.",
        "Decline and press on with existing stock.": "You decline the offer and keep moving. The convoy saves coin but leans on limited stock. Some worry the road ahead will punish the choice.",
        "Buy compact rations for quick travel.": "You buy compact rations meant for speed. The caravan moves lighter and faster. The food is less satisfying and morale dips.",
        "Buy only a small emergency stash.": "You buy a small emergency stash and keep most coin. The expedition feels prepared but not secure. Officers debate whether you cut too close.",
        "Skip the market to save coins.": "You skip the market to save coin. The convoy keeps its pace but loses a chance to strengthen supplies. The decision feels risky to many.",
        "Cross fast and light, leaving heavy carts.": "You cross fast and abandon heavy carts to the lake. The move saves lives but sacrifices supplies. The convoy remembers the loss as it marches on.",
        "Build a temporary bridge and move safely.": "You order a temporary bridge to cross safely. The work slows the march but keeps supplies intact. The crew respects the steady leadership.",
        "Wait for the beasts to move on.": "You wait for the beasts to pass before crossing. The camp grows impatient but avoids direct danger. Time slips away as the ice creaks.",
        "Quarantine and slow down.": "You quarantine the sick and slow the pace. Health improves but the caravan feels constrained. Some fear the delay will invite harsher seasons.",
        "Continue marching and trust resilience.": "You push forward and trust the group’s resilience. The march stays quick, but illness spreads. Confidence fades as more falter.",
        "Use experimental remedies from the archives.": "You deploy experimental remedies from the archives. Some recover quickly, others suffer side effects. The camp debates the risk you took.",
        "Redistribute supplies evenly.": "You redistribute gear across the convoy. Morale rises as fairness spreads. The best-equipped units lose their edge.",
        "Keep elite units prioritized.": "You keep elite units prioritized for survival. The frontline stays strong, but resentment grows. The convoy feels divided afterward.",
        "Purchase gear from traveling artisans.": "You buy gear from traveling artisans. The equipment lifts morale and adds comfort. The expense draws attention from the treasury.",
        "Risk the crossing to save time.": "You risk a direct river crossing to save time. The convoy makes it, but losses sting. The team remembers the gamble.",
        "Construct a ferry system.": "You build a ferry system and move in stages. The crossing is controlled, though slower than hoped. The engineers gain confidence in their work.",
        "Reroute through the forest.": "You reroute through the forest and avoid the flood. The detour brings new hazards and delays. The caravan emerges tired but intact.",
        "Accept and pay them well.": "You hire the hunters and pay them well. Their knowledge improves security and local ties. The cost is heavy but the path feels safer.",
        "Use only royal troops.": "You rely solely on royal troops. The chain of command is clear, but local knowledge is lost. The guards feel proud yet stretched thin.",
        "Train a mixed squad with new tactics.": "You form a mixed squad and test new tactics. Coordination improves and morale shifts. The experiments cost time and patience.",
        "Dig through to avoid delay.": "You order the convoy to dig through the debris. The effort saves time but exhausts the team. Injuries and fatigue rise.",
        "Set up a base camp until safe.": "You set a base camp and wait for safety. The pause restores strength but drains urgency. The caravan grows restless as days pass.",
        "Search for an alternate tunnel route.": "You search for a tunnel route through the mountains. The discovery keeps supplies moving but costs time. Scouts return battered but successful.",
        "Salvage parts to reinforce other carts.": "You salvage the broken cart for parts. The convoy becomes more durable, but capacity shrinks. The loss is accepted as necessary.",
        "Send a rescue party to the nearest town.": "You send a rescue party to the nearest town. Help arrives, but the delay extends the march. The town watches your strength closely.",
        "Leave the unit behind to keep moving.": "You abandon the transport unit to keep moving. The convoy saves time but loses supplies. The decision divides the team.",
        "Set loud deterrents and perimeter lights.": "You set loud deterrents and ring the camp with light. Predators keep distance, but the noise frays nerves. Supplies are burned to fuel the defense.",
        "Quietly relocate to higher ground.": "You move the camp quietly to higher ground. The shift reduces attacks but tires the caravan. The move is effective, not inspiring.",
        "Lead a counter-hunt.": "You lead a counter-hunt to remove the threat. The predators scatter, and morale lifts briefly. The risk leaves scars among the hunters.",
        "Ration tightly and continue.": "You tighten rations to stretch supplies. The march continues, but hunger wears on morale. The convoy grows quiet and focused.",
        "Organize a foraging sweep.": "You organize a foraging sweep in the wilds. Extra food is found, but injuries occur. The decision feels bold yet costly.",
        "Trade with nomads for replacement.": "You trade with nomads for replacement stores. Diplomacy improves and supplies recover. The trade costs coin and leverage.",
        "Approve the survey immediately.": "You approve the energy-vent survey immediately. The team gains valuable heat maps and new confidence. The detour costs time and supplies.",
        "Delay until the camp stabilizes.": "You delay the survey to stabilize the camp. The decision reduces risk but misses immediate opportunities. The scientists are disappointed yet comply.",
        "Assign a small team to test the idea.": "You send a small team to test the vents. They return with partial data and stories of strange heat. The results are useful but limited.",
        "Offer a treaty of shared energy research.": "You offer a treaty for shared research. The council listens, and tension cools. The league gains a moral foothold but no immediate crystal.",
        "Demand the crystal on behalf of the league.": "You demand the crystal as league property. The south stiffens and refuses. The stance strengthens unity but risks open conflict.",
        "Withdraw to regroup and plan with allies.": "You withdraw and regroup with your allies. The retreat preserves resources and opens planning time. Some perceive the move as weakness.",
        "Promise logistics routes to Pesimura in exchange for troop training.": "You promise Pesimura new routes in return for training support. Their generals agree, and drill schedules begin. The deal helps the army but burdens your supply planning.",
        "Offer a joint research pact to Whereland.": "You offer Whereland a joint research pact. Their engineers commit resources and share prototypes. The pact deepens trust but adds costs.",
        "Ask Onia for emergency markets and strict discipline.": "You ask Onia to stabilize markets and enforce discipline. Supplies start flowing again and order tightens. Citizens fear austerity measures.",
        "Focus on rapid drills and morale chants.": "You push rapid drills with morale chants. The ranks grow loud and energetic. The haste leaves gaps in technique.",
        "Train elite units with new tactics.": "You train elite units in new tactics. Their effectiveness rises and confidence grows. The rest of the army feels sidelined.",
        "Keep training safe and inclusive.": "You keep training safe and inclusive. Injury rates drop and morale lifts. The training is slower and less aggressive.",
        "Deploy immediately despite risks.": "You deploy prototype shields immediately. The tech intimidates rivals but malfunctions appear. Some units lose trust in the devices.",
        "Test in controlled drills first.": "You test the shields in controlled drills. Failures are caught early and confidence grows. The delay frustrates frontline commanders.",
        "Integrate only with elite squads.": "You integrate the shields only with elite squads. The elite grow stronger, but inequality spreads. The rest of the force demands parity.",
        "Increase taxes temporarily.": "You raise taxes to fund the war. The treasury stabilizes, but citizens complain. Public trust dips as costs rise.",
        "Rally donations with public ceremonies.": "You rally donations through public ceremonies. Coins flow in and civic pride rises. The events consume precious time and resources.",
        "Reduce non-military spending.": "You reduce non-military spending. The war effort gains support, but civilian services weaken. Discontent grows among the towns.",
        "Agree and host a grand summit.": "You host a grand summit for Pesimura’s cultural exchange. Relations warm and coordination improves. The cost and time are significant.",
        "Decline to keep focus on the war.": "You decline the exchange to keep focus on war. The army stays sharp, but Pesimura feels slighted. Cooperation becomes more conditional.",
        "Offer limited exchange with strict terms.": "You offer a limited exchange under strict terms. The gesture keeps relations intact without full commitment. The compromise satisfies no one fully.",
        "Invest heavily in it.": "You invest heavily in the new technology. The labs accelerate, and casualties may drop. The economy strains under the expense.",
        "Use it only for defense.": "You restrict the technology to defensive use. Troops feel safer, but offensive potential is lost. Commanders debate the restraint.",
        "Reject and focus on training.": "You reject the technology and focus on training. The army hardens through discipline. Scientists feel ignored and innovation slows.",
        "Approve and lead from the front.": "You approve the strike and lead from the front. The army surges with you, but the risk is severe. Your presence inspires and endangers at once.",
        "Negotiate a ceasefire instead.": "You propose a ceasefire and open direct talks. The battlefield quiets and diplomacy rises. Some commanders fear you are losing momentum.",
        "Delay until supplies are stable.": "You delay the strike until supplies stabilize. The army regains footing and confidence. The south strengthens defenses during the pause.",
        "Fortify routes with patrols.": "You fortify supply routes with patrols and checkpoints. Lines become safer, though manpower spreads thin. The effort slows offensive operations.",
        "Move supplies at night with stealth.": "You move supplies at night and avoid open paths. Losses drop, but crews grow exhausted. The secrecy feeds rumors in camp.",
        "Deploy decoy convoys to mislead.": "You deploy decoy convoys to mislead scouts. The trick works and real supplies pass safely. The decoys pay a heavy price.",
        "Accept shared control to avoid war.": "You accept shared control of the crystal. Tension drops and lives are spared. The league gains security but not full power.",
        "Reject and push for full control.": "You reject shared control and push for full access. The stance hardens resolve but inflames the south. Conflict escalates quickly.",
        "Request a staged trial period.": "You request a staged trial period for shared control. The south agrees cautiously, and trust grows slowly. The league gains time to prepare.",
        "Open the royal reserves.": "You open the royal reserves for tech upgrades. The labs surge forward, but the treasury thins. Critics warn of long-term costs.",
        "Trade with Pesimura.": "You trade with Pesimura for rare minerals. The alliance strengthens and supplies arrive. The price is higher than expected.",
        "Delay upgrades until after conflict.": "You delay upgrades until after the conflict. The budget steadies, but tech lags behind. Engineers complain about missed windows.",
        "Hold a victory ceremony for the fallen.": "You hold a victory ceremony for the fallen. Morale lifts and the nation grieves together. The ceremony consumes time and coin.",
        "Offer bonus pay to soldiers.": "You offer bonus pay to raise morale. Soldiers respond with renewed loyalty. The treasury tightens under the cost.",
        "Push for a decisive battle to end it.": "You push for a decisive battle. The army braces and moves with purpose. The risk of heavy losses rises.",
        "Fund full prototype development.": "You fund full prototype development of the containment device. Innovation accelerates and hope rises. The project consumes the budget quickly.",
        "Partner with Whereland for safer rollout.": "You partner with Whereland for a safer rollout. The device improves under shared oversight. Progress slows but reliability increases.",
        "Reject and focus on classic tactics.": "You reject the device and focus on classic tactics. The army relies on proven methods. Scientists feel sidelined and momentum fades.",
        "Attend with an open hand and gifts.": "You attend the negotiation with gifts and humility. The south listens more openly and tempers cool. Allies see your compassion as strength.",
        "Attend with a display of force.": "You arrive with a strong display of force. The south is cautious and talks remain tense. The show of power risks escalation.",
        "Send a trusted envoy to negotiate.": "You send a trusted envoy in your place. The envoy negotiates carefully and preserves your safety. Some leaders feel your absence.",
        "Choose a diplomatic resolution.": "You choose diplomacy as the final path. The council calms and channels open. The army feels restrained but preserves lives.",
        "Choose a precision strike on supply depots.": "You authorize precision strikes on supply depots. The enemy’s logistics falter and momentum shifts. The risk of retaliation grows.",
        "Choose a full assault to end the conflict.": "You choose a full assault to end the conflict. The battlefield roars with decisive force. Victory is possible, but losses are likely.",
        "Grant rotations and medical rest.": "You grant rotations and medical rest. The army recovers and morale lifts. The slower pace gives the south time to prepare.",
        "Grant only to elite units.": "You grant rotations only to elite units. The elite stay sharp, but others feel neglected. Resentment simmers in the ranks.",
        "Deny to keep pressure.": "You deny rotations to keep pressure high. The army remains aggressive, but exhaustion spreads. Morale drops in silence.",
        "Stabilize currency with reserves.": "You stabilize the currency with reserves. Markets calm and prices level. The reserves thin, leaving little cushion later.",
        "Encourage local production.": "You encourage local production and innovation. The economy adapts and citizens feel involved. Results take time to mature.",
        "Ignore and focus on victory.": "You ignore inflation warnings to focus on victory. The war effort stays strong, but prices spike at home. Citizens grow uneasy.",
        "Offer a shared crystal treaty one last time.": "You offer a last shared treaty to avoid bloodshed. The south considers the offer seriously. Your army waits in tense restraint.",
        "Deploy elite units with tech advantage.": "You deploy elite units with a tech advantage. The assault gains precision and speed. Failure would be costly and public.",
        "Lead a bold charge to end it quickly.": "You lead a bold charge to end the conflict quickly. The act inspires courage across the line. The risk to you and the army is extreme.",
        "Negotiate the final handoff with respect.": "You negotiate the final handoff with calm respect. The south responds with cautious cooperation. The crystal changes hands without immediate bloodshed.",
        "Activate containment tech to secure it safely.": "You activate the containment device to secure the crystal. The chamber stabilizes and the tech team cheers. The device drains resources and demands careful monitoring.",
        "Seize it with overwhelming force.": "You seize the crystal by force. The vault falls, but the cost is heavy. The victory is decisive and deeply scarred."
      };

      function outcomeText(choice) {
        const story = IS_ZH
          ? `你选择了“${qChoice(choice.label)}”。车队将据此调整行动，前方局势也随之改变。`
          : (choice.outcome || OUTCOME_BY_LABEL[choice.label] || `You choose ${choice.label.toLowerCase()}. The caravan adjusts to your decision. The road ahead shifts in response.`);
        const deathNote = state.lastEvent ? `${state.lastEvent} ` : "";
        return `${story} ${deathNote}${citizenMood()}`;
      }

      function renderScene() {
        if (state.phase < 2 && state.startedMarch && (state.supplies <= 0 || state.health <= 0)) {
          renderEnding({
            title: IS_ZH ? "远征崩溃（失败）" : "Expedition Collapse (Death)",
            summary: IS_ZH ? "你的远征在连续损失下崩溃。补给、健康或资金见底，任务以悲剧收场。" : "Your expedition collapses under losses. With supplies, health, or treasury depleted, the quest ends in tragedy."
          });
          return;
        }
        const scene = SCENES[index];
        if (!scene) {
          renderEnding();
          return;
        }
        if (scene.chapter.startsWith("Phase II")) {
          scene.choices.forEach((c) => {
            if (c.effects) {
              delete c.effects.supplies;
              delete c.effects.health;
              delete c.effects.people;
              delete c.effects.coins;
            }
          });
        }
        if (!state.startedMarch && (scene.chapter.startsWith("Phase I") || scene.chapter.startsWith("Phase II"))) {
          state.startedMarch = true;
          state.health = 100;
        }
        if (scene.chapter.startsWith("Phase I")) state.phase = 1;
        if (scene.chapter.startsWith("Phase II")) {
          if (state.phase !== 2) {
            state.phase = 2;
            state.lockResources = true;
            state.supplies = 0;
            state.health = 0;
            state.people = 0;
            state.coins = 0;
          }
        }
        chapterOut.textContent = IS_ZH
          ? `第 ${index + 1} / ${SCENES.length} 章 — ${qChapter(scene.chapter)}（第 ${state.timeDays} 天）`
          : `Chapter ${index + 1} of ${SCENES.length} — ${scene.chapter} (Day ${state.timeDays})`;
        sceneOut.textContent = qScene(scene.text);
        choicesWrap.innerHTML = scene.choices.map((c, i) => {
          const eff = resolveEffects(c);
          const effText = effectsText(eff);
          return `
          <button class="quest-choice" data-choice="${i}" type="button">
            <div>${qChoice(c.label)}</div>
            <span>${effText || (IS_ZH ? `选项 ${i + 1}` : `Choice ${i + 1}`)}</span>
          </button>
        `;
        }).join("");
        if (outcomeBox) outcomeBox.style.display = "none";
        if (continueBtn) continueBtn.style.display = "none";
        renderMeters();
      }

      function pickTraitsTop() {
        return Object.entries(traitScore)
          .map(([k, v]) => ({ key: k, value: v }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map((t) => TRAITS.find((x) => x.id === t.key)?.label || t.key);
      }

      function determineEnding() {
        if (guideFollowed) {
          return {
            title: IS_ZH ? "晶体协约（最佳结局）" : "Crystal Accord (Best Outcome)",
            summary: IS_ZH ? "你沿着最佳路径推进，以最小代价取得晶体，并在 Spiretz 联盟内建立长期稳固的同盟。" : "By following the perfect path, you secure the crystal with minimal loss and forge a lasting alliance across the Spiretz League."
          };
        }
        const best =
          state.diplomacy >= 75 &&
          state.tech >= 70 &&
          state.force >= 60 &&
          state.health >= 60 &&
          state.supplies >= 50 &&
          state.casualties <= 25;
        if (best) {
          return {
            title: IS_ZH ? "晶体协约（最佳结局）" : "Crystal Accord (Best Outcome)",
            summary: IS_ZH ? "你通过强力同盟并以较小损失拿下晶体，Kopahor 进入新的黄金时代。" : "You secure the crystal through a strong alliance and minimal losses. Kopahor enters a new golden era."
          };
        }
        if (state.health <= 30 || state.morale <= 25 || state.supplies <= 20) {
          return {
            title: IS_ZH ? "远征断裂" : "Broken March",
            summary: IS_ZH ? "战役在重压下崩溃。晶体仍遥不可及，国家必须先行恢复元气。" : "The campaign collapses under pressure. The crystal remains out of reach and the nation must recover."
          };
        }
        if (state.diplomacy >= 65) {
          return {
            title: IS_ZH ? "共享晶体条约" : "Shared Crystal Treaty",
            summary: IS_ZH ? "你斡旋出和平协议并共享晶体。进展稳定，但并非完全胜利。" : "You broker a peaceful agreement and share the crystal. Progress is steady, though not absolute."
          };
        }
        if (state.force >= 70 && state.tech >= 60) {
          return {
            title: IS_ZH ? "决定性胜利" : "Decisive Victory",
            summary: IS_ZH ? "你凭借武力与创新取胜，但代价沉重，恢复将是长期过程。" : "You win through force and innovation, but the cost is significant and recovery will be long."
          };
        }
        return {
          title: IS_ZH ? "僵持地平线" : "Stalemate Horizon",
          summary: IS_ZH ? "你获得了有限晶体权限，但地区局势仍然紧张且不稳定。" : "You secure limited access to the crystal, but the region remains tense and unstable."
        };
      }

      function getThemeVar(name, fallback) {
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        return val || fallback;
      }

      function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(" ");
        let line = "";
        let yy = y;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, yy);
            line = words[i] + " ";
            yy += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, yy);
        return yy + lineHeight;
      }

      function concatBytes(chunks) {
        let total = 0;
        chunks.forEach((c) => { total += c.length; });
        const out = new Uint8Array(total);
        let offset = 0;
        chunks.forEach((c) => {
          out.set(c, offset);
          offset += c.length;
        });
        return out;
      }

      function buildPdfFromJpeg(jpegBytes, width, height) {
        const enc = new TextEncoder();
        const chunks = [];
        let offset = 0;
        const xref = [];

        function pushStr(s) {
          const b = enc.encode(s);
          chunks.push(b);
          offset += b.length;
        }
        function pushBytes(b) {
          chunks.push(b);
          offset += b.length;
        }

        pushStr("%PDF-1.3\n");
        xref.push(offset); pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        xref.push(offset); pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        xref.push(offset); pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
        xref.push(offset); pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
        pushBytes(jpegBytes);
        pushStr("\nendstream\nendobj\n");
        const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
        const contentBytes = enc.encode(content);
        xref.push(offset); pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr("\nendstream\nendobj\n");

        const xrefStart = offset;
        pushStr("xref\n0 6\n0000000000 65535 f \n");
        xref.forEach((pos) => {
          const line = String(pos).padStart(10, "0") + " 00000 n \n";
          pushStr(line);
        });
        pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
        return concatBytes(chunks);
      }

      function buildCertificate(ending, traits) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 560;
        const ctx = canvas.getContext("2d");

        const bg = getThemeVar("--bg-2", "#15182a");
        const surface = getThemeVar("--surface", "rgba(255,255,255,0.06)");
        const text = getThemeVar("--text", "#e8e8e8");
        const heading = getThemeVar("--heading", "#ffffff");
        const accent = getThemeVar("--accent", "#c6a664");
        const accent2 = getThemeVar("--accent-2", "#9bc1ff");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = surface;
        ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

        ctx.fillStyle = heading;
        ctx.font = "700 26px serif";
        ctx.fillText(IS_ZH ? "Kopahor 领袖证书" : "Kopahor Leadership Certificate", 48, 70);

        ctx.fillStyle = accent2;
        ctx.font = "700 32px serif";
        ctx.fillText(ending.title, 48, 118);

        ctx.fillStyle = text;
        ctx.font = "16px sans-serif";
        let yy = wrapText(ctx, ending.summary, 48, 150, 520, 22);

        if (cachedName) {
          ctx.fillStyle = accent;
          ctx.font = "600 14px sans-serif";
          ctx.fillText(IS_ZH ? "领袖" : "Leader", 48, yy + 16);
          ctx.fillStyle = text;
          ctx.font = "16px sans-serif";
          ctx.fillText(cachedName, 48, yy + 40);
          yy += 42;
        }

        ctx.fillStyle = accent;
        ctx.font = "600 14px sans-serif";
        ctx.fillText(IS_ZH ? "领导特质" : "Leadership traits", 48, yy + 12);
        ctx.fillStyle = text;
        ctx.font = "14px sans-serif";
        ctx.fillText(traits.join(" · "), 48, yy + 36);

        const startX = 580;
        let barY = 120;
        const barW = 260;
        const barH = 12;

        ctx.fillStyle = heading;
        ctx.font = "600 13px sans-serif";
        STATS.filter((s) => s.id !== "supplies" && s.id !== "health").forEach((s) => {
          const val = state[s.id];
          ctx.fillText(`${s.label}: ${val}%`, startX, barY - 6);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(startX, barY, barW, barH);
          ctx.fillStyle = accent;
          ctx.fillRect(startX, barY, barW * (val / 100), barH);
          barY += 30;
          ctx.fillStyle = heading;
        });

        return canvas;
      }

      function downloadPng(canvas) {
        const link = document.createElement("a");
        link.download = "kopahor-quest-certificate.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      function downloadPdf(canvas) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pdfBytes = buildPdfFromJpeg(bytes, canvas.width, canvas.height);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "kopahor-quest-certificate.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }

      function renderEnding(forcedEnding) {
        const ending = forcedEnding || determineEnding();
        const traits = pickTraitsTop();
        resultsBox.innerHTML = `
          <div class="personality-card">
            <h3 style="margin:0;">${IS_ZH ? "最终结局" : "Final Ending"}: ${ending.title}</h3>
            <p class="mini-note" style="margin-top:8px;">${ending.summary}</p>
            <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
              ${traits.map((t) => `<span class="car-tag">${t}</span>`).join("")}
              <span class="car-tag">${IS_ZH ? "伤亡率" : "Casualties"}: ${state.casualties}%</span>
            </div>
          </div>
          <div class="personality-card">
            <h4 style="margin:0;">${IS_ZH ? "下载你的证书" : "Download your certificate"}</h4>
            <p class="mini-note" style="margin-top:8px;">${IS_ZH ? "可将结局与领导特质导出为 PNG 或 PDF。" : "Save a PNG or PDF of your ending and leadership traits."}</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button id="questDownloadPng" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PNG" : "Download PNG"}</span>
                <span class="acc-icon">⬇</span>
              </button>
              <button id="questDownloadPdf" class="accordion-btn" type="button" style="max-width: 220px;">
                <span>${IS_ZH ? "下载 PDF" : "Download PDF"}</span>
                <span class="acc-icon">⬇</span>
              </button>
            </div>
          </div>
        `;
        lastCanvas = buildCertificate(ending, traits);
        resultsBox.querySelector("#questDownloadPng")?.addEventListener("click", () => downloadPng(lastCanvas));
        resultsBox.querySelector("#questDownloadPdf")?.addEventListener("click", () => downloadPdf(lastCanvas));
        resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
        choicesWrap.innerHTML = "";
      }

      choicesWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".quest-choice");
        if (!btn) return;
        const scene = SCENES[index];
        const choiceIdx = parseInt(btn.dataset.choice, 10);
        const choice = scene.choices[choiceIdx];
        if (!choice) return;
        if (GUIDE_PATH[index] && choice.label !== GUIDE_PATH[index]) {
          guideFollowed = false;
        }
        const effects = resolveEffects(choice);
        applyEffects(effects);
        applyTraits(choice.traits || {});
        if (outcomeBox) {
          outcomeBox.style.display = "";
          outcomeBox.innerHTML = `<p style="margin:0;"><b>${IS_ZH ? "结果" : "Result"}:</b> ${outcomeText(choice)}</p>`;
        }
        choicesWrap.querySelectorAll("button").forEach((b) => (b.disabled = true));
        if (continueBtn) continueBtn.style.display = "";
      });

      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          index += 1;
          renderScene();
        });
      }

      if (shareApplyBtn) {
        shareApplyBtn.addEventListener("click", () => {
          const code = shareInput ? shareInput.value.trim() : "";
          if (!code) {
            shareStatus.textContent = IS_ZH ? "请先粘贴分享码。" : "Please paste a share code first.";
            return;
          }
          if (shareCode && shareApply) {
            shareCode.value = code;
            shareApply.click();
            cachedName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—") ? fullNameOut.textContent : "";
            shareStatus.textContent = cachedName ? (IS_ZH ? "代码已加载 ✅" : "Code loaded ✅") : (IS_ZH ? "代码已加载（未找到姓名）。" : "Code loaded (name not found).");
          } else {
            shareStatus.textContent = IS_ZH ? "分享系统不可用。" : "Share system not available.";
          }
        });
      }

      if (shareClearBtn) {
        shareClearBtn.addEventListener("click", () => {
          if (shareInput) shareInput.value = "";
          cachedName = "";
          shareStatus.textContent = IS_ZH ? "未加载代码。" : "No code loaded.";
        });
      }

      renderGuide();
      renderScene();
    })();

    document.querySelectorAll(".accordion .accordion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.nextElementSibling;
        const icon = btn.querySelector(".acc-icon");

        if (!panel) return;

        const isOpen = panel.style.maxHeight && panel.style.maxHeight !== "0px";

        document.querySelectorAll(".accordion-panel").forEach((p) => (p.style.maxHeight = "0px"));
        document.querySelectorAll(".acc-icon").forEach((i) => (i.textContent = "+"));

        if (!isOpen) {
          panel.style.maxHeight = panel.scrollHeight + "px";
          icon.textContent = "−";
        }
      });
    });

    document.querySelectorAll(".story-card .story-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.nextElementSibling;
        const icon = btn.querySelector(".acc-icon");
        if (!panel) return;

        const isOpen = panel.style.maxHeight && panel.style.maxHeight !== "0px";
        panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (icon) icon.textContent = isOpen ? "+" : "−";
      });
    });

    // ===== Numbers Converter =====

    const DIGITS_BASE10 = {
      0: "zu", 1: "ta", 2: "re", 3: "ki", 4: "vo",
      5: "me", 6: "dal", 7: "zai", 8: "fiu", 9: "no"
    };

    const DIGITS_BASE8 = {
      0: "zu", 1: "ta", 2: "re", 3: "ki", 4: "vo",
      5: "me", 6: "dal", 7: "zai"
    };

    const DIGITS_BASE16 = {
      0: "zu", 1: "ta", 2: "re", 3: "ki", 4: "vo",
      5: "me", 6: "dal", 7: "zai", 8: "fiu", 9: "pita",
      10: "pire", 11: "piki", 12: "pivo", 13: "pime",
      14: "pidal", 15: "pizai"
    };

    function getDigitMap(base) {
      if (base === 8) return DIGITS_BASE8;
      if (base === 16) return DIGITS_BASE16;
      return DIGITS_BASE10;
    }

    function digitWord(value, base) {
      const map = getDigitMap(base);
      return map[value];
    }

    function exponentWord(n, base) {

      const map = getDigitMap(base);
      if (map[n]) return map[n];

      let x = n;
      const digits = [];
      while (x > 0) {
        digits.push(x % base);
        x = Math.floor(x / base);
      }
      digits.reverse();
      return digits.map(d => digitWord(d, base)).join("");
    }

    function toSpiretzNumber(n, base) {
      const MAX_N = Math.pow(8, 7); // 8^7 = 2097152

      if (!Number.isFinite(n)) return "—";
      if (!Number.isInteger(n)) return "Please input an integer.";
      if (n < 0) return "Please input a non-negative integer.";
      if (n > MAX_N) return "Too large. Max allowed is 8^7 = 2097152.";
      if (n === 0) return digitWord(0, base);

      const digits = [];
      let x = n;
      while (x > 0) {
        digits.push(x % base);
        x = Math.floor(x / base);
      }
      digits.reverse();

      const parts = [];
      for (let i = 0; i < digits.length; i++) {
        const d = digits[i];
        const pos = digits.length - 1 - i;

        if (d === 0) continue;

        if (pos === 0) {
          parts.push(digitWord(d, base));
        } else {
          const place = exponentWord(pos, base) + "zu";
          parts.push(digitWord(d, base) + place);
        }
      }

      return parts.join("-");
    }

    const numInput = document.getElementById("numInput");
    const numRegion = document.getElementById("numRegion");
    const numOutput = document.getElementById("numOutput");

    function updateNumberOutput() {
      const base = parseInt(numRegion.value, 10);
      const raw = numInput.value;

      if (raw === "" || raw === null) {
        numOutput.textContent = "—";
        return;
      }

      const n = Number(raw);
      numOutput.textContent = toSpiretzNumber(n, base);
    }

    if (numInput && numRegion && numOutput) {
      numInput.addEventListener("input", updateNumberOutput);
      numRegion.addEventListener("change", updateNumberOutput);
      updateNumberOutput();
    }

    // ===== Spiretz IPA Converter =====
    (function () {
      const ipaInput = document.getElementById("ipaInput");
      const ipaOutput = document.getElementById("ipaOutput");
      const ipaStatus = document.getElementById("ipaStatus");

      if (!ipaInput || !ipaOutput || !ipaStatus) return;

      const VOWEL_MAP = {
        "yi": "iː",
        "ye": "ɛː",
        "ai": "ɑi",
        "iu": "ju",
        "au": "ɑu",
        "ua": "wɑ",
        "ei": "e",
        "ae": "æ",
        "oe": "ʊ",
        "i": "i",
        "e": "ɛ",
        "u": "u",
        "o": "o",
        "a": "ɑ",
      };

      const CONS_MAP = {
        "sh": "ʃ",
        "ch": "ʧ",
        "ng": "ŋ",
        "p": "p",
        "b": "b",
        "t": "t",
        "d": "d",
        "k": "k",
        "g": "g",
        "f": "f",
        "v": "v",
        "s": "s",
        "z": "z",
        "h": "h",
        "m": "m",
        "n": "n",
        "r": "ɹ",
        "l": "l",
        "w": "w",
        "y": "j",   // only when NOT part of yi/ye
        "x": "ks",  // [ks]
      };

      const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
      const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);
      const ALLOWED_PATTERNS = new Set(["V", "CV", "VC", "CCV", "CCCV", "CVC", "VCC", "VCCC", "CVCC", "CVCCC", "CCVC", "CCCVC", "CCVCC"]);
      const ONSET_ORDER = ["stop", "affricate_fricative", "nasal", "liquid"];
      const CODA_ORDER = ["liquid", "nasal", "affricate_fricative", "stop"];
      const CLASS_BY_RAW = {
        "p": "stop", "b": "stop", "t": "stop", "d": "stop", "k": "stop", "g": "stop",
        "ch": "affricate_fricative",
        "f": "affricate_fricative", "v": "affricate_fricative", "s": "affricate_fricative", "z": "affricate_fricative", "sh": "affricate_fricative", "h": "affricate_fricative", "x": "affricate_fricative",
        "m": "nasal", "n": "nasal", "ng": "nasal",
        "r": "liquid", "l": "liquid",
      };

      function isLetter(ch) {
        return ch >= "a" && ch <= "z";
      }

      function tokenizeSpiretz(word) {
        const s = word.toLowerCase();
        const tokens = [];

        let i = 0;
        while (i < s.length) {
          const ch = s[i];

          if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
            if (ch === "-") tokens.push({ type: "sep", ipa: "." });
            i++;
            continue;
          }

          if (!isLetter(ch)) throw new Error(`Invalid character: "${ch}"`);

          if (s.startsWith("ch", i)) {
            tokens.push({ type: "cons", ipa: "ʧ", raw: "ch" });
            i += 2;
            continue;
          }

          if (ch === "c") {
            const next2 = s.slice(i + 1, i + 3);
            const next1 = s.slice(i + 1, i + 2);
            const isSoft = next1 === "i" || next2 === "yi";
            tokens.push({ type: "cons", ipa: isSoft ? "s" : "k", raw: "c", cls: isSoft ? "affricate_fricative" : "stop" });
            i += 1;
            continue;
          }

          let matched = false;
          for (const vk of VOWEL_KEYS) {
            if (s.startsWith(vk, i)) {
              tokens.push({ type: "vowel", ipa: VOWEL_MAP[vk], raw: vk });
              i += vk.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          for (const ck of CONS_KEYS) {
            if (s.startsWith(ck, i)) {
              tokens.push({ type: "cons", ipa: CONS_MAP[ck], raw: ck });
              i += ck.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          throw new Error(`Unsupported spelling at: "${s.slice(i, i + 3)}..."`);
        }

        return tokens;
      }

      function consonantClass(token) {
        if (token.cls) return token.cls;
        const cls = CLASS_BY_RAW[token.raw];
        if (!cls) throw new Error(`Unknown consonant class: "${token.raw}"`);
        return cls;
      }

      function checkClusterOrder(cluster, order, label) {
        if (cluster.length <= 1) return;
        let prevIndex = -1;
        for (const t of cluster) {
          const idx = order.indexOf(consonantClass(t));
          if (idx === -1 || idx <= prevIndex) {
            const clusterText = cluster.map((x) => x.raw || "?").join("");
            throw new Error(`Consonant cluster violates ${label} order: "${clusterText}"`);
          }
          prevIndex = idx;
        }
      }

      function onsetHasNg(cluster) {
        return cluster.some((t) => t.raw === "ng" || t.ipa === "ŋ");
      }

      function onsetLengthFromScoped(scopedArr) {
        let count = 0;
        for (let i = scopedArr.length - 2; i >= 0; i--) {
          const t = scopedArr[i];
          if (t.type === "sep" || t.type === "vowel") break;
          if (t.type === "cons") count++;
        }
        return count;
      }

      function splitBetweenVowels(cluster, onsetLenCurrent) {
        for (let s = 0; s <= cluster.length; s++) {
          const coda = cluster.slice(0, s);
          const onsetNext = cluster.slice(s);
          if (coda.length > 3 || onsetNext.length > 3) continue;
          if (onsetHasNg(onsetNext)) continue;

          try {
            checkClusterOrder(coda, CODA_ORDER, "coda");
            checkClusterOrder(onsetNext, ONSET_ORDER, "onset");
          } catch {
            continue;
          }

          const currentPattern = (onsetLenCurrent > 0 ? "C".repeat(onsetLenCurrent) : "") + "V" + (coda.length > 0 ? "C".repeat(coda.length) : "");
          if (!ALLOWED_PATTERNS.has(currentPattern)) continue;

          const nextPattern = (onsetNext.length > 0 ? "C".repeat(onsetNext.length) : "") + "V";
          if (onsetNext.length > 0 && !ALLOWED_PATTERNS.has(nextPattern)) continue;

          return s;
        }
        return cluster.length;
      }

      function buildScopedTokens(tokens) {
        const scoped = [];

        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i];
          if (t.type === "sep") {
            scoped.push(t);
            continue;
          }

          if (t.type === "vowel") {
            scoped.push(t);

            if (i + 1 < tokens.length && tokens[i + 1].type === "vowel") {
              scoped.push({ type: "sep", ipa: "." });
              continue;
            }

            const cluster = [];
            let j = i + 1;
            while (j < tokens.length && tokens[j].type !== "sep" && tokens[j].type !== "vowel") {
              cluster.push(tokens[j]);
              j++;
            }

            if (cluster.length && j < tokens.length && tokens[j].type === "vowel") {
              const onsetLenCurrent = onsetLengthFromScoped(scoped);
              const splitAt = splitBetweenVowels(cluster, onsetLenCurrent);
              for (let k = 0; k < splitAt; k++) scoped.push(cluster[k]);
              if (splitAt < cluster.length) scoped.push({ type: "sep", ipa: "." });
              for (let k = splitAt; k < cluster.length; k++) scoped.push(cluster[k]);
            } else {
              for (const c of cluster) scoped.push(c);
            }

            i = j - 1;
            continue;
          }

          scoped.push(t);
        }
        return scoped;
      }

      function validateScoped(scoped) {
        const vowelPositions = [];
        for (let i = 0; i < scoped.length; i++) {
          if (scoped[i].type === "vowel") vowelPositions.push(i);
        }
        if (!vowelPositions.length) throw new Error("No vowel found.");

        for (const vIdx of vowelPositions) {
          const onset = [];
          for (let j = vIdx - 1; j >= 0; j--) {
            if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
            if (scoped[j].type === "cons") onset.push(scoped[j]);
          }
          onset.reverse();

          const coda = [];
          for (let j = vIdx + 1; j < scoped.length; j++) {
            if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
            if (scoped[j].type === "cons") coda.push(scoped[j]);
          }

          const pattern = (onset.length ? "C".repeat(onset.length) : "") + "V" + (coda.length ? "C".repeat(coda.length) : "");
          if (!ALLOWED_PATTERNS.has(pattern)) throw new Error(`Invalid syllable pattern: ${pattern}`);
          if (onsetHasNg(onset)) throw new Error("ng cannot appear in onset.");

          checkClusterOrder(onset, ONSET_ORDER, "onset");
          checkClusterOrder(coda, CODA_ORDER, "coda");
        }
      }

      function applyPenultimateStressFromScoped(scoped) {
        const syllableNuclei = [];
        for (let i = 0; i < scoped.length; i++) {
          if (scoped[i].type !== "vowel") continue;
          if (!syllableNuclei.length) {
            syllableNuclei.push(i);
            continue;
          }

          let separated = false;
          for (let j = syllableNuclei[syllableNuclei.length - 1] + 1; j < i; j++) {
            if (scoped[j].type === "sep") {
              separated = true;
              break;
            }
          }
          if (separated) syllableNuclei.push(i);
        }

        if (!syllableNuclei.length) throw new Error("No vowel found (cannot assign stress).");

        const stressIndex = syllableNuclei.length >= 2 ? syllableNuclei[syllableNuclei.length - 2] : syllableNuclei[0];

        const out = [];
        for (let idx = 0; idx < scoped.length; idx++) {
          const t = scoped[idx];
          if (t.type === "sep") {
            continue;
          } else if (idx === stressIndex) {
            out.push("ˈ" + t.ipa);
          } else {
            out.push(t.ipa);
          }
        }
        return out.join("");
      }

      function convertToIPA(input) {
        const trimmed = input.trim();
        if (!trimmed) return { ipa: "—", status: "Waiting for input…" };

        if (trimmed.length > 80) {
          return { ipa: "—", status: "Error: input too long (max 80 characters)." };
        }

        try {
          const tokens = tokenizeSpiretz(trimmed);
          const scoped = buildScopedTokens(tokens);
          validateScoped(scoped);
          const ipa = applyPenultimateStressFromScoped(scoped);
          return { ipa: `[${ipa}]`, status: "OK ✅" };
        } catch (err) {
          const msg = err && err.message ? err.message : "Unknown conversion error.";
          if (msg.includes("Consonant cluster violates")) {
            return {
              ipa: "—",
              status: `Error: ${msg} Hint: onset = Stops→Affricates/Fricatives→Nasals→Liquids; coda is the reverse.`,
            };
          }
          return { ipa: "—", status: `Error: ${msg}` };
        }
      }

      function updateIPA() {
        const res = convertToIPA(ipaInput.value);
        ipaOutput.textContent = res.ipa;
        ipaStatus.textContent = res.status;
      }

      ipaInput.addEventListener("input", updateIPA);
      updateIPA();
    })();

    // ===== Spiretz Syllable Splitter =====
    (function () {
      const splitInput = document.getElementById("splitInput");
      const splitOutput = document.getElementById("splitOutput");
      const splitStatus = document.getElementById("splitStatus");

      if (!splitInput || !splitOutput || !splitStatus) return;

      const VOWEL_KEYS = ["yi", "ye", "ai", "iu", "au", "ua", "ei", "ae", "oe", "i", "e", "u", "o", "a"];
      const CONS_KEYS = ["sh", "ch", "ng", "p", "b", "t", "d", "k", "g", "f", "v", "s", "z", "h", "m", "n", "r", "l", "w", "y", "x"];

      const ALLOWED_PATTERNS = new Set(["V", "CV", "VC", "CCV", "CCCV", "CVC", "VCC", "VCCC", "CVCC", "CVCCC", "CCVC", "CCCVC", "CCVCC"]);
      const ONSET_ORDER = ["stop", "affricate_fricative", "nasal", "liquid"];
      const CODA_ORDER = ["liquid", "nasal", "affricate_fricative", "stop"];

      const CLASS_BY_RAW = {
        "p": "stop", "b": "stop", "t": "stop", "d": "stop", "k": "stop", "g": "stop",
        "ch": "affricate_fricative",
        "f": "affricate_fricative", "v": "affricate_fricative", "s": "affricate_fricative", "z": "affricate_fricative", "sh": "affricate_fricative", "h": "affricate_fricative", "x": "affricate_fricative",
        "m": "nasal", "n": "nasal", "ng": "nasal",
        "r": "liquid", "l": "liquid",
      };

      function isLetter(ch) {
        return ch >= "a" && ch <= "z";
      }

      function tokenizeSpiretz(word) {
        const s = word.toLowerCase();
        const tokens = [];
        let i = 0;

        while (i < s.length) {
          const ch = s[i];

          if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
            if (ch === "-") tokens.push({ type: "sep", raw: "." });
            i++;
            continue;
          }

          if (!isLetter(ch)) throw new Error(`Invalid character: "${ch}"`);

          if (s.startsWith("ch", i) || s.startsWith("sh", i) || s.startsWith("ng", i)) {
            const digraph = s.slice(i, i + 2);
            tokens.push({ type: "cons", raw: digraph });
            i += 2;
            continue;
          }

          if (ch === "c") {
            const next2 = s.slice(i + 1, i + 3);
            const next1 = s.slice(i + 1, i + 2);
            const cls = next1 === "i" || next2 === "yi" ? "affricate_fricative" : "stop";
            tokens.push({ type: "cons", raw: "c", cls: cls });
            i += 1;
            continue;
          }

          let matched = false;
          for (const vk of VOWEL_KEYS) {
            if (s.startsWith(vk, i)) {
              tokens.push({ type: "vowel", raw: vk });
              i += vk.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          for (const ck of CONS_KEYS) {
            if (s.startsWith(ck, i)) {
              tokens.push({ type: "cons", raw: ck });
              i += ck.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          throw new Error(`Unsupported spelling at: "${s.slice(i, i + 3)}..."`);
        }

        return tokens;
      }

      function consonantClass(token) {
        if (token.cls) return token.cls;
        const cls = CLASS_BY_RAW[token.raw];
        if (!cls) throw new Error(`Unknown consonant class: "${token.raw}"`);
        return cls;
      }

      function checkClusterOrder(cluster, order) {
        if (cluster.length <= 1) return;
        let prevIndex = -1;
        for (const t of cluster) {
          const idx = order.indexOf(consonantClass(t));
          if (idx === -1 || idx <= prevIndex) throw new Error("Consonant cluster violates order rule.");
          prevIndex = idx;
        }
      }

      function onsetHasNg(cluster) {
        return cluster.some((t) => t.raw === "ng" || t.ipa === "ŋ");
      }

      function onsetLengthFromScoped(scopedArr) {
        let count = 0;
        for (let i = scopedArr.length - 2; i >= 0; i--) {
          const t = scopedArr[i];
          if (t.type === "sep" || t.type === "vowel") break;
          if (t.type === "cons") count++;
        }
        return count;
      }

      function splitBetweenVowels(cluster, onsetLenCurrent) {
        for (let s = 0; s <= cluster.length; s++) {
          const coda = cluster.slice(0, s);
          const onsetNext = cluster.slice(s);

          if (coda.length > 3 || onsetNext.length > 3) continue;
          if (onsetHasNg(onsetNext)) continue;

          try {
            checkClusterOrder(coda, CODA_ORDER);
            checkClusterOrder(onsetNext, ONSET_ORDER);
          } catch {
            continue;
          }

          const currentPattern = (onsetLenCurrent > 0 ? "C".repeat(onsetLenCurrent) : "") + "V" + (coda.length > 0 ? "C".repeat(coda.length) : "");
          if (!ALLOWED_PATTERNS.has(currentPattern)) continue;

          const nextPattern = (onsetNext.length > 0 ? "C".repeat(onsetNext.length) : "") + "V";
          if (onsetNext.length > 0 && !ALLOWED_PATTERNS.has(nextPattern)) continue;

          return s;
        }
        return cluster.length;
      }

      function buildScopedTokens(tokens) {
        const scoped = [];

        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i];
          if (t.type === "sep") {
            scoped.push(t);
            continue;
          }

          if (t.type === "vowel") {
            scoped.push(t);

            // Adjacent vowel tokens are separate syllables (hiatus).
            // True diphthongs are already tokenized as one vowel token.
            if (i + 1 < tokens.length && tokens[i + 1].type === "vowel") {
              scoped.push({ type: "sep", raw: "." });
              continue;
            }

            const cluster = [];
            let j = i + 1;
            while (j < tokens.length && tokens[j].type !== "sep" && tokens[j].type !== "vowel") {
              cluster.push(tokens[j]);
              j++;
            }

            if (cluster.length && j < tokens.length && tokens[j].type === "vowel") {
              const onsetLenCurrent = onsetLengthFromScoped(scoped);
              const splitAt = splitBetweenVowels(cluster, onsetLenCurrent);
              for (let k = 0; k < splitAt; k++) scoped.push(cluster[k]);
              if (splitAt < cluster.length) scoped.push({ type: "sep", raw: "." });
              for (let k = splitAt; k < cluster.length; k++) scoped.push(cluster[k]);
            } else {
              for (const c of cluster) scoped.push(c);
            }

            i = j - 1;
            continue;
          }

          scoped.push(t);
        }

        return scoped;
      }

      function validateScoped(scoped) {
        const vowelPositions = [];
        for (let i = 0; i < scoped.length; i++) {
          if (scoped[i].type === "vowel") vowelPositions.push(i);
        }
        if (!vowelPositions.length) throw new Error("No vowel found.");

        for (const vIdx of vowelPositions) {
          const onset = [];
          for (let j = vIdx - 1; j >= 0; j--) {
            if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
            if (scoped[j].type === "cons") onset.push(scoped[j]);
          }
          onset.reverse();

          const coda = [];
          for (let j = vIdx + 1; j < scoped.length; j++) {
            if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
            if (scoped[j].type === "cons") coda.push(scoped[j]);
          }

          const pattern = (onset.length ? "C".repeat(onset.length) : "") + "V" + (coda.length ? "C".repeat(coda.length) : "");
          if (!ALLOWED_PATTERNS.has(pattern)) throw new Error(`Invalid syllable pattern: ${pattern}`);
          if (onsetHasNg(onset)) throw new Error("ng cannot appear in onset.");

          checkClusterOrder(onset, ONSET_ORDER);
          checkClusterOrder(coda, CODA_ORDER);
        }
      }

      function splitWord(input) {
        const trimmed = input.trim();
        if (!trimmed) return { out: "—", status: "Waiting for input…" };
        if (trimmed.length > 80) return { out: "—", status: "Error: input too long (max 80 characters)." };

        try {
          const tokens = tokenizeSpiretz(trimmed);
          const scoped = buildScopedTokens(tokens);
          validateScoped(scoped);

          const out = scoped
            .map((t) => (t.type === "sep" ? "." : t.raw))
            .join("")
            .replace(/\.{2,}/g, ".")
            .replace(/^\./, "")
            .replace(/\.$/, "");

          return { out: out || "—", status: out ? "OK ✅" : "Error: no valid syllable split." };
        } catch (err) {
          return { out: "—", status: `Error: ${err.message}` };
        }
      }

      function updateSplit() {
        const res = splitWord(splitInput.value);
        splitOutput.textContent = res.out;
        splitStatus.textContent = res.status;
      }

      splitInput.addEventListener("input", updateSplit);
      updateSplit();
    })();

    // ===== Create: Get Your Spiretz Archive (Name Generator + IPA + Pronoun) =====
  (function () {
    const firstSyl = document.getElementById("firstSyl");
    const lastSyl = document.getElementById("lastSyl");
    const middleMode = document.getElementById("middleMode");
    const middleSylWrap = document.getElementById("middleSylWrap");
    const middleSyl = document.getElementById("middleSyl");
    const customMiddleWrap = document.getElementById("customMiddleWrap");
    const customMiddle = document.getElementById("customMiddle");

    const genderSelect = document.getElementById("genderSelect");
    const pronounOut = document.getElementById("pronounOut");
    const nameStyle = document.getElementById("nameStyle");

    const regenBtn = document.getElementById("regenNameBtn");
    const copyBtn = document.getElementById("copyNameBtn");

    const fullNameOut = document.getElementById("fullNameOut");
    const nameIpaOut = document.getElementById("nameIpaOut");
    const nameStatusOut = document.getElementById("nameStatusOut");

    if (!firstSyl || !lastSyl || !middleMode || !middleSyl || !genderSelect) return;

    const VOWEL_MAP = {
      "yi": "iː",
      "ye": "ɛː",
      "ai": "ɑi",
      "iu": "ju",
      "au": "ɑu",
      "ua": "wɑ",
      "ei": "e",
      "ae": "æ",
      "oe": "ʊ",
      "i": "i",
      "e": "ɛ",
      "u": "u",
      "o": "o",
      "a": "ɑ",
    };

    const CONS_MAP = {
      "sh": "ʃ",
      "ch": "ʧ",
      "ng": "ŋ",
      "p": "p",
      "b": "b",
      "t": "t",
      "d": "d",
      "k": "k",
      "g": "g",
      "f": "f",
      "v": "v",
      "s": "s",
      "z": "z",
      "h": "h",
      "m": "m",
      "n": "n",
      "r": "ɹ",
      "l": "l",
      "w": "w",
      "y": "j",
      "x": "ks",
    };

    const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
    const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);

    function isLetter(ch) {
      return ch >= "a" && ch <= "z";
    }

    function tokenizeSpiretz(word) {
      const s = word.toLowerCase();
      const tokens = [];
      let i = 0;

      while (i < s.length) {
        const ch = s[i];

        if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
          if (ch === "-") tokens.push({ type: "sep", ipa: "." });
          i++;
          continue;
        }

        if (!isLetter(ch)) {
          throw new Error(`Invalid character: "${ch}"`);
        }

        if (s.startsWith("ch", i)) {
          tokens.push({ type: "cons", ipa: "ʧ", raw: "ch" });
          i += 2;
          continue;
        }

        if (ch === "c") {
          const next2 = s.slice(i + 1, i + 3);
          const next1 = s.slice(i + 1, i + 2);
          if (next1 === "i" || next2 === "yi") tokens.push({ type: "cons", ipa: "s" });
          else tokens.push({ type: "cons", ipa: "k" });
          i += 1;
          continue;
        }

        let matched = false;
        for (const vk of VOWEL_KEYS) {
          if (s.startsWith(vk, i)) {
            tokens.push({ type: "vowel", ipa: VOWEL_MAP[vk], raw: vk });
            i += vk.length;
            matched = true;
            break;
          }
        }
        if (matched) continue;

        for (const ck of CONS_KEYS) {
          if (s.startsWith(ck, i)) {
            tokens.push({ type: "cons", ipa: CONS_MAP[ck], raw: ck });
            i += ck.length;
            matched = true;
            break;
          }
        }
        if (matched) continue;

        throw new Error(`Unsupported spelling at: "${s.slice(i, i + 3)}..."`);
      }

      return tokens;
    }

    function validateSyllableStructure(tokens) {
      const allowed = new Set(["V", "CV", "VC", "CCV", "CVC", "VCC", "CVCC", "CCVC", "CCVCC"]);

      const ONSET_ORDER = ["stop", "affricate_fricative", "nasal", "liquid"];
      const CODA_ORDER = ["liquid", "nasal", "affricate_fricative", "stop"];

      const CLASS_BY_RAW = {

        "p": "stop",
        "b": "stop",
        "t": "stop",
        "d": "stop",
        "k": "stop",
        "g": "stop",

        "ch": "affricate_fricative",

        "f": "affricate_fricative",
        "v": "affricate_fricative",
        "s": "affricate_fricative",
        "z": "affricate_fricative",
        "sh": "affricate_fricative",
        "h": "affricate_fricative",

        "m": "nasal",
        "n": "nasal",
        "ng": "nasal",

        "r": "liquid",
        "l": "liquid",
      };

      const CLASS_BY_IPA = {
        "p": "stop",
        "b": "stop",
        "t": "stop",
        "d": "stop",
        "k": "stop",
        "g": "stop",
        "ʧ": "affricate_fricative",
        "f": "affricate_fricative",
        "v": "affricate_fricative",
        "s": "affricate_fricative",
        "z": "affricate_fricative",
        "ʃ": "affricate_fricative",
        "h": "affricate_fricative",
        "m": "nasal",
        "n": "nasal",
        "ŋ": "nasal",
        "ɹ": "liquid",
        "l": "liquid",
      };

      function consClass(t) {
        if (t.raw && CLASS_BY_RAW[t.raw]) return CLASS_BY_RAW[t.raw];
        if (t.ipa && CLASS_BY_IPA[t.ipa]) return CLASS_BY_IPA[t.ipa];
        throw new Error("Unknown consonant class.");
      }

      function checkClusterOrder(cluster, order) {
        if (cluster.length <= 1) return;
        let prevIndex = -1;
        for (const t of cluster) {
          const cls = consClass(t);
          const idx = order.indexOf(cls);
          if (idx === -1) throw new Error(`Consonant class not allowed: ${cls}`);
          if (idx <= prevIndex) {
            throw new Error("Consonant cluster violates order rule.");
          }
          prevIndex = idx;
        }
      }

      function onsetHasNg(cluster) {
        return cluster.some((t) => t.raw === "ng" || t.ipa === "ŋ");
      }

      function onsetLengthFromScoped(scopedArr) {
        let count = 0;
        for (let i = scopedArr.length - 2; i >= 0; i--) {
          const t = scopedArr[i];
          if (t.type === "sep" || t.type === "vowel") break;
          if (t.type === "cons") count++;
        }
        return count;
      }

      function splitBetweenVowels(cluster, onsetLenCurrent) {
        for (let s = 0; s <= cluster.length; s++) {
          const coda = cluster.slice(0, s);
          const onsetNext = cluster.slice(s);

          if (coda.length > 3 || onsetNext.length > 3) continue;
          if (onsetHasNg(onsetNext)) continue;

          try {
            checkClusterOrder(coda, CODA_ORDER);
            checkClusterOrder(onsetNext, ONSET_ORDER);
          } catch {
            continue;
          }

          const pattern =
            (onsetLenCurrent > 0 ? "C".repeat(onsetLenCurrent) : "") +
            "V" +
            (coda.length > 0 ? "C".repeat(coda.length) : "");

          if (!allowed.has(pattern)) continue;

          const nextPattern =
            (onsetNext.length > 0 ? "C".repeat(onsetNext.length) : "") + "V";
          if (onsetNext.length > 0 && !allowed.has(nextPattern)) continue;

          return s; // valid split found
        }
        return cluster.length; // fallback: all to coda
      }

      const scoped = [];
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t.type === "sep") {
          scoped.push(t);
          continue;
        }

        if (t.type === "vowel") {
          scoped.push(t);

          const cluster = [];
          let j = i + 1;
          while (j < tokens.length && tokens[j].type !== "sep" && tokens[j].type !== "vowel") {
            cluster.push(tokens[j]);
            j++;
          }

          if (cluster.length && j < tokens.length && tokens[j].type === "vowel") {
            const onsetLenCurrent = onsetLengthFromScoped(scoped);
            const splitAt = splitBetweenVowels(cluster, onsetLenCurrent);

            for (let k = 0; k < splitAt; k++) scoped.push(cluster[k]);
            if (splitAt < cluster.length) scoped.push({ type: "sep", ipa: "." });
            for (let k = splitAt; k < cluster.length; k++) scoped.push(cluster[k]);
          } else {
            for (let k = 0; k < cluster.length; k++) scoped.push(cluster[k]);
          }

          i = j - 1;
          continue;
        }

        scoped.push(t);
      }

      const vowelPositions = [];
      for (let i = 0; i < scoped.length; i++) {
        if (scoped[i].type === "vowel") vowelPositions.push(i);
      }
      if (vowelPositions.length === 0) throw new Error("No vowel found.");

      for (let vi = 0; vi < vowelPositions.length; vi++) {
        const vIdx = vowelPositions[vi];

        const onsetTokens = [];
        for (let j = vIdx - 1; j >= 0; j--) {
          if (scoped[j].type === "sep") break;
          if (scoped[j].type === "vowel") break;
          if (scoped[j].type === "cons") onsetTokens.push(scoped[j]);
        }
        onsetTokens.reverse();

        const codaTokens = [];
        for (let j = vIdx + 1; j < scoped.length; j++) {
          if (scoped[j].type === "sep") break;
          if (scoped[j].type === "vowel") break;
          if (scoped[j].type === "cons") codaTokens.push(scoped[j]);
        }

        let pattern = "";
        if (onsetTokens.length === 0) pattern += "";
        else pattern += "C".repeat(onsetTokens.length);
        pattern += "V";
        if (codaTokens.length > 0) pattern += "C".repeat(codaTokens.length);

        if (!allowed.has(pattern)) {
          throw new Error(`Invalid syllable pattern: ${pattern}`);
        }
        if (onsetHasNg(onsetTokens)) {
          throw new Error("ng cannot appear in onset.");
        }

        checkClusterOrder(onsetTokens, ONSET_ORDER);
        checkClusterOrder(codaTokens, CODA_ORDER);
      }
    }

    function applyPenultimateStress(tokens) {
      const vowelIndexes = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === "vowel") vowelIndexes.push(i);
      }
      if (vowelIndexes.length === 0) throw new Error("No vowel found (cannot assign stress).");

      const stressIndex = vowelIndexes.length >= 2 ? vowelIndexes[vowelIndexes.length - 2] : vowelIndexes[0];

      const out = [];
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (i === stressIndex) out.push("ˈ" + t.ipa);
        else out.push(t.ipa);
      }
      return out.join("");
    }

    function toIPA(text) {
      const tokens = tokenizeSpiretz(text);
      validateSyllableStructure(tokens);
      const ipa = applyPenultimateStress(tokens);
      return `[${ipa}]`;
    }

    const VOWEL_SPELLINGS = ["i", "ei", "e", "ae", "u", "oe", "o", "a", "ai", "iu", "au", "ua"];

    const CONSONANT_CLASSES = {
      stop: ["p", "b", "t", "d", "k", "g"],
      affricate_fricative: ["ch", "f", "v", "s", "z", "sh", "h"],
      nasal: ["m", "n", "ng"],
      liquid: ["r", "l"],
    };

    const ONSET_ORDER = ["stop", "affricate_fricative", "nasal", "liquid"];
    const CODA_ORDER = ["liquid", "nasal", "affricate_fricative", "stop"];

    const TEMPLATES = ["V", "CV", "VC", "CCV", "CVC", "VCC", "CVCC", "CCVC", "CCVCC"];

    const STYLE_PRESETS = {
      none: {
        vowels: VOWEL_SPELLINGS,
        templates: TEMPLATES,
        classWeights: { stop: 1, affricate: 0.6, fricative: 1, nasal: 1, liquid: 1 },
        templateWeights: { V: 0.5, CV: 2.5, VC: 1.1, CCV: 0.4, CVC: 2, VCC: 0.25, CVCC: 0.45, CCVC: 0.4, CCVCC: 0.15 },
      },
      international: {
        vowels: ["a", "e", "i", "o", "u", "ae", "ei", "oe"],
        templates: ["V", "CV", "CVC", "VC", "CCV", "VCC", "CVCC"],
        classWeights: { stop: 1, affricate: 0.2, fricative: 0.8, nasal: 1.2, liquid: 1.3 },
        templateWeights: { V: 0.8, CV: 3, VC: 1.1, CCV: 0.3, CVC: 2.2, VCC: 0.22, CVCC: 0.35 },
      },
      north: {
        vowels: ["a", "o", "u", "ae", "au"],
        templates: ["CV", "CCV", "CVC", "VCC", "CVCC", "CCVC"],
        classWeights: { stop: 1.6, affricate: 0.7, fricative: 1.2, nasal: 0.8, liquid: 0.7 },
        templateWeights: { CV: 1.6, CCV: 0.45, CVC: 2, VCC: 0.3, CVCC: 0.5, CCVC: 0.45 },
      },
      east: {
        vowels: ["i", "e", "ei", "ae", "iu", "oe", "a"],
        templates: ["V", "CV", "CVC", "CCV", "VCC", "CVCC"],
        classWeights: { stop: 0.7, affricate: 0.4, fricative: 0.9, nasal: 1.3, liquid: 1.4 },
        templateWeights: { V: 1.1, CV: 3, CVC: 1.4, CCV: 0.3, VCC: 0.22, CVCC: 0.35 },
      },
      west: {
        vowels: ["o", "u", "oe", "au", "a", "ei"],
        templates: ["CV", "CCV", "CVC", "VCC", "CVCC", "VC"],
        classWeights: { stop: 1.1, affricate: 0.5, fricative: 1.4, nasal: 0.9, liquid: 1.1 },
        templateWeights: { CV: 2, CCV: 0.45, CVC: 2, VCC: 0.3, CVCC: 0.45, VC: 0.9 },
      },
      south: {
        vowels: ["a", "ae", "ai", "au", "ua", "o"],
        templates: ["V", "CV", "CCV", "CVC", "VCC", "CVCC", "CCVC"],
        classWeights: { stop: 0.9, affricate: 0.6, fricative: 0.8, nasal: 1, liquid: 1.5 },
        templateWeights: { V: 1, CV: 2.2, CCV: 0.4, CVC: 1.6, VCC: 0.28, CVCC: 0.45, CCVC: 0.4 },
      },
    };

    function rand(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function weightedPick(items, weights) {
      const total = items.reduce((sum, item) => sum + (weights[item] || 0), 0);
      let r = Math.random() * total;
      for (const item of items) {
        r -= (weights[item] || 0);
        if (r <= 0) return item;
      }
      return items[items.length - 1];
    }

    function normalizeClassWeights(classWeights) {
      return {
        stop: classWeights.stop || 0,
        affricate_fricative: (classWeights.affricate || 0) + (classWeights.fricative || 0),
        nasal: classWeights.nasal || 0,
        liquid: classWeights.liquid || 0,
      };
    }

    function pickOrderedClasses(order, count, classWeights) {
      const picked = [];
      let lastIndex = -1;
      for (let i = 0; i < count; i++) {
        const min = lastIndex + 1;
        const max = order.length - (count - i);
        const slice = order.slice(min, max + 1);
        const cls = weightedPick(slice, classWeights);
        const idx = order.indexOf(cls);
        picked.push(cls);
        lastIndex = idx;
      }
      return picked;
    }

    function buildCluster(order, count, classWeights, isOnset) {
      if (count === 0) return "";
      const classes = pickOrderedClasses(order, count, classWeights);
      return classes
        .map((cls) => {
          if (isOnset && cls === "nasal") return rand(["m", "n"]);
          return rand(CONSONANT_CLASSES[cls]);
        })
        .join("");
    }

    function buildSyllable(styleKey) {
      const preset = STYLE_PRESETS[styleKey] || STYLE_PRESETS.none;
      const vowel = rand(preset.vowels);
      const template = weightedPick(preset.templates, preset.templateWeights);
      const mergedClassWeights = normalizeClassWeights(preset.classWeights);

      let onsetCount = 0;
      let codaCount = 0;

      if (template === "V") {
        onsetCount = 0; codaCount = 0;
      } else if (template === "CV") {
        onsetCount = 1; codaCount = 0;
      } else if (template === "VC") {
        onsetCount = 0; codaCount = 1;
      } else if (template === "CCV") {
        onsetCount = 2; codaCount = 0;
      } else if (template === "CCCV") {
        onsetCount = 3; codaCount = 0;
      } else if (template === "CVC") {
        onsetCount = 1; codaCount = 1;
      } else if (template === "VCC") {
        onsetCount = 0; codaCount = 2;
      } else if (template === "VCCC") {
        onsetCount = 0; codaCount = 3;
      } else if (template === "CVCC") {
        onsetCount = 1; codaCount = 2;
      } else if (template === "CVCCC") {
        onsetCount = 1; codaCount = 3;
      } else if (template === "CCVC") {
        onsetCount = 2; codaCount = 1;
      } else if (template === "CCCVC") {
        onsetCount = 3; codaCount = 1;
      } else if (template === "CCVCC") {
        onsetCount = 2; codaCount = 2;
      }

      const onset = buildCluster(ONSET_ORDER, onsetCount, mergedClassWeights, true);
      const coda = buildCluster(CODA_ORDER, codaCount, mergedClassWeights, false);
      return onset + vowel + coda;
    }

    function generateNamePart(syllableCount, styleKey) {
      let out = "";
      for (let i = 0; i < syllableCount; i++) out += buildSyllable(styleKey);

      for (let tries = 0; tries < 20; tries++) {
        try {
          const tokens = tokenizeSpiretz(out);
          validateSyllableStructure(tokens);
          return out;
        } catch {
          out = "";
          for (let i = 0; i < syllableCount; i++) out += buildSyllable(styleKey);
        }
      }
      return out;
    }

    function pronounFromGender(key) {
      if (key === "spirete" || key === "male" || key === "female" || key === "nb") return "spirete";
      return "tatie";
    }

    function updatePronoun() {
      pronounOut.textContent = pronounFromGender(genderSelect.value);
    }

    const firstMode = document.getElementById("firstMode");
const lastMode = document.getElementById("lastMode");

const firstSylWrap = document.getElementById("firstSylWrap");
const lastSylWrap = document.getElementById("lastSylWrap");

const customFirstWrap = document.getElementById("customFirstWrap");
const customLastWrap = document.getElementById("customLastWrap");

const customFirst = document.getElementById("customFirst");
const customLast = document.getElementById("customLast");

    function setFirstUI() {
  if (firstMode.value === "custom") {
    firstSylWrap.style.display = "none";
    customFirstWrap.style.display = "";
  } else {
    firstSylWrap.style.display = "";
    customFirstWrap.style.display = "none";
  }
}

function setLastUI() {
  if (lastMode.value === "custom") {
    lastSylWrap.style.display = "none";
    customLastWrap.style.display = "";
  } else {
    lastSylWrap.style.display = "";
    customLastWrap.style.display = "none";
  }
}

    function setMiddleUI() {
      if (middleMode.value === "random") {
        middleSylWrap.style.display = "";
        customMiddleWrap.style.display = "none";
      } else if (middleMode.value === "custom") {
        middleSylWrap.style.display = "none";
        customMiddleWrap.style.display = "";
      } else {
        middleSylWrap.style.display = "none";
        customMiddleWrap.style.display = "none";
      }
    }

    function buildFullName() {

  let first = "";
  if (firstMode.value === "custom") {
    first = (customFirst.value || "").trim();
    if (!first) throw new Error("Custom first name is empty.");

    const tokens = tokenizeSpiretz(first);
    validateSyllableStructure(tokens);
  } else {
    const fCount = parseInt(firstSyl.value, 10);
    first = generateNamePart(fCount, nameStyle ? nameStyle.value : "none");
  }

  let last = "";
  if (lastMode.value === "custom") {
    last = (customLast.value || "").trim();
    if (!last) throw new Error("Custom last name is empty.");

    const tokens = tokenizeSpiretz(last);
    validateSyllableStructure(tokens);
  } else {
    const lCount = parseInt(lastSyl.value, 10);
    last = generateNamePart(lCount, nameStyle ? nameStyle.value : "none");
  }

  let middle = "";
  if (middleMode.value === "random") {
    const mCount = parseInt(middleSyl.value, 10);
    middle = generateNamePart(mCount, nameStyle ? nameStyle.value : "none");
  } else if (middleMode.value === "custom") {
    middle = (customMiddle.value || "").trim();
    if (!middle) throw new Error("Custom middle name is empty.");

    const tokens = tokenizeSpiretz(middle);
    validateSyllableStructure(tokens);
  }

  const parts = [first];
  if (middleMode.value !== "none") parts.push(middle);
  parts.push(last);

  return parts;
}

    function clearNameOutputs() {
      fullNameOut.textContent = "—";
      nameIpaOut.textContent = "—";
      nameStatusOut.textContent = IS_ZH ? "等待生成。" : "Waiting for generation.";
    }

    function refreshAll(regenerate) {
      try {
        updatePronoun();
        setFirstUI();
        setLastUI();
        setMiddleUI();

        if (!regenerate) {
          clearNameOutputs();
          return;
        }

        const parts = buildFullName();
        const fullName = parts.join(" ");
        fullNameOut.textContent = fullName;

        const ipaParts = parts.map(p => `${p} ${toIPA(p)}`);
        nameIpaOut.textContent = ipaParts.join("   |   ");

        nameStatusOut.textContent = "OK ✅";
      } catch (e) {
        fullNameOut.textContent = "—";
        nameIpaOut.textContent = "—";
        nameStatusOut.textContent = `Error: ${e.message}`;
      }

    }

    async function copyResult() {
      if (fullNameOut.textContent === "—") {
        nameStatusOut.textContent = IS_ZH ? "请先生成名字。" : "Generate a name first.";
        return;
      }
      const text = `${fullNameOut.textContent}\nPronoun: ${pronounOut.textContent}\nIPA: ${nameIpaOut.textContent}`;
      try {
        await navigator.clipboard.writeText(text);
        nameStatusOut.textContent = "Copied ✅";
      } catch {
        nameStatusOut.textContent = "Copy failed (browser blocked clipboard).";
      }
    }

    middleMode.addEventListener("change", () => refreshAll(false));
    firstMode.addEventListener("change", () => refreshAll(false));
lastMode.addEventListener("change", () => refreshAll(false));

    firstSyl.addEventListener("change", () => refreshAll(false));
    lastSyl.addEventListener("change", () => refreshAll(false));
    middleSyl.addEventListener("change", () => refreshAll(false));
    genderSelect.addEventListener("change", () => refreshAll(false));
    if (nameStyle) nameStyle.addEventListener("change", () => refreshAll(false));

    if (customMiddle) customMiddle.addEventListener("input", () => refreshAll(false));
if (customFirst) customFirst.addEventListener("input", () => refreshAll(false));
if (customLast) customLast.addEventListener("input", () => refreshAll(false));

    regenBtn.addEventListener("click", () => refreshAll(true));
    copyBtn.addEventListener("click", copyResult);

    setFirstUI();
setLastUI();
setMiddleUI();
refreshAll(false);
  })();

      // ===== Verb Conjugation Lab =====
  (function () {
    const verbSelect = document.getElementById("verbSelect");
    const verbMeaning = document.getElementById("verbMeaning");

    const subjAgree = document.getElementById("subjAgree");
    const objMarker = document.getElementById("objMarker");
    const humanObj = document.getElementById("humanObj");
    const tenseSel = document.getElementById("tenseSel");
    const aspectSel = document.getElementById("aspectSel");
    const moodSel = document.getElementById("moodSel");
    const dynSel = document.getElementById("dynSel");

    const previewOut = document.getElementById("previewOut");
    const ipaOutVerb = document.getElementById("ipaOutVerb");
    const glossOut = document.getElementById("glossOut");
    const statusOut = document.getElementById("verbLabStatus");

    if (!verbSelect || !subjAgree || !previewOut) return;

    const VERBS = [
      ["ampi","believe"],
      ["ampiria","hope"],
      ["eya","be"],
      ["aye","have"],
      ["beya","need, want"],
      ["dara","dance"],
      ["daresu","understand"],
      ["daro","suppose; assume"],
      ["davi","lose"],
      ["daze","close"],
      ["dezu","explain"],
      ["doye","cause; make"],
      ["dravo","arrive"],
      ["fane","end; finish"],
      ["fireno","request"],
      ["folo","forget"],
      ["fure","rest"],
      ["fureyi","continue"],
      ["gavu","eat"],
      ["golu","drink"],
      ["heta","speak; say"],
      ["heti","listen"],
      ["hodape","open"],
      ["lion","like"],
      ["kame","consider"],
      ["kampi","keep"],
      ["kamu","think"],
      ["korati","challenge"],
      ["krei","do; make"],
      ["krichei","decide"],
      ["lanko","belong to"],
      ["lavi","love"],
      ["laza","play"],
      ["liguria","shine; illuminate"],
      ["lika","read"],
      ["lume","research; study"],
      ["lure","talk; converse"],
      ["meli","remember"],
      ["melu","miss"],
      ["mezu","write"],
      ["mie","meet"],
      ["miori","participate"],
      ["mire","describe"],
      ["mura","marry"],
      ["namu","be called; be named"],
      ["nata","put; place"],
      ["navine","walk"],
      ["nelu","search; look for"],
      ["novi","follow"],
      ["oio","regard as; treat as"],
      ["parale","leave"],
      ["petra","rise"],
      ["poso","occupy"],
      ["pozo","prove"],
      ["praisa","aim at"],
      ["praise","guide"],
      ["trine","ask"],
      ["kuma","choose"],
      ["rake","get; obtain"],
      ["raku","prepare"],
      ["reni","answer"],
      ["revo","run"],
      ["revu","return"],
      ["sela","tell"],
      ["sire","paint"],
      ["sola","sleep"],
      ["megolvia","sing"],
      ["soraye","study; learn"],
      ["sorae","teach"],
      ["fizro","count"],
      ["su","live; exist"],
      ["suri","live"],
      ["tamu","work"],
      ["tira","come"],
      ["tiru","bring"],
      ["tori","carry"],
      ["trake","begin; start"],
      ["tra","stand"],
      ["trepsa","oppose"],
      ["trive","share"],
      ["vayi","want"],
      ["veli","wait"],
      ["veska","travel"],
      ["veskari","please"],
      ["vese","see"],
      ["vire","receive"],
      ["vona","watch"],
      ["zanu","appreciate; admire"],
      ["zeyo","go"],
      ["zeyu","should"],
      ["zima","buy"],
    ];

    const verbToMeaning = Object.fromEntries(VERBS);
    const VERB_ZH_MEANING = window.SPIRETZ_ZH_MEANING || {};

    function fillVerbSelect() {
      verbSelect.innerHTML = "";
      for (const [v, m] of VERBS) {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        verbSelect.appendChild(opt);
      }

      verbSelect.value = "krei";
    }

    const SUBJECT_SUFFIX = {
      "omit": "",
      "1sg": "t",
      "1pl": "wen",
      "2sg": "ya",
      "2pl": "yen",
      "3sg": "se",
      "3pl": "ten",
    };

    const ASPECT_SUFFIX = {
      "none": "",
      "im": "im",
      "ul": "ul",
      "en": "en",
    };

    const MOOD_SUFFIX = {
      "none": "",
      "el": "el",
    };

    const VOWEL_MAP = {
      "yi": "iː",
      "ye": "ɛː",
      "ai": "ɑi",
      "iu": "ju",
      "au": "ɑu",
      "ua": "wɑ",
      "ei": "e",
      "ae": "æ",
      "oe": "ʊ",
      "i": "i",
      "e": "ɛ",
      "u": "u",
      "o": "o",
      "a": "ɑ",
    };

    const CONS_MAP = {
      "sh": "ʃ",
      "ch": "ʧ",
      "ng": "ŋ",
      "p": "p",
      "b": "b",
      "t": "t",
      "d": "d",
      "k": "k",
      "g": "g",
      "f": "f",
      "v": "v",
      "s": "s",
      "z": "z",
      "h": "h",
      "m": "m",
      "n": "n",
      "r": "ɹ",
      "l": "l",
      "w": "w",
      "y": "j",
      "x": "ks",
    };

    const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
    const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);

    function isLetter(ch) {
      return ch >= "a" && ch <= "z";
    }

    function tokenizeSpiretz(s) {
      const text = s.toLowerCase();
      const tokens = [];
      let i = 0;

      while (i < text.length) {
        const ch = text[i];

        if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
          if (ch === "-") tokens.push({ type: "sep", ipa: "." });
          i++;
          continue;
        }

        if (!isLetter(ch)) throw new Error(`Invalid character: "${ch}"`);

        if (text.startsWith("ch", i)) {
          tokens.push({ type: "cons", ipa: "ʧ" });
          i += 2;
          continue;
        }

        if (ch === "c") {
          const next2 = text.slice(i + 1, i + 3);
          const next1 = text.slice(i + 1, i + 2);
          tokens.push({ type: "cons", ipa: (next1 === "i" || next2 === "yi") ? "s" : "k" });
          i += 1;
          continue;
        }

        let matched = false;

        for (const vk of VOWEL_KEYS) {
          if (text.startsWith(vk, i)) {
            tokens.push({ type: "vowel", ipa: VOWEL_MAP[vk] });
            i += vk.length;
            matched = true;
            break;
          }
        }
        if (matched) continue;

        for (const ck of CONS_KEYS) {
          if (text.startsWith(ck, i)) {
            tokens.push({ type: "cons", ipa: CONS_MAP[ck] });
            i += ck.length;
            matched = true;
            break;
          }
        }
        if (matched) continue;

        throw new Error("Unsupported spelling.");
      }

      return tokens;
    }

    function applyPenultimateStress(tokens) {
      const vIdxs = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === "vowel") vIdxs.push(i);
      }
      if (vIdxs.length === 0) throw new Error("No vowel found.");

      const stressIdx = vIdxs.length >= 2 ? vIdxs[vIdxs.length - 2] : vIdxs[0];

      const out = [];
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (i === stressIdx) out.push("ˈ" + t.ipa);
        else out.push(t.ipa);
      }
      return out.join("");
    }

    function toIPA(form) {
      const tokens = tokenizeSpiretz(form);
      return `[${applyPenultimateStress(tokens)}]`;
    }

    function buildVerbForm() {
      const verb = verbSelect.value;

      const subj = SUBJECT_SUFFIX[subjAgree.value] || "";
      const obj = objMarker.value; // none/ta/te
      let human = humanObj.value; // none/sa/x

      if (obj === "none") human = "none";
      if (obj === "te") human = "none";

      const tense = tenseSel.value;

      const asp = ASPECT_SUFFIX[aspectSel.value] || "";
      const mood = MOOD_SUFFIX[moodSel.value] || "";
      const dyn = dynSel.value === "og" ? "og" : "";

      let base = verb;
      if (tense === "future") base = `i-${verb}`;

      let out = base;

      if (subj) out += subj;
      if (obj !== "none") out += obj;
      if (human !== "none") out += human;

      if (tense === "past") out += "et";
      if (asp) out += asp;
      if (mood) out += mood;
      if (dyn) out += dyn;

      return { form: out, humanResolved: human };
    }

    function roughGloss(formInfo) {
      const rawMeaning = verbToMeaning[verbSelect.value] || "—";
      const meaning = IS_ZH ? (VERB_ZH_MEANING[rawMeaning] || rawMeaning) : rawMeaning;

      const subjKey = subjAgree.value;
      const subjEn = IS_ZH
        ? (
          subjKey === "1sg" ? "我" :
          subjKey === "1pl" ? "我们" :
          subjKey === "2sg" ? "你" :
          subjKey === "2pl" ? "你们" :
          subjKey === "3sg" ? "spirete/tatie（单数）" :
          subjKey === "3pl" ? "spireten/tatien（复数）" :
          "（某人）"
        )
        : (
          subjKey === "1sg" ? "I" :
          subjKey === "1pl" ? "we" :
          subjKey === "2sg" ? "you" :
          subjKey === "2pl" ? "you (pl)" :
          subjKey === "3sg" ? "spirete/tatie (sg)" :
          subjKey === "3pl" ? "spireten/tatien (pl)" :
          "(someone)"
        );

      const tense = tenseSel.value;
      const aspect = aspectSel.value;
      const mood = moodSel.value;

      const obj = objMarker.value;
      const human = formInfo.humanResolved;

      let objPhrase = "";
      if (obj === "ta") {
        if (human === "sa") objPhrase = IS_ZH ? " 某人" : " someone";
        else if (human === "x") objPhrase = IS_ZH ? "（皇室成员）" : " (a royal person)";
        else objPhrase = IS_ZH ? " 某物" : " something";
      } else if (obj === "te") {
        objPhrase = IS_ZH ? "（自己）" : " (oneself)";
      }

      let aux = "";
      if (mood === "el") aux += IS_ZH ? "可能" : "might ";
      if (tense === "future") aux += IS_ZH ? "将" : "will ";
      if (tense === "past") aux += IS_ZH ? "曾" : "did ";

      let aspectNote = "";
      if (aspect === "none") aspectNote = IS_ZH ? "（未完成体）" : " (imperfect)";
      if (aspect === "im") aspectNote = IS_ZH ? "（已完成）" : " (completed)";
      if (aspect === "ul") aspectNote = IS_ZH ? "（习惯性）" : " (habitually)";
      if (aspect === "en") aspectNote = IS_ZH ? "（重复性）" : " (repeatedly)";

      const dyn = dynSel.value === "og" ? (IS_ZH ? "（动态）" : " (dynamic)") : "";

      return `${subjEn} ${aux}${meaning}${objPhrase}${aspectNote}${dyn}`.replace(/\s+/g, " ").trim();
    }

    function update() {
      try {

        const obj = objMarker.value;
        if (obj === "none" || obj === "te") {
          humanObj.value = "none";
          humanObj.disabled = true;
        } else {
          humanObj.disabled = false;
        }

        {
          const m = verbToMeaning[verbSelect.value] || "—";
          verbMeaning.textContent = IS_ZH ? (VERB_ZH_MEANING[m] || m) : m;
        }

        const built = buildVerbForm();
        previewOut.textContent = built.form;

        ipaOutVerb.textContent = toIPA(built.form);

        glossOut.textContent = roughGloss(built);

        statusOut.textContent = "OK ✅";
      } catch (e) {
        previewOut.textContent = "—";
        ipaOutVerb.textContent = "—";
        glossOut.textContent = "—";
        statusOut.textContent = `Error: ${e.message}`;
      }
    }

    fillVerbSelect();

    [
      verbSelect, subjAgree, objMarker, humanObj,
      tenseSel, aspectSel, moodSel, dynSel
    ].forEach(el => el.addEventListener("change", update));

    update();
  })();

   // ===== Create: Birthday System  =====
(function () {
  const birthYear = document.getElementById("birthYear");
  const birthMonth = document.getElementById("birthMonth");
  const birthDay = document.getElementById("birthDay");
  const randomBirthBtn = document.getElementById("randomBirthBtn");

  const birthSpiretzOut = document.getElementById("birthSpiretzOut");
  const birthIpaOut = document.getElementById("birthIpaOut");
  const birthEngOut = document.getElementById("birthEngOut");
  const birthStatusOut = document.getElementById("birthStatusOut");

  if (!birthYear || !birthMonth || !birthDay || !randomBirthBtn) return;

  const MONTHS = [
    { en: "January",   sp: "tarul",  days: 31 },
    { en: "February",  sp: "resur",  days: 30 },
    { en: "March",     sp: "kilup",  days: 30 },
    { en: "April",     sp: "votir",  days: 30 },
    { en: "May",       sp: "meka",   days: 30 },
    { en: "June",      sp: "xisata", days: 31 },
    { en: "July",      sp: "xisere", days: 31 },
    { en: "August",    sp: "xisiki", days: 31 },
    { en: "September", sp: "dalur",  days: 30 },
    { en: "October",   sp: "zaivim", days: 30 },
    { en: "November",  sp: "fiurua", days: 30 },
    { en: "December",  sp: "xisovo", days: 31 },
  ];

  const UNIT_MONTH = "taris";
  const UNIT_DAY = "davir";
  const UNIT_YEAR = "zalu";

  const DIGITS = {
    0: "zu", 1: "ta", 2: "re", 3: "ki", 4: "vo",
    5: "me", 6: "dal", 7: "zai", 8: "fiu", 9: "no"
  };

  function numToSpiretz(n) {
    if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("Number must be an integer.");
    if (n < 0) throw new Error("Number must be non-negative.");
    if (n === 0) return DIGITS[0];

    const digits = String(n).split("").map(d => parseInt(d, 10));
    const parts = [];

    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      const pos = digits.length - 1 - i; // 0 = ones, 1 = tens, 2 = hundreds...

      if (d === 0) continue;

      if (pos === 0) {
        parts.push(DIGITS[d]);
      } else {
        const exponentWord = DIGITS[pos]; // pos < 10 for our use (year <= 2099)
        const place = exponentWord + "zu"; // e.g. 10^2 => rezu, 10^3 => kizu
        parts.push(DIGITS[d] + place);
      }
    }

    return parts.join("-");
  }

  const VOWEL_MAP = {
    "yi": "iː",
    "ye": "ɛː",
    "ai": "ɑi",
    "iu": "ju",
    "au": "ɑu",
    "ua": "wɑ",
    "ei": "e",
    "ae": "æ",
    "oe": "ʊ",
    "i": "i",
    "e": "ɛ",
    "u": "u",
    "o": "o",
    "a": "ɑ",
  };

  const CONS_MAP = {
    "sh": "ʃ",
    "ch": "ʧ",
    "ng": "ŋ",
    "p": "p",
    "b": "b",
    "t": "t",
    "d": "d",
    "k": "k",
    "g": "g",
    "f": "f",
    "v": "v",
    "s": "s",
    "z": "z",
    "h": "h",
    "m": "m",
    "n": "n",
    "r": "ɹ",
    "l": "l",
    "w": "w",
    "y": "j",
    "x": "ks",
  };

  const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
  const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);

  function isLetter(ch) {
    return ch >= "a" && ch <= "z";
  }

  function tokenizeSpiretz(text) {
    const s = text.toLowerCase();
    const tokens = [];
    let i = 0;

    while (i < s.length) {
      const ch = s[i];

      if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
        if (ch === "-") tokens.push({ type: "sep", ipa: "." });
        i++;
        continue;
      }

      if (!isLetter(ch)) throw new Error(`Invalid character: "${ch}"`);

      if (s.startsWith("ch", i)) {
        tokens.push({ type: "cons", ipa: "ʧ" });
        i += 2;
        continue;
      }

      if (ch === "c") {
        const next2 = s.slice(i + 1, i + 3);
        const next1 = s.slice(i + 1, i + 2);
        tokens.push({ type: "cons", ipa: (next1 === "i" || next2 === "yi") ? "s" : "k" });
        i += 1;
        continue;
      }

      let matched = false;

      for (const vk of VOWEL_KEYS) {
        if (s.startsWith(vk, i)) {
          tokens.push({ type: "vowel", ipa: VOWEL_MAP[vk] });
          i += vk.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      for (const ck of CONS_KEYS) {
        if (s.startsWith(ck, i)) {
          tokens.push({ type: "cons", ipa: CONS_MAP[ck] });
          i += ck.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      throw new Error("Unsupported spelling.");
    }

    return tokens;
  }

  function applyPenultimateStress(tokens) {
    const vIdxs = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === "vowel") vIdxs.push(i);
    }
    if (vIdxs.length === 0) throw new Error("No vowel found.");

    const stressIdx = vIdxs.length >= 2 ? vIdxs[vIdxs.length - 2] : vIdxs[0];

    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (i === stressIdx) out.push("ˈ" + t.ipa);
      else out.push(t.ipa);
    }
    return out.join("");
  }

  function toIPA(text) {
    const tokens = tokenizeSpiretz(text);
    return `[${applyPenultimateStress(tokens)}]`;
  }

  function fillMonthSelect() {
    birthMonth.innerHTML = "";
    MONTHS.forEach((m, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx); // 0-based
      opt.textContent = `${m.en} (${m.sp})`;
      birthMonth.appendChild(opt);
    });
    birthMonth.value = "0";
  }

  function clampDayToMonth() {
    const mi = parseInt(birthMonth.value, 10);
    const maxDay = MONTHS[mi].days;

    birthDay.max = String(maxDay);
    const d = Number(birthDay.value);
    if (Number.isFinite(d) && d > maxDay) birthDay.value = String(maxDay);
    if (Number.isFinite(d) && d < 1) birthDay.value = "1";
  }

  function formatSpiretzBirthday(y, mIndex, d) {
    const monthObj = MONTHS[mIndex];

    const dayWord = numToSpiretz(d);
    const yearWord = numToSpiretz(y);

    return `${dayWord} ${UNIT_DAY} ${monthObj.sp} ${UNIT_MONTH} ${yearWord} ${UNIT_YEAR}`;
  }

  function formatEnglishBirthday(y, mIndex, d) {
    const monthObj = MONTHS[mIndex];
    return `${monthObj.en} ${d}, ${y}`;
  }

  function updateBirthday() {
    try {
      const yRaw = birthYear.value;
      const dRaw = birthDay.value;
      const mi = parseInt(birthMonth.value, 10);

      clampDayToMonth();

      if (!yRaw || !dRaw) {
        birthSpiretzOut.textContent = "—";
        birthIpaOut.textContent = "—";
        birthEngOut.textContent = "—";
        birthStatusOut.textContent = "Waiting for input…";
        return;
      }

      const y = Number(yRaw);
      const d = Number(dRaw);

      if (!Number.isInteger(y) || y < 1920 || y > 2099) {
        throw new Error("Year must be an integer between 1920 and 2099.");
      }

      const maxDay = MONTHS[mi].days;
      if (!Number.isInteger(d) || d < 1 || d > maxDay) {
        throw new Error(`Day must be 1–${maxDay} for ${MONTHS[mi].en}.`);
      }

      const spiretzStr = formatSpiretzBirthday(y, mi, d);
      birthSpiretzOut.textContent = spiretzStr;
      birthEngOut.textContent = formatEnglishBirthday(y, mi, d);
      birthIpaOut.textContent = toIPA(spiretzStr);

      birthStatusOut.textContent = "OK ✅";
    } catch (e) {
      birthSpiretzOut.textContent = "—";
      birthIpaOut.textContent = "—";
      birthEngOut.textContent = "—";
      birthStatusOut.textContent = `Error: ${e.message}`;
    }
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomBirthday() {
    const y = randomInt(1920, 2099);
    const mi = randomInt(0, 11);
    const d = randomInt(1, MONTHS[mi].days);

    birthYear.value = String(y);
    birthMonth.value = String(mi);
    birthDay.value = String(d);

    updateBirthday();
  }

  fillMonthSelect();

  birthYear.value = "2001";
  birthMonth.value = "0";
  birthDay.value = "1";
  clampDayToMonth();
  updateBirthday();

  birthYear.addEventListener("input", updateBirthday);
  birthMonth.addEventListener("change", updateBirthday);
  birthDay.addEventListener("input", updateBirthday);
  randomBirthBtn.addEventListener("click", randomBirthday);
})();

    // ===== Create: Pixel Portrait Maker =====
    (function () {
      const canvas = document.getElementById("portraitCanvas");
      const skinColor = document.getElementById("skinColor");
      const hairColor = document.getElementById("hairColor");
      const hairHighlight = document.getElementById("hairHighlight");
      const leftEyeColor = document.getElementById("leftEyeColor");
      const rightEyeColor = document.getElementById("rightEyeColor");
      const leftEyeTop = document.getElementById("leftEyeTop");
      const leftEyeBottom = document.getElementById("leftEyeBottom");
      const rightEyeTop = document.getElementById("rightEyeTop");
      const rightEyeBottom = document.getElementById("rightEyeBottom");
      const eyeSpecialToggle = document.getElementById("eyeSpecialToggle");
      const pupilToggle = document.getElementById("pupilToggle");
      const browShape = document.getElementById("browShape");
      const hairBack = document.getElementById("hairBack");
      const hairBackLength = document.getElementById("hairBackLength");
      const hairBackOther = document.getElementById("hairBackOther");
      const hairFront = document.getElementById("hairFront");
      const hairFrontSide = document.getElementById("hairFrontSide");
      const hairTemples = document.getElementById("hairTemples");
      const hairBraids = document.getElementById("hairBraids");
      const hairSingleBraidPos = document.getElementById("hairSingleBraidPos");
      const hairSingleBraidLen = document.getElementById("hairSingleBraidLen");
      const hairDoubleBraidStyle = document.getElementById("hairDoubleBraidStyle");
      const hairDoubleBraidSide = document.getElementById("hairDoubleBraidSide");
      const hairDoubleBraidLen = document.getElementById("hairDoubleBraidLen");
      const hairLowTwinLen = document.getElementById("hairLowTwinLen");
      const eyeShape = document.getElementById("eyeShape");
      const eyeWinkSide = document.getElementById("eyeWinkSide");
      const eyeWinkSecond = document.getElementById("eyeWinkSecond");
      const eyeClosedSide = document.getElementById("eyeClosedSide");
      const noseShape = document.getElementById("noseShape");
      const mouthShape = document.getElementById("mouthShape");
      const mouthSize = document.getElementById("mouthSize");
      const outfitStyle = document.getElementById("outfitStyle");
      const blazerStyle = document.getElementById("blazerStyle");
      const outfitColor = document.getElementById("outfitColor");
      const bgStyle = document.getElementById("bgStyle");
      const bgColor = document.getElementById("bgColor");
      const genderStyle = document.getElementById("genderStyle");
      const randomBtn = document.getElementById("portraitRandom");
      const downloadBtn = document.getElementById("portraitDownload");
      const previewBtns = document.querySelectorAll(".portraitPreviewBtn");
      const portraitTabs = document.querySelectorAll(".portrait-tab");
      const portraitViewPixel = document.getElementById("portraitViewPixel");
      const portraitViewIllustrated = document.getElementById("portraitViewIllustrated");
      const illustratedPortrait = document.getElementById("illustratedPortrait");
      const drawBody = document.getElementById("drawBody");
      const drawNose = document.getElementById("drawNose");
      const drawEyes = document.getElementById("drawEyes");
      const drawEyeTint = document.getElementById("drawEyeTint");
      const drawPupil = document.getElementById("drawPupil");
      const drawBrows = document.getElementById("drawBrows");
      const drawMouth = document.getElementById("drawMouth");
      const drawFrontHair = document.getElementById("drawFrontHair");
      const drawTemples = document.getElementById("drawTemples");
      const drawBraids = document.getElementById("drawBraids");
      const drawBackHair = document.getElementById("drawBackHair");
      const drawOutfit = document.getElementById("drawOutfit");
      const drawAccessory = document.getElementById("drawAccessory");

      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const size = 128;
      const BASE = 64;
      const DRAW_SCALE = 2;
      const SCALE = 4;
      const OFFSET = Math.floor((size - BASE * DRAW_SCALE) / 2);
      canvas.width = size * SCALE;
      canvas.height = size * SCALE;
      ctx.imageSmoothingEnabled = false;
      const ILLUSTRATED_BASE = "assets/";

      const COLORS = {
        skin: [
          { name: "Porcelain", hex: "#f2d6c9" },
          { name: "Sand", hex: "#e6c39b" },
          { name: "Honey", hex: "#d7a76b" },
          { name: "Umber", hex: "#b57b4a" },
          { name: "Cedar", hex: "#8c5b3c" },
          { name: "Ebony", hex: "#5a3a2e" },
        ],
        hair: [
          { name: "Inkveil", hex: "#1c1a22" },
          { name: "Midnight Ash", hex: "#2c2b36" },
          { name: "Chestnut Ember", hex: "#5b3a2e" },
          { name: "Copper Glow", hex: "#8a4b2c" },
          { name: "Golden Haze", hex: "#c7a04e" },
          { name: "Silver Mist", hex: "#8e8a86" },
          { name: "Plum Noir", hex: "#4b2c3b" },
          { name: "Teal Tide", hex: "#2f5a5a" },
          { name: "Rose Quartz", hex: "#f3a7c9" },
          { name: "Skyglass", hex: "#6aa7ff" },
          { name: "Violet Crown", hex: "#9a7bff" },
          { name: "Crimson Flame", hex: "#cc4b4b" },
          { name: "Abyss Blue", hex: "#1f2f6b" },
          { name: "Nocturne Purple", hex: "#2f1b4d" },
          { name: "Garnet Ember", hex: "#7b1f2a" },
          { name: "Carrot Glow", hex: "#e06a2b" },
        ],
        eyes: [
          { name: "Skyfall", hex: "#6ab3ff" },
          { name: "Leaflight", hex: "#6fcf97" },
          { name: "Amberglow", hex: "#f2b94f" },
          { name: "Violet Bloom", hex: "#9b8cff" },
          { name: "Roseflare", hex: "#ff7fb0" },
          { name: "Slate Ice", hex: "#9bb1c9" },
          { name: "Onyx", hex: "#1a1a1f" },
          { name: "Crimson", hex: "#d34a4a" },
          { name: "Orchid", hex: "#c26bff" },
          { name: "Deep Ocean", hex: "#2f4fa7" },
        ],
        outfit: [
          { name: "Ivory", hex: "#f5efe6" },
          { name: "Rose", hex: "#f2c2d6" },
          { name: "Sky", hex: "#cbe2ff" },
          { name: "Lilac", hex: "#e3d1ff" },
          { name: "Mint", hex: "#c9f0df" },
          { name: "Sun", hex: "#ffe1a8" },
          { name: "Ink", hex: "#2b2b36" },
        ],
        background: [
          { name: "Snow", hex: "#ffffff" },
          { name: "Powder Pink", hex: "#ffe6f0" },
          { name: "Mist Blue", hex: "#e6f2ff" },
          { name: "Lavender", hex: "#efe6ff" },
          { name: "Mint Fog", hex: "#e6fff5" },
          { name: "Peach", hex: "#ffe9d6" },
        ],
      };
      window.PORTRAIT_COLORS = COLORS;

      const OPTIONS = {
        hairBack: ["Base Style", "Straight", "Curly", "Other"],
        hairBackLength: ["Short", "Medium", "Long"],
        hairBackOther: ["Shoulder-Length Layered", "Messy Curly Crop", "Pixie Bob", "Low Sleek Ponytail", "Soft Wavy Shag"],
        hairFront: ["Blocky Bangs", "Feathery Strands", "Cat Ear Fringe", "Zigzag Fringe", "Asymmetrical Cat Bangs", "Heart Peak Fringe", "Thick Block Fringe", "Single Cat Ear Fringe", "Asymmetrical Block Fringe", "Simplified Asymmetrical Fringe", "One-Sided Swept Fringe"],
        hairFrontSide: ["Left", "Right"],
        hairTemples: ["None", "Soft", "Sharp", "Long"],
        hairBraids: ["None", "Single", "Double"],
        hairSingleBraidPos: ["High", "Low", "Ponytail"],
        hairSingleBraidLen: ["Short", "Medium", "Long"],
        hairDoubleBraidStyle: ["Twin ponytails", "Braided pigtails 1", "Braided pigtails 2", "Low twin ponytails", "High twin ponytails", "Four ponytails", "Roman roll"],
        hairDoubleBraidSide: ["Both", "Left", "Right"],
        hairDoubleBraidLen: ["Short", "Medium", "Long"],
        hairLowTwinLen: ["Short", "Medium", "Thin"],
        eyeShape: ["Normal", "Upturned", "Sleepy", "Wink", "Closed"],
        eyeWinkSide: ["Both", "Left", "Right"],
        eyeWinkSecond: ["Normal", "Upturned", "Sleepy"],
        eyeClosedSide: ["Both", "Left", "Right"],
        browShape: ["Bean", "Angry", "Calm", "Normal", "Curious"],
        noseShape: ["Dot", "Bridge", "Normal"],
        mouthShape: ["Smile", "Normal", "Happy"],
        mouthSize: ["Small", "Big"],
        outfitStyle: ["Standard Collar Shirt", "Button-Down Collar Shirt", "Mandarin Collar Shirt", "Crew Neck T-Shirt", "Turtleneck Top", "Turtleneck Sweater"],
        blazerStyle: ["None", "Notched Lapel Blazer"],
        bgStyle: ["White", "Solid", "Hearts", "Stars"],
        genderStyle: ["Neutral", "Masculine", "Feminine"],
      };
      window.PORTRAIT_OPTIONS = OPTIONS;

      const PORTRAIT_ZH_LABELS = {
        "Base Style": "基础样式", "Straight": "直发", "Curly": "卷发", "Other": "其他",
        "Short": "短", "Medium": "中", "Long": "长", "Shoulder-Length Layered": "及肩层次",
        "Messy Curly Crop": "凌乱短卷", "Pixie Bob": "精灵波波", "Low Sleek Ponytail": "低位顺滑马尾",
        "Soft Wavy Shag": "柔和波浪层次", "Blocky Bangs": "齐块刘海", "Feathery Strands": "羽状碎发",
        "Cat Ear Fringe": "猫耳刘海", "Zigzag Fringe": "锯齿刘海", "Asymmetrical Cat Bangs": "不对称猫刘海",
        "Heart Peak Fringe": "心形额峰刘海", "Thick Block Fringe": "厚重齐刘海", "Single Cat Ear Fringe": "单侧猫耳刘海",
        "Asymmetrical Block Fringe": "不对称块状刘海", "Simplified Asymmetrical Fringe": "简化不对称刘海",
        "One-Sided Swept Fringe": "单侧斜刘海", "Left": "左", "Right": "右", "None": "无", "Soft": "柔和",
        "Sharp": "锐利", "Twin ponytails": "双马尾", "Braided pigtails 1": "双编辫 1", "Braided pigtails 2": "双编辫 2",
        "Low twin ponytails": "低双马尾", "High twin ponytails": "高双马尾", "Four ponytails": "四马尾", "Roman roll": "罗马卷",
        "Both": "双侧", "Thin": "细", "Normal": "正常", "Upturned": "上扬", "Sleepy": "慵懒", "Wink": "眨眼", "Closed": "闭眼",
        "Bean": "豆眉", "Angry": "凶眉", "Calm": "平眉", "Curious": "好奇", "Dot": "点鼻", "Bridge": "鼻梁",
        "Smile": "微笑", "Happy": "开心", "Small": "小", "Big": "大", "Standard Collar Shirt": "标准领衬衫",
        "Button-Down Collar Shirt": "扣领衬衫", "Mandarin Collar Shirt": "立领衬衫", "Crew Neck T-Shirt": "圆领T恤",
        "Turtleneck Top": "高领上衣", "Turtleneck Sweater": "高领毛衣", "Notched Lapel Blazer": "缺口翻领西装",
        "White": "白色", "Solid": "纯色", "Hearts": "爱心", "Stars": "星星", "Neutral": "中性", "Masculine": "偏阳刚",
        "Feminine": "偏柔和"
        , "Porcelain": "瓷白", "Sand": "沙色", "Honey": "蜜色", "Umber": "赭棕", "Cedar": "雪松棕", "Ebony": "乌木",
        "Inkveil": "墨幕黑", "Midnight Ash": "午夜灰", "Chestnut Ember": "栗焰棕", "Copper Glow": "铜光",
        "Golden Haze": "金雾", "Silver Mist": "银雾", "Plum Noir": "暗梅紫", "Teal Tide": "深青潮",
        "Rose Quartz": "蔷薇石英", "Skyglass": "天青玻璃", "Violet Crown": "紫冠", "Crimson Flame": "绯焰",
        "Abyss Blue": "深渊蓝", "Nocturne Purple": "夜曲紫", "Garnet Ember": "石榴焰", "Carrot Glow": "胡萝卜橙",
        "Skyfall": "天落蓝", "Leaflight": "叶光绿", "Amberglow": "琥珀光", "Violet Bloom": "紫绽",
        "Roseflare": "玫焰", "Slate Ice": "板岩冰", "Onyx": "缟玛瑙", "Crimson": "猩红", "Orchid": "兰紫",
        "Deep Ocean": "深海蓝", "Ivory": "象牙白", "Rose": "玫粉", "Sky": "天空蓝", "Lilac": "淡紫",
        "Mint": "薄荷", "Sun": "暖阳", "Ink": "墨色", "Snow": "雪白", "Powder Pink": "粉雾",
        "Mist Blue": "雾蓝", "Lavender": "薰衣草紫", "Mint Fog": "薄荷雾", "Peach": "蜜桃"
      };
      const zhLabel = (value) => IS_ZH ? (PORTRAIT_ZH_LABELS[value] || value) : value;

      function fillSelect(select, list, getLabel) {
        select.innerHTML = "";
        list.forEach((item, idx) => {
          const opt = document.createElement("option");
          opt.value = String(idx);
          opt.textContent = getLabel ? getLabel(item) : item;
          select.appendChild(opt);
        });
      }

      fillSelect(skinColor, COLORS.skin, (c) => zhLabel(c.name));
      fillSelect(hairColor, COLORS.hair, (c) => zhLabel(c.name));
      fillSelect(hairHighlight, [{ name: "None", hex: "" }].concat(COLORS.hair), (c) => zhLabel(c.name));
      fillSelect(leftEyeColor, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(rightEyeColor, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(leftEyeTop, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(leftEyeBottom, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(rightEyeTop, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(rightEyeBottom, COLORS.eyes, (c) => zhLabel(c.name));
      fillSelect(outfitColor, COLORS.outfit, (c) => zhLabel(c.name));
      fillSelect(hairBack, OPTIONS.hairBack, zhLabel);
      fillSelect(hairBackLength, OPTIONS.hairBackLength, zhLabel);
      fillSelect(hairBackOther, OPTIONS.hairBackOther, zhLabel);
      fillSelect(hairFront, OPTIONS.hairFront, zhLabel);
      fillSelect(hairFrontSide, OPTIONS.hairFrontSide, zhLabel);
      fillSelect(hairTemples, OPTIONS.hairTemples, zhLabel);
      fillSelect(hairBraids, OPTIONS.hairBraids, zhLabel);
      fillSelect(hairSingleBraidPos, OPTIONS.hairSingleBraidPos, zhLabel);
      fillSelect(hairSingleBraidLen, OPTIONS.hairSingleBraidLen, zhLabel);
      fillSelect(hairDoubleBraidStyle, OPTIONS.hairDoubleBraidStyle, zhLabel);
      fillSelect(hairDoubleBraidSide, OPTIONS.hairDoubleBraidSide, zhLabel);
      fillSelect(hairDoubleBraidLen, OPTIONS.hairDoubleBraidLen, zhLabel);
      fillSelect(hairLowTwinLen, OPTIONS.hairLowTwinLen, zhLabel);
      fillSelect(eyeShape, OPTIONS.eyeShape, zhLabel);
      fillSelect(eyeWinkSide, OPTIONS.eyeWinkSide, zhLabel);
      fillSelect(eyeWinkSecond, OPTIONS.eyeWinkSecond, zhLabel);
      fillSelect(eyeClosedSide, OPTIONS.eyeClosedSide, zhLabel);
      fillSelect(browShape, OPTIONS.browShape, zhLabel);
      fillSelect(noseShape, OPTIONS.noseShape, zhLabel);
      fillSelect(mouthShape, OPTIONS.mouthShape, zhLabel);
      fillSelect(mouthSize, OPTIONS.mouthSize, zhLabel);
      fillSelect(outfitStyle, OPTIONS.outfitStyle, zhLabel);
      fillSelect(blazerStyle, OPTIONS.blazerStyle, zhLabel);
      fillSelect(bgStyle, OPTIONS.bgStyle, zhLabel);
      fillSelect(bgColor, COLORS.background, (c) => zhLabel(c.name));
      fillSelect(genderStyle, OPTIONS.genderStyle, zhLabel);

      function randIdx(arr) {
        return Math.floor(Math.random() * arr.length);
      }

      function pixRaw(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }

      function pix(x, y, color) {
        pixRaw(x * DRAW_SCALE + OFFSET, y * DRAW_SCALE + OFFSET, color);
      }

      function drawEllipse(cx, cy, rx, ry, color) {
        const scx = cx * DRAW_SCALE + OFFSET;
        const scy = cy * DRAW_SCALE + OFFSET;
        const srx = rx * DRAW_SCALE;
        const sry = ry * DRAW_SCALE;
        for (let y = Math.floor(scy - sry); y <= Math.ceil(scy + sry); y++) {
          for (let x = Math.floor(scx - srx); x <= Math.ceil(scx + srx); x++) {
            const dx = (x - scx) / srx;
            const dy = (y - scy) / sry;
            if (dx * dx + dy * dy <= 1) pixRaw(x, y, color);
          }
        }
      }

      function drawRectRaw(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
      }

      function drawRect(x, y, w, h, color) {
        drawRectRaw(x * DRAW_SCALE + OFFSET, y * DRAW_SCALE + OFFSET, w * DRAW_SCALE, h * DRAW_SCALE, color);
      }

      function shade(hex, amt) {
        const n = parseInt(hex.slice(1), 16);
        let r = (n >> 16) + amt;
        let g = ((n >> 8) & 0xff) + amt;
        let b = (n & 0xff) + amt;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }

      function drawPortrait() {
        ctx.clearRect(0, 0, size * SCALE, size * SCALE);
        const bgHex = COLORS.background[parseInt(bgColor.value, 10)]?.hex || "#ffffff";
        const bgMode = OPTIONS.bgStyle[parseInt(bgStyle.value, 10)] || "White";
        if (bgMode === "White") {
          drawRectRaw(0, 0, size, size, "#ffffff");
        } else {
          drawRectRaw(0, 0, size, size, bgHex);
          if (bgMode === "Hearts") {
            for (let y = 6; y < size; y += 12) {
              for (let x = 6; x < size; x += 12) {
                pixRaw(x, y, "#ffffff");
                pixRaw(x + 1, y, "#ffffff");
                pixRaw(x - 1, y, "#ffffff");
                pixRaw(x, y + 1, "#ffffff");
                pixRaw(x, y + 2, "#ffffff");
                pixRaw(x - 1, y + 1, "#ffffff");
                pixRaw(x + 1, y + 1, "#ffffff");
              }
            }
          } else if (bgMode === "Stars") {
            for (let y = 4; y < size; y += 10) {
              for (let x = 4; x < size; x += 10) {
                pixRaw(x, y, "#ffffff");
                pixRaw(x + 1, y, "#ffffff");
                pixRaw(x - 1, y, "#ffffff");
                pixRaw(x, y + 1, "#ffffff");
                pixRaw(x, y - 1, "#ffffff");
              }
            }
          }
        }

        const skin = COLORS.skin[parseInt(skinColor.value, 10)]?.hex || COLORS.skin[0].hex;
        const hair = COLORS.hair[parseInt(hairColor.value, 10)]?.hex || COLORS.hair[0].hex;
        const highlightIndex = parseInt(hairHighlight.value, 10);
        const highlight = highlightIndex > 0 ? COLORS.hair[highlightIndex - 1]?.hex : "";
        const specialEyesOn = !!eyeSpecialToggle?.checked;
        const baseEye = COLORS.eyes[parseInt(leftEyeColor.value, 10)]?.hex || COLORS.eyes[0].hex;
        const leftEye = COLORS.eyes[parseInt(leftEyeColor.value, 10)]?.hex || baseEye;
        const rightEyeRaw = COLORS.eyes[parseInt(rightEyeColor.value, 10)]?.hex || leftEye;
        const rightEye = specialEyesOn ? rightEyeRaw : leftEye;
        const leftTopRaw = COLORS.eyes[parseInt(leftEyeTop.value, 10)]?.hex || leftEye;
        const leftBottomRaw = COLORS.eyes[parseInt(leftEyeBottom.value, 10)]?.hex || leftEye;
        const rightTopRaw = COLORS.eyes[parseInt(rightEyeTop.value, 10)]?.hex || rightEye;
        const rightBottomRaw = COLORS.eyes[parseInt(rightEyeBottom.value, 10)]?.hex || rightEye;
        const leftTop = specialEyesOn ? leftTopRaw : leftEye;
        const leftBottom = specialEyesOn ? leftBottomRaw : leftEye;
        const rightTop = specialEyesOn ? rightTopRaw : rightEye;
        const rightBottom = specialEyesOn ? rightBottomRaw : rightEye;
        const outfit = COLORS.outfit[parseInt(outfitColor.value, 10)]?.hex || COLORS.outfit[0].hex;
        const outfitShade = shade(outfit, -18);
        const outfitLight = shade(outfit, 18);
        const hairLight = shade(hair, 28);
        const hairDark = shade(hair, -20);

        const backType = OPTIONS.hairBack[parseInt(hairBack.value, 10)] || "Straight";
        const backLength = OPTIONS.hairBackLength[parseInt(hairBackLength.value, 10)] || "Short";
        const backOther = OPTIONS.hairBackOther[parseInt(hairBackOther.value, 10)] || "Shoulder-Length Layered";
        const front = OPTIONS.hairFront[parseInt(hairFront.value, 10)] || "Blocky Bangs";
        const frontSide = OPTIONS.hairFrontSide[parseInt(hairFrontSide?.value || "0", 10)] || "Left";
        const temples = OPTIONS.hairTemples[parseInt(hairTemples.value, 10)] || "None";
        const braids = OPTIONS.hairBraids[parseInt(hairBraids.value, 10)] || "None";
        const singlePos = OPTIONS.hairSingleBraidPos[parseInt(hairSingleBraidPos.value, 10)] || "High";
        const singleLen = OPTIONS.hairSingleBraidLen[parseInt(hairSingleBraidLen.value, 10)] || "Short";
        const doubleStyle = OPTIONS.hairDoubleBraidStyle[parseInt(hairDoubleBraidStyle.value, 10)] || "Twin ponytails";
        const doubleSide = OPTIONS.hairDoubleBraidSide[parseInt(hairDoubleBraidSide.value, 10)] || "Both";
        const doubleLen = OPTIONS.hairDoubleBraidLen[parseInt(hairDoubleBraidLen.value, 10)] || "Short";
        const lowTwinLen = OPTIONS.hairLowTwinLen[parseInt(hairLowTwinLen.value, 10)] || "Short";

        function drawBackHairAndBraids() {
          if (backType === "Base Style") {
            drawRect(11, 24, 7, 16, hair);
            drawRect(46, 24, 7, 16, hair);
            drawRect(10, 38, 8, 4, hair);
            drawRect(46, 38, 8, 4, hair);
            drawRect(13, 26, 2, 10, hairLight);
            drawRect(49, 26, 2, 10, hairLight);
            drawRect(16, 36, 4, 6, hairDark);
            drawRect(42, 36, 4, 6, hairDark);
          } else if (backType === "Straight") {
            if (backLength === "Short") {
              drawRect(12, 24, 7, 9, hair);
              drawRect(45, 24, 7, 9, hair);
              drawRect(12, 32, 7, 2, hairDark);
              drawRect(45, 32, 7, 2, hairDark);
              drawRect(14, 25, 2, 6, hairLight);
              drawRect(48, 25, 2, 6, hairLight);
            } else if (backLength === "Medium") {
              drawRect(10, 24, 8, 18, hair);
              drawRect(46, 24, 8, 18, hair);
              drawRect(9, 40, 9, 4, hairDark);
              drawRect(46, 40, 9, 4, hairDark);
              drawRect(12, 26, 2, 12, hairLight);
              drawRect(50, 26, 2, 12, hairLight);
            } else if (backLength === "Long") {
              drawRect(8, 22, 10, 32, hair);
              drawRect(46, 22, 10, 32, hair);
              drawRect(16, 46, 10, 10, hair);
              drawRect(38, 46, 10, 10, hair);
              drawRect(10, 24, 2, 20, hairLight);
              drawRect(52, 24, 2, 20, hairLight);
              drawRect(16, 52, 8, 4, hairDark);
              drawRect(40, 52, 8, 4, hairDark);
            }
          } else if (backType === "Curly") {
            if (backLength === "Short") {
              for (let y = 24; y <= 30; y += 3) {
                drawRect(12, y, 6, 3, hair);
                drawRect(46, y, 6, 3, hair);
              }
            } else if (backLength === "Medium") {
              for (let y = 24; y <= 40; y += 4) {
                drawRect(10, y, 8, 3, hair);
                drawRect(46, y, 8, 3, hair);
              }
            } else if (backLength === "Long") {
              for (let y = 22; y <= 48; y += 4) {
                drawRect(8, y, 10, 3, hair);
                drawRect(46, y, 10, 3, hair);
              }
              drawRect(14, 46, 10, 4, hair);
              drawRect(40, 46, 10, 4, hair);
            }
          } else if (backType === "Other") {
            if (backOther === "Shoulder-Length Layered") {
              drawRect(10, 24, 8, 18, hair);
              drawRect(46, 24, 8, 18, hair);
              drawRect(14, 34, 6, 4, hairLight);
              drawRect(44, 34, 6, 4, hairLight);
              drawRect(16, 40, 6, 6, hairDark);
              drawRect(42, 40, 6, 6, hairDark);
            } else if (backOther === "Messy Curly Crop") {
              drawRect(9, 24, 9, 20, hair);
              drawRect(46, 24, 9, 20, hair);
              drawRect(20, 40, 6, 8, hairDark);
              drawRect(38, 40, 6, 8, hairDark);
            } else if (backOther === "Pixie Bob") {
              drawRect(12, 24, 6, 12, hair);
              drawRect(46, 24, 6, 12, hair);
              drawRect(16, 34, 6, 6, hairDark);
              drawRect(40, 34, 6, 6, hairDark);
            } else if (backOther === "Low Sleek Ponytail") {
              drawRect(12, 24, 6, 10, hair);
              drawRect(46, 24, 6, 10, hair);
              drawRect(28, 36, 8, 20, hair);
              drawRect(30, 54, 4, 4, hairDark);
            } else if (backOther === "Soft Wavy Shag") {
              drawRect(10, 24, 8, 18, hair);
              drawRect(46, 24, 8, 18, hair);
              drawRect(18, 38, 8, 8, hairDark);
              drawRect(38, 38, 8, 8, hairDark);
            } else {
              drawRect(12, 24, 6, 18, hair);
              drawRect(46, 24, 6, 18, hair);
              drawRect(18, 38, 8, 10, hairDark);
              drawRect(38, 38, 8, 10, hairDark);
            }
          }

          if (braids === "Single") {
            if (singlePos === "High") {
              drawRect(47, 22, 4, 18, hair);
              drawRect(48, 40, 2, 6, hairDark);
            } else if (singlePos === "Low") {
              drawRect(47, 30, 4, 18, hair);
              drawRect(48, 48, 2, 6, hairDark);
            } else {
              if (singleLen === "Short") {
                drawRect(47, 24, 4, 12, hair);
                drawRect(48, 36, 2, 4, hairDark);
              } else if (singleLen === "Medium") {
                drawRect(47, 24, 4, 18, hair);
                drawRect(48, 42, 2, 6, hairDark);
              } else {
                drawRect(47, 24, 4, 26, hair);
                drawRect(48, 50, 2, 6, hairDark);
              }
            }
          } else if (braids === "Double") {
            const ponyLen = (len) => {
              if (len === "Long") return 26;
              if (len === "Medium") return 18;
              if (len === "Thin") return 14;
              return 12;
            };
            const drawTwin = (yStart, width, len, side) => {
              const h = ponyLen(len);
              if (side !== "Right") {
                drawRect(10, yStart, width, h, hair);
                drawRect(10 + Math.floor(width / 2), yStart + h, 2, 6, hairDark);
              }
              if (side !== "Left") {
                drawRect(50, yStart, width, h, hair);
                drawRect(50 + Math.floor(width / 2), yStart + h, 2, 6, hairDark);
              }
            };
            if (doubleStyle === "Twin ponytails") {
              drawTwin(24, 4, doubleLen, doubleSide);
            } else if (doubleStyle === "Low twin ponytails") {
              drawTwin(30, lowTwinLen === "Thin" ? 3 : 4, lowTwinLen, doubleSide);
            } else if (doubleStyle === "High twin ponytails") {
              drawTwin(20, 4, "Short", doubleSide);
            } else if (doubleStyle === "Braided pigtails 1") {
              drawTwin(26, 4, "Medium", doubleSide);
              if (doubleSide !== "Right") drawRect(12, 36, 2, 8, hairDark);
              if (doubleSide !== "Left") drawRect(52, 36, 2, 8, hairDark);
            } else if (doubleStyle === "Braided pigtails 2") {
              drawTwin(28, 3, "Short", doubleSide);
              if (doubleSide !== "Right") drawRect(12, 38, 1, 8, hairDark);
              if (doubleSide !== "Left") drawRect(52, 38, 1, 8, hairDark);
            } else if (doubleStyle === "Four ponytails") {
              if (doubleSide !== "Right") {
                drawRect(8, 24, 3, 12, hair);
                drawRect(14, 24, 3, 12, hair);
              }
              if (doubleSide !== "Left") {
                drawRect(47, 24, 3, 12, hair);
                drawRect(53, 24, 3, 12, hair);
              }
            } else if (doubleStyle === "Roman roll") {
              if (doubleSide !== "Right") {
                drawRect(12, 24, 6, 6, hair);
                drawRect(14, 30, 4, 4, hairDark);
              }
              if (doubleSide !== "Left") {
                drawRect(46, 24, 6, 6, hair);
                drawRect(46, 30, 4, 4, hairDark);
              }
            } else {
              drawTwin(24, 4, "Short", doubleSide);
            }
          }
        }

        drawBackHairAndBraids();

        drawEllipse(32, 30, 15, 19, skin);
        drawRect(27, 47, 10, 7, skin);
        drawRect(28, 46, 8, 1, shade(skin, 8));

        drawRect(16, 30, 3, 7, shade(skin, -2));
        drawRect(45, 30, 3, 7, shade(skin, -2));

        const vibe = OPTIONS.genderStyle[parseInt(genderStyle.value, 10)] || "Neutral";
        if (vibe === "Masculine") {
          drawRect(24, 20, 5, 1, shade(skin, -30));
          drawRect(35, 20, 5, 1, shade(skin, -30));
        } else if (vibe === "Feminine") {

          drawRect(24, 30, 2, 2, shade(skin, 20));
          drawRect(38, 30, 2, 2, shade(skin, 20));
          drawRect(23, 27, 3, 1, shade(hair, -10));
          drawRect(38, 27, 3, 1, shade(hair, -10));
        } else {

          drawRect(27, 31, 1, 1, shade(skin, 12));
          drawRect(36, 31, 1, 1, shade(skin, 12));
        }

        drawEllipse(32, 14, 20, 10, hair);
        drawRect(12, 16, 40, 10, hair);

        drawRect(14, 10, 36, 3, hairLight);
        drawRect(14, 22, 36, 2, hairDark);

        const fringeHeightsByStyle = {
          "Blocky Bangs": [11, 11, 11, 11, 11, 11, 11],
          "Feathery Strands": [5, 8, 6, 9, 6, 8, 5],
          "Cat Ear Fringe": [12, 9, 7, 6, 7, 9, 12],
          "Zigzag Fringe": [5, 11, 6, 10, 6, 11, 5],
          "Asymmetrical Cat Bangs": [4, 6, 8, 10, 12, 12, 11],
          "Heart Peak Fringe": [10, 9, 8, 6, 8, 9, 10],
          "Thick Block Fringe": [13, 13, 13, 13, 13, 13, 13],
          "Single Cat Ear Fringe": [13, 11, 8, 7, 6, 6, 5],
          "Asymmetrical Block Fringe": [12, 12, 10, 10, 8, 8, 6],
          "Simplified Asymmetrical Fringe": [9, 9, 8, 8, 7, 7, 6],
          "One-Sided Swept Fringe": [4, 5, 6, 8, 11, 13, 12],
        };
        const sideAwareFronts = new Set([
          "Single Cat Ear Fringe",
          "Asymmetrical Block Fringe",
          "Simplified Asymmetrical Fringe",
          "One-Sided Swept Fringe",
        ]);
        const baseFringeHeights = fringeHeightsByStyle[front] || fringeHeightsByStyle["Blocky Bangs"];
        const fringeHeights = sideAwareFronts.has(front) && frontSide === "Right"
          ? baseFringeHeights.slice().reverse()
          : baseFringeHeights;
        let fx = 18;
        fringeHeights.forEach((h) => {
          drawRect(fx, 22, 2, h, hair);
          fx += 2;
        });
        if (temples === "Soft") {
          drawRect(14, 26, 4, 8, hair);
          drawRect(46, 26, 4, 8, hair);
        } else if (temples === "Sharp") {
          drawRect(14, 24, 3, 10, hairDark);
          drawRect(47, 24, 3, 10, hairDark);
        } else if (temples === "Long") {
          drawRect(12, 24, 4, 18, hair);
          drawRect(48, 24, 4, 18, hair);
        }

        if (highlight) {
          drawRect(22, 12, 3, 10, highlight);
          drawRect(39, 12, 3, 10, highlight);
          if (backType !== "Other" && backLength === "Medium") {
            drawRect(10, 26, 2, 12, highlight);
            drawRect(52, 26, 2, 12, highlight);
          }
          if (backType !== "Other" && backLength === "Long") {
            drawRect(8, 28, 2, 16, highlight);
            drawRect(54, 28, 2, 16, highlight);
          }
        } else {

          drawRect(23, 12, 2, 10, hairLight);
          drawRect(39, 12, 2, 10, hairLight);
        }

        const eyeForm = OPTIONS.eyeShape[parseInt(eyeShape.value, 10)] || "Normal";
        const winkSide = OPTIONS.eyeWinkSide[parseInt(eyeWinkSide?.value || "0", 10)] || "Both";
        const closedSide = OPTIONS.eyeClosedSide
          ? (OPTIONS.eyeClosedSide[parseInt(eyeClosedSide?.value || "0", 10)] || "Both")
          : "Both";
        const winkSecond = OPTIONS.eyeWinkSecond[parseInt(eyeWinkSecond?.value || "0", 10)] || "Normal";
        const activeSide = eyeForm === "Wink" ? winkSide : closedSide;
        let leftForm = eyeForm;
        let rightForm = eyeForm;
        if (eyeForm === "Wink" || eyeForm === "Closed") {
          if (activeSide === "Left") {
            leftForm = eyeForm;
            rightForm = winkSecond;
          } else if (activeSide === "Right") {
            leftForm = winkSecond;
            rightForm = eyeForm;
          } else {
            leftForm = eyeForm;
            rightForm = eyeForm;
          }
        }
        const drawEye = (x, form, top, bottom, lid) => {
          if (form === "None") return;
          if (form === "Wink") {
            drawRect(x, 29, 10, 1, lid);
            drawRect(x + 2, 30, 6, 1, lid);
            return;
          }
          if (form === "Closed") {
            drawRect(x, 29, 10, 1, lid);
            drawRect(x + 1, 30, 8, 1, lid);
            return;
          }
          if (form === "Normal") {
            drawRect(x, 27, 10, 7, "#ffffff");
            drawRect(x + 2, 28, 6, 3, top);
            drawRect(x + 2, 31, 6, 3, bottom);
            drawRect(x + 3, 30, 3, 3, shade(bottom, -30));
            drawRect(x + 3, 28, 2, 2, "#ffffff");
            drawRect(x, 26, 10, 1, lid);
          } else if (form === "Upturned") {
            drawRect(x, 27, 10, 7, "#ffffff");
            drawRect(x + 2, 28, 6, 3, top);
            drawRect(x + 2, 31, 6, 3, bottom);
            drawRect(x + 3, 30, 3, 3, shade(bottom, -30));
            drawRect(x + 5, 28, 2, 1, "#ffffff");
            drawRect(x + 7, 27, 2, 1, lid);
            drawRect(x, 26, 10, 1, lid);
          } else if (form === "Sleepy") {
            drawRect(x, 30, 10, 3, "#ffffff");
            drawRect(x + 3, 31, 4, 1, bottom);
            drawRect(x, 29, 10, 1, lid);
          }
        };
        const lid = shade(hair, -10);
        const brow = OPTIONS.browShape[parseInt(browShape.value, 10)] || "Normal";
        const browInk = shade(hair, -26);
        const drawBrowPair = (leftPts, rightPts) => {
          leftPts.forEach(([bx, by, bw = 2, bh = 1]) => drawRect(bx, by, bw, bh, browInk));
          rightPts.forEach(([bx, by, bw = 2, bh = 1]) => drawRect(bx, by, bw, bh, browInk));
        };
        if (brow === "Bean") {
          drawBrowPair(
            [[22, 24, 3, 1], [25, 23, 3, 1], [28, 24, 2, 1]],
            [[34, 24, 2, 1], [36, 23, 3, 1], [39, 24, 3, 1]]
          );
        } else if (brow === "Angry") {
          drawBrowPair(
            [[22, 26, 3, 1], [25, 25, 3, 1], [28, 24, 2, 1]],
            [[34, 24, 2, 1], [36, 25, 3, 1], [39, 26, 3, 1]]
          );
        } else if (brow === "Calm") {
          drawBrowPair(
            [[22, 24, 8, 1]],
            [[34, 24, 8, 1]]
          );
        } else if (brow === "Curious") {
          drawBrowPair(
            [[22, 23, 8, 1]],
            [[34, 25, 8, 1]]
          );
        } else {
          drawBrowPair(
            [[22, 24, 8, 1], [24, 23, 4, 1]],
            [[34, 24, 8, 1], [36, 23, 4, 1]]
          );
        }
        drawEye(21, leftForm, leftTop, leftBottom, lid);
        drawEye(33, rightForm, rightTop, rightBottom, lid);

        const nose = OPTIONS.noseShape[parseInt(noseShape.value, 10)];
        if (nose === "Dot") drawRect(31, 34, 2, 2, shade(skin, -25));
        if (nose === "Bridge") { drawRect(31, 33, 2, 3, shade(skin, -25)); }

        const mouth = OPTIONS.mouthShape[parseInt(mouthShape.value, 10)];
        const mouthSizeLabel = OPTIONS.mouthSize[parseInt(mouthSize.value, 10)] || "Small";
        const blazer = OPTIONS.blazerStyle[parseInt(blazerStyle?.value || "0", 10)] || "None";
        const mouthWidth = mouthSizeLabel === "Big" ? 14 : 8;
        const mouthX = 32 - Math.floor(mouthWidth / 2);
        if (mouth === "Normal") {
          drawRect(mouthX, 40, mouthWidth, 1, shade(skin, -35));
        } else if (mouth === "Smile") {
          drawRect(mouthX, 41, mouthWidth, 1, shade(skin, -35));
          drawRect(mouthX, 40, 2, 1, shade(skin, -35));
          drawRect(mouthX + mouthWidth - 2, 40, 2, 1, shade(skin, -35));
        } else if (mouth === "Happy") {
          const lip = shade(skin, -35);
          drawRect(mouthX, 40, 2, 1, lip);
          drawRect(mouthX + mouthWidth - 2, 40, 2, 1, lip);
          drawRect(mouthX + 1, 41, mouthWidth - 2, 1, lip);
          drawRect(mouthX + 2, 42, Math.max(2, mouthWidth - 4), 1, lip);
          if (mouthWidth >= 10) drawRect(mouthX + 3, 43, mouthWidth - 6, 1, lip);
        }

        const outfitType = OPTIONS.outfitStyle[parseInt(outfitStyle.value, 10)];
        if (outfitType === "Standard Collar Shirt") {
          drawRect(20, 52, 24, 8, outfit);
          drawRect(22, 50, 8, 4, outfitLight);
          drawRect(34, 50, 8, 4, outfitLight);
          drawRect(28, 52, 8, 3, outfitShade);
        } else if (outfitType === "Button-Down Collar Shirt") {
          drawRect(20, 52, 24, 10, outfit);
          drawRect(24, 50, 6, 4, outfitLight);
          drawRect(34, 50, 6, 4, outfitLight);
          drawRect(31, 52, 2, 10, outfitShade);
          drawRect(31, 54, 2, 1, "#ffffff");
          drawRect(31, 57, 2, 1, "#ffffff");
          drawRect(31, 60, 2, 1, "#ffffff");
        } else if (outfitType === "Mandarin Collar Shirt") {
          drawRect(20, 52, 24, 10, outfit);
          drawRect(28, 50, 8, 3, outfitLight);
          drawRect(31, 53, 2, 9, outfitShade);
        } else if (outfitType === "Crew Neck T-Shirt") {
          drawRect(18, 52, 28, 10, outfit);
          drawRect(26, 50, 12, 3, outfitShade);
          drawRect(22, 56, 20, 4, outfitLight);
        } else if (outfitType === "Turtleneck Top") {
          drawRect(20, 52, 24, 10, outfit);
          drawRect(27, 49, 10, 4, outfitShade);
          drawRect(24, 56, 16, 2, outfitLight);
        } else if (outfitType === "Turtleneck Sweater") {
          drawRect(18, 52, 28, 6, outfit);
          drawRect(16, 58, 32, 6, outfitLight);
          drawRect(27, 49, 10, 4, outfitShade);
          drawRect(18, 60, 28, 2, outfitShade);
        }

        if (blazer === "Notched Lapel Blazer") {
          const blazerDark = shade(outfit, -28);
          drawRect(18, 52, 28, 10, blazerDark);
          drawRect(22, 52, 8, 6, outfitShade);
          drawRect(34, 52, 8, 6, outfitShade);
          drawRect(30, 52, 4, 10, shade(blazerDark, 10));
          drawRect(30, 55, 4, 1, outfitLight);
          drawRect(30, 58, 4, 1, outfitLight);
        }

      }

      function setLayer(img, filename) {
        if (!img) return;
        const loadToken = String(Date.now() + Math.random());
        img.dataset.layerLoadToken = loadToken;
        img.onerror = null;
        const fileQueue = Array.isArray(filename) ? filename.filter(Boolean) : [filename].filter(Boolean);
        if (fileQueue.length > 0) {
          let idx = 0;
          const tryNext = () => {
            if (img.dataset.layerLoadToken !== loadToken) return;
            if (idx >= fileQueue.length) {
              img.onerror = null;
              img.src = "";
              img.style.display = "none";
              return;
            }
            const current = fileQueue[idx++];
            let triedUpper = false;
            img.onerror = () => {
              if (img.dataset.layerLoadToken !== loadToken) return;
              if (!triedUpper && current.endsWith(".png")) {
                triedUpper = true;
                img.src = `${ILLUSTRATED_BASE}${current.replace(/\.png$/i, ".PNG")}`;
                return;
              }
              tryNext();
            };
            img.src = `${ILLUSTRATED_BASE}${current}`;
            img.style.display = "block";
          };
          tryNext();
        } else {
          img.onerror = null;
          img.src = "";
          img.style.display = "none";
        }
      }

      function slugify(value) {
        return String(value || "")
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      }

      function updateIllustrated() {
        if (!drawBody && !drawNose) return;
        const gender = OPTIONS.genderStyle[parseInt(genderStyle.value, 10)] || "Neutral";
        const genderSlug = slugify(gender);
        let bodyFile = "body_neutral.png";
        if (gender === "Masculine") bodyFile = "body_masculine.png";
        if (gender === "Feminine") bodyFile = "body_feminine.png";

        const nose = OPTIONS.noseShape[parseInt(noseShape.value, 10)] || "Dot";
        let noseFile = "nose_normal.png";
        if (nose === "Dot") noseFile = "nose_dot.png";
        if (nose === "Bridge") noseFile = "nose_bridge.png";

        const outfit = OPTIONS.outfitStyle[parseInt(outfitStyle.value, 10)] || "Standard Collar Shirt";
        const blazer = OPTIONS.blazerStyle[parseInt(blazerStyle?.value || "0", 10)] || "None";
        const outfitFile = `outfit_${slugify(outfit)}_${genderSlug}.png`;
        const blazerFile = blazer === "Notched Lapel Blazer"
          ? `blazer_notched_lapel_blazer_${genderSlug}.png`
          : "";
        const mouth = OPTIONS.mouthShape[parseInt(mouthShape.value, 10)] || "Normal";
        const mouthSz = OPTIONS.mouthSize[parseInt(mouthSize.value, 10)] || "Small";
        const mouthFile = `mouth_${slugify(mouth)}_${slugify(mouthSz)}.png`;
        const eye = OPTIONS.eyeShape[parseInt(eyeShape.value, 10)] || "Normal";
        const eyeGender = gender === "Feminine" ? "feminine" : "neutral";
        const winkSide = OPTIONS.eyeWinkSide[parseInt(eyeWinkSide?.value || "0", 10)] || "Both";
        const winkSecond = OPTIONS.eyeWinkSecond[parseInt(eyeWinkSecond?.value || "0", 10)] || "Normal";
        const closedSide = OPTIONS.eyeClosedSide
          ? (OPTIONS.eyeClosedSide[parseInt(eyeClosedSide?.value || "0", 10)] || "Both")
          : "Both";
        const singleEyeSide = eye === "Wink" ? winkSide : closedSide;
        const hasSingleSidedEye = (eye === "Wink" || eye === "Closed") && singleEyeSide !== "Both";
        const singleSideSlug = slugify(singleEyeSide);
        const openSideSlug = singleSideSlug === "left" ? "right" : "left";
        const otherEyeSlug = slugify(winkSecond);
        const eyeFile = hasSingleSidedEye
          ? [
              `eyes_single_${openSideSlug}_${otherEyeSlug}_${eyeGender}.png`,
              `eyes_single_${openSideSlug}_${otherEyeSlug}_neutral.png`,
            ]
          : eye === "Closed" || eye === "Wink"
            ? ""
            : `eyes_${slugify(eye)}_${eyeGender}.png`;
        const winkFile = eye === "Wink"
          ? hasSingleSidedEye
            ? `eyes_wink_${singleSideSlug}_${eyeGender}.png`
            : `eyes_wink_${slugify(winkSide)}_${eyeGender}.png`
          : "";
        const closedFile = eye === "Closed"
          ? hasSingleSidedEye
            ? [
                `eyes_closed_${singleSideSlug}_${eyeGender}.png`,
                `eyes_closed_${singleSideSlug}_neutral.png`,
                `eyes_closed_${singleSideSlug}.png`,
              ]
            : [
                `eyes_closed_${slugify(closedSide)}_${eyeGender}.png`,
                `eyes_closed_${slugify(closedSide)}_neutral.png`,
                `eyes_closed_${slugify(closedSide)}.png`,
              ]
          : "";
        const brow = OPTIONS.browShape[parseInt(browShape.value, 10)] || "Normal";
        const browFile = `brows_${slugify(brow)}.png`;
        const backType = OPTIONS.hairBack[parseInt(hairBack.value, 10)] || "Straight";
        const backLength = OPTIONS.hairBackLength[parseInt(hairBackLength.value, 10)] || "Short";
        const backOther = OPTIONS.hairBackOther[parseInt(hairBackOther.value, 10)] || "Shoulder-Length Layered";
        const front = OPTIONS.hairFront[parseInt(hairFront.value, 10)] || "Blocky Bangs";
        const frontSide = OPTIONS.hairFrontSide[parseInt(hairFrontSide?.value || "0", 10)] || "Left";
        const temples = OPTIONS.hairTemples[parseInt(hairTemples.value, 10)] || "None";
        const braids = OPTIONS.hairBraids[parseInt(hairBraids.value, 10)] || "None";
        const singlePos = OPTIONS.hairSingleBraidPos[parseInt(hairSingleBraidPos.value, 10)] || "High";
        const singleLen = OPTIONS.hairSingleBraidLen[parseInt(hairSingleBraidLen.value, 10)] || "Short";
        const doubleStyle = OPTIONS.hairDoubleBraidStyle[parseInt(hairDoubleBraidStyle.value, 10)] || "Twin ponytails";
        const doubleSide = OPTIONS.hairDoubleBraidSide[parseInt(hairDoubleBraidSide.value, 10)] || "Both";
        const doubleLen = OPTIONS.hairDoubleBraidLen[parseInt(hairDoubleBraidLen.value, 10)] || "Short";
        const lowTwinLen = OPTIONS.hairLowTwinLen[parseInt(hairLowTwinLen.value, 10)] || "Short";
        const backHairFile = backType === "Base Style"
          ? "hair_back_base_style.png"
          : backType === "Other"
            ? `hair_back_other_${slugify(backOther)}.png`
            : `hair_back_${slugify(backType)}_${slugify(backLength)}.png`;
        const frontHairNeedsSide = front === "Single Cat Ear Fringe"
          || front === "Asymmetrical Block Fringe"
          || front === "Simplified Asymmetrical Fringe"
          || front === "One-Sided Swept Fringe";
        const frontHairFile = frontHairNeedsSide
          ? `hair_front_${slugify(front)}_${slugify(frontSide)}.png`
          : `hair_front_${slugify(front)}.png`;
        const templesFile = temples === "None" ? "" : `hair_temples_${slugify(temples)}.png`;
        let braidsFile = "";
        if (braids === "Single") {
          braidsFile = singlePos === "Ponytail"
            ? `hair_braids_single_ponytail_${slugify(singleLen)}.png`
            : `hair_braids_single_${slugify(singlePos)}.png`;
        } else if (braids === "Double") {
          if (doubleStyle === "Twin ponytails") {
            braidsFile = `hair_braids_double_twin_ponytails_${slugify(doubleLen)}_${slugify(doubleSide)}.png`;
          } else if (doubleStyle === "Low twin ponytails") {
            braidsFile = `hair_braids_double_low_twin_ponytails_${slugify(lowTwinLen)}_${slugify(doubleSide)}.png`;
          } else {
            braidsFile = `hair_braids_double_${slugify(doubleStyle)}_${slugify(doubleSide)}.png`;
          }
        }
        let pupilFile = "pupil.png";
        let showPupil = (pupilToggle ? pupilToggle.checked : true) && eye !== "Wink" && eye !== "Closed";
        if (hasSingleSidedEye && (pupilToggle ? pupilToggle.checked : true)) {
          pupilFile = `pupil_single_${openSideSlug}.png`;
          showPupil = true;
        }

        setLayer(drawBackHair, backHairFile);
        setLayer(drawBody, bodyFile);
        setLayer(drawNose, noseFile);
        setLayer(drawEyes, eyeFile);
        setLayer(drawWink, winkFile);
        setLayer(drawClosed, closedFile);
        setLayer(drawPupil, showPupil ? pupilFile : "");
        setLayer(drawBrows, browFile);
        setLayer(drawMouth, mouthFile);
        setLayer(drawFrontHair, frontHairFile);
        setLayer(drawTemples, templesFile);
        setLayer(drawBraids, braidsFile);
        setLayer(drawOutfit, outfitFile);
        setLayer(drawAccessory, blazerFile);
        updateIllustratedEyeTint();
      }

      function hexToRgba(hex, alpha) {
        const raw = String(hex || "").replace("#", "");
        if (!/^[0-9a-fA-F]{6}$/.test(raw)) return `rgba(0,0,0,${alpha})`;
        const n = parseInt(raw, 16);
        const r = (n >> 16) & 0xff;
        const g = (n >> 8) & 0xff;
        const b = n & 0xff;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      function updateIllustratedEyeTint() {
        if (!drawEyeTint) return;
        const w = 512;
        const h = 512;
        if (drawEyeTint.width !== w) drawEyeTint.width = w;
        if (drawEyeTint.height !== h) drawEyeTint.height = h;
        const tx = drawEyeTint.getContext("2d");
        if (!tx) return;
        tx.clearRect(0, 0, w, h);
        drawEyeTint.style.display = "none";
      }

      let portraitGenerated = false;

      function clearPortraitPreview() {
        ctx.clearRect(0, 0, size * SCALE, size * SCALE);
        [drawBackHair, drawBody, drawNose, drawEyes, drawWink, drawClosed, drawPupil, drawBrows, drawMouth, drawFrontHair, drawTemples, drawBraids, drawOutfit, drawAccessory]
          .forEach((layer) => setLayer(layer, ""));
        updateIllustratedEyeTint();
      }

      function renderPortraitIfGenerated() {
        if (!portraitGenerated) {
          clearPortraitPreview();
          return;
        }
        drawPortrait();
        updateIllustrated();
      }

      function randomizeAll() {
        skinColor.value = String(randIdx(COLORS.skin));
        hairColor.value = String(randIdx(COLORS.hair));
        hairHighlight.value = String(randIdx([0].concat(COLORS.hair.map((_, i) => i + 1))));
        leftEyeColor.value = String(randIdx(COLORS.eyes));
        rightEyeColor.value = String(randIdx(COLORS.eyes));
        leftEyeTop.value = String(randIdx(COLORS.eyes));
        leftEyeBottom.value = String(randIdx(COLORS.eyes));
        rightEyeTop.value = String(randIdx(COLORS.eyes));
        rightEyeBottom.value = String(randIdx(COLORS.eyes));
        if (eyeSpecialToggle) eyeSpecialToggle.checked = Math.random() < 0.35;
        if (pupilToggle) pupilToggle.checked = true;
        hairBack.value = String(randIdx(OPTIONS.hairBack));
        hairBackLength.value = String(randIdx(OPTIONS.hairBackLength));
        hairBackOther.value = String(randIdx(OPTIONS.hairBackOther));
        hairFront.value = String(randIdx(OPTIONS.hairFront));
        hairFrontSide.value = String(randIdx(OPTIONS.hairFrontSide));
        hairTemples.value = String(randIdx(OPTIONS.hairTemples));
        hairBraids.value = String(randIdx(OPTIONS.hairBraids));
        hairSingleBraidPos.value = String(randIdx(OPTIONS.hairSingleBraidPos));
        hairSingleBraidLen.value = String(randIdx(OPTIONS.hairSingleBraidLen));
        hairDoubleBraidStyle.value = String(randIdx(OPTIONS.hairDoubleBraidStyle));
        hairDoubleBraidSide.value = String(randIdx(OPTIONS.hairDoubleBraidSide));
        hairDoubleBraidLen.value = String(randIdx(OPTIONS.hairDoubleBraidLen));
        hairLowTwinLen.value = String(randIdx(OPTIONS.hairLowTwinLen));
        eyeShape.value = String(randIdx(OPTIONS.eyeShape));
        eyeWinkSide.value = String(randIdx(OPTIONS.eyeWinkSide));
        eyeWinkSecond.value = String(randIdx(OPTIONS.eyeWinkSecond));
        eyeClosedSide.value = String(randIdx(OPTIONS.eyeClosedSide));
        browShape.value = String(OPTIONS.browShape.indexOf("Normal"));
        noseShape.value = String(randIdx(OPTIONS.noseShape));
        mouthShape.value = String(randIdx(OPTIONS.mouthShape));
        mouthSize.value = String(randIdx(OPTIONS.mouthSize));
        outfitStyle.value = String(randIdx(OPTIONS.outfitStyle));
        blazerStyle.value = String(randIdx(OPTIONS.blazerStyle));
        outfitColor.value = String(randIdx(COLORS.outfit));
        bgStyle.value = String(randIdx(OPTIONS.bgStyle));
        bgColor.value = String(randIdx(COLORS.background));
        genderStyle.value = String(randIdx(OPTIONS.genderStyle));
        updateEyeVisibility();
        updateMouthSizeVisibility();
        updateBackHairLengthVisibility();
        updateFrontBangSideVisibility();
        updateBraidsAvailability();
        updateDoubleBraidVisibility();
        updateSingleBraidVisibility();
        updateWinkVisibility();
        portraitGenerated = true;
        drawPortrait();
        updateIllustrated();
      }

      function updateEyeVisibility() {
        const special = !!eyeSpecialToggle.checked;
        rightEyeColor.parentElement.style.display = special ? "" : "none";
        leftEyeTop.parentElement.style.display = special ? "" : "none";
        leftEyeBottom.parentElement.style.display = special ? "" : "none";
        rightEyeTop.parentElement.style.display = special ? "" : "none";
        rightEyeBottom.parentElement.style.display = special ? "" : "none";
      }

      function updateWinkVisibility() {
        const eyeForm = OPTIONS.eyeShape[parseInt(eyeShape.value, 10)] || "Normal";
        if (eyeWinkSide) {
          const showSide = eyeForm === "Wink";
          eyeWinkSide.parentElement.style.display = showSide ? "" : "none";
          if (!showSide) eyeWinkSide.value = "0";
        }
        if (eyeClosedSide) {
          const showClosedSide = eyeForm === "Closed";
          eyeClosedSide.parentElement.style.display = showClosedSide ? "" : "none";
          if (!showClosedSide) eyeClosedSide.value = "0";
        }
        if (eyeWinkSecond) {
          const activeSide = eyeForm === "Wink"
            ? (OPTIONS.eyeWinkSide[parseInt(eyeWinkSide?.value || "0", 10)] || "Both")
            : eyeForm === "Closed"
              ? (OPTIONS.eyeClosedSide[parseInt(eyeClosedSide?.value || "0", 10)] || "Both")
              : "Both";
          const showSecond = (eyeForm === "Wink" || eyeForm === "Closed") && activeSide !== "Both";
          eyeWinkSecond.parentElement.style.display = showSecond ? "" : "none";
          if (!showSecond) eyeWinkSecond.value = "0";
        }
      }

      function updateMouthSizeVisibility() {
        const gender = OPTIONS.genderStyle[parseInt(genderStyle.value, 10)] || "Neutral";
        if (!mouthSize) return;
        if (gender === "Neutral") {
          mouthSize.parentElement.style.display = "";
        } else {
          mouthSize.parentElement.style.display = "none";
          mouthSize.value = gender === "Masculine" ? "1" : "0";
        }
      }

      function updateFrontBangSideVisibility() {
        if (!hairFrontSide || !hairFront) return;
        const front = OPTIONS.hairFront[parseInt(hairFront.value, 10)] || "Blocky Bangs";
        const special = front === "Single Cat Ear Fringe"
          || front === "Asymmetrical Block Fringe"
          || front === "Simplified Asymmetrical Fringe"
          || front === "One-Sided Swept Fringe";
        hairFrontSide.parentElement.style.display = special ? "" : "none";
        if (!special) hairFrontSide.value = "0";
      }

      function updateDoubleBraidVisibility() {
        const braids = OPTIONS.hairBraids[parseInt(hairBraids.value, 10)] || "None";
        if (hairDoubleBraidStyle) {
          hairDoubleBraidStyle.parentElement.style.display = braids === "Double" ? "" : "none";
          if (braids !== "Double") hairDoubleBraidStyle.value = "0";
        }
        if (hairDoubleBraidSide) {
          hairDoubleBraidSide.parentElement.style.display = braids === "Double" ? "" : "none";
          if (braids !== "Double") hairDoubleBraidSide.value = "0";
        }
        const style = OPTIONS.hairDoubleBraidStyle[parseInt(hairDoubleBraidStyle?.value || "0", 10)] || "Twin ponytails";
        if (hairDoubleBraidLen) {
          const showTwin = braids === "Double" && style === "Twin ponytails";
          hairDoubleBraidLen.parentElement.style.display = showTwin ? "" : "none";
          if (!showTwin) hairDoubleBraidLen.value = "0";
        }
        if (hairLowTwinLen) {
          const showLowTwin = braids === "Double" && style === "Low twin ponytails";
          hairLowTwinLen.parentElement.style.display = showLowTwin ? "" : "none";
          if (!showLowTwin) hairLowTwinLen.value = "0";
        }
      }

      function updateSingleBraidVisibility() {
        const braids = OPTIONS.hairBraids[parseInt(hairBraids.value, 10)] || "None";
        if (hairSingleBraidPos) {
          hairSingleBraidPos.parentElement.style.display = braids === "Single" ? "" : "none";
          if (braids !== "Single") hairSingleBraidPos.value = "0";
        }
        if (hairSingleBraidLen) {
          const pos = OPTIONS.hairSingleBraidPos[parseInt(hairSingleBraidPos?.value || "0", 10)] || "High";
          if (braids === "Single" && pos === "Ponytail") {
            hairSingleBraidLen.parentElement.style.display = "";
          } else {
            hairSingleBraidLen.parentElement.style.display = "none";
            hairSingleBraidLen.value = "0";
          }
        }
      }

      function updateBraidsAvailability() {
        const backType = OPTIONS.hairBack[parseInt(hairBack.value, 10)] || "Base Style";
        const enabled = backType === "Base Style";
        if (hairBraids) {
          hairBraids.parentElement.style.display = enabled ? "" : "none";
          if (!enabled) hairBraids.value = "0";
        }
        if (!enabled) {
          if (hairSingleBraidPos) hairSingleBraidPos.value = "0";
          if (hairSingleBraidLen) hairSingleBraidLen.value = "0";
          if (hairDoubleBraidStyle) hairDoubleBraidStyle.value = "0";
          if (hairDoubleBraidSide) hairDoubleBraidSide.value = "0";
          if (hairDoubleBraidLen) hairDoubleBraidLen.value = "0";
          if (hairLowTwinLen) hairLowTwinLen.value = "0";
        }
      }

      function updateBackHairLengthVisibility() {
        const backType = OPTIONS.hairBack[parseInt(hairBack.value, 10)] || "Straight";
        if (!hairBackLength) return;
        if (backType === "Other") {
          hairBackLength.parentElement.style.display = "none";
          hairBackLength.value = "0";
          if (hairBackOther) {
            hairBackOther.parentElement.style.display = "";
          }
        } else if (backType === "Base Style") {
          hairBackLength.parentElement.style.display = "none";
          hairBackLength.value = "0";
          if (hairBackOther) {
            hairBackOther.parentElement.style.display = "none";
            hairBackOther.value = "0";
          }
        } else {
          hairBackLength.parentElement.style.display = "";
          if (hairBackOther) {
            hairBackOther.parentElement.style.display = "none";
            hairBackOther.value = "0";
          }
        }
      }

      [
        skinColor, hairColor, hairHighlight, leftEyeColor, rightEyeColor, leftEyeTop, leftEyeBottom, rightEyeTop, rightEyeBottom,
        hairBack, hairBackLength, hairBackOther, hairFront, hairFrontSide, hairTemples, hairBraids, hairSingleBraidPos, hairSingleBraidLen, hairDoubleBraidStyle, hairDoubleBraidSide, hairDoubleBraidLen, hairLowTwinLen, eyeShape, eyeWinkSide, eyeWinkSecond, eyeClosedSide,
        noseShape, mouthShape, mouthSize, browShape, outfitStyle, blazerStyle, outfitColor, bgStyle, bgColor, genderStyle
      ].forEach((el) => el.addEventListener("change", () => {
        updateEyeVisibility();
        updateMouthSizeVisibility();
        updateBackHairLengthVisibility();
        updateFrontBangSideVisibility();
        updateBraidsAvailability();
        updateDoubleBraidVisibility();
        updateSingleBraidVisibility();
        updateWinkVisibility();
        renderPortraitIfGenerated();
      }));

      eyeSpecialToggle.addEventListener("change", () => {
        updateEyeVisibility();
        renderPortraitIfGenerated();
      });

      if (pupilToggle) {
        pupilToggle.addEventListener("change", () => {
          renderPortraitIfGenerated();
        });
      }

      previewBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          portraitGenerated = true;
          drawPortrait();
          updateIllustrated();
        });
      });

      randomBtn.addEventListener("click", randomizeAll);

      function exportIllustratedCanvas() {
        if (!illustratedPortrait) return null;
        const out = document.createElement("canvas");
        const size = 512;
        out.width = size;
        out.height = size;
        const outCtx = out.getContext("2d");
        if (!outCtx) return null;

        const layerOrder = [
          "drawBackHair",
          "drawBody",
          "drawNose",
          "drawEyes",
          "drawEyeTint",
          "drawWink",
          "drawClosed",
          "drawPupil",
          "drawBrows",
          "drawMouth",
          "drawFrontHair",
          "drawTemples",
          "drawBraids",
          "drawOutfit",
          "drawAccessory",
        ];

        layerOrder.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          if (getComputedStyle(el).display === "none") return;

          if (el.tagName === "IMG") {
            const img = el;
            if (!img.src || !img.complete || !img.naturalWidth) return;
            outCtx.drawImage(img, 0, 0, size, size);
            return;
          }
          if (el.tagName === "CANVAS") {
            const layerCanvas = el;
            outCtx.drawImage(layerCanvas, 0, 0, size, size);
          }
        });

        return out;
      }

      downloadBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = "spiretz-portrait.png";
        const isIllustrated = portraitViewIllustrated && portraitViewIllustrated.classList.contains("active");
        const exportCanvas = isIllustrated ? (exportIllustratedCanvas() || canvas) : canvas;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
      });

      function setPortraitView(view) {
        if (portraitViewPixel) {
          portraitViewPixel.classList.toggle("active", view === "pixel");
        }
        if (portraitViewIllustrated) {
          portraitViewIllustrated.classList.toggle("active", view === "illustrated");
        }
        portraitTabs.forEach((tab) => {
          tab.classList.toggle("active", tab.dataset.portraitView === view);
        });
      }

      portraitTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          setPortraitView(tab.dataset.portraitView || "pixel");
        });
      });

      updateEyeVisibility();
      updateMouthSizeVisibility();
      updateBackHairLengthVisibility();
      updateFrontBangSideVisibility();
      updateBraidsAvailability();
      updateDoubleBraidVisibility();
      updateSingleBraidVisibility();
      updateWinkVisibility();
      clearPortraitPreview();
      setPortraitView("pixel");

      window.renderPortraitFromControls = function renderPortraitFromControls() {
        portraitGenerated = true;
        drawPortrait();
        updateIllustrated();
      };
    })();

    // ===== Share Your Character =====
    (function () {
      const shareCode = document.getElementById("shareCode");
      const shareGenerate = document.getElementById("shareGenerate");
      const shareApply = document.getElementById("shareApply");
      const shareStatus = document.getElementById("shareStatus");
      const fullNameOut = document.getElementById("fullNameOut");
      const nameIpaOut = document.getElementById("nameIpaOut");
      const nameStatusOut = document.getElementById("nameStatusOut");
      const regenNameBtn = document.getElementById("regenNameBtn");

      if (!shareCode || !shareGenerate || !shareApply || !shareStatus) return;

      const PREFIX = "SPIRETZ1:";

      function encode(obj) {
        const json = JSON.stringify(obj);
        const b64 = btoa(unescape(encodeURIComponent(json)));
        return PREFIX + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      }

      function decode(str) {
        if (!str.startsWith(PREFIX)) throw new Error("Invalid code (missing prefix).");
        let b64 = str.slice(PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const json = decodeURIComponent(escape(atob(b64)));
        return JSON.parse(json);
      }

      function setValue(el, value, eventType) {
        if (!el) return;
        el.value = value;
        const evt = new Event(eventType || "change", { bubbles: true });
        el.dispatchEvent(evt);
      }

      function optionLabel(id, optionsKey) {
        const el = document.getElementById(id);
        const opts = window.PORTRAIT_OPTIONS && window.PORTRAIT_OPTIONS[optionsKey];
        if (!el || !opts) return "";
        return opts[parseInt(el.value || "0", 10)] || "";
      }

      function setByLabelOrValue(id, value, label, optionsKey) {
        const el = document.getElementById(id);
        if (!el) return;
        const opts = window.PORTRAIT_OPTIONS && window.PORTRAIT_OPTIONS[optionsKey];
        if (label && opts && Array.isArray(opts)) {
          const idx = opts.indexOf(label);
          if (idx >= 0) {
            setValue(el, String(idx));
            return;
          }
        }
        setValue(el, value || "0");
      }

      function buildPayload() {
        const generatedFullName = (fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—")
          ? fullNameOut.textContent
          : "";
        const generatedNameIpa = (nameIpaOut && nameIpaOut.textContent && nameIpaOut.textContent !== "—")
          ? nameIpaOut.textContent
          : "";
        return {
          name: {
            firstMode: document.getElementById("firstMode")?.value || "random",
            firstSyl: document.getElementById("firstSyl")?.value || "2",
            customFirst: document.getElementById("customFirst")?.value || "",
            lastMode: document.getElementById("lastMode")?.value || "random",
            lastSyl: document.getElementById("lastSyl")?.value || "2",
            customLast: document.getElementById("customLast")?.value || "",
            middleMode: document.getElementById("middleMode")?.value || "none",
            middleSyl: document.getElementById("middleSyl")?.value || "2",
            customMiddle: document.getElementById("customMiddle")?.value || "",
            nameStyle: document.getElementById("nameStyle")?.value || "none",
            gender: document.getElementById("genderSelect")?.value || "tatie",
            generatedFullName,
            generatedNameIpa,
          },
          birthday: {
            year: document.getElementById("birthYear")?.value || "",
            month: document.getElementById("birthMonth")?.value || "0",
            day: document.getElementById("birthDay")?.value || "",
          },
          portrait: {
            skinColor: document.getElementById("skinColor")?.value || "0",
            hairColor: document.getElementById("hairColor")?.value || "0",
            hairHighlight: document.getElementById("hairHighlight")?.value || "0",
            leftEyeColor: document.getElementById("leftEyeColor")?.value || "0",
            rightEyeColor: document.getElementById("rightEyeColor")?.value || "0",
            leftEyeTop: document.getElementById("leftEyeTop")?.value || "0",
            leftEyeBottom: document.getElementById("leftEyeBottom")?.value || "0",
            rightEyeTop: document.getElementById("rightEyeTop")?.value || "0",
            rightEyeBottom: document.getElementById("rightEyeBottom")?.value || "0",
            eyeSpecial: document.getElementById("eyeSpecialToggle")?.checked ? "1" : "0",
            pupil: document.getElementById("pupilToggle")?.checked ? "1" : "0",
            eyeWinkSide: document.getElementById("eyeWinkSide")?.value || "0",
            eyeWinkSecond: document.getElementById("eyeWinkSecond")?.value || "0",
            eyeClosedSide: document.getElementById("eyeClosedSide")?.value || "0",
            eyeWinkSideLabel: optionLabel("eyeWinkSide", "eyeWinkSide"),
            eyeWinkSecondLabel: optionLabel("eyeWinkSecond", "eyeWinkSecond"),
            eyeClosedSideLabel: optionLabel("eyeClosedSide", "eyeClosedSide"),
            browShape: document.getElementById("browShape")?.value || "0",
            hairBack: document.getElementById("hairBack")?.value || "0",
            hairBackLength: document.getElementById("hairBackLength")?.value || "0",
            hairBackOther: document.getElementById("hairBackOther")?.value || "0",
            hairFront: document.getElementById("hairFront")?.value || "0",
            hairFrontSide: document.getElementById("hairFrontSide")?.value || "0",
            hairFrontLabel: optionLabel("hairFront", "hairFront"),
            hairFrontSideLabel: optionLabel("hairFrontSide", "hairFrontSide"),
            hairTemples: document.getElementById("hairTemples")?.value || "0",
            hairBraids: document.getElementById("hairBraids")?.value || "0",
            hairSingleBraidPos: document.getElementById("hairSingleBraidPos")?.value || "0",
            hairSingleBraidLen: document.getElementById("hairSingleBraidLen")?.value || "0",
            hairDoubleBraidStyle: document.getElementById("hairDoubleBraidStyle")?.value || "0",
            hairDoubleBraidSide: document.getElementById("hairDoubleBraidSide")?.value || "0",
            hairDoubleBraidLen: document.getElementById("hairDoubleBraidLen")?.value || "0",
            hairLowTwinLen: document.getElementById("hairLowTwinLen")?.value || "0",
            eyeShape: document.getElementById("eyeShape")?.value || "0",
            eyeShapeLabel: optionLabel("eyeShape", "eyeShape"),
            noseShape: document.getElementById("noseShape")?.value || "0",
            mouthShape: document.getElementById("mouthShape")?.value || "0",
            mouthSize: document.getElementById("mouthSize")?.value || "0",
            outfitStyle: document.getElementById("outfitStyle")?.value || "0",
            blazerStyle: document.getElementById("blazerStyle")?.value || "0",
            outfitStyleLabel: optionLabel("outfitStyle", "outfitStyle"),
            blazerStyleLabel: optionLabel("blazerStyle", "blazerStyle"),
            outfitColor: document.getElementById("outfitColor")?.value || "0",
            bgStyle: document.getElementById("bgStyle")?.value || "0",
            bgColor: document.getElementById("bgColor")?.value || "0",
            genderStyle: document.getElementById("genderStyle")?.value || "0",
          }
        };
      }

      function applyPayload(data) {
        const n = data.name || {};
        setValue(document.getElementById("firstMode"), n.firstMode || "random");
        setValue(document.getElementById("firstSyl"), n.firstSyl || "2");
        setValue(document.getElementById("customFirst"), n.customFirst || "", "input");

        setValue(document.getElementById("lastMode"), n.lastMode || "random");
        setValue(document.getElementById("lastSyl"), n.lastSyl || "2");
        setValue(document.getElementById("customLast"), n.customLast || "", "input");

        setValue(document.getElementById("middleMode"), n.middleMode || "none");
        setValue(document.getElementById("middleSyl"), n.middleSyl || "2");
        setValue(document.getElementById("customMiddle"), n.customMiddle || "", "input");

        setValue(document.getElementById("nameStyle"), n.nameStyle || "none");
        const savedPronounClass = n.gender || "tatie";
        const mappedPronounClass =
          (savedPronounClass === "male" || savedPronounClass === "female" || savedPronounClass === "nb")
            ? "spirete"
            : (savedPronounClass === "unknown" ? "tatie" : savedPronounClass);
        setValue(document.getElementById("genderSelect"), mappedPronounClass);
        const loadedName = typeof n.generatedFullName === "string" ? n.generatedFullName.trim() : "";
        const loadedIpa = typeof n.generatedNameIpa === "string" ? n.generatedNameIpa.trim() : "";
        if (loadedName && fullNameOut) {
          fullNameOut.textContent = loadedName;
          if (nameIpaOut) nameIpaOut.textContent = loadedIpa || "—";
          if (nameStatusOut) {
            nameStatusOut.textContent = IS_ZH ? "已从分享码载入姓名。" : "Name loaded from share code.";
          }
        }

        const b = data.birthday || {};
        setValue(document.getElementById("birthYear"), b.year || "", "input");
        setValue(document.getElementById("birthMonth"), b.month || "0");
        setValue(document.getElementById("birthDay"), b.day || "", "input");

        const p = data.portrait || {};
        setValue(document.getElementById("skinColor"), p.skinColor || "0");
        setValue(document.getElementById("hairColor"), p.hairColor || "0");
        setValue(document.getElementById("hairHighlight"), p.hairHighlight || "0");
        setValue(document.getElementById("leftEyeColor"), p.leftEyeColor || "0");
        const eyeSpecial = document.getElementById("eyeSpecialToggle");
        if (eyeSpecial) {
          eyeSpecial.checked = p.eyeSpecial === "1";
          eyeSpecial.dispatchEvent(new Event("change", { bubbles: true }));
        }
        setValue(document.getElementById("rightEyeColor"), p.rightEyeColor || "0");
        setValue(document.getElementById("leftEyeTop"), p.leftEyeTop || "0");
        setValue(document.getElementById("leftEyeBottom"), p.leftEyeBottom || "0");
        setValue(document.getElementById("rightEyeTop"), p.rightEyeTop || "0");
        setValue(document.getElementById("rightEyeBottom"), p.rightEyeBottom || "0");
        const pupilToggle = document.getElementById("pupilToggle");
        if (pupilToggle) {
          pupilToggle.checked = p.pupil !== "0";
          pupilToggle.dispatchEvent(new Event("change", { bubbles: true }));
        }
        setByLabelOrValue("eyeWinkSide", p.eyeWinkSide || "0", p.eyeWinkSideLabel, "eyeWinkSide");
        setByLabelOrValue("eyeWinkSecond", p.eyeWinkSecond || "0", p.eyeWinkSecondLabel, "eyeWinkSecond");
        setByLabelOrValue("eyeClosedSide", p.eyeClosedSide || "0", p.eyeClosedSideLabel, "eyeClosedSide");
        setValue(document.getElementById("browShape"), p.browShape || "0");
        setValue(document.getElementById("hairBack"), p.hairBack || "0");
        setValue(document.getElementById("hairBackLength"), p.hairBackLength || "0");
        setValue(document.getElementById("hairBackOther"), p.hairBackOther || "0");
        setByLabelOrValue("hairFront", p.hairFront || p.hairBangs || "0", p.hairFrontLabel, "hairFront");
        setByLabelOrValue("hairFrontSide", p.hairFrontSide || p.hairBangsSide || "0", p.hairFrontSideLabel || p.hairBangsSideLabel, "hairFrontSide");
        setValue(document.getElementById("hairTemples"), p.hairTemples || "0");
        setValue(document.getElementById("hairBraids"), p.hairBraids || "0");
        setValue(document.getElementById("hairSingleBraidPos"), p.hairSingleBraidPos || "0");
        setValue(document.getElementById("hairSingleBraidLen"), p.hairSingleBraidLen || "0");
        setValue(document.getElementById("hairDoubleBraidStyle"), p.hairDoubleBraidStyle || "0");
        setValue(document.getElementById("hairDoubleBraidSide"), p.hairDoubleBraidSide || "0");
        setValue(document.getElementById("hairDoubleBraidLen"), p.hairDoubleBraidLen || "0");
        setValue(document.getElementById("hairLowTwinLen"), p.hairLowTwinLen || "0");
        setByLabelOrValue("eyeShape", p.eyeShape || "0", p.eyeShapeLabel, "eyeShape");
        setValue(document.getElementById("noseShape"), p.noseShape || "0");
        setValue(document.getElementById("mouthShape"), p.mouthShape || "0");
        setValue(document.getElementById("mouthSize"), p.mouthSize || "0");
        setByLabelOrValue("outfitStyle", p.outfitStyle || "0", p.outfitStyleLabel, "outfitStyle");
        setByLabelOrValue("blazerStyle", p.blazerStyle || "0", p.blazerStyleLabel, "blazerStyle");
        setValue(document.getElementById("outfitColor"), p.outfitColor || "0");
        setValue(document.getElementById("bgStyle"), p.bgStyle || "0");
        setValue(document.getElementById("bgColor"), p.bgColor || "0");
        setValue(document.getElementById("genderStyle"), p.genderStyle || "0");
        if (typeof window.renderPortraitFromControls === "function") {
          window.renderPortraitFromControls();
        }
      }

      shareGenerate.addEventListener("click", () => {
        try {
          const payload = buildPayload();
          shareCode.value = encode(payload);
          shareStatus.textContent = IS_ZH ? "代码已生成 ✅" : "Code generated ✅";
        } catch (e) {
          shareStatus.textContent = IS_ZH ? `错误：${e.message}` : `Error: ${e.message}`;
        }
      });

      shareApply.addEventListener("click", () => {
        try {
          const data = decode(shareCode.value.trim());
          applyPayload(data);
          const hasLoadedName = fullNameOut && fullNameOut.textContent && fullNameOut.textContent !== "—";
          if (!hasLoadedName && regenNameBtn) {
            regenNameBtn.click();
          }
          shareStatus.textContent = IS_ZH ? "代码已加载 ✅" : "Code loaded ✅";
        } catch (e) {
          shareStatus.textContent = IS_ZH ? `错误：${e.message}` : `Error: ${e.message}`;
        }
      });
    })();

    // ===== Resources: Spiretz Lexicon =====
    (function () {
      const verbTbody = document.getElementById("verbLexiconBody");
      const nounTbody = document.getElementById("nounLexiconBody");
      const adjectiveTbody = document.getElementById("adjectiveLexiconBody");
      const adverbTbody = document.getElementById("adverbLexiconBody");
      const prepositionTbody = document.getElementById("prepositionLexiconBody");
      const conjunctionTbody = document.getElementById("conjunctionLexiconBody");
      const questionTbody = document.getElementById("questionLexiconBody");
      if (!verbTbody && !nounTbody && !adjectiveTbody && !adverbTbody && !prepositionTbody && !conjunctionTbody && !questionTbody) return;
      const meaningMap = window.SPIRETZ_ZH_MEANING || {};
      const VERB_LEXICON_OVERRIDES = {
        lion: { pronunciation: "[lˈion]", syllables: "li.on" },
        kuma: { pronunciation: "[kˈumɑ]", syllables: "ku.ma" },
      };
      const VERBS = [
        ["ampi","believe"],
        ["ampiria","hope"],
        ["eya","be"],
        ["aye","have"],
        ["beya","need, want"],
        ["dara","dance"],
        ["daresu","understand"],
        ["daro","suppose; assume"],
        ["davi","lose"],
        ["daze","close"],
        ["dezu","explain"],
        ["doye","cause; make"],
        ["dravo","arrive"],
        ["fane","end; finish"],
        ["fireno","request"],
        ["folo","forget"],
        ["fure","rest"],
        ["fureyi","continue"],
        ["gavu","eat"],
        ["golu","drink"],
        ["heta","speak; say"],
        ["heti","listen"],
        ["hodape","open"],
        ["kamio","know"],
        ["lion","like"],
        ["kame","consider"],
        ["kampi","keep"],
        ["kamu","think"],
        ["korati","challenge"],
        ["krei","do; make"],
        ["krichei","decide"],
        ["lanko","belong to"],
        ["lavi","love"],
        ["laza","play"],
        ["liguria","shine; illuminate"],
        ["lika","read"],
        ["lume","research; study"],
        ["lure","talk; converse"],
        ["meli","remember"],
        ["melu","miss"],
        ["mezu","write"],
        ["mie","meet"],
        ["miori","participate"],
        ["mire","describe"],
        ["mura","marry"],
        ["namu","be called; be named"],
        ["nata","put; place"],
        ["navine","walk"],
        ["nelu","search; look for"],
        ["novi","follow"],
        ["oio","regard as; treat as"],
        ["parale","leave"],
        ["petra","rise"],
        ["poso","occupy"],
        ["pozo","prove"],
        ["praisa","aim at"],
        ["praise","guide"],
        ["trine","ask"],
        ["kuma","choose"],
        ["amperio","protect; guard"],
        ["petrio","raise; lift up"],
        ["rake","get; obtain"],
        ["raku","prepare"],
        ["reni","answer"],
        ["revo","run"],
        ["revu","return"],
        ["sela","tell"],
        ["sire","paint"],
        ["sola","sleep"],
        ["megolvia","sing"],
        ["soraye","study; learn"],
        ["sorae","teach"],
        ["fizro","count"],
        ["su","live; exist"],
        ["suri","live"],
        ["tamu","work"],
        ["tira","come"],
        ["tiru","bring"],
        ["tori","carry"],
        ["trake","begin; start"],
        ["tra","stand"],
        ["trepsa","oppose"],
        ["trive","share"],
        ["vayi","want"],
        ["veli","wait"],
        ["veska","travel"],
        ["veskari","please"],
        ["vese","see"],
        ["vire","receive"],
        ["vona","watch"],
        ["zanu","appreciate; admire"],
        ["zeyo","go"],
        ["zeyu","should"],
        ["zima","buy"],
      ];
      const VERB_VALENCY = {
        ampi: "T",
        ampiria: "I",
        eya: "I",
        aye: "T",
        beya: "T",
        dara: "I",
        daresu: "T",
        daro: "T",
        davi: "T",
        daze: "T",
        dezu: "T",
        doye: "T",
        dravo: "I",
        fane: "T",
        fireno: "T",
        folo: "T",
        fure: "I",
        fureyi: "I",
        gavu: "T",
        golu: "T",
        heta: "T",
        heti: "T",
        hodape: "T",
        kamio: "T",
        lion: "T",
        kame: "T",
        kampi: "T",
        kamu: "I",
        korati: "T",
        krei: "T",
        krichei: "T",
        lanko: "I",
        lavi: "T",
        laza: "I",
        liguria: "I",
        lika: "T",
        lume: "T",
        lure: "I",
        meli: "T",
        melu: "T",
        mezu: "T",
        mie: "T",
        miori: "I",
        mire: "T",
        mura: "I",
        namu: "I",
        nata: "T",
        navine: "I",
        nelu: "T",
        novi: "T",
        oio: "T",
        parale: "I",
        petra: "I",
        poso: "T",
        pozo: "T",
        praisa: "I",
        praise: "T",
        trine: "T",
        kuma: "T",
        amperio: "T",
        petrio: "T",
        rake: "T",
        raku: "T",
        reni: "T",
        revo: "I",
        revu: "I",
        sela: "T",
        sire: "T",
        sola: "I",
        megolvia: "I",
        soraye: "T",
        sorae: "T",
        fizro: "T",
        su: "I",
        suri: "I",
        tamu: "I",
        tira: "I",
        tiru: "T",
        tori: "T",
        trake: "I",
        tra: "I",
        trepsa: "T",
        trive: "T",
        vayi: "T",
        veli: "I",
        veska: "I",
        veskari: "I",
        vese: "T",
        vire: "T",
        vona: "T",
        zanu: "T",
        zeyo: "I",
        zeyu: "I",
        zima: "T",
      };
      const NOUNS = [
        { sp: "amperial", meaning: "wish", pronunciation: "[ampeɹ'ial]", syllables: "am.pe.ri.al" },
        { sp: "amperiom", meaning: "guard; protection", pronunciation: "[ampeɹ'iom]", syllables: "am.pe.ri.om" },
        { sp: "chind", meaning: "window", pronunciation: "[ʧ'ind]", syllables: "chind" },
        { sp: "coranir", meaning: "nationality", pronunciation: "[koɹ'anir]", syllables: "co.ra.nir" },
        { sp: "koratim", meaning: "challenge", pronunciation: "[koɹ'atim]", syllables: "ko.ra.tim" },
        { sp: "corutal", meaning: "country", pronunciation: "[koɹ'utal]", syllables: "co.ru.tal" },
        { sp: "kricheik", meaning: "decision", pronunciation: "[kɹiʧ'ek]", syllables: "kri.cheik" },
        { sp: "diaspartas", meaning: "heart", pronunciation: "[diasp'artas]", syllables: "di.as.par.tas" },
        { sp: "domat", meaning: "hand", pronunciation: "[d'omat]", syllables: "do.mat" },
        { sp: "enatur", meaning: "nature", pronunciation: "[ɛn'atuɹ]", syllables: "e.na.tur" },
        { sp: "firek", meaning: "driver", pronunciation: "[f'iɹek]", syllables: "fi.rek" },
        { sp: "varionrat", meaning: "dictionary", pronunciation: "[vaɹion'ɹat]", syllables: "va.ri.on.rat" },
        { sp: "fizros", meaning: "number", pronunciation: "[f'izɹos]", syllables: "fi.zros" },
        { sp: "gayuras", meaning: "language", pronunciation: "[gaj'uras]", syllables: "ga.yu.ras" },
        { sp: "kam", meaning: "mind", pronunciation: "[k'am]", syllables: "kam" },
        { sp: "kamis", meaning: "knowledge", pronunciation: "[k'amis]", syllables: "ka.mis" },
        { sp: "kamiren", meaning: "intelligence", pronunciation: "[kam'iɹen]", syllables: "ka.mi.ren" },
        { sp: "kaminan", meaning: "wisdom", pronunciation: "[kam'inan]", syllables: "ka.mi.nan" },
        { sp: "ligur", meaning: "light, flash", pronunciation: "[l'iguɹ]", syllables: "li.gur" },
        { sp: "lovek", meaning: "pencil", pronunciation: "[l'ovek]", syllables: "lo.vek" },
        { sp: "lumisar", meaning: "photo", pronunciation: "[lum'isaɹ]", syllables: "lu.mi.sar" },
        { sp: "lumivis", meaning: "video", pronunciation: "[lum'ivis]", syllables: "lu.mi.vis" },
        { sp: "medagel", meaning: "door", pronunciation: "[med'agel]", syllables: "me.da.gel" },
        { sp: "megos", meaning: "song", pronunciation: "[m'egos]", syllables: "me.gos" },
        { sp: "meitur", meaning: "dialogue", pronunciation: "[m'etuɹ]", syllables: "mei.tur" },
        { sp: "mekaris", meaning: "suitcase", pronunciation: "[mek'aɹis]", syllables: "me.ka.ris" },
        { sp: "mirakop", meaning: "plan", pronunciation: "[miɹ'akop]", syllables: "mi.ra.kop" },
        { sp: "miravet", meaning: "diary", pronunciation: "[miɹ'avet]", syllables: "mi.ra.vet" },
        { sp: "nizorik", meaning: "young person", pronunciation: "[niz'oɹik]", syllables: "ni.zo.rik" },
        { sp: "paral", meaning: "leave", pronunciation: "[p'aɹal]", syllables: "pa.ral" },
        { sp: "petraz", meaning: "rise", pronunciation: "[p'etɹaz]", syllables: "pe.traz" },
        { sp: "pozir", meaning: "truth", pronunciation: "[p'oziɹ]", syllables: "po.zir" },
        { sp: "posont", meaning: "power", pronunciation: "[p'osont]", syllables: "po.sont" },
        { sp: "posontal", meaning: "right", pronunciation: "[pos'ontal]", syllables: "po.son.tal" },
        { sp: "posot", meaning: "occupy", pronunciation: "[p'osot]", syllables: "po.sot" },
        { sp: "poz", meaning: "prove", pronunciation: "[p'oz]", syllables: "poz" },
        { sp: "prais", meaning: "guide", pronunciation: "[pɹ'ais]", syllables: "prais" },
        { sp: "praisal", meaning: "goal", pronunciation: "[pɹ'aisal]", syllables: "prai.sal" },
        { sp: "ramis", meaning: "map", pronunciation: "[ɹ'amis]", syllables: "ra.mis" },
        { sp: "ramisal", meaning: "place", pronunciation: "[ɹam'isal]", syllables: "ra.mi.sal" },
        { sp: "rine", meaning: "possibly", pronunciation: "[ɹ'ine]", syllables: "ri.ne" },
        { sp: "sihof", meaning: "bird", pronunciation: "[s'ihof]", syllables: "si.hof" },
        { sp: "sihofal", meaning: "flower", pronunciation: "[sih'ofal]", syllables: "si.ho.fal" },
        { sp: "sont", meaning: "world", pronunciation: "[s'ont]", syllables: "sont" },
        { sp: "sor", meaning: "system", pronunciation: "[s'oɹ]", syllables: "sor" },
        { sp: "soralit", meaning: "student", pronunciation: "[soɹ'alit]", syllables: "so.ra.lit" },
        { sp: "soramir", meaning: "teacher", pronunciation: "[soɹ'amiɹ]", syllables: "so.ra.mir" },
        { sp: "sorasis", meaning: "school", pronunciation: "[soɹ'asis]", syllables: "so.ra.sis" },
        { sp: "sohyenir", meaning: "civilian", pronunciation: "[sohɛːn'iɹ]", syllables: "so.hye.nir" },
        { sp: "sohyes", meaning: "society", pronunciation: "[s'ohɛːs]", syllables: "so.hyes" },
        { sp: "spiretz", meaning: "peace", pronunciation: "[spiɹ'ɛtsiː]", syllables: "s.pi.re.tsyi" },
        { sp: "tores", meaning: "horse", pronunciation: "[t'oɹes]", syllables: "to.res" },
        { sp: "travos", meaning: "course", pronunciation: "[tɹ'avos]", syllables: "tra.vos" },
        { sp: "traz", meaning: "stand", pronunciation: "[tɹ'az]", syllables: "traz" },
        { sp: "trep", meaning: "oppose", pronunciation: "[tɹ'eps]", syllables: "trep" },
        { sp: "trepsal", meaning: "war", pronunciation: "[tɹ'epsal]", syllables: "tre.psal" },
        { sp: "trineis", meaning: "question", pronunciation: "[tɹ'ines]", syllables: "tri.neis" },
        { sp: "varion", meaning: "word", pronunciation: "[vaɹ'ion]", syllables: "va.ri.on" },
        { sp: "veip", meaning: "movement", pronunciation: "[v'ep]", syllables: "veip" },
        { sp: "veilanir", meaning: "traveler", pronunciation: "[vel'aniɹ]", syllables: "vei.la.nir" },
        { sp: "veinier", meaning: "passenger", pronunciation: "[ven'ieɹ]", syllables: "vei.ni.er" },
        { sp: "veinor", meaning: "bus", pronunciation: "[v'enoɹ]", syllables: "vei.nor" },
        { sp: "wis", meaning: "positive", pronunciation: "[w'is]", syllables: "wis" },
        { sp: "wisek", meaning: "win", pronunciation: "[w'isek]", syllables: "wi.sek" },
        { sp: "wisop", meaning: "luck", pronunciation: "[w'isop]", syllables: "wi.sop" },
        { sp: "surim", meaning: "life", pronunciation: "[s'uɹim]", syllables: "su.rim" },
        { sp: "wisur", meaning: "victory", pronunciation: "[w'isuɹ]", syllables: "wi.sur" },
        { sp: "xisox", meaning: "star", pronunciation: "[ks'isoks]", syllables: "xi.sox" },
        { sp: "xitar", meaning: "galaxy", pronunciation: "[ks'itaɹ]", syllables: "xi.tar" },
        { sp: "yiravom", meaning: "computer", pronunciation: "[iːɹ'avom]", syllables: "yi.ra.vom" },
        { sp: "yural", meaning: "courage", pronunciation: "[j'uɹal]", syllables: "yu.ral" },
        { sp: "zafatal", meaning: "flag", pronunciation: "[zaf'atal]", syllables: "za.fa.tal" },
        { sp: "zevat", meaning: "item", pronunciation: "[z'evat]", syllables: "ze.vat" },
        { sp: "taris", meaning: "month", pronunciation: "[t'aɹis]", syllables: "ta.ris" },
        { sp: "davir", meaning: "day; today", pronunciation: "[d'aviɹ]", syllables: "da.vir" },
        { sp: "dazu", meaning: "hour", pronunciation: "[d'azu]", syllables: "da.zu" },
        { sp: "zalu", meaning: "year", pronunciation: "[z'alu]", syllables: "za.lu" },
        { sp: "zimi", meaning: "minute", pronunciation: "[z'imi]", syllables: "zi.mi" },
        { sp: "zaluet", meaning: "last year", pronunciation: "[zal'uet]", syllables: "za.lu.et" },
        { sp: "i-zalu", meaning: "next year", pronunciation: "[iz'alu]", syllables: "i.za.lu" },
        { sp: "tariset", meaning: "last month", pronunciation: "[taɹ'isɛt]", syllables: "ta.ri.set" },
        { sp: "i-taris", meaning: "next month", pronunciation: "[it'aɹis]", syllables: "i.ta.ris" },
        { sp: "daviret", meaning: "yesterday", pronunciation: "[dav'iɹɛt]", syllables: "da.vi.ret" },
        { sp: "idavir / aminaro", meaning: "tomorrow", pronunciation: "[id'aviɹ] / [amin'aɹo]", syllables: "i.da.vir / a.mi.na.ro" },
        { sp: "tarul", meaning: "January", pronunciation: "[t'aɹul]", syllables: "ta.rul" },
        { sp: "resur", meaning: "February", pronunciation: "[ɹ'esuɹ]", syllables: "re.sur" },
        { sp: "kilup", meaning: "March", pronunciation: "[k'ilup]", syllables: "ki.lup" },
        { sp: "votir", meaning: "April", pronunciation: "[v'otiɹ]", syllables: "vo.tir" },
        { sp: "meka", meaning: "May", pronunciation: "[m'eka]", syllables: "me.ka" },
        { sp: "xisata", meaning: "June", pronunciation: "[ks'isata]", syllables: "xi.sa.ta" },
        { sp: "xisere", meaning: "July", pronunciation: "[ks'iseɹe]", syllables: "xi.se.re" },
        { sp: "xisiki", meaning: "August", pronunciation: "[ks'isiki]", syllables: "xi.si.ki" },
        { sp: "dalur", meaning: "September", pronunciation: "[d'aluɹ]", syllables: "da.lur" },
        { sp: "zaivim", meaning: "October", pronunciation: "[z'aivim]", syllables: "zai.vim" },
        { sp: "fiurua", meaning: "November", pronunciation: "[fiuɹ'ua]", syllables: "fiu.ru.a" },
        { sp: "xisovo", meaning: "December", pronunciation: "[ks'isovo]", syllables: "xi.so.vo" },
        { sp: "baba", meaning: "father", pronunciation: "[b'aba]", syllables: "ba.ba" },
        { sp: "mama", meaning: "mother", pronunciation: "[m'ama]", syllables: "ma.ma" },
        { sp: "ogababa", meaning: "paternal grandfather", pronunciation: "[ogab'aba]", syllables: "o.ga.ba.ba" },
        { sp: "ogabafa", meaning: "maternal grandfather", pronunciation: "[ogab'afa]", syllables: "o.ga.ba.fa" },
        { sp: "ogamama", meaning: "paternal grandmother", pronunciation: "[ogam'ama]", syllables: "o.ga.ma.ma" },
        { sp: "ogamata", meaning: "maternal grandmother", pronunciation: "[ogam'ata]", syllables: "o.ga.ma.ta" },
        { sp: "loza", meaning: "elder brother", pronunciation: "[l'oza]", syllables: "lo.za" },
        { sp: "lozi", meaning: "younger brother", pronunciation: "[l'ozi]", syllables: "lo.zi" },
        { sp: "leri", meaning: "younger sister", pronunciation: "[l'eɹi]", syllables: "le.ri" },
        { sp: "lera", meaning: "elder sister", pronunciation: "[l'eɹa]", syllables: "le.ra" },
        { sp: "asir", meaning: "gray", pronunciation: "[as'iɹ]", syllables: "a.sir" },
        { sp: "baudr", meaning: "dark; deep", pronunciation: "[b'audɹ]", syllables: "baudr" },
        { sp: "sinkar", meaning: "transparent", pronunciation: "[sink'aɹ]", syllables: "sin.kar" },
        { sp: "dalanek", meaning: "sky blue", pronunciation: "[dalan'ek]", syllables: "da.la.nek" },
        { sp: "duaber", meaning: "white", pronunciation: "[d'wabɹ]", syllables: "duabr" },
        { sp: "fiurigar", meaning: "purple", pronunciation: "[fiuɹig'aɹ]", syllables: "fiu.ri.gar" },
        { sp: "kilor", meaning: "yellow", pronunciation: "[kil'oɹ]", syllables: "ki.lor" },
        { sp: "ligurik", meaning: "shining color", pronunciation: "[liguɹ'ik]", syllables: "li.gu.rik" },
        { sp: "metin", meaning: "cyan", pronunciation: "[met'in]", syllables: "me.tin" },
        { sp: "nizor", meaning: "bright color", pronunciation: "[niz'oɹ]", syllables: "ni.zor" },
        { sp: "nom", meaning: "black", pronunciation: "[n'om]", syllables: "nom" },
        { sp: "parin", meaning: "light colors; pastel colors", pronunciation: "[paɹ'in]", syllables: "pa.rin" },
        { sp: "rel", meaning: "orange", pronunciation: "[ɹ'el]", syllables: "rel" },
        { sp: "takar", meaning: "red", pronunciation: "[tak'aɹ]", syllables: "ta.kar" },
        { sp: "voli", meaning: "green", pronunciation: "[vol'i]", syllables: "vo.li" },
        { sp: "yiron", meaning: "purple-pink", pronunciation: "[iɹ'on]", syllables: "yi.ron" },
        { sp: "yuras", meaning: "dark blue", pronunciation: "[juɹ'as]", syllables: "yu.ras" },
        { sp: "zair", meaning: "ocean blue", pronunciation: "[z'aiɹ]", syllables: "zair" },
        { sp: "zimk", meaning: "pink", pronunciation: "[z'imk]", syllables: "zimk" },
      ];
      const NOUN_COUNTABILITY = {
        amperial: "M", amperiom: "B", chind: "C", coranir: "B", koratim: "C", corutal: "C", kricheik: "C",
        diaspartas: "C", domat: "C", enatur: "M", firek: "C", varionrat: "C", fizros: "C", gayuras: "B",
        kam: "M", kamis: "M", kamiren: "M", kaminan: "M", ligur: "B", lovek: "C", lumisar: "C", lumivis: "C",
        medagel: "C", megos: "C", meitur: "C", mekaris: "C", mirakop: "C", miravet: "C", nizorik: "C",
        paral: "B", petraz: "B", pozir: "M", posont: "M", posontal: "B", posot: "B", poz: "B", prais: "B",
        praisal: "C", ramis: "C", ramisal: "C", rine: "M", sihof: "C", sihofal: "C", sont: "C", sor: "C",
        soralit: "C", soramir: "C", sorasis: "C", sohyenir: "C", sohyes: "M", spiretz: "M", tores: "C",
        travos: "C", traz: "B", trep: "B", trepsal: "B", trineis: "C", varion: "C", veip: "B",
        veilanir: "C", veinier: "C", veinor: "C", wis: "M", wisek: "B", wisop: "M", surim: "M", wisur: "B",
        xisox: "C", xitar: "C", yiravom: "C", yural: "M", zafatal: "C", zevat: "C", taris: "C",
        dazu: "C", zalu: "C", zimi: "C", zaluet: "C", "i-zalu": "C", tariset: "C",
        "i-taris": "C", daviret: "C", davir: "C", "idavir / aminaro": "C", tarul: "C", resur: "C",
        kilup: "C", votir: "C", meka: "C", xisata: "C", xisere: "C", xisiki: "C", dalur: "C", zaivim: "C",
        fiurua: "C", xisovo: "C", baba: "C", mama: "C", ogababa: "C", ogabafa: "C", ogamama: "C",
        ogamata: "C", loza: "C", lozi: "C", leri: "C", lera: "C", asir: "M", baudr: "M", sinkar: "M",
        dalanek: "M", duaber: "M", fiurigar: "M", kilor: "M", ligurik: "M", metin: "M", nizor: "M",
        nom: "M", parin: "M", rel: "M", takar: "M", voli: "M", yiron: "M", yuras: "M", zair: "M", zimk: "M",
      };
      const ADJECTIVES = [
        ["a", "all"],
        ["aco", "same"],
        ["anegra", "new"],
        ["baud", "bad"],
        ["sinka", "clear, clever"],
        ["duab", "good"],
        ["duali", "healthy"],
        ["ligurika", "shining; shining color"],
        ["parine", "impossible; light colors; pastel colors"],
        ["riga", "eternal"],
        ["rine", "possibly"],
        ["yone", "late"],
        ["yura", "brave"],
        ["zimo", "early"],
        ["asiro", "gray"],
        ["baudro", "dark; deep"],
        ["sinkara", "transparent"],
        ["dalaneki", "sky blue"],
        ["duabri", "white"],
        ["fiurigaro", "purple"],
        ["kilori", "yellow"],
        ["metine", "cyan"],
        ["nizori", "bright color"],
        ["noma", "black"],
        ["rela", "orange"],
        ["takari", "red"],
        ["volio", "green"],
        ["yirona", "purple-pink"],
        ["yurasi", "dark blue"],
        ["zaira", "ocean blue"],
        ["zimka", "pink"],
        ["amri", "happy; cheerful"],
        ["fervi", "angry"],
        ["hapi", "bright; hopeful"],
        ["marimi", "lovely; kind"],
        ["mira", "calm"],
        ["sori", "sad; distressed"],
        ["trevi", "fearful; terrified"],
        ["veki", "anxious; uneasy"],
        ["yoni", "lonely"],
        ["zanu", "excited"],
      ];
      const ADVERB_MEANING_OVERRIDES = {
        a: "completely",
        aco: "equally",
        anegra: "newly",
        baud: "badly",
        sinka: "clearly",
        duab: "well",
        duali: "healthily",
        ligurika: "with a shining color",
        parine: "impossibly",
        riga: "eternally",
        rine: "possibly",
        yone: "late",
        yura: "bravely",
        zimo: "early",
        amri: "happily; cheerfully",
        fervi: "angrily",
        hapi: "brightly; hopefully",
        marimi: "lovely; kindly",
        mira: "calmly",
        sori: "sadly; distressedly",
        trevi: "fearfully; terrifiedly",
        veki: "anxiously; uneasily",
        yoni: "lonelily",
        zanu: "excitedly",
        asiro: "in gray",
        baudro: "darkly; deeply",
        sinkara: "transparently",
        dalaneki: "in sky blue",
        duabri: "in white",
        fiurigaro: "in purple",
        kilori: "in yellow",
        metine: "in cyan",
        nizori: "with a bright color",
        noma: "in black",
        rela: "in orange",
        takari: "in red",
        volio: "in green",
        yirona: "in purple-pink",
        yurasi: "in dark blue",
        zaira: "in ocean blue",
        zimka: "in pink",
      };

      function deriveAdverbForm(adj) {
        return /[aeiou]$/i.test(adj) ? `${adj.slice(0, -1)}ka` : `${adj}ka`;
      }

      function deriveAdverbMeaning(adj, meaning) {
        return ADVERB_MEANING_OVERRIDES[adj] || `in a ${meaning} way`;
      }

      const ADVERBS = [];
      const seenAdverbs = new Set();
      ADJECTIVES.forEach(([adj, meaning]) => {
        const sp = deriveAdverbForm(adj);
        if (seenAdverbs.has(sp)) return;
        seenAdverbs.add(sp);
        ADVERBS.push([sp, deriveAdverbMeaning(adj, meaning)]);
      });
      const PREPOSITIONS = [
        ["akur", "according to"],
        ["lir", "because of / due to"],
        ["dazik", "in"],
        ["denun", "away from"],
        ["duzop", "between"],
        ["ekzun", "depending on"],
        ["furin", "over"],
        ["giros", "behind"],
        ["hirok", "until"],
        ["lasul", "under"],
        ["kelir", "beside"],
        ["lofev", "without"],
        ["mezan", "toward"],
        ["niorez", "or"],
        ["olvir", "on"],
        ["kumel", "about"],
        ["rilan", "through"],
        ["sorik", "in front of"],
        ["tivaz", "near"],
        ["ubres", "for"],
        ["vekas", "below"],
        ["vetul", "during"],
        ["yines", "from ... to ..."],
      ];
      const CONJUNCTIONS = [
        ["mi", "and"],
        ["pa", "and"],
        ["utrez", "or"],
        ["zai", "but"],
        ["lunte", "then / and then"],
        ["bey", "because"],
        ["eki", "if"],
      ];
      const QUESTIONS = [
        ["beyikaol", "why"],
        ["damir", "how long"],
        ["ekul", "which"],
        ["furol", "how"],
        ["kynar", "who"],
        ["luntek", "when"],
        ["orfek", "which kind"],
        ["rinekas", "Is this possible?"],
        ["trinek", "how many / how much (amount)"],
        ["utrez", "or"],
        ["wasmen", "what"],
        ["yekar", "how"],
        ["zekuk", "is it"],
        ["zoreil", "where"],
      ];

      function deriveStrictLexiconEntry(word, overrides = null) {
        const override = overrides?.[word];
        if (override) return override;

        const VOWEL_MAP = {
          yi: "iː", ye: "ɛː", ai: "ɑi", iu: "ju", au: "ɑu", ua: "wɑ",
          ei: "e", ae: "æ", oe: "ʊ", i: "i", e: "ɛ", u: "u", o: "o", a: "ɑ",
        };
        const CONS_MAP = {
          sh: "ʃ", ch: "ʧ", ng: "ŋ", p: "p", b: "b", t: "t", d: "d", k: "k", g: "g",
          f: "f", v: "v", s: "s", z: "z", h: "h", m: "m", n: "n", r: "ɹ", l: "l", w: "w", y: "j", x: "ks",
        };
        const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
        const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);
        const ALLOWED = new Set(["V", "CV", "VC", "CCV", "CVC", "VCC", "CVCC", "CCVC", "CCVCC"]);
        const ONSET_ORDER = ["stop", "affricate_fricative", "nasal", "liquid"];
        const CODA_ORDER = ["liquid", "nasal", "affricate_fricative", "stop"];
        const CLASS_BY_RAW = {
          p: "stop", b: "stop", t: "stop", d: "stop", k: "stop", g: "stop",
          ch: "affricate_fricative",
          f: "affricate_fricative", v: "affricate_fricative", s: "affricate_fricative", z: "affricate_fricative", sh: "affricate_fricative", h: "affricate_fricative",
          m: "nasal", n: "nasal", ng: "nasal", r: "liquid", l: "liquid",
        };
        const CLASS_BY_IPA = {
          p: "stop", b: "stop", t: "stop", d: "stop", k: "stop", g: "stop",
          "ʧ": "affricate_fricative", f: "affricate_fricative", v: "affricate_fricative", s: "affricate_fricative",
          z: "affricate_fricative", "ʃ": "affricate_fricative", h: "affricate_fricative",
          m: "nasal", n: "nasal", "ŋ": "nasal", "ɹ": "liquid", l: "liquid",
        };

        function isLetter(ch) {
          return ch >= "a" && ch <= "z";
        }

        function tokenize(text) {
          const s = text.toLowerCase();
          const tokens = [];
          let i = 0;
          while (i < s.length) {
            const ch = s[i];
            if (ch === "-" || ch === " " || ch === "\t" || ch === "\n") {
              if (ch === "-") tokens.push({ type: "sep", ipa: ".", raw: "." });
              i++;
              continue;
            }
            if (!isLetter(ch)) throw new Error(`Invalid character: "${ch}"`);
            if (s.startsWith("ch", i)) {
              tokens.push({ type: "cons", ipa: "ʧ", raw: "ch" });
              i += 2;
              continue;
            }
            if (ch === "c") {
              const next2 = s.slice(i + 1, i + 3);
              const next1 = s.slice(i + 1, i + 2);
              tokens.push({ type: "cons", ipa: (next1 === "i" || next2 === "yi") ? "s" : "k" });
              i += 1;
              continue;
            }
            let matched = false;
            for (const vk of VOWEL_KEYS) {
              if (s.startsWith(vk, i)) {
                tokens.push({ type: "vowel", ipa: VOWEL_MAP[vk], raw: vk });
                i += vk.length;
                matched = true;
                break;
              }
            }
            if (matched) continue;
            for (const ck of CONS_KEYS) {
              if (s.startsWith(ck, i)) {
                tokens.push({ type: "cons", ipa: CONS_MAP[ck], raw: ck });
                i += ck.length;
                matched = true;
                break;
              }
            }
            if (matched) continue;
            throw new Error(`Unsupported spelling at: "${s.slice(i)}"`);
          }
          return tokens;
        }

        function consClass(t) {
          if (t.raw && CLASS_BY_RAW[t.raw]) return CLASS_BY_RAW[t.raw];
          if (t.ipa && CLASS_BY_IPA[t.ipa]) return CLASS_BY_IPA[t.ipa];
          throw new Error("Unknown consonant class.");
        }

        function checkClusterOrder(cluster, order) {
          if (cluster.length <= 1) return;
          let prev = -1;
          for (const t of cluster) {
            const idx = order.indexOf(consClass(t));
            if (idx === -1 || idx <= prev) throw new Error("Consonant cluster violates order rule.");
            prev = idx;
          }
        }

        function onsetHasNg(cluster) {
          return cluster.some((t) => t.raw === "ng" || t.ipa === "ŋ");
        }

        function onsetLengthFromScoped(scoped) {
          let count = 0;
          for (let i = scoped.length - 2; i >= 0; i--) {
            const t = scoped[i];
            if (t.type === "sep" || t.type === "vowel") break;
            if (t.type === "cons") count++;
          }
          return count;
        }

        function splitBetweenVowels(cluster, onsetLenCurrent) {
          for (let s = 0; s <= cluster.length; s++) {
            const coda = cluster.slice(0, s);
            const onsetNext = cluster.slice(s);
            if (coda.length > 3 || onsetNext.length > 3) continue;
            if (onsetHasNg(onsetNext)) continue;
            try {
              checkClusterOrder(coda, CODA_ORDER);
              checkClusterOrder(onsetNext, ONSET_ORDER);
            } catch {
              continue;
            }
            const currentPattern = (onsetLenCurrent > 0 ? "C".repeat(onsetLenCurrent) : "") + "V" + (coda.length > 0 ? "C".repeat(coda.length) : "");
            if (!ALLOWED.has(currentPattern)) continue;
            const nextPattern = (onsetNext.length > 0 ? "C".repeat(onsetNext.length) : "") + "V";
            if (onsetNext.length > 0 && !ALLOWED.has(nextPattern)) continue;
            return s;
          }
          return cluster.length;
        }

        function buildScoped(tokens) {
          const scoped = [];
          for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.type === "sep") {
              scoped.push(t);
              continue;
            }
            if (t.type === "vowel") {
              scoped.push(t);
              const cluster = [];
              let j = i + 1;
              while (j < tokens.length && tokens[j].type !== "sep" && tokens[j].type !== "vowel") {
                cluster.push(tokens[j]);
                j++;
              }
              if (cluster.length && j < tokens.length && tokens[j].type === "vowel") {
                const onsetLenCurrent = onsetLengthFromScoped(scoped);
                const splitAt = splitBetweenVowels(cluster, onsetLenCurrent);
                for (let k = 0; k < splitAt; k++) scoped.push(cluster[k]);
                if (splitAt < cluster.length) scoped.push({ type: "sep", ipa: ".", raw: "." });
                for (let k = splitAt; k < cluster.length; k++) scoped.push(cluster[k]);
              } else {
                cluster.forEach((c) => scoped.push(c));
              }
              i = j - 1;
              continue;
            }
            scoped.push(t);
          }
          return scoped;
        }

        function validateScoped(scoped) {
          const vowels = [];
          for (let i = 0; i < scoped.length; i++) if (scoped[i].type === "vowel") vowels.push(i);
          if (!vowels.length) throw new Error("No vowel found.");
          for (const vIdx of vowels) {
            const onset = [];
            const coda = [];
            for (let j = vIdx - 1; j >= 0; j--) {
              if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
              if (scoped[j].type === "cons") onset.push(scoped[j]);
            }
            onset.reverse();
            for (let j = vIdx + 1; j < scoped.length; j++) {
              if (scoped[j].type === "sep" || scoped[j].type === "vowel") break;
              if (scoped[j].type === "cons") coda.push(scoped[j]);
            }
            const pattern = (onset.length ? "C".repeat(onset.length) : "") + "V" + (coda.length ? "C".repeat(coda.length) : "");
            if (!ALLOWED.has(pattern)) throw new Error(`Invalid syllable pattern: ${pattern}`);
            if (onsetHasNg(onset)) throw new Error("ng cannot appear in onset.");
            checkClusterOrder(onset, ONSET_ORDER);
            checkClusterOrder(coda, CODA_ORDER);
          }
        }

        function formatIPA(scoped) {
          const vowelIndexes = [];
          for (let i = 0; i < scoped.length; i++) if (scoped[i].type === "vowel") vowelIndexes.push(i);
          const stressIdx = vowelIndexes.length >= 2 ? vowelIndexes[vowelIndexes.length - 2] : vowelIndexes[0];
          const out = [];
          for (let i = 0; i < scoped.length; i++) {
            const t = scoped[i];
            if (t.type === "sep") continue;
            out.push(i === stressIdx ? `ˈ${t.ipa}` : t.ipa);
          }
          return `[${out.join("")}]`;
        }

        function formatSyllables(scoped) {
          return scoped.map((t) => (t.type === "sep" ? "." : t.raw)).join("");
        }

        const tokens = tokenize(word);
        const scoped = buildScoped(tokens);
        validateScoped(scoped);
        return {
          pronunciation: formatIPA(scoped),
          syllables: formatSyllables(scoped),
        };
      }

      function deriveVerbLexiconEntry(verb) {
        return deriveStrictLexiconEntry(verb, VERB_LEXICON_OVERRIDES);
      }

      const LEXICON_VOWEL_ORDER = ["i", "ei", "e", "ae", "u", "oe", "o", "a", "ai", "iu", "au", "ua", "yi", "ye"];
      const LEXICON_CONSONANT_ORDER = ["p", "b", "t", "d", "k", "g", "ch", "f", "v", "s", "z", "sh", "h", "x", "m", "n", "ng", "r", "l", "w", "y"];
      const LEXICON_TOKEN_ORDER = new Map(
        [...LEXICON_VOWEL_ORDER, ...LEXICON_CONSONANT_ORDER].map((token, idx) => [token, idx])
      );
      const LEXICON_VOWEL_KEYS = LEXICON_VOWEL_ORDER.slice().sort((a, b) => b.length - a.length);
      const LEXICON_CONS_KEYS = ["sh", "ch", "ng", ...LEXICON_CONSONANT_ORDER.filter((token) => token.length === 1)];

      function tokenizeLexiconWord(word) {
        const s = String(word || "").toLowerCase();
        const tokens = [];
        let i = 0;

        while (i < s.length) {
          const ch = s[i];

          if (ch === "-" || ch === "." || ch === "/" || ch === " " || ch === "\t" || ch === "\n") {
            i += 1;
            continue;
          }

          if (ch < "a" || ch > "z") {
            i += 1;
            continue;
          }

          let matched = false;

          for (const vk of LEXICON_VOWEL_KEYS) {
            if (s.startsWith(vk, i)) {
              tokens.push(vk);
              i += vk.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          if (s[i] === "c") {
            const next2 = s.slice(i + 1, i + 3);
            const next1 = s.slice(i + 1, i + 2);
            tokens.push(next1 === "i" || next2 === "yi" ? "s" : "k");
            i += 1;
            continue;
          }

          for (const ck of LEXICON_CONS_KEYS) {
            if (s.startsWith(ck, i)) {
              tokens.push(ck);
              i += ck.length;
              matched = true;
              break;
            }
          }
          if (matched) continue;

          tokens.push(ch);
          i += 1;
        }

        return tokens;
      }

      function compareSpiretzWords(a, b) {
        const aTokens = tokenizeLexiconWord(a);
        const bTokens = tokenizeLexiconWord(b);
        const maxLen = Math.max(aTokens.length, bTokens.length);

        for (let i = 0; i < maxLen; i++) {
          if (i >= aTokens.length) return -1;
          if (i >= bTokens.length) return 1;
          const aRank = LEXICON_TOKEN_ORDER.has(aTokens[i]) ? LEXICON_TOKEN_ORDER.get(aTokens[i]) : 1000 + aTokens[i].charCodeAt(0);
          const bRank = LEXICON_TOKEN_ORDER.has(bTokens[i]) ? LEXICON_TOKEN_ORDER.get(bTokens[i]) : 1000 + bTokens[i].charCodeAt(0);
          if (aRank !== bRank) return aRank - bRank;
        }

        return String(a).localeCompare(String(b), "en", { sensitivity: "base" });
      }

      function safeLocaleCompare(a, b) {
        return String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base" });
      }

      function sortLexiconEntries(entries, getWord) {
        return entries.slice().sort((a, b) => {
          try {
            return compareSpiretzWords(getWord(a), getWord(b));
          } catch {
            return safeLocaleCompare(getWord(a), getWord(b));
          }
        });
      }

      function deriveLooseLexiconEntry(word) {
        const VOWEL_MAP = {
          yi: "iː", ye: "ɛː", ai: "ɑi", iu: "ju", au: "ɑu", ua: "wɑ",
          ei: "e", ae: "æ", oe: "ʊ", i: "i", e: "ɛ", u: "u", o: "o", a: "ɑ",
        };
        const CONS_MAP = {
          sh: "ʃ", ch: "ʧ", ng: "ŋ", p: "p", b: "b", t: "t", d: "d", k: "k", g: "g",
          f: "f", v: "v", s: "s", z: "z", h: "h", m: "m", n: "n", r: "ɹ", l: "l", w: "w", y: "j", x: "ks",
        };
        const VOWEL_KEYS = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);
        const CONS_KEYS = Object.keys(CONS_MAP).sort((a, b) => b.length - a.length);

        function tokenizeLoose(text) {
          const s = String(text || "").toLowerCase();
          const tokens = [];
          let i = 0;

          while (i < s.length) {
            const ch = s[i];

            if (ch === " " || ch === "\t" || ch === "\n") {
              i += 1;
              continue;
            }
            if (ch === "-") {
              tokens.push({ type: "sep", raw: ".", ipa: "." });
              i += 1;
              continue;
            }

            let matched = false;
            for (const vk of VOWEL_KEYS) {
              if (s.startsWith(vk, i)) {
                tokens.push({ type: "vowel", raw: vk, ipa: VOWEL_MAP[vk] });
                i += vk.length;
                matched = true;
                break;
              }
            }
            if (matched) continue;

            if (s.startsWith("ch", i)) {
              tokens.push({ type: "cons", raw: "ch", ipa: "ʧ" });
              i += 2;
              continue;
            }
            if (s[i] === "c") {
              const next2 = s.slice(i + 1, i + 3);
              const next1 = s.slice(i + 1, i + 2);
              tokens.push({ type: "cons", raw: "c", ipa: (next1 === "i" || next2 === "yi") ? "s" : "k" });
              i += 1;
              continue;
            }

            for (const ck of CONS_KEYS) {
              if (s.startsWith(ck, i)) {
                tokens.push({ type: "cons", raw: ck, ipa: CONS_MAP[ck] });
                i += ck.length;
                matched = true;
                break;
              }
            }
            if (matched) continue;

            i += 1;
          }

          return tokens;
        }

        function deriveLooseVariant(variant) {
          const tokens = tokenizeLoose(variant);
          if (!tokens.length) return { pronunciation: "—", syllables: "—" };

          const vowelIndexes = [];
          tokens.forEach((token, idx) => {
            if (token.type === "vowel") vowelIndexes.push(idx);
          });
          if (!vowelIndexes.length) return { pronunciation: "—", syllables: variant };

          const stressVowelIdx = vowelIndexes.length >= 2 ? vowelIndexes[vowelIndexes.length - 2] : vowelIndexes[0];
          const ipaParts = [];
          const syllableParts = [];

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === "sep") {
              if (syllableParts[syllableParts.length - 1] !== ".") syllableParts.push(".");
              continue;
            }

            if (
              token.type === "vowel" &&
              i > 0 &&
              tokens[i - 1].type !== "sep" &&
              syllableParts.length &&
              syllableParts[syllableParts.length - 1] !== "."
            ) {
              syllableParts.push(".");
            }

            if (i === stressVowelIdx) ipaParts.push("ˈ");
            ipaParts.push(token.ipa);
            syllableParts.push(token.raw);
          }

          return {
            pronunciation: `[${ipaParts.join("")}]`,
            syllables: syllableParts.join("").replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, ""),
          };
        }

        const variants = String(word || "").split("/").map((part) => part.trim()).filter(Boolean);
        if (!variants.length) return { pronunciation: "—", syllables: "—" };
        const derived = variants.map(deriveLooseVariant);
        return {
          pronunciation: derived.map((entry) => entry.pronunciation).join(" / "),
          syllables: derived.map((entry) => entry.syllables).join(" / "),
        };
      }

      function getLexiconEntrySafe(word, overrides = null) {
        try {
          return deriveStrictLexiconEntry(word, overrides);
        } catch {
          return deriveLooseLexiconEntry(word);
        }
      }

      function getVerbValencyBadge(verb) {
        const valency = VERB_VALENCY[verb] || "?";
        const isTransitive = valency === "T";
        const label = IS_ZH
          ? (isTransitive ? "及物" : valency === "I" ? "不及物" : "未标注")
          : (isTransitive ? "transitive" : valency === "I" ? "intransitive" : "unmarked");
        const bg = isTransitive ? "rgba(58, 160, 110, 0.18)" : "rgba(77, 123, 201, 0.18)";
        const border = isTransitive ? "rgba(58, 160, 110, 0.35)" : "rgba(77, 123, 201, 0.35)";
        return `<span class="badge" title="${label}" aria-label="${label}" style="padding: 4px 10px; min-width: 0; background: ${bg}; border-color: ${border};">${valency}</span>`;
      }

      function getNounCountabilityBadge(noun) {
        const kind = NOUN_COUNTABILITY[noun] || "?";
        const label = IS_ZH
          ? (kind === "C" ? "可数" : kind === "M" ? "不可数" : kind === "B" ? "可数/不可数两用" : "未标注")
          : (kind === "C" ? "countable" : kind === "M" ? "uncountable" : kind === "B" ? "countable and uncountable" : "unmarked");
        const bg = kind === "C"
          ? "rgba(58, 160, 110, 0.18)"
          : kind === "M"
            ? "rgba(201, 138, 77, 0.18)"
            : "rgba(77, 123, 201, 0.18)";
        const border = kind === "C"
          ? "rgba(58, 160, 110, 0.35)"
          : kind === "M"
            ? "rgba(201, 138, 77, 0.35)"
            : "rgba(77, 123, 201, 0.35)";
        return `<span class="badge" title="${label}" aria-label="${label}" style="padding: 4px 10px; min-width: 0; background: ${bg}; border-color: ${border};">${kind}</span>`;
      }

      if (verbTbody) {
        const sortedVerbs = sortLexiconEntries(VERBS, (entry) => entry[0]);
        sortedVerbs.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp, VERB_LEXICON_OVERRIDES);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${getVerbValencyBadge(sp)}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          verbTbody.appendChild(tr);
        });
      }

      if (nounTbody) {
        const sortedNouns = sortLexiconEntries(NOUNS, (entry) => entry.sp);
        sortedNouns.forEach((entry, idx) => {
          const meaning = IS_ZH ? (meaningMap[entry.meaning] || entry.meaning) : entry.meaning;
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${entry.sp}</b></td><td>${meaning}</td><td>${getNounCountabilityBadge(entry.sp)}</td><td>${entry.pronunciation}</td><td>${entry.syllables}</td>`;
          nounTbody.appendChild(tr);
        });
      }

      if (adjectiveTbody) {
        const sortedAdjectives = sortLexiconEntries(ADJECTIVES, (entry) => entry[0]);
        sortedAdjectives.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          adjectiveTbody.appendChild(tr);
        });
      }

      if (adverbTbody) {
        const sortedAdverbs = sortLexiconEntries(ADVERBS, (entry) => entry[0]);
        sortedAdverbs.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          adverbTbody.appendChild(tr);
        });
      }

      if (prepositionTbody) {
        const sortedPrepositions = sortLexiconEntries(PREPOSITIONS, (entry) => entry[0]);
        sortedPrepositions.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          prepositionTbody.appendChild(tr);
        });
      }

      if (conjunctionTbody) {
        const sortedConjunctions = sortLexiconEntries(CONJUNCTIONS, (entry) => entry[0]);
        sortedConjunctions.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          conjunctionTbody.appendChild(tr);
        });
      }

      if (questionTbody) {
        const sortedQuestions = sortLexiconEntries(QUESTIONS, (entry) => entry[0]);
        sortedQuestions.forEach(([sp, en], idx) => {
          const meaning = IS_ZH ? (meaningMap[en] || en) : en;
          const meta = getLexiconEntrySafe(sp);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${idx + 1}</td><td><b>${sp}</b></td><td>${meaning}</td><td>${meta.pronunciation}</td><td>${meta.syllables}</td>`;
          questionTbody.appendChild(tr);
        });
      }
    })();
