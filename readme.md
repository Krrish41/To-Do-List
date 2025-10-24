# To-Do List App

A simple, clean, and interactive To-Do List web application built with HTML, CSS, and vanilla JavaScript. This project allows users to add tasks, mark them as complete, and delete them. The app also features persistent storage using the browser's Local Storage, so your tasks remain even after you close or refresh the page.

## Features

* **Add Tasks:** Easily add new tasks to your list using the input field and "Add" button.
* **Mark as Complete:** Click on a task to toggle its completion status. Completed tasks are visually distinguished with a line-through and a checkmark.
* **Delete Tasks:** Remove tasks from the list by clicking the "×" icon that appears next to each task.
* **Persistent Storage:** All tasks are automatically saved to the browser's Local Storage. This means your list is preserved even if you refresh or close the browser window.
* **Empty Input Validation:** The app will alert the user if they try to add an empty task.

## Technologies Used

* **HTML5:** Provides the basic structure and content of the web page.
* **CSS3:** Used for all styling, including layout (Flexbox), backgrounds, and custom styles for the list items (checked/unchecked states).
* **Vanilla JavaScript:** Powers all the application logic, including:
    * DOM manipulation (adding/deleting tasks).
    * Event handling (clicks for adding, completing, and deleting).
    * Interacting with the Web Storage API (localStorage) to save and retrieve tasks.

## How to Use

1.  **Clone or Download:**
    Clone this repository or download the ZIP file containing `index.html`, `styles.css`, `script.js`, and the `images` folder.

2.  **Ensure Image Paths:**
    Make sure the `images` folder (containing `checked.png`, `unchecked.png`, and `webIco.png`) is in the same directory as the HTML, CSS, and JS files, as the CSS and HTML files reference them.

3.  **Open in Browser:**
    Simply open the `index.html` file in any modern web browser (like Google Chrome, Firefox, Safari, or Edge).

That's it! You can now start adding tasks to your to-do list.