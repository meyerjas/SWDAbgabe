import { ObjectId } from "mongodb";
import { Car } from "./car";
import { Customer } from "./customer";
import { database } from "./main";

//Datum, Uhrzeit, Dauer, der Verbindung zum Kunden, der Verbindung zum Auto und des entsprechenden Preises für die Fahrt.
export class Ride {
    public _id: ObjectId;
    public date: Date;
    public duration: number;
    public username: string;
    public maxUseDuration: number;
    public carID: ObjectId;
    public price: number;
    

    constructor(date: Date, duration: number, username: string, carID: ObjectId, price: number, maxUseDuration: number, _id?: ObjectId){
        if (_id)
            this._id = _id;
        this.date = date;
        this.duration = duration;
        this.username = username;
        this.carID = carID;
        this.price = price;
        this.maxUseDuration = maxUseDuration;
        
    }

    public async checkAvailability(_id: ObjectId, chosenDate: Date, duration: number): Promise<void> {
        let availability: Ride[] | null = await database.getRides(_id);
        if (availability != null) { 
            for (let i: number = 0; i < availability.length; i++) {
                let ride: Ride = availability[i];
                //compare wanted date & time with already booked rides for the chosen car
                if (ride.date > chosenDate && ride.date < new Date(chosenDate.getTime() + duration * 60000)) {//in ms, thats why *60000
                    console.log("Oh nein, leider ist das Auto da nicht verfügbar.");
                } else {
                    //compare if wanted duration is too long (exceeds cars max duration)
                    let car: Car = await database.getCar(_id);
                    let maxUseDur: number = car.maxUseDuration;

                    if (duration > maxUseDur) {
                        console.log("Du kannst dieses Auto nicht so lange ausleihen!")
                    }

                    let earlyUT: number[] = car.earliestUseTime;
                    let lateUT: number[] = car.latestUseTime;
                    let desiredUT: Date = chosenDate;

                    //Hour too early to use car
                    if (earlyUT[0] > desiredUT.getHours()-1) {
                        console.log("Du kannst dieses Auto leider nicht zu solch früher Stunde nutzen.")
                    //Hour okay, but Minute too early
                    } else if (earlyUT[0] == desiredUT.getHours()-1 && earlyUT[1] > desiredUT.getMinutes()) {
                        console.log("Du kannst dieses Auto leider nicht so früh nutzen.")
                    //Hour too late to use car
                    } else if (lateUT[0] < desiredUT.getHours()-1) {
                        console.log("Du kannst dieses Auto leider nicht zu solch später Stunde nutzen.")
                    //Hour okay, but Minute too late
                    } else if (lateUT[0] == desiredUT.getHours()-1 && lateUT[1] < desiredUT.getMinutes()) {
                        console.log("Du kannst dieses Auto leider nicht so spät nutzen.")
                    } else {
                        console.log("Super, sieht so aus als wäre das Auto frei!");
                    }

                    //calculate the cost for the ride
                    let ppMcalc = duration * car.pricePerMinute;
                    let costRide = ppMcalc + car.flatRatePrice;
                    console.log("Diese Fahrt würde " + costRide + " Euro kosten.");
                }
            }
        }
    }
}




