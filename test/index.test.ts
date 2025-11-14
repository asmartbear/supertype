import * as V from "../src/index"
import * as T from "./testutil"
import { IMarshallJson, isPrimative, JSONType } from "../src/common"
import { JS_UNDEFINED_SIGNAL } from "../src/undef";

/** These values pass validation and are identical in their final form. */
function passes(strict: boolean, ty: V.SmartType, ...x: unknown[]) {
    for (const y of x) {
        try {
            T.eq(ty.input(y, strict), y)
        } catch (e) {
            throw new Error(
                `Expected validation to succeed for value: ${JSON.stringify(y)} ` +
                `(type: ${typeof y})`
            );
        }
    }
}

/** These value fail validation. */
function fails(strict: boolean, a: V.SmartType, ...x: unknown[]) {
    for (const y of x) {
        T.throws(() => a.input(y, strict), V.ValidationError, JSON.stringify(y))
        T.eq(a.inputReturnError(y, strict) instanceof V.ValidationError, true)
    }
}

function toFromJSON<U, J extends JSONType>(m: IMarshallJson<U, J>, from: U, to: J) {
    const js = m.toJSON(from)
    T.eq(js, to)
    T.eq(m.fromJSON(to), from)
}

test('isPrimative', () => {
    T.eq(isPrimative(undefined), false)
    T.eq(isPrimative(null), true)
    T.eq(isPrimative(0), true)
    T.eq(isPrimative(123), true)
    T.eq(isPrimative(""), true)
    T.eq(isPrimative("foo"), true)
    T.eq(isPrimative(true), true)
    T.eq(isPrimative(false), true)
    T.eq(isPrimative([]), false)
    T.eq(isPrimative([1]), false)
    T.eq(isPrimative({}), false)
    T.eq(isPrimative({ a: 1 }), false)
    T.eq(isPrimative(new Date()), false)
})

test('smart undefined', () => {
    let ty = V.UNDEF()
    T.eq(ty.description, "undefined")

    // strict
    passes(true, ty, undefined)
    fails(true, ty, false, true, null, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input(undefined), undefined, "default parameter")

    toFromJSON(ty, undefined, JS_UNDEFINED_SIGNAL)
})

test('smart boolean', () => {
    let ty = V.BOOL()
    T.eq(ty.description, "boolean")

    // strict
    passes(true, ty, false, true)
    fails(true, ty, undefined, null, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input(true), true, "default parameter")

    // not strict
    T.be(ty.input(undefined, false), false)
    T.be(ty.input(null, false), false)
    T.be(ty.input(0, false), false)
    T.be(ty.input(1, false), true)
    T.be(ty.input(-1, false), true)
    T.be(ty.input(Number.EPSILON, false), true)
    T.be(ty.input(Number.NEGATIVE_INFINITY, false), true)
    T.be(ty.input(Number.NaN, false), false, "the native way in javascript too")
    T.be(ty.input("", false), false)
    T.be(ty.input("0", false), true)
    T.be(ty.input("123", false), true)
    T.be(ty.input([], false), false)
    T.be(ty.input([1], false), true)
    T.be(ty.input({}, false), false)
    T.be(ty.input({ a: 1 }, false), true)

    toFromJSON(ty, false, false)
    toFromJSON(ty, true, true)
})

