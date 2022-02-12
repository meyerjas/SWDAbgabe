import { ObjectId } from "mongodb";
import prompts from "prompts";
import { database } from "./main";

let prompts = require("prompts");

export class Car {
    public _id?: ObjectId;
    public name: string;
    public fuelType: string;
    public earliestUseTime: number[];
    public latestUseTime: number[];
    public maxUseDuration: number;
    public flatRatePrice: number;
    public pricePerMinute: number;



    constructor(name: string, fuelType: string, earliestUseTime: number[], latestUseTime: number[], maxUseDuration: number, flatRatePrice: number, pricePerMinute: number, _id?: ObjectId) {
        if (_id)
            this._id = _id;
        this.name = name;
        this.fuelType = fuelType;
        this.earliestUseTime = earliestUseTime;
        this.latestUseTime = latestUseTime;
        this.maxUseDuration = maxUseDuration;
        this.flatRatePrice = flatRatePrice;
        this.pricePerMinute = pricePerMinute;
    }


    //public async showAllCars(): Promise<number> {
    //}
}