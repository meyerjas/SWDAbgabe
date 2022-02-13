import { ObjectId } from "mongodb";

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
}




