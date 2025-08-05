// Sample TypeScript code with proper type annotations
export function calculateSum(a: number, b: number): number {
    const result: number = a + b;
    console.log(`Result: ${result}`);
    return result;
}

// With error handling and proper types
export function divide(x: number, y: number): number {
    if (y === 0) {
        throw new Error("Division by zero is not allowed");
    }
    return x / y;
}

// Efficient loop with proper types
const numbersArray: number[] = [1, 2, 3, 4, 5];
for (const number of numbersArray) {
    console.log(number);
}

// Typed global variable with better encapsulation
export let globalCounter: number = 0;

export function incrementCounter(): void {
    globalCounter++;
}

export function getCounter(): number {
    return globalCounter;
}

// Consistent quotes and proper semicolons
const welcomeMessage: string = "Hello World";
const consistentMessage: string = "This is now consistent";

// Additional utility functions with proper types
function processArray<T>(items: T[], callback: (item: T) => void): void {
    items.forEach(callback);
}

function isValidNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

// Example usage to demonstrate the functions
console.log(calculateSum(5, 3));
console.log(divide(10, 2));
incrementCounter();
console.log(`Counter value: ${getCounter()}`);
console.log(welcomeMessage);
console.log(consistentMessage);

// Example of using the utility functions
processArray(numbersArray, (num) => console.log(`Processing: ${num}`));

const testValue: unknown = 42;
if (isValidNumber(testValue)) {
    console.log(`${testValue} is a valid number`);
}
