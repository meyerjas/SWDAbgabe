export function checkUsername(username: string): boolean {
    //will accept alphanumeric usernames between 5 and 20 characters, no special characters.
    return username.match(/^(?=.{5,20}$)[a-zA-Z0-9._]+(?<![_.])$/) != null;
}
