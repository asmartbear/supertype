import { ValidationError, SmartType, JSONType } from "./common"

/** Given a type, returns the Class of that type. */
type ClassOf<T> = (abstract new (...args: any[]) => T) | (new (...args: any[]) => T);

/** Given a class, returns the instance-type that it creates. */
type InstanceOf<C> = C extends ClassOf<infer T> ? T : never;

class SmartClass<T extends object> extends SmartType<T, null> {

    constructor(
        public readonly cls: ClassOf<T>
    ) {
        super(cls.name)
    }

    // istanbul ignore next
    get constructorArgs() { return [this.cls] }

    input(x: unknown, _?: boolean): T {
        if (x instanceof this.cls) return x
        if (typeof x === 'object' && x !== null) {     // if an object, can report its class
            throw new ValidationError(this, x, `Expected instance of ${this.cls.name} rather than ${x.constructor.name}`)
        }
        throw new ValidationError(this, x, `Expected instance of ${this.cls.name}`)     // generic type failure

    }

    toJSON(x: T): null {
        throw new Error("Smart class validator does not support conversion to JSON")
    }

    fromJSON(x: JSONType): T {
        throw new Error("Smart class validator does not support conversion from JSON")
    }
}

/** An opaque object that is an instance of a given class, and throws if attempts to be converted to JSON. */
export function CLASS<T extends object>(cls: ClassOf<T>) {
    return new SmartClass(cls)
}
