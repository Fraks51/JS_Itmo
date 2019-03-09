let operation = f => (a, b) => x => {
    return f(a(x), b(x));
};

let add = operation((a, b) => a + b);
let subtract = operation((a, b) => a - b);
let multiply = operation((a, b) => a * b);
let divide = operation((a, b) => a / b);
let negate = operation((a, b) => -a);
let cnst = currentValue => x =>{
    return currentValue;
};
let variable = currentValue => x => {
    return x;
};
let expr = subtract(
    multiply(
        cnst(2),
        variable("x")
    ),
    cnst(3)
);
console.log(expr(5));