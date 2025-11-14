import { ValidationError, SmartType, transformer } from "./common"

class SmartString extends SmartType<string, string> {

    constructor() {
        super("string")
    }

    input(x: unknown, strict: boolean = true): string {
        if (typeof x === "string") return x
        if (!strict) {
            return String(x)
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: string): string {
        return x
    }

    fromJSON(x: string): string {
        return this.input(x, true)
    }

    /** Validate that the string is at least this many characters. */
    minLen(min: number) {
        return transformer<string, this>(this,
            `minLen=${min}`,
            (s) => { if (s.length < min) throw new ValidationError(this, s); return s }
        )
    }

    trim() {
        return transformer<string, this>(this,
            `trim`,
            (s) => { return s.trim() }
        )
    }

    /** Validate that the string matches a regualar expression */
    match(re: RegExp) {
        return transformer<string, this>(this,
            `re=${re}`,
            (s) => { if (!re.test(s)) throw new ValidationError(this, s); return s }
        )
    }

    /** Make regex replacement, optionally failing if there is nothing to replace */
    replace(re: RegExp, replacement: string | ((substring: string, ...args: string[]) => string), failIfNoMatches: boolean = false) {
        return transformer<string, this>(this,
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

/** General string */
export function STR() {
    return new SmartString()
}

/** Non-empty string shortcut */
export function NONEMPTYSTR() {
    return STR().minLen(1)
}

/** String that validates as a Javascript identifier */
export function JSID() {
    return STR().match(/^[a-zA-Z_]\w*$/)
}

/** String that validates as an HTML/XHTML identifier */
export function WEBID() {
    return STR().match(/^[a-zA-Z][\w-]*$/)
}

/** String that validates as a URL */
export function URL() {
    return STR().match(/^https?:\/\/./)
}

