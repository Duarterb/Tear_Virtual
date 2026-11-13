// ============================================================
// MATRIX CLASS
// Responsible for the original 4 x 44 A-D matrix.
// ============================================================s

class Matrix {
    constructor(rows, columns, storageKey = "tearVirtualMatrix") {
        this.rows = rows;
        this.columns = columns;
        this.storageKey = storageKey;

        this.data = this.createEmptyMatrix();
        this.loadFromMemory();
    }

    createEmptyMatrix() {
        return Array.from(
            { length: this.rows },
            () => Array(this.columns).fill(0)
        );
    }

    isValidMatrix(matrix) {
        return (
            Array.isArray(matrix) &&
            matrix.length === this.rows &&
            matrix.every(
                row =>
                    Array.isArray(row) &&
                    row.length === this.columns &&
                    row.every(value => value === 0 || value === 1)
            )
        );
    }

    loadFromMemory() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(this.storageKey)
            );

            if (this.isValidMatrix(saved)) {
                this.data = saved;
                return true;
            }
        } catch (error) {
            console.error("Could not load the matrix.", error);
        }

        this.data = this.createEmptyMatrix();
        return false;
    }

    saveToMemory() {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.data)
            );

            return true;
        } catch (error) {
            console.error("Could not save the matrix.", error);
            return false;
        }
    }

    isValidPosition(row, column) {
        return (
            Number.isInteger(row) &&
            Number.isInteger(column) &&
            row >= 0 &&
            row < this.rows &&
            column >= 0 &&
            column < this.columns
        );
    }

    getCell(row, column) {
        if (!this.isValidPosition(row, column)) {
            return 0;
        }

        return this.data[row][column];
    }

    getSnapshot() {
        return this.data.map(row => [...row]);
    }

    toggleCell(row, column) {
        if (!this.isValidPosition(row, column)) {
            return false;
        }

        const wasSelected = this.data[row][column] === 1;

        // Only one letter can be selected per column.
        for (let currentRow = 0; currentRow < this.rows; currentRow++) {
            this.data[currentRow][column] = 0;
        }

        // Clicking an already selected cell deselects it.
        if (!wasSelected) {
            this.data[row][column] = 1;
        }

        this.saveToMemory();

        return true;
    }

    row_text(n) {
        const text = ["D", "C", "B", "A"];
        return text[n];
    }

    clear() {
        this.data = this.createEmptyMatrix();
        this.saveToMemory();
    }
}


// ============================================================
// EXPANDED MATRIX CLASS
// Responsible for:
// - Multipliers (M)
// - Repeaters (E)
// - Repeater boundaries
// - Creating the linear representation
// ============================================================

class ExpandedMatrix {
    constructor(matrix, columns) {
        this.matrix = matrix;
        this.columns = columns;

        this.multiplierKey = "tearVirtualMultipliers";
        this.repeaterKey = "tearVirtualRepeaters";
        this.boundaryKey = "tearVirtualBoundaries";
        this.expandedKey = "tearVirtualExpandedLine";

        this.multipliers = this.createNumberArray();
        this.repeaters = this.createNumberArray();
        this.boundaries = this.createBoundaryArray();

        this.line = [];

        this.loadFromMemory();
    }

    // --------------------------------------------------------
    // CREATE DEFAULT DATA
    // --------------------------------------------------------

    createNumberArray() {
        return Array(this.columns).fill(1);
    }

    createBoundaryArray() {
        return Array(this.columns + 1).fill(false);
    }

    // --------------------------------------------------------
    // LOAD AND SAVE
    // --------------------------------------------------------

    loadNumberArray(storageKey) {
        try {
            const saved = JSON.parse(
                localStorage.getItem(storageKey)
            );

            if (
                Array.isArray(saved) &&
                saved.length === this.columns
            ) {
                return saved.map(value =>
                    Number.isInteger(value) &&
                    value >= 1 &&
                    value <= 99
                        ? value
                        : 1
                );
            }
        } catch (error) {
            console.error(`Could not load ${storageKey}.`, error);
        }

        return this.createNumberArray();
    }

