'use strict';

const faker = require('faker');
const { TEACHER_AMOUNT, INTRODUCTION_LENGTH, getAvailableDay, getAvailableTime, getMinuteDuration } = require('../helpers/seeder-helpers')

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const teachers = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE role='teacher';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('Classes', [
      ...Array.from({ length: TEACHER_AMOUNT }, (_, i) => ({
        teacherId: teachers[i].id,
        spendTime: getMinuteDuration(),
        introduction: faker.lorem.sentence(INTRODUCTION_LENGTH),
        teachingStyle: faker.lorem.sentence(INTRODUCTION_LENGTH),
        availableTime: getAvailableTime(i),
        availableDay: getAvailableDay(),
        classUrl: faker.internet.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    ])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Classes', {})
  }
}