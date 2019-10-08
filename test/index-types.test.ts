import {
    pluckEntries,
} from "../src/models/index-types";

const o = {
    a: "a",
    b: "b",
    c: "c",
}


test("pluck-entries", () => {
    const entries = pluckEntries(o, ["a", "b"]);

    console.log(entries);
});
