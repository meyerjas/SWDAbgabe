import prompts from "prompts";

export class Methods {

    public async mainMenu(): Promise<number> {

        let prompts = require("prompts");
        let response: prompts.Answers<string> = await prompts({
            type: "select",
            name: "answer",
            message: "Was willst du machen?",
            choices: [
                { title: "Zeig mir eine Auswahl von Autos, aus denen ich wählen kann.", value: 0 },
                { title: "Ich will Autos mit einer bestimmten Antriebsart sehen.", value: 1 },
                { title: "Ich will nach Verfügbarkeit filtern.", value: 2 },
                { title: "Ich will mich anmelden, um meine Fahrten einzusehen.", value: 3 },
                { title: "Ich bin ein Admin und möchte ein neues Auto hinzufügen.", value: 4 },
                { title: "App beenden", value: 5 }
            ]
        });

        return response.answer;
    }

    public async dateTimeNeed(): Promise<Date> {

        let response = await prompts({
            type: "date",
            name: "value",
            message: "Wann brauchst du das Auto?",
        });

        let chosenDate: Date = response.value;
        chosenDate.setMinutes(chosenDate.getMinutes() + 60);

        return chosenDate;
    }

    public async durationNeed(): Promise<number> {
        let response = await prompts({
            type: "number",
            name: "value",
            message: "Wie lange brauchst du das Auto?",
        });

        let duration: number = response.value; // in minutes
        return duration;
    }

    
}