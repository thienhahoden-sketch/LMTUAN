let drugs = [];
let currentId = null;
let localDrugHistory = JSON.parse(localStorage.getItem("drug_history") || "[]");

/* DATABASE THUOC TU FILE JSON */
let drugDatabase = [];

/* ===== LOAD DRUG JSON ===== */
function normalize(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function loadDrugDatabase() {
    try {
        const response = await fetch("drugs_1000.json");
        if (!response.ok) {
            throw new Error("Khong doc duoc drugs.json");
        }
        drugDatabase = await response.json();
        console.log("Da tai", drugDatabase.length, "thuoc");
    } catch (err) {
        console.log("Loi load drugs.json:", err);
        drugDatabase = [];
    }
}

loadDrugDatabase();

/* ===== DATE ===== */
const prescriptionDate = document.getElementById("prescriptionDate");
const today = new Date();
prescriptionDate.value = today.toISOString().split("T")[0];

function updateDate() {
    const d = new Date(prescriptionDate.value + "T00:00:00");
    document.getElementById("day").innerText = d.getDate();
    document.getElementById("month").innerText = d.getMonth() + 1;
    document.getElementById("year").innerText = d.getFullYear();
}
prescriptionDate.addEventListener("change", updateDate);
updateDate();

/* ===== RENDER PRESCRIPTION ===== */
function renderPrescription() {
    document.getElementById("printClinic").innerText = document.getElementById("clinicName").value;
    document.getElementById("printUnit").innerText = document.getElementById("unitName").value;
    document.getElementById("printPatient").innerText = document.getElementById("patientName").value;
    document.getElementById("printAddress").innerText = document.getElementById("patientAddress").value;
    document.getElementById("printAge").innerText = document.getElementById("patientAge").value;
    document.getElementById("printGender").innerText = document.getElementById("patientGender").value;
    document.getElementById("printDiagnosis").innerText = document.getElementById("diagnosis").value;
    document.getElementById("printNote").innerText = document.getElementById("note").value;
    document.getElementById("printDoctor").innerText = document.getElementById("doctorName").value;

    const tbody = document.getElementById("drugTableBody");
    tbody.innerHTML = "";

    drugs.forEach((d, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-stt">${i + 1}</td>
            <td>
                <div class="drug-top">
                    <div class="drug-name">${d.name}</div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="drug-qty">${d.qty}</div>
                        <button onclick="removeDrug(${i})" style="background:#c62828;color:white;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px;">X</button>
                    </div>
                </div>
                <div class="drug-guide">${d.guide}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.querySelectorAll("input,textarea,select").forEach(el => {
    el.addEventListener("input", renderPrescription);
});
renderPrescription();

/* ===== ADD DRUG ===== */
function addDrug() {
    const name = document.getElementById("drugNameInput").value.trim();
    if (!name) return;

    const qty = document.getElementById("drugQtyInput").value.trim();
    const guide = document.getElementById("drugGuideInput").value.trim();

    drugs.push({ name, qty, guide });
    saveDrugToHistory(name);

    document.getElementById("drugNameInput").value = "";
    document.getElementById("drugQtyInput").value = "";
    document.getElementById("drugGuideInput").value = "";

    hideDrugSuggestions();
    renderPrescription();
}

function removeDrug(index) {
    if (!confirm("Xoa thuoc nay?")) return;
    drugs.splice(index, 1);
    renderPrescription();
}

document.getElementById("drugGuideInput").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addDrug(); }
});

/* ===== STORAGE ===== */
function getAll() {
    return JSON.parse(localStorage.getItem("prescriptions") || "[]");
}
function saveAll(arr) {
    localStorage.setItem("prescriptions", JSON.stringify(arr));
}

function collectForm() {
    return {
        id: currentId || Date.now().toString(),
        clinicName: document.getElementById("clinicName").value,
        unitName: document.getElementById("unitName").value,
        patientName: document.getElementById("patientName").value,
        patientAge: document.getElementById("patientAge").value,
        patientGender: document.getElementById("patientGender").value,
        patientAddress: document.getElementById("patientAddress").value,
        diagnosis: document.getElementById("diagnosis").value,
        note: document.getElementById("note").value,
        doctorName: document.getElementById("doctorName").value,
        date: document.getElementById("prescriptionDate").value,
        drugs: JSON.parse(JSON.stringify(drugs)),
        savedAt: Date.now()
    };
}

function savePrescription() {
    const data = collectForm();
    if (!data.patientName.trim()) {
        alert("Vui long nhap ten benh nhan!"); return;
    }
    currentId = data.id;
    const arr = getAll();
    const idx = arr.findIndex(x => x.id === data.id);
    if (idx >= 0) arr[idx] = data; else arr.push(data);
    saveAll(arr);
    renderHistory();
    alert("Da luu don thuoc!");
}

function updatePrescription() {
    if (!currentId) { savePrescription(); return; }
    const data = collectForm();
    const arr = getAll();
    const idx = arr.findIndex(x => x.id === currentId);
    if (idx >= 0) { arr[idx] = data; saveAll(arr); renderHistory(); alert("Da cap nhat!"); }
    else savePrescription();
}

function newPrescription() {
    if (!confirm("Tao don moi? Du lieu hien tai se mat neu chua luu.")) return;
    currentId = null;
    ["patientName", "patientAddress", "patientAge", "diagnosis", "note", "doctorName"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("patientGender").value = "Nam";
    prescriptionDate.value = new Date().toISOString().split("T")[0];
    updateDate();
    drugs = [];
    renderPrescription();
}

function loadPrescription(id) {
    const arr = getAll();
    const data = arr.find(x => x.id === id);
    if (!data) return;
    currentId = data.id;
    document.getElementById("clinicName").value = data.clinicName || "";
    document.getElementById("unitName").value = data.unitName || "";
    document.getElementById("patientName").value = data.patientName || "";
    document.getElementById("patientAge").value = data.patientAge || "";
    document.getElementById("patientAddress").value = data.patientAddress || "";
    document.getElementById("patientGender").value = data.patientGender || "Nam";
    document.getElementById("diagnosis").value = data.diagnosis || "";
    document.getElementById("note").value = data.note || "";
    document.getElementById("doctorName").value = data.doctorName || "";
    document.getElementById("prescriptionDate").value = data.date || "";
    updateDate();
    drugs = data.drugs || [];
    renderPrescription();
}

function deletePrescription(id, e) {
    e.stopPropagation();
    if (!confirm("Xoa don thuoc nay?")) return;
    const arr = getAll().filter(x => x.id !== id);
    saveAll(arr);
    if (currentId === id) { currentId = null; }
    renderHistory();
}

/* ===== RENDER HISTORY ===== */
function renderHistory() {
    const q = (document.getElementById("searchBox").value || "").toLowerCase();
    let arr = getAll();

    if (q) {
        arr = arr.filter(x =>
            (x.patientName || "").toLowerCase().includes(q) ||
            (x.doctorName || "").toLowerCase().includes(q) ||
            (x.diagnosis || "").toLowerCase().includes(q)
        );
    }

    arr.sort((a, b) => new Date(b.date) - new Date(a.date));

    const grouped = {};
    arr.forEach(p => {
        const doc = p.doctorName || "(Chua co bac si)";
        if (!grouped[doc]) grouped[doc] = [];
        grouped[doc].push(p);
    });

    const container = document.getElementById("historyList");
    container.innerHTML = "";

    if (!arr.length) {
        container.innerHTML = '<div class="empty-history">Chua co don nao duoc luu.</div>';
        return;
    }

    Object.entries(grouped).forEach(([doc, list]) => {
        const grp = document.createElement("div");
        grp.className = "doctor-group";

        const header = document.createElement("div");
        header.className = "doctor-group-header";
        header.innerHTML = `<span>BS. ${doc}</span><span class="doctor-group-count">${list.length}</span>`;
        grp.appendChild(header);

        list.forEach(p => {
            const d = new Date(p.date + "T00:00:00");
            const dStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
            const item = document.createElement("div");
            item.className = "pres-item" + (p.id === currentId ? " pres-active" : "");
            item.style.borderLeft = p.id === currentId ? "3px solid #1976d2" : "";
            item.innerHTML = `
                <div class="pres-top">${p.patientName || "(Chua ten)"}</div>
                <div class="pres-date">${dStr} - ${p.patientAge || "?"}t, ${p.patientGender || ""}</div>
                <div class="pres-diagnosis">${p.diagnosis || "(Chua chan doan)"}</div>
                <button class="pres-delete" onclick="deletePrescription('${p.id}',event)">X</button>`;
            item.addEventListener("click", () => loadPrescription(p.id));
            grp.appendChild(item);
        });

        container.appendChild(grp);
    });
}

renderHistory();

/* ===== SAVE DRUG HISTORY ===== */
function saveDrugToHistory(name) {
    name = name.trim();
    if (!name) return;

    let arr = JSON.parse(localStorage.getItem("drug_history") || "[]");
    const found = arr.find(x => x.name.toLowerCase() === name.toLowerCase());

    if (found) {
        found.count += 1;
        found.lastUsed = Date.now();
    } else {
        arr.push({
            name: name,
            count: 1,
            lastUsed: Date.now()
        });
    }

    arr.sort((a, b) => b.count - a.count);
    localStorage.setItem("drug_history", JSON.stringify(arr));
    localDrugHistory = arr;
}

/* ===== AUTOCOMPLETE ===== */
const drugInput = document.getElementById("drugNameInput");
const suggestBox = document.getElementById("drugSuggestBox");
let selectedSuggestionIndex = -1;

drugInput.addEventListener("input", function () {
    const keyword = this.value.trim();
    if (keyword.length < 2) {
        hideDrugSuggestions();
        return;
    }

    // 1. Tìm trong lịch sử
    const historyResults = localDrugHistory
        .filter(x => normalize(x.name).includes(normalize(keyword)))
        .map(x => ({
            name: x.name,
            sub: "Da ke " + x.count + " lan",
            isHistory: true
        }));

    // 2. Tìm trong danh mục thuốc
    const dbResults = drugDatabase
        .filter(d => 
            normalize(d.biet_duoc_ham_luong || "").includes(normalize(keyword)) || 
            normalize(d.hoat_chat || "").includes(normalize(keyword))
        )
        .map(d => ({
            name: d.biet_duoc_ham_luong || "",
            active_ingredient: d.hoat_chat || "",
            max_dose: d.lieu_toi_da || "",
            sub: d.nhom_thuoc || "Danh muc thuoc",
            isHistory: false
        }));

    // 3. Gộp và lọc trùng
    let merged = [...historyResults];
    dbResults.forEach(dbItem => {
        if (!merged.find(m => m.name.toLowerCase() === dbItem.name.toLowerCase())) {
            merged.push(dbItem);
        }
    });

    renderDrugSuggestions(merged.slice(0, 15));
});

drugInput.addEventListener("keydown", function (e) {
    const items = suggestBox.querySelectorAll(".drug-suggest-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedSuggestionIndex++;
        if (selectedSuggestionIndex >= items.length) selectedSuggestionIndex = 0;
        updateSuggestionSelection(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedSuggestionIndex--;
        if (selectedSuggestionIndex < 0) selectedSuggestionIndex = items.length - 1;
        updateSuggestionSelection(items);
    } else if (e.key === "Enter") {
        if (selectedSuggestionIndex >= 0) {
            e.preventDefault();
            const selectedItem = items[selectedSuggestionIndex];
            const name = selectedItem.querySelector(".drug-suggest-main").innerText;
            selectDrugSuggestion(name);
        }
    } else if (e.key === "Escape") {
        hideDrugSuggestions();
    }
});

function renderDrugSuggestions(list) {
    if (!list.length) {
        hideDrugSuggestions();
        return;
    }

    selectedSuggestionIndex = -1;
    suggestBox.innerHTML = "";

    list.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "drug-suggest-item";
        div.dataset.index = index;

        // Tạo phần hiển thị Hoạt chất và Liều tối đa nếu có
        let detailHtml = `<div class="drug-suggest-sub">${item.sub}</div>`;
        if (item.active_ingredient || item.max_dose) {
            detailHtml = `
                <div class="drug-suggest-detail">
                    ${item.active_ingredient ? `<span class="tag-ingredient">HC: ${item.active_ingredient}</span>` : ""}
                    ${item.max_dose ? `<span class="tag-maxdose">Liều tối đa: ${item.max_dose}</span>` : ""}
                </div>
                <div class="drug-suggest-sub">${item.sub}</div>
            `;
        }

        div.innerHTML = `
            <div class="drug-suggest-main">${item.name}</div>
            ${detailHtml}
        `;
        div.onclick = () => selectDrugSuggestion(item.name);
        suggestBox.appendChild(div);
    });

    suggestBox.style.display = "block";
}

function selectDrugSuggestion(name) {
    drugInput.value = name;
    hideDrugSuggestions();
    document.getElementById("drugQtyInput").focus();
}

function hideDrugSuggestions() {
    suggestBox.innerHTML = "";
    suggestBox.style.display = "none";
}

function updateSuggestionSelection(items) {
    items.forEach(item => item.classList.remove("drug-suggest-active"));
    const activeItem = items[selectedSuggestionIndex];
    if (activeItem) {
        activeItem.classList.add("drug-suggest-active");
        activeItem.scrollIntoView({ block: "nearest" });
    }
}

document.addEventListener("click", function (e) {
    if (!e.target.closest(".drug-autocomplete")) {
        hideDrugSuggestions();
    }
});
