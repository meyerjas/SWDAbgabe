import { Car } from "./car";
import promptstypes from "prompts";
import { database } from "./main";
import { Ride } from "./ride";
import { ObjectId } from "mongodb";
import { logman } from "./mainMethods";
import { rideMethod } from "./mainMethods";
import { CarMethods } from "./carMethods";



let prompts = require("prompts");
export let carMethod: CarMethods = new CarMethods();

export class CustomerMethods {

    public async chooseCar(): Promise<Car | null> {

        let choices = [];
        let all: Car[] = await database.getAllCars();
        //create array with all(first 10 in db) cars in it
        for (let i: number = 0; i < 10 && i < all.length; i++) {
            choices[i] = { title: all[i].name, value: i };
        }

        let response = await prompts({
            type: "select",
            name: "answer",
            message: "",
            choices: choices
        });
        let answer: number = response.answer;
        //returns id of chosen car 
        let _id = all[answer]._id;

        let chosenCar: Car | null = await database.getCar(_id!);

        return chosenCar;
    }
    //this method returns desired Date of ride
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
    //this method returns desired duration of ride
    public async durationNeed(): Promise<number> {

        let response = await prompts({
            type: "number",
            name: "value",
            message: "Wie lange brauchst du das Auto?",
        });

        let duration: number = response.value; // in minutes
        return duration;
    }

    private checkIfCarAvailable(ridesOfCar: Ride[], chosenDate: Date, duration: number): boolean {
        for (let i: number = 0; i < ridesOfCar.length; i++) {
            let ride: Ride = ridesOfCar[i];

            //compare wanted date & time with already booked rides for the chosen car
            if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                return false;
            }
            //compare if chosenDate isn't completels within a booked ride
            if (ride.date < chosenDate && new Date(ride.date.getTime() + ride.duration * 60000) > new Date(chosenDate.getTime() + duration * 60000)) {
                return false;
            }
        }
        return true;
    }

    public async getRidesAndBook(_id: ObjectId, chosenDate: Date, duration: number): Promise<boolean> {

        let ridesOfCar: Ride[] | null = await database.getRides(_id);

        while (true) {
            //if there already are rides for the car...
            if (ridesOfCar != null) {
                let carAvailable: boolean = this.checkIfCarAvailable(ridesOfCar, chosenDate, duration);
                if (!carAvailable) {
                    console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                    return false;
                }

                //compare if wanted duration is too long (exceeds cars max duration)
                console.log("maxUse compare");
                let car: Car | null = await database.getCar(_id);
                if (car) {
                    let maxUseDur: number = car.maxUseDuration;

                    if (duration > maxUseDur) {
                        console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                        return false;
                    }

                    let okay: boolean = await carMethod.useTimeOk(car, chosenDate);
                    if (okay == true) {
                        let price: number = await rideMethod.calculateCostForRide(duration, car);
                        let logRegResponse: number = await this.askForLoginOrReg();
                        //login
                        if (logRegResponse == 0) {
                            let username: string = await logman.logIn(false)
                            await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                            console.log("Fahrt erfolgreich gebucht.");
                            return true;
                            //register
                        } else if (logRegResponse == 1) {
                            let username: string | null = await logman.register();
                            if (username) {
                                await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                                console.log("Fahrt erfolgreich gebucht.");
                                return true;
                            }
                            return false;
                        } else if (logRegResponse == 2) {
                            return false;
                        }
                    } else if (okay == false) {
                        return false;
                    }
                }



                //if there are no rides booked yet for the car
            } else {
                let car: Car | null = await database.getCar(_id);
                if (car) {
                    let maxUseDur: number = car.maxUseDuration;

                    if (duration > maxUseDur) {
                        console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                        return false;
                    }
                    let okay: boolean = await carMethod.useTimeOk(car, chosenDate);
                    if (okay == true) {
                        let logRegResponse: number = await this.askForLoginOrReg();
                        //login
                        if (logRegResponse == 0) {
                            let username: string = await logman.logIn(false)
                            let price: number = await rideMethod.calculateCostForRide(duration, car);
                            await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                            console.log("Fahrt erfolgreich gebucht.");
                            return true;
                            //register
                        } else if (logRegResponse == 1) {
                            let username: string | null = await logman.register();
                            if (username) {
                                let price: number = await rideMethod.calculateCostForRide(duration, car);
                                await this.bookRide(chosenDate, duration, username, _id, price, maxUseDur);
                                console.log("Fahrt erfolgreich gebucht.");
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
        }
    }


    public async bookRide(chosenDate: Date, duration: number, username: string, carID: ObjectId, price: number, maxUseDuration: number): Promise<void> {
        let ride: Ride = new Ride(chosenDate, duration, username, carID, price, maxUseDuration);
        await database.addRideToDB(ride);
    }

    public async askForLoginOrReg(): Promise<number> {

        let prompt: promptstypes.Answers<string> = await prompts.prompt({
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
                    if (lateUT[0] > desiredUT.getHours() - 1 || (lateUT[0] == desiredUT.getHours() - 1 && lateUT[1] >= (desiredUT.getMinutes() + duration))) {
                        let ridesOfCar: Ride[] | null = await database.getRides(cars[i]._id);
                        if (ridesOfCar) {
                            let carAvailable: boolean = this.checkIfCarAvailable(ridesOfCar, desiredUT, duration);
                            if (carAvailable)
                                availableCars.push(cars[i]);
                            else
                                console.log("Not available: " + cars[i].name);
                        } else {
                            availableCars.push(cars[i]);
                        }
                    }
                }
            }

        }
        //Show all available cars
        let choices = [];
        for (let i: number = 0; i < 10 && i < availableCars.length; i++) {
            choices[i] = { title: availableCars[i].name, value: i };
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