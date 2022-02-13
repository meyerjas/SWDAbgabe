import * as Mongo from "mongodb";
import * as bcrypt from "bcrypt";
import { Car } from "./car";
import { Customer } from "./customer";
import { Ride } from "./ride";

export class Database {

    //Singleton for global access of Database
    private static instance: Database;
    private constructor() {
        if (Database.instance) {
            throw new Error("Du musst getInstance() nutzen.");
        }
        Database.instance = this;
    }
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }


    private readonly dbName: string = "GisJasmin";
    private mongoClient!: Mongo.MongoClient;
    private dbCustomers!: Mongo.Collection;
    private dbCars!: Mongo.Collection;
    private dbRides!: Mongo.Collection;

    private readonly dbCustomersCollectionName: string = "Customers";
    private readonly dbCarsCollectionName: string = "Cars";
    private readonly dbRidesCollectionName: string = "Rides";

    //database connection
    public async connect(): Promise<boolean> {
        const uri: string = "mongodb+srv://User:1234@" + this.dbName + ".rrrwn.mongodb.net/SoftwareDesign?retryWrites=true&w=majority";
        this.mongoClient = new Mongo.MongoClient(uri, {});
        await this.mongoClient.connect();
        this.dbCustomers = this.mongoClient.db("SoftwareDesign").collection(this.dbCustomersCollectionName);
        this.dbCars = this.mongoClient.db("SoftwareDesign").collection(this.dbCarsCollectionName);
        this.dbRides = this.mongoClient.db("SoftwareDesign").collection(this.dbRidesCollectionName);
        console.log("Database connection", this.dbCustomers != undefined);
        return this.dbCustomers != undefined;
    }

    public async disconnect(): Promise<void> {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log("DBConnection disconnected successfull");
        }
    }




    //everything concerning login
    public async login(userName: string, password: string): Promise<Customer | null> {
        let dbCustomer: Customer | null = await this.findUserByUsername(userName);
        if (dbCustomer) {
            if (await bcrypt.compare(<string>password, <string>dbCustomer.password)) {
                return dbCustomer;
            } else {
                console.log("Wrong Password.");
            }
        }
        return null;
    }

    public async register(username: string, password: string): Promise<Customer | null> {
        let dbCustomer: Customer | null = await this.findUserByUsername(username);
        if (!dbCustomer) {
            const saltRounds: number = 10;
            const hashedPassword: string = await bcrypt.hash(<string>password, saltRounds);
            let customer: Customer = new Customer(username, false, hashedPassword);
            await this.addUserToDB(customer);
            dbCustomer = await this.findUserByUsername(customer.username);
            if (dbCustomer) {
                return dbCustomer;
            } else {
                return null;
            }
        } else {
            console.log("username already exist");
            return null;
        }
    }

    public async addUserToDB(customer: Customer): Promise<void> {
        await this.dbCustomers.insertOne(customer);
    }
    public async findUserByUsername(username: String): Promise<Customer | null> {
        let customer: Customer = <Customer>await this.dbCustomers.findOne({ username: username });
        if (customer) {
            return customer;
        } else
            return null;
    }

    //everything considering Rides
    public async addRideToDB(ride: Ride): Promise<void> {
        if (this.dbRides != undefined) {
            await this.dbRides.insertOne(ride);
            console.log("Ride inserted successfully!")
        } else {
            console.log("DBConnection not successfull");
        }
    }

    public async getRides(carId: Mongo.ObjectId): Promise<Ride[] | null> {
        let rides: Ride[] = <Ride[]><unknown>await this.dbRides.find({ carID: carId }).toArray();
        if (rides.length > 0) {
            return rides;
        } else {
            console.log("Cant find any rides.");
            return null;
        }
    }

    public async getCustomerRides(username: string): Promise<Ride[] | null> {
        let rides: Ride[] = <Ride[]><unknown>await this.dbRides.find({ username: username }).toArray();
        if (rides.length > 0) {
            return rides;
        } else {
            console.log("Cant find any rides.");
            return null;
        }
    }

    public async getAllRides(): Promise<Ride[]> {
        let allRides: Ride[] = <Ride[]><unknown[]>await this.dbRides.find().toArray();
        return allRides;
        
    }

    //everything considering cars
    public async addCarToDB(car: Car): Promise<void> {
        if (this.dbCars != undefined) {
            await this.dbCars.insertOne(car);
            console.log("Car inserted successfully!")
        } else {
            console.log("DBConnection not successfull");
        }
    }

    public async getCar(id: Mongo.ObjectId): Promise<Car | null> {
        let car: Car = <Car><unknown>await this.dbCars.findOne({ _id: id });
        if (car) {
            return car;
        } else {
            console.log("Cant find car with id: " + id);
            return null;
        }
    }

    public async getAllCars(): Promise<Car[]> {
        let allCars: Car[] = <Car[]><unknown[]>await this.dbCars.find().toArray();
            return allCars;
    }

    public async getAllConventionalCars(): Promise<Car[] | null> {
        let allConCars: Car[] = <Car[]><unknown>await this.dbCars.find({ fuelType: "conventional" }).toArray();
        if (allConCars)
            return allConCars;
        else
            return null;
    }

    public async getAllElectricCars(): Promise<Car[] | null> {
        let allElecCars: Car[] = <Car[]><unknown>await this.dbCars.find({ fuelType: "electric" }).toArray();
        if (allElecCars)
            return allElecCars;
        else
            return null;
    }

    public async getAllAvailableCars(rides: Ride[]): Promise<Car[] | null> {
        let avaRides = rides;
        let allAvailableCars: Car[] = <Car[]><unknown[]>await this.dbCars.find(avaRides).toArray();
        if (allAvailableCars)
            return allAvailableCars;
        else
            return null;
    }

}
