import * as T from "./testutil"
import { passes, fails, toFromJSON } from "./moreutil"
import { MAP } from "../src/map"
import { NUM } from "../src/number"
import { BOOL } from "../src/boolean"
import { STR } from "../src/string"

test("map from map", () => {
    const ty = MAP(NUM(), STR())

    passes(true, ty, new Map([]), new Map([[0, ""]]), new Map([[123, "abc"], [0, ""]]))
    fails(true, ty, undefined, null, false, true, 0, -2, "", "foo", "new Map", [], [1, 2, 3], new Map([["0", ""]]), new Map([["123", "abc"], ["0", ""]]))

    // Type conversion only if not-strict
    T.throws(() => ty.input(new Map([["123", "abc"], ["0", ""]])))
    T.eq(ty.input(new Map([["123", "abc"], ["0", ""]]), false), new Map([[123, "abc"], [0, ""]]))

    toFromJSON(ty, new Map([]), [])
    toFromJSON(ty, new Map([[1, "a"]]), [[1, "a"]])
    toFromJSON(ty, new Map([[1, "a"], [2, "b"]]), [[1, "a"], [2, "b"]])
    toFromJSON(ty, new Map([[Number.POSITIVE_INFINITY, "a"], [Number.NaN, "b"]]), [["Inf", "a"], ["NaN", "b"]])

    T.throws(() => ty.fromJSON({}))
    T.throws(() => ty.fromJSON(false))
    T.throws(() => ty.fromJSON(["taco"]))
    T.throws(() => ty.fromJSON([[]]))
    T.throws(() => ty.fromJSON([[123]]))
    T.throws(() => ty.fromJSON([[123, "abc", "more"]]), undefined, "too many")
    T.throws(() => ty.fromJSON([[123, 123]]), undefined, "wrong type")
})

test("map from object, even if strict", () => {
    const ty = MAP(STR(), BOOL())

    T.eq(ty.input({}), new Map())
    T.eq(ty.input({ a: false }), new Map([["a", false]]))
    T.eq(ty.input({ a: false, b: true }), new Map([["a", false], ["b", true]]))
    T.eq(ty.input({ a: false, b: true, 0: false }), new Map([["0", false], ["a", false], ["b", true]]), "javascript converted it to a string")

    T.throws(() => ty.input([]))
    T.throws(() => ty.input([true]))
    T.throws(() => ty.input({ a: true, b: "taco" }))

    // Type conversion only if not-strict
    T.throws(() => ty.input({ 0: "true" }))
    T.eq(ty.input({ 0: "true" }, false), new Map([["0", true]]))
})
