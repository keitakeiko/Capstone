const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)

module.exports = {
  today: dayjs(),
  tomorrow: dayjs().add(1, 'day'),
  nextSunday: dayjs().endOf('week').add(1, 'week').add(1, 'day'), // endOf 最後一天是禮拜六，加一天到禮拜天
  fifteenDaysLater: dayjs().add(15, 'day'),

  // 計算出學生可選擇的時段
  getPeriod: (availableDay, scheduledClasses_arr) => {
    const availablePeriod = {}

    // 兩周內課程所有時段( 不包含當日 )
    for (let i = 1; i <= 14; i++) {
      //  0 (Sunday) to 6 (Saturday)
      if (availableDay.includes(dayjs().add(i, 'day').day())) {
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

    return availablePeriod
  },

  // 學生預約課程的下拉式選單內容
  getAvailablePeriod: (spendTime, availablePeriod) => {
    const result_arr = []
    for (const date in availablePeriod) {
      availablePeriod[date].forEach((classTime, i) => {
        if (
          spendTime === 30 ||
          (spendTime === 60 &&
            dayjs(classTime, 'HH:mm').add(30, 'minute').format('HH:mm') === availablePeriod[date][i + 1]
          )
        ) {
          const endTime = dayjs(classTime, 'HH:mm').
            add(spendTime, 'minute')
            .format('HH:mm')
          result_arr.push(`${date} ${classTime} to ${endTime}`)
        }
      })
    }

    return result_arr
  },

  // 計算出特定選課時間
  getClassTime: (classTime, spendTime) => {
    const formattedClassTime = dayjs(classTime).format('YYYY-MM-DD HH:mm')
    const endTime = dayjs(classTime).add(spendTime, 'minute').format('HH:mm')
    return `${formattedClassTime} to ${endTime} `
  },

  // 計算末段時間是否可選 60 分鐘的課
  extraClassTime: availablePeriod => {
    for (const date in availablePeriod) {
      const validTime = []
      for (let i = 0; i < availablePeriod[date].length - 1; i++) { // 刪除最後 30 分鐘時段
        if (
          dayjs(availablePeriod[date][i], 'HH:mm')
            .add(30, 'minute')
            .format('HH:mm') == availablePeriod[date][i + 1]
        ) validTime.push(availablePeriod[date][i])
      }
      availablePeriod[date] = validTime
    }
    return availablePeriod
  }
}
