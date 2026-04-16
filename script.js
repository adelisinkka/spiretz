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
        ["0902", { type: "burst", label: IS_ZH ? "星爆" : "starlight burst" }],
        ["888888888", { type: "rain", label: IS_ZH ? "数字雨" : "numeric rain" }],
        ["ffzfzzfdzfmzfvzfkzfrzftzf", { type: "halo", label: IS_ZH ? "秘环" : "secret halo" }]
      ]);
      const glyphs = ["✦", "✧", "✺", "◌", "☼", "⟡", "⟢", "⟣"];
      const overlay = document.createElement("div");
      overlay.className = "secret-code-overlay";
      document.body.appendChild(overlay);

      let cleanupTimer = null;

      function setStatus(message, type) {
        status.textContent = message;
        status.classList.toggle("is-error", type === "error");
        status.classList.toggle("is-success", type === "success");
      }

      function clearEffect() {
        overlay.classList.remove("effect-burst", "effect-rain", "effect-halo");
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
        overlay.appendChild(particle);
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
        const digits = ["8", "0", "9", "2", "8", "8"];
        for (let i = 0; i < 40; i += 1) {
          createParticle(digits[i % digits.length], palette, {
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

      function launchEffect(type) {
        if (cleanupTimer) clearTimeout(cleanupTimer);
        clearEffect();
        const palette = getThemePalette();
        applyPalette(palette);
        if (type === "rain") launchRain(palette);
        else if (type === "halo") launchHalo(palette);
        else launchBurst(palette);

        requestAnimationFrame(() => {
          overlay.classList.add("active");
        });

        cleanupTimer = setTimeout(clearEffect, type === "halo" ? 3800 : 3200);
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const code = input.value.trim();
        const effect = validCodes.get(code);

        if (!effect) {
          setStatus(IS_ZH ? "代码无效。请重试。" : "Invalid code. Try again.", "error");
          return;
        }

        launchEffect(effect.type);
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
