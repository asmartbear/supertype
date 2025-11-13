# Super Types

Data types that parse, validate, transform, marshal, compare, and hash.

## Usage

```typescript
import * as V from "@asmartbear/supertype"

const myType = V.OBJ({
    id: V.STR().re(/^[a-zA-Z]\w+$/),
    count: V.INT().min(0),
})
const obj = myType.validate({id: "taco", count: 4})
// Also `obj` will be of type `{id:string,count:number}`.

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
