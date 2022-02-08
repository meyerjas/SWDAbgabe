import { Customer } from "./customer";
import { Car } from "./car";

export class Admin {
    public user: Customer;

    public addCar(name: string, fuelType: string, earliestUseTime: Date, latestUseTime: Date, maxUseDuration: number, flatRatePrice: number, priceperMinute: number): Car {
        return new Car;
    }

}