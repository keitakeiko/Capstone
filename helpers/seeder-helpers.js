const faker = require('faker')
const dayjs = require('dayjs')

module.exports = {
  BCRYPT_SALT_LENGTH: 10,
  STUDENT_AMOUNT: 5,
  TEACHER_AMOUNT: 10,
  INTRODUCTION_LENGTH: 3,
  NATION: faker.address.country(),
  SCORELIMIT: 5, // 滿分 5 分
  LESSON_PER_STUDENT: 2, // 每個使用者有至少 2 個 Lesson History 可以打分
  TEACHER_PER_COMMENT: 2, // 每個老師有至少 2 個過往上課評價
  TEACHER_PER_NEWLESSON: 2, // 每個老師有至少 2 個 New Lesson
  TEACHER_ID_START: 100,

  getAvailableDay: () => {
    let result = ''
    for (let i = 0; i < 7; i++) {
      // 0: Sunday, 1: Monday ...
      if (Math.random() > 0.5) result += `${i},`
    }
    if (result === '') result = '0'

    return result.slice(0, -1)
  },

  getAvailableTime: (getDay, lastMonth = 0) => {
    return dayjs()
      .add(getDay, 'day')
      .subtract(lastMonth, 'month')
      .format('YYYY-MM-DD')
  },
  getMinuteDuration: () => (Math.random() < 0.5 ? 30 : 60)
}

