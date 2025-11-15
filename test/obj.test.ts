import * as T from "./testutil"
import { passes, fails, toFromJSON } from "./moreutil"
import { OBJ } from "../src/fields"
import { NUM } from "../src/number"
import { BOOL } from "../src/boolean"
import { STR } from "../src/string"
import { OPT } from "../src/alternation"
import { UndefinedFieldsAreOptional } from "../src/common"

test('smart fields', () => {
    let ty = OBJ({
        x: NUM(),
        s: STR(),
        b: BOOL(),
    })
    T.eq(ty.description, "{x:number,s:string,b:boolean}")

    // strict
    passes(true, ty, { x: 0, s: "", b: false }, { x: 123, s: "cool", b: true })
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 }, [321, "123", 0], ["123", 123], [321, "123", 0], ["123", 123, true], [321, "123", true, true], { x: "foo", s: "bar", b: false })
    T.eq(ty.input({ x: 123, s: "cool", b: true }), { x: 123, s: "cool", b: true })

    // not strict
    T.eq(ty.input({ x: "123", s: "123", b: "123" }, false), { x: 123, s: "123", b: true })
    T.eq(ty.input({ x: 123, s: 123, b: 123 }, false), { x: 123, s: "123", b: true })

    // JSON
    toFromJSON(ty, { x: 123, s: "cool", b: true }, { x: 123, s: "cool", b: true })
})

test('smart fields with defaults', () => {
    let ty = OBJ({
        x: NUM().def(123),
        s: STR().def("hi").replace(/hi/g, "there"),
        b: BOOL().def(false),
    })
    T.eq(ty.description, "{x:number=123,s:string=hi>>re=/hi/g->there,b:boolean=false}")

    T.eq(ty.input({}), { x: 123, s: "hi", b: false }, "default means we don't run the replacement")
    T.eq(ty.input({ s: "taco" }), { x: 123, s: "taco", b: false }, "replacement didn't match")
    T.eq(ty.input({ s: "and hi" }), { x: 123, s: "and there", b: false }, "replacement when no default")
    T.eq(ty.input({ b: true, s: "there" }), { x: 123, s: "there", b: true })
    T.eq(ty.input({ x: undefined, s: undefined, b: undefined }), { x: 123, s: "hi", b: false }, "explicit undefined instead of missing")

    T.eq(ty.toHash(ty.input({})), "a56e71350dcdb6cb8481f283e14d52ee", "the exact value doesn't matter")
})

test('smart fields with optional fields', () => {
    let ty = OBJ({
        x: OPT(NUM()),
        s: OPT(OPT(STR())),     // the second one is ignored
        b: BOOL(),
    })
    T.eq(ty.description, "{x:(number|undefined),s:(string|undefined),b:boolean}")

    T.eq(ty.input({ b: true }), { b: true }, "can just be missing")
    T.eq(ty.input({ b: true }), { x: undefined, s: undefined, b: true }, "can be explicitly set to undefined")
    T.eq(ty.input({ s: "hello", b: true }), { s: "hello", b: true })
})