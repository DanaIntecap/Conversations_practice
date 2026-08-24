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
 *   1. ?unit=unit-05  en la URL
 *   2. data-unit="unit-05"  en <body>
 *   3. "unit-04" por defecto
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

    return "unit-04";
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
    const body = document.getElementById("guideBody");
    if (!guide) {
      document.querySelector(".guide-panel").hidden = true;
      return;
    }

    const instructionsList = (guide.instructions || [])
      .map((item) => `<li>${item}</li>`)
      .join("");
    const criteriaList = (guide.successCriteria || [])
      .map((item) => `<li>${item}</li>`)
      .join("");

    body.innerHTML = `
      <div class="guide-meta">
        <span><strong>Skill:</strong> ${meta.skill || ""}</span>
        <span><strong>CEFR Level:</strong> ${meta.cefrLevel || ""}</span>
      </div>
      <p>${guide.description || ""}</p>
      <h4>🎯 Objetivo de Aprendizaje</h4>
      <p>${guide.objective || ""}</p>
      <h4>📌 Instrucciones</h4>
      <ol>${instructionsList}</ol>
      <h4>✅ Criterios de Éxito</h4>
      <ul>${criteriaList}</ul>
    `;
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

  async function init() {
    const unitId = getUnitId();

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