test('smart number', () => {
    let ty = V.NUM()
    T.eq(ty.description, "number")

    // strict
    passes(true, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    fails(true, ty, undefined, null, false, true, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input(-0), -0)      // might be nice to fix this?

    // not strict
    passes(false, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    fails(false, ty, undefined, null, "", "a", "foo bar", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input(false, false), 0)
    T.be(ty.input(true, false), 1)
    T.be(ty.input("0", false), 0)
    T.be(ty.input("123", false), 123)
    T.be(ty.input("-2.3", false), -2.3)

    // min-limit
    ty = V.NUM().min(3)
    passes(true, ty, 3, 4, 5, 6, Number.POSITIVE_INFINITY)
    fails(true, ty, -10, 0, 1, 2, 2.999, Number.NEGATIVE_INFINITY, Number.NaN)

    // max-limit
    ty = V.NUM().max(3)
    passes(true, ty, -10, 0, 1, 2, 2.999, 3, Number.NEGATIVE_INFINITY)
    fails(true, ty, 3.00001, 4, 5, 6, Number.POSITIVE_INFINITY, Number.NaN)

    // double-limit
    ty = V.NUM().min(0).max(10)
    passes(true, ty, 0, 1, 2, 2.999, 10)
    fails(true, ty, -Number.EPSILON, 10.001, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
})

test('number to JSON', () => {
    let ty = V.NUM()
    toFromJSON(ty, 123, 123)
    toFromJSON(ty, -12.34, -12.34)
    toFromJSON(ty, Number.POSITIVE_INFINITY, "Infinity")
    toFromJSON(ty, Number.NEGATIVE_INFINITY, "-Infinity")
    toFromJSON(ty, Number.NaN, "NaN")
    // Bad JSON
    T.throws(() => ty.fromJSON("foo"))
    T.eq(ty.toSimplified(123), 123)
})

test('smart string', () => {
    let ty = V.STR()
    T.eq(ty.description, "string")

    // strict
    passes(true, ty, "", "a", "foo bar", "foo\nbar")
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input("\n"), "\n")

    // not strict
    passes(true, ty, "", "a", "foo bar", "foo\nbar")
    T.be(ty.input(undefined, false), "undefined")
    T.be(ty.input(null, false), "null")
    T.be(ty.input(false, false), "false")
    T.be(ty.input(true, false), "true")
    T.be(ty.input(0, false), "0")
    T.be(ty.input(-12.34, false), "-12.34")
    T.be(ty.input(Number.POSITIVE_INFINITY, false), "Infinity")
    T.be(ty.input(Number.NEGATIVE_INFINITY, false), "-Infinity")
    T.be(ty.input(Number.NaN, false), "NaN")

    // trim
    ty = V.STR().trim()
    T.eq(ty.input(""), "")
    T.eq(ty.input("foo"), "foo")
    T.eq(ty.input("foo "), "foo")
    T.eq(ty.input(" foo"), "foo")
    T.eq(ty.input(" foo "), "foo")
    T.eq(ty.input("\tfoo\r\n"), "foo")
    T.eq(ty.input("\t\r\n"), "")

    // minimum length
    ty = V.STR().minLen(5)
    passes(true, ty, "seven", "eighty")
    fails(true, ty, "", "1", "12", "two", "four")

    // regex match
    ty = V.STR().match(/[a-zA-Z]+[0-9]+$/)
    passes(true, ty, "foo1", "bar321", "taco/good123")
    fails(true, ty, "foo", "321bar", "taco123/good")

    // regex replace; don't care if missing
    ty = V.STR().replace(/([a-zA-Z]+)([0-9]+)$/g, '$2$1')
    T.eq(ty.input("foo"), "foo")
    T.eq(ty.input("12foo"), "12foo")
    T.eq(ty.input("foo12"), "12foo")
    ty = V.STR().replace(/([a-zA-Z]+)([0-9]+)$/g, (_, pre, dig) => pre + (parseInt(dig) * 2))
    T.eq(ty.input("foo"), "foo")
    T.eq(ty.input("foo12"), "foo24")
    T.eq(ty.input("12foo"), "12foo")
    T.eq(ty.input("12foo12"), "12foo24")

    // regex replace; do care if missing
    ty = V.STR().replace(/([a-zA-Z]+)([0-9]+)$/g, (_, pre, dig) => pre + (parseInt(dig) * 2), true)
    T.throws(() => ty.input("foo"), V.ValidationError)
    T.eq(ty.input("foo12"), "foo24")
    T.throws(() => ty.input("12foo"), V.ValidationError)
    T.eq(ty.input("12foo12"), "12foo24")
    T.eq(ty.input("foo0"), "foo0", "string wasn't changed, but also the pattern wasn't missing")

    // JSON
    ty = V.STR()
    toFromJSON(ty, "123", "123")
    T.eq(ty.toSimplified("123"), "123")
})

test('smart array', () => {
    let ty = V.ARRAY(V.NUM())
    T.eq(ty.description, "number[]")

    // strict
    passes(true, ty, [], [1], [2, 1])
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })

    // not strict
    passes(true, ty, [], [1], [2, 1])
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.eq(ty.input([12, "34", true], false), [12, 34, 1])

    // min length
    ty = V.ARRAY(V.NUM()).minLen(3)
    passes(true, ty, [1, 2, 3], [4, 3, 2, -1])
    fails(true, ty, [], [1], [2, 1])

    // JSON
    ty = V.ARRAY(V.NUM())
    toFromJSON(ty, [], [])
    toFromJSON(ty, [1, 2, 3], [1, 2, 3])
    toFromJSON(ty, [1, Number.NaN, 3], [1, "NaN", 3])
    T.eq(ty.toSimplified([1, 2, 3]), [1, 2, 3])
})

