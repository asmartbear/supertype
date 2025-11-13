import * as V from "../src/index"
import * as T from "./testutil"

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

test('smart number', () => {
    let ty = V.NUM()
    T.eq(ty.description, "number")

    // strict
    passes(true, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    fails(true, ty, undefined, null, false, true, "", "a", "foo bar", "0", "123", "12bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })

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

test('number clamped', () => {
    let ty = V.NUM().clamp(0, 10)
    T.be(ty.input(5), 5)
    T.be(ty.input(1), 1)
    T.be(ty.input(0), 0)
    T.be(ty.input(-1), 0)
    T.be(ty.input(Number.EPSILON), Number.EPSILON)
    T.be(ty.input(10), 10)
    T.be(ty.input(10 + Number.EPSILON), 10)
    T.be(ty.input(123), 10)
    ty = V.NUM().clamp(undefined, 10)
    T.be(ty.input(-5), -5)
    T.be(ty.input(5), 5)
    T.be(ty.input(15), 10)
    ty = V.NUM().clamp(0, undefined)
    T.be(ty.input(-5), 0)
    T.be(ty.input(5), 5)
    T.be(ty.input(15), 15)
})

test('smart string', () => {
    let ty = V.STR()
    T.eq(ty.description, "string")

    // strict
    passes(true, ty, "", "a", "foo bar", "foo\nbar")
    fails(true, ty, undefined, null, false, true, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })

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
})

test('primative marshalling', () => {
    T.eq(V.NUM().toJSON(123), 123)
    T.eq(V.NUM().fromJSON(123), 123)
    T.eq(V.STR().toJSON("123"), "123")
    T.eq(V.STR().fromJSON("123"), "123")
})
