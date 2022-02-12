import prompts from "prompts";
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


    public async mainMenu(): Promise<number> {

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

    public async createRide(): Promise<void> {
        //choose car
        let chosenCar: Car = await customerMethod.chooseCar();
        //prompts to see when customer needs the car
        let dateTime: Date = await customerMethod.dateTimeNeed();
        //prompts to see how long the customer needs the car
        let duration: number = await customerMethod.durationNeed();

        await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
    }



    public async fuelTypeRide(): Promise<void> {

        let prompt: prompts.Answers<string> = await prompts.prompt({
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
            //prompts to see when customer needs the car
            let dateTime: Date = await customerMethod.dateTimeNeed();
            //prompts to see how long the customer needs the car
            let duration: number = await customerMethod.durationNeed();

            await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
        }

        if (prompt.answer == 1) {
            let chosenCar: Car = await customerMethod.chooseConventionalCar();
            //prompts to see when customer needs the car
            let dateTime: Date = await customerMethod.dateTimeNeed();
            //prompts to see how long the customer needs the car
            let duration: number = await customerMethod.durationNeed();

            await customerMethod.getRidesAndBook(chosenCar._id, dateTime, duration);
        }

    }

    public async availabilityRide(): Promise<void> {
        let dateTime: Date = await customerMethod.dateTimeNeed();
        let duration: number = await customerMethod.durationNeed();
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

        let prompt: prompts.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Was möchtest du tun?",
            choices: [
                { title: "Zeig mir alle meine Fahrten.", value: 0 },
                { title: "Wie viel Geld habe ich bisher ausgegeben?", value: 1 },
            ]
        })
        //show all rides
        let rides: Ride[] = await database.getCustomerRides(username);
        if (prompt.answer == 0) {
            console.log(rides);
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
        }
    }

    public async adminLogIn(): Promise<void> {
        await logman.logIn(true);

        let prompt: prompts.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Was möchtest du tun?",
            choices: [
                { title: "Ich möchte ein neues Auto hinzufügen.", value: 0 },
                { title: "App verlassen.", value: 1 },
            ]
        })
        //add car
        if (prompt.answer == 0) {
            await admin.addCarInput();
        }
        else if (prompt.answer == 1) {
            
        }
    }
}
