import promptstypes from "prompts";
import { Ride } from "./ride";
import { database } from "./main";
import { Car } from "./car";
import { CustomerMethods } from "./customerMethods";
import { LogInManager } from "./logInManager";
import { AdminMethods } from "./adminMethods";
import { RideMethods } from "./rideMethods";


let prompts = require("prompts");
export let logman: LogInManager = new LogInManager();
export let customerMethod: CustomerMethods = new CustomerMethods();
export let admin: AdminMethods = new AdminMethods();
export let rideMethod: RideMethods = new RideMethods();


export class Methods {


    public async mainMenu(): Promise<void> {

        let response: promptstypes.Answers<string> = await prompts({
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

        let answer: number = response.answer;

            //show all(first 10) cars
            if (answer == 0) {
                await this.createRide();
            }
            //filter by fuelType
            else if (answer == 1) {
                await this.fuelTypeRide();
            }
            //filter by availability
            else if (answer == 2) {
                await this.availabilityRide();
            }
            //show rides of the customer, spent money
            else if (answer == 3) {
                await this.viewHistoryAndRides();
            }
            //admin login too add car
            else if (answer == 4) {
                await this.adminLogIn();
            }
            else if (answer == 5) {
                console.log("Bis zum nächsten Mal!");
                await database.disconnect();
            }
        
    }

    public async createRide(): Promise<void> {
        
        let chosenCar: Car = await customerMethod.chooseCar();
        let dateTime: Date = await customerMethod.dateTimeNeed();
        let duration: number = await customerMethod.durationNeed();

        let success: boolean = await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
        if (success == true) {
            await this.mainMenu();
        } else {
            console.log("Bitte wähle ein anderes Auto.");
            await this.mainMenu();
        }
    }



    public async fuelTypeRide(): Promise<void> {

        let prompt: promptstypes.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Wähle eine Antriebsart aus.",
            choices: [
                { title: "Zeig mir elektronische Autos.", value: 0 },
                { title: "Zeig mir Autos mit konventionellem Antrieb.", value: 1 },
            ]
        });

        if (prompt.answer == 0) {
            let chosenCar: Car = await customerMethod.chooseElectricCar();
            let dateTime: Date = await customerMethod.dateTimeNeed();
            let duration: number = await customerMethod.durationNeed();

            let success: boolean = await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
            if (success == true) {
                await this.mainMenu();
            } else {
                console.log("Bitte wähle ein anderes Auto.");
                await this.mainMenu();
            }
        }

        if (prompt.answer == 1) {
            let chosenCar: Car = await customerMethod.chooseConventionalCar();
            let dateTime: Date = await customerMethod.dateTimeNeed();
            let duration: number = await customerMethod.durationNeed();

            let success: boolean = await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
            if (success == true) {
                await this.mainMenu();
            } else {
                console.log("Bitte wähle ein anderes Auto.");
                await this.mainMenu();
            }
        }

    }

    public async availabilityRide(): Promise<void> {
        let dateTime: Date = await customerMethod.dateTimeNeed();
        let duration: number = await customerMethod.durationNeed();
        console.log("Diese Autos sind verfügbar:");
        let chosenCar: Car = await customerMethod.chooseAvailableCar(dateTime, duration);

        let price: number = await rideMethod.calculateCostForRide(duration, chosenCar);

        let logRegResponse: number = await customerMethod.askForLoginOrReg();
        //login
        if (logRegResponse == 0) {
            let username: string = await logman.logIn(false);
            await customerMethod.bookRide(dateTime, duration, username, chosenCar._id, price, chosenCar.maxUseDuration);
            console.log("Fahrt erfolgreich gebucht.");
            //register
        } else if (logRegResponse == 1) {
            let username: string = await logman.register();
            await customerMethod.bookRide(dateTime, duration, username, chosenCar._id, price, chosenCar.maxUseDuration);
        }
    }

    public async viewHistoryAndRides(): Promise<void> {
        //login
        let username: string = await logman.logIn(false);

        let prompt: promptstypes.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Was möchtest du tun?",
            choices: [
                { title: "Zeig mir alle meine Fahrten.", value: 0 },
                { title: "Wie viel Geld habe ich bisher ausgegeben?", value: 1 },
                { title: "Zurück zum Hauptmenü", value: 2 }
            ]
        })
        //show all rides
        let rides: Ride[] = await database.getCustomerRides(username);
        if (prompt.answer == 0) {
            console.log(rides);
            await this.viewHistoryAndRides();
        }
        //show money spent (sum and average)
        else if (prompt.answer == 1) {
            //calculate sum
            let sum: number = 0;
            for (let i: number = 0; i < rides.length; i++) {
                sum += rides[i].price;
            }
            //calculate average
            let average: number = sum / rides.length;
            console.log("Du hast bisher insgesamt " + sum + " Euro ausgegeben.");
            console.log("Durchschnittlich zahlst du pro Fahrt " + average + " Euro");

        } else if (prompt.answer == 2) {
            console.log("Bis zum nächsten Mal!");
            await this.mainMenu();
        }
    }

    public async adminLogIn(): Promise<void> {
        await logman.logIn(true);

        let prompt: promptstypes.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Was möchtest du tun?",
            choices: [
                { title: "Ich möchte ein neues Auto hinzufügen.", value: 0 },
                { title: "Zurück zum Hauptmenü", value: 1 },
            ]
        })
        //add car
        if (prompt.answer == 0) {
            await admin.addCarInput();
        }
        else if (prompt.answer == 1) {
            await this.mainMenu();
        }
    }
}
