/* Copyright(C) 2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * parameter-checker.ts: SwitchBot BLE API registration.
 */
type Rule = {
  required?: boolean;
  min?: number;
  max?: number;
  minBytes?: number;
  maxBytes?: number;
  pattern?: RegExp;
  enum?: any[];
  type?: 'float' | 'integer' | 'boolean' | 'array' | 'object' | 'string';
};

export class ParameterChecker {

  _error: Error | null;
  static error: any;
  constructor() {
    this._error = null;
  }

  get error() {
    // ----------------------------------
    // Error
    // {
    //   code: 'TYPE_INVALID',
    //   message: 'The `age` must be an integer.'
    //   name: 'age',
    // }
    // ---------------------------------
    return this._error;
  }

  static isSpecified(value: unknown) {
    return value === void 0 ? false : true;
  }

  /* ------------------------------------------------------------------
   * check(obj, rule, required)
   * - Check if the specified object contains valid values
   *
   * [Arguments]
   * - obj      | Object  | Required | Object including parameters you want to check
   * - rules    | Object  | Required | Object including rules for the parameters
   * - required | Boolean | Optional | Flag whether the `obj` is required or not.
   *            |         |          | The default is `false`
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   *
   * [Usage]
   * const valid = parameterChecker.check(params, {
   *   level: {
   *     required: false,
   *     type: 'integer',
   *     max: 100
   *   },
   *   greeting: {
   *     required: true, // But an empty string is allowed.
   *     type: 'string',
   *     max: 20 // the number of characters must be up to 20.
   *   }
   * });
   * if(!valid) {
   *   const e = parameterChecker.error.message;
   *   throw new Error(message);
   * }
   * ---------------------------------------------------------------- */
  static check(obj: Record<string, unknown>, rules: {[key: string]: Rule}, required: boolean) {
    this.error;
    if (required) {
      if (!this.isSpecified(obj)) {
        this.error = {
          code: 'MISSING_REQUIRED',
          message: 'The first argument is missing.',
        };
        return false;
      }
    } else {
      if (!obj) {
        return true;
      }
    }

    if (!this.isObject(obj, {})) {
      this.error = {
        code: 'MISSING_REQUIRED',
        message: 'The first argument is missing.',
      };
      return false;
    }

    let result = true;
    const name_list = Object.keys(rules);

    for (let i = 0; i < name_list.length; i++) {
      const name = name_list[i];
      const v = obj[name];
      let rule: Rule = rules[name as keyof typeof rules] as Rule;

      if (!rule) {
        rule = {};
      }
      if (!this.isSpecified(v)) {
        if (rule.required) {
          result = false;
          this.error = {
            code: 'MISSING_REQUIRED',
            message: 'The `' + name + '` is required.',
          };
          break;
        } else {
          continue;
        }
      }

      if (rule.type === 'float') {
        result = this.isFloat(v, rule, name);
      } else if (rule.type === 'integer') {
        result = this.isInteger(v, rule, name);
      } else if (rule.type === 'boolean') {
        result = this.isBoolean(v, rule, name);
      } else if (rule.type === 'array') {
        result = this.isArray(v, rule, name);
      } else if (rule.type === 'object') {
        result = this.isObject(v, rule, name);
      } else if (rule.type === 'string') {
        result = this.isString(v, rule, name);
      } else {
        result = false;
        this.error = {
          code: 'TYPE_UNKNOWN',
          message:
            'The rule specified for the `' +
            name +
            '` includes an unknown type: ' +
            rule.type,
        };
      }

      if (result === false) {
        this.error.name = name;
        break;
      }
    }

    return result;
  }

