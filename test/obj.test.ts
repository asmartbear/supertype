import * as T from "./testutil"
import * as V from "../src/index"
import { passes, fails, toFromJSON } from "./moreutil"

test('smart fields', () => {
    let ty = V.OBJ({
        x: V.NUM(),
        s: V.STR(),
        b: V.BOOL(),
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
    let ty = V.OBJ({
        x: V.NUM().def(123),
        s: V.STR().def("hi").replace(/hi/g, "there"),
        b: V.BOOL().def(false),
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
    let ty = V.OBJ({
        x: V.OPT(V.NUM()),
        s: V.OPT(V.OPT(V.STR())),     // the second one is ignored
        b: V.BOOL(),
    })
    T.eq(ty.description, "{x:number?,s:string?,b:boolean}")

    T.eq(ty.input({ b: true }), { b: true }, "can just be missing")
    T.eq(ty.input({ b: true }), { x: undefined, s: undefined, b: true }, "can be explicitly set to undefined")

    T.eq(ty.input({ s: "hello", b: true }), { s: "hello", b: true })
    toFromJSON(ty, { b: true }, { b: true })
    toFromJSON(ty, { s: "hi", b: true }, { s: "hi", b: true })
})

test('smart fields with null objects', () => {
    let ty = V.OBJ({
        dn: V.OR(V.DATE(), V.NIL()),
        du: V.OPT(V.DATE()),
    })
    T.eq(ty.description, "{dn:(date|null),du:date?}")

    T.eq(ty.input({ dn: new Date(1234), du: new Date(6789) }), { dn: new Date(1234), du: new Date(6789) })
    T.eq(ty.input({ dn: null, du: new Date(6789) }), { dn: null, du: new Date(6789) })
    T.eq(ty.input({ dn: null }), { dn: null })
    T.throws(() => ty.input({}))
    T.throws(() => ty.input({ du: null }))

    toFromJSON(ty, { dn: new Date(1234), du: new Date(6789) }, { dn: { t: "date", x: 1234 }, du: 6789 })
    toFromJSON(ty, { dn: new Date(1234) }, { dn: { t: "date", x: 1234 } })
})