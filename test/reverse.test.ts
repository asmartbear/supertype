import * as T from "./testutil"
import { reverseEngineerType as REV } from "../src/reverse"

class MyTestClass { toString() { return "hi" } }

test('reverse-engineer basics', () => {
    T.be(REV(undefined).description, 'undefined')
    T.be(REV(null).description, 'null')

    T.be(REV(false).description, 'boolean')
    T.be(REV(true).description, 'boolean')

    T.be(REV(0).description, 'number')
    T.be(REV(0.1).description, 'number')
    T.be(REV(-912.2).description, 'number')
    T.be(REV(Number.EPSILON).description, 'number')
    T.be(REV(Number.NaN).description, 'number')
    T.be(REV(Number.POSITIVE_INFINITY).description, 'number')

    T.be(REV("").description, 'string')
    T.be(REV("foo").description, 'string')
})

test('reverse-engineer arrays', () => {
    // cannot be empty
    T.throws(() => REV([]))

    // single type
    T.be(REV([1, 2, 3]).description, 'number[]')
    T.be(REV([true]).description, 'boolean[]')

    // mixed types aren't currently supported; we could look through all elements and create an alternation if we wanted to
    T.be(REV([true, 1, "hi", 2, false]).description, 'boolean[]')
})

test('reverse-engineer fields', () => {
    T.be(REV({}).description, '{}')
    T.be(REV({ a: 123 }).description, '{a:number}')
    T.be(REV({ a: 123, b: "foo" }).description, '{a:number,b:string}')
    T.eq(REV({ a: 123, b: "foo" }).toJSON({ a: 123, b: "foo" }), { a: 123, b: "foo" })
    T.eq(REV({ a: 123, b: "foo" }).input({ a: 123, b: "foo", c: "ignored" }), { a: 123, b: "foo" })

    // With options
    const ief = REV({ a: 123, b: "foo" }, { ignoreExtraFields: false })
    T.be(ief.description, '{a:number,b:string}')
    T.eq(ief.input({ a: 1, b: "bar" }), { a: 1, b: "bar" })
    T.throws(() => ief.input({ a: 1, b: "bar", c: "extra" }))
})

test('reverse-engineer opaque objects', () => {
    const a = new MyTestClass()
    const ty = REV(a)
    T.be(ty.description, 'MyTestClass')
    T.throws(() => ty.toJSON(a))
})