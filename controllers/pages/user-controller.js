const bcrypt = require('bcryptjs')
const dayjs = require('dayjs')

const { Op, fn, col } = require('sequelize')
const { User, Class, Enrollment, sequelize } = require('../../models')
const { getAbbreviationCountry } = require('../../helpers/handlebars-helpers')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const {
	today,
	tomorrow,
	nextSunday,
	fifteenDaysLater,
	getAvailablePeriod,
	getClassTime
} = require('../../helpers/time-helpers')
const { getOffset, getPagination } = require('../../helpers/pagination-helper')

const { BCRYPT_SALT_LENGTH } = process.env // 取出 string

const userController = {

	getSignUpPage: (req, res, next) => {
		try {
			return res.render('signup')
		} catch (err) {
			return next(err)
		}
	},
	postSignUp: async (req, res, next) => {
		try {
			const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

			const {
				name,
				account,
				email,
				password,
				checkPassword,
				aboutMe,
				avatar,
				nation
			} = req.body

			const { file } = req // multer 照片上傳

			// 判斷註冊邏輯
			const errors = []
			const [userEmail, userAccount] = await Promise.all([
				User.findOne({ where: { email } }),
				User.findOne({ where: { account } })
			])

			if (userEmail) errors.push({ message: 'email 重複註冊' })
			if (userAccount) errors.push({ message: 'account 重複註冊' })

			if (!name || !account || !email || !password || !checkPassword || !nation || !aboutMe) errors.push({ message: '必填項目未完成' })
			if (name.length > 50) errors.push({ message: '暱稱不得超過50字' })
			if (password !== checkPassword) errors.push({ message: '兩次輸入密碼不符' })

			if (errors.length) {
				return res.render('signup', {
					errors,
					name,
					account,
					email,
					password,
					checkPassword,
					aboutMe,
					avatar,
					nation
				})
			}
			const salt = bcrypt.genSaltSync(Number(BCRYPT_SALT_LENGTH))

			const filePath = await imgurFileHandler(file) // multer 上傳的路徑

			await User.create({
				name,
				account,
				email,
				password: bcrypt.hashSync(password, salt),
				aboutMe,
				avatar: filePath || DEFAULT_AVATAR,
				nation
			})

			req.flash('success_message', '註冊成功')
			return res.redirect('/signin')
		} catch (err) {
			next(err)
		}
	},
	getSignInPage: (req, res, next) => {
		try {
			return res.render('signin')
		} catch (err) {
			return next(err)
		}
	},
	postSignIn: async (req, res, next) => {
		try {
			let role = req.user.role

			if (req.user.email === 'root@example.com') {
				req.flash('success_message', '成功登入')
				role = 'admin'
				return res.redirect('/admin')
			}

			// 每次使用者登入時先撈學習時數，並存放起來，比每次使用到時，都要從資料庫撈資料的效能好
			if (role == 'student') {
				const userId = req.user.id
				const studyHourData = await Enrollment.findAll({
					raw: true,
					nest: true,
					attributes: ['studentId', [fn('sum', col('spendTime')), 'studyHours']],
					where: {
						studentId: userId,
						classTime: {
							[Op.lt]: today.toDate()
						}
					}
				})
				const studyHours = Number(studyHourData[0]['studyHours'])
				const user = await User.findByPk(userId)
				await user.update({ studyHours })
			}
			return res.redirect('/')
		} catch (err) {
			return next(err)
		}
	},
	logout: async (req, res, next) => {
		req.logout(err => {
			if (err) req.flash('error_message', err)
		})
		req.flash('success_message', '成功登出')
		res.redirect('/signin')
	},
	getHomeTeachers: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user?.role
			const userId = req.user?.id || null

			// pagination
			const CLASS_LIMIT = 6
			const RANKING_LIMIT = 10
			const page = Number(req.query.page) || 1
			const offset = getOffset(CLASS_LIMIT, page)

			// search
			const { keyword } = req.query
			const where = keyword
				? { name: { [Op.like]: `%${keyword}%` }, role: 'teacher' }
				: { role: 'teacher' }

			const [totalTeacher, totalTimeByStudent] =
				await Promise.all([
					User.findAndCountAll({ // findAll 出來的是陣列
						nest: true,
						raw: true,
						attributes: ['id', 'name', 'avatar', 'nation', 'role', 'aboutMe'],
						where,
						include: {
							model: Class,
							attributes: ['id', 'teacherId', 'teachingStyle']
						},
						limit: CLASS_LIMIT,
						offset
					}),
					User.findAll({
						raw: true,
						nest: true,
						attributes: ['id', 'name', 'avatar', 'studyHours', 'createdAt'],
						order: [['studyHours', 'DESC']],
						limit: RANKING_LIMIT,
						where: { role: 'user' }
					})
				])

			// 賦值新屬性
			totalTimeByStudent.forEach((student, index) => (student.ranking = index + 1))

			return res.render('index', {
				totalTeacher: totalTeacher.rows,
				totalTimeByStudent,
				isSignIn, // 藉此判斷 header 登入或登出
				role,
				userId,
				keyword,
				pagination: getPagination(CLASS_LIMIT, page, totalTeacher.count)
			})
		} catch (err) {
			return next(err)
		}
	},
	getUserEditPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const userId = req.params.id
			const user = await User.findByPk(userId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role']
			})
			if (!user) throw new Error("使用者不存在")

			res.render('users/userEditPage', { user, role, isSignIn })
		} catch (err) {
			return next(err)
		}
	},
	putUserPage: async (req, res, next) => {
		try {
			const { name, account, aboutMe, password, nation } = req.body
			const { file } = req
			const userId = req.params.id // params 拿下來的都會是字串

			if (Number(userId) !== req.user.id) {
				req.flash('error_messages', '不能更改他人檔案')
				res.redirect('/')
			}

			const [user, filePath] = await Promise.all([
				User.findByPk(userId),
				imgurFileHandler(file)
			])

			if (!user) throw new Error("使用者不存在")
			await user.update({
				name,
				account,
				aboutMe,
				password,
				avatar: filePath || user.image,
				nation
			})

			req.flash('success_message', '使用者資料編輯成功')
			res.redirect(`/users/${userId}`)
		} catch (err) {
			return next(err)
		}
	},
	// 學生看自己頁面
	getUserPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const userId = req.user.id

			const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

			const userInfo = await User.findByPk(userId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'nation', 'aboutMe', 'avatar'],

			})

			const historyInfo = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['id', 'studentId', 'classId', 'spendTime', 'score', 'studentComment'],
				include: {
					model: Class,
					attributes: ['id', 'teacherId'
					],
					include: { model: User, attributes: ['id', 'name', 'avatar'] } // teacher's info
				},
				where: {
					studentId: userId,
					classTime: {
						// 小於今天的歷史訊息
						[Op.lt]: dayjs().toDate()
					},
					// 沒評價或是沒給分的會顯示出來
					[Op.or]: {
						studentComment: { [Op.eq]: null },
						score: { [Op.eq]: null }
					}
				},
				limit: 4,
				order: [['classTime', 'DESC']]
			})


			const lessonInfo = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['studentId', 'classId'],
				include: [
					{
						model: Class,
						attributes: ['teacherId', 'classUrl', 'availableTime', 'availableDay'],
						include: [{ // teahcerInfo
							model: User,
							attributes: ['id', 'name', 'avatar']
						}],
					}
				],
				where: {
					studentId: userId,
					classTime: {
						// 大於今天的歷史訊息
						[Op.gt]: dayjs().toDate()
					}
				},
				limit: 2
			})


			if (!lessonInfo) throw new Error("使用者不存在")

			const allStudentRanking = await Enrollment.findAll({
				attributes: [
					'studentId',
					[sequelize.fn('sum', sequelize.col('spendTime')), 'totalTime']
				],
				group: 'studentId',
				order: [sequelize.literal('totalTime DESC')]
			})

			const currentStudentRank = allStudentRanking.findIndex(student => student.studentId === userId) + 1


			return res.render('users/userPage', {
				historyInfo,
				ranking: currentStudentRank,
				lessonInfo,
				userInfo,
				userId,
				role,
				isSignIn
			})

		} catch (err) {
			return next(err)
		}
	},
	// 老師看自己頁面
	getTeacherPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const userId = req.user.id
			const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

			const teacherInfo = await User.findByPk(userId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role'],
				include: [{
					model: Class,
					attributes: ['id', 'teacherId', 'teachingStyle']
				}]
			})

			if (!teacherInfo) throw new Error("查無資料")

			// 資料庫要有小於當下時間的歷史紀錄課程，不然會抓不到 pastCourses
			const pastCourses = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['id', 'classId', 'score', 'studentComment', 'studentId', 'classTime',
					[
						sequelize.literal(`(
              SELECT AVG(r.score)
              FROM Enrollments r
              JOIN Classes c
              ON r.classId = c.id
              WHERE c.teacherId = ${sequelize.escape(userId)}
              AND r.score IS NOT NULL)`),
						'avgRating'
					]],
				include: [{
					//studentInfo
					model: User, attributes: ['id', 'name']
				}],
				where: {
					classTime: {
						// 小於今天的歷史訊息
						[Op.lt]: dayjs().toDate()
					},
					// 已評價且給分的會顯示出來
					studentComment: { [Op.not]: null },
					score: { [Op.not]: null }
				},
				order: [['classTime', 'DESC']],
				limit: 2
			})

			const futureBookings = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['id', 'classId', 'classTime', 'studentId'],
				include: [
					{
						model: Class,
						attributes: ['id', 'classUrl'],
						where: { teacherId: userId }
					},
					{ model: User, attributes: ['id', 'name'] }
				],
				where: {
					classTime: {
						// 未來兩周
						[Op.between]: [dayjs().toDate(), dayjs().add(2, 'week').toDate()]
					}
				},
				order: [['classTime', 'ASC']]
			});


			const futureBookingInfo = futureBookings.map(booking => ({
				classTime: booking.classTime,
				classUrl: booking.Class.classUrl,
				studentName: booking.User.name
			}));


			return res.render('teachers/teacherPage', {
				name: teacherInfo.name,
				avatar: teacherInfo.avatar || DEFAULT_AVATAR,
				abbr: getAbbreviationCountry(teacherInfo.nation),
				nation: teacherInfo.nation,
				aboutMe: teacherInfo.aboutMe,
				teachingStyle: teacherInfo.Class.teachingStyle,
				score: Number(pastCourses[0].avgRating).toFixed(1),
				futureBookingInfo,
				pastCourses,
				role,
				isSignIn,
				id: teacherInfo.id
			})

		} catch (err) {
			return next(err)
		}
	},
	getTeacherEditPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const userId = req.user.id

			const teacherInfo = await User.findByPk(userId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role'],
				include: {
					model: Class,
					attributes: ['id', 'introduction', 'teachingStyle', 'spendTime', 'classUrl', 'availableDay']
				}
			})

			if (!teacherInfo) throw new Error("無此資料")

			return res.render('teachers/teacherEditPage', {
				id: teacherInfo.id,
				name: teacherInfo.name,
				nation: teacherInfo.nation,
				introduction: teacherInfo.Class.introduction,
				teachingStyle: teacherInfo.Class.teachingStyle,
				classUrl: teacherInfo.Class.classUrl,
				spendTime: teacherInfo.Class.spendTime,
				availableDay: teacherInfo.Class.availableDay,
				role,
				isSignIn
			})
		} catch (err) {
			next(err)
		}
	},
	putTeacherEditPage: async (req, res, next) => {
		try {
			const id = Number(req.params.id)
			const userId = req.user.id
			const { name, nation, introduction, teachingStyle, spendTime, classUrl, Mon, Tue, Wed, Thur, Fri, Sat, Sun } = req.body


			if (id !== userId) throw new Error("不可修改他人資料")

			let availableDay = ''
			if (Mon) availableDay += 'Mon,'
			if (Tue) availableDay += 'Tue,'
			if (Wed) availableDay += 'Wed,'
			if (Thur) availableDay += 'Thur,'
			if (Fri) availableDay += 'Fri,'
			if (Sat) availableDay += 'Sat,'
			if (Sun) availableDay += 'Sun,'


			const user = await User.findByPk(id)
			const classInfo = await Class.findOne({
				where: { teacherId: id }
			})

			await user.update({
				name,
				nation
			})

			await classInfo.update({
				introduction,
				teachingStyle,
				spendTime,
				classUrl,
				availableDay
			})

			return res.redirect('/')
		} catch (err) {
			next(err)
		}
	},
	getApplyTeacherPage: async (req, res, next) => {
		try {
			const userId = req.user.id
			const isSignIn = req.isAuthenticated()
			const role = req.user.role

			const user = await User.findByPk(userId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'nation', 'avatar', 'role'],
				include: {
					model: Class,
					attributes: ['id', 'introduction']
				}
			})

			return res.render('users/applyTeacher', {
				id: userId,
				name: user.name,
				nation: user.nation,
				introduction: user.Class.introduction,
				isSignIn,
				role
			})
		} catch (err) {
			next(err)
		}
	},
	postApplyTeacherPage: async (req, res, next) => {
		try {
			const userId = req.user.id
			const { introduction, teachingStyle, spendTime, classUrl, Mon, Tue, Wed, Thur, Fri, Sat, Sun } = req.body

			const role = 'teacher'

			if (!introduction || !teachingStyle || !spendTime || !classUrl) throw new Error("全部欄位皆為必填")

			const user = await User.findByPk(userId, {
				nest: true,
				attributes: ['id']
			})

			let availableDay = ''
			if (Mon === '') { availableDay += 'Mon,' }
			if (Tue === '') { availableDay += 'Tue,' }
			if (Wed === '') { availableDay += 'Wed,' }
			if (Thur === '') { availableDay += 'Thur,' }
			if (Fri === '') { availableDay += 'Fri,' }
			if (Sat === '') { availableDay += 'Sat,' }
			if (Sun === '') { availableDay += 'Sun,' }

			// if (Mon) week.Mon = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Tue) week.Tue = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Wed) week.Wed = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Thur) week.Thur = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Fri) week.Fri = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Sat) week.Sat = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
			// if (Sun) week.Sun = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']


			const classInfo = await Class.create({
				teacherId: user.id,
				introduction,
				teachingStyle,
				availableDay,
				spendTime,
				classUrl
			})

			await user.update({
				role: 'teacher'
			})

			return res.redirect('/')
		} catch (err) {
			next(err)
		}
	},
	// 學生看老師頁面
	getCheckTeacherPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const userId = req.user.id
			const teacherId = req.params.id

			const teacherInfo = await User.findByPk(teacherId, {
				raw: true,
				nest: true,
				attributes: ['id', 'name', 'nation', 'avatar', 'role'],
				include: [{
					model: Class,
					attributes: ['id', 'teacherId', 'teachingStyle', 'introduction', 'availableDay'],
					include: [
						{
							model: Enrollment,
							attributes: [
								[
									sequelize.literal(`(
                SELECT AVG(r.score)
                FROM Enrollments r
                JOIN Classes c
                ON r.classId = c.id
                WHERE c.teacherId = ${sequelize.escape(teacherId)}
                AND r.score IS NOT NULL)`),
									'avgRating'
								]
							]
						}
					]
				}]
			})

			if (!teacherInfo) throw new Error('使用者不存在')


			const course = await Class.findOne({
				raw: true,
				nest: true,
				where: {
					id: teacherInfo.Class.id
				},
				attributes: [
					'id',
					'teacherId',
					'spendTime',
					'availableDay'
				]
			})

			if (!course) throw new Error('查無此課程')


			const lessonHistory = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['id', 'studentComment', 'score'],
				where: {
					'$Class.teacherId$': teacherId,
					classTime: { [Op.lt]: today.toDate() },
					studentComment: { [Op.not]: null },
					score: { [Op.not]: null }
				},
				include: [{
					model: Class,
					attributes: ['id', 'teacherId']
				}],
				limit: 2,
				order: [['createdAt', 'DESC']]
			})


			const scheduledClasses_arr = await Enrollment.findAll({
				raw: true,
				nest: true,
				attributes: ['id', 'classTime', 'spendTime'],
				include: [{
					model: Class,
					attributes: ['id']
				}],
				where: {
					'$Class.id$': sequelize.col('classId'),
					classTime: {
						[Op.between]: [tomorrow.toDate(),
						fifteenDaysLater.toDate()]
					}
				}
			})


			const adjustClass = getAvailablePeriod(course, scheduledClasses_arr)


			// modal 彈跳視窗
			const { result, classTime, name, classUrl } = req.query
			const modalInfo = { result, classTime, name, classUrl }

			res.render('users/studentCheckTeacherPage', {
				teacherInfo,
				abbr: getAbbreviationCountry(teacherInfo.nation),
				score: Number(teacherInfo.Class.Enrollments.avgRating).toFixed(1),
				lessonHistory,
				availableDay: teacherInfo.Class.availableDay.split(','),
				adjustClass,
				classId: teacherInfo.Class.id,
				modalInfo,
				role,
				userId,
				isSignIn
			})
		} catch (err) {
			next(err)
		}
	},
	reserveClass: async (req, res, next) => {
		try {
			const studentId = req.user.id
			const { classId, classTime } = req.body
			console.log(classId)
			console.log(classTime)
			const classTimeInfo = classTime.slice(0, 16) // 2023-11-05 10:28 共 16 位
			let isSuccess = false

			const classes = await Class.findByPk(classId, {
				raw: true,
				nest: true,
				attributes: ['id', 'teacherId', 'classUrl', 'spendTime'],
				include: { model: User, attributes: ['id', 'name'] }
			})

			if (!classes) throw new Error('查無此課程')

			await Enrollment.create({
				studentId,
				classId,
				classTime: classTimeInfo,
				spendTime: classes.spendTime
			})

			isSuccess = true

			const query = isSuccess ? `result=預約成功!&classTime=${classTime}&name=${classes.User.name}&classUrl=${classes.classUrl}`
				: 'result=預約失敗'

			return res.redirect(`/teachers/${classes.teacherId}/checkTeacherPage?${query}`)
		} catch (err) {
			next(err)
		}
	},
	getCommentPage: async (req, res, next) => {
		try {
			const isSignIn = req.isAuthenticated()
			const role = req.user.role
			const enrollmentId = req.query.enrollmentId

			const record = await Enrollment.findByPk(enrollmentId, {
				raw: true,
				nest: true,
				attributes: ['id', 'classTime', 'spendTime'],
				include: {
					model: Class,
					attributes: ['id'],
					include: { model: User, attributes: ['id', 'name'] }
				}
			})

			if (!record) throw new Error('查無此上課紀錄111')


			record.time = getClassTime(record.classTime, record.spendTime)
			delete record.classTime
			delete record.spendTime

			return res.render('users/commentPage', {
				record,
				enrollmentId,
				isSignIn,
				role
			})
		} catch (err) {
			next(err)
		}
	},
	comment: async (req, res, next) => {
		try {
			const userId = req.user.id
			const enrollmentId = Number(req.query.enrollmentId)
			const { rating, studentComment } = req.body
			let isSuccess = false
			const adjustedRating = Number(rating)

			const record = await Enrollment.findByPk(enrollmentId)
			if (!record) throw new Error('查無此上課紀錄')

			await record.update({ score: adjustedRating, studentComment })
			isSuccess = true

			const query = isSuccess ? 'result=評分成功' : 'result=評分失敗'

			return res.redirect(`/users/${userId}/`)
		} catch (err) {
			next(err)
		}
	}
}

module.exports = userController