(() => {
  const THEME_KEY = "bk_portfolio_theme";
  const NAV_OPEN_CLASS = "nav-open";
  const EMAIL_TO = "bony.jaiswal@gmail.com";

  const prefersReducedMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const setYear = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const toast = (() => {
    let t = null;
    return (message, timeoutMs = 2200) => {
      const el = document.querySelector("[data-toast]");
      if (!el) return;
      el.textContent = message;
      el.hidden = false;
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        el.hidden = true;
      }, timeoutMs);
    };
  })();

  const getPreferredTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  const initThemeToggle = () => {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    const theme = getPreferredTheme();
    applyTheme(theme);
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
  };

  const initScrollProgress = () => {
    const bar = document.querySelector("[data-scroll-progress]");
    if (!bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${Math.max(0, Math.min(100, p))}%`;
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  };

  const initBackToTop = () => {
    const btn = document.querySelector("[data-back-to-top]");
    if (!btn) return;

    const update = () => {
      btn.hidden = window.scrollY < 600;
    };

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });

    update();
    window.addEventListener("scroll", update, { passive: true });
  };

  const initMobileNav = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const overlay = document.querySelector("[data-nav-overlay]");
    const nav = document.querySelector("[data-nav]");
    if (!toggle || !overlay || !nav) return;

    const close = () => {
      document.body.classList.remove(NAV_OPEN_CLASS);
      overlay.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };

    const open = () => {
      document.body.classList.add(NAV_OPEN_CLASS);
      overlay.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      if (typeof window.__bkScrollSpyUpdate === "function") window.__bkScrollSpyUpdate();
    };

    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.contains(NAV_OPEN_CLASS);
      isOpen ? close() : open();
    });

    overlay.addEventListener("click", close);

    nav.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  };

  const initScrollSpy = () => {
    const links = Array.from(document.querySelectorAll("[data-nav-link]")).filter(
      (a) => a instanceof HTMLAnchorElement && a.getAttribute("href")?.startsWith("#")
    );
    if (links.length === 0) return;

    const linkById = new Map();
    for (const a of links) {
      const id = (a.getAttribute("href") || "").slice(1);
      if (id) linkById.set(id, a);
    }

    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (sections.length === 0) return;

    const setCurrent = (id) => {
      for (const a of links) a.removeAttribute("aria-current");
      const active = linkById.get(id);
      if (active) active.setAttribute("aria-current", "page");
    };

    const headerEl = document.querySelector(".site-header");
    const getTopOffset = () => {
      const h = headerEl instanceof HTMLElement ? headerEl.getBoundingClientRect().height : 0;
      return Math.max(0, Math.round(h + 12));
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const offset = getTopOffset();

      let best = null;
      for (const s of sections) {
        if (!(s instanceof HTMLElement)) continue;
        const r = s.getBoundingClientRect();
        const top = r.top - offset;
        if (top <= 24) {
          if (!best || top > best.top) best = { id: s.id, top };
        }
      }

      if (best?.id) setCurrent(best.id);
      else if (sections[0]?.id) setCurrent(sections[0].id);
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    window.__bkScrollSpyUpdate = update;

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", update);
  };

  const initReveal = () => {
    const candidates = [
      ...document.querySelectorAll("main .section-head"),
      ...document.querySelectorAll("main .card"),
      ...document.querySelectorAll(".hero-copy"),
      ...document.querySelectorAll(".hero-card"),
      ...document.querySelectorAll(".site-footer"),
    ];

    const els = Array.from(new Set(candidates)).filter((el) => el instanceof HTMLElement);
    if (els.length === 0) return;

    const isInView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92;
    };

    for (const el of els) {
      el.classList.add("reveal");
      if (isInView(el)) el.classList.add("is-visible");
    }
    if (prefersReducedMotion()) {
      for (const el of els) el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    for (const el of els) {
      if (!el.classList.contains("is-visible")) io.observe(el);
    }
  };

  const initCountUp = () => {
    const spans = Array.from(document.querySelectorAll("[data-countup]")).filter(
      (el) => el instanceof HTMLElement
    );
    if (spans.length === 0) return;

    const animate = (el, target) => {
      const hasDecimal = String(target).includes(".");
      const precision = hasDecimal ? 1 : 0;
      const duration = 850;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = hasDecimal ? val.toFixed(precision) : String(Math.round(val));
        if (t < 1) window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          const raw = el.getAttribute("data-countup") || "";
          const target = Number(raw);
          if (!Number.isFinite(target)) continue;
          io.unobserve(el);
          if (prefersReducedMotion()) {
            el.textContent = raw;
          } else {
            el.textContent = raw.includes(".") ? "0.0" : "0";
            animate(el, target);
          }
        }
      },
      { threshold: 0.4 }
    );

    for (const el of spans) io.observe(el);
  };

  const initCopyButtons = () => {
    const btns = Array.from(document.querySelectorAll("[data-copy]")).filter(
      (b) => b instanceof HTMLButtonElement
    );
    if (btns.length === 0) return;

    const copyText = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "-9999px";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand("copy");
          ta.remove();
          return ok;
        } catch {
          return false;
        }
      }
    };

    for (const btn of btns) {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy") || "";
        if (!text) return;
        const ok = await copyText(text);
        if (ok) toast("Copied to clipboard");
        else toast("Copy failed (browser blocked clipboard)");
      });
    }
  };

  const WORK_DETAILS = {
    Lumen: {
      subtitle: "ESM · Integrations · LWC",
      bullets: [
        "Developed custom logic and enhanced ESM features.",
        "Built Salesforce APIs integrated via Mule to downstream systems.",
        "Focused on reliability patterns and clean integration contracts.",
      ],
      tags: ["integration", "ui", "cpq-epc"],
    },
    SiriusXM: {
      subtitle: "OmniStudio · Comms Cloud · Data flows",
      bullets: [
        "Built OmniScripts, Integration Procedures, and DataRaptors for subscription workflows.",
        "Implemented robust error-handling patterns for higher reliability.",
        "Optimized integrations and data processes to streamline flows.",
      ],
      tags: ["omnistudio", "integration"],
    },
    "3Water (NZ Government)": {
      subtitle: "OmniScript + LWC · UX",
      bullets: [
        "Delivered end-to-end UI leveraging OmniScript + LWC for water distribution management.",
        "Customized and overrode OmniScripts to match complex workflows.",
        "Focused on user experience and seamless system integration.",
      ],
      tags: ["omnistudio", "ui"],
    },
    "AT&T": {
      subtitle: "Billing flows · EPC · Order Management",
      bullets: [
        "Led billing flow logic and order management implementation for a multi-team program.",
        "Configured EPC for product setup and integration.",
        "Enabled cross-team data exchange via MuleSoft and aligned deliverables across stakeholders.",
      ],
      tags: ["cpq-epc", "integration"],
    },
    Intuit: {
      subtitle: "LWC · CI/CD",
      bullets: [
        "Developed LWCs for B2B/B2C Salesforce platforms.",
        "Built CI/CD pipelines using Python + SFDX to streamline deployments.",
        "Automated workflows to minimize deployment errors and improve delivery speed.",
      ],
      tags: ["ui", "delivery"],
    },
    "Schneider Electric": {
      subtitle: "Service logs · Complaint tracking",
      bullets: [
        "Enhanced service log management and complaint tracking workflows.",
        "Improved data handling and reporting for better operational visibility.",
      ],
      tags: ["ui"],
    },
  };

  const initWorkFilter = () => {
    const grid = document.querySelector("[data-work-grid]");
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll("[data-work-tags]")).filter(
      (el) => el instanceof HTMLElement
    );
    const btns = Array.from(document.querySelectorAll("[data-filter]")).filter(
      (el) => el instanceof HTMLButtonElement
    );
    if (cards.length === 0 || btns.length === 0) return;

    const setActive = (filter) => {
      for (const b of btns) {
        const isActive = b.getAttribute("data-filter") === filter;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", isActive ? "true" : "false");
      }
    };

    const apply = (filter) => {
      setActive(filter);
      for (const card of cards) {
        const tags = (card.getAttribute("data-work-tags") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const show = filter === "all" ? true : tags.includes(filter);
        card.hidden = !show;
      }
    };

    for (const b of btns) {
      b.addEventListener("click", () => apply(b.getAttribute("data-filter") || "all"));
    }

    apply("all");
  };

  const initWorkModal = () => {
    const dialog = document.querySelector("[data-work-modal]");
    if (!(dialog instanceof HTMLDialogElement)) return;

    const titleEl = dialog.querySelector("[data-modal-title]");
    const subtitleEl = dialog.querySelector("[data-modal-subtitle]");
    const bulletsEl = dialog.querySelector("[data-modal-bullets]");
    const tagsEl = dialog.querySelector("[data-modal-tags]");
    if (!titleEl || !subtitleEl || !bulletsEl || !tagsEl) return;

    const openers = Array.from(document.querySelectorAll("[data-work-open]")).filter(
      (el) => el instanceof HTMLButtonElement
    );
    if (openers.length === 0) return;

    const fillFromCard = (title) => {
      const card = document.querySelector(`[data-work-title="${CSS.escape(title)}"]`);
      const subtitle = card?.querySelector(".meta")?.textContent?.trim() || "";
      const bullets = Array.from(card?.querySelectorAll("li") || []).map((li) => li.textContent?.trim()).filter(Boolean);
      const tags = (card?.getAttribute("data-work-tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return { subtitle, bullets, tags };
    };

    const open = (title) => {
      const details = WORK_DETAILS[title] || fillFromCard(title);
      titleEl.textContent = title;
      subtitleEl.textContent = details.subtitle || "";
      bulletsEl.innerHTML = "";
      for (const b of details.bullets || []) {
        const li = document.createElement("li");
        li.textContent = b;
        bulletsEl.appendChild(li);
      }
      tagsEl.innerHTML = "";
      for (const t of details.tags || []) {
        const s = document.createElement("span");
        s.className = "modal-tag";
        s.textContent = t;
        tagsEl.appendChild(s);
      }

      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };

    for (const btn of openers) {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-work-open") || "";
        if (title) open(title);
      });
    }

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  };

  const initContactForm = () => {
    const form = document.querySelector("[data-contact-form]");
    if (!(form instanceof HTMLFormElement)) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const subject = `Portfolio inquiry${name ? ` — ${name}` : ""}`;
      const bodyLines = [
        "Hi Baibhav,",
        "",
        message || "(Write your message here)",
        "",
        "---",
        name ? `Name: ${name}` : null,
        email ? `Email: ${email}` : null,
      ].filter(Boolean);

      const mailto = `mailto:${encodeURIComponent(EMAIL_TO)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

      toast("Opening your email app…");
      window.location.href = mailto;
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    initThemeToggle();
    initScrollProgress();
    initBackToTop();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initCountUp();
    initCopyButtons();
    initWorkFilter();
    initWorkModal();
    initContactForm();
  });
})();
