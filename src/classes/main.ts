import { Database } from "./database";
import { Methods } from "./mainMethods";


export let database: Database = Database.getInstance();
export let method: Methods = new Methods();

export class Main {


    public async main(): Promise<void> {

        console.log("Willkommen bei der Car Sharing App!");
        await database.connect();

        await method.mainMenu();
    }
}

let main: Main = new Main();
main.main();