test('smart or', () => {
    let ty = V.OR(V.NUM(), V.STR())
    T.eq(ty.description, "(number|string)")

    // strict
    passes(true, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar")
    fails(true, ty, undefined, null, false, true, [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })

    // not strict
    T.eq(ty.input(123), 123)
    T.eq(ty.input(123, false), 123)
    T.eq(ty.input("123", false), 123, "number comes first, so it wins when not strict")
    T.eq(ty.input(true, false), 1, "number comes first, so it wins when not strict")        // number comes first, so it wins when not strict
    T.eq(ty.input(null, false), "null", "string wins if number fails")

    // JSON
    toFromJSON(ty, 123, { t: "number", x: 123 })
    toFromJSON(ty, "123", { t: "string", x: "123" })
    T.throws(() => ty.fromJSON(123 as any))
    T.throws(() => ty.fromJSON({} as any))
    T.throws(() => ty.fromJSON({ t: "foo", x: 123 }))
    T.throws(() => ty.toJSON(true as any))
    T.eq(ty.toSimplified(123), 123)
    T.eq(ty.toSimplified("123"), "123")
})

test('smart tuple x2', () => {
    let ty = V.TUPLE(V.NUM(), V.STR())
    T.eq(ty.description, "[number,string]")

    // strict
    passes(true, ty, [123, "foo"], [321, "123"])
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 }, [321, "123", 0], ["123", 123])

    // not strict
    T.eq(ty.input([123, 123], false), [123, "123"])
    T.eq(ty.input(["123", "123"], false), [123, "123"])

    // JSON
    toFromJSON(ty, [123, "123"], [123, "123"])
    T.throws(() => ty.fromJSON([123, 123] as any))
    T.throws(() => ty.fromJSON(["123", "123"] as any))
    T.throws(() => ty.fromJSON({} as any))
    T.throws(() => ty.fromJSON(true as any))
    T.eq(ty.toSimplified([1, "a"]), [1, "a"])
})

test('smart tuple x3', () => {
    let ty = V.TUPLE(V.NUM(), V.STR(), V.BOOL())
    T.eq(ty.description, "[number,string,boolean]")

    // strict
    passes(true, ty, [123, "foo", true], [321, "123", false])
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 }, [321, "123", 0], ["123", 123], [321, "123", 0], ["123", 123, true], [321, "123", true, true])

    // not strict
    T.eq(ty.input([123, 123, 1], false), [123, "123", true])
    T.eq(ty.input(["123", "123", 0], false), [123, "123", false])

    // JSON
    toFromJSON(ty, [123, "123", false], [123, "123", false])
    T.throws(() => ty.fromJSON([123, 123] as any))
    T.throws(() => ty.fromJSON(["123", "123"] as any))
    T.throws(() => ty.fromJSON({} as any))
    T.throws(() => ty.fromJSON(true as any))
})

test('smart object', () => {
    let ty = V.OBJ({
        x: V.NUM(),
        s: V.STR(),
        b: V.BOOL()
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

test('smart object with defaults', () => {
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

test('smart literal primative', () => {
    let ty = V.LITERAL("none", "left", "right", "both")
    T.eq(ty.description, "(none|left|right|both)")

    // strict
    T.eq(ty.input("none"), "none")
    passes(true, ty, "none", "left", "right", "both")
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", " both", "none.", "non", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 }, [321, "123", 0], ["123", 123], [321, "123", 0], ["123", 123, true], [321, "123", true, true], { x: "foo", s: "bar", b: false })

    // JSON
    toFromJSON(ty, "none", "none")
    toFromJSON(ty, "both", "both")
})

test('smart date', () => {
    let ty = V.DATE()
    T.eq(ty.description, "date")

    // strict
    passes(true, ty, new Date(123456789))
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 }, [321, "123", 0], ["123", 123], [321, "123", 0], ["123", 123, true], [321, "123", true, true], { x: "foo", s: "bar", b: false })

    // parsing common date strings
    T.eq(ty.input("2025-11-14"), new Date(Date.UTC(2025, 11 - 1, 14)))
    T.eq(ty.input("2025-11-14 12:34:56+00"), new Date(Date.UTC(2025, 11 - 1, 14, 12, 34, 56)))
    T.eq(ty.input("2025-11-14T12:34:56+0000"), new Date(Date.UTC(2025, 11 - 1, 14, 12, 34, 56)))
    T.eq(ty.input("2025-11-14T12:34:56Z"), new Date(Date.UTC(2025, 11 - 1, 14, 12, 34, 56)))
    T.throws(() => ty.input("12:34:56+00"))

    // JSON
    toFromJSON(ty, new Date(1234567890), 1234567890)
})

