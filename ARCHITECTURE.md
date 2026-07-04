# Project Architecture: Weekly Tasks PWA

This document outlines the architecture, data structures, key logic, and synchronization design for the **Weekly Tasks** application. It serves as the developer guide and reference for AI agents and developers working on this project.

---

## 1. System Overview

The **Weekly Tasks** app is a responsive, client-side Progressive Web Application (PWA) written in vanilla HTML, CSS, and JavaScript. 

### Key Features
*   **Two-Week View**: Visual separation and management of tasks for "This Week" (השבוע הנוכחי) and "Next Week" (השבוע הבא).
*   **Backlog / Task Pool**: A sidebar containing tasks that are not yet assigned to specific days, or carried over from previous weeks.
*   **Recurring Tasks**: Tasks that repeat automatically week-over-week.
*   **Inline Editing**: Quick inline title editing, deletion, and recurring-status toggling.
*   **Custom Settings**: Toggle the start day of the week (Sunday vs. Monday).
*   **Offline Support**: Fully functional offline through PWA configurations.

---

## 2. File Directory Structure

```
weekly tasks/
├── index.html          # Main HTML structure (RTL, Hebrew localization)
├── style.css           # Styling system (smooth gradients, dark-ish mode, glassmorphism)
├── script.js            # Core application state, event handlers, and storage logic
├── manifest.json       # PWA manifest detailing app icons and display mode
├── icon.png            # Application icon (512x512)
├── crop_icon.py        # Python script to crop/mask icon.png into a circle
└── ARCHITECTURE.md     # System design & architecture (this document)
```

---

## 3. Data Model & State Management

The application is client-side only. Application state is managed via an in-memory object `appData` and persisted to the browser's `localStorage` using the key `weeklyTasksV2`.

### Schema Details

```json
{
  "week1": {
    "monday": [ { "id": "t_1719876543210", "text": "Task text", "completed": false, "recurring": false } ],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": []
  },
  "week2": {
    "monday": [],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": []
  },
  "backlog": [
    { "id": "bl_1719876543220", "text": "Unscheduled backlog task", "completed": false }
  ],
  "settings": {
    "startOfWeek": "monday"
  }
}
```

### Data Fields
*   **Task object (week1 / week2)**:
    *   `id` (`string`): Unique identifier (e.g., `'t_' + Date.now() + randomSuffix`).
    *   `text` (`string`): Task description.
    *   `completed` (`boolean`): Completion status (`true` / `false`).
    *   `recurring` (`boolean`): If `true`, the task repeats every week.
*   **Backlog task**:
    *   `id` (`string`): Unique identifier (e.g., `'bl_' + Date.now()`).
    *   `text` (`string`): Task description.
    *   `completed` (`boolean`): Typically `false` (backlog tasks act as a staging area).

---

## 4. Key Logic & Flows

### A. Week Transition (`startNewWeek`)
When a user begins a new week, the following cycle occurs:
1.  **Extract Recurring Tasks**: Scan both `week1` and `week2` for any tasks marked `recurring: true`. Group them by day of the week.
2.  **Staging Uncompleted Tasks**: Collect all non-recurring, uncompleted tasks from `week1` and push them into the `backlog`.
3.  **Advance the Week**: Overwrite `week1` with the contents of `week2`.
4.  **Reset Week 2**: Clear all days in `week2` to empty arrays.
5.  **Restore & Reset Recurring Tasks**: For every day, append the recurring tasks back to both `week1` and `week2`. Their `completed` status is set to `false` for the new week.

### B. Recurring Task Synchronization
*   Toggling a task to `recurring` clones it to the same day in the opposite week (with a new ID).
*   Untoggling a task as recurring filters out the counterpart task in the other week using a text match (`t.text === task.text && t.recurring`).
*   Editing the text of a recurring task updates its counterpart in the other week.

---

## 5. Cross-Device Synchronization Strategy

Because this application runs entirely in the browser client and uses `localStorage`, code-level synchronization (Git/GitHub) **does not automatically sync the tasks themselves**. 

Here are the two ways to sync code and data across multiple devices:

### Phase 1: Source Code Sync (Git & GitHub)
1.  Initialize a repository in the project folder and push it to GitHub.
2.  Clone it on the second machine.
3.  Use git to pull changes before starting, and commit & push after writing code.
4.  The `.gitignore` is set up to ignore local caches, system files, and local logs.

### Phase 2: Task Data Sync (Options)

Since browser `localStorage` is isolated to individual devices, to share your *actual task data* between Computer A and Computer B, we can implement one of the following options:

1.  **Option A: Simple JSON Export & Import (File-based)**:
    *   Add a button to export `appData` as a `.json` file.
    *   Add an import button to read that `.json` file and overwrite `localStorage`.
    *   *Pros*: Easy to implement, doesn't require a database.
    *   *Cons*: Manual export/import step needed.
2.  **Option B: Firebase Realtime Database / Firestore Sync**:
    *   *Pros*: Automatic, seamless real-time syncing. Whenever a task is updated on one computer, it instantly reflects on the other.
    *   *Cons*: Requires a backend setup. (Since your other project already uses Firebase, we can easily adapt those practices to build a Firebase sync for this app as well!).
3.  **Option C: Local Data File Sync (Development/Offline option)**:
    *   We can rewrite the application to save its data to a `data.json` file inside the repository instead of `localStorage` (requiring a tiny Node.js local dev server).
    *   *Pros*: Data is tracked directly in git, syncing code will sync your tasks automatically!
    *   *Cons*: Requires running `npm run dev` or a local server to read/write files (cannot just double-click `index.html`).
