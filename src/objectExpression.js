"use strict";

const All_VARIABLE = {"x": 1, "y": 2, "z": 3};

function Const(value) {
    this.value = value;
}

Const.prototype.evaluate = function (x, y, z) {
    return Number(this.value)
};

Const.prototype.diff = function (v) {
    return new Const(0);
};

Const.prototype.toString = function () {
    return this.value.toString()
};

Const.prototype.prefix = Const.prototype.toString;


let Variable = function (name) {
    this.name = name;
};

Variable.prototype.diff = function (v) {
    return (v === this.name ? new Const(1) : new Const(0))
};

Variable.prototype.evaluate = function (x, y, z) {
    return Number(this.name === "x" ? x : (this.name === "y" ? y : z));
};

Variable.prototype.toString = function (x, y, z) {
    return this.name.toString()
};

Variable.prototype.prefix = Variable.prototype.toString;

let AbstractClass = function() {};

AbstractClass.prototype.diff = function (v) {
    switch (this.args.length) {
        case 1: {
            return this._diff(this.args[0], this.args[0].diff(v))
        }
        case 2: {
            return this._diff(this.args[0], this.args[1], this.args[0].diff(v), this.args[1].diff(v))
        }
    }
};

AbstractClass.prototype.evaluate = function (x, y, z) {
    switch (this.args.length) {
        case 1: {
            return Number(this.operation(this.args[0].evaluate(x, y, z)))
        }
        case 2: {
            return Number(this.operation(this.args[0].evaluate(x, y, z), this.args[1].evaluate(x, y, z)))
        }
    }
};

AbstractClass.prototype.prefix = function() {
    return "(" +  this.symbol + " " + this.args.map(function (value) { return value.prefix() }).join(" ") + ")";
}

AbstractClass.prototype.toString = function () {
    let str = "";
    this.args.map(function (arg) {
        str += arg.toString() + " ";
    });
    return str + this.symbol;
};

let Add = function (...elements) {
    this.operation = (...args) => args[0] + args[1];
    this._diff = (...args) => new Add(args[2], args[3]);
    this.args = elements;
    this.symbol = "+"
};

Add.prototype = Object.create(AbstractClass.prototype);

let Multiply = function (...elements) {
    this.operation = (...args) => args[0] * args[1];
    this._diff = (...args) => new Add(new Multiply(args[2], args[1]), new Multiply(args[0], args[3]));
    this.args = elements;
    this.symbol = '*'
};

Multiply.prototype = Object.create(AbstractClass.prototype);

let ArcTan = function (...elements) {
    this.operation = (...args) => Math.atan(args[0]);
    this._diff = (...args) => new Divide(args[1], new Add(new Multiply(args[0], args[0]), new Const(1)));
    this.args = elements;
    this.symbol = 'atan'
};

ArcTan.prototype = Object.create(AbstractClass.prototype);

let ArcTan2 = function (...elements) {
    this.operation  = (...args) => Math.atan2(args[0], args[1]);
    this._diff = (...args) => new Divide(new Subtract(new Multiply(args[2], args[1]), new Multiply(args[0],
        args[3])), new Add(new Multiply(args[0], args[0]), new Multiply(args[1], args[1])));
    this.args = elements;
    this.symbol = "atan2";
};

ArcTan2.prototype = Object.create(AbstractClass.prototype);

let Negate = function (...elements) {
    this.operation = (...args) => -args[0];
    this._diff = (...args) => new Negate(args[1])
    this.args = elements;
    this.symbol = "negate"
};

Negate.prototype = Object.create(AbstractClass.prototype);

let Divide = function (...elements) {
    this.operation = (...args) => args[0] / args[1];
    this._diff = (...args) => new Divide(new Subtract(new Multiply(args[2], args[1]),
        new Multiply(args[0], args[3])), new Multiply(args[1], args[1]));
    this.args = elements;
    this.symbol = "/"
};

Divide.prototype = Object.create(AbstractClass.prototype);

const Sumexp = function (...elements) {
    this.operation = (...args) => {
        let sumExp = 0;
        args.map(function (exp) {
            sumExp += Math.pow(Math.E, exp);
        })
        return sumExp;
    }
    this.args = elements;
    this.symbol = "sumexp"
}

Sumexp.prototype = Object.create(AbstractClass.prototype);

const Softexp = function (...elements) {
    this.operation = (...args) => {
        let softexp = 0;
        args.slice(1).map( function (exp) {
            softexp += Math.pow(Math.E, exp);
        })
        return Math.pow(Math.E, args[0]) / softexp
    }
    this.args = elements;
    this.symbol = "sortexp"
}

let Subtract = function (...elements) {
    this.operation = (...args) => args[0] - args[1];
    this._diff = (...args) => new Subtract(args[2], args[3]);
    this.args = elements;
    this.symbol =  "-"
};

