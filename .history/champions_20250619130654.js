const CHAMP_JSON = "champions.json";
const teamSize = 5;
let team = Array(teamSize).fill(null);

function saveTeam() {
  localStorage.setItem("etheria_team", JSON.stringify(team));
}

function loadTeam() {
  const saved = localStorage.getItem("etheria_team");
  if (saved) team = JSON.parse(saved);
}

function renderTeam() {
  const teamEl = document.getElementById("team");
  teamEl.innerHTML = "";
  team.forEach((champ, index) => {
    const slot = document.createElement("div");
    slot.className = "team-slot" + (champ ? " filled" : "");
    slot.ondragover = (e) => e.preventDefault();
    slot.ondrop = (e) => {
      const i = parseInt(e.dataTransfer.getData("text"));
      team[index] = champs[i];
      saveTeam();
      renderTeam();
    };
    if (champ) {
      const img = document.createElement("img");
      img.src = champ["gatsby-image-wrapper src 2"];
      img.title = champ["emp-name"];
      slot.appendChild(img);
    }
    teamEl.appendChild(slot);
  });
}

function resetTeam() {
  team = Array(teamSize).fill(null);
  saveTeam();
  renderTeam();
}

let champs = [];

fetch(CHAMP_JSON)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("JSON Data:", data); // Debug log
    champs = data;
    const grid = document.getElementById("champions");
    data.forEach((champ, index) => {
      const div = document.createElement("div");
      div.className = "champ";
      div.draggable = true;
      div.ondragstart = (e) => e.dataTransfer.setData("text", index);
      div.innerHTML = `<img src="${champ["gatsby-image-wrapper src 2"]}" alt=""><div>${champ["emp-name"]}</div>`;
      grid.appendChild(div);
    });
    loadTeam();
    renderTeam();
  })
  .catch((error) => console.error("Error fetching champions:", error));
