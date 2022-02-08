import { Ride } from "./ride";
import { Database } from "./database";

export class CarHistory {
    
    public database: Database;

    public async showCars(carname: Ride): Promise<void> {
        
    }

    public async showSum(): Promise<number>  {
        let sum: number;
        //TODO calculate sum
        //let rides: Ride[] = await this.database.getRides();
        sum = 0;
        return sum;
    }

    public showAvrgCost(): number {
        let avrgCost: number;
        //TODO calculate avrg cost
        avrgCost = 0;
        return avrgCost;
    }
}