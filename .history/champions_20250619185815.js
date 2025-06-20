const DB_JSON = "database.json";
const teamSize = 5;
let teams = [{ id: 1, name: "Team 1", members: Array(teamSize).fill(null) }];
let currentTeamId = 1;
let teamHistory = [];
let champs = [];
let modules = [];
let collections = JSON.parse(
  localStorage.getItem("etheria_collections") || "{}"
);

function saveTeams() {
  localStorage.setItem("etheria_teams", JSON.stringify(teams));
  localStorage.setItem("etheria_current_team_id", currentTeamId);
}

function saveCollections() {
  localStorage.setItem("etheria_collections", JSON.stringify(collections));
}

function loadTeams() {
  const savedTeams = localStorage.getItem("etheria_teams");
  const savedTeamId = localStorage.getItem("etheria_current_team_id");
  if (savedTeams) teams = JSON.parse(savedTeams);
  if (savedTeamId) currentTeamId = parseInt(savedTeamId);
}

function getCurrentTeam() {
  return teams.find((t) => t.id === currentTeamId);
}

function saveHistory() {
  const currentTeam = getCurrentTeam();
  teamHistory.push(JSON.parse(JSON.stringify(currentTeam.members)));
  if (teamHistory.length > 20) teamHistory.shift();
  document.getElementById("undoButton").disabled = false;
}

function undoAction() {
  if (teamHistory.length > 0) {
    const currentTeam = getCurrentTeam();
    currentTeam.members = teamHistory.pop();
    saveTeams();
    renderTeam();
    document.getElementById("undoButton").disabled = teamHistory.length === 0;
  }
}

function renderTeam() {
  const teamEl = document.getElementById("team");
  teamEl.innerHTML = "";
  const currentTeam = getCurrentTeam();
  currentTeam.members.forEach((champ, index) => {
    const slot = document.createElement("div");
    slot.className = "team-slot" + (champ ? " filled" : "");
    slot.ondragover = (e) => e.preventDefault();
    slot.ondrop = (e) => {
      const i = parseInt(e.dataTransfer.getData("text"));
      const selectedChamp = champs[i];
      if (
        currentTeam.members.some(
          (member) => member && member["emp-name"] === selectedChamp["emp-name"]
        )
      ) {
        return;
      }
      saveHistory();
      currentTeam.members[index] = selectedChamp;
      saveTeams();
      renderTeam();
    };
    if (champ) {
      const img = document.createElement("img");
      img.src = champ["image"];
      img.title = champ["emp-name"];
      slot.appendChild(img);
    }
    teamEl.appendChild(slot);
  });
}

function updateTeamSelect() {
  const select = document.getElementById("teamSelect");
  select.innerHTML = "";
  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.text = team.name;
    if (team.id === currentTeamId) option.selected = true;
    select.appendChild(option);
  });
}

function editTeamName() {
  const currentTeam = getCurrentTeam();
  const newName = prompt("Enter new team name:", currentTeam.name);
  if (newName && newName.trim()) {
    currentTeam.name = newName.trim();
    saveTeams();
    updateTeamSelect();
  }
}

function addTeam() {
  const newId = teams.length > 0 ? Math.max(...teams.map((t) => t.id)) + 1 : 1;
  const newName = prompt("Enter team name:", `Team ${newId}`);
  teams.push({
    id: newId,
    name: newName && newName.trim() ? newName.trim() : `Team ${newId}`,
    members: Array(teamSize).fill(null),
  });
  currentTeamId = newId;
  saveTeams();
  updateTeamSelect();
  renderTeam();
}

function deleteTeam() {
  if (teams.length <= 1) {
    alert("Cannot delete the last team!");
    return;
  }
  teams = teams.filter((t) => t.id !== currentTeamId);
  currentTeamId = teams[0].id;
  saveTeams();
  updateTeamSelect();
  renderTeam();
}

function switchTeam(teamId) {
  currentTeamId = parseInt(teamId);
  teamHistory = [];
  saveTeams();
  renderTeam();
  document.getElementById("undoButton").disabled = true;
}

function resetTeam() {
  saveHistory();
  const currentTeam = getCurrentTeam();
  currentTeam.members = Array(teamSize).fill(null);
  saveTeams();
  renderTeam();
}

