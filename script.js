const daysOfWeek = [
    { id: 'monday', name: 'יום שני' },
    { id: 'tuesday', name: 'יום שלישי' },
    { id: 'wednesday', name: 'יום רביעי' },
    { id: 'thursday', name: 'יום חמישי' },
    { id: 'friday', name: 'יום שישי' },
    { id: 'saturday', name: 'שבת קודש' },
    { id: 'sunday', name: 'יום ראשון' }
];

// מצב ראשוני או חילוץ מהאחסון
let appData = JSON.parse(localStorage.getItem('weeklyTasksV2')) || null;

// פונקציית מיגרציה מהגרסה הישנה (שהייתה שמורה תחת 'weeklyTasks') או אתחול
if (!appData) {
    let legacyData = JSON.parse(localStorage.getItem('weeklyTasks'));
    appData = {
        week1: {},
        week2: {},
        backlog: []
    };
    
    // יצירת מערכים ריקים
    daysOfWeek.forEach(day => {
        appData.week1[day.id] = [];
        appData.week2[day.id] = [];
    });

    // ייבוא משימות ישנות לתוך שבוע 1 אם קיימות
    if (legacyData) {
        Object.keys(legacyData).forEach(dayId => {
            if (appData.week1[dayId]) {
                appData.week1[dayId] = legacyData[dayId] || [];
            } else {
                // משימות שאין להן יום מתאים נדחפות ל-Backlog
                appData.backlog.push(...(legacyData[dayId] || []));
            }
        });
        // הפסקנו להשתמש במפתח הישן
        localStorage.removeItem('weeklyTasks');
    }
}

// שמירת נתונים
function saveData() {
    localStorage.setItem('weeklyTasksV2', JSON.stringify(appData));
}

// אתחול המסכים
document.addEventListener('DOMContentLoaded', () => {
    setupForm('backlogForm', 'backlogInput', (text) => addBacklogTask(text));
    renderAll();
});

// רינדור ראשי לכל החלקים
function renderAll() {
    renderBacklog();
    renderWeekGrid('week1', 'week1Grid');
    renderWeekGrid('week2', 'week2Grid');
}

// הגדרת טופס למניעת חזרה על קוד
function setupForm(formId, inputId, onAdd) {
    const form = document.getElementById(formId);
    if (!form) return;
    const input = document.getElementById(inputId);
    form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            onAdd(text);
            input.value = '';
        }
    };
}

// יצירת משימה במאגר
function addBacklogTask(text) {
    const newTask = {
        id: 'bl_' + Date.now(),
        text: text,
        completed: false
    };
    appData.backlog.push(newTask);
    saveData();
    renderBacklog();
}

// לחיצה על משימת Backlog לא סוגר אותה כ"V" אלא זה רק מאגר לשיבוץ! אז הוספתי כפתור.
function renderBacklog() {
    const list = document.getElementById('backlogList');
    list.innerHTML = '';
    
    appData.backlog.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item backlog-item';
        
        // לחיצה על המשימה עצמה תפתח את מסך השיבוץ (זה נוח)
        li.onclick = () => openAssignModal(task.id, task.text);
        
        const txt = document.createElement('span');
        txt.className = 'task-text';
        txt.textContent = task.text;
        
        const btn = document.createElement('button');
        btn.className = 'btn-assign';
        btn.textContent = 'שבץ משימה';
        // מונע את פתיחת המודל פעמיים במקרה שלחיצה גם על ה-LI
        btn.onclick = (e) => {
            e.stopPropagation();
            openAssignModal(task.id, task.text);
        };
        
        li.appendChild(txt);
        li.appendChild(btn);
        
        list.appendChild(li);
    });
}

