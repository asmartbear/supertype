import { NOOP_TRANSFORM, ValidationError, INativeParser, SmartType } from "./common"

class SmartString<INPUT> extends SmartType<INPUT, string> {

    /** Validate that the string is at least this many characters. */
    minLen(min: number) {
        return new SmartString(this,
            `minLen=${min}`,
            (s) => { if (s.length < min) throw new ValidationError(this, s); return s }
        )
    }

    /** Validate that the string matches a regualar expression */
    match(re: RegExp) {
        return new SmartString(this,
            `re=${re}`,
            (s) => { if (!re.test(s)) throw new ValidationError(this, s); return s }
        )
    }

    /** Make regex replacement, optionally failing if there is nothing to replace */
    replace(re: RegExp, replacement: string | ((substring: string, ...args: string[]) => string), failIfNoMatches: boolean = false) {
        return new SmartString(this,
            `re=${re}->${typeof replacement === "string" ? replacement : "[function]"}`,
            (s) => {
                const result = s.replaceAll(re, replacement as any)
                if (failIfNoMatches && result == s) {        // if changed, it cannot be a match failure
                    if (!s.match(re)) throw new ValidationError(this, s, "No match")
                }
                return result
            }
        )
    }
}

/** Inputs anything into a number. */
class NativeString implements INativeParser<string> {
    public readonly description = "string"

    input(x: unknown, strict: boolean): string {
        if (typeof x === "string") return x
        if (!strict) {
            return String(x)
        }
        throw new ValidationError(this, x)
    }

    static SINGLETON = new NativeString()
}

/** Generic string */
export function STR() {
    return new SmartString(NativeString.SINGLETON, NativeString.SINGLETON.description, NOOP_TRANSFORM)
}