    loadBoundaries() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(this.boundaryKey)
            );

            if (
                Array.isArray(saved) &&
                saved.length === this.columns + 1 &&
                saved.every(value => typeof value === "boolean")
            ) {
                return saved;
            }
        } catch (error) {
            console.error("Could not load boundaries.", error);
        }

        return this.createBoundaryArray();
    }

    loadFromMemory() {
        this.multipliers = this.loadNumberArray(this.multiplierKey);
        this.repeaters = this.loadNumberArray(this.repeaterKey);
        this.boundaries = this.loadBoundaries();
    }

    saveToMemory() {
        try {
            localStorage.setItem(
                this.multiplierKey,
                JSON.stringify(this.multipliers)
            );

            localStorage.setItem(
                this.repeaterKey,
                JSON.stringify(this.repeaters)
            );

            localStorage.setItem(
                this.boundaryKey,
                JSON.stringify(this.boundaries)
            );

            return true;
        } catch (error) {
            console.error("Could not save expanded matrix settings.", error);
            return false;
        }
    }

    // --------------------------------------------------------
    // MULTIPLIER METHODS
    // --------------------------------------------------------

    getMultiplier(column) {
        if (!this.isValidColumn(column)) {
            return 1;
        }

        return this.multipliers[column];
    }

    setMultiplier(column, value) {
        if (!this.isValidColumn(column)) {
            return false;
        }

        if (!Number.isInteger(value) || value < 1 || value > 99) {
            return false;
        }

        this.multipliers[column] = value;
        this.saveToMemory();

        return true;
    }

    // --------------------------------------------------------
    // REPEATER METHODS
    // --------------------------------------------------------

    getRepeater(column) {
        if (!this.isValidColumn(column)) {
            return 1;
        }

        return this.repeaters[column];
    }

    setRepeater(column, value) {
        if (!this.isValidColumn(column)) {
            return false;
        }

        if (!Number.isInteger(value) || value < 1 || value > 99) {
            return false;
        }

        this.repeaters[column] = value;
        this.saveToMemory();

        return true;
    }

    // --------------------------------------------------------
    // BOUNDARY METHODS
    // --------------------------------------------------------

    isValidBoundary(index) {
        return (
            Number.isInteger(index) &&
            index >= 0 &&
            index <= this.columns
        );
    }

    getBoundary(index) {
        if (!this.isValidBoundary(index)) {
            return false;
        }

        return this.boundaries[index];
    }

    toggleBoundary(index) {
        if (!this.isValidBoundary(index)) {
            return false;
        }

        this.boundaries[index] = !this.boundaries[index];
        this.saveToMemory();

        return this.boundaries[index];
    }

    // --------------------------------------------------------
    // GENERAL METHODS
    // --------------------------------------------------------

    isValidColumn(column) {
        return (
            Number.isInteger(column) &&
            column >= 0 &&
            column < this.columns
        );
    }

    // Returns copies of settings for reading.
    getMultiplierSnapshot() {
        return [...this.multipliers];
    }

    getRepeaterSnapshot() {
        return [...this.repeaters];
    }

    getBoundarySnapshot() {
        return [...this.boundaries];
    }

    // --------------------------------------------------------
    // EXPANSION
    // --------------------------------------------------------

    expand_to_line() {
        this.line = [];

        let builder = [];
        let groupStart = this.columns - 1;

        // Finalize a group and add its repetitions.
        const finalizeGroup = (groupEnd) => {

            if (builder.length === 0) return;

            // Find the largest repeater in this group.
            let repeater = 1;

            for (let i = groupStart; i >= groupEnd; i--) {
                repeater = Math.max(
                    repeater,
                    this.getRepeater(i)
                );
            }

            // Add the group directly to the flat line.
            for (let i = 0; i < repeater; i++) {
                this.line.push(...builder);
            }

            // Prepare for the next group.
            builder = [];
            groupStart = groupEnd - 1;
        };

        // Read the matrix from right to left.
        for (let column = this.columns - 1; column >= 0; column--) {

            // Find the selected letter.
            let selectedRow = null;

            for (let row = 0; row < this.matrix.rows; row++) {
                if (this.matrix.getCell(row, column) === 1) {
                    selectedRow = row;
                    break;
                }
            }

            // An empty column ends the expansion.
            if (selectedRow === null) {
                finalizeGroup(column + 1);
                break;
            }

            // Apply the multiplier to this column's letter.
            for (let m = this.getMultiplier(column); m > 0; m--) {
                builder.push(this.matrix.row_text(selectedRow));
            }

            // Check the boundary immediately to the left.
            if (this.getBoundary(column)) {
                finalizeGroup(column);
            }
        }

        // Finalize the last group if we reached the left edge.
        if (builder.length > 0) {
            finalizeGroup(0);
        }

        this.saveExpandedLine();

        return this.getLineSnapshot();
    }

    line_to_matrix() {
        const pairs = {
            A: [1, 2],
            B: [2, 3],
            C: [3, 4],
            D: [4, 1]
        };

        const result = [];

        let previousLetter = null;
        let occurrence = 0;

        // Process from left to right in storage,
        // which represents right to left in reading order.
        for (let i = 0; i < this.line.length; i++) {
            const letter = this.line[i];

            if (letter !== previousLetter) {
                previousLetter = letter;
                occurrence = 0;
            }

            const pair = pairs[letter];

            if (!pair) continue;

            result.push(pair[occurrence]);

            occurrence = 1 - occurrence;
        }

        // Restore the reader's left-to-right order.
        result.reverse();

        return result;
    }

    // --------------------------------------------------------
    // EXPANDED LINE STORAGE
    // --------------------------------------------------------

    saveExpandedLine() {
        try {
            localStorage.setItem(
                this.expandedKey,
                JSON.stringify(this.line)
            );

            return true;
        } catch (error) {
            console.error("Could not save expanded line.", error);
            return false;
        }
    }

    loadExpandedLine() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(this.expandedKey)
            );

            if (Array.isArray(saved)) {
                this.line = saved;
                return true;
            }
        } catch (error) {
            console.error("Could not load expanded line.", error);
        }

        this.line = [];
        return false;
    }

    getLineSnapshot() {
        return [...this.line];
    }

    // --------------------------------------------------------
    // CLEAR
    // --------------------------------------------------------

    clear() {
        this.multipliers = this.createNumberArray();
        this.repeaters = this.createNumberArray();
        this.boundaries = this.createBoundaryArray();

        this.line = [];

        this.saveToMemory();

        localStorage.removeItem(this.expandedKey);
    }
}


