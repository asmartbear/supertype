import * as V from "../src/index"
import * as T from "./testutil"

/** These values pass validation and are identical in their final form. */
function passes(strict: boolean, ty: V.SmartType<any, any>, ...x: unknown[]) {
    for (const y of x) {
        try {
            T.be(ty.input(y, strict), y)
        } catch (e) {
            throw new Error(
                `Expected validation to succeed for value: ${JSON.stringify(y)} ` +
                `(type: ${typeof y})`
            );
        }
    }
}

/** These value fail validation. */
function fails(strict: boolean, a: V.SmartType<any, any>, ...x: unknown[]) {
    for (const y of x) {
        T.throws(() => a.input(y, strict), V.ValidationError, JSON.stringify(y))
    }
}

test('smart number', () => {
    let ty = V.NUM()
    T.eq(ty.description, "number")

    // strict
    passes(true, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    fails(true, ty, undefined, null, false, true, "", "a", "foo bar", "0", "123", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })

    // not strict
    passes(false, ty, 0, 1, -1, 123.4, -567.68, Number.EPSILON, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    fails(false, ty, undefined, null, "", "a", "foo bar", [], [1], [2, 1], [3, "a", 1], {}, { a: 1 }, { b: 2, a: 1 })
    T.be(ty.input(false, false), 0)
    T.be(ty.input(true, false), 1)
    T.be(ty.input("0", false), 0)
    T.be(ty.input("123", false), 123)
    T.be(ty.input("-2.3", false), -2.3)

    // min-limit
    {
        const ty = V.NUM().min(3)
        passes(true, ty, 3, 4, 5, 6, Number.POSITIVE_INFINITY)
        fails(true, ty, -10, 0, 1, 2, 2.999, Number.NEGATIVE_INFINITY, Number.NaN)
    }

    // max-limit
    {
        const ty = V.NUM().max(3)
        passes(true, ty, -10, 0, 1, 2, 2.999, 3, Number.NEGATIVE_INFINITY)
        fails(true, ty, 3.00001, 4, 5, 6, Number.POSITIVE_INFINITY, Number.NaN)
    }

    // double-limit
    {
        const ty = V.NUM().min(0).max(10)
        passes(true, ty, 0, 1, 2, 2.999, 10)
        fails(true, ty, -Number.EPSILON, 10.001, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    }
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
})
