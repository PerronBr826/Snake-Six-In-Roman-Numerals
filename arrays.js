// Bryce Perron
// JS Arrays PRIMM
// 3/12/2026

const heroes = ["Batman", "Captain America", "Iron Man", "The Hulk", "Thor"];

console.log(heroes[0]); // This will be Batman
console.log(heroes[2]); // This will be Iron Man
console.log(heroes.at(-1)); // This will be Thor

// I noticed that heroes.at(-1) can be used to select elements from the end of the array.

heroes[1] = "Black Panther";
console.log(`The leader of the team is now ${heroes[1]}`);
console.log(`The full array is ${heroes}`);

// I noticed that captain america has been replaced by black panther.

heroes[3] = "Doctor Strange"
const backuphero = heroes.at(-1);
console.log(`The lead superhero is ${heroes[3]} and my backup superhero is ${backuphero}.`)

// The Multiverse Swap

heroes[0] = "ME"
heroes[4] = "Spider-Man 2"
console.log(`New mission: ${heroes[1]} will lead ${backuphero} and ${heroes.at(-1)} to their deaths while ${heroes[0]} and ${heroes[2]} celebrate.`);