// ============================================================
// FRONTEND
// Responsible for reading user input and rendering the data.
// ============================================================



const ROWS = 4;
const COLS = 44;

const matrixElement = document.getElementById("matrix");
const clearButton = document.getElementById("clearButton");
const expandButton = document.getElementById("expandButton");
const exportWordButton = document.getElementById("exportWordButton");
const controlsElement = document.getElementById("controls");

// Create the two data objects.
const matrix = new Matrix(ROWS, COLS);
const expandedMatrix = new ExpandedMatrix(matrix, COLS);


// ============================================================
// NUMBER INPUTS
// ============================================================

function createNumberInput(label, column, type) {
    const input = document.createElement("input");

    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 2;
    input.autocomplete = "off";
    input.className = "control-input";

    const isRepeater = type === "repeater";

    const currentValue = isRepeater
        ? expandedMatrix.getRepeater(column)
        : expandedMatrix.getMultiplier(column);

    input.value = isRepeater && currentValue === 1
        ? ""
        : currentValue;

    input.setAttribute(
        "aria-label",
        `${label}, column ${column + 1}`
    );

    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 2);
    });

    input.addEventListener("change", () => {
        const text = input.value.trim();
        const value = Number(text);

        if (!/^\d{1,2}$/.test(text) || value < 1 || value > 99) {
            const oldValue = isRepeater
                ? expandedMatrix.getRepeater(column)
                : expandedMatrix.getMultiplier(column);

            input.value = isRepeater && oldValue === 1
                ? ""
                : oldValue;

            return;
        }

        if (isRepeater) {
            expandedMatrix.setRepeater(column, value);
        } else {
            expandedMatrix.setMultiplier(column, value);
        }

        if (isRepeater && value === 1) {
            input.value = "";
        }
    });

    return input;
}


// ============================================================
// BOUNDARY BUTTONS
// ============================================================

