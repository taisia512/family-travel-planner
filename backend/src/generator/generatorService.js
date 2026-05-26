const { faker } = require('@faker-js/faker');
const trips = require('../data/trips');

let intervalId = null;

const generateFakeTrip = () => {
  const start = faker.date.future();
  const end = new Date(start);
  end.setDate(start.getDate() + faker.number.int({ min: 3, max: 10 }));

  return {
    id: trips.length > 0 ? trips[trips.length - 1].id + 1 : 1,
    destination: faker.location.country(),
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    price: faker.number.int({ min: 200, max: 3000 })
  };
};

const startGenerator = (io) => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const newTrip = generateFakeTrip();
    trips.push(newTrip);

    console.log('Generated trip:', newTrip);

    // trimite către frontend
    io.emit('newTrip', newTrip);
  }, 5000); // la fiecare 5 secunde
};

const stopGenerator = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startGenerator,
  stopGenerator
};