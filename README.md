# Smart Types

Data types that parse, validate, transform, marshal, compare, and hash.

## Features

* Parse anything, either strictly or non-strict where it infers and converts values.
* Send anything to/from JSON, using "as native as possible," but with enough meta-data to support anything.
* Get a simple string from any type.
* Get a hash value of any type.

## Types

* Supports primatives, arrays, objects with well-defined typed structures.
* Records and Maps with arbitrary key and value types
* Tuples (arrays of fixed type and length)
* Literals (one of a fixed set of primative values)
* Alternations -- any of a set of types
* Standard objects: `Date`

## Usage

```typescript
import * as V from "@asmartbear/smarttype"

const myType = V.OBJ({
    id: V.STR().re(/^[a-zA-Z]\w+$/),
    count: V.INT().min(0),
})
// `obj` will be of type `{id:string,count:number}`, or throw exception.
const obj = myType.input({id: "taco", count: 4})
// JSON always works
const js = obj.toJSON()
```


## Development

Build:

```bash
npm run build
```

Unit tests:

```bash
npm run test
```

Unit tests, refreshed live:

```bash
npm run watch
```

Prepare for release (e.g. run tests and bump version number):

```bash
npm run release
```

Publish to npm:

```bash
npm publish
```
