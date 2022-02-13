import { Car } from "./car";


export class RideMethods {

    public async calculateCostForRide(duration: number, car: Car): Promise<number> {
        let ppMcalc = duration * car.pricePerMinute;
        let costRide = ppMcalc + car.flatRatePrice;
        console.log("Diese Fahrt würde " + costRide + " Euro kosten.");
        return costRide;
    }
}