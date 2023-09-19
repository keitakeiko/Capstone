const faker = require('faker')

module.exports = {

  BCRYPT_SALT_LENGTH : 10,
  STUDENT_AMOUNT : 5,
  TEACHER_AMOUNT : 10,
  INTRODUCTION_LENGTH : 150,
  LESSON_PER_STUDENT : 2, // 每個使用者有至少 2 個 Lesson History 可以打分
  TEACHER_PER_COMMENT : 2, // 每個老師有至少 2 個過往上課評價
  TEACHER_PER_NEWLESSON : 2, // 每個老師有至少 2 個 New Lesson
  NATION : faker.address.country(),
  SCORELIMIT: 5 // 滿分 5 分
}

