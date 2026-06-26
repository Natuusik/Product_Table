// Хранилища памяти для слов и цифр
let savedWords = new Set(["Põlv100", "Põlv500"]);
let savedNumbers = new Set(["100", "125", "160", "200", "500"]);

window.onload = function() {
    loadFromLocalStorage();
    initEventListeners();
};

function initEventListeners() {
    document.getElementById('globalPercent').addEventListener('input', () => {
        calculateTable();
        saveToLocalStorage();
    });
    document.getElementById('addBtn').addEventListener('click', () => addRow());
    document.getElementById('clearBtn').addEventListener('click', clearOnlyQuantities);
    document.getElementById('exportBtn').addEventListener('click', exportToFile);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', function() { importFromFile(this); });
    
    // Закрытие подсказок при клике в пустом месте
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.name-cell-wrapper')) {
            document.querySelectorAll('.smart-suggestions-container').forEach(panel => panel.style.display = 'none');
        }
    });
}

// ОЧИСТКА: Обнуляет только количество штук! Цена остается!
function clearOnlyQuantities() {
    if (confirm("Обнулить количество штук во всей таблице? (Цены останутся)")) {
        const rows = document.querySelectorAll('#tableBody tr');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) {
                inputs[2].value = "0"; // Обнуляем только 3-й инпут (Kogus)
            }
        });
        calculateTable();
        saveToLocalStorage();
    }
}

// Извлечение и сохранение данных из текста
function extractAndSaveData(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    // Запоминаем полное слово
    savedWords.add(trimmed);
    
    // Вытаскиваем и запоминаем отдельные цифры
    const foundNumbers = trimmed.match(/\d+/g);
    if (foundNumbers) {
        foundNumbers.forEach(num => savedNumbers.add(num));
    }
}

// Отображение смешанных подсказок (слова + числа)
function showSmartPanel(inputElement) {
    document.querySelectorAll('.smart-suggestions-container').forEach(panel => panel.style.display = 'none');
    
    const wrapper = inputElement.closest('.name-cell-wrapper');
    const panel = wrapper.querySelector('.smart-suggestions-container');
    panel.innerHTML = ''; // Очистка
    
    const value = inputElement.value.toLowerCase();

    // 1. Секция Слов (Показываем совпадения или историю)
    const filteredWords = Array.from(savedWords).filter(word => 
        word.toLowerCase().includes(value) && word.toLowerCase() !== value
    );

    if (filteredWords.length > 0 || value === '') {
        const wordsTitle = document.createElement('div');
        wordsTitle.className = 'suggestion-section-title';
        wordsTitle.textContent = 'Повторяющиеся слова:';
        panel.appendChild(wordsTitle);

        const ul = document.createElement('ul');
        ul.className = 'words-list';
        
        // Если поле пустое, покажем последние 5 сохраненных слов для скорости
        const listToRender = value === '' ? Array.from(savedWords).slice(-5) : filteredWords;

        listToRender.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            li.addEventListener('mousedown', function(e) {
                e.preventDefault();
                inputElement.value = word;
                panel.style.display = 'none';
                saveToLocalStorage();
            });
            ul.appendChild(li);
        });
        panel.appendChild(ul);
    }

    // 2. Секция Быстрых Цифр
    if (savedNumbers.size > 0) {
        const digitsTitle = document.createElement('div');
        digitsTitle.className = 'suggestion-section-title';
        digitsTitle.style.marginTop = '8px';
        digitsTitle.textContent = 'Быстрые цифры:';
        panel.appendChild(digitsTitle);

        const digitsRow = document.createElement('div');
        digitsRow.className = 'digits-row';

        savedNumbers.forEach(num => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'num-tag';
            btn.textContent = num;
            
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault();
                inputElement.value = inputElement.value.trim() + num;
                extractAndSaveData(inputElement.value);
                showSmartPanel(inputElement); // Обновляем окно подсказок
                saveToLocalStorage();
            });
            digitsRow.appendChild(btn);
        });
        panel.appendChild(digitsRow);
    }

    if (panel.children.length > 0) {
        panel.style.display = 'flex';
    }
}

