import { Parser, SymbolsTable, Tokeniser, Variable } from "./parser.js";

/**
 * @returns {SymbolsTable}
 */
function getDefaultSymbolsTable() {
  // TODO: Add variables and constants
  return new SymbolsTable(
    [
      new Variable("ans", 0, false),
      new Variable("preans", 0, false),

      new Variable("pi", Math.PI, true),
    ],
    []
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
