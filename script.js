const WHO_HEIGHT = {
  male: { 6: 67, 12: 76, 24: 88, 36: 96, 48: 103, 60: 110 },
  female: { 6: 65, 12: 74, 24: 86, 36: 94, 48: 101, 60: 108 }
};

const WHO_WEIGHT = {
  male: { 6: 7.9, 12: 9.6, 24: 12.2, 36: 14.3, 48: 16.3, 60: 18.3 },
  female: { 6: 7.3, 12: 8.9, 24: 11.5, 36: 13.9, 48: 15.8, 60: 17.7 }
};

const FOODS_UNDER = [
  "Milk, curd, paneer",
  "Eggs or dal",
  "Green leafy vegetables",
  "Fruits",
  "Millets & rice"
];

const FOODS_OVER = [
  "Reduce junk & sugar",
  "More vegetables",
  "Fruits",
  "Physical activity",
  "Balanced meals"
];

let chart = null;

const $ = id => document.getElementById(id);

const getPatients = () =>
  JSON.parse(localStorage.getItem("patients")) || [];

const savePatients = p =>
  localStorage.setItem("patients", JSON.stringify(p));

$("childForm").addEventListener("submit", e => {
  e.preventDefault();

  const index = $("editIndex").value;

  const patient = {
    fatherName: fatherName.value,
    motherName: motherName.value,
    childName: childName.value,
    gender: gender.value,
    age: +age.value,
    height: +height.value,
    weight: +weight.value,
    gasLevel: +gasLevel.value,
    date: new Date().toLocaleDateString()
  };

  const expH = getExpectedHeight(patient.age, patient.gender);
  const expW = getExpectedWeight(patient.age, patient.gender);

  patient.heightStatus =
    patient.height < expH - 5 ? "Stunted" :
    patient.height > expH + 5 ? "Tall" : "Normal";

  patient.weightStatus =
    patient.weight > expW + 3 ? "Overweight" :
    patient.weight < expW - 2 ? "Underweight" : "Normal";

  patient.air =
    patient.gasLevel > 300 ? "Poor" : "Safe";

  const patients = getPatients();
  index === "" ? patients.push(patient) : patients[index] = patient;

  savePatients(patients);
  $("editIndex").value = "";
  $("childForm").reset();
  render();
  analyze(patient);
});

function render() {
  const tbody = document.querySelector("#patientTable tbody");
  tbody.innerHTML = "";

  getPatients().forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.date}</td>
      <td>${p.childName}</td>
      <td>${p.gender}</td>
      <td>${p.age}</td>
      <td>${p.height}</td>
      <td>${p.weight}</td>
      <td>${p.heightStatus}<br>${p.weightStatus}</td>
      <td>${p.air}</td>
      <td>
        <button class="action-btn edit" onclick="edit(${i})">Edit</button>
        <button class="action-btn delete" onclick="del(${i})">Delete</button>
      </td>`;
    tr.onclick = () => analyze(p);
    tbody.appendChild(tr);
  });
}

function edit(i) {
  const p = getPatients()[i];
  Object.keys(p).forEach(k => $(k) && ($(k).value = p[k]));
  $("editIndex").value = i;
}

function del(i) {
  if (!confirm("Delete record?")) return;
  const p = getPatients();
  p.splice(i, 1);
  savePatients(p);
  render();
}

function analyze(p) {
  result.classList.remove("hidden");
  chartSection.classList.remove("hidden");

  displayChild.textContent = p.childName;
  displayParents.textContent = `${p.fatherName} & ${p.motherName}`;

  status.textContent = `${p.heightStatus} | ${p.weightStatus}`;
  message.textContent =
    p.air === "Poor" ? "⚠️ Poor Air Quality" : "✅ Safe Air Quality";

  if (p.heightStatus === "Stunted" || p.weightStatus === "Underweight") {
    showFoods(FOODS_UNDER);
  } else if (p.weightStatus === "Overweight") {
    showFoods(FOODS_OVER);
  } else {
    foodSection.classList.add("hidden");
  }

  drawChart(p.height, getExpectedHeight(p.age, p.gender));
}

function drawChart(actual, expected) {
  if (chart) chart.destroy();
  chart = new Chart(growthChart, {
    type: "bar",
    data: {
      labels: ["Actual Height", "WHO Height"],
      datasets: [{
        data: [actual, expected]
      }]
    }
  });
}

function showFoods(list) {
  foodSection.classList.remove("hidden");
  foodList.innerHTML = list.map(f => `<li>${f}</li>`).join("");
}

function getExpectedHeight(age, gender) {
  return WHO_HEIGHT[gender][closest(age, WHO_HEIGHT[gender])];
}

function getExpectedWeight(age, gender) {
  return WHO_WEIGHT[gender][closest(age, WHO_WEIGHT[gender])];
}

function closest(age, obj) {
  return Object.keys(obj).reduce((a, b) =>
    Math.abs(b - age) < Math.abs(a - age) ? b : a);
}

render();
const RENDER_URL = "https://pediatric-backend.onrender.com/api/get-gas-data";

async function syncGasData() {
    try {
        const response = await fetch(RENDER_URL);
        const data = await response.json();
        
        // This fills the "Gas Level (PPM)" input in your form automatically
        if ($("gasLevel")) {
            $("gasLevel").value = data.gas_value;
        }
    } catch (error) {
        console.log("Waiting for Render to wake up...");
    }
}

// Check for new gas data every 3 seconds

setInterval(syncGasData, 3000);

