'use strict';
const faker = require('faker');
const { SCORELIMIT, TEACHER_PER_COMMENT, TEACHER_PER_NEWLESSON, LESSON_PER_STUDENT, STUDENT_AMOUNT, TEACHER_AMOUNT } = require('../helpers/seeder-helpers');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const students = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE role='user';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const classes = await queryInterface.sequelize.query(
      "SELECT id, spendTime FROM Classes;",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    await queryInterface.bulkInsert('Enrollments',[
      ...Array.from({ length: STUDENT_AMOUNT * LESSON_PER_STUDENT }, (_, i) =>  ({
      studentId: students[Math.floor(i / LESSON_PER_STUDENT)].id,
      classId: classes[Math.floor(i / TEACHER_AMOUNT)].id,
      // score:'',
      spendTime:classes[Math.floor(i / TEACHER_AMOUNT)].spendTime,
      studentComment: '',
      created_at: new Date(),
      updated_at: new Date()
      }))
      ,
      ...Array.from({ length: TEACHER_PER_NEWLESSON * TEACHER_AMOUNT }, (_, i) => ({
      studentId: students[Math.floor(Math.random() * STUDENT_AMOUNT)].id,
      classId: classes[Math.floor(Math.random() * classes.length)].id,
      spendTime:classes[Math.floor(i / TEACHER_AMOUNT)].spendTime,
      studentComment: '',
      created_at: new Date(),
      updated_at: new Date()
      }))
      ,
      ...Array.from({ length: TEACHER_PER_COMMENT * TEACHER_AMOUNT }, (_, i) => ({
      studentId: students[Math.floor(Math.random() * STUDENT_AMOUNT)].id,
      classId: classes[Math.floor(Math.random() * classes.length)].id,
      score: Math.floor(Math.random() * (SCORELIMIT + 1)),
      spendTime:classes[Math.floor(i / TEACHER_AMOUNT)].spendTime,
      studentComment: faker.lorem.sentence(1),
      created_at: new Date(),
      updated_at: new Date()
      }))
    ])
    },
  down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete('Enrollments', { })
    }
  }
