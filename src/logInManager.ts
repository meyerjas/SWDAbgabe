import { Customer } from "./customer";
import prompts from "prompts";
import { database } from "./main";

export class LogInManager {


    public customers: string;

    public static testPasswordSecurity(password: string): boolean {
        //Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.
        return password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/) != null;
    }

    private checkUsername(username: string): boolean {
        //will accept alphanumeric usernames between 5 and 20 characters, no special characters.
        return username.match(/^(?=.{5,20}$)[a-zA-Z0-9._]+(?<![_.])$/) != null;
    }

    
    public async logIn(): Promise <string> {
        let proceed: boolean = false;

        let userName: string;
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

            let customer: Customer = await database.login(userName, password);
            if (customer != null) {
                console.log("LogIn erfolgreich.");

                return userName;

                proceed = true;
                
            } else {
                console.log("Login fehlgeschlagen, überprüfe Schreibweise.")
            }
        }
    }
    
    public async register(): Promise <string> {

    let proceed: boolean = false;

    while(!proceed) {
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

        let customer: Customer = await database.register(userName, password);
        if (customer != null) {
            console.log("Registrierung erfolgreich! Die Buchung erfolgt jetzt.");
            proceed = true;

            return userName;

        } else {
            console.log("Dieser Nutzername ist leider schon vergeben. ");
        }
    }
}



}