function createSeparator(index, isEnd = false) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "e-separator";

    if (isEnd) {
        button.classList.add("e-end-separator");
    }

    button.classList.toggle(
        "active",
        expandedMatrix.getBoundary(index)
    );

    button.setAttribute(
        "aria-label",
        `Toggle repeater boundary ${index}`
    );

    button.setAttribute(
        "aria-pressed",
        String(expandedMatrix.getBoundary(index))
    );

    button.addEventListener("click", () => {
        const active = expandedMatrix.toggleBoundary(index);

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    return button;
}


// ============================================================
// RENDER CONTROLS
// ============================================================

function renderControls() {
    controlsElement.innerHTML = "";

    // ----- E: Repeater row -----

    const repeaterLabel = document.createElement("div");
    repeaterLabel.className = "control-label";
    repeaterLabel.textContent = "E";

    controlsElement.appendChild(repeaterLabel);

    const repeaterRow = document.createElement("div");
    repeaterRow.className = "e-control-row";

    let lastCell;

    for (let col = 0; col < COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "e-control-cell";

        cell.appendChild(createSeparator(col));

        cell.appendChild(
            createNumberInput("Repeater", col, "repeater")
        );

        repeaterRow.appendChild(cell);
        lastCell = cell;
    }

    lastCell.appendChild(createSeparator(COLS, true));

    controlsElement.appendChild(repeaterRow);

    // ----- M: Multiplier row -----

    const multiplierLabel = document.createElement("div");
    multiplierLabel.className = "control-label";
    multiplierLabel.textContent = "M";

    controlsElement.appendChild(multiplierLabel);

    const multiplierRow = document.createElement("div");
    multiplierRow.className = "control-row";

    for (let col = 0; col < COLS; col++) {
        multiplierRow.appendChild(
            createNumberInput("Multiplier", col, "multiplier")
        );
    }

    controlsElement.appendChild(multiplierRow);
}


// ============================================================
// RENDER ORIGINAL MATRIX
// ============================================================

function renderMatrix() {
    matrixElement.innerHTML = "";

    const matrixData = matrix.getSnapshot();

    for (let row = 0; row < ROWS; row++) {
        const rowElement = document.createElement("div");
        rowElement.className = "matrix-row";

        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("button");

            cell.type = "button";
            cell.className = "cell";

            const value = matrixData[row][col];

            if (value === 1) {
                cell.classList.add("active");
                cell.textContent = matrix.row_text(row);
            }

            cell.setAttribute(
                "aria-label",
                `Row ${row + 1}, column ${col + 1}: ${value}`
            );

            cell.setAttribute(
                "aria-pressed",
                String(value === 1)
            );

            cell.addEventListener("click", () => {
                matrix.toggleCell(row, col);
                renderMatrix();
            });

            rowElement.appendChild(cell);
        }

        matrixElement.appendChild(rowElement);
    }
}

// ============================================================
// WORD EXPORT
// ============================================================
// Exports the expanded matrix as a Word-compatible .doc file.
//
// The expanded matrix is divided into 44-column segments.
// Because the matrix is read from right to left, the right-most
// segment is exported first.
//
// Four 44-column tables are placed on each Word page.
// ============================================================

