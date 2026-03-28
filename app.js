const SHOW_METRICS_BADGE = false;
const DEBUG_METRICS_IN_CONSOLE = false;

const RAW_FEATURES = [
  {
    key: "BMI",
    label: "Body mass index (BMI)",
    helper: "Adjust the slider to match the person’s BMI.",
    type: "range",
    min: 12,
    max: 60,
    step: 1,
    defaultValue: 29,
    formatter: v => `${v}`
  },
  {
    key: "GenHlth",
    label: "How would you rate overall health?",
    type: "select",
    defaultValue: 3,
    options: [
      { value: 1, label: "Excellent" },
      { value: 2, label: "Very good" },
      { value: 3, label: "Good" },
      { value: 4, label: "Fair" },
      { value: 5, label: "Poor" }
    ],
    formatter: v => genHealthLabel(+v)
  },
  {
    key: "DiffWalk",
    label: "Serious difficulty walking or climbing stairs?",
    type: "select",
    defaultValue: 0,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "Sex",
    label: "Sex",
    type: "select",
    defaultValue: 0,
    options: [
      { value: 0, label: "Female" },
      { value: 1, label: "Male" }
    ],
    formatter: sexLabel
  },
  {
    key: "Education",
    label: "Highest education level",
    type: "select",
    defaultValue: 5,
    options: [1,2,3,4,5,6].map(v => ({ value: v, label: educationLabel(v) })),
    formatter: v => educationLabel(+v)
  },
  {
    key: "Income",
    label: "Household income bracket",
    type: "select",
    defaultValue: 6,
    options: [1,2,3,4,5,6,7,8].map(v => ({ value: v, label: incomeLabel(v) })),
    formatter: v => incomeLabel(+v)
  },
  {
    key: "HighBP",
    label: "Has a doctor ever said they have high blood pressure?",
    type: "select",
    defaultValue: 0,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "HighChol",
    label: "Has a doctor ever said they have high cholesterol?",
    type: "select",
    defaultValue: 0,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "HeartDiseaseorAttack",
    label: "History of heart disease or heart attack",
    type: "select",
    defaultValue: 0,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "MentHlth",
    label: "Days of poor mental health in the last 30 days",
    type: "range",
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 4,
    formatter: v => `${v} days`
  },
  {
    key: "PhysHlth",
    label: "Days of poor physical health in the last 30 days",
    type: "range",
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 5,
    formatter: v => `${v} days`
  },
  {
    key: "PhysActivity",
    label: "Any physical activity in the past 30 days?",
    type: "select",
    defaultValue: 1,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "Fruits",
    label: "Usually eats fruit",
    type: "select",
    defaultValue: 1,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "Veggies",
    label: "Usually eats vegetables",
    type: "select",
    defaultValue: 1,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "Smoker",
    label: "Currently smokes every day or some days",
    type: "select",
    defaultValue: 0,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "AnyHealthcare",
    label: "Has any healthcare coverage",
    type: "select",
    defaultValue: 1,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "CholCheck",
    label: "Had a cholesterol check in the past 5 years",
    type: "select",
    defaultValue: 1,
    options: yesNoOptions(),
    formatter: yesNoLabel
  },
  {
    key: "Age",
    label: "Age range",
    type: "select",
    defaultValue: 9,
    options: [
      { value: 1, label: "18–24" },
      { value: 2, label: "25–29" },
      { value: 3, label: "30–34" },
      { value: 4, label: "35–39" },
      { value: 5, label: "40–44" },
      { value: 6, label: "45–49" },
      { value: 7, label: "50–54" },
      { value: 8, label: "55–59" },
      { value: 9, label: "60–64" },
      { value: 10, label: "65–69" },
      { value: 11, label: "70–74" },
      { value: 12, label: "75–79" },
      { value: 13, label: "80+" }
    ],
    formatter: v => ageLabel(+v)
  }
];

let MODEL_META = null;

Promise.all([d3.json("data/model_meta.json")]).then(([meta]) => {
  MODEL_META = meta;
  init(meta);
});

function init(meta) {
  const metricsText = `Accuracy ${fmtPct(meta.metrics.accuracy)} · ROC-AUC ${meta.metrics.roc_auc}`;
  document.getElementById("modelMetrics").textContent = SHOW_METRICS_BADGE ? metricsText : "";
  if (DEBUG_METRICS_IN_CONSOLE) console.log(metricsText);

  buildRawInputs();
  document.getElementById("resetDefaults").addEventListener("click", () => {
    RAW_FEATURES.forEach(feature => {
      const el = document.getElementById(feature.key);
      el.value = feature.defaultValue;
      syncDisplayValue(feature.key, feature.defaultValue);
    });
    updatePredictor();
  });
  updatePredictor();
}

