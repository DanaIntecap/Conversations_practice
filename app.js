/**
 * English Journey · Conversation Practice engine
 * -------------------------------------------------
 * Este script no contiene texto de ninguna actividad.
 * Carga un archivo data/units/<unit-id>.json y renderiza:
 *   - banner (meta)
 *   - ficha técnica colapsable (guide)
 *   - vocabulario (vocabulary[])
 *   - diálogos (dialogues[])
 *
 * Cómo elegir la unidad a mostrar (en este orden de prioridad):
 *   1. ?unit=a1-1-unit-05  en la URL
 *   2. data-unit="a1-1-unit-05"  en <body>
 *   3. "a1-1-unit-04" por defecto
 *
 * NOTA: los archivos JSON viven en data/units/ (esa carpeta sí se
 * mantiene) y se llaman a1-1-unit-04.json / a1-1-unit-05.json, así
 * que el id de unidad debe incluir el prefijo "a1-1-".
 */

(function () {
  "use strict";

  const DATA_BASE_PATH = "data/units/";

  function getUnitId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("unit");
    if (fromQuery) return fromQuery;

    const fromBody = document.body.getAttribute("data-unit");
    if (fromBody) return fromBody;

    return "a1-1-unit-04";
  }

  function speak(text, lang) {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech Synthesis no está soportado en este navegador.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderBanner(meta) {
    document.getElementById("bannerUnit").textContent =
      `${meta.unitLabel || ""} • CEFR Level: ${meta.cefrLevel || ""}`;
    document.getElementById("bannerTitle").textContent = meta.title || "";
    document.getElementById("bannerSubtitle").textContent = meta.subtitle || "";
    document.title = `${meta.title || "Speaking Cards"} · English Journey`;
  }

  function renderGuide(guide, meta) {
    if (!guide) {
      document.querySelector(".guide-panel").hidden = true;
      return;
    }

    const criteriaList = (guide.successCriteria || [])
      .map((item) => `<li>${item}</li>`)
      .join("");

    document.getElementById("guideMeta").innerHTML = `
      <span><strong>Skill:</strong> ${meta.skill || ""}</span>
      <span><strong>CEFR Level:</strong> ${meta.cefrLevel || ""}</span>
    `;
    document.getElementById("guideDescription").textContent = guide.description || "";
    document.getElementById("guideObjective").textContent = guide.objective || "";
    document.getElementById("guideCriteria").innerHTML = criteriaList;
  }

  function renderInstructionsBanner(text) {
    document.getElementById("instructionsBanner").textContent = text || "";
  }

  function renderVocabulary(vocabulary) {
    const section = document.getElementById("vocabSection");
    section.innerHTML = "";

    (vocabulary || []).forEach((item) => {
      const card = el("div", "vocab-card");

      const wordBtn = el(
        "button",
        "vocab-word",
        `🔊 ${item.icon || ""} ${item.word}`
      );
      wordBtn.type = "button";
      wordBtn.addEventListener("click", () => speak(item.word, item.lang));

      const def = el("span", "vocab-def", item.definition || "");

      card.appendChild(wordBtn);
      card.appendChild(def);
      section.appendChild(card);
    });
  }

  function buildMessageRow(line) {
    const row = el("div", `message-row ${line.speaker}`);
    if (line.speaker === "assistant") row.classList.add("reverse");

    const speakText = line.speech || line.text;

    const speakBtn = el("button", "btn-speak", "🔊");
    speakBtn.type = "button";
    speakBtn.setAttribute("aria-label", "Play pronunciation");
    speakBtn.addEventListener("click", () => speak(speakText, line.lang));

    const bubble = el(
      "button",
      "message-bubble",
      `<strong>${line.speaker === "customer" ? "Customer" : "Assistant"}:</strong><br>"${line.text}"`
    );
    bubble.type = "button";
    bubble.addEventListener("click", () => speak(speakText, line.lang));

    row.appendChild(speakBtn);
    row.appendChild(bubble);
    return row;
  }

  function renderDialogues(dialogues) {
    const root = document.getElementById("dialoguesRoot");
    root.innerHTML = "";

    (dialogues || []).forEach((dialogue) => {
      const section = el(
        "div",
        `chat-section${dialogue.highlight ? " highlight" : ""}`
      );
      section.appendChild(el("h3", null, dialogue.title || ""));

      (dialogue.lines || []).forEach((line) => {
        if (line.type === "divider") {
          section.appendChild(el("hr", "divider"));
          return;
        }
        section.appendChild(buildMessageRow(line));
      });

      root.appendChild(section);
    });
  }

  function showError() {
    document.getElementById("pageLoader").hidden = true;
    document.getElementById("pageError").hidden = false;
  }

  // Carga data/index.json (catálogo de unidades) y arma el <select>.
  // Si el archivo no existe todavía, el selector simplemente no aparece
  // (no rompe la actividad — es una mejora opcional).
  async function initUnitPicker(currentUnitId) {
    const picker = document.querySelector(".unit-picker");
    const select = document.getElementById("unitSelect");
    if (!picker || !select) return;

    try {
      const response = await fetch("data/index.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const catalog = await response.json();

      if (!Array.isArray(catalog) || catalog.length === 0) {
        picker.hidden = true;
        return;
      }

      select.innerHTML = catalog
        .map(
          (item) =>
            `<option value="${item.id}"${item.id === currentUnitId ? " selected" : ""}>${item.title || item.id}</option>`
        )
        .join("");

      select.addEventListener("change", () => {
        const params = new URLSearchParams(window.location.search);
        params.set("unit", select.value);
        window.location.search = params.toString();
      });

      picker.hidden = false;
    } catch (err) {
      // No hay catálogo aún: ocultamos el selector sin afectar el resto.
      picker.hidden = true;
    }
  }

  async function init() {
    const unitId = getUnitId();
    initUnitPicker(unitId);

    try {
      const response = await fetch(`${DATA_BASE_PATH}${unitId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      renderBanner(data.meta || {});
      renderGuide(data.guide, data.meta || {});
      renderInstructionsBanner(data.instructionsBanner);
      renderVocabulary(data.vocabulary);
      renderDialogues(data.dialogues);

      document.getElementById("pageLoader").hidden = true;
      document.getElementById("app").hidden = false;
    } catch (err) {
      console.error("No se pudo cargar la unidad:", err);
      showError();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
