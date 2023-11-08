'use strict';
const bcrypt = require('bcryptjs')
const faker = require('faker')
const { BCRYPT_SALT_LENGTH, STUDENT_AMOUNT, TEACHER_AMOUNT, INTRODUCTION_LENGTH, NATION, TEACHER_ID_START } = require('../helpers/seeder-helpers')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const DEFAULT_PASSWORD = '12345678'
    const salt = bcrypt.genSaltSync(BCRYPT_SALT_LENGTH)

    await queryInterface.bulkInsert('Users', [{
      name: 'root',
      account: 'root',
      email: 'root@example.com',
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      aboutMe: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=100`,
      nation: NATION,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    ...Array.from({ length: STUDENT_AMOUNT }, (_, i) => ({
      name: `user${i + 1}`,
      account: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      aboutMe: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=${i + 1}`,
      nation: NATION,
      role: 'user', // student
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    // 每個使用者有至少 2 頁（10 篇）老師可以選擇
    ...Array.from({ length: TEACHER_AMOUNT }, (_, i) => ({
      name: `user${i + TEACHER_ID_START}`,
      account: `user${i + TEACHER_ID_START}`,
      email: `user${i + TEACHER_ID_START}@example.com`,
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      aboutMe: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=${i + 100}`,
      nation: NATION,
      role: 'teacher',
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    ])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {})
  }
};
