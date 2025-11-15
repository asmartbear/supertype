import * as T from "./testutil"
import * as V from "../src/index"
import { passes, fails, toFromJSON } from "./moreutil"


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

test('smart or with primatives', () => {
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

