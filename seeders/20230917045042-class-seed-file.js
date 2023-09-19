'use strict';

const faker = require('faker');
const { TEACHER_AMOUNT } = require('../helpers/seeder-helpers')
const dayjs = require('dayjs')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    const teachers = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE role='teacher';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
   
    // 選擇七天中的一天（0表示星期日，1表示星期一，以此類推）
    const getRandomDayOfWeek = () => Math.floor(Math.random() * 7);
    const getRandomEveningHour = () => Math.floor(Math.random() * 5) + 18;
    const getRandomMinuteDuration = () => (Math.random() < 0.5 ? 30 : 60);
    const usedTimeSlots = new Set();

    const selectedClasses = [];

    for (let i = 0; i < TEACHER_AMOUNT; i++) {
      const whichDay = getRandomDayOfWeek();
      const eveningHour = getRandomEveningHour();
      const minuteDuration = getRandomMinuteDuration();

      const date = dayjs()
        .day(whichDay)
        .hour(eveningHour)
        .minute(minuteDuration)
        .second(0)
        .millisecond(0);

      const availableTime = date.format('YYYY-MM-DD HH:mm:ss');

      if (!usedTimeSlots.has(availableTime)) {
        selectedClasses.push({
          teacherId: teachers[i].id,
          className: faker.lorem.sentence(10),
          spendTime: minuteDuration,
          teachingStyle: faker.lorem.sentence(150),
          classDetail: faker.lorem.sentence(150),
          availableTime,
          classUrl: faker.internet.url(),
          created_at: new Date(),
          updated_at: new Date(),
        });
        usedTimeSlots.add(availableTime);
      } else {
        i--;
      }
    }


    await queryInterface.bulkInsert('Classes', selectedClasses)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Classes', { })
  }
}