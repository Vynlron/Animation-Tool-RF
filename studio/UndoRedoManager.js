// js/UndoRedoManager.js

export class UndoRedoManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
    }

    saveState(state) {
        // Clear any "redo" history that exists after the current state
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add the new state as a deep copy
        this.history.push(JSON.parse(JSON.stringify(state)));
        this.currentIndex++;

        // Optional: Limit the history size to prevent memory issues
        if (this.history.length > 50) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}