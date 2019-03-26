"use strict";

const All_VARIABLE = {"x": 1, "y": 2, "z": 3}

function Const(value) {
    this.value = value;
}

Const.prototype.evaluate = function (x, y, z) {
    return Number(this.value)
}

Const.prototype.diff = function (v) {
    return new Const(0);
}

Const.prototype.toString = function () {
    return this.value.toString()
}


let Variable = function (name) {
    this.name = name;
}

Variable.prototype.diff = function (v) {
    return (v === this.name ? new Const(1) : new Const(0))
}

Variable.prototype.evaluate = function (x, y, z) {
    return Number(this.name === "x" ? x : (this.name === "y" ? y : z));
}

Variable.prototype.toString = function (x, y, z) {
    return this.name.toString()
}

let AbstractClass = function() {}

AbstractClass.prototype.diff = function (v) {
    switch (this.args.length) {
        case 1: {
            return this._diff(this.args[0], this.args[0].diff(v))
        }
        case 2: {
            return this._diff(this.args[0], this.args[1], this.args[0].diff(v), this.args[1].diff(v))
        }
    }
}

AbstractClass.prototype.evaluate = function (x, y, z) {
    switch (this.args.length) {
        case 1: {
            return Number(this.operation(this.args[0].evaluate(x, y, z)))
        }
        case 2: {
            return Number(this.operation(this.args[0].evaluate(x, y, z), this.args[1].evaluate(x, y, z)))
        }
    }
}

AbstractClass.prototype.toString = function () {
    let str = ""
    this.args.map(function (arg, i) {
        str += arg.toString() + " ";
    })
    return str + this.symbol;
}

let Add = function (...elements) {
    this.operation = (...args) => args[0] + args[1];
    this._diff = (...args) => new Add(args[2], args[3])
    this.args = elements;
    this.symbol = "+"
}

Add.prototype = Object.create(AbstractClass.prototype);

let Multiply = function (...elements) {
    this.operation = (...args) => args[0] * args[1];
    this._diff = (...args) => new Add(new Multiply(args[2], args[1]), new Multiply(args[0], args[3]))
    this.args = elements;
    this.symbol = '*'
}

Multiply.prototype = Object.create(AbstractClass.prototype);

let ArcTan = function (...elements) {
    this.operation = (...args) => Math.atan(args[0]);
    this._diff = (...args) => new Divide(args[1], new Add(new Multiply(args[0], args[0]), new Const(1)));
    this.args = elements;
    this.symbol = 'atan'
}

ArcTan.prototype = Object.create(AbstractClass.prototype);

let ArcTan2 = function (...elements) {
    this.operation  = (...args) => Math.atan2(args[0], args[1]);
    this._diff = (...args) => new Divide(new Subtract(new Multiply(args[2], args[1]), new Multiply(args[0],
        args[3])), new Add(new Multiply(args[0], args[0]), new Multiply(args[1], args[1])));
    this.args = elements;
    this.symbol = "atan2";
}

ArcTan2.prototype = Object.create(AbstractClass.prototype);

let Negate = function (...elements) {
    this.operation = (...args) => -args[0];
    this._diff = (...args) => new Negate(args[1])
    this.args = elements;
    this.symbol = "negate"
}

Negate.prototype = Object.create(AbstractClass.prototype);

let Divide = function (...elements) {
    this.operation = (...args) => args[0] / args[1];
    this._diff = (...args) => new Divide(new Subtract(new Multiply(args[2], args[1]),
        new Multiply(args[0], args[3])), new Multiply(args[1], args[1]));
    this.args = elements;
    this.symbol = "/"
}

Divide.prototype = Object.create(AbstractClass.prototype);

let Subtract = function (...elements) {
    this.operation = (...args) => args[0] - args[1];
    this._diff = (...args) => new Subtract(args[2], args[3])
    this.args = elements
    this.symbol =  "-"
}

Subtract.prototype = Object.create(AbstractClass.prototype);

const parse = expression => {
    const operands = expression.split(" ").filter(currentStr => currentStr.length > 0)
    let stack = [];
    const COMMAND = {
        "+": Add,
        "-": Subtract,
        "*": Multiply,
        "/": Divide,
        "negate": Negate,
        "atan": ArcTan,
        "atan2": ArcTan2
    }
    const COMMAND_ARGS_COUNTER = {
        "+": 2,
        "-": 2,
        "*": 2,
        "/": 2,
        "negate": 1,
        "atan": 1,
        "atan2": 2
    }
    let stackOperation = (f, argsCounter) => {
        let args = []
        for (let i = argsCounter - 1; i >= 0; i--) {
            args[i] = stack.pop();
        }
        switch (argsCounter) {
            case 1: {
                stack.push(new f(args[0]))
                break
            }
            case 2: {
                stack.push(new f(args[0], args[1]))
                break
            }
        }
    }
    operands.map(function (operand) {
        if (operand in COMMAND) {
            stackOperation(COMMAND[operand], COMMAND_ARGS_COUNTER[operand]);
        } else if (operand in All_VARIABLE) {
            stack.push(new Variable(operand))
        } else {
            stack.push(new Const(operand))
        }
    })
    return stack.pop();
}
