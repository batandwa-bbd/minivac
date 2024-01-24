const OperatorTokenTypes = {
  OperatorAdd: "opAdd",
  OperatorSubtract: "opSub",
  OperatorDivide: "opDiv",
  OperatorMultiply: "opMul",
  OperatorPower: "opPow",
  OperatorFactorial: "opFact",
  OperatorScientific: "opScientific",

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
OperatorPrecedence.set(OperatorTokenTypes.OperatorScientific, 90);
OperatorPrecedence.set(OperatorTokenTypes.OperatorDivide, 80);
OperatorPrecedence.set(OperatorTokenTypes.OperatorMultiply, 70);
OperatorPrecedence.set(OperatorTokenTypes.OperatorAdd, 60);
OperatorPrecedence.set(OperatorTokenTypes.OperatorSubtract, 50);

const OperatorType = new Map();
OperatorType.set(OperatorTokenTypes.OperatorFunctionCall, "unary");
OperatorType.set(OperatorTokenTypes.OperatorFactorial, "unary");
OperatorType.set(OperatorTokenTypes.OperatorPower, "binary");
OperatorType.set(OperatorTokenTypes.OperatorDivide, "binary");
OperatorType.set(OperatorTokenTypes.OperatorMultiply, "binary");
OperatorType.set(OperatorTokenTypes.OperatorAdd, "binary");
OperatorType.set(OperatorTokenTypes.OperatorSubtract, "binary");
OperatorType.set(OperatorTokenTypes.OperatorScientific, "binary");

class Token {
  /**
   *
   * @param {string} text
   * @param {string} type
   * @param {number} precedence
   * @param {"unary" | "binary"} opType
   */
  constructor(text, type, precedence, opType) {
    this.text = text;
    this.type = type;
    this.precedence = precedence;
    this.opType = opType;
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
    return Object.values(OperatorTokenTypes).indexOf(this.type) !== -1;
  }

  /**
   *
   * @returns {boolean}
   */
  isBinaryOperator() {
    return this.isOperator() && this.opType === "binary";
  }

  /**
   *
   * @returns {boolean}
   */
  isUnsignedNumber() {
    return this.type === TokenType.UnsignedNumber;
  }

  /**
   *
   * @returns {boolean}
   */
  isPlus() {
    return this.type === TokenType.OperatorAdd;
  }

  /**
   *
   * @returns {boolean}
   */
  isMinus() {
    return this.type === TokenType.OperatorSubtract;
  }

  /**
   *
   * @returns {boolean}
   */
  isPlusOrMinus() {
    return this.isPlus() || this.isMinus();
  }

  /**
   *
   * @returns {boolean}
   */
  isFactorial() {
    return this.isOperator() && this.type === TokenType.OperatorFactorial;
  }

  /**
   *
   * @returns {boolean}
   */
  isVariable() {
    return this.type === TokenType.Identifier;
  }

  /**
   *
   * @returns {boolean}
   */
  isFunctionCall() {
    return this.isOperator() && this.type === TokenType.OperatorFunctionCall;
  }

  isOpeningBracket() {
    return this.type === TokenType.PuncOpeningBracket;
  }

  isClosingBracket() {
    return this.type === TokenType.PuncClosingBracket;
  }
}

export class Tokeniser {
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
    out.set(/^[a-z]+/, TokenType.Identifier);
    out.set(/^\(/, TokenType.PuncOpeningBracket);
    out.set(/^\)/, TokenType.PuncClosingBracket);

    out.set(/^\+/, TokenType.OperatorAdd);
    out.set(/^-/, TokenType.OperatorSubtract);
    out.set(/^\*/, TokenType.OperatorMultiply);
    out.set(/^\//, TokenType.OperatorDivide);
    out.set(/^!/, TokenType.OperatorFactorial);
    out.set(/^\^/, TokenType.OperatorPower);
    out.set(/^\E/, TokenType.OperatorScientific);

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
        let opType = "unary";

        if (
          this._isIdentifier(tokenType) &&
          this._isAFunction(text, availableFunctions)
        ) {
          tokenType = TokenType.OperatorFunctionCall;
        }

        if (this._isOperator(tokenType)) {
          precedence = OperatorPrecedence.get(tokenType);
          opType = OperatorType.get(tokenType);
        }

        return new Token(text, tokenType, precedence, opType);
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

export class Variable {
  /**
   *
   * @param {string} name
   * @param {number | Expression} value
   * @param {boolean} isFinal
   */
  constructor(name, value, isFinal) {
    this.name = name;
    this.value = value;
    this.isFinal = isFinal;
  }

  /**
   * @param {number | Expression} newValue
   */
  setTo(newValue) {
    if (this.isFinal) {
      throw new Error(`Cannot modify ${this.name}`);
    } else {
      this.value = newValue;
    }
  }

  /**
   *
   * @returns {number}
   */
  asNumber() {
    return this.value;
  }

  /**
   *
   * @returns {Expression}
   */
  asExpression() {
    return this.value;
  }
}

class Callable extends Variable {
  constructor(name, expression, isFinal) {
    super(name, expression, isFinal);
  }
}

export class SymbolsTable {
  /**
   *
   * @param {Array<Variable>} variables
   * @param {Array<Callable>} callables
   */
  constructor(variables, callables) {
    this.variables = variables;
    this.callables = callables;
  }

  /**
   *
   * @param {string} symbolName
   * @param {number | Expression} value
   */
  setSymbol(symbolName, value) {
    if (value instanceof Expression) {
      let exists = false;

      this.callables.forEach((callable) => {
        if (callable.name === symbolName) {
          callable.setTo(value);
          exists = true;
        }
      });

      if (!exists) {
        this.callables.push(new Callable(symbolName, value, false));
      }
    } else {
      let exists = false;

      this.variables.forEach((variable) => {
        if (variable.name === symbolName) {
          variable.setTo(value);
          exists = true;
        }
      });

      if (!exists) {
        this.variables.push(new Variable(symbolName, value, false));
      }
    }
  }

  /**
   *
   * @param {string} name
   *
   * @returns {Variable}
   */
  getVariable(name) {
    const out = this.variables.filter((variable) => variable.name === name);
    if (out.length > 0) {
      return out[0];
    } else {
      throw new Error(`${name} is not a stored variable`);
    }
  }

  /**
   *
   * @param {string} name
   *
   * @returns {Callable}
   */
  getCallable(name) {
    const out = this.callables.filter((callable) => callable.name === name);
    if (out.length > 0) {
      return out[0];
    } else {
      throw new Error(`${name} is not a stored function`);
    }
  }
}

export class Expression {
  /**
   * @param {SymbolsTable} symbolsTable
   *
   * @returns {number}
   */
  eval(symbolsTable) {
    throw new Error("Unimplemented method.");
  }

  /**
   *
   * @param {SymbolsTable} symbolsTable
   *
   * @returns {string}
   */
  debug(symbolsTable) {
    throw new Error("Unimplemented method.");
  }

  /**
   *
   * @param {Expression} operand
   * @param {Token} operatorToken
   *
   * @returns {Expression}
   */
  static buildUnaryExpression(operand, operatorToken) {
    if (operatorToken.isFactorial()) {
      return new FactorialExpression(operand);
    } else {
      throw new Error("Unknown unary operator");
    }
  }

  /**
   *
   * @param {Token} operatorToken
   * @param {Expression} left
   * @param {Expression} right
   *
   * @returns {Expression}
   */
  static buildBinaryExpression(operatorToken, left, right) {
    return new BinaryExpression(operatorToken.text, left, right);
  }

  /**
   *
   * @param {number} value
   *
   * @returns {Expression}
   */
  static buildConstantExpression(value) {
    return new ConstantExpression(value);
  }

  /**
   *
   * @param {string} value
   *
   * @returns {Expression}
   */
  static buildVariableExpression(varName) {
    return new VariableExpression(varName);
  }

  /**
   *
   * @param {string} functionName
   * @param {Expression} argument
   *
   * @returns {Expression}
   */
  static buildFunctionCallExpression(functionName, argument) {
    return new FunctionCallExpression(functionName, argument);
  }
}

class FactorialExpression extends Expression {
  /**
   *
   * @param {Expression} operand
   */
  constructor(operand) {
    super();
    this.operand = operand;
  }

  eval(symbolsTable) {
    const value = this.operand.eval(symbolsTable);
    return this.factorialise(value);
  }

  debug() {
    const opDebug = this.operand.debug();
    return `(${opDebug}!)`;
  }

  /**
   *
   * @param {number} value
   */
  factorialise(value) {
    if (value < 0) {
      return -1;
    } else if (value === 0) {
      return 1;
    } else {
      return this.factorialise(value - 1) * value;
    }
  }
}

class BinaryExpression extends Expression {
  /**
   *
   * @param {string} operator
   * @param {Expression} left
   * @param {Expression} right
   */
  constructor(operator, left, right) {
    super();

    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  eval(symbolsTable) {
    const leftVal = this.left.eval(symbolsTable);
    const rightVal = this.right.eval(symbolsTable);

    switch (this.operator) {
      case "+":
        return leftVal + rightVal;
      case "-":
        return leftVal - rightVal;
      case "*":
        return leftVal * rightVal;
      case "/":
        return this.guidedDivide(leftVal, rightVal);
      case "^":
        return Math.pow(leftVal, rightVal);
      case "E":
        return leftVal * Math.pow(10, rightVal);
    }

    return -1;
  }

  debug() {
    const leftDebug = this.left.debug();
    const rightDebug = this.right.debug();
    return `(${leftDebug}${this.operator}${rightDebug})`;
  }

  /**
   *
   * @param {number} leftVal
   * @param {number} rightVal
   *
   * @returns {number}
   */
  guidedDivide(leftVal, rightVal) {
    if (Math.abs(rightVal) < 0.00000001) {
      throw new Error("Cannot divide by zero.");
    } else {
      return leftVal / rightVal;
    }
  }
}

class ConstantExpression extends Expression {
  /**
   *
   * @param {number} value
   */
  constructor(value) {
    super();

    this.value = value;
  }

  eval(symbolsTable) {
    return this.value;
  }

  debug() {
    return this.value;
  }
}

class VariableExpression extends Expression {
  /**
   *
   * @param {string} varName
   */
  constructor(varName) {
    super();

    this.varName = varName;
  }

  /**
   *
   * @param {SymbolsTable} symbolsTable
   *
   * @returns {number}
   */
  eval(symbolsTable) {
    const symbol = symbolsTable.getVariable(this.varName);
    return symbol.asNumber();
  }

  debug() {
    return this.varName;
  }
}

class FunctionCallExpression extends Expression {
  /**
   *
   * @param {string} functionName
   * @param {Expression} argument
   */
  constructor(functionName, argument) {
    super();

    this.functionName = functionName;
    this.argument = argument;
  }

  /**
   *
   * @param {SymbolsTable} symbolsTable
   *
   * @returns {number}
   */
  eval(symbolsTable) {
    const argValue = this.argument.eval(symbolsTable);
    symbolsTable.setSymbol("x", argValue);
    const funcExpression = symbolsTable
      .getCallable(this.functionName)
      .asExpression();

    return funcExpression.eval(symbolsTable);
  }

  debug() {
    const opDebug = this.argument.debug();
    return `${this.functionName}\(${opDebug}\)`;
  }
}

class ParsingResult {
  /**
   *
   * @param {Expression} expression
   * @param {nextStartIndex} nextStartIndex
   */
  constructor(expression, nextStartIndex) {
    this.expression = expression;
    this.nextStartIndex = nextStartIndex;
  }
}

export class Parser {
  /**
   *
   * @param {Tokeniser} tokeniser
   */
  constructor(tokeniser) {
    this.tokeniser = tokeniser;
  }

  /**
   *
   * @param {string} text
   * @param {SymbolsTable} symbolsTable
   *
   * @returns {number}
   */
  evalString(text, symbolsTable) {
    const functionNames = symbolsTable.callables.map(
      (callable) => callable.name
    );
    const tokens = this.tokeniser.tokenise(text, functionNames);

    return this.parse(0, tokens).expression.eval(symbolsTable);
  }

  /**
   * Parses a new expression from given startIndex.
   *
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {ParsingResult | null}
   */
  parse(startIndex, tokens) {
    if (startIndex >= tokens.length) return null;

    const token = tokens[startIndex];
    if (token.isPlusOrMinus()) {
      // This is a sign operator which is the same as adding to zero
      // or subtracting from zero.
      const left = Expression.buildConstantExpression(0);
      const right = this.nextAsRightOperand(startIndex + 1, tokens);
      const expression = Expression.buildBinaryExpression(
        token,
        left,
        right.expression
      );

      return this.continueParsing(expression, right.nextStartIndex, tokens);
    } else if (token.isUnsignedNumber()) {
      const left = Expression.buildConstantExpression(
        Number.parseFloat(token.text)
      );
      return this.continueParsing(left, startIndex + 1, tokens);
    } else if (token.isVariable()) {
      const left = Expression.buildVariableExpression(token.text);
      return this.continueParsing(left, startIndex + 1, tokens);
    } else if (token.isFunctionCall()) {
      const left = this.parseFunctionCall(startIndex, tokens);
      return this.continueParsing(left.expression, left.nextStartIndex, tokens);
    } else if (token.isOpeningBracket()) {
      const left = this.parseBrackets(startIndex, tokens);
      return this.continueParsing(left.expression, left.nextStartIndex, tokens);
    } else {
      throw new Error(`Expression cannot start with ${token.text}`);
    }
  }

  /**
   *
   * @param {Expression} leftExpression
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {ParsingResult}
   */
  continueParsing(leftExpression, startIndex, tokens) {
    if (startIndex >= tokens.length) {
      // All tokens have been parsed.
      const zero = Expression.buildConstantExpression(0);
      const addToken = new Token(
        "+",
        TokenType.OperatorAdd,
        OperatorPrecedence.get(TokenType.OperatorAdd),
        "binary"
      );

      const expression = Expression.buildBinaryExpression(
        addToken,
        leftExpression,
        zero
      );

      return new ParsingResult(expression, startIndex);
    }

    const token = tokens[startIndex];

    if (token.isOperator() || token.isClosingBracket()) {
      if (token.isClosingBracket()) {
        return new ParsingResult(leftExpression, startIndex);
      } else if (token.isFactorial()) {
        // Factorial is postfix operator so needs special handling.
        const left = Expression.buildUnaryExpression(leftExpression, token);
        return this.continueParsing(left, startIndex + 1, tokens);
      } else if (token.isBinaryOperator()) {
        const nextOperator = this._nextOperator(startIndex + 1, tokens);

        let right = null;

        if (
          nextOperator === null ||
          token.hasHigherPrecedenceThan(nextOperator)
        ) {
          // Evaluate this first.
          right = this.nextAsRightOperand(startIndex + 1, tokens);
        } else {
          // Evaluate right first.
          right = this.parse(startIndex + 1, tokens);
        }

        const expression = Expression.buildBinaryExpression(
          token,
          leftExpression,
          right.expression
        );
        return this.continueParsing(expression, right.nextStartIndex, tokens);
      }
    } else {
      throw new Error("Expected an operator.");
    }
  }

  /**
   *
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {ParsingResult}
   */
  nextAsRightOperand(startIndex, tokens) {
    if (startIndex >= tokens.length) {
      throw new Error("Binary operator requires two operands");
    }

    const token = tokens[startIndex];
    if (token.isVariable() || token.isUnsignedNumber()) {
      const operandExpression = token.isVariable()
        ? Expression.buildVariableExpression(token)
        : Expression.buildConstantExpression(Number.parseFloat(token.text));

      return new ParsingResult(operandExpression, startIndex + 1);
    } else if (token.isOpeningBracket()) {
      return this.parseBrackets(startIndex, tokens);
    } else if (token.isFunctionCall()) {
      return this.parseFunctionCall(startIndex, tokens);
    } else if (token.isPlusOrMinus()) {
      // Signed operand
      const left = Expression.buildConstantExpression(0);
      const right = this.nextAsRightOperand(startIndex + 1, tokens);
      const expression = Expression.buildBinaryExpression(
        token,
        left,
        right.expression
      );

      return new ParsingResult(expression, right.nextStartIndex);
    } else {
      throw new Error(`Unexpected operand ${token.text}`);
    }
  }

  /**
   *
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {ParsingResult}
   */
  parseBrackets(startIndex, tokens) {
    // Add 1 to skip opening bracket.
    const right = this.parse(startIndex + 1, tokens);
    if (right) {
      if (
        right.nextStartIndex >= tokens.length ||
        !tokens[right.nextStartIndex].isClosingBracket()
      ) {
        throw new Error("Unmatched brackets.");
      } else {
        // Add 1 to skip closing bracket.
        return new ParsingResult(right.expression, right.nextStartIndex + 1);
      }
    } else {
      throw new Error("Unmatched brackets.");
    }
  }

  /**
   *
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {ParsingResult}
   */
  parseFunctionCall(startIndex, tokens) {
    // f(x) has 4 tokens at minumum
    if (startIndex + 3 >= tokens.length) {
      throw new Error("Invalid function call.");
    }

    const arg = this.parseBrackets(startIndex + 1, tokens);
    const funcCallExpression = Expression.buildFunctionCallExpression(
      tokens[startIndex].text,
      arg.expression
    );

    return new ParsingResult(funcCallExpression, arg.nextStartIndex);
  }

  /**
   * Returns the first operator token from given index.
   *
   * Returns null when there are no more operators.
   *
   * @param {number} startIndex
   * @param {Array<Token>} tokens
   *
   * @returns {Token | null}
   */
  _nextOperator(startIndex, tokens) {
    for (let iii = startIndex; iii < tokens.length; iii++) {
      if (tokens[iii].isOperator()) {
        return tokens[iii];
      }
    }

    return null;
  }
}
