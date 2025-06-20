const CHAMP_JSON = "champions.json";
const teamSize = 5;
let teams = [{ id: 1, name: "Team 1", members: Array(teamSize).fill(null) }];
let currentTeamId = 1;
let teamHistory = [];
let champs = [];

function saveTeams() {
  localStorage.setItem("etheria_teams", JSON.stringify(teams));
  localStorage.setItem("etheria_current_team_id", currentTeamId);
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
      saveHistory();
      currentTeam.members[index] = champs[i];
      saveTeams();
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
  document.getElementById("undoButton").disabled = true;
}

function resetTeam() {
  saveHistory();
  const currentTeam = getCurrentTeam();
  currentTeam.members = Array(teamSize).fill(null);
  saveTeams();
  renderTeam();
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

fetch(CHAMP_JSON)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("JSON Data:", data);
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
    loadTeams();
    updateTeamSelect();
    renderTeam();
  })
  .catch((error) => console.error("Error fetching champions:", error));
