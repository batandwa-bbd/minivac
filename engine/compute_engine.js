import {
  Callable,
  Expression,
  Parser,
  SymbolsTable,
  Tokeniser,
  Variable,
} from "./parser.js";

class SinExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.sin(x);
  }

  debug() {
    return "The sine of x";
  }
}

class ASinExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.asin(x);
  }

  debug() {
    return "The arcsine of x";
  }
}

class ASinhExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.asinh(x);
  }

  debug() {
    return "The hyperbolic arcsine of x";
  }
}

class CosExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.cos(x);
  }

  debug() {
    return "The cosine of x";
  }
}

class ACosExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.acos(x);
  }

  debug() {
    return "The arccosine of x";
  }
}

class ACoshExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.acosh(x);
  }

  debug() {
    return "The hyperbolic arccosine of x";
  }
}

class TanExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.tan(x);
  }

  debug() {
    return "The tangent of x";
  }
}

class ATanExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.atan(x);
  }

  debug() {
    return "The arctangent of x";
  }
}

class ATanhExpr extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return Math.atanh(x);
  }

  debug() {
    return "The hyperbolic arctangent of x";
  }
}

class DegToRad extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return (x * Math.PI) / 180;
  }

  debug() {
    return "The angle, x, in radians. All trig functions use radians";
  }
}

class RadToDeg extends Expression {
  eval(symbolsTable) {
    const x = this.getXValue(symbolsTable);
    return (x * 180) / Math.PI;
  }

  debug() {
    return "The angle, x, in degrees. Some trig expressions will return radians.";
  }
}

/**
 * @returns {SymbolsTable}
 */
function getDefaultSymbolsTable() {
  return new SymbolsTable(
    [
      new Variable("ans", 0, false),
      new Variable("preans", 0, false),

      new Variable("pi", Math.PI, true),
      new Variable("e", Math.E, true),
    ],
    [
      new Callable("sin", new SinExpr(), true),
      new Callable("asin", new ASinExpr(), true),
      new Callable("asinh", new ASinhExpr(), true),

      new Callable("cos", new CosExpr(), true),
      new Callable("acos", new ACosExpr(), true),
      new Callable("acosh", new ACoshExpr(), true),

      new Callable("tan", new TanExpr(), true),
      new Callable("atan", new ATanExpr(), true),
      new Callable("atanh", new ATanhExpr(), true),

      new Callable("rad", new DegToRad(), true),
      new Callable("deg", new RadToDeg(), true),
    ]
  );
}

// Or Shell whatever you want to call it.
export class ComputeEngine {
  constructor() {
    this.symbolsTable = getDefaultSymbolsTable();
    this.tokeniser = new Tokeniser();
    this.parser = new Parser(this.tokeniser);
  }

  /**
   *
   * @param {string} text
   *
   * @returns {number}
   */
  run(text) {
    if (text.indexOf("=") !== -1) {
      const units = text.split("=");

      return this._handleAssignment(units[0].trim(), units[1].trim());
    } else {
      const ret = this.parser.evalString(text, this.symbolsTable);
      this.symbolsTable.setSymbol(
        "preans",
        this.symbolsTable.getVariable("ans").asNumber()
      );
      this.symbolsTable.setSymbol("ans", ret);

      return ret;
    }
  }

  /**
   *
   * @param {string} left
   * @param {string} right
   *
   * @returns {number}
   */
  _handleAssignment(left, right) {
    const funcRegExp = /^[a-z]+\(x\)$/;
    const varNameRegExp = /^[a-z]+$/;

    if (funcRegExp.exec(left)) {
      const functionName = left.split("(")[0];
      const expression = this._getExpression(right);

      this.symbolsTable.setSymbol(functionName, expression);
    } else if (varNameRegExp.exec(left)) {
      const varName = left;
      const value = this.parser.evalString(right, this.symbolsTable);

      this.symbolsTable.setSymbol(varName, value);
    } else {
      throw new Error("Unknown assignment.");
    }

    return 0;
  }

  /**
   *
   * @param {string} text
   *
   * @returns {Expression}
   */
  _getExpression(text) {
    const availableFunctions = this.symbolsTable.callables.map(
      (callable) => callable.name
    );
    const tokens = this.tokeniser.tokenise(text, availableFunctions);

    return this.parser.parse(0, tokens).expression;
  }
}
