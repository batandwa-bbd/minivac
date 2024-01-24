import { ComputeEngine } from "./engine/compute_engine.js";

const variablesListElem = document.getElementById("variablesList");
const queryInputElem = document.getElementById("queryInput");
const functionsListElem = document.getElementById("functionsList");

const engine = new ComputeEngine();

function updateVariablesList() {
  const childElemsHtml = [];
  for (const variable of engine.symbolsTable.variables) {
    childElemsHtml.push(`<li>${variable.name} = ${variable.asNumber()}</li>`);
  }

  variablesListElem.innerHTML = childElemsHtml.join("");
}

function updateFunctionsListElem() {
  const childElemsHtml = [];
  for (const callable of engine.symbolsTable.callables) {
    childElemsHtml.push(
      `<li>${callable.name}(x) = ${callable
        .asExpression()
        .debug(engine.symbolsTable)}</li>`
    );
  }

  functionsListElem.innerHTML = childElemsHtml.join("");
}

/**
 *
 * @param {string} query
 */
function doQuery(query) {
  let ans = 0;
  try {
    ans = engine.run(query);
  } catch (e) {
    ans = `${e}`;
    console.debug(e);
  }

  queryInputElem.value = `${ans}`;
  updateVariablesList();
  updateFunctionsListElem();
}

queryInputElem.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    doQuery(queryInputElem.value);
  }
});

updateVariablesList();
updateFunctionsListElem();