function calculateTable() {
    const percent = parseFloat(document.getElementById('globalPercent').value) || 0;
    const rows = document.querySelectorAll('#tableBody tr');
    
    let totalSumma = 0;
    let totalKokku = 0;

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) {
            const price = parseFloat(inputs[1].value) || 0;     
            const quantity = parseFloat(inputs[2].value) || 0;  
            
            const sum = price * quantity;
            const totalWithPercent = sum + (sum * percent / 100);
            
            totalSumma += sum;
            totalKokku += totalWithPercent;
            
            row.cells[3].textContent = Number(sum.toFixed(2));
            row.cells[4].textContent = Number(totalWithPercent.toFixed(2));
        }
    });

    document.getElementById('grandSumma').textContent = Number(totalSumma.toFixed(2));
    document.getElementById('grandKokku').textContent = Number(totalKokku.toFixed(2));
}
// Изменили в первой строке quantity = "1" на quantity = "0"
function addRow(name = "", price = "0", quantity = "0") {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>
            <div class="name-cell-wrapper">
                <input type="text" value="${name}" class="name-input" placeholder="Например: Põlv">
                <div class="smart-suggestions-container"></div>
            </div>
        </td>
        <td><input type="number" value="${price}"></td>
        <td><input type="number" value="${quantity}" min="0"></td>
        <td class="readonly-cell">0</td>
        <td class="readonly-cell">0</td>
        <td><button class="delete-btn">✕</button></td>
    `;
// ...дальше код функции продолжается без изменений...

    
    const nameInput = tr.querySelector('.name-input');
    nameInput.addEventListener('focus', function() { showSmartPanel(this); });
    nameInput.addEventListener('input', function() { 
        extractAndSaveData(this.value); 
        showSmartPanel(this); 
        saveToLocalStorage(); 
    });
    
    const inputs = tr.querySelectorAll('input');
    inputs[1].addEventListener('input', () => { calculateTable(); saveToLocalStorage(); });
    inputs[2].addEventListener('input', () => { calculateTable(); saveToLocalStorage(); });
    
    tr.querySelector('.delete-btn').addEventListener('click', function() {
        tr.remove();
        calculateTable();
        saveToLocalStorage();
    });

    tbody.appendChild(tr);
    calculateTable();
    saveToLocalStorage();
}

function collectCurrentData() {
    const percent = document.getElementById('globalPercent').value;
    const rows = document.querySelectorAll('#tableBody tr');
    const tableData = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) {
            tableData.push({
                name: inputs[0].value,
                price: inputs[1].value,
                quantity: inputs[2].value
            });
        }
    });

    return { 
        percent: percent, 
        rows: tableData,
        rememberedWords: Array.from(savedWords),
        rememberedNumbers: Array.from(savedNumbers)
    };
}

function renderData(data) {
    if (!data) return;
    if (data.percent !== undefined) document.getElementById('globalPercent').value = data.percent;
    if (data.rememberedWords) savedWords = new Set(data.rememberedWords);
    if (data.rememberedNumbers) savedNumbers = new Set(data.rememberedNumbers);

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = ""; 

    if (data.rows && data.rows.length > 0) {
        data.rows.forEach(item => {
            addRow(item.name, item.price, item.quantity);
        });
    }
}

function saveToLocalStorage() {
    const data = collectCurrentData();
    localStorage.setItem('tableWithSmartMemoryBackup', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('tableWithSmartMemoryBackup');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            renderData(data);
            return;
        } catch(e) { console.error("Ошибка автозагрузки", e); }
    }
    addRow("Põlv100", "100", "0");
    addRow("Põlv500", "50", "0");
}

function exportToFile() {
    const data = collectCurrentData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `table_memory_${date}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importFromFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data && data.rows) {
                renderData(data);
                saveToLocalStorage();
                alert("Данные успешно восстановлены!");
            } else {
                alert("Ошибка: Неверный формат файла.");
            }
        } catch (err) {
            alert("Не удалось прочитать файл.");
        }
        input.value = "";
    };
    reader.readAsText(file);
}
