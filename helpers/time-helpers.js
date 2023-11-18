const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)

module.exports = {
  today: dayjs(),
  tomorrow: dayjs().add(1, 'day'),
  nextSunday: dayjs().endOf('week').add(1, 'week').add(1, 'day'), // endOf 最後一天是禮拜六，加一天到禮拜天
  fifteenDaysLater: dayjs().add(15, 'day'),

  // 計算出學生可選擇的時段
  getAvailablePeriod: (classData, scheduledClasses_arr) => {
    const availablePeriod = {}

    // 兩周內課程所有時段( 不包含當日 )
    for (let i = 1; i <= 14; i++) {
      //  0 (Sunday) to 6 (Saturday)
      if (classData.availableDay.includes(dayjs().add(i, 'day').day())) {
        const allTimePeriod = [
          '18:00',
          '18:30',
          '19:00',
          '19:30',
          '20:00',
          '20:30'
        ]
        const availableDate = dayjs().add(i, 'day').format('YYYY-MM-DD')
        availablePeriod[availableDate] = allTimePeriod
      }
    }

    // 刪除被預約時段
    for (let i = 0; i < scheduledClasses_arr.length; i++) {
      const reservedDate = dayjs(scheduledClasses_arr[i].classTime).format(
        'YYYY-MM-DD'
      )

      // 去除老師改課程時間所導致的錯誤，一旦沒有相應日期，繼續跑下一個迴圈
      if (!availablePeriod.hasOwnProperty(reservedDate)) continue

      const reservedTime = dayjs(scheduledClasses_arr[i].classTime).format(
        'HH:mm'
      )

      const duration = scheduledClasses_arr[i].spendTime
      const index = availablePeriod[reservedDate].indexOf(reservedTime)

      availablePeriod[reservedDate].splice(index, duration == 30 ? 1 : 2)
    }

    const result_arr = []
    for (const date in availablePeriod) {
      availablePeriod[date].forEach((classTime, i) => {
        if (
          classData.spendTime === 30 ||
          (classData.spendTime === 60 &&
            dayjs(classTime, 'HH:mm').add(30, 'minute').format('HH:mm') === availablePeriod[date][i + 1]
          )
        ) {
          const endTime = dayjs(classTime, 'HH:mm').
            add(classData.spendTime, 'minute')
            .format('HH:mm')
          result_arr.push(`${date} ${classTime} to ${endTime}`)
        }
      })
    }

    return result_arr
  },


  // 計算出選課時間
  getClassTime: classData => {
    if (Array.isArray(classData)) {
      return classData.map(course => {
        const formattedClassTime = dayjs(course.dataValues.classTime).format(
          'YYYY-MM-DD HH:mm'
        )
        const endTime = dayjs(course.dataValues.classTime)
          .add(course.dataValues.spendTime, 'm')
          .format('HH:mm')

        course.dataValues.classTime = formattedClassTime + ' to ' + endTime
        return course.toJSON()
        // result: 2023-10-26 18:00 to 18:30
      })
    } else {
      const formattedClassTime = dayjs(classData.classTime).format(
        'YYYY-MM-DD HH:mm'
      )
      const endTime = dayjs(classData.classTime)
        .add(classData.spendTime, 'minute')
        .format('HH:mm')
      return `${formattedClassTime} to ${endTime}`
      // result: 2023-10-26 18:00 to 18:30
    }
  }
}