function buildWordTable(numbers, startIndex) {
    const SEGMENT_SIZE = 32;

    let html = `
        <table
            style="
                border-collapse: collapse;
                margin: 0 0 10px 0;
                direction: ltr;
                table-layout: fixed;
            "
        >
            <tbody>
    `;

    // Four rows: D, C, B, A
    for (let row = 4; row >= 1; row--) {

        html += "<tr>";

        for (
            let column = startIndex;
            column < Math.min(startIndex + SEGMENT_SIZE, numbers.length);
            column++
        ) {
            const number = numbers[column];

            const value = number === row ? number : "";

            html += `
                <td
                    style="
                        border: 1px solid #000000;
                        width: 0.44cm;
                        height: 0.22cm;
                        padding: 0;
                        text-align: center;
                        vertical-align: middle;
                        font-family: Arial, sans-serif;
                        font-size: 8pt;
                        line-height: 1;
                    "
                >
                    ${value}
                </td>
            `;
        }

        html += "</tr>";
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function buildWordDocument(numbers) {

    const SEGMENT_SIZE = 32;
    const TABLES_PER_PAGE = 4;

    // --------------------------------------------------------
    // Create the 44-column segments from RIGHT to LEFT.
    //
    // Example: 60 columns
    //
    // RIGHT → LEFT:
    //
    // [44 columns] [16 columns]
    //
    // Example: 104 columns
    //
    // RIGHT → LEFT:
    //
    // [44] [44] [16]
    //
    // The smaller remainder is therefore always the LAST
    // segment on the left.
    // --------------------------------------------------------

    const segments = [];

    let remaining = numbers.length;

    while (remaining > 0) {

        const segmentSize = Math.min(
            SEGMENT_SIZE,
            remaining
        );

        const start = remaining - segmentSize;

        segments.push({
            start: start,
            end: remaining
        });

        remaining = start;
    }

    // At this point segments are already in the desired
    // RIGHT → LEFT order.
    //
    // For 60 columns:
    //
    // segments[0] = columns 16-59  (44 columns)
    // segments[1] = columns 0-15   (16 columns)
    //
    // Therefore DO NOT reverse this array.


    let body = "";

    // --------------------------------------------------------
    // Put four tables on each Word page.
    // --------------------------------------------------------

    for (let i = 0; i < segments.length; i += TABLES_PER_PAGE) {

        if (i > 0) {
            body += `
                <div style="page-break-before: always;"></div>
            `;
        }

        const pageSegments = segments.slice(
            i,
            i + TABLES_PER_PAGE
        );

        body += `
            <div
                style="
                    width: 100%;
                    margin: 0;
                    padding: 0;
                "
            >
        `;

        for (const segment of pageSegments) {

            body += buildWordTable(
                numbers,
                segment.start
            );
        }

        body += "</div>";
    }

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

@page {
    size: A4 landscape;
    margin: 1cm;
}

body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
}

table {
    border-collapse: collapse;
}

td {
    border: 1px solid #000000;
}

</style>

</head>

<body>

${body}

</body>
</html>
`;
}

function exportExpandedMatrixToWord() {

    // Make sure the expanded line exists.
    if (
        !expandedMatrix.line ||
        expandedMatrix.line.length === 0
    ) {
        alert("Please expand the matrix before exporting it.");
        return;
    }

    // Convert the expanded line into the same number
    // representation currently displayed on the website.
    const numbers = expandedMatrix.line_to_matrix();

    if (!numbers || numbers.length === 0) {
        alert("There is no expanded matrix to export.");
        return;
    }

    // Build the Word-compatible HTML document.
    const html = buildWordDocument(numbers);

    // Create a Blob containing the document.
    const blob = new Blob(
        [
            "\ufeff",
            html
        ],
        {
            type: "application/msword"
        }
    );

    // Create a temporary download URL.
    const url = URL.createObjectURL(blob);

    // Create a temporary download link.
    const link = document.createElement("a");

    link.href = url;

    const date = new Date();

    const timestamp =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0") +
        "_" +
        String(date.getHours()).padStart(2, "0") +
        "-" +
        String(date.getMinutes()).padStart(2, "0");

    link.download =
        `expanded-matrix-${timestamp}.doc`;

    document.body.appendChild(link);

    link.click();

    // Clean up.
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ============================================================
// BUTTON EVENTS
// ============================================================

// Clear everything.
clearButton.addEventListener("click", () => {
    matrix.clear();
    expandedMatrix.clear();

    renderControls();
    renderMatrix();
});


// Expand the matrix from right to left.
expandButton.addEventListener("click", () => {

    expandedMatrix.expand_to_line();

    const numbers = expandedMatrix.line_to_matrix();

    const container = document.getElementById("numberMatrix");

    container.innerHTML = "";

    numbers.forEach(number => {

        for (let row = 4; row >= 1; row--) {

            const cell = document.createElement("div");

            cell.className = "number-cell";

            if (number === row) {
                cell.textContent = number;
            }

            container.appendChild(cell);
        }

    });

});

// Export expanded matrix to Word.
if (exportWordButton) {
    exportWordButton.addEventListener(
        "click",
        exportExpandedMatrixToWord
    );
}

// ============================================================
// INITIAL RENDER
// ============================================================

renderControls();
renderMatrix();