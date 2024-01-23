const OperatorTokenTypes = {
  OperatorAdd: "opAdd",
  OperatorSubtract: "opSub",
  OperatorDivide: "opDiv",
  OperatorMultiply: "opMul",
  OperatorPower: "opPow",
  OperatorFactorial: "opFact",

  // Treating function calls as operators.
  OperatorFunctionCall: "opFuncCall",
};

const TokenType = {
  UnsignedNumber: "unsignedNumber",
  Identifier: "identifier",

  // Punctuation
  PuncOpeningBracket: "openingBracket",
  PuncClosingBracket: "closingBracket",

  ...OperatorTokenTypes,
};

// Following BODMAS rule. This means brackets will have precedence
// over all of them.
const OperatorPrecedence = new Map();
OperatorPrecedence.set(OperatorTokenTypes.OperatorFunctionCall, 110);
OperatorPrecedence.set(OperatorTokenTypes.OperatorFactorial, 100);
OperatorPrecedence.set(OperatorTokenTypes.OperatorPower, 90);
OperatorPrecedence.set(OperatorTokenTypes.OperatorDivide, 80);
OperatorPrecedence.set(OperatorTokenTypes.OperatorMultiply, 70);
OperatorPrecedence.set(OperatorTokenTypes.OperatorAdd, 60);
OperatorPrecedence.set(OperatorTokenTypes.OperatorSubtract, 50);

class Token {
  /**
   *
   * @param {string} text
   * @param {string} type
   * @param {number} precedence
   */
  constructor(text, type, precedence) {
    this.text = text;
    this.type = type;
    this.precedence = precedence;
  }

  /**
   * Yields true only if this token has higher precedence than anotherToken.
   *
   * Assumes this is an operator token.
   *
   * @param {Token} anotherToken
   *
   * @returns {boolean}
   */
  hasHigherPrecedenceThan(anotherToken) {
    return this.precedence > anotherToken.precedence;
  }

  /**
   *
   * @returns {boolean}
   */
  isOperator() {
    return OperatorTokenTypes[this.type] !== undefined;
  }
}

class Tokeniser {
  /**
   * A matcher is a regex that can match a token type.
   *
   * All matchers match from the beginning of a string.
   *
   * @returns {Map<RegExp, string>}
   */
  _getMatchers() {
    const out = new Map();
    out.set(/^\d+(\.\d+)?/, TokenType.UnsignedNumber);
    out.set(/^[a-zA-Z]+/, TokenType.Identifier);
    out.set(/^\(/, TokenType.PuncOpeningBracket);
    out.set(/^\)/, TokenType.PuncClosingBracket);

    out.set(/^\+/, TokenType.OperatorAdd);
    out.set(/^-/, TokenType.OperatorSubtract);
    out.set(/^\*/, TokenType.OperatorMultiply);
    out.set(/^\//, TokenType.OperatorDivide);
    out.set(/^!/, TokenType.OperatorFactorial);
    out.set(/^\^/, TokenType.OperatorPower);

    return out;
  }

  /**
   * Parses the given string to a list of tokens.
   *
   * The availableFunctions array allows the tokeniser to mark identifiers whose names
   * are in the array as function calls rather than just identifiers.
   *
   * This means all Identifier tokens remaining will be variables or constants.
   *
   * @param {string} input
   * @param {Array<string>} availableFunctions
   *
   * @returns {Array<Token>}
   */
  tokenise(input, availableFunctions) {
    const out = [];

    let nextToken = null;
    while ((nextToken = this._nextMatchingToken(input, availableFunctions))) {
      out.push(nextToken);

      // Push out already parsed input.
      input = input.replace(nextToken.text, "").trim();
    }

    return out;
  }

  /**
   *
   * @param {string} input
   * @param {Array<string>} availableFunctions
   *
   * @returns {Token | null}
   */
  _nextMatchingToken(input, availableFunctions) {
    const matchers = this._getMatchers();
    for (const matcher of matchers.keys()) {
      const match = matcher.exec(input);

      if (match) {
        let precedence = 0;
        let tokenType = matchers.get(matcher);
        const text = match[0];

        if (
          this._isIdentifier(tokenType) &&
          this._isAFunction(text, availableFunctions)
        ) {
          tokenType = TokenType.OperatorFunctionCall;
        }

        if (this._isOperator(tokenType)) {
          precedence = OperatorPrecedence.get(tokenType);
        }

        return new Token(text, tokenType, precedence);
      }
    }

    if (input.length > 0) {
      throw new Error("Unknown tokens in source.");
    } else {
      return null;
    }
  }

  /**
   *
   * @param {string} tokenType
   *
   * @returns {boolean}
   */
  _isOperator(tokenType) {
    return Object.values(OperatorTokenTypes).indexOf(tokenType) !== -1;
  }

  /**
   *
   * @param {string} tokenType
   *
   * @returns {boolean}
   */
  _isIdentifier(tokenType) {
    return tokenType === TokenType.Identifier;
  }

  /**
   *
   * @param {string} identifierName
   * @param {Array<string>} availableFunctions
   *
   * @returns {boolean}
   */
  _isAFunction(identifierName, availableFunctions) {
    return availableFunctions.indexOf(identifierName) !== -1;
  }
}

const tokeniser = new Tokeniser();
console.log(tokeniser.tokenise("vec(5) * 6!", []));
