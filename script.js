(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (start, end, amt) => start + (end - start) * amt;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  /* ==========================================================================
     Basics: footer year, nav scrolled state, mobile menu
     ========================================================================== */

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const setScrolled = () => {
      nav.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (toggle && menu && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.dataset.menuOpen === "true";
      nav.dataset.menuOpen = isOpen ? "false" : "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.dataset.menuOpen = "false";
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ==========================================================================
     Count-up numbers
     ========================================================================== */

  function armCountUp(el) {
    if (!el) return null;

    const original = el.textContent.trim();
    const match = original.match(/[\d,]+/);

    if (!match) return null;

    const target = parseInt(match[0].replace(/,/g, ""), 10);

    if (!Number.isFinite(target) || target <= 0) return null;

    const prefix = original.slice(0, match.index);
    const suffix = original.slice(match.index + match[0].length);
    const useCommas = match[0].includes(",");

    return function run(duration = 1100) {
      if (reduceMotion) {
        el.textContent = original;
        return;
      }

      const start = performance.now();

      const easeOutExpo = (t) =>
        t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      const frame = (now) => {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = easeOutExpo(progress);
        const current = Math.round(target * eased);

        const formatted = useCommas
          ? current.toLocaleString("en-US")
          : String(current);

        el.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          el.textContent = original;
        }
      };

      requestAnimationFrame(frame);
    };
  }

  /* ==========================================================================
     Reveal system
     ========================================================================== */

  const STAGGER_CONTAINERS = [
    {
      selector: ".cards",
      items: ":scope > .card"
    },
    {
      selector: ".proof-grid",
      items: ":scope > .proof"
    },
    {
      selector: ".hero__stats",
      items: ":scope > div"
    }
  ];

  function initReveals() {
    const revealEls = document.querySelectorAll(".reveal");

    if (!revealEls.length) return;

    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const pendingTargets = [];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);

          if (entry.target._countUpRun) {
            entry.target._countUpRun();
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealEls.forEach((el) => {
      const staggerCfg = STAGGER_CONTAINERS.find((cfg) =>
        el.matches(cfg.selector)
      );

      const items = staggerCfg
        ? Array.from(el.querySelectorAll(staggerCfg.items))
        : [];

      const rect = el.getBoundingClientRect();

      const alreadyInView =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      if (staggerCfg && items.length > 1) {
        items.forEach((item, i) => {
          const countUpRun = armCountUp(
            item.querySelector("strong") ||
            (item.tagName === "STRONG" ? item : null)
          );

          if (countUpRun) {
            item._countUpRun = countUpRun;
          }

          if (alreadyInView) {
            item.classList.add("is-visible");

            if (countUpRun) {
              countUpRun(700);
            }

            return;
          }

          item.classList.add(
            "stagger-item",
            "stagger-pending"
          );

          item.style.setProperty(
            "--stagger-delay",
            `${i * 90}ms`
          );
        });

        if (alreadyInView) return;

        const childIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;

              items.forEach((item) => {
                item.classList.add("is-visible");

                if (item._countUpRun) {
                  item._countUpRun();
                }
              });

              childIO.unobserve(entry.target);
            });
          },
          {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
          }
        );

        childIO.observe(el);
        pendingTargets.push(...items);

        return;
      }

      if (alreadyInView) {
        el.classList.add("is-visible");
        return;
      }

      el.classList.add("reveal-pending");
      io.observe(el);
      pendingTargets.push(el);
    });

    window.setTimeout(() => {
      pendingTargets.forEach((el) => {
        if (!el.classList.contains("is-visible")) {
          el.classList.add("is-visible");

          if (el._countUpRun) {
            el._countUpRun();
          }
        }
      });
    }, 2000);
  }

  initReveals();

  /* ==========================================================================
     Network map draw-in
     ========================================================================== */

  function initNetworkDrawIn() {
    const visual = document.querySelector(".network__visual");

    if (
      !visual ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const routes = Array.from(
      visual.querySelectorAll(".route")
    );

    const cities = Array.from(
      visual.querySelectorAll(".city")
    );

    if (!routes.length && !cities.length) return;

    const rect = visual.getBoundingClientRect();

    const alreadyInView =
      rect.top < window.innerHeight &&
      rect.bottom > 0;

    if (alreadyInView) return;

    routes.forEach((el, i) => {
      el.style.setProperty("--draw", "0");
      el.style.transitionDelay = `${i * 140}ms`;
    });

    cities.forEach((el, i) => {
      el.style.setProperty("--pop", "0.3");
      el.style.transitionDelay = `${220 + i * 90}ms`;
    });

    const reveal = () => {
      routes.forEach((el) => {
        el.style.setProperty("--draw", "1");
      });

      cities.forEach((el) => {
        el.style.setProperty("--pop", "1");
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            io.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2
      }
    );

    io.observe(visual);

    window.setTimeout(reveal, 2500);
  }

  initNetworkDrawIn();

  /* ==========================================================================
     Smoothed parallax
     ========================================================================== */

  function initParallax() {
    if (reduceMotion) return;

    const heroSection = document.querySelector(
      ".hero, .career-hero, .legal-hero"
    );

    const grid = document.querySelector(".hero__grid");
    const glowOne = document.querySelector(".hero__glow--one");
    const glowTwo = document.querySelector(".hero__glow--two");
    const heroContent = document.querySelector(".hero__content");
    const heroStats = document.querySelector(".hero__stats");
    const networkVisual = document.querySelector(".network__visual");

    if (!heroSection && !networkVisual) return;

    let targetY = window.scrollY;
    let smoothY = targetY;

    let pointerTX = 0;
    let pointerTY = 0;
    let pointerSX = 0;
    let pointerSY = 0;

    let clock = 0;

    window.addEventListener(
      "scroll",
      () => {
        targetY = window.scrollY;
      },
      {
        passive: true
      }
    );

    window.addEventListener("resize", () => {
      targetY = window.scrollY;
      smoothY = targetY;
    });

    if (heroSection) {
      heroSection.addEventListener(
        "pointermove",
        (event) => {
          const rect = heroSection.getBoundingClientRect();

          pointerTX =
            ((event.clientX - rect.left) / rect.width - 0.5) * 2;

          pointerTY =
            ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        },
        {
          passive: true
        }
      );

      heroSection.addEventListener(
        "pointerleave",
        () => {
          pointerTX = 0;
          pointerTY = 0;
        },
        {
          passive: true
        }
      );
    }

    const tick = () => {
      requestAnimationFrame(tick);

      smoothY = lerp(
        smoothY,
        targetY,
        0.09
      );

      pointerSX = lerp(
        pointerSX,
        pointerTX,
        0.08
      );

      pointerSY = lerp(
        pointerSY,
        pointerTY,
        0.08
      );

      clock += 0.006;

      const driftX = Math.sin(clock) * 14;
      const driftY = Math.cos(clock * 0.8) * 10;

      if (heroSection) {
        const heroHeight =
          heroSection.offsetHeight || 1;

        const progress = clamp(
          smoothY / heroHeight,
          0,
          1
        );

        if (grid) {
          grid.style.transform =
            `translate3d(` +
            `${pointerSX * 6}px, ` +
            `${progress * 60}px, ` +
            `0)`;
        }

        if (glowOne) {
          glowOne.style.transform =
            `translate3d(` +
            `${progress * -40 + pointerSX * 16 + driftX}px, ` +
            `${progress * 50 + pointerSY * 12 + driftY}px, ` +
            `0)`;
        }

        if (glowTwo) {
          glowTwo.style.transform =
            `translate3d(` +
            `${progress * 30 - pointerSX * 16 - driftX}px, ` +
            `${progress * -40 - pointerSY * 12 - driftY}px, ` +
            `0)`;
        }

        if (heroContent) {
          const fade = clamp(
            1 - progress * 1.6,
            0,
            1
          );

          heroContent.style.transform =
            `translate3d(` +
            `0, ` +
            `${progress * 34}px, ` +
            `0)`;

          heroContent.style.opacity =
            String(fade);
        }

        if (heroStats) {
          heroStats.style.transform =
            `translate3d(` +
            `0, ` +
            `${progress * 18}px, ` +
            `0)`;
        }
      }

      if (networkVisual) {
        const rect =
          networkVisual.getBoundingClientRect();

        const viewportH =
          window.innerHeight;

        if (
          rect.top < viewportH &&
          rect.bottom > 0
        ) {
          const centered =
            (
              rect.top +
              rect.height / 2 -
              viewportH / 2
            ) / viewportH;

          networkVisual.style.transform =
            `translate3d(` +
            `0, ` +
            `${centered * -24}px, ` +
            `0)`;
        }
      }
    };

    requestAnimationFrame(tick);
  }

  initParallax();

  /* ==========================================================================
     Magnetic buttons
     ========================================================================== */

  function initMagneticButtons() {
    if (reduceMotion) return;

    document.querySelectorAll(".button").forEach((btn) => {
      let raf = null;

      btn.addEventListener(
        "pointermove",
        (event) => {
          const rect = btn.getBoundingClientRect();

          const relX =
            event.clientX -
            (rect.left + rect.width / 2);

          const relY =
            event.clientY -
            (rect.top + rect.height / 2);

          const dx = clamp(
            relX * 0.28,
            -8,
            8
          );

          const dy = clamp(
            relY * 0.32,
            -6,
            6
          );

          if (raf) {
            cancelAnimationFrame(raf);
          }

          raf = requestAnimationFrame(() => {
            btn.style.transform =
              `translate3d(` +
              `${dx}px, ` +
              `${dy}px, ` +
              `0)`;
          });
        },
        {
          passive: true
        }
      );

      btn.addEventListener(
        "pointerleave",
        () => {
          if (raf) {
            cancelAnimationFrame(raf);
          }

          btn.style.transform = "";
        }
      );
    });
  }

  initMagneticButtons();

  /* ==========================================================================
     Card tilt
     ========================================================================== */

  function initCardTilt() {
    if (reduceMotion) return;

    document.querySelectorAll(".card").forEach((card) => {
      let raf = null;

      card.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            card.getBoundingClientRect();

          const px =
            (event.clientX - rect.left) /
              rect.width -
            0.5;

          const py =
            (event.clientY - rect.top) /
              rect.height -
            0.5;

          const rotateY = clamp(
            px * 8,
            -8,
            8
          );

          const rotateX = clamp(
            py * -8,
            -8,
            8
          );

          if (raf) {
            cancelAnimationFrame(raf);
          }

          raf = requestAnimationFrame(() => {
            card.style.transform =
              `perspective(1400px) ` +
              `rotateX(${rotateX}deg) ` +
              `rotateY(${rotateY}deg) ` +
              `translateY(-4px) ` +
              `translateZ(0)`;
          });
        },
        {
          passive: true
        }
      );

      card.addEventListener(
        "pointerleave",
        () => {
          if (raf) {
            cancelAnimationFrame(raf);
          }

          card.style.transform = "";
        }
      );
    });
  }

  initCardTilt();
})();
