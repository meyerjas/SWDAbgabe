import { Customer } from "./customer";
import promptstypes from "prompts";
import { database } from "./main";

let prompts = require("prompts");

export class LogInManager {

    //Null Object as placeholder for unregistered User
    private activeCustomer: Customer = new Customer("Guest", false);



    //regEx to check Username is okay
    private checkUsername(username: string): boolean {
        //will accept alphanumeric usernames between 5 and 20 characters, no special characters.
        return username.match(/^(?=.{5,20}$)[a-zA-Z0-9._]+(?<![_.])$/) != null;
    }


    public async logIn(admin: boolean): Promise<string> {

        let proceed: boolean = false;
        let userName: string = "";

        while (!proceed) {

            let response = await prompts({
                type: "text",
                name: "value",
                message: "Nutzername:",
            });
            userName = response.value;

            response = await prompts({
                type: "text",
                name: "value",
                message: "Kennwort: ",
            });
            let password: string = response.value;

            let customer: Customer | null = await database.login(userName, password);
            if (customer)
                this.activeCustomer = customer;

            if (admin == false) {
                if (customer) {
                    console.log("LogIn erfolgreich.");

                    proceed = true;

                } else {
                    console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                }
            } else {
                if (customer) {
                    console.log("LogIn erfolgreich.");
                    proceed = true;
                } else {
                    console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
                }
            }
        } return userName;
    }

    public async register(): Promise<string | null> {

        let proceed: boolean = false;

        while (!proceed) {
            let response = await prompts({
                type: "text",
                name: "value",
                message: "Neuer Nutzername:",
            });
            let userName: string = response.value;

            response = await prompts({
                type: "text",
                name: "value",
                message: "Neues Kennwort: ",
            });
            let password: string = response.value;

            if (this.checkUsername(userName)) {
                let customer: Customer | null = await database.register(userName, password);
                if (customer != null) {
                    console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
                    proceed = true;

                    return userName;

                } else {
                    console.log("Dieser Nutzername ist leider schon vergeben. ");
                }
            } else {
                console.log("Der Username muss zwischen 5-20 Zeichen lang sein und darf keine Sonderzeichen enthalten. Bitte versuche es erneut.")
            }
        }
        return null;
    }



}