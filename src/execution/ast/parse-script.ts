import { parse, type Program } from "acorn";

export function parseScript(source: string): Program {
  return parse(source, {
    ecmaVersion: "latest",
    sourceType: "script",
    locations: true,
    allowReturnOutsideFunction: true,
  });
}
