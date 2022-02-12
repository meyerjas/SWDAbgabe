import { ObjectId } from "mongodb";


export class Customer {
    public _id?: ObjectId;
    public username: string;
    public password: string;
    public admin: boolean;

    constructor(username: string, admin: boolean, password?: string, _id?: ObjectId) {
        if (_id)
            this._id = _id;
        this.username = username;
        if (password)
            this.password = password;
        this.admin = admin;
    }
}
