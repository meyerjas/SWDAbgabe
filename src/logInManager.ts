import {Customer} from "./customer";
import prompts from "prompts";
import { database } from "./main";

export class LogInManager { 


    public customers: string;

    public static testPasswordSecurity (password: string) : boolean{
        //Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.
        return password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/) != null;
    }

    private checkUsername(username:string): boolean {
        //will accept alphanumeric usernames between 5 and 20 characters, no special characters.
        return username.match(/^(?=.{5,20}$)[a-zA-Z0-9._]+(?<![_.])$/) != null;
    }

    
    public async login(): Promise<void> {
        let response = await prompts({
            type: "text",
            name: "value",
            message: "Nutzername:",
        });
        let userName: string = response.value;

        response = await prompts({
            type: "text",
            name: "value",
            message: "Kennwort: ",
        });
        let pw: string = response.value;

        await database.login(userName, pw);

        console.log("Login erfolgreich.");
    } 



}