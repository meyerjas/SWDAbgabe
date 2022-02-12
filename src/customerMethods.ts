import { Car } from "./car";
import prompts from "prompts";
import { database } from "./main";
import { Ride } from "./ride";
import { ObjectId } from "mongodb";
import { logman } from "./methods";
import { rideMethod } from "./methods";

let prompts = require("prompts");

export class CustomerMethods {

    public async chooseCar(): Promise<Car> {

        let choices = [];
        let all: Car[] = await database.getAllCars();

        for (let i: number = 0; i < 10 && i < all.length; i++) {
            choices[i] = { title: all[i].name, value: i };
        }
        //choose car
        let response = await prompts({
            type: "select",
            name: "answer",
            message: "",
            choices: choices
        });
        let answer: number = response.answer;
        //returns id of chosen car 
        let _id = all[answer]._id;

        let chosenCar: Car = await database.getCar(_id);

        return chosenCar;
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

    public async getRidesAndBook(_id: ObjectId, chosenDate: Date, duration: number): Promise<void> {

        let ridesOfCar: Ride[] | null = await database.getRides(_id);
        //if there already are rides for the car...
        if (ridesOfCar != null) {
            for (let i: number = 0; i < ridesOfCar.length; i++) {
                let ride: Ride = ridesOfCar[i];
                //compare wanted date & time with already booked rides for the chosen car
                if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                    console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                    await this.chooseCar();
                } else {
                    //compare if wanted duration is too long (exceeds cars max duration)
                    let car: Car = await database.getCar(_id);
                    let maxUseDur: number = car.maxUseDuration;

                    if (duration > maxUseDur) {
                        console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                    }

                    let okay: boolean = await this.UseTimeOk(car, chosenDate, duration);
                    if (okay == true) {
                        let logRegResponse: number = await this.askForLoginOrReg();
                        //login
                        if (logRegResponse == 0) {
                            let username: string = await logman.logIn(false)
                            let price: number = await rideMethod.calculateCostForRide(duration, car);
                            await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                            console.log("Fahrt erfolgreich gebucht.");
                            //register
                        } else if (logRegResponse == 1) {
                            let username: string = await logman.register();
                            let price: number = await rideMethod.calculateCostForRide(duration, car);
                            await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                        }
                    } else {
                        break;//Frag ob das dann das Programm beendet? Oder was passiert dann.
                    }
                }

            }
            //if there are no rides booked yet for the car
        } else {
            let car: Car = await database.getCar(_id);
            let maxUseDur: number = car.maxUseDuration;

            if (duration > maxUseDur) {
                console.log("Du kannst dieses Auto nicht so lange ausleihen!");
            }
            let okay: boolean = await this.UseTimeOk(car, chosenDate, duration);
            if (okay == true) {
                let logRegResponse: number = await this.askForLoginOrReg();
                //login
                if (logRegResponse == 0) {
                    let username: string = await logman.logIn(false)
                    let price: number = await rideMethod.calculateCostForRide(duration, car);
                    await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                    console.log("Fahrt erfolgreich gebucht.");
                    //register
                } else if (logRegResponse == 1) {
                    let username: string = await logman.register();
                    let price: number = await rideMethod.calculateCostForRide(duration, car);
                    await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                }
            }
        }
    }

    public async UseTimeOk(car: Car, chosenDate: Date, duration: number): Promise<boolean> {
        let earlyUT: number[] = car.earliestUseTime;
        let lateUT: number[] = car.latestUseTime;
        let desiredUT: Date = chosenDate;

        //Hour too early to use car
        if (earlyUT[0] > desiredUT.getHours()) {
            console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.")
            return false;
            //Hour okay, but Minute too early
        } else if (earlyUT[0] == desiredUT.getHours() && earlyUT[1] > desiredUT.getMinutes()) {
            console.log("Du kannst dieses Auto leider nicht so früh nutzen.")
            return false;
            //Hour too late to use car
        } else if (lateUT[0] < desiredUT.getHours()) {
            console.log("Du kannst dieses Auto leider nicht zu solch später Stunde nutzen.")
            return false;
            //Hour okay, but Minute too late
        } else if (lateUT[0] == desiredUT.getHours() && lateUT[1] < desiredUT.getMinutes()) {
            console.log("Du kannst dieses Auto leider nicht so spät nutzen.")
            return false;
        } else
            console.log("Super, sieht so aus als wäre das Auto frei!");
        return true;
    }

