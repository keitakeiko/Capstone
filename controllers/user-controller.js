const bcrypt = require('bcryptjs')

const { User, Class, Enrollment, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')
const BCRYPT_SALT_LENGTH = 10

const userController = {
  getSignUPpage: (req, res) => {
    res.render('users/signup')
  },
  postSignUp: async (req, res) => {
    const DEFAULT_PASSWORD = '12345678'
    const salt = bcrypt.genSaltSync(BCRYPT_SALT_LENGTH)

    await queryInterface.bulkInsert('Users', [{
      name: 'root',
      account: 'root',
      email: 'root@example.com',
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      about_me: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=100`,
      nation: NATION,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    ...Array.from({ length: STUDENT_AMOUNT }, (_, i) => ({
      name: `user${ i + 1 }`,
      account: `user${ i + 1 }`,
      email: `user${ i + 1 }@example.com`,
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      about_me: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=${ i + 1 }`,
      nation: NATION,
      role: 'user', // student
      created_at: new Date(),
      updated_at: new Date()
    })),
    // 每個使用者有至少 2 頁（10 篇）老師可以選擇
    ...Array.from({ length: TEACHER_AMOUNT }, (_, i) => ({
      name: `user${ i + TEACHER_ID_START }`,
      account: `user${ i + TEACHER_ID_START }`,
      email: `user${ i + TEACHER_ID_START }@example.com`,
      password: bcrypt.hashSync(DEFAULT_PASSWORD, salt),
      about_me: faker.lorem.sentence(INTRODUCTION_LENGTH),
      avatar: `https://loremflickr.com/g/300/300/pomeranian,dog/?lock=${ i + 100 }`,
      nation: NATION,
      role: 'teacher',
      created_at: new Date(),
      updated_at: new Date()
    }))
  ])
  },
  getHomeTeachers: (req, res) => res.render('index'),
  getUserPage: (req, res) => {
    return res.render('users/userPage')
  },
  getTeacherPage: (req, res) => {
    const NATION = 'Thailand'
    const abbr = getAbbreviationCountry(NATION)
    return  res.render('users/userPage', {abbr: abbr})
  },
  getCheckTeacherPage: (req, res) => res.render('users/checkTeacherPage'),
  getUserEditPage: (req, res) => res.render('users/userEditPage'),

  getTeacherEditPage: (req, res) => {
    return res.render('users/checkTeacherPage')
  },
  getApplyTeacherPage: (req, res) => 
    res.render('users/applyTeacher'),
  getReserveClassPage: (req, res) => {
    return res.render('users/reserve-class')
  },
   getCommentPage: (req, res) => res.render('users/commentPage')
}

module.exports = {
  userController
}