Subtract.prototype = Object.create(AbstractClass.prototype);

//todo exception field

function ParseError(message) {
    this.message = message;
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.name = "ParseError";
ParseError.prototype.constructor = ParseError;

//fixme

const COMMAND = {
    "+": Add,
    "-": Subtract,
    "*": Multiply,
    "/": Divide,
    "negate": Negate,
    "atan": ArcTan,
    "atan2": ArcTan2,
    "softexp": Softexp,
    "sumexp": Sumexp
};
const COMMAND_ARGS_COUNTER = {
    "+": 2,
    "-": 2,
    "*": 2,
    "/": 2,
    "negate": 1,
    "atan": 1,
    "atan2": 2,
    "softexp": Infinity,
    "sumexp": Infinity
};

const parse = expression => {
    const operands = expression.split(" ").filter(currentStr => currentStr.length > 0);
    let stack = [];
    let stackOperation = (f, argsCounter) => {
        let args = [];
        for (let i = argsCounter - 1; i >= 0; i--) {
            args[i] = stack.pop();
        }
        switch (argsCounter) {
            case 1: {
                stack.push(new f(args[0]));
                break
            }
            case 2: {
                stack.push(new f(args[0], args[1]));
                break
            }
        }
    };
    operands.map(function (operand) {
        if (operand in COMMAND) {
            stackOperation(COMMAND[operand], COMMAND_ARGS_COUNTER[operand]);
        } else if (operand in All_VARIABLE) {
            stack.push(new Variable(operand))
        } else {
            stack.push(new Const(operand))
        }
    });
    return stack.pop();
};

function parsePrefix(expression) {
    let balance = 0;
    let i = 0;
    let Answer;
    return body();
    //fixme copy paste / stats
    function body() {
        skipWhiteSpace();
        if (expression[i] === "(") {
            balance++;
            i++;
        }
        skipWhiteSpace();
        const start = i;
        if (('0123456789'.includes(expression[i])) || (expression[i] === "-" && '0123456789'.includes(expression[i + 1]))) {
            Answer = new Const(parseNum())
        } else if (expression[i] in All_VARIABLE) {
            Answer = new Variable(expression[i]);
            i++;
        } else {
            for (; expression[i] !== " " && expression[i] !== "(" && i < expression.length; i++) ;
            const operand = expression.substr(start, i - start);
            if (operand in COMMAND) {
                doOperation(COMMAND[operand], COMMAND_ARGS_COUNTER[operand]);
            } else {
                throw new ParseError("Unknown symbol(operation)")              //todo error
            }
        }
        skipWhiteSpace();
        if (expression[i] === ")") {
            balance--;
            i++;
        }
        skipWhiteSpace()
        if (balance !== 0) {
            throw new ParseError("No close brackets")
        }
        if (i !== expression.length) {
            throw new ParseError("Fix") // fixme
        }
        skipWhiteSpace();
        return Answer;
    }

    function getArg() {
        skipWhiteSpace();
        if (expression[i] === "(") {
            return parsePrefix(makeArg());
        }
        if (expression[i] in All_VARIABLE) {
            i++;
            return new Variable(expression[i - 1]);
        }
        if (!('-0123456789'.includes(expression[i]))) {
            throw new ParseError("No args for operation")
        }
        let num = parseNum();
        return new Const(num)
    }
    function doOperation(f, argsCounter) {                                  //fixme copy paste
        let args = [];
        if (argsCounter === Infinity) {
            for (let j = 0; expression[i] !== ")"; j++) {
                args[j] = getArg();
                skipWhiteSpace()
            }
        } else {
            for (let j = 0; j < argsCounter; j++) {
                args[j] = getArg();
            }
        }
        Answer = new f(...args);
    };                                                                         //fixme copy paste / end

    function parseNum() {
        let starti = i;
        i++;
        for (; '0123456789'.includes(expression[i]); i++);
        const number = Number(expression.substr(starti, i - starti));
        if (isNaN(number)) {
            throw new ParseError("Not a Number")
        }
        return number;
    }

    function makeArg() {
        let argBalance = 1;
        let stats_i = i;
        i++;
        while (argBalance !== 0) {
            if (i >= expression.length) {
                throw new ParseError("Have not a close bracket");
            }
            if (argBalance < 0) {
                throw new ParseError("Have not a open bracket")
            }
            if (expression[i] === ")") {
                argBalance--;
            }
            if (expression[i] === "(") {
                argBalance++;
            }
            i++
        }
        return expression.substr(stats_i, i - stats_i)
    }

    function skipWhiteSpace() {
        for (;expression[i] === " " && i < expression.length; i++);
    }
}

console.log(parsePrefix('(sumexp x)'));