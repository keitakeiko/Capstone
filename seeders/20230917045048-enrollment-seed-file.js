'use strict';
const faker = require('faker');
const { SCORELIMIT, TEACHER_PER_COMMENT, TEACHER_PER_NEWLESSON, LESSON_PER_STUDENT, STUDENT_AMOUNT, TEACHER_AMOUNT, INTRODUCTION_LENGTH } = require('../helpers/seeder-helpers');

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

    // 每個使用者有至少 2 個 Lesson History 可以打分
    await queryInterface.bulkInsert('Enrollments',[
      ...Array.from({ length: STUDENT_AMOUNT * LESSON_PER_STUDENT }, (_, i) =>  ({
      studentId: students[Math.floor(i / LESSON_PER_STUDENT)].id,
      classId: classes[Math.floor(i / TEACHER_AMOUNT)].id,
      // score:'', // integer can't use string
      spendTime: classes[Math.floor(i / TEACHER_AMOUNT)].spendTime.toString(),
      studentComment: '',
      createdAt: new Date(),
      updatedAt: new Date()
      }))
      ,
      // 每個老師有至少 2 個 New Lesson
      ...Array.from({ length: TEACHER_PER_NEWLESSON * TEACHER_AMOUNT }, (_, i) => ({
      studentId: students[Math.floor(Math.random() * STUDENT_AMOUNT)].id,
      classId: classes[Math.floor(i / TEACHER_PER_NEWLESSON)].id,
      spendTime: classes[Math.floor(i / TEACHER_PER_NEWLESSON)].spendTime.toString(),
      studentComment: '',
      createdAt: new Date(),
      updatedAt: new Date()
      }))
      ,
      // 每個老師有至少 2 個過往上課評價
      ...Array.from({ length: TEACHER_PER_COMMENT * TEACHER_AMOUNT }, (_, i) => ({
      studentId: students[Math.floor(Math.random() * STUDENT_AMOUNT)].id,
      classId: classes[Math.floor(i / TEACHER_PER_COMMENT)].id,
      score: Math.floor(Math.random() * (SCORELIMIT * 10 + 1)) / 10,
      spendTime: classes[Math.floor(i / TEACHER_PER_COMMENT)].spendTime.toString(),
      studentComment: faker.lorem.sentence(INTRODUCTION_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date()
      }))
    ])
    },
  down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete('Enrollments', { })
    }
  }
