"use strict";

/** Class that handles initiative tracking */
class Tracker {
    /**
     * Create a tracker
     * @param {array}  characters The characters in the tracker
     * @param {number} turn       The character position whose turn it is
     * @param {number} round      The current round
     */
    constructor(dataPath = "tracker.json") {
        const low = require('lowdb');
        const FileSync = require('lowdb/adapters/FileSync');

        const adapter = new FileSync(dataPath);
        this.db = low(adapter);

        this.db.defaults({
            round: 0,
            turn: 0,
            characters: []
        }).write();
    }

    /**
     * Get the amount of characters in the tracker
     * @return {string} The amount of character in the tracker
     */
    get allCharacters() {
        return this.db.get("characters").value();
    }

    /**
     * Get the amount of characters in the tracker
     * @return {string} The amount of character in the tracker
     */
    get characterCount() {
        return this.db.get("characters").size().value();
    }

    /**
     * Get the current round
     * @return {string} The current round
     */
    get round() {
        return this.db.get("round").value();
    }

    /**
     * Get the current turn
     * @return {string} The current turn
     */
    get turn() {
        return this.db.get("turn").value();
    }

    /**
     * Get the amount of characters in the tracker
     * @return {string} The amount of character in the tracker
     */
    get progress() {
        return `${this.db.get("round").value() + 1}/${this.characterCount}`;
    }

    /**
     * Get the current character whose turn it is
     * @return {string} The current character whose turn it is
     */
    get currentCharacter() {
        return this.db.get(`characters[${this.turn}]`).value();
    }

    /**
     * Set the turn index
     * @param {integer} index The target index
     */
    set turnIndex(index) {
        this.db.set('turn', index).write();
    }

    /**
     * Set the round index
     * @param {integer} index The target index
     */
    set roundIndex(index) {
        this.db.set('round', index).write();
    }

    /**
     * Get the target character
     * @param {string} name The name of the target character
     * 
     * @return {string} The target character
     */
    getCharacterOwnerID(targetName) {
        if (!this.characterExists(targetName)) throw "Character does not exist!";

        return this.db.get("characters").find({ name: targetName }).value().userID;
    }

    /**
     * Get the target character's index
     * @param {string} name The name of the target character
     * 
     * @return {string} The target character's index
     */
    getCharacterIndex(name) {
        if (!this.characterExists(name)) throw "Character does not exist!";
        return this.db.get('characters').findIndex({ name: name }).value();
    }

    /** 
     * Adds a character to the tracker
     * @param {string} userID The ID of the user responsible for controlling the character
     * @param {string} name        The name of the character to be added
     * @param {string} initiative  The character's initiative roll
     * @param {string} dexterity   The character's dexterity score
     */
    addCharacter(userID, name, initiative, dexterity) {
        if (this.characterExists(name)) throw "Character already exists!";

        this.db.get('characters').push({ userID: userID, name: name, initiative: initiative, dexterity: dexterity }).write()
    }

    /** 
     * Edits a character in the tracker
     * @param {string} name        The name of the character to be added
     * @param {string} initiative  The character's initiative roll
     * @param {string} dexterity   The character's dexterity score
     */
    editCharacter(name, newname, initiative, dexterity) {
        if (!this.characterExists(name)) throw "Character does not exist!";

        this.db.get('characters').find({ name: name }).assign({ name: newname, initiative: initiative, dexterity: dexterity }).write();
    }

    /** 
     * Removes a character from the tracker
     * @param {string} name The name of the character to be removed
     */
    removeCharacter(name) {
        if (!this.characterExists(name)) throw "Character does not exist!";

        let foundIndex = this.getCharacterIndex(name);

        if (foundIndex < this.db.get('turn').value()) {
            this.db.get('characters').remove({ name: name }).write();
            this.db.update('turn', turn => turn - 1).write();
        }
        else if (foundIndex === this.db.get('turn').value()) {
            if (foundIndex === this.db.get('characters').size().value() - 1) {
                this.db.update('round', round => round + 1).write();
                this.db.update('turn', turn => 0).write();
            }
            this.db.get('characters').remove({ name: name }).write();
        }
        else this.db.get('characters').remove({ name: name }).write();
    }

    /** 
     * Checks if a user already has a character
     * @param {string} userID The user's ID
     */
    userHasCharacter(userID) {
        return !!this.db.get("characters").find({ userID: userID }).value();
    }

    /** Lists characters to console (Debug only) */
    listCharacters() {
        for (let character of this.db.get("characters").value()) {
            console.log(character.name)
        }
    }

    /** Progresses to the next turn */
    nextTurn() {
        if (this.db.get('turn').value() < this.characterCount - 1) this.db.update('turn', turn => turn + 1).write();
        else {
            this.db.update('turn', turn => 0).write();
            this.db.update('round', round => round + 1).write();
            this.sortTracker();
        }
    }

    /** Starts Combat */
    startCombat() {
        this.db.update('round', round => 1).write();
        this.db.update('turn', turn => 0).write();
    }

    /** Sorts the current turn order by rolled initiative and then the dexterity score of the characters */
    sortTracker() {
        this.db.update('characters', character => this.db.get("characters").orderBy(this.db.get("characters").value(), ['initiative', 'dexterity'], ['desc', 'desc']).value()).write();
    }

    /** Resets the tracker */
    reset(wipe = true) {
        if (wipe) this.db.update('characters', character => []).write();
        this.db.update('round', round => 0).write();
        this.db.update('turn', turn => 0).write();
    }

    characterExists(name) {
        return !!this.db.get("characters").find({ name: name }).value();
    }
}

module.exports.Tracker = Tracker;