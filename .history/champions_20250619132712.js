const CHAMP_JSON = "champions.json";
const teamSize = 5;
let teams = [{ id: 1, name: "Team 1", members: Array(teamSize).fill(null) }];
let currentTeamId = 1;
let teamHistory = [];
let champs = [];

function displayError(message) {
  const errorEl = document.getElementById("error");
  if (errorEl) errorEl.textContent = message;
  console.error(message);
}

function saveTeams() {
  try {
    localStorage.setItem("etheria_teams", JSON.stringify(teams));
    localStorage.setItem("etheria_current_team_id", currentTeamId);
  } catch (e) {
    displayError("Error saving teams: " + e.message);
  }
}

function loadTeams() {
  try {
    const savedTeams = localStorage.getItem("etheria_teams");
    const savedTeamId = localStorage.getItem("etheria_current_team_id");
    if (savedTeams) teams = JSON.parse(savedTeams);
    if (savedTeamId) currentTeamId = parseInt(savedTeamId);
  } catch (e) {
    displayError("Error loading teams: " + e.message);
  }
}

function getCurrentTeam() {
  const team = teams.find((t) => t.id === currentTeamId);
  if (!team) displayError("Current team not found!");
  return team;
}

function saveHistory() {
  const currentTeam = getCurrentTeam();
  if (currentTeam) {
    teamHistory.push(JSON.parse(JSON.stringify(currentTeam.members)));
    if (teamHistory.length > 20) teamHistory.shift();
    const undoButton = document.getElementById("undoButton");
    if (undoButton) undoButton.disabled = false;
  }
}

function undoAction() {
  if (teamHistory.length > 0) {
    const currentTeam = getCurrentTeam();
    if (currentTeam) {
      currentTeam.members = teamHistory.pop();
      saveTeams();
      renderTeam();
      const undoButton = document.getElementById("undoButton");
      if (undoButton) undoButton.disabled = teamHistory.length === 0;
    }
  }
}

function renderTeam() {
  const teamEl = document.getElementById("team");
  if (!teamEl) {
    displayError("Team element not found!");
    return;
  }
  teamEl.innerHTML = "";
  const currentTeam = getCurrentTeam();
  if (!currentTeam) return;
  currentTeam.members.forEach((champ, index) => {
    const slot = document.createElement("div");
    slot.className = "team-slot" + (champ ? " filled" : "");
    slot.setAttribute("data-index", index);
    slot.addEventListener("dragover", (e) => e.preventDefault());
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const i = parseInt(e.dataTransfer.getData("text/plain"));
      if (!isNaN(i) && champs[i]) {
        saveHistory();
        currentTeam.members[index] = champs[i];
        saveTeams();
        slot.innerHTML = "";
        const img = document.createElement("img");
        img.src = `https://via.placeholder.com/120x164?text=${encodeURIComponent(
          champs[i]["emp-name"] || "Unknown"
        )}`;
        img.title = champs[i]["emp-name"] || "Unknown";
        slot.appendChild(img);
        slot.className = "team-slot filled";
      } else {
        displayError("Invalid champion dropped!");
      }
    });
    if (champ) {
      const img = document.createElement("img");
      img.src = `https://via.placeholder.com/120x164?text=${encodeURIComponent(
        champ["emp-name"] || "Unknown"
      )}`;
      img.title = champ["emp-name"] || "Unknown";
      slot.appendChild(img);
    }
    teamEl.appendChild(slot);
  });
}

function updateTeamSelect() {
  const select = document.getElementById("teamSelect");
  if (!select) {
    displayError("Team select element not found!");
    return;
  }
  select.innerHTML = "";
  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.text = team.name;
    if (team.id === currentTeamId) option.selected = true;
    select.appendChild(option);
  });
}

function addTeam() {
  const newId = teams.length > 0 ? Math.max(...teams.map((t) => t.id)) + 1 : 1;
  teams.push({
    id: newId,
    name: `Team ${newId}`,
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
  const undoButton = document.getElementById("undoButton");
  if (undoButton) undoButton.disabled = true;
}

function resetTeam() {
  saveHistory();
  const currentTeam = getCurrentTeam();
  if (currentTeam) {
    currentTeam.members = Array(teamSize).fill(null);
    saveTeams();
    renderTeam();
  }
}

function takeScreenshot() {
  const teamEl = document.getElementById("team");
  if (!teamEl) {
    displayError("Team element not found for screenshot!");
    return;
  }
  html2canvas(teamEl, { logging: true })
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = `etheria_team_${currentTeamId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch((e) => displayError("Screenshot failed: " + e.message));
}

fetch(CHAMP_JSON)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("JSON Data:", data);
    if (!Array.isArray(data) || data.length === 0) {
      displayError("Invalid or empty champions data!");
      return;
    }
    champs = data;
    const grid = document.getElementById("champions");
    if (!grid) {
      displayError("Champions grid element not found!");
      return;
    }
    grid.innerHTML = "";
    data.forEach((champ, index) => {
      const div = document.createElement("div");
      div.className = "champ";
      div.draggable = true;
      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index.toString());
        console.log("Dragging champion:", champ["emp-name"]);
      });
      const img = document.createElement("img");
      img.src = `https://via.placeholder.com/120x164?text=${encodeURIComponent(
        champ["emp-name"] || "Unknown"
      )}`;
      img.alt = champ["emp-name"] || "Unknown";
      const nameDiv = document.createElement("div");
      nameDiv.textContent = champ["emp-name"] || "Unknown";
      div.appendChild(img);
      div.appendChild(nameDiv);
      grid.appendChild(div);
    });
    loadTeams();
    updateTeamSelect();
    renderTeam();
  })
  .catch((error) => {
    console.error("Error fetching champions:", error);
    displayError("Failed to load champions.json: " + error.message);
  });
