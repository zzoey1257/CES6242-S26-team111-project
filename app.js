
const SHOW_METRICS_BADGE = false;
const DEBUG_METRICS_IN_CONSOLE = false;

const QUESTIONNAIRE = [
  {
    title: "Basic Information",
    note: "These questions capture the person’s background and age category.",
    fields: [
      {
        key: "Sex",
        label: "What is your gender?",
        type: "select",
        defaultValue: 0,
        options: [
          { value: 0, label: "Female" },
          { value: 1, label: "Male" }
        ],
        formatter: sexLabel
      },
      {
        key: "Age",
        label: "What is your age group?",
        type: "select",
        defaultValue: 8,
        options: ageOptions(),
        formatter: ageLabel
      },
      {
        key: "Education",
        label: "What is your highest level of education?",
        type: "select",
        defaultValue: 5,
        options: [1, 2, 3, 4, 5, 6].map(v => ({ value: v, label: educationLabel(v) })),
        formatter: educationLabel
      },
      {
        key: "Income",
        label: "What is your household income range?",
        type: "select",
        defaultValue: 6,
        options: [1, 2, 3, 4, 5, 6, 7, 8].map(v => ({ value: v, label: incomeLabel(v) })),
        formatter: incomeLabel
      }
    ]
  },
  {
    title: "General Health",
    note: "These inputs reflect self-reported health status, body size, and mobility.",
    fields: [
      {
        key: "GenHlth",
        label: "How would you rate your overall health?",
        type: "select",
        defaultValue: 3,
        options: [
          { value: 1, label: "Excellent" },
          { value: 2, label: "Very good" },
          { value: 3, label: "Good" },
          { value: 4, label: "Fair" },
          { value: 5, label: "Poor" }
        ],
        formatter: genHealthLabel
      },
      {
        key: "BMI",
        label: "What is your body mass index (BMI)?",
        helper: "Move the slider to match the person’s BMI.",
        type: "range",
        min: 12,
        max: 60,
        step: 1,
        defaultValue: 29,
        formatter: v => `${v}`
      },
      {
        key: "DiffWalk",
        label: "Do you have serious difficulty walking or climbing stairs?",
        type: "select",
        defaultValue: 0,
        options: yesNoOptions(),
        formatter: yesNoLabel
      }
    ]
  },
  {
    title: "Cardiovascular Health",
    note: "These questions support the refined cardiovascular risk feature.",
    fields: [
      {
        key: "HighBP",
        label: "Have you ever been diagnosed with high blood pressure?",
        type: "select",
        defaultValue: 0,
        options: yesNoOptions(),
        formatter: yesNoLabel
      },
      {
        key: "HighChol",
        label: "Have you ever been diagnosed with high cholesterol?",
        type: "select",
        defaultValue: 0,
        options: yesNoOptions(),
        formatter: yesNoLabel
      },
      {
        key: "HeartDiseaseorAttack",
        label: "Have you ever been diagnosed with heart disease or had a heart attack?",
        type: "select",
        defaultValue: 0,
        options: yesNoOptions(),
        formatter: yesNoLabel
      }
    ]
  }
];

const CATEGORY_META = {
  "General Health": {
    icon: "●",
    caption: "Overall health, body composition, and age-related risk signals."
  },
  "Heart & Metabolic Health": {
    icon: "♥",
    caption: "Cardiovascular and metabolic history linked to diabetes risk."
  },
  "Lifestyle & Function": {
    icon: "↗",
    caption: "Mobility and everyday physical functioning."
  },
  "Preventive Awareness": {
    icon: "✓",
    caption: "Signals linked to access, prevention, and long-term health awareness."
  }
};

let MODEL_META = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadModelMeta();
  renderQuestionnaire();
  wireEvents();
  updatePredictor();
});

async function loadModelMeta() {
  MODEL_META = await fetch("data/model_meta.json").then(r => r.json());

  const metrics = MODEL_META.metrics || {};
  const badge = document.getElementById("modelMetrics");

  if (SHOW_METRICS_BADGE && badge && metrics.accuracy != null && metrics.roc_auc != null) {
    badge.textContent = `Accuracy ${(metrics.accuracy * 100).toFixed(1)}% · ROC-AUC ${metrics.roc_auc.toFixed(4)}`;
    badge.style.display = "block";
  } else if (badge) {
    badge.style.display = "none";
  }

  if (DEBUG_METRICS_IN_CONSOLE && metrics.accuracy != null && metrics.roc_auc != null) {
    console.log(`Accuracy ${(metrics.accuracy * 100).toFixed(1)}% · ROC-AUC ${metrics.roc_auc.toFixed(4)}`);
  }
}