    public async bookRide(chosenDate: Date, duration: number, username: string, carID: ObjectId, price: number, maxUseDuration: number): Promise<void> {
        let ride: Ride = new Ride(chosenDate, duration, username, carID, price, maxUseDuration);
        await database.addRideToDB(ride);
    }

    public async askForLoginOrReg(): Promise<number> {

        let prompt: prompts.Answers<string> = await prompts.prompt({
            type: "select",
            name: "answer",
            message: "Um zu buchen, melde dich bitte an oder erstelle einen neuen Account.",
            choices: [
                { title: "Ich habe bereits einen Account.", value: 0 },
                { title: "Erstelle einen neuen Account.", value: 1 },
                { title: "Ich möchte ein anderes Auto wählen.", value: 2 }
            ]
        })
        return prompt.answer;
    }

    public async chooseElectricCar(): Promise<Car> {
        let electric: Car[] = await database.getAllElectricCars();
        let choices = [];

        for (let i: number = 0; i < 10 && i < electric.length; i++) {
            choices[i] = { title: electric[i].name, value: i };
        }

        let response = await prompts({
            type: "select",
            name: "answer",
            message: "",
            choices: choices
        });

        let answer: number = response.answer;
        //returns id of chosen car 
        let _id = electric[answer]._id;

        let chosenCar: Car = await database.getCar(_id);

        return chosenCar;
    }

    public async chooseConventionalCar(): Promise<Car> {
        let conventional: Car[] = await database.getAllConventionalCars();
        let choices = [];

        for (let i: number = 0; i < 10 && i < conventional.length; i++) {
            choices[i] = { title: conventional[i].name, value: i };
        }

        let response = await prompts({
            type: "select",
            name: "answer",
            message: "",
            choices: choices
        });

        let answer: number = response.answer;
        //returns id of chosen car 
        let _id = conventional[answer]._id;

        let chosenCar: Car = await database.getCar(_id);

        return chosenCar;
    }

    public async chooseAvailableCar(chosenDate: Date, duration: number): Promise<Car> {

        let cars: Car[] = await database.getAllCars();
        let desiredUT: Date = chosenDate;
        let availableCars: Car[] = [];

        for (let i: number = 0; i < cars.length; i++) {
            let earlyUT: number[] = cars[i].earliestUseTime;
            let lateUT: number[] = cars[i].latestUseTime;

            if (cars[i].maxUseDuration >= duration) {
                if (desiredUT.getHours() - 1 >= earlyUT[0] || (earlyUT[0] == desiredUT.getHours() - 1 && earlyUT[1] <= desiredUT.getMinutes())) {
                    if (lateUT[0] >= desiredUT.getHours() - 1 || (lateUT[0] == desiredUT.getHours() - 1 && lateUT[1] >= (desiredUT.getMinutes() + duration))) {
                        availableCars.push(cars[i]);
                    }
                }
            }

        }
        //Show all available cars
        let choices = [];
        for (let i: number = 0; i < 10 && i < availableCars.length; i++) {
            choices[i] = { title: availableCars[i].name, value: availableCars[i]._id };
        }
        //choose car
        let response = await prompts({
            type: "select",
            name: "answer",
            message: "",
            choices: choices
        });
        let answer: number = response.answer;

        //returns id of chosen car 
        let _id = availableCars[answer]._id;

        let chosenCar: Car = await database.getCar(_id);

        return chosenCar;
    }

}