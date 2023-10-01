'use strict';

const faker = require('faker');
const { TEACHER_AMOUNT, CLASSNAME, INTRODUCTION_LENGTH } = require('../helpers/seeder-helpers')
const dayjs = require('dayjs')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    const teachers = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE role='teacher';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
   
    // 7 天, 開課時間 18:00 - 21:00 , 一堂課 30/60 分鐘    
    const getRandomDayOfWeek = () => Math.floor(Math.random() * 7);
    const getRandomEveningHour = () => Math.floor(Math.random() * 4) + 18;
    const getRandomMinuteDuration = () => (Math.random() < 0.5 ? 30 : 60);
    const usedTimeSlots = new Set();

    // 避免選課衝突
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
          className: faker.lorem.words(CLASSNAME),
          spendTime: minuteDuration,
          introduction: faker.lorem.sentence(INTRODUCTION_LENGTH),
          teachingStyle: faker.lorem.sentence(INTRODUCTION_LENGTH),
          classDetail: faker.lorem.sentence(INTRODUCTION_LENGTH),
          availableTime,
          classUrl: faker.internet.url(),
          createdAt: new Date(),
          updatedAt: new Date(),
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