"use strict";
const ALL_VAR = {"x": 0, "y": 1, "z": 2};

const ALL_CONST = {
    "pi": Math.PI,
    "e": Math.E,
    "one": 1,
    "two": 2
}

const operation = f => (...args) => (x, y = 0, z = 0) => {
    let newArgs = [];
    args.map(function (arg, i) {
        newArgs[i] = args[i](x, y, z);
    });
    return f(...newArgs);
};

const iff = operation((a, b, c) => (a >= 0 ? b : c));

const abs = operation((a) => Math.abs(a))

const add = operation((a, b) => a + b);

const subtract = operation((a, b) => a - b);

const multiply = operation((a, b) => a * b);

const divide = operation((a ,b) => a / b);

const negate = operation((a) => -a);

const cnst = currentValue => (x, y, z) => {
    return currentValue in ALL_CONST ? ALL_CONST[currentValue] : parseInt(currentValue);
};

const two = cnst(2);

const one = cnst(1);

const variable = currentVar => (x, y, z) => {
    return ALL_VAR[currentVar] === 0 ? x : (ALL_VAR[currentVar] === 1 ? y : z);
};
const parse = expression => {
    const operands = expression.split(" ").filter(currentStr => currentStr.length > 0);

    let stack = [];

    const COMMAND = {
        "+": add,
        "-": subtract,
        "*": multiply,
        "/": divide,
        "negate": negate,
        "abs": abs,
        "iff": iff
    }

    const COMMAND_ARGS_COUNTER = {
        "+": 2,
        "-": 2,
        "*": 2,
        "/": 2,
        "negate": 1,
        "abs": 1,
        "iff": 3
    }

    let stackOperation = (f, argsCounter) => {
        let args = []
        for (let i = argsCounter - 1; i >= 0; i--) {
            args[i] = stack.pop();
        }
        stack.push(f(...args))
    };

    operands.map(function (operand) {
        if (operand in COMMAND) {
            stackOperation(COMMAND[operand], COMMAND_ARGS_COUNTER[operand]);
        } else if (operand in ALL_VAR) {
            stack.push(variable(operand))
        } else {
            stack.push(cnst(operand))
        }
    })
    return stack.pop()
}