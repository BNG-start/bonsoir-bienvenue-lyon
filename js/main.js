/* Bonsoir Bienvenue — en-tête, menu, statut d'ouverture, demande de réservation via Instagram */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var IG = "bonsoir.bienvenue";
  var header = document.querySelector(".header");
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  var fab = document.querySelector(".fab");
  var reserve = document.getElementById("reserver");

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    var r = reserve.getBoundingClientRect();
    var inReserve = r.top < window.innerHeight * 0.8 && r.bottom > 0;
    fab.classList.toggle("is-visible", y > window.innerHeight * 0.7 && !inReserve);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* Horaires (heure de Lyon) : mar/mer 18h-23h, jeu 18h-1h, ven/sam 18h-2h, dim/lun fermé.
     Les heures après minuit appartiennent au service de la veille. */
  var CLOSE = { 2: 23, 3: 23, 4: 25, 5: 26, 6: 26 };
  var NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  function fmt(h) { return (h % 24) + "h"; }
  function lyonNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[get("weekday")], h: Number(get("hour")) % 24 + Number(get("minute")) / 60 };
  }
  function nextOpen(day) {
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (CLOSE[d]) return i === 1 ? "demain à 18h" : NAMES[d] + " à 18h";
    }
  }
  function updateStatus() {
    var now = lyonNow(), text, open = false;
    var yesterday = (now.day + 6) % 7;
    if (CLOSE[yesterday] && CLOSE[yesterday] > 24 && now.h < CLOSE[yesterday] - 24) {
      open = true; text = "Ouvert · jusqu’à " + fmt(CLOSE[yesterday]);
    } else if (CLOSE[now.day] && now.h >= 18) {
      open = true; text = "Ouvert · jusqu’à " + fmt(CLOSE[now.day]);
    } else if (CLOSE[now.day] && now.h < 18) {
      text = "Fermé · ouvre à 18h";
    } else {
      text = "Fermé · ouvre " + nextOpen(now.day);
    }
    document.querySelectorAll("[data-status-text]").forEach(function (el) { el.textContent = text; });
    document.querySelectorAll("[data-status]").forEach(function (el) { el.classList.toggle("is-open", open); });
    document.querySelectorAll(".hours tr").forEach(function (tr) {
      tr.classList.toggle("is-today", Number(tr.getAttribute("data-day")) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* Réservation : la demande est copiée puis la conversation Instagram s'ouvre */
  var form = document.getElementById("form");
  var error = document.getElementById("form-error");
  var ok = document.getElementById("form-ok");
  var dateInput = document.getElementById("date");
  var slotsBox = document.querySelector("[data-slots]");
  var persOut = document.getElementById("pers");
  var persons = 2, heure = "";

  var d = new Date();
  dateInput.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  ["18h30", "19h", "19h30", "20h", "20h30", "21h", "21h30"].forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = s;
    b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.addEventListener("click", function () {
      heure = s;
      slotsBox.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
    });
    slotsBox.appendChild(b);
  });

  form.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      persons = Math.min(20, Math.max(1, persons + Number(b.getAttribute("data-step"))));
      persOut.textContent = persons;
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    error.textContent = ""; ok.hidden = true;
    var f = form.elements;
    var nom = f.nom.value.trim(), date = f.date.value;
    if (!nom || !date) { error.textContent = "Il nous faut votre prénom et la date."; return; }
    var day = new Date(date + "T12:00:00").getDay();
    if (!CLOSE[day]) { error.textContent = "On est fermés le dimanche et le lundi. Une autre date ?"; return; }
    if (!heure) { error.textContent = "À quelle heure arrivez-vous ?"; return; }
    var dateFr = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    var msg = "Bonsoir ! Je voudrais réserver pour manger : " + persons + " pers., " + dateFr + " à " + heure + ". " + nom + ".";
    if (f.message.value.trim()) msg += " " + f.message.value.trim();
    var open = function () { window.open("https://ig.me/m/" + IG, "_blank", "noopener"); ok.hidden = false; };
    if (navigator.clipboard) navigator.clipboard.writeText(msg).then(open, open); else open();
  });

  /* Apparitions au défilement */
  var items = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = Math.min(i, 4) * 90 + "ms";
      io.observe(el);
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
