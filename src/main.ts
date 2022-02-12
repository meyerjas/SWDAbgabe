import { Car } from "./car";
import { Database } from "./database";
import prompts from "prompts";
import { Ride } from "./ride";
import { Customer } from "./customer";
import { LogInManager } from "./logInManager";
import { ObjectId } from "mongodb";

export let database: Database = new Database();
export let logman: LogInManager = new LogInManager();

export class Main {

    public chosenValue: { answer: number };

    public async main(): Promise<void> {

        console.log("Willkommen bei der Car Sharing App!");

        await database.connect();

        let all: Car[] = await database.getAllCars();
        let life: boolean = true;
        let prompts = require("prompts");

        while (life) {

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

            //show selection of cars
            if (response.answer == 0) {

                //Show all cars
                if (all) {
                    let choices = [];
                    for (let i: number = 0; i < 10 && i < all.length; i++) {
                        choices[i] = { title: all[i].name, value: i };
                    }
                    //choose car
                    this.chosenValue = await prompts({
                        type: "select",
                        name: "answer",
                        message: "",
                        choices: choices
                    });
                }

                //when do you need the car, date & time
                response = await prompts({
                    type: "date",
                    name: "value",
                    message: "Wann brauchst du das Auto?",
                });

                let chosenDate: Date = response.value;
                chosenDate.setMinutes(chosenDate.getMinutes() + 60);

                //what duration do you need it for?
                response = await prompts({
                    type: "number",
                    name: "value",
                    message: "Wie lange brauchst du das Auto?",
                });

                let duration: number = response.value; // in minutes

                //get all rides from the chosen car
                let availability: Ride[] | null = await database.getRides(all[this.chosenValue.answer]._id);
                if (availability != null) {
                    for (let i: number = 0; i < availability.length; i++) {
                        let ride: Ride = availability[i];
                        //compare wanted date & time with already booked rides for the chosen car
                        if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                            console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                        } else {
                            //compare if wanted duration is too long (exceeds cars max duration)
                            let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                            let maxUseDur: number = car.maxUseDuration;

                            if (duration > maxUseDur) {
                                console.log("Du kannst dieses Auto nicht so lange ausleihen!")
                                life = false;
                            }

                            let earlyUT: number[] = car.earliestUseTime;
                            let lateUT: number[] = car.latestUseTime;
                            let desiredUT: Date = chosenDate;

                            //Hour too early to use car
                            if (earlyUT[0] > desiredUT.getHours()) {
                                console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.")
                                life = false;
                                //Hour okay, but Minute too early
                            } else if (earlyUT[0] == desiredUT.getHours() && earlyUT[1] > desiredUT.getMinutes()) {
                                console.log("Du kannst dieses Auto leider nicht so früh nutzen.")
                                life = false;
                                //Hour too late to use car
                            } else if (lateUT[0] < desiredUT.getHours()) {
                                console.log("Du kannst dieses Auto leider nicht zu solch später Stunde nutzen.")
                                life = false;
                                //Hour okay, but Minute too late
                            } else if (lateUT[0] == desiredUT.getHours() && lateUT[1] < desiredUT.getMinutes()) {
                                console.log("Du kannst dieses Auto leider nicht so spät nutzen.")
                                life = false;
                            } else
                                console.log("Super, sieht so aus als wäre das Auto frei!");



                            //calculate the cost for the ride
                            let ppMcalc = duration * car.pricePerMinute;
                            let costRide = ppMcalc + car.flatRatePrice;
                            console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                            //ask if customer wants to register or login
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
                            //LogIn
                            if (prompt.answer == 0) {

                                let proceed: boolean = false;

                                let userName: string;
                                while (!proceed) {

                                    response = await prompts({
                                        type: "text",
                                        name: "value",
                                        message: "Nutzername:",
                                    });
                                    userName = response.value;

                                    response = await prompts({
                                        type: "text",
                                        name: "value",
                                        message: "Kennwort: ",
                                    });
                                    let password: string = response.value;

                                    let customer: Customer = await database.login(userName, password);
                                    if (customer != null) {
                                        console.log("LogIn erfolgreich.");
                                        proceed = true;
                                    } else {
                                        console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                                    }
                                }

                                let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                await database.addRideToDB(bookRide);


                                //register
                            } else if (prompt.answer == 1) {

                                let proceed: boolean = false;

                                while (!proceed) {
                                    response = await prompts({
                                        type: "text",
                                        name: "value",
                                        message: "Neuer Nutzername:",
                                    });
                                    let userName: string = response.value;

                                    response = await prompts({
                                        type: "text",
                                        name: "value",
                                        message: "Neues Kennwort: ",
                                    });
                                    let password: string = response.value;

                                    let customer: Customer = await database.register(userName, password);
                                    if (customer != null) {
                                        console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                        proceed = true;

                                        let user: Customer = await database.findUserByUsername(userName);

                                        let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                        await database.addRideToDB(bookRide);

                                    } else {
                                        console.log("Dieser Nutzername ist leider schon vergeben. ");
                                    }

                                }
                            } else if (prompt.answer == 2) {
                                life = false;
                            }
                        }
                    }
                } else {
                    let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                    let maxUseDur: number = car.maxUseDuration;

                    if (duration > maxUseDur) {
                        console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                        life = false;
                    }

                    let earlyUT: number[] = car.earliestUseTime;
                    let lateUT: number[] = car.latestUseTime;
                    let desiredUT: Date = chosenDate;


                    //Hour too early to use car
                    if (earlyUT[0] > desiredUT.getHours() - 1) {
                        console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.");
                        life = false;
                        //Hour okay, but Minute too early
                    } else if (earlyUT[0] == desiredUT.getHours() - 1 && earlyUT[1] > desiredUT.getMinutes()) {
                        console.log("Du kannst dieses Auto leider nicht so früh nutzen.");
                        life = false;
                        //Hour too late to use car
                    } else if (lateUT[0] < desiredUT.getHours() - 1) {
                        console.log("Du kannst dieses Auto leider nicht solch später Stunde nutzen.");
                        life = false;
                        //Hour okay, but Minute too late
                    } else if (lateUT[0] == desiredUT.getHours() - 1 && lateUT[1] < desiredUT.getMinutes()) {
                        console.log("Du kannst dieses Auto leider nicht so spät nutzen!");
                        life = false;

                    } else console.log("Super, das Auto ist verfügbar.");

                    //calculate the cost for the ride
                    let ppMcalc = duration * car.pricePerMinute;
                    let costRide = ppMcalc + car.flatRatePrice;
                    console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                    //ask if customer wants to register or login
                    let prompt: prompts.Answers<string> = await prompts.prompt({
                        type: "select",
                        name: "answer",
                        message: "Um zu buchen, melde dich bitte an oder erstelle einen neuen Account.",
                        choices: [
                            { title: "Ich habe bereits einen Account.", value: 0 },
                            { title: "Erstelle einen neuen Account.", value: 1 },
                        ]
                    })

                    //login
                    if (prompt.answer == 0) {

                        let proceed: boolean = false;

                        let userName: string;
                        while (!proceed) {

                            response = await prompts({
                                type: "text",
                                name: "value",
                                message: "Nutzername:",
                            });
                            userName = response.value;

                            response = await prompts({
                                type: "text",
                                name: "value",
                                message: "Kennwort: ",
                            });
                            let password: string = response.value;

                            let customer: Customer = await database.login(userName, password);
                            if (customer != null) {
                                console.log("LogIn erfolgreich.");
                                proceed = true;
                            } else {
                                console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                            }
                        }
                        let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                        await database.addRideToDB(bookRide);




                        //register    
                    } else if (prompt.answer == 1) {

                        let proceed: boolean = false;

                        while (!proceed) {
                            response = await prompts({
                                type: "text",
                                name: "value",
                                message: "Neuer Nutzername:",
                            });
                            let userName: string = response.value;

                            response = await prompts({
                                type: "text",
                                name: "value",
                                message: "Neues Kennwort: ",
                            });
                            let password: string = response.value;

                            let customer: Customer = await database.register(userName, password);
                            if (customer != null) {
                                console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                proceed = true;

                                let user: Customer = await database.findUserByUsername(userName);

                                let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                await database.addRideToDB(bookRide);


                            } else {
                                console.log("Dieser Nutzername ist leider schon vergeben. ");
                            }
                        }
                    }

                }





                //choose fuelType
            } else if (response.answer == 1) {
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
                    let electric: Car[] = await database.getAllElectricCars();
                    if (electric) {
                        let choices = [];
                        for (let i: number = 0; i < 10 && i < electric.length; i++) {
                            choices[i] = { title: electric[i].name, value: i };
                        }
                        this.chosenValue = await prompts({
                            type: "select",
                            name: "answer",
                            message: "",
                            choices: choices
                        });
                    }
                    response = await prompts({
                        type: "date",
                        name: "value",
                        message: "Wann brauchst du das Auto?",
                    });
                    let chosenDate: Date = response.value;
                    chosenDate.setMinutes(chosenDate.getMinutes() + 60);
                    console.log(chosenDate);

                    response = await prompts({
                        type: "number",
                        name: "value",
                        message: "Wie lange brauchst du das Auto?",
                    });
                    let duration: number = response.value; // in Minuten


                    let availability: Ride[] | null = await database.getRides(all[this.chosenValue.answer]._id);
                    console.log(availability)
                    if (availability != null) {
                        for (let i: number = 0; i < availability.length; i++) {
                            let ride: Ride = availability[i];
                            //compare wanted date & time with already booked rides for the chosen car
                            if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                                console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                                life = false;
                            } else {
                                //compare if wanted duration is too long (exceeds cars max duration)
                                let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                                let maxUseDur: number = car.maxUseDuration;

                                if (duration > maxUseDur) {
                                    console.log("Du kannst dieses Auto nicht so lange ausleihen!")
                                    life = false;
                                }

                                let earlyUT: number[] = car.earliestUseTime;
                                let lateUT: number[] = car.latestUseTime;
                                let desiredUT: Date = chosenDate;

                                //Hour too early to use car
                                if (earlyUT[0] > desiredUT.getHours() - 1) {
                                    console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.")
                                    life = false;
                                    //Hour okay, but Minute too early
                                } else if (earlyUT[0] == desiredUT.getHours() - 1 && earlyUT[1] > desiredUT.getMinutes()) {
                                    console.log("Du kannst dieses Auto leider nicht so früh nutzen.")
                                    life = false;
                                    //Hour too late to use car
                                } else if (lateUT[0] < desiredUT.getHours() - 1) {
                                    console.log("Du kannst dieses Auto leider nicht zu solch später Stunde nutzen.")
                                    life = false;
                                    //Hour okay, but Minute too late
                                } else if (lateUT[0] == desiredUT.getHours() - 1 && lateUT[1] < desiredUT.getMinutes()) {
                                    console.log("Du kannst dieses Auto leider nicht so spät nutzen.")
                                    life = false;
                                } else
                                    console.log("Super, sieht so aus als wäre das Auto frei!");



                                //calculate the cost for the ride
                                let ppMcalc = duration * car.pricePerMinute;
                                let costRide = ppMcalc + car.flatRatePrice;
                                console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                                //ask if customer wants to register or login
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
                                //LogIn
                                if (prompt.answer == 0) {

                                    let proceed: boolean = false;

                                    let userName: string;
                                    while (!proceed) {

                                        let response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Nutzername:",
                                        });
                                        userName = response.value;

                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Kennwort: ",
                                        });
                                        let password: string = response.value;

                                        let customer: Customer = await database.login(userName, password);
                                        if (customer != null) {
                                            console.log("LogIn erfolgreich.");
                                            proceed = true;
                                        } else {
                                            console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                                        }
                                    }

                                    let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                    await database.addRideToDB(bookRide);


                                    //register
                                } else if (prompt.answer == 1) {

                                    let proceed: boolean = false;

                                    while (!proceed) {
                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Neuer Nutzername:",
                                        });
                                        let userName: string = response.value;

                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Neues Kennwort: ",
                                        });
                                        let password: string = response.value;

                                        let customer: Customer = await database.register(userName, password);
                                        if (customer != null) {
                                            console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                            proceed = true;

                                            let user: Customer = await database.findUserByUsername(userName);

                                            let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                            await database.addRideToDB(bookRide);

                                        } else {
                                            console.log("Dieser Nutzername ist leider schon vergeben. ");
                                        }

                                    }
                                } else if (prompt.answer == 2) {
                                    life = false;
                                }
                            }
                        }
                    } else {
                        let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                        let maxUseDur: number = car.maxUseDuration;

                        console.log(car);


                        if (duration > maxUseDur) {
                            console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                            life = false;
                        }

                        let earlyUT: number[] = car.earliestUseTime;
                        let lateUT: number[] = car.latestUseTime;
                        let desiredUT: Date = chosenDate;

                        //Hour too early to use car
                        if (earlyUT[0] > desiredUT.getHours()) {
                            console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.");
                            life = false;
                            //Hour okay, but Minute too early
                        } else if (earlyUT[0] == desiredUT.getHours() && earlyUT[1] > desiredUT.getMinutes()) {
                            console.log("Du kannst dieses Auto leider nicht so früh nutzen.");
                            life = false;
                            //Hour too late to use car
                        } else if (lateUT[0] < desiredUT.getHours()) {
                            console.log("Du kannst dieses Auto leider nicht solch später Stunde nutzen.");
                            life = false;
                            //Hour okay, but Minute too late
                        } else if (lateUT[0] == desiredUT.getHours() && lateUT[1] < desiredUT.getMinutes()) {
                            console.log("Du kannst dieses Auto leider nicht so spät nutzen!");
                            life = false;

                        } else console.log("Super, das Auto ist verfügbar.");

                        //calculate the cost for the ride
                        let ppMcalc = duration * car.pricePerMinute;
                        let costRide = ppMcalc + car.flatRatePrice;
                        console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                        //ask if customer wants to register or login
                        let prompt: prompts.Answers<string> = await prompts.prompt({
                            type: "select",
                            name: "answer",
                            message: "Um zu buchen, melde dich bitte an oder erstelle einen neuen Account.",
                            choices: [
                                { title: "Ich habe bereits einen Account.", value: 0 },
                                { title: "Erstelle einen neuen Account.", value: 1 },
                            ]
                        })

                        //login
                        if (prompt.answer == 0) {

                            let proceed: boolean = false;

                            let userName: string;
                            while (!proceed) {

                                let response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Nutzername:",
                                });
                                userName = response.value;

                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Kennwort: ",
                                });
                                let password: string = response.value;

                                let customer: Customer = await database.login(userName, password);
                                if (customer != null) {
                                    console.log("LogIn erfolgreich.");
                                    proceed = true;
                                } else {
                                    console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                                }
                            }
                            let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                            await database.addRideToDB(bookRide);




                            //register    
                        } else if (prompt.answer == 1) {

                            let proceed: boolean = false;

                            while (!proceed) {
                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Neuer Nutzername:",
                                });
                                let userName: string = response.value;

                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Neues Kennwort: ",
                                });
                                let password: string = response.value;

                                let customer: Customer = await database.register(userName, password);
                                if (customer != null) {
                                    console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                    proceed = true;

                                    let user: Customer = await database.findUserByUsername(userName);

                                    let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                    await database.addRideToDB(bookRide);


                                } else {
                                    console.log("Dieser Nutzername ist leider schon vergeben. ");
                                }
                            }
                        }

                    }

                }

                //fuelType: conventional
                if (prompt.answer == 1) {
                    let conventional: Car[] = await database.getAllConventionalCars();
                    if (conventional) {
                        let choices = [];
                        for (let i: number = 0; i < 10 && i < conventional.length; i++) {
                            choices[i] = { title: conventional[i].name, value: i };
                        }
                        this.chosenValue = await prompts({
                            type: "select",
                            name: "answer",
                            message: "",
                            choices: choices
                        });
                    }

                    response = await prompts({
                        type: "date",
                        name: "value",
                        message: "Wann brauchst du das Auto?",
                    });
                    let chosenDate: Date = response.value;
                    response = await prompts({
                        type: "number",
                        name: "value",
                        message: "Wie lange brauchst du das Auto?",
                    });
                    let duration: number = response.value; // in Minuten

                    let _id: ObjectId = all[this.chosenValue.answer]._id;

                    let availability: Ride[] | null = await database.getRides(all[this.chosenValue.answer]._id);
                    if (availability != null) {
                        for (let i: number = 0; i < availability.length; i++) {
                            let ride: Ride = availability[i];
                            //compare wanted date & time with already booked rides for the chosen car
                            if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                                console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                                life = false;
                            } else {
                                //compare if wanted duration is too long (exceeds cars max duration)
                                let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                                let maxUseDur: number = car.maxUseDuration;

                                if (duration > maxUseDur) {
                                    console.log("Du kannst dieses Auto nicht so lange ausleihen!")
                                    life = false;
                                }

                                let earlyUT: number[] = car.earliestUseTime;
                                let lateUT: number[] = car.latestUseTime;
                                let desiredUT: Date = chosenDate;

                                //Hour too early to use car
                                if (earlyUT[0] > desiredUT.getHours() - 1) {
                                    console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.")
                                    life = false;
                                    //Hour okay, but Minute too early
                                } else if (earlyUT[0] == desiredUT.getHours() - 1 && earlyUT[1] > desiredUT.getMinutes()) {
                                    console.log("Du kannst dieses Auto leider nicht so früh nutzen.")
                                    life = false;
                                    //Hour too late to use car
                                } else if (lateUT[0] < desiredUT.getHours() - 1) {
                                    console.log("Du kannst dieses Auto leider nicht zu solch später Stunde nutzen.")
                                    life = false;
                                    //Hour okay, but Minute too late
                                } else if (lateUT[0] == desiredUT.getHours() - 1 && lateUT[1] < desiredUT.getMinutes()) {
                                    console.log("Du kannst dieses Auto leider nicht so spät nutzen.")
                                    life = false;
                                } else
                                    console.log("Super, sieht so aus als wäre das Auto frei!");



                                //calculate the cost for the ride
                                let ppMcalc = duration * car.pricePerMinute;
                                let costRide = ppMcalc + car.flatRatePrice;
                                console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                                //ask if customer wants to register or login
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
                                //LogIn
                                if (prompt.answer == 0) {

                                    let proceed: boolean = false;

                                    let userName: string;
                                    while (!proceed) {

                                        let response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Nutzername:",
                                        });
                                        userName = response.value;

                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Kennwort: ",
                                        });
                                        let password: string = response.value;

                                        let customer: Customer = await database.login(userName, password);
                                        if (customer != null) {
                                            console.log("LogIn erfolgreich.");
                                            proceed = true;
                                        } else {
                                            console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                                        }
                                    }

                                    let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                    await database.addRideToDB(bookRide);


                                    //register
                                } else if (prompt.answer == 1) {

                                    let proceed: boolean = false;

                                    while (!proceed) {
                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Neuer Nutzername:",
                                        });
                                        let userName: string = response.value;

                                        response = await prompts({
                                            type: "text",
                                            name: "value",
                                            message: "Neues Kennwort: ",
                                        });
                                        let password: string = response.value;

                                        let customer: Customer = await database.register(userName, password);
                                        if (customer != null) {
                                            console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                            proceed = true;

                                            let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                            await database.addRideToDB(bookRide);

                                        } else {
                                            console.log("Dieser Nutzername ist leider schon vergeben. ");
                                        }

                                    }
                                } else if (prompt.answer == 2) {
                                    life = false;
                                }
                            }
                        }
                    } else {
                        let car: Car = await database.getCar(all[this.chosenValue.answer]._id);
                        console.log(car);
                        let maxUseDur: number = car.maxUseDuration;

                        if (duration > maxUseDur) {
                            console.log("Du kannst dieses Auto nicht so lange ausleihen!");
                            life = false;
                        }

                        let earlyUT: number[] = car.earliestUseTime;
                        let lateUT: number[] = car.latestUseTime;
                        let desiredUT: Date = chosenDate;

                        //Hour too early to use car
                        if (earlyUT[0] > desiredUT.getHours()) {
                            console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.");
                            life = false;
                            //Hour okay, but Minute too early
                        } else if (earlyUT[0] == desiredUT.getHours() && earlyUT[1] > desiredUT.getMinutes()) {
                            console.log("Du kannst dieses Auto leider nicht so früh nutzen.");
                            life = false;
                            //Hour too late to use car
                        } else if (lateUT[0] < desiredUT.getHours()) {
                            console.log("Du kannst dieses Auto leider nicht solch später Stunde nutzen.");
                            life = false;
                            break;
                            //Hour okay, but Minute too late
                        } else if (lateUT[0] == desiredUT.getHours() && lateUT[1] < desiredUT.getMinutes()) {
                            console.log("Du kannst dieses Auto leider nicht so spät nutzen!");
                            life = false;

                        } else console.log("Super, das Auto ist verfügbar.");

                        //calculate the cost for the ride
                        let ppMcalc = duration * car.pricePerMinute;
                        let costRide = ppMcalc + car.flatRatePrice;
                        console.log("Diese Fahrt würde " + costRide + " Euro kosten.");

                        //ask if customer wants to register or login
                        let prompt: prompts.Answers<string> = await prompts.prompt({
                            type: "select",
                            name: "answer",
                            message: "Um zu buchen, melde dich bitte an oder erstelle einen neuen Account.",
                            choices: [
                                { title: "Ich habe bereits einen Account.", value: 0 },
                                { title: "Erstelle einen neuen Account.", value: 1 },
                            ]
                        })

                        //login
                        if (prompt.answer == 0) {

                            let proceed: boolean = false;

                            let userName: string;
                            while (!proceed) {

                                let response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Nutzername:",
                                });
                                userName = response.value;

                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Kennwort: ",
                                });
                                let password: string = response.value;

                                let customer: Customer = await database.login(userName, password);
                                if (customer != null) {
                                    console.log("LogIn erfolgreich.");
                                    proceed = true;
                                } else {
                                    console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                                }
                            }
                            let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                            await database.addRideToDB(bookRide);




                            //register    
                        } else if (prompt.answer == 1) {

                            let proceed: boolean = false;

                            while (!proceed) {
                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Neuer Nutzername:",
                                });
                                let userName: string = response.value;

                                response = await prompts({
                                    type: "text",
                                    name: "value",
                                    message: "Neues Kennwort: ",
                                });
                                let password: string = response.value;

                                let customer: Customer = await database.register(userName, password);
                                if (customer != null) {
                                    console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                                    proceed = true;

                                    let user: Customer = await database.findUserByUsername(userName);

                                    let bookRide: Ride = new Ride(chosenDate, duration, userName, all[this.chosenValue.answer]._id, costRide, maxUseDur);
                                    await database.addRideToDB(bookRide);


                                } else {
                                    console.log("Dieser Nutzername ist leider schon vergeben. ");
                                }
                            }
                        }

                    }

                }






            } else if (response.answer == 2) { //Er kann nach verfügbaren Autos für eine Fahrzeit mit Angabe von Datum, Uhrzeit und Dauer, filtern.

                response = await prompts({
                    type: "date",
                    name: "value",
                    message: "Wann brauchst du das Auto?",
                });
                let chosenDate: Date = response.value;
                chosenDate.setMinutes(chosenDate.getMinutes() + 60);
                console.log(chosenDate);

                response = await prompts({
                    type: "number",
                    name: "value",
                    message: "Wie lange brauchst du das Auto?",
                });
                let duration: number = response.value; // in Minuten


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
                    choices[i] = { title: availableCars[i].name, value: availableCars[i]._id};
                }
                //choose car
                this.chosenValue = await prompts({
                    type: "select",
                    name: "answer",
                    message: "",
                    choices: choices
                });

















                //login to view history and booked Rides    
            } else if (response.answer == 3) {

                //login
                let proceed: boolean = false;

                let userName: string;
                while (!proceed) {

                    response = await prompts({
                        type: "text",
                        name: "value",
                        message: "Nutzername:",
                    });
                    userName = response.value;

                    response = await prompts({
                        type: "text",
                        name: "value",
                        message: "Kennwort: ",
                    });
                    let password: string = response.value;

                    let customer: Customer = await database.login(userName, password);
                    if (customer != null) {
                        console.log("LogIn erfolgreich.");
                        proceed = true;
                    } else {
                        console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                    }
                }

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
                if (prompt.answer == 0) {
                    let rides: Ride[] = await database.getCustomerRides(userName)
                    console.log(rides);
                }

                //show money spent (sum and average)
                if (prompt.answer == 1) {

                    let rides: Ride[] = await database.getCustomerRides(userName);
                    let sum: number = 0;

                    for (let i: number = 0; i < rides.length; i++) {
                        sum += rides[i].price;
                    }

                    let average: number = sum / rides.length;
                    console.log("Du hast bisher insgesamt " + sum + " Euro ausgegeben.");
                    console.log("Durchschnittlich zahlst du pro Fahrt " + average + " Euro");
                }






                //Admin LogIn
            } else if (response.answer == 4) {
                console.log("Hallo Admin, bitte melde dich an.");

                let proceed: boolean = false;
                let userName: string;

                while (!proceed) {

                    response = await prompts({
                        type: "text",
                        name: "value",
                        message: "Nutzername:",
                    });
                    userName = response.value;

                    response = await prompts({
                        type: "text",
                        name: "value",
                        message: "Kennwort: ",
                    });
                    let password: string = response.value;

                    let customer: Customer = await database.login(userName, password);
                    if (customer != null && customer.admin == true) {
                        console.log("LogIn erfolgreich.");
                        proceed = true;
                    } else {
                        console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                    }
                }


                //choice of whether to add car or end app, if admin wants to book ride he needs to go via main menu
                let prompt: prompts.Answers<string> = await prompts.prompt({
                    type: "select",
                    name: "answer",
                    message: "Was möchtest du tun?",
                    choices: [
                        { title: "Ich möchte ein neues Auto hinzufügen.", value: 0 },
                        { title: "App verlassen.", value: 1 },
                    ]
                })
                //add car input information
                if (prompt.answer == 0) {

                    let fuelType: string;

                    response = await prompts({
                        type: "text",
                        name: "value",
                        message: "Autobezeichnung: ",
                    });
                    let carName = response.value;

                    //multiple choice for fuelType
                    let prompt: prompts.Answers<string> = await prompts.prompt({
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

                //close app
                if (prompt.answer == 1) {
                    life = false;
                }




                //end program
            } else if (response.answer == 5) {
                console.log("Bis zum nächsten Mal! :)");
                life = false;
            }





            console.log("Tschüss! :)");
            life = false;
        }

    }
}

let main: Main = new Main();
main.main();

