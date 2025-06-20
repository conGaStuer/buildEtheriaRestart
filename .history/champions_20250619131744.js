const CHAMP_JSON = "champions.json";
const teamSize = 5;
let teams = [{ id: 1, name: "Team 1", members: Array(teamSize).fill(null) }];
let currentTeamId = 1;
let teamHistory = [];
let champs = [];

function displayError(message, target = "error") {
  const errorEl = document.getElementById(target);
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

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Request CORS headers
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
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
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      console.log("Drag over slot", index);
    });
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const i = parseInt(e.dataTransfer.getData("text"));
      console.log("Dropped champion index", i);
      if (!isNaN(i) && champs[i]) {
        saveHistory();
        currentTeam.members[index] = champs[i];
        saveTeams();
        renderTeam();
      } else {
        displayError("Invalid champion dropped!");
      }
    });
    if (champ) {
      const img = document.createElement("img");
      img.src =
        champ["gatsby-image-wrapper src 2"] ||
        "https://via.placeholder.com/120x164?text=Placeholder";
      img.title = champ["emp-name"] || "Unknown";
      img.crossOrigin = "Anonymous";
      img.onerror = () => {
        img.src = "https://via.placeholder.com/120x164?text=Error";
        displayError(
          `Failed to load image for ${champ["emp-name"] || "Unknown"}`
        );
      };
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
  // Preload all images in the team
  const currentTeam = getCurrentTeam();
  const imagePromises = currentTeam.members
    .filter((champ) => champ && champ["gatsby-image-wrapper src 2"])
    .map((champ) => preloadImage(champ["gatsby-image-wrapper src 2"]));
  Promise.all(imagePromises)
    .then(() => {
      html2canvas(teamEl, { useCORS: true })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `etheria_team_${currentTeamId}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((e) => displayError("Screenshot failed: " + e.message));
    })
    .catch((e) =>
      displayError("Failed to preload images for screenshot: " + e.message)
    );
}

fetch(CHAMP_JSON)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    console.log("JSON Data:", data);
    if (!Array.isArray(data) || data.length === 0) {
      displayError("Invalid or empty champions data!", "championsError");
      return;
    }
    champs = data;
    const grid = document.getElementById("champions");
    if (!grid) {
      displayError("Champions grid element not found!", "championsError");
      return;
    }
    grid.innerHTML = "";
    data.forEach((champ, index) => {
      const div = document.createElement("div");
      div.className = "champ";
      div.draggable = true;
      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index.toString());
        console.log("Dragging champion index", index);
      });
      const img = document.createElement("img");
      img.src =
        champ["gatsby-image-wrapper src 2"] ||
        "https://via.placeholder.com/120x164?text=Placeholder";
      img.alt = champ["emp-name"] || "Unknown";
      img.crossOrigin = "Anonymous";
      img.onerror = () => {
        img.src = "https://via.placeholder.com/120x164?text=Error";
        displayError(
          `Failed to load image for ${champ["emp-name"] || "Unknown"}`,
          "championsError"
        );
      };
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
    displayError(
      "Failed to load champions.json: " + error.message,
      "championsError"
    );
  });
