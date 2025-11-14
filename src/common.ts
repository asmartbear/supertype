
export type JSONType = null | boolean | string | number | JSONType[] | { [K: string]: JSONType }

/**
 * The values of object or array `T`
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Given a type, returns the Class of that type.
 */
export type ClassOf<T> = (new (...args: any[]) => T);

/**
 * Given a class, returns the instance-type that it creates.
 */
export type InstanceOf<C> = C extends new (...args: any[]) => infer T ? T : never;

type ConcreteConstructor<T = {}> = new (...args: any[]) => T;

/**
 * The exception thrown when `input()` goes wrong.  Includes the fundamental problem,
 * and a full path to where the issue lies.
 */
export class ValidationError extends Error {
    private readonly myMessage: string

    constructor(
        type: IDescriptive,
        valueEncountered: any,
        expectedPrefix?: string,
        public path: string[] = []
    ) {
        let msg = expectedPrefix ?? "Expected " + type.description
        msg += ` but got [${String(valueEncountered)}]`
        super(msg);
        this.name = 'ValidationError';
        this.myMessage = msg
    }

    // addPath(segment: string | number | symbol | undefined | null) {
    //     this.path.push(String(segment));
    //     this.message = this.fullMessage
    // }

    // get fullMessage(): string {
    //     const pathStr = this.path.length
    //         ? `At key [${this.path.reverse().join('.')}]: `
    //         : '';
    //     return pathStr + this.myMessage;
    // }
}

export interface IDescriptive {

    /** A human-readable description of whatever this is */
    description: string
}

/**
 * Implements a parser for a native type, converting `unknown` into the desired native type `T`,
 * or throwing `ValidationError` if it fails.
 */
export interface INativeParser<T> extends IDescriptive {

    /**
     * Attempts to convert an input value into this smart type, validating against
     * any additional rules, possibly transforming the value, and finally returning
     * the raw value if it passes, or throwing `ValidationError` on error.
     * 
     * @param x the value to validate, process, and ultimately return as a native value.
     * @param strict if `true`, only allow precise inputs, otherwise try to convert similar types into this type.
     * @returns the validated value.
     * @throws {ValidationError} If the input is invalid
     */
    input(x: unknown, strict: boolean): T
}

/**
 * Implements marshalling a native type to and from a JSON-compatible object.
 */
export interface IMarshallJson<T, J extends JSONType> {
    /** Sends the native type to a JSON format */
    toJSON(x: T): J

    /** Converts something from `toJSON()` back into the native type */
    fromJSON(js: J): T
}

/**
 * A type capable of parsing, validating, conversion, marshalling, and more.
 * Represents a specific Typescript type on input and output.
 */
export abstract class SmartType<T = any, J extends JSONType = JSONType> implements INativeParser<T>, IMarshallJson<T, J> {

    constructor(public readonly description: string) { }

    /**
     * Same as `input()` but returns errors as objects rather than throwing them.
     */
    inputReturnError(x: unknown, strict: boolean): T | ValidationError {
        try {
            return this.input(x, strict)
        } catch (e) {
            // istanbul ignore next
            if (e instanceof ValidationError) return e
            // istanbul ignore next
            throw e
        }
    }

    get constructorArgs(): any[] { return [this.description] }

    abstract input(x: unknown, strict?: boolean): T;
    abstract toJSON(x: T): J;
    abstract fromJSON(js: J): T;
}

/**
 * Extends a `SmartType` base class with a new class that executes a transformation of some upstream type
 * in its `input()`, returning something that is of the identical type to the base-class but with this
 * transformation applied.
 * 
 * @param Base base-class to extend
 * @param upstream upstream type for processing input before we apply this transformation
 * @param description human-readable description to use for this transformation
 * @param fTransform transformation function
 * @returns the same type as was passed in for `Base`, but applies the changes.
 */
export function transformer<T, TYPE extends SmartType<T>>(
    upstream: TYPE,
    description: string,
    fTransform: (x: T) => T
): typeof upstream {
    const UpstreamClass = upstream.constructor as ConcreteConstructor<ClassOf<typeof upstream>>;
    const cls = class extends UpstreamClass {
        public readonly description = description
        input(x: unknown, strict: boolean = true): T {
            return fTransform(upstream.input(x, strict))
        }
    }
    return new cls(...upstream.constructorArgs) as any
}

/**
 * Extracts the native type out of a SmartType.
 */
export type NativeFor<ST> =
    ST extends SmartType<infer T, any> ? T
    : ST extends SmartType<any, any>[] ? NativeFor<ValuesOf<ST>>
    : never;