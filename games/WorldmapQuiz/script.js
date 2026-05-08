const countries = document.querySelectorAll(".country");

// --- SCORE DISPLAY ---
let correctCount = 0;
let wrongCount = 0;

const scoreBox = document.createElement("div");
scoreBox.classList.add("score-box");

const updateScore = () => {
  scoreBox.textContent = `✅ ${correctCount} | ❌ ${wrongCount}`;
};

updateScore();
document.body.appendChild(scoreBox);

// --- GRID ---
const countryGrid = document.createElement("div");
countryGrid.style.display = "none";
countryGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
countryGrid.style.gap = "8px";
countryGrid.style.marginTop = "20px";
countryGrid.style.padding = "10px";

document.querySelector("svg").after(countryGrid);

// --- PREVIEW PANEL ---
const previewBox = document.createElement("div");
previewBox.style.position = "fixed";
previewBox.style.left = "20px";
previewBox.style.top = "20px";
previewBox.style.width = "200px";
previewBox.style.height = "200px";
previewBox.style.border = "2px solid black";
previewBox.style.background = "#fff";
previewBox.style.display = "none"; // hidden until needed
previewBox.style.alignItems = "center";
previewBox.style.justifyContent = "center";
previewBox.style.zIndex = "9999";
previewBox.style.position = "fixed";

document.body.appendChild(previewBox);

// --- CLOSE BUTTON (❌) ---
const closeBtn = document.createElement("div");
closeBtn.textContent = "✖";
closeBtn.style.position = "absolute";
closeBtn.style.top = "5px";
closeBtn.style.right = "14px";
closeBtn.style.cursor = "pointer";
closeBtn.style.fontWeight = "bold";
closeBtn.style.color = "red";
previewBox.appendChild(closeBtn);

// --- LINE ---
const line = document.createElement("div");
line.style.position = "fixed";
line.style.height = "2px";
line.style.background = "red";
line.style.transformOrigin = "0 0";
line.style.zIndex = "9998";
document.body.appendChild(line);

// --- STATE ---
let activeCountry = null;

// --- SORTED IDS ---
const countryIds = [...new Set(Array.from(countries).map(c => c.id))]
  .sort((a, b) => a.localeCompare(b));

// --- RESET / DESELECT ---
function resetRound() {
  activeCountry = null;
  countryGrid.style.display = "none";
  previewBox.style.display = "none";
  previewBox.innerHTML = "";
  previewBox.appendChild(closeBtn); // keep X button
  line.style.width = "0";
}

function drawLine() {
    const rect = activeCountry.getBoundingClientRect();
    const previewRect = previewBox.getBoundingClientRect();

    const x1 = previewRect.right;
    const y1 = previewRect.top + previewRect.height / 2;

    const x2 = rect.left + rect.width / 2;
    const y2 = rect.top + rect.height / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    line.style.width = length + "px";
    line.style.left = x1 + "px";
    line.style.top = y1 + "px";
    line.style.transform = `rotate(${angle}deg)`;
}

document.addEventListener("scroll", function() {
    drawLine();
});

// close button click
closeBtn.addEventListener("click", resetRound);

// --- CREATE BUTTONS ---
countryIds.forEach(id => {
  const countryBox = document.createElement("div");
  countryBox.textContent = id;
  countryBox.classList.add("country-box");

  countryBox.addEventListener("click", () => {
    if (!activeCountry) return;

    if (id === activeCountry.id) {
      correctCount++;
      updateScore();

      // disable SVG parts
      countries.forEach(c => {
        if (c.id === id) {
          c.style.pointerEvents = "none";
          c.style.opacity = "0.3";
        }
      });

      countryBox.remove();
      resetRound();
    } else {
      wrongCount++;
      updateScore();
      console.log("bacon");
      resetRound();
    }
  });

  countryGrid.appendChild(countryBox);
});

// --- SVG CLICK ---
countries.forEach(country => {
  country.addEventListener("click", () => {
    if (country.style.pointerEvents === "none") return;

    // TOGGLE OFF if same country clicked
    if (activeCountry && activeCountry === country) {
      resetRound();
      return;
    }

    activeCountry = country;

    countryGrid.style.display = "grid";
    previewBox.style.display = "flex";

    // preview clone
    previewBox.innerHTML = "";
    previewBox.appendChild(closeBtn);

    // 1. Collect all SVG parts with the same ID
    const parts = Array.from(document.querySelectorAll(`.country[id="${country.id}"]`));

    // 2. Create SVG wrapper
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "200");
    svg.setAttribute("height", "200");
    svg.style.overflow = "visible";

    // 3. Create a group to hold all parts
    const group = document.createElementNS(svgNS, "g");

    // Clone each part and add to group
    parts.forEach(p => {
      const clone = p.cloneNode(true);
      clone.removeAttribute("transform");
      group.appendChild(clone);
    });

    svg.appendChild(group);
    previewBox.appendChild(svg);

    // 4. Compute combined bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    parts.forEach(p => {
      const bb = p.getBBox();
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.width);
      maxY = Math.max(maxY, bb.y + bb.height);
    });

    const width = maxX - minX;
    const height = maxY - minY;

    // 5. Compute scale to fit inside preview (200×200)
    const boxSize = 180; // leave padding
    const scale = Math.min(boxSize / width, boxSize / height);

    // 6. Center the country inside the preview
    const offsetX = (200 - width * scale) / 2;
    const offsetY = (200 - height * scale) / 2;

    // Apply transform
    group.setAttribute(
      "transform",
      `translate(${offsetX - minX * scale}, ${offsetY - minY * scale}) scale(${scale})`
    );

    // line
    drawLine();
  });
});