function saveToCollection() {
  const collectionName = prompt("Enter collection name (e.g., DokiDoki, PvP):");
  if (!collectionName || !collectionName.trim()) return;
  const currentTeam = getCurrentTeam();
  if (!collections[collectionName]) collections[collectionName] = [];
  collections[collectionName].push({
    id: Date.now(),
    name: currentTeam.name,
    members: JSON.parse(JSON.stringify(currentTeam.members)),
  });
  saveCollections();
  renderCollections();
}

function renderCollections() {
  const collectionsEl = document.getElementById("collections");
  collectionsEl.innerHTML = "";
  for (const [name, teams] of Object.entries(collections)) {
    const collectionDiv = document.createElement("div");
    collectionDiv.className = "collection";
    collectionDiv.innerHTML = `<h4>${name}</h4>`;
    teams.forEach((team, index) => {
      const teamDiv = document.createElement("div");
      teamDiv.innerHTML = `${team.name}: ${team.members
        .map((m) => (m ? m["emp-name"] : "Empty"))
        .join(", ")} <button onclick="loadCollectionTeam(${
        team.id
      })">Load</button>`;
      collectionDiv.appendChild(teamDiv);
    });
    collectionsEl.appendChild(collectionDiv);
  }
}

function loadCollectionTeam(teamId) {
  for (const collectionTeams of Object.values(collections)) {
    const team = collectionTeams.find((t) => t.id === teamId);
    if (team) {
      const newId =
        teams.length > 0 ? Math.max(...teams.map((t) => t.id)) + 1 : 1;
      const newTeam = {
        id: newId,
        name: team.name,
        members: JSON.parse(JSON.stringify(team.members)),
      };
      teams.push(newTeam);
      currentTeamId = newId;
      saveTeams();
      updateTeamSelect();
      renderTeam();
      document.getElementById("undoButton").disabled = true;
      teamHistory = [];
      break;
    }
  }
}

function takeScreenshot() {
  const teamEl = document.getElementById("team");
  html2canvas(teamEl).then((canvas) => {
    const link = document.createElement("a");
    link.download = `etheria_team_${currentTeamId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function renderModuleSelect() {
  const moduleSelect = document.getElementById("moduleSelect");
  moduleSelect.innerHTML = '<option value="">Select Module Set</option>';
  modules.forEach((module) => {
    const option = document.createElement("option");
    option.value = module.set;
    option.text = module.set;
    moduleSelect.appendChild(option);
  });
}

function displayModuleInfo() {
  const moduleSelect = document.getElementById("moduleSelect");
  const moduleInfo = document.getElementById("moduleInfo");
  const selectedSet = moduleSelect.value;
  if (!selectedSet) {
    moduleInfo.innerHTML = "";
    return;
  }
  const module = modules.find((m) => m.set === selectedSet);
  if (module) {
    moduleInfo.innerHTML = `
      <p><strong>Set:</strong> ${module.set}</p>
      <p><strong>Matrix Levels:</strong> ${module.matrix_levels.join(", ")}</p>
      <p><strong>Effects:</strong> ${module.effects
        .map((e) => `${e.level}: ${e.effect}`)
        .join("<br>")}</p>
      <p><strong>Main Stats:</strong> ${module.main_stats.join(", ")}</p>
      <p><strong>Sub Stats:</strong> ${module.sub_stats.join(", ")}</p>
      <p><strong>Drop:</strong> ${module.drop}</p>
    `;
  }
}

fetch(DB_JSON)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("Database:", data);
    champs = data.champions;
    modules = data.modules;
    const grid = document.getElementById("champions");
    champs.forEach((champ, index) => {
      const div = document.createElement("div");
      div.className = "champ";
      const typeMatch = champ["emp-name"].match(/\[([^\]]+)\]/);
      const champType = typeMatch ? typeMatch[1] : "Unknown";
      div.setAttribute("data-type", champType);
      div.draggable = true;
      div.ondragstart = (e) => e.dataTransfer.setData("text", index);
      div.innerHTML = `<img src="${champ["image"]}" alt=""><div>${champ["emp-name"]}</div>`;
      grid.appendChild(div);
    });
    renderModuleSelect();
    loadTeams();
    updateTeamSelect();
    renderTeam();
    renderCollections();
  })
  .catch((error) => console.error("Error fetching database:", error));