function renderWeekGrid(weekKey, gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    daysOfWeek.forEach(day => {
        const card = document.createElement('div');
        card.className = 'day-card';
        
        const header = document.createElement('h3');
        header.className = 'day-header';
        header.textContent = day.name;
        
        // טופס הוספה מקומי
        const form = document.createElement('form');
        form.className = 'add-task-form';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'רשום הוספה מהירה...';
        input.required = true;
        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.textContent = '+';
        
        form.appendChild(input);
        form.appendChild(btn);
        
        form.onsubmit = (e) => {
            e.preventDefault();
            addTaskToDay(weekKey, day.id, input.value.trim());
            input.value = '';
        };
        
        // רשימה
        const ul = document.createElement('ul');
        ul.className = 'task-list';
        
        appData[weekKey][day.id].forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');
            if (task.recurring) li.classList.add('recurring');
            
            li.onclick = () => toggleTask(weekKey, day.id, task.id);
            
            const checkbox = document.createElement('div');
            checkbox.className = 'task-checkbox';
            
            const txt = document.createElement('span');
            txt.className = 'task-text';
            txt.textContent = task.text;
            
            const btnRecurring = document.createElement('button');
            btnRecurring.className = 'btn-recurring ' + (task.recurring ? 'active' : '');
            btnRecurring.innerHTML = '🔁';
            btnRecurring.title = 'הפוך למשימה קבועה בכל שבוע';
            btnRecurring.onclick = (e) => {
                e.stopPropagation();
                toggleRecurring(weekKey, day.id, task.id);
            };
            
            li.appendChild(checkbox);
            li.appendChild(txt);
            li.appendChild(btnRecurring);
            ul.appendChild(li);
        });
        
        card.appendChild(header);
        card.appendChild(form);
        card.appendChild(ul);
        grid.appendChild(card);
    });
}

function addTaskToDay(weekKey, dayId, text) {
    if (!text) return;
    const newTask = {
        id: 't_' + Date.now(),
        text: text,
        completed: false,
        recurring: false
    };
    appData[weekKey][dayId].push(newTask);
    saveData();
    renderAll();
}

function toggleTask(weekKey, dayId, taskId) {
    const task = appData[weekKey][dayId].find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderAll();
    }
}

function toggleRecurring(weekKey, dayId, taskId) {
    const task = appData[weekKey][dayId].find(t => t.id === taskId);
    if (!task) return;
    
    task.recurring = !task.recurring;
    
    if (task.recurring) {
        // Copy to other week if it does not exist
        const otherWeek = weekKey === 'week1' ? 'week2' : 'week1';
        const exists = appData[otherWeek][dayId].find(t => t.text === task.text && t.recurring);
        if (!exists) {
            appData[otherWeek][dayId].push({
                id: 't_' + Date.now() + Math.random().toString(36).substr(2, 5),
                text: task.text,
                completed: false,
                recurring: true
            });
        }
    } else {
        // Remove from other week
        const otherWeek = weekKey === 'week1' ? 'week2' : 'week1';
        appData[otherWeek][dayId] = appData[otherWeek][dayId].filter(t => !(t.text === task.text && t.recurring));
    }
    
    saveData();
    renderAll();
}

// ======================
// ניהול המודל (שיבוץ)
// ======================
let currentAssignTaskId = null;

function openAssignModal(taskId, taskText) {
    currentAssignTaskId = taskId;
    document.getElementById('modalTaskText').textContent = '"' + taskText + '"';
    
    const buttonsContainer = document.getElementById('modalButtons');
    buttonsContainer.innerHTML = ''; // מנקה קודמים
    
    // ניצור כפתור לכל יום בגרפיקה. נציג לאיזה שבוע אנחנו משבצים.
    // מכיוון שיש הרבה כפתורים (14), הגיוני להציג כותרת ביניהם או רק כפתורים עם ציון ברור
    
    const week1Div = document.createElement('div');
    week1Div.style.gridColumn = "1 / -1";
    week1Div.style.textAlign = "right";
    week1Div.style.color = "var(--vivid-blue)";
    week1Div.style.fontWeight = "bold";
    week1Div.innerHTML = "בשבוע הנוכחי:";
    buttonsContainer.appendChild(week1Div);
    
    daysOfWeek.forEach(day => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn-day';
        btn.textContent = day.name;
        btn.onclick = () => assignTask('week1', day.id);
        buttonsContainer.appendChild(btn);
    });
    
    const week2Div = document.createElement('div');
    week2Div.style.gridColumn = "1 / -1";
    week2Div.style.textAlign = "right";
    week2Div.style.color = "var(--vivid-pink)";
    week2Div.style.marginTop = "1rem";
    week2Div.style.fontWeight = "bold";
    week2Div.innerHTML = "לאותו יום בשבוע הבא:";
    buttonsContainer.appendChild(week2Div);
    
    daysOfWeek.forEach(day => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn-day';
        btn.textContent = day.name;
        btn.onclick = () => assignTask('week2', day.id);
        buttonsContainer.appendChild(btn);
    });
    
    document.getElementById('assignModal').classList.add('active');
}

