// Fortschritt (pro Handy) + Quiz-Logik für alle Stationsseiten
// Fragetypen (data-type am .quiz): "single" (ein Klick), "multi" (mehrere wählen + prüfen),
// "number" (Zahlen eingeben + prüfen)
(function () {
  var TOTAL = 5;
  var KEY = "pfs-schnitzeljagd";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  // Vorschau-Modus (nur lokal am PC): Seite komplett aufgeklappt zeigen, Fortschritt nicht speichern
  var preview = location.hostname === "localhost" && /[?&]vorschau\b/.test(location.search);

  // ===== FREISCHALTUNG =====
  // false = Testphase: Nur Handys, die einmal den Test-Link geöffnet haben, sehen die Schnitzeljagd.
  // true  = freigeschaltet für alle. Zum Freischalten hier auf true ändern und neu hochladen.
  var LIVE = false;
  var TEST_CODE = "kraene26";             // Test-Link: …/schnitzeljagd/?testmodus=kraene26
  var TEST_KEY = "pfs-schnitzeljagd-test";
  var m = location.search.match(/[?&]testmodus=([^&]+)/);
  try {
    if (m && m[1] === TEST_CODE) localStorage.setItem(TEST_KEY, "1");
    if (m && m[1] === "aus") localStorage.removeItem(TEST_KEY);
  } catch (e) {}
  var tester = false;
  try { tester = localStorage.getItem(TEST_KEY) === "1"; } catch (e) {}
  var allowed = LIVE || tester || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!allowed) {
    document.querySelector("main").innerHTML =
      '<div class="card"><div class="kicker">Mission Plastikfreier Stadthafen</div>' +
      "<h1>Die Schnitzeljagd startet bald!</h1>" +
      "<p>Hier entsteht eine Schnitzeljagd der Initiative Plastikfreie Stadt rund um den Rostocker Stadthafen. " +
      "Schaut bald wieder vorbei!</p>" +
      '<a class="map-btn" style="background:var(--green);color:#fff" href="https://plastikfreiestadt.org">Zur Initiative Plastikfreie Stadt</a></div>';
    document.body.classList.remove("pending");
    return;
  }
  document.body.classList.remove("pending");
  if (tester && !LIVE) {
    var badge = document.createElement("div");
    badge.className = "testbadge";
    badge.textContent = "TESTMODUS";
    document.body.appendChild(badge);
  }

  // Rundkurs: Jedes Team startet an einer beliebigen Station. Eine Station zählt als geschafft,
  // sobald ihre Frage richtig beantwortet ist. Wer die 5. Station löst, bekommt dort die Urkunde.
  var station = Number(document.body.dataset.station || 0);
  var found = load();   // gelöste Stationen dieses Handys
  var alreadySolved = station && found.indexOf(station) !== -1;

  var bar = document.querySelector(".progress");
  function renderBar() {
    if (!bar) return;
    bar.innerHTML = "";
    for (var i = 1; i <= TOTAL; i++) {
      var dot = document.createElement("span");
      dot.textContent = i;
      if (found.indexOf(i) !== -1) dot.className = "found";
      if (i === station) dot.className += " here";
      bar.appendChild(dot);
    }
  }
  renderBar();

  // Teamname: wird beim ersten Öffnen einer Seite abgefragt und steht am Ende auf der Urkunde
  var TEAM_KEY = "pfs-schnitzeljagd-team";
  function getTeam() {
    if (preview) return "Die Warnow-Retter";
    try { return localStorage.getItem(TEAM_KEY) || ""; } catch (e) { return ""; }
  }
  function setTeam(name) {
    try { localStorage.setItem(TEAM_KEY, name); } catch (e) {}
  }

  var main = document.querySelector("main");
  var teamBox = document.createElement("div");
  main.insertBefore(teamBox, bar ? bar.nextSibling : main.firstChild);
  renderTeam(false);

  function renderTeam(edit) {
    var name = getTeam();
    if (name && !edit) {
      teamBox.className = "team-chip";
      teamBox.innerHTML = '<span>Team <strong></strong></span><button type="button">ändern</button>';
      teamBox.querySelector("strong").textContent = name;
      teamBox.querySelector("button").onclick = function () { renderTeam(true); };
      return;
    }
    teamBox.className = "card team";
    teamBox.innerHTML =
      '<h2>Wie heißt euer Team?</h2>' +
      '<p>Gebt euch einen Namen – er steht am Ende auf eurer Urkunde.</p>' +
      '<form><input type="text" maxlength="30" autocomplete="off" placeholder="z. B. Die Warnow-Retter" aria-label="Teamname">' +
      '<button type="submit" class="check">Los geht\'s!</button></form>';
    var input = teamBox.querySelector("input");
    input.value = name;
    teamBox.querySelector("form").onsubmit = function (ev) {
      ev.preventDefault();
      var v = input.value.replace(/\s+/g, " ").trim();
      if (!v) { input.focus(); return; }
      setTeam(v);
      renderTeam(false);
    };
  }

  // Idee des Teams (Challenge an Station 5) – erscheint auf der Urkunde
  var IDEA_KEY = "pfs-schnitzeljagd-idee";
  function getIdea() {
    if (preview) return "Ein gemeinsames Mehrweg-Pfandsystem für alle Cafés am Stadthafen.";
    try { return localStorage.getItem(IDEA_KEY) || ""; } catch (e) { return ""; }
  }
  function setIdea(text) {
    try { localStorage.setItem(IDEA_KEY, text); } catch (e) {}
  }

  function initIdea(box) {
    box.innerHTML =
      '<textarea maxlength="140" rows="3" placeholder="Unsere Idee: …" aria-label="Eure Idee für Rostock"></textarea>' +
      '<button type="button" class="check">Idee speichern</button><p class="idea-status" aria-live="polite"></p>';
    var ta = box.querySelector("textarea"), status = box.querySelector(".idea-status");
    ta.value = getIdea();
    if (ta.value) status.textContent = "✓ Gespeichert – steht auf eurer Urkunde.";
    box.querySelector("button").onclick = function () {
      var v = ta.value.replace(/\s+/g, " ").trim();
      if (!v) { ta.focus(); status.textContent = "Schreibt zuerst eure Idee auf."; return; }
      setIdea(v);
      status.textContent = "✓ Gespeichert – steht auf eurer Urkunde.";
      // Falls die Urkunde auf dieser Seite schon da ist: mit Idee neu erstellen
      var cert = document.querySelector("[data-urkunde][data-ready]");
      if (cert) { delete cert.dataset.ready; showCertificate(cert); }
    };
  }

  // Reihenfolge-Aufgabe: Begriffe in der richtigen Reihenfolge antippen
  function initOrder(box) {
    var right = box.dataset.order.split("|");
    var pool = right.slice().sort(function () { return Math.random() - 0.5; });
    if (pool.join() === right.join()) pool.reverse();
    var chosen = [];
    function render(result) {
      box.innerHTML =
        '<ol class="order-list">' + chosen.map(function (t) { return "<li><button type=\"button\">" + t + "</button></li>"; }).join("") + "</ol>" +
        '<div class="order-pool">' + pool.map(function (t) { return "<button type=\"button\">" + t + "</button>"; }).join("") + "</div>" +
        '<p class="order-status" aria-live="polite"></p>';
      var status = box.querySelector(".order-status");
      if (result === true) {
        box.classList.add("done");
        status.textContent = "✓ " + box.dataset.ok;
        return;
      }
      if (typeof result === "number") {
        status.textContent = result + " von " + right.length + " an der richtigen Stelle – tippt Schritte an, um sie zurückzulegen.";
        status.className = "order-status bad";
      } else if (!chosen.length) {
        status.textContent = "Tippt den ersten Schritt an.";
      }
      box.querySelectorAll(".order-pool button").forEach(function (b, i) {
        b.onclick = function () {
          chosen.push(pool.splice(i, 1)[0]);
          if (pool.length) { render(); return; }
          var hits = chosen.filter(function (t, k) { return t === right[k]; }).length;
          render(hits === right.length ? true : hits);
        };
      });
      box.querySelectorAll(".order-list button").forEach(function (b, i) {
        b.onclick = function () { pool.push(chosen.splice(i, 1)[0]); render(); };
      });
    }
    if (preview) { chosen = right.slice(); pool = []; render(true); } else render();
  }

  document.querySelectorAll(".idea").forEach(initIdea);
  document.querySelectorAll(".order[data-order]").forEach(initOrder);

  // Urkunde als Bild (zum Speichern und Teilen auf dem Handy)
  function loadImage(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = rej;
      img.src = src;
    });
  }

  function fitText(g, text, maxWidth, size, weight) {
    do { g.font = weight + " " + size + "px Montserrat, Helvetica, Arial, sans-serif"; size -= 2; }
    while (g.measureText(text).width > maxWidth && size > 20);
  }

  function wrapLines(g, text, maxWidth) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else { line = test; }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCertificate(team, idea) {
    var W = 1080, H = idea ? 1560 : 1350;
    var logoSrc = document.querySelector("header img").getAttribute("src");
    var fonts = document.fonts ? Promise.all([
      document.fonts.load("800 60px Montserrat"), document.fonts.load("700 30px Montserrat"), document.fonts.load("500 30px Montserrat")
    ]).catch(function () {}) : Promise.resolve();
    return Promise.all([loadImage(logoSrc), fonts]).then(function (r) {
      var logo = r[0];
      var c = document.createElement("canvas");
      c.width = W; c.height = H;
      var g = c.getContext("2d");
      g.fillStyle = "#ebf2eb"; g.fillRect(0, 0, W, H);
      // Karte
      g.fillStyle = "#ffffff";
      g.beginPath(); g.roundRect ? g.roundRect(60, 60, W - 120, H - 120, 40) : g.rect(60, 60, W - 120, H - 120); g.fill();
      g.strokeStyle = "#7cc68d"; g.lineWidth = 10; g.stroke();
      // Wellen unten
      g.strokeStyle = "#cfe3d3"; g.lineWidth = 6;
      for (var row = 0; row < 3; row++) {
        g.beginPath();
        for (var x = 90; x <= W - 90; x += 4) {
          var y = H - 190 + row * 26 + Math.sin(x / 38 + row) * 8;
          x === 90 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      g.textAlign = "center";
      // Logo
      var lw = 300, lh = lw * logo.height / logo.width;
      g.drawImage(logo, (W - lw) / 2, 120, lw, lh);
      var y = 120 + lh + 90;
      g.fillStyle = "#728da5"; g.font = "700 34px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("U R K U N D E", W / 2, y);
      y += 60;
      g.fillStyle = "#424242"; g.font = "500 34px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("Mission Plastikfreier Stadthafen", W / 2, y);
      y += 110;
      g.font = "500 32px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("Hiermit erhält das Team", W / 2, y);
      y += 100;
      g.fillStyle = "#424242"; fitText(g, team, W - 220, 84, "800");
      g.fillText(team, W / 2, y);
      y += 90;
      g.font = "500 32px Montserrat, Helvetica, Arial, sans-serif"; g.fillStyle = "#424242";
      g.fillText("den Titel", W / 2, y);
      y += 90;
      g.fillStyle = "#4f9d62"; g.font = "800 58px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("Plastikfrei-Profi", W / 2, y);
      y += 62;
      g.font = "700 38px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("des Rostocker Stadthafens", W / 2, y);
      // Fünf Stationen
      y += 90;
      for (var i = 0; i < 5; i++) {
        var cx = W / 2 + (i - 2) * 92;
        g.beginPath(); g.arc(cx, y, 34, 0, Math.PI * 2); g.fillStyle = "#7cc68d"; g.fill();
        g.fillStyle = "#ffffff"; g.font = "800 32px Montserrat, Helvetica, Arial, sans-serif";
        g.fillText(String(i + 1), cx, y + 11);
      }
      y += 80;
      g.fillStyle = "#728da5"; g.font = "700 26px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("Alle 5 Stationen gemeistert", W / 2, y);
      // Idee des Teams
      if (idea) {
        y += 90;
        g.fillStyle = "#728da5"; g.font = "700 26px Montserrat, Helvetica, Arial, sans-serif";
        g.fillText("UNSERE IDEE FÜR ROSTOCK", W / 2, y);
        g.fillStyle = "#424242"; g.font = "italic 500 32px Montserrat, Helvetica, Arial, sans-serif";
        var lines = wrapLines(g, "„" + idea + "“", W - 260).slice(0, 4);
        lines.forEach(function (l) { y += 46; g.fillText(l, W / 2, y); });
      }
      // Fuß
      var date = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
      g.fillStyle = "#424242"; g.font = "500 26px Montserrat, Helvetica, Arial, sans-serif";
      g.fillText("Rostock, " + date, W / 2, H - 250);
      g.font = "700 24px Montserrat, Helvetica, Arial, sans-serif"; g.fillStyle = "#4f9d62";
      g.fillText("Initiative Plastikfreie Stadt · KuBuS e.V. · plastikfreiestadt.org", W / 2, H - 100);
      return new Promise(function (res) { c.toBlob(res, "image/png"); });
    });
  }

  function showCertificate(box) {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    var team = getTeam() || "Unser Team";
    box.innerHTML = '<p>Eure Urkunde wird erstellt …</p>';
    drawCertificate(team, getIdea()).then(function (blob) {
      var file = "Urkunde-" + team.replace(/[^A-Za-z0-9ÄÖÜäöüß-]+/g, "-") + ".png";
      var url = URL.createObjectURL(blob);
      box.innerHTML =
        '<img class="urkunde-bild" alt="Urkunde für das Team">' +
        '<div class="urkunde-actions">' +
        '<button type="button" class="map-btn share">📤 Urkunde teilen</button>' +
        '<a class="map-btn save">💾 Speichern</a></div>' +
        '<p class="urkunde-tipp">Tipp: Lange auf das Bild drücken, um es in den Fotos zu sichern.</p>';
      box.querySelector("img").src = url;
      var save = box.querySelector(".save");
      save.href = url; save.download = file;
      var shareBtn = box.querySelector(".share");
      var f = typeof File === "function" ? new File([blob], file, { type: "image/png" }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
        shareBtn.onclick = function () {
          navigator.share({ files: [f], title: "Unsere Urkunde", text: "Wir sind Plastikfrei-Profis des Rostocker Stadthafens! 🌊" })
            .catch(function () {});
        };
      } else {
        shareBtn.remove();
      }
    }).catch(function () {
      box.innerHTML = "<p>Die Urkunde konnte nicht erstellt werden. Bitte die Seite neu laden.</p>";
    });
  }

  var quiz = document.querySelector(".quiz");
  if (!quiz) return;
  var type = quiz.dataset.type;
  var answers = quiz.querySelector(".answers");
  var feedback = quiz.querySelector(".feedback");
  var check = quiz.querySelector(".check");

  function solved(quiet) {
    quiz.classList.add("done");
    answers.classList.add("done");
    feedback.className = "feedback";
    feedback.textContent = alreadySolved ? "Diese Station habt ihr schon gelöst." : "Richtig! Mission erfüllt.";
    if (check) check.disabled = true;

    if (!preview && found.indexOf(station) === -1) { found.push(station); save(found); }
    renderBar();
    // In der Vorschau zeigt Station 5 beispielhaft das Finale
    var finished = preview ? station === TOTAL : found.length >= TOTAL;

    document.querySelectorAll(".reveal").forEach(function (el) {
      if (finished && el.hasAttribute("data-weiter")) return;
      el.classList.add("show");
    });
    if (finished) {
      document.querySelectorAll("[data-finale]").forEach(function (el) { el.classList.add("show"); });
      var cert = document.querySelector("[data-urkunde]");
      if (cert) showCertificate(cert);
    } else {
      var rest = TOTAL - found.length;
      var noch = document.querySelector("[data-noch]");
      if (noch) noch.innerHTML = "<strong>Noch " + rest + (rest === 1 ? " Station" : " Stationen") +
        "</strong> – dann habt ihr's geschafft!";
      showMap();
    }
    var first = document.querySelector(".reveal.show, .finale.show");
    if (first && !preview && !quiet) setTimeout(function () { first.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150);
  }
  // Kleine Karte im Wegweiser: aktuelle Station (grau) -> nächste Station (grün)
  function showMap() {
    var el = document.querySelector(".map[data-to]");
    if (!el || el.dataset.ready || typeof L === "undefined") return;
    el.dataset.ready = "1";
    var from = el.dataset.from.split(",").map(Number);
    var to = el.dataset.to.split(",").map(Number);
    var map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap-Mitwirkende"
    }).addTo(map);
    L.circleMarker(from, { radius: 7, color: "#728da5", fillColor: "#728da5", fillOpacity: 1 })
      .addTo(map).bindTooltip("Ihr seid hier");
    L.circleMarker(to, { radius: 10, color: "#4f9d62", fillColor: "#7cc68d", fillOpacity: 1, weight: 3 })
      .addTo(map).bindTooltip(el.dataset.label, { permanent: true, direction: "top", offset: [0, -8] });
    L.polyline([from, to], { color: "#4f9d62", weight: 3, dashArray: "6 6" }).addTo(map);
    map.fitBounds([from, to], { padding: [40, 40], maxZoom: 18 });
  }

  function wrong(msg, el) {
    feedback.className = "feedback bad";
    feedback.textContent = msg;
    var target = el || answers;
    target.classList.remove("shake"); void target.offsetWidth; target.classList.add("shake");
  }

  if (type === "single") {
    answers.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button");
      if (!btn || quiz.classList.contains("done")) return;
      if (btn.hasAttribute("data-right")) { btn.classList.add("right"); solved(); }
      else { btn.classList.add("wrong"); wrong("Leider nicht – versucht's nochmal!", btn); }
    });
  }

  if (type === "multi") {
    answers.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button");
      if (!btn || quiz.classList.contains("done")) return;
      btn.classList.toggle("selected");
      btn.setAttribute("aria-pressed", btn.classList.contains("selected"));
      feedback.textContent = "";
    });
    check.addEventListener("click", function () {
      var btns = answers.querySelectorAll("button");
      var ok = true, chosen = 0, hits = 0, needed = 0;
      btns.forEach(function (b) {
        var sel = b.classList.contains("selected"), right = b.hasAttribute("data-right");
        if (sel) chosen++;
        if (right) needed++;
        if (sel && right) hits++;
        if (sel !== right) ok = false;
      });
      if (ok) {
        btns.forEach(function (b) { if (b.hasAttribute("data-right")) b.classList.add("right"); });
        solved();
      } else if (chosen === 0) {
        wrong("Wählt zuerst eure Antworten aus.");
      } else {
        wrong(hits + " von " + needed + " richtigen Antworten gefunden" +
          (chosen > hits ? " – aber auch etwas Falsches dabei." : ".") + " Versucht's nochmal!");
      }
    });
  }

  // Vorschau oder schon gelöste Station (z. B. erneut gescannt): Lösung direkt aufgeklappt zeigen
  if (preview || alreadySolved) {
    answers.querySelectorAll("button[data-right]").forEach(function (b) { b.classList.add("right"); });
    quiz.querySelectorAll("input[data-answer]").forEach(function (inp) {
      inp.value = inp.dataset.answer; inp.classList.add("right"); inp.disabled = true;
    });
    window.addEventListener("load", function () {
      solved(true);
      window.scrollTo(0, 0);
    });
  }

  if (type === "number") {
    check.addEventListener("click", function () {
      var inputs = quiz.querySelectorAll("input[data-answer]");
      var ok = true;
      inputs.forEach(function (inp) {
        var right = Number(inp.value.replace(/\s/g, "")) === Number(inp.dataset.answer);
        inp.classList.toggle("wrong", !right && inp.value !== "");
        inp.classList.toggle("right", right);
        if (!right) ok = false;
      });
      if (ok) {
        inputs.forEach(function (inp) { inp.disabled = true; });
        solved();
      } else {
        wrong("Noch nicht ganz – rechnet nochmal nach!");
      }
    });
  }
})();
