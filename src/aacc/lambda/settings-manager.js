// Handles settings within this file and in AWS

// import settings from "./settings.json" assert { type: "json" };
import fs from "fs";
let settings;

// Get the settings object from the settings JSON
export function getSettings() {
    if(!settings) {
        const jsonString = fs.readFileSync("./settings.json");
        settings = JSON.parse(jsonString);
    }
    return settings;
}