import { Car } from "./car";
import promptstypes from "prompts";
import { database } from "./main";

let prompts = require("prompts");

export class AdminMethods {

    public async addCarInput(): Promise<void> {

        let fuelType: string = "";

        let response = await prompts({
            type: "text",
            name: "value",
            message: "Autobezeichnung: ",
        });
        let carName = response.value;

        //multiple choice for fuelType
        let prompt: promptstypes.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Welche Antriebsart hat das Auto?",
            choices: [
                { title: "Konventioneller Antrieb", value: 0 },
                { title: "Elektronisch", value: 1 },
            ]
        })
        //conventional
        if (prompt.answer == 0) {
            fuelType = "conventional"
        }

        //electric 
        else if (prompt.answer == 1) {
            fuelType = "electric"
            carName = carName + " (E)"
        }
        console.log(carName);
        //earliest UseTime
        response = await prompts({
            type: "list",
            name: "value",
            message: "Früheste Nutzungsuhrzeit, z.B. 07:45 : ",
            initial: '',
            separator: ":"
        });
        let earliestUseTimeStringArray: string[] = response.value;

        let eTHour: number = parseInt(earliestUseTimeStringArray[0]);
        let eTMin: number = parseInt(earliestUseTimeStringArray[1]);
        let eUT: number[] = [eTHour, eTMin];

        //latest UT
        response = await prompts({
            type: "list",
            name: "value",
            message: "Späteste Nutzungsuhrzeit, z.B. 20:30 : ",
            initial: '',
            separator: ":"
        });
        let latestUseTimeStringArray: string[] = response.value;

        let lTHour: number = parseInt(latestUseTimeStringArray[0]);
        let lTMin: number = parseInt(latestUseTimeStringArray[1]);
        let lUT: number[] = [lTHour, lTMin];

        //max Use Duration
        response = await prompts({
            type: "number",
            name: "value",
            message: "Maximale Nutzungsdauer in Minuten: ",
        });
        let maxUseDuration: number = response.value;

        //flatRate Price
        response = await prompts({
            type: "number",
            name: "value",
            message: "Pauschaler Nutzungspreis(Angabe in Euro, nur ganze Zahlen möglich.): ",
        });
        let flatRatePrice: number = response.value;

        //price per minute
        response = await prompts({
            type: "list",
            name: "value",
            message: "Preis pro Minute(Angabe in Euro, z.B. 0,5): ",
            initial: '',
            separator: ","
        });
        let ppmStringArray: string[] = response.value;

        let ppmEuro: number = parseInt(ppmStringArray[0]);
        let ppMCent: number = parseInt(ppmStringArray[1]);
        let ppM: number = ppmEuro + ppMCent / 10;

        console.log(ppM);

        //create new Car object and add it to the DB
        let newCar: Car = new Car(carName, fuelType, eUT, lUT, maxUseDuration, flatRatePrice, ppM);
        await database.addCarToDB(newCar);
        console.log("Auto erfolgreich hinzugefügt!");
    }


}