function buildRawInputs() {
  const container = document.getElementById("rawInputs");
  container.innerHTML = RAW_FEATURES.map(feature => renderInputCard(feature)).join("");

  RAW_FEATURES.forEach(feature => {
    const el = document.getElementById(feature.key);
    const eventName = feature.type === "range" ? "input" : "change";
    el.addEventListener(eventName, () => {
      syncDisplayValue(feature.key, el.value);
      updatePredictor();
    });
    syncDisplayValue(feature.key, feature.defaultValue);
  });
}

function renderInputCard(feature) {
  const displayValue = formatDisplay(feature, feature.defaultValue);
  const helper = feature.helper ? `<div class="helper-text">${feature.helper}</div>` : "";
  if (feature.type === "range") {
    return `
      <div class="input-card">
        <div class="value-line">
          <strong>${feature.label}</strong>
          <span id="${feature.key}-value">${displayValue}</span>
        </div>
        ${helper}
        <input type="range" id="${feature.key}" min="${feature.min}" max="${feature.max}" step="${feature.step}" value="${feature.defaultValue}" />
      </div>
    `;
  }

  return `
    <div class="input-card">
      <div class="value-line stacked-line">
        <strong>${feature.label}</strong>
        <span id="${feature.key}-value">${displayValue}</span>
      </div>
      ${helper}
      <select id="${feature.key}">
        ${feature.options.map(option => `<option value="${option.value}" ${+option.value === +feature.defaultValue ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </div>
  `;
}

function syncDisplayValue(featureKey, value) {
  const feature = RAW_FEATURES.find(d => d.key === featureKey);
  document.getElementById(`${featureKey}-value`).textContent = formatDisplay(feature, value);
}

function getRawInputs() {
  const raw = {};
  RAW_FEATURES.forEach(feature => {
    raw[feature.key] = +document.getElementById(feature.key).value;
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
    HealthBurden: raw.MentHlth + raw.PhysHlth,
    LifestyleScore: raw.PhysActivity + raw.Fruits + raw.Veggies - raw.Smoker,
    HealthcareAccess: raw.AnyHealthcare + raw.CholCheck,
    AgeGroup: raw.Age <= 4 ? 0 : raw.Age <= 8 ? 1 : 2
  };
}

function buildPatientData(raw, engineered, meta) {
  const patientData = { ...meta.defaults };
  patientData.CardioRisk = engineered.CardioRisk;
  patientData.HealthBurden = engineered.HealthBurden;
  patientData.LifestyleScore = engineered.LifestyleScore;
  patientData.HealthcareAccess = engineered.HealthcareAccess;
  patientData.AgeGroup = engineered.AgeGroup;

  meta.features.forEach(feature => {
    if (feature in raw) {
      patientData[feature] = raw[feature];
    }
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
  const contributions = [];

  meta.features.forEach(feature => {
    const contribution = scaled[feature] * meta.coefficients[feature];
    logit += contribution;
    contributions.push({ feature, value: contribution });
  });

  return { logit, contributions };
}

function computeProbability(logit) {
  return 1 / (1 + Math.exp(-logit));
}

function updatePredictor() {
  const raw = getRawInputs();
  const engineered = engineerFeatures(raw);
  const patientData = buildPatientData(raw, engineered, MODEL_META);
  const scaled = scaleFeatures(patientData, MODEL_META);
  const { logit, contributions } = computeLogit(scaled, MODEL_META);
  const probability = computeProbability(logit);

  renderProbability(probability);
  renderRecommendations(raw, probability, contributions);
}

function renderProbability(probability) {
  document.getElementById("riskValue").textContent = fmtPct(probability);

  const level = getRiskLevel(probability);
  const pill = document.getElementById("riskLevel");
  pill.textContent = level.label;
  pill.style.background = level.soft;
  pill.style.color = level.color;

  document.getElementById("riskExplanation").textContent = level.explanation;
  drawGauge(probability, level);
}

function getRiskLevel(probability) {
  if (probability < 0.30) {
    return { label: "Low risk", color: "#4f8f6b", soft: "#ecf7f0", explanation: "The current profile falls in the low-risk band. Focus on prevention and keeping healthy habits consistent." };
  }
  if (probability < 0.60) {
    return { label: "Medium risk", color: "#bf7d22", soft: "#fff4e3", explanation: "The current profile falls in the medium-risk band. A few factors may be worth improving or monitoring more closely." };
  }
  return { label: "High risk", color: "#c76666", soft: "#fbefef", explanation: "The current profile falls in the high-risk band. Closer follow-up and targeted lifestyle or clinical support may be helpful." };
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
  const thickness = 18;
  const fullArc = d3.arc().innerRadius(radius - thickness).outerRadius(radius).cornerRadius(18);
  const progressAngle = Math.PI * 2 * probability;

  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  g.append("path")
    .attr("d", fullArc({ startAngle: 0, endAngle: Math.PI * 2 }))
    .attr("fill", "#e6edf7");

  g.append("path")
    .attr("d", fullArc({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 + progressAngle }))
    .attr("fill", level.color);

  g.append("circle")
    .attr("r", radius - thickness - 10)
    .attr("fill", "#ffffff");

  g.append("circle")
    .attr("r", radius + 10)
    .attr("fill", "none")
    .attr("stroke", level.color)
    .attr("stroke-opacity", 0.12)
    .attr("stroke-width", 10);
}

function getRecommendations(input) {
  const recs = [];

  if (input.BMI > 30) recs.push("BMI is high: consider weight management.");
  else if (input.BMI < 18.5) recs.push("BMI is low: consider improving nutrition.");

  if (input.HighBP === 1) recs.push("High blood pressure detected: monitor regularly.");
  if (input.HighChol === 1) recs.push("High cholesterol detected: improve diet and check regularly.");
  if (input.CholCheck === 0) recs.push("No recent cholesterol check: consider screening.");
  if (input.Smoker === 1) recs.push("Smoking increases health risk: consider quitting.");
  if (input.HeartDiseaseorAttack === 1) recs.push("Heart condition detected: manage cardiovascular health carefully.");
  if (input.PhysActivity === 0) recs.push("Low physical activity: increase exercise if appropriate.");
  if (input.Fruits === 0) recs.push("Low fruit intake: consider a more balanced diet.");
  if (input.Veggies === 0) recs.push("Low vegetable intake: increasing fiber intake may help.");
  if (input.AnyHealthcare === 0) recs.push("No healthcare coverage: consider access to medical services.");
  if (input.GenHlth >= 4) recs.push("Poor general health reported: consider a comprehensive health check.");
  if (input.MentHlth > 10) recs.push("Mental health burden detected: consider stress management or support.");
  if (input.PhysHlth > 10) recs.push("Physical health burden detected: consider medical consultation.");
  if (input.DiffWalk === 1) recs.push("Mobility difficulty reported: consider physical therapy or movement support.");
  if (input.Age >= 9) recs.push("Older age group: regular health monitoring is recommended.");
  if (input.Education <= 3) recs.push("Preventive health education may be helpful for this profile.");
  if (input.Income <= 3) recs.push("Lower income group: access to healthcare may be more limited.");

  return recs;
}

function renderRecommendations(raw, probability, contributions) {
  const items = getRecommendations(raw);

  const topDrivers = contributions
    .slice()
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 2)
    .map(d => featureDisplayName(d.feature));

  if (probability >= 0.6 && topDrivers.length) {
    items.unshift(`The model currently sees ${topDrivers.join(" and ")} as major drivers of risk for this profile.`);
  } else if (probability >= 0.3 && topDrivers.length) {
    items.unshift(`The current estimate is being shaped most strongly by ${topDrivers.join(" and ")}.`);
  }

  if (items.length === 0) {
    items.push("No strong recommendation rule fired. Keep healthy routines stable and continue routine preventive care.");
  }

  const container = document.getElementById("recommendationList");
  container.innerHTML = items.map((item, idx) => `
    <div class="rec-item">
      <div class="rec-badge">${idx + 1}</div>
      <p>${item}</p>
    </div>
  `).join("");
}

function featureDisplayName(feature) {
  const map = {
    BMI: "BMI",
    GenHlth: "general health",
    DiffWalk: "mobility difficulty",
    Sex: "sex",
    Education: "education",
    Income: "income",
    CardioRisk: "cardiovascular risk history",
    HealthBurden: "mental and physical health burden",
    LifestyleScore: "lifestyle pattern",
    HealthcareAccess: "healthcare access",
    AgeGroup: "age group"
  };
  return map[feature] || feature;
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
  return ["Excellent", "Very good", "Good", "Fair", "Poor"][v - 1] || `${v}`;
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
  return map[v] || `${v}`;
}

function incomeLabel(v) {
  const map = {
    1: "Less than $10,000",
    2: "$10,000–$15,000",
    3: "$15,000–$20,000",
    4: "$20,000–$25,000",
    5: "$25,000–$35,000",
    6: "$35,000–$50,000",
    7: "$50,000–$75,000",
    8: "$75,000 or more"
  };
  return map[v] || `${v}`;
}

function ageLabel(v) {
  return (RAW_FEATURES.find(f => f.key === "Age")?.options.find(opt => +opt.value === +v)?.label) || `${v}`;
}

function formatDisplay(feature, value) {
  return feature.formatter ? feature.formatter(value) : `${value}`;
}

function fmtPct(v) {
  return `${(v * 100).toFixed(1)}%`;
}
