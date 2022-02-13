import { checkUsername } from "../classes/testMethods";

test("test username Brigit34? to be false", () => {
    expect(checkUsername("Brigit34?")).toBe(false);
});