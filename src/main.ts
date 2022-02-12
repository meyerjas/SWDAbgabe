import { Database } from "./database";
import { Methods } from "./methods";


export let database: Database = Database.getInstance();
export let method: Methods = new Methods();

export class Main {

    public async main(): Promise<void> {

        let keepAlive: boolean = true;

        
        console.log("Willkommen bei der Car Sharing App!");
        await database.connect();

        while (keepAlive) {

            let response: number = await method.mainMenu();

            //show all(first 10) cars
            if (response == 0) {
                await method.createRide();
                keepAlive = false;
            }
            //filter by fuelType
            else if (response == 1) {
                await method.fuelTypeRide();
                keepAlive = false;
            }
            //filter by availability
            else if (response == 2) {
                await method.availabilityRide();
                keepAlive = false;
            }
            //show rides of the customer, spent money
            else if (response == 3) {
                await method.viewHistoryAndRides();
                keepAlive = false;
            }
            //admin login too add car
            else if (response == 4) {
                await method.adminLogIn();
                keepAlive = false;
            }

            else if (response == 5) {
                console.log("Bis zum nächsten Mal!");
                keepAlive = false;
            }
        }

    }
}

let main: Main = new Main();
main.main();

