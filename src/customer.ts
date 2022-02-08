import { CarHistory } from "./carHistory";
import { Car } from "./car";
import { ObjectId } from "mongodb";

export class Customer {
    public _id?: ObjectId;
    public username: string;
    public password: string;
    public history?: CarHistory;
    public admin: boolean;

    constructor(username: string, admin: boolean, password?: string, _id?: ObjectId, history?: CarHistory) {
        if (_id)
            this._id = _id;
        this.username = username;
        if (password)
            this.password = password;
        if (history)
            this.history = history;
        this.admin = admin;
    }

}
