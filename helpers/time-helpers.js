const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)

module.exports = {
  today: dayjs(),

  getAvailablePeriod: (spendTime, enrollment_arr) => {
    const availablePeriod = {}

    // 兩周內課程所有時段( 不包含當日 )
    for (let i = 1; i <= 14; i++) {
      const allTimePeriod = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      const availableDate = dayjs().add(i, 'day').format('YYYY-MM-DD')
      availablePeriod[availableDate] = allTimePeriod
    }

    // 刪除被預約時段
    for (let i = 0; i < enrollment_arr.length; i++) {
      const reservedDate = dayjs(enrollment_arr[i].classTime).format('YYYY-MM-DD')
      const reservedTime = dayjs(enrollment_arr[i].spendTime).format('HH:mm')
      const duration = enrollment_arr[i].spendTime
      const index = availablePeriod[reservedDate].indexOf(reservedTime)

      availablePeriod[reservedDate].splice(index, duration == 30 ? 1 : 2)

      return availablePeriod
    }
  },

  // 計算末段時間是否可選 60 分鐘的課
  excludePeriod: availablePeriod => {
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