  /* ------------------------------------------------------------------
   * isFloat(value, rule, name)
   * - Check if the value is a float
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.
   *   - min      | Float   | Optional | Minimum number
   *   - max      | Float   | Optional | Maximum number
   *   - enum     | Array   | Optional | list of possible values
   * - name       | String  | Optional | Parameter name
   *
   * If non-number value is specified to the `min` or `max`,
   * they will be ignored.
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isFloat(value: unknown, rule: Rule, name = 'value'): boolean {
    this.error;

    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (typeof value !== 'number') {
      this.error = {
        code: 'TYPE_INVALID',
        message: 'The `' + name + '` must be a number (integer or float).',
      };
      return false;
    }

    if (typeof rule.min === 'number') {
      if (value < rule.min) {
        this.error = {
          code: 'VALUE_UNDERFLOW',
          message:
            'The `' +
            name +
            '` must be grater than or equal to ' +
            rule.min +
            '.',
        };
        return false;
      }
    }
    if (typeof rule.max === 'number') {
      if (value > rule.max) {
        this.error = {
          code: 'VALUE_OVERFLOW',
          message:
            'The `' +
            name +
            '` must be less than or equal to ' +
            rule.max +
            '.',
        };
        return false;
      }
    }
    if (Array.isArray(rule.enum) && rule.enum.length > 0) {
      if (rule.enum.indexOf(value) === -1) {
        this.error = {
          code: 'ENUM_UNMATCH',
          message:
            'The `' +
            name +
            '` must be any one of ' +
            JSON.stringify(rule.enum) +
            '.',
        };
        return false;
      }
    }

    return true;
  }

  /* ------------------------------------------------------------------
   * isInteger(value, rule)
   * - Check if the value is an integer
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.|
   *   - min      | Float   | Optional | Minimum number
   *   - max      | Float   | Optional | Maximum number
   *   - enum     | Array   | Optional | list of possible values
   * - name       | String  | Optional | Parameter name
   *
   * If non-number value is specified to the `min` or `max`,
   * they will be ignored.
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isInteger(value: unknown, rule: Rule, name = 'value') {
    this.error = null;

    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (this.isFloat(value, rule)) {
      if ((value as number) % 1 === 0) {
        return true;
      } else {
        this.error = {
          code: 'TYPE_INVALID',
          message: 'The `' + name + '` must be an integer.',
        };
        return false;
      }
    } else {
      return false;
    }
  }

  /* ------------------------------------------------------------------
   * isBoolean(value, rule, name)
   * - Check if the value is a boolean.
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.
   * - name       | String  | Optional | Parameter name
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isBoolean(value: unknown, rule: Rule, name = 'value') {
    this.error = null;

    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (typeof value !== 'boolean') {
      this.error = {
        code: 'TYPE_INVALID',
        message: 'The `' + name + '` must be boolean.',
      };
      return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------
   * isObject(value)
   * - Check if the value is an object
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.
   * - name       | String  | Optional | Parameter name
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isObject(value: unknown, rule: Rule, name = 'value') {
    this.error = null;
    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.error = {
        code: 'TYPE_INVALID',
        message: 'The `' + name + '` must be an object.',
      };
      return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------
   * isArray(value, rule, name)
   * - Check if the value is an `Array` object
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.
   *   - min      | Integer | Optional | Minimum number of elements in the array
   *   - max      | Integer | Optional | Maximum number of elements in the array
   * - name       | String  | Optional | Parameter name
   *
   * If non-number value is specified to the `min` or `max`,
   * they will be ignored.
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isArray(value: unknown, rule: Rule, name = 'value') {
    this.error = null;

    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (!Array.isArray(value)) {
      this.error = {
        code: 'TYPE_INVALID',
        message: 'The value must be an array.',
      };
      return false;
    }

    if (typeof rule.min === 'number') {
      if (value.length < rule.min) {
        this.error = {
          code: 'LENGTH_UNDERFLOW',
          message:
            'The number of characters in the `' +
            name +
            '` must be grater than or equal to ' +
            rule.min +
            '.',
        };
        return false;
      }
    }
    if (typeof rule.max === 'number') {
      if (value.length > rule.max) {
        this.error = {
          code: 'LENGTH_OVERFLOW',
          message:
            'The number of characters in the `' +
            name +
            '` must be less than or equal to ' +
            rule.max +
            '.',
        };
        return false;
      }
    }

    return true;
  }

  /* ------------------------------------------------------------------
   * isString(value, rule, name)
   * - Check if the value is an `Array` object
   *
   * [Arguments]
   * - value      | Any     | Required | The value you want to check
   * - rule       | Object  | Optional |
   *   - required | Boolean | Optional | Required or not. Default is `false`.
   *   - min      | Integer | Optional | Minimum number of characters in the string
   *   - max      | Integer | Optional | Maximum number of characters in the string
   *   - minBytes | Integer | Optional | Minimum bytes of the string (UTF-8)
   *   - maxBytes | Integer | Optional | Maximum bytes of the string (UTF-8)
   *   - pattern  | RegExp  | Optional | Pattern of the string
   *   - enum     | Array   | Optional | list of possible values
   * - name       | String  | Optional | Parameter name
   *
   * If non-number value is specified to the `min` or `max`,
   * they will be ignored.
   *
   * [Return value]
   * - If the value is valid, this method will return `true`.
   * - If the value is invalid, this method will return `false` and
   *   an `Error` object will be set to `this._error`.
   * ---------------------------------------------------------------- */
  static isString(value: unknown, rule: Rule, name = 'value') {
    this.error = null;

    if (!rule.required && !this.isSpecified(value)) {
      return true;
    }

    if (typeof value !== 'string') {
      this.error = {
        code: 'TYPE_INVALID',
        message: 'The value must be a string.',
      };
      return false;
    }

    if (typeof rule.min === 'number') {
      if (value.length < rule.min) {
        this.error = {
          code: 'LENGTH_UNDERFLOW',
          message:
            'The number of characters in the `' +
            name +
            '` must be grater than or equal to ' +
            rule.min +
            '.',
        };
        return false;
      }
    }
    if (typeof rule.max === 'number') {
      if (value.length > rule.max) {
        this.error = {
          code: 'LENGTH_OVERFLOW',
          message:
            'The number of characters in the `' +
            name +
            '` must be less than or equal to ' +
            rule.max +
            '.',
        };
        return false;
      }
    }
    if (typeof rule.minBytes === 'number') {
      const blen = Buffer.from(value, 'utf8').length;
      if (blen < rule.minBytes) {
        this.error = {
          code: 'LENGTH_UNDERFLOW',
          message:
            'The byte length of the `' +
            name +
            '` (' +
            blen +
            ' bytes) must be grater than or equal to ' +
            rule.minBytes +
            ' bytes.',
        };
        return false;
      }
    }
    if (typeof rule.maxBytes === 'number') {
      const blen = Buffer.from(value, 'utf8').length;
      if (blen > rule.maxBytes) {
        this.error = {
          code: 'LENGTH_OVERFLOW',
          message:
            'The byte length of the `' +
            name +
            '` (' +
            blen +
            ' bytes) must be less than or equal to ' +
            rule.maxBytes +
            ' bytes.',
        };
        return false;
      }
    }
    if (rule.pattern instanceof RegExp) {
      if (!rule.pattern.test(value)) {
        this.error = {
          code: 'PATTERN_UNMATCH',
          message: 'The `' + name + '` does not conform with the pattern.',
        };
        return false;
      }
    }
    if (Array.isArray(rule.enum) && rule.enum.length > 0) {
      if (rule.enum.indexOf(value) === -1) {
        this.error = {
          code: 'ENUM_UNMATCH',
          message:
            'The `' +
            name +
            '` must be any one of ' +
            JSON.stringify(rule.enum) +
            '.',
        };
        return false;
      }
    }

    return true;
  }
}