function wireEvents() {
  document.querySelectorAll("#rawInputs select, #rawInputs input").forEach(el => {
    el.addEventListener("input", event => {
      updateFieldDisplay(event.target);
      updatePredictor();
    });
    el.addEventListener("change", event => {
      updateFieldDisplay(event.target);
      updatePredictor();
    });
  });

  document.getElementById("resetDefaults").addEventListener("click", () => {
    QUESTIONNAIRE.flatMap(section => section.fields).forEach(field => {
      const el = document.getElementById(`field-${field.key}`);
      if (!el) return;
      el.value = field.defaultValue;
      updateFieldDisplay(el);
    });
    updatePredictor();
  });
}

function renderQuestionnaire() {
  const host = document.getElementById("rawInputs");
  host.innerHTML = QUESTIONNAIRE.map(section => `
    <section class="questionnaire-group">
      <h3>${section.title}</h3>
      <p class="group-note">${section.note}</p>
      <div class="group-fields">
        ${section.fields.map(renderField).join("")}
      </div>
    </section>
  `).join("");

  QUESTIONNAIRE.flatMap(section => section.fields).forEach(field => {
    const el = document.getElementById(`field-${field.key}`);
    if (el) updateFieldDisplay(el);
  });
}

function renderField(field) {
  if (field.type === "range") {
    return `
      <div class="field full">
        <label for="field-${field.key}">${field.label}</label>
        ${field.helper ? `<div class="helper">${field.helper}</div>` : ""}
        <div class="range-shell">
          <div class="range-top">
            <span>Current value</span>
            <span class="range-value" id="display-${field.key}">${field.formatter(field.defaultValue)}</span>
          </div>
          <input
            id="field-${field.key}"
            data-key="${field.key}"
            type="range"
            min="${field.min}"
            max="${field.max}"
            step="${field.step}"
            value="${field.defaultValue}"
          />
          <div class="range-ticks">
            <span>${field.min}</span>
            <span>${field.max}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="field-${field.key}">${field.label}</label>
      ${field.helper ? `<div class="helper">${field.helper}</div>` : ""}
      <select id="field-${field.key}" data-key="${field.key}">
        ${field.options.map(opt => `
          <option value="${opt.value}" ${+opt.value === +field.defaultValue ? "selected" : ""}>
            ${opt.label}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function updateFieldDisplay(el) {
  const key = el.dataset.key;
  const field = QUESTIONNAIRE.flatMap(section => section.fields).find(f => f.key === key);
  if (!field || field.type !== "range") return;
  const target = document.getElementById(`display-${key}`);
  if (target) target.textContent = field.formatter(el.value);
}

function getRawInputs() {
  const raw = {};
  QUESTIONNAIRE.flatMap(section => section.fields).forEach(field => {
    const el = document.getElementById(`field-${field.key}`);
    raw[field.key] = Number(el.value);
  });
  return raw;
}

function engineerFeatures(raw) {
  return {
    BMI: raw.BMI,
    GenHlth: raw.GenHlth,
    DiffWalk: raw.DiffWalk,
    Sex: raw.Sex,
    Education: raw.Education,
    Income: raw.Income,
    CardioRisk: raw.HighBP + raw.HighChol + raw.HeartDiseaseorAttack,
    AgeGroup: raw.Age <= 4 ? 0 : raw.Age <= 8 ? 1 : 2
  };
}

function buildPatientData(raw, engineered, meta) {
  const patientData = { ...(meta.defaults || {}) };

  patientData.CardioRisk = engineered.CardioRisk;
  patientData.AgeGroup = engineered.AgeGroup;

  meta.features.forEach(feature => {
    if (feature in raw) patientData[feature] = raw[feature];
  });

  return patientData;
}

function scaleFeatures(features, meta) {
  const scaled = {};
  meta.features.forEach(feature => {
    scaled[feature] = (features[feature] - meta.means[feature]) / meta.scales[feature];
  });
  return scaled;
}

function computeLogit(scaled, meta) {
  let logit = meta.intercept;
  meta.features.forEach(feature => {
    logit += scaled[feature] * meta.coefficients[feature];
  });
  return logit;
}

function computeProbability(logit) {
  return 1 / (1 + Math.exp(-logit));
}

function updatePredictor() {
  if (!MODEL_META) return;

  const raw = getRawInputs();
  const engineered = engineerFeatures(raw);
  const patientData = buildPatientData(raw, engineered, MODEL_META);
  const scaled = scaleFeatures(patientData, MODEL_META);
  const logit = computeLogit(scaled, MODEL_META);
  const probability = computeProbability(logit);

  renderProbability(probability);
  renderRecommendations(raw, probability);
}

function renderProbability(probability) {
  const level = getRiskMeta(probability);

  document.getElementById("riskValue").textContent = fmtPct(probability);
  const pill = document.getElementById("riskLevel");
  pill.textContent = level.label;
  pill.style.background = level.soft;
  pill.style.color = level.color;

  document.getElementById("riskExplanation").textContent = level.explanation;
  drawGauge(probability, level);
}

function drawGauge(probability, level) {
  const svg = d3.select("#gaugeChart");
  const width = svg.node().clientWidth || 300;
  const height = svg.node().clientHeight || 300;
  svg.selectAll("*").remove();

  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = size * 0.35;
  const ringWidth = Math.max(16, size * 0.07);

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const background = d3.arc()
    .innerRadius(radius - ringWidth)
    .outerRadius(radius)
    .startAngle(-Math.PI / 2)
    .endAngle(1.5 * Math.PI);

  const foreground = d3.arc()
    .innerRadius(radius - ringWidth)
    .outerRadius(radius)
    .startAngle(-Math.PI / 2)
    .endAngle(-Math.PI / 2 + (Math.PI * 2 * probability));

  const group = svg.append("g").attr("transform", `translate(${cx}, ${cy})`);

  group.append("path")
    .attr("d", background())
    .attr("fill", "#e7eef8");

  group.append("path")
    .attr("d", foreground())
    .attr("fill", level.color);

  group.append("circle")
    .attr("r", radius - ringWidth - 10)
    .attr("fill", "#ffffff");
}

function getRiskLevel(prob) {
  if (prob < 0.3) return "low";
  if (prob < 0.6) return "medium";
  return "high";
}

function getRiskMeta(probability) {
  const riskLevel = getRiskLevel(probability);

  if (riskLevel === "low") {
    return {
      key: riskLevel,
      label: "Low risk",
      color: "#4f8f6b",
      soft: "#edf8f1",
      explanation: "The current profile falls in the low-risk band. Focus on prevention and maintaining healthy routines."
    };
  }
  if (riskLevel === "medium") {
    return {
      key: riskLevel,
      label: "Medium risk",
      color: "#c98a26",
      soft: "#fff6e4",
      explanation: "The current profile falls in the medium-risk band. A few factors may benefit from closer attention or monitoring."
    };
  }
  return {
    key: riskLevel,
    label: "High risk",
    color: "#c76666",
    soft: "#fdf0f0",
    explanation: "The current profile falls in the high-risk band. Preventive action and follow-up may be more important for this profile."
  };
}

function getSummary(prob) {
  const riskLevel = getRiskLevel(prob);

  if (riskLevel === "low") {
    return "Your current profile suggests a relatively low level of risk. Maintaining your current habits can help support long-term health.";
  }
  if (riskLevel === "medium") {
    return "Your current profile falls in a moderate risk range. A few areas may benefit from attention or monitoring.";
  }
  return "Your current profile indicates a higher level of risk. It may be important to pay closer attention to your health and consider preventive actions.";
}

function toneAdjust(text, riskLevel) {
  if (riskLevel === "low") {
    return text
      .replaceAll("may help", "can help maintain")
      .replaceAll("may support", "can help support")
      .replaceAll("may be helpful", "can help")
      .replaceAll("may be beneficial", "can support maintaining")
      .replaceAll("important", "helpful");
  }

  if (riskLevel === "high") {
    return text
      .replaceAll("may help", "it is important to help")
      .replaceAll("may support", "it is important to support")
      .replaceAll("may be helpful", "it is strongly recommended to")
      .replaceAll("may be beneficial", "it is strongly recommended to")
      .replaceAll("can be helpful", "it is important to consider")
      .replaceAll("important", "important");
  }

  return text;
}

function getRecommendations(input, prob) {
  const riskLevel = getRiskLevel(prob);
  const summary = getSummary(prob);

  const recs = {
    "General Health": [],
    "Heart & Metabolic Health": [],
    "Lifestyle & Function": [],
    "Preventive Awareness": []
  };

  if (input.BMI > 30) {
    let text = "Your BMI is on the higher side. Small, consistent changes in diet and daily activity may support overall health.";
    recs["General Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.BMI < 18.5) {
    let text = "Your BMI is relatively low. Maintaining balanced nutrition may support your well-being.";
    recs["General Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.GenHlth >= 4) {
    let text = "You reported lower overall health. It may be helpful to consider a general health check-up or gradual lifestyle adjustments.";
    recs["General Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.Age >= 9) {
    let text = "As people get older, regular health monitoring becomes increasingly important for prevention and early detection.";
    recs["General Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.HighBP === 1) {
    let text = "You indicated high blood pressure. Regular monitoring and maintaining a balanced lifestyle may help manage it.";
    recs["Heart & Metabolic Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.HighChol === 1) {
    let text = "You indicated high cholesterol. A heart-healthy diet and regular check-ups may be beneficial.";
    recs["Heart & Metabolic Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.HeartDiseaseorAttack === 1) {
    let text = "You reported a history of heart-related conditions. Ongoing medical follow-up and careful health management are important.";
    recs["Heart & Metabolic Health"].push(toneAdjust(text, riskLevel));
  }

  if (input.DiffWalk === 1) {
    let text = "You indicated some difficulty with mobility. Gentle physical activity or guided exercise may help improve comfort and movement.";
    recs["Lifestyle & Function"].push(toneAdjust(text, riskLevel));
  }

  if (input.Education <= 3) {
    let text = "Regular health check-ups and preventive care can be helpful for maintaining long-term health.";
    recs["Preventive Awareness"].push(toneAdjust(text, riskLevel));
  }

  if (input.Income <= 3) {
    let text = "Exploring available healthcare resources and preventive services may support your overall health.";
    recs["Preventive Awareness"].push(toneAdjust(text, riskLevel));
  }

  return { summary, details: recs, riskLevel };
}

function renderRecommendations(raw, probability) {
  const recData = getRecommendations(raw, probability);
  const level = getRiskMeta(probability);

  const summaryEl = document.getElementById("recommendationSummary");
  summaryEl.innerHTML = `
    <div class="summary-topline">
      <div class="summary-title">Overall guidance</div>
      <div class="summary-pill" style="background:${level.soft}; color:${level.color};">${level.label}</div>
    </div>
    <p>${recData.summary}</p>
  `;

  const groupsEl = document.getElementById("recommendationGroups");
  groupsEl.innerHTML = Object.entries(recData.details).map(([groupName, items]) => {
    const meta = CATEGORY_META[groupName];
    const body = items.length
      ? `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`
      : `<div class="rec-empty">No strong signal was triggered in this category for the current profile.</div>`;

    return `
      <section class="rec-group">
        <div class="rec-group-header">
          <div class="rec-group-icon" style="background:${groupTint(groupName).soft}; color:${groupTint(groupName).color};">
            ${meta.icon}
          </div>
          <div>
            <h3>${groupName}</h3>
            <p class="group-caption">${meta.caption}</p>
          </div>
        </div>
        ${body}
      </section>
    `;
  }).join("");
}

function groupTint(groupName) {
  if (groupName === "General Health") return { color: "#305487", soft: "#edf4ff" };
  if (groupName === "Heart & Metabolic Health") return { color: "#c76666", soft: "#fdf0f0" };
  if (groupName === "Lifestyle & Function") return { color: "#4f8f6b", soft: "#edf8f1" };
  return { color: "#7b5ac8", soft: "#f2edff" };
}

function fmtPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function yesNoOptions() {
  return [
    { value: 0, label: "No" },
    { value: 1, label: "Yes" }
  ];
}

function yesNoLabel(v) {
  return +v === 1 ? "Yes" : "No";
}

function sexLabel(v) {
  return +v === 1 ? "Male" : "Female";
}

function genHealthLabel(v) {
  return ["Excellent", "Very good", "Good", "Fair", "Poor"][+v - 1] || `${v}`;
}

function educationLabel(v) {
  const map = {
    1: "Never attended school or kindergarten only",
    2: "Elementary school",
    3: "Some high school",
    4: "High school graduate",
    5: "Some college or technical school",
    6: "College graduate"
  };
  return map[+v] || `${v}`;
}

function incomeLabel(v) {
  const map = {
    1: "Less than $10,000",
    2: "$10,000–$14,999",
    3: "$15,000–$19,999",
    4: "$20,000–$24,999",
    5: "$25,000–$34,999",
    6: "$35,000–$49,999",
    7: "$50,000–$74,999",
    8: "$75,000 or more"
  };
  return map[+v] || `${v}`;
}

function ageOptions() {
  const labels = {
    1: "18–24",
    2: "25–29",
    3: "30–34",
    4: "35–39",
    5: "40–44",
    6: "45–49",
    7: "50–54",
    8: "55–59",
    9: "60–64",
    10: "65–69",
    11: "70–74",
    12: "75–79",
    13: "80 or older"
  };

  return Object.entries(labels).map(([value, label]) => ({
    value: Number(value),
    label
  }));
}

function ageLabel(v) {
  return (ageOptions().find(opt => opt.value === +v) || {}).label || `${v}`;
}