function closeAssignModal() {
    currentAssignTaskId = null;
    document.getElementById('assignModal').classList.remove('active');
}

function deleteAssignTask() {
    if (!currentAssignTaskId) return;
    
    // מצא והוצא מהמאגר לצמיתות
    const taskIndex = appData.backlog.findIndex(t => t.id === currentAssignTaskId);
    if (taskIndex !== -1) {
        if (confirm("האם למחוק את המשימה לצמיתות?")) {
            appData.backlog.splice(taskIndex, 1);
            saveData();
            renderAll();
            closeAssignModal();
        }
    }
}

function assignTask(weekKey, dayId) {
    if (!currentAssignTaskId) return;
    
    // מצא והוצא מהמאגר
    const taskIndex = appData.backlog.findIndex(t => t.id === currentAssignTaskId);
    if (taskIndex !== -1) {
        const task = appData.backlog[taskIndex];
        appData.backlog.splice(taskIndex, 1);
        
        // יצירת ID חדש כדי למנוע כפילויות התנגשויות (למרות שלא חובה)
        appData[weekKey][dayId].push(task);
        
        saveData();
        renderAll();
        closeAssignModal();
    }
}

// ======================
// הלב של הפיצ'ר: תחילת שבוע
// ======================
function startNewWeek() {
    const confirmation = confirm("האם את בטוחה שאת רוצה להתחיל שבוע חדש? המשימות הפתוחות יעברו למאגר והשבוע יתקדם.");
    if (!confirmation) return;
    
    // 0. איתור כל המשימות הקבועות (Recurring) כדי לוודא שימשיכו הלאה
    let recurringTasksByDay = {};
    daysOfWeek.forEach(day => {
        recurringTasksByDay[day.id] = [];
        appData.week1[day.id].forEach(t => {
            if (t.recurring) recurringTasksByDay[day.id].push(t);
        });
        appData.week2[day.id].forEach(t => {
            if (t.recurring && !recurringTasksByDay[day.id].find(rt => rt.text === t.text)) {
                recurringTasksByDay[day.id].push(t);
            }
        });
    });

    // 1. העברת כל המשימות הפתוחות של שבוע 1 אל המאגר (מלבד המשימות הקבועות שימשיכו הלאה)
    daysOfWeek.forEach(day => {
        const uncompleted = appData.week1[day.id].filter(t => !t.completed && !t.recurring);
        appData.backlog.push(...uncompleted);
    });
    
    // 2. שבוע 2 הופך להיות שבוע 1
    // צריך לעשות Deep Copy כדי לא לקשר את הריפרנס
    const week2Copy = JSON.parse(JSON.stringify(appData.week2));
    appData.week1 = week2Copy;
    
    // 3. איפוס מוחלט של שבוע 2
    daysOfWeek.forEach(day => {
        appData.week2[day.id] = [];
    });
    
    // 4. החזרת כל המשימות הקבועות לשבוע 1 ולשבוע 2 (תמיד מתחילות כלא-מבוצעות לשבוע החדש)
    daysOfWeek.forEach(day => {
        recurringTasksByDay[day.id].forEach(rt => {
            let existsInW1 = appData.week1[day.id].find(t => t.text === rt.text && t.recurring);
            if (!existsInW1) {
                appData.week1[day.id].push({
                    id: 't_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    text: rt.text,
                    completed: false,
                    recurring: true
                });
            } else {
                existsInW1.completed = false; // בשבוע החדש זה חוזר להיות לא מבוצע
            }
            
            let existsInW2 = appData.week2[day.id].find(t => t.text === rt.text && t.recurring);
            if (!existsInW2) {
                appData.week2[day.id].push({
                    id: 't_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    text: rt.text,
                    completed: false,
                    recurring: true
                });
            } else {
                // If it already carried over, reset completed if needed? We leave W2 completed status as is
            }
        });
    });

    // שמירה ועדכון UI
    saveData();
    renderAll();
}
