import { Car } from "./car";


export class CarMethods {
//checks if Desired UT is okay for the chosen car    
public async useTimeOk(car: Car, chosenDate: Date): Promise<boolean> {
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
    } else {
        console.log("Super, sieht so aus als wäre das Auto frei!");
        return true;
    